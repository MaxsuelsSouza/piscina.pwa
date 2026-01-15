/**
 * API Route para administrador ver todos os convidados
 * GET /api/public/gifts/admin?phone=81994625990
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';

const ADMIN_PHONE = '81994625990';

interface GuestData {
  phone: string;
  name: string;
  presenceStatus: 'pending' | 'confirmed' | 'declined' | null;
  companions: number;
  gifts: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.replace(/\D/g, '');

    // Verify admin
    if (phone !== ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const db = adminDb();

    // Get all clients (excluding admin)
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

    // Get all gifts
    const giftsSnapshot = await db.collection('gifts').get();
    const gifts = giftsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Build guest data
    const guests: GuestData[] = clients.map((client: any) => {
      const presence = presenceMap.get(client.phone);
      const clientGifts = gifts
        .filter((g: any) => g.selectedBy === client.phone)
        .map((g: any) => ({
          id: g.id,
          name: g.name,
          category: g.category,
        }));

      return {
        phone: client.phone,
        name: client.fullName || client.name || 'Sem nome',
        presenceStatus: presence?.status || null,
        companions: presence?.companions || 0,
        gifts: clientGifts,
        createdAt: client.createdAt || '',
      };
    });

    // Sort by name
    guests.sort((a, b) => a.name.localeCompare(b.name));

    // Stats
    const stats = {
      total: guests.length,
      confirmed: guests.filter((g) => g.presenceStatus === 'confirmed').length,
      declined: guests.filter((g) => g.presenceStatus === 'declined').length,
      pending: guests.filter((g) => !g.presenceStatus || g.presenceStatus === 'pending').length,
      totalCompanions: guests.reduce((acc, g) => acc + (g.presenceStatus === 'confirmed' ? g.companions : 0), 0),
      totalAttending: guests.filter((g) => g.presenceStatus === 'confirmed').length +
        guests.reduce((acc, g) => acc + (g.presenceStatus === 'confirmed' ? g.companions : 0), 0),
      giftsSelected: gifts.filter((g: any) => g.isSelected).length,
      giftsTotal: gifts.length,
    };

    return NextResponse.json({ guests, stats });
  } catch (error) {
    console.error('Erro ao buscar dados admin:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Normaliza telefone (remove caracteres não numéricos)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * POST - Limpar dados inconsistentes de presentes
 * Ações disponíveis:
 * - cleanOrphanSelections: Remove seleções de telefones que não existem como clientes
 * - normalizePhones: Normaliza todos os telefones nos presentes
 * - clearAllSelections: Remove todas as seleções (usar com cuidado!)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, action } = body;

    const normalizedPhone = normalizePhone(phone || '');

    // Verify admin
    if (normalizedPhone !== ADMIN_PHONE) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const db = adminDb();

    if (action === 'cleanOrphanSelections') {
      // Get all clients
      const clientsSnapshot = await db.collection('clients').get();
      const validPhones = new Set(clientsSnapshot.docs.map((doc) => doc.id));

      // Get all gifts with selections
      const giftsSnapshot = await db.collection('gifts').where('isSelected', '==', true).get();

      let cleaned = 0;
      const batch = db.batch();

      for (const giftDoc of giftsSnapshot.docs) {
        const gift = giftDoc.data();
        const selectedBy = gift.selectedBy ? normalizePhone(gift.selectedBy) : null;

        // If selectedBy is not a valid client, clear the selection
        if (selectedBy && !validPhones.has(selectedBy)) {
          batch.update(giftDoc.ref, {
            isSelected: false,
            selectedBy: null,
            selectedAt: null,
            updatedAt: new Date().toISOString(),
          });
          cleaned++;
        }
      }

      // Also clean giftSelections collection
      const selectionsSnapshot = await db.collection('giftSelections').get();
      for (const selDoc of selectionsSnapshot.docs) {
        const sel = selDoc.data();
        const selPhone = sel.clientPhone ? normalizePhone(sel.clientPhone) : null;

        if (selPhone && !validPhones.has(selPhone)) {
          batch.delete(selDoc.ref);
        }
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        action: 'cleanOrphanSelections',
        cleaned,
        message: `${cleaned} seleções órfãs removidas`,
      });
    }

    if (action === 'normalizePhones') {
      // Normalize all selectedBy phones in gifts
      const giftsSnapshot = await db.collection('gifts').where('isSelected', '==', true).get();

      let normalized = 0;
      const batch = db.batch();

      for (const giftDoc of giftsSnapshot.docs) {
        const gift = giftDoc.data();
        if (gift.selectedBy) {
          const normalizedSelectedBy = normalizePhone(gift.selectedBy);
          if (normalizedSelectedBy !== gift.selectedBy) {
            batch.update(giftDoc.ref, {
              selectedBy: normalizedSelectedBy,
              updatedAt: new Date().toISOString(),
            });
            normalized++;
          }
        }
      }

      // Also normalize in giftSelections
      const selectionsSnapshot = await db.collection('giftSelections').get();
      for (const selDoc of selectionsSnapshot.docs) {
        const sel = selDoc.data();
        if (sel.clientPhone) {
          const normalizedClientPhone = normalizePhone(sel.clientPhone);
          if (normalizedClientPhone !== sel.clientPhone) {
            batch.update(selDoc.ref, {
              clientPhone: normalizedClientPhone,
            });
          }
        }
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        action: 'normalizePhones',
        normalized,
        message: `${normalized} telefones normalizados`,
      });
    }

    if (action === 'clearAllSelections') {
      // Clear all gift selections (use with caution!)
      const giftsSnapshot = await db.collection('gifts').where('isSelected', '==', true).get();

      let cleared = 0;
      const batch = db.batch();

      for (const giftDoc of giftsSnapshot.docs) {
        batch.update(giftDoc.ref, {
          isSelected: false,
          selectedBy: null,
          selectedAt: null,
          updatedAt: new Date().toISOString(),
        });
        cleared++;
      }

      // Also clear giftSelections collection
      const selectionsSnapshot = await db.collection('giftSelections').get();
      for (const selDoc of selectionsSnapshot.docs) {
        batch.delete(selDoc.ref);
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        action: 'clearAllSelections',
        cleared,
        message: `${cleared} seleções removidas`,
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida. Use: cleanOrphanSelections, normalizePhones ou clearAllSelections' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao executar ação admin:', error);
    return NextResponse.json(
      { error: 'Erro ao executar ação', details: String(error) },
      { status: 500 }
    );
  }
}
