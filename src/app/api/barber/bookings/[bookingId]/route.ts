/**
 * API Route para barbeiro atualizar status de um agendamento
 * Apenas barbeiros autenticados podem atualizar seus próprios agendamentos
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getUserByUid } from '@/lib/firebase/firestore/users.admin';
import { updateBookingStatus } from '@/lib/firebase/firestore/bookings.admin';

interface RouteParams {
  params: {
    bookingId: string;
  };
}

/**
 * PATCH - Atualiza status de um agendamento
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { bookingId } = params;
    const { status } = await request.json();

    // Valida status
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Busca o agendamento para verificar se pertence ao barbeiro
    const db = adminDb();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    const bookingData = bookingSnap.data();

    // Verifica se o agendamento pertence ao barbeiro
    if (bookingData?.barberId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar este agendamento' },
        { status: 403 }
      );
    }

    // Atualiza o status
    await updateBookingStatus(bookingId, status);

    return NextResponse.json({
      success: true,
      message: 'Status do agendamento atualizado com sucesso',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao atualizar agendamento. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
