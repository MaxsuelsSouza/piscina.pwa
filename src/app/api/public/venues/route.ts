/**
 * API Route pública para listar todos os espaços de festa ativos
 */

import { NextResponse } from 'next/server';
import { getAllActiveClients } from '@/lib/firebase/firestore/users.admin';

export async function GET() {
  try {
    // Busca todos os clientes ativos
    const clients = await getAllActiveClients();

    // Retorna apenas informações públicas
    return NextResponse.json({
      success: true,
      venues: clients.map((client) => ({
        uid: client.uid,
        displayName: client.displayName,
        businessName: client.businessName,
        publicSlug: client.publicSlug,
        location: client.location,
        venueInfo: client.venueInfo,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar espaços' },
      { status: 500 }
    );
  }
}
