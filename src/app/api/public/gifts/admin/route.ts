/**
 * API Route para administrador ver todos os convidados
 * GET /api/public/gifts/admin?phone=81994625990
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

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
