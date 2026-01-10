/**
 * API Route para barbeiro gerenciar seus agendamentos
 * Apenas barbeiros autenticados podem acessar
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserByUid } from '@/lib/firebase/firestore/users.admin';
import { getBookingsByBarberId, getBookingsByBarberIdAndDateRange } from '@/lib/firebase/firestore/bookings.admin';

/**
 * GET - Busca agendamentos do barbeiro logado
 * Query params opcionais: startDate, endDate (formato YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Busca o barbeiro
    const barber = await getUserByUid(decodedToken.uid);
    if (!barber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se é barbeiro
    if (barber.role !== 'barber') {
      return NextResponse.json(
        { error: 'Usuário não é um barbeiro' },
        { status: 403 }
      );
    }

    // Pega query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let bookings;
    if (startDate && endDate) {
      // Busca com filtro de data
      bookings = await getBookingsByBarberIdAndDateRange(decodedToken.uid, startDate, endDate);
    } else {
      // Busca todos
      bookings = await getBookingsByBarberId(decodedToken.uid);
    }

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar agendamentos. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
