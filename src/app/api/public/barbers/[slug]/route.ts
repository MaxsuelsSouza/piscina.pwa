/**
 * API Route pública para listar barbeiros ativos de um estabelecimento
 * Usado no fluxo de agendamento público
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBySlug, getBarbersByOwnerId } from '@/lib/firebase/firestore/users.admin';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;

    // Busca o estabelecimento pelo slug
    const owner = await getUserBySlug(slug);

    if (!owner) {
      return NextResponse.json(
        { error: 'Estabelecimento não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se o estabelecimento está ativo
    if (!owner.isActive) {
      return NextResponse.json(
        { error: 'Estabelecimento inativo' },
        { status: 403 }
      );
    }

    // Busca barbeiros ativos do estabelecimento
    const allBarbers = await getBarbersByOwnerId(owner.uid);
    const activeBarbers = allBarbers.filter(barber => barber.isActive);

    // Retorna apenas os dados públicos
    const barbersData = activeBarbers.map((barber) => ({
      uid: barber.uid,
      displayName: barber.displayName,
      specialties: barber.specialties || [],
      photoURL: barber.photoURL,
      bio: barber.bio,
    }));

    return NextResponse.json({
      success: true,
      barbers: barbersData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar barbeiros',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
