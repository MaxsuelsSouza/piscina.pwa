/**
 * API Route para buscar agendamentos do cliente público
 * Usa Firebase Admin para bypassar regras de segurança do Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone não fornecido' },
        { status: 400 }
      );
    }

    // Normaliza telefone (remove caracteres não numéricos)
    const normalizedPhone = phone.replace(/\D/g, '');

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido' },
        { status: 400 }
      );
    }

    // Busca agendamentos por customerPhone usando Firebase Admin
    const db = adminDb();
    const snapshot = await db
      .collection('bookings')
      .where('customerPhone', '==', normalizedPhone)
      .get();

    const bookings: any[] = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Ordena por data de criação (mais recentes primeiro)
    bookings.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos do cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    );
  }
}
