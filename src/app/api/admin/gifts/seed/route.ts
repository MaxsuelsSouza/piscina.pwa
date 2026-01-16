/**
 * API Route para popular presentes usando Firebase Admin SDK (server-side)
 * POST /api/admin/gifts/seed
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { GIFTS_SEED_DATA } from '@/data/gifts-seed';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const db = adminDb();

    // Verifica se já existem presentes
    const giftsRef = db.collection('gifts');
    const existingGifts = await giftsRef.limit(1).get();

    if (!existingGifts.empty) {
      return NextResponse.json(
        { error: 'Presentes já existem na base de dados', code: 'ALREADY_EXISTS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const batch = db.batch();
    let count = 0;

    // Cria presentes em batch (máximo 500 por batch)
    for (const gift of GIFTS_SEED_DATA) {
      const docRef = giftsRef.doc();
      batch.set(docRef, {
        name: gift.name,
        category: gift.category,
        isSelected: false,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${count} presentes criados com sucesso`,
      count,
    });
  } catch (error) {
    console.error('Erro ao popular presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao popular presentes', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = adminDb();
    const giftsRef = db.collection('gifts');
    const snapshot = await giftsRef.count().get();
    const count = snapshot.data().count;

    return NextResponse.json({
      count,
      hasGifts: count > 0,
    });
  } catch (error) {
    console.error('Erro ao verificar presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar presentes', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remover um presente pelo nome
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name é obrigatório' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const giftsRef = db.collection('gifts');

    // Busca o presente pelo nome
    const snapshot = await giftsRef.where('name', '==', name).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: `Presente "${name}" não encontrado`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Remove todos os documentos encontrados (deveria ser só 1)
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Presente "${name}" removido com sucesso`,
      count: snapshot.size,
    });
  } catch (error) {
    console.error('Erro ao remover presente:', error);
    return NextResponse.json(
      { error: 'Erro ao remover presente', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT - Adicionar um presente específico (sem apagar os existentes)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, category, link } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'name e category são obrigatórios' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const giftsRef = db.collection('gifts');

    // Verifica se já existe um presente com esse nome
    const existing = await giftsRef.where('name', '==', name).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Já existe um presente com esse nome', code: 'ALREADY_EXISTS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const docRef = giftsRef.doc();

    const giftData: Record<string, unknown> = {
      name,
      category,
      isSelected: false,
      createdAt: now,
      updatedAt: now,
    };

    // Adiciona link se fornecido
    if (link && link.trim()) {
      giftData.link = link.trim();
    }

    await docRef.set(giftData);

    return NextResponse.json({
      success: true,
      message: `Presente "${name}" criado com sucesso`,
      id: docRef.id,
    });
  } catch (error) {
    console.error('Erro ao adicionar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar presente', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Editar um presente existente
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, link } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const giftRef = db.collection('gifts').doc(id);

    // Verifica se o presente existe
    const giftDoc = await giftRef.get();
    if (!giftDoc.exists) {
      return NextResponse.json(
        { error: 'Presente não encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Se está alterando o nome, verifica se já existe outro com esse nome
    if (name) {
      const existing = await db.collection('gifts')
        .where('name', '==', name)
        .limit(1)
        .get();

      if (!existing.empty && existing.docs[0].id !== id) {
        return NextResponse.json(
          { error: 'Já existe um presente com esse nome', code: 'ALREADY_EXISTS' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (name) updateData.name = name;
    if (category) updateData.category = category;

    // Link pode ser string vazia para remover
    if (link !== undefined) {
      if (link && link.trim()) {
        updateData.link = link.trim();
      } else {
        // Remove o campo link se for vazio
        updateData.link = null;
      }
    }

    await giftRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Presente atualizado com sucesso`,
      id,
    });
  } catch (error) {
    console.error('Erro ao editar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao editar presente', details: String(error) },
      { status: 500 }
    );
  }
}
