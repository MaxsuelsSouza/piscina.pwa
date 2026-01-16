/**
 * API Route para gerenciar convidados (admin only)
 * GET /api/public/guests?phone=81994625990 - Lista todos os convidados
 * POST /api/public/guests - Cria um novo convidado (sem senha)
 * DELETE /api/public/guests - Remove um convidado
 * PUT /api/public/guests - Atualiza presença de um convidado
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const ADMIN_PHONE = '81994625990';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * GET - Lista todos os convidados
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = normalizePhone(searchParams.get('phone') || '');

    if (phone !== ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const db = adminDb();

    // Get all clients
    const clientsSnapshot = await db.collection('clients').get();
    const clients = clientsSnapshot.docs
      .map((doc) => ({
        phone: doc.id,
        ...doc.data(),
      }))
      .filter((client: any) => client.phone !== ADMIN_PHONE);

    // Get all presence confirmations
    const presenceSnapshot = await db.collection('presenceConfirmations').get();
    const presenceMap = new Map(
      presenceSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );

    // Build guest data
    const guests = clients.map((client: any) => {
      const presence = presenceMap.get(client.phone);

      return {
        phone: client.phone,
        fullName: client.fullName || client.name || 'Sem nome',
        hasPassword: !!client.passwordHash,
        presenceStatus: presence?.status || null,
        companions: presence?.companions || 0,
        companionNames: presence?.companionNames || [],
        createdAt: client.createdAt || '',
      };
    });

    // Sort by name
    guests.sort((a, b) => a.fullName.localeCompare(b.fullName));

    // Stats
    const stats = {
      total: guests.length,
      withPassword: guests.filter((g) => g.hasPassword).length,
      withoutPassword: guests.filter((g) => !g.hasPassword).length,
      confirmed: guests.filter((g) => g.presenceStatus === 'confirmed').length,
      declined: guests.filter((g) => g.presenceStatus === 'declined').length,
      pending: guests.filter((g) => !g.presenceStatus || g.presenceStatus === 'pending').length,
    };

    return NextResponse.json({ guests, stats });
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar convidados', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST - Cria um novo convidado (sem senha - precisará criar no primeiro acesso)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPhone, fullName, guestPhone } = body;

    const normalizedAdminPhone = normalizePhone(adminPhone || '');
    const normalizedGuestPhone = normalizePhone(guestPhone || '');

    if (normalizedAdminPhone !== ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    if (!fullName || !normalizedGuestPhone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const clientRef = db.collection('clients').doc(normalizedGuestPhone);

    // Check if already exists
    const existing = await clientRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: 'Já existe um convidado com este telefone' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create client without password (will need to create on first access)
    await clientRef.set({
      phone: normalizedGuestPhone,
      fullName: fullName.trim(),
      passwordHash: null, // No password yet
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Convidado "${fullName}" cadastrado com sucesso`,
      phone: normalizedGuestPhone,
    });
  } catch (error) {
    console.error('Erro ao criar convidado:', error);
    return NextResponse.json(
      { error: 'Erro ao criar convidado', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove um convidado
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPhone, guestPhone } = body;

    const normalizedAdminPhone = normalizePhone(adminPhone || '');
    const normalizedGuestPhone = normalizePhone(guestPhone || '');

    if (normalizedAdminPhone !== ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    if (!normalizedGuestPhone) {
      return NextResponse.json(
        { error: 'Telefone do convidado é obrigatório' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const batch = db.batch();

    // Delete client
    const clientRef = db.collection('clients').doc(normalizedGuestPhone);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    batch.delete(clientRef);

    // Delete presence confirmation if exists
    const presenceRef = db.collection('presenceConfirmations').doc(normalizedGuestPhone);
    const presenceDoc = await presenceRef.get();
    if (presenceDoc.exists) {
      batch.delete(presenceRef);
    }

    // Remove gift selections
    const giftsSnapshot = await db.collection('gifts').where('isSelected', '==', true).get();
    for (const giftDoc of giftsSnapshot.docs) {
      const gift = giftDoc.data();
      const selectedBy = Array.isArray(gift.selectedBy) ? gift.selectedBy : [];

      if (selectedBy.includes(normalizedGuestPhone)) {
        const newSelectedBy = selectedBy.filter((p: string) => p !== normalizedGuestPhone);
        batch.update(giftDoc.ref, {
          isSelected: newSelectedBy.length > 0,
          selectedBy: newSelectedBy,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Delete gift selections records
    const selectionsSnapshot = await db.collection('giftSelections')
      .where('clientPhone', '==', normalizedGuestPhone)
      .get();

    for (const selDoc of selectionsSnapshot.docs) {
      batch.delete(selDoc.ref);
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Convidado removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover convidado:', error);
    return NextResponse.json(
      { error: 'Erro ao remover convidado', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualiza presença de um convidado
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPhone, guestPhone, status, companions } = body;

    const normalizedAdminPhone = normalizePhone(adminPhone || '');
    const normalizedGuestPhone = normalizePhone(guestPhone || '');

    if (normalizedAdminPhone !== ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    if (!normalizedGuestPhone || !status) {
      return NextResponse.json(
        { error: 'Telefone e status são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['confirmed', 'declined', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: confirmed, declined ou pending' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const presenceRef = db.collection('presenceConfirmations').doc(normalizedGuestPhone);

    const now = new Date().toISOString();

    if (status === 'pending') {
      // Remove presence confirmation
      await presenceRef.delete();
    } else {
      // Set or update presence confirmation
      await presenceRef.set({
        phone: normalizedGuestPhone,
        status,
        companions: companions || 0,
        updatedAt: now,
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: `Presença atualizada para "${status}"`,
    });
  } catch (error) {
    console.error('Erro ao atualizar presença:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar presença', details: String(error) },
      { status: 500 }
    );
  }
}
