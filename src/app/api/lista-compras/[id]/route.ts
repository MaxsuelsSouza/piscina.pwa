/**
 * API Route para Lista de Compras específica
 * GET - Buscar lista por ID
 * PUT - Atualizar lista (nome, descrição, status)
 * DELETE - Excluir lista
 * PATCH - Gerenciar itens da lista
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET - Buscar lista por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = adminDb();
    const doc = await db.collection('listasCompras').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lista: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Erro ao buscar lista:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lista' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar lista
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, descricao, status } = body;

    const db = adminDb();
    const docRef = db.collection('listasCompras').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (nome !== undefined) updateData.nome = nome.trim();
    if (descricao !== undefined) updateData.descricao = descricao.trim();
    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();

    return NextResponse.json({
      success: true,
      lista: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error('Erro ao atualizar lista:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lista' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir lista
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = adminDb();
    const docRef = db.collection('listasCompras').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir lista:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir lista' },
      { status: 500 }
    );
  }
}

// PATCH - Gerenciar itens da lista
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, item, itemId } = body;

    const db = adminDb();
    const docRef = db.collection('listasCompras').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    const lista = doc.data();
    let itens = lista?.itens || [];
    const now = new Date().toISOString();

    switch (action) {
      case 'addItem': {
        if (!item?.nome?.trim()) {
          return NextResponse.json(
            { error: 'Nome do item é obrigatório' },
            { status: 400 }
          );
        }

        const novoItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nome: item.nome.trim(),
          quantidade: item.quantidade || 1,
          unidade: item.unidade || 'un',
          categoria: item.categoria || 'outros',
          comprado: false,
          preco: item.preco || null,
          observacao: item.observacao?.trim() || '',
          createdAt: now,
          updatedAt: now,
        };

        itens.push(novoItem);
        break;
      }

      case 'updateItem': {
        if (!itemId) {
          return NextResponse.json(
            { error: 'ID do item é obrigatório' },
            { status: 400 }
          );
        }

        const itemIndex = itens.findIndex((i: { id: string }) => i.id === itemId);
        if (itemIndex === -1) {
          return NextResponse.json(
            { error: 'Item não encontrado' },
            { status: 404 }
          );
        }

        itens[itemIndex] = {
          ...itens[itemIndex],
          ...item,
          updatedAt: now,
        };
        break;
      }

      case 'toggleItem': {
        if (!itemId) {
          return NextResponse.json(
            { error: 'ID do item é obrigatório' },
            { status: 400 }
          );
        }

        const toggleIndex = itens.findIndex((i: { id: string }) => i.id === itemId);
        if (toggleIndex === -1) {
          return NextResponse.json(
            { error: 'Item não encontrado' },
            { status: 404 }
          );
        }

        itens[toggleIndex].comprado = !itens[toggleIndex].comprado;
        itens[toggleIndex].updatedAt = now;
        break;
      }

      case 'deleteItem': {
        if (!itemId) {
          return NextResponse.json(
            { error: 'ID do item é obrigatório' },
            { status: 400 }
          );
        }

        itens = itens.filter((i: { id: string }) => i.id !== itemId);
        break;
      }

      case 'clearComprados': {
        itens = itens.filter((i: { comprado: boolean }) => !i.comprado);
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    await docRef.update({
      itens,
      updatedAt: now,
    });

    const updatedDoc = await docRef.get();

    return NextResponse.json({
      success: true,
      lista: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error('Erro ao gerenciar itens:', error);
    return NextResponse.json(
      { error: 'Erro ao gerenciar itens' },
      { status: 500 }
    );
  }
}
