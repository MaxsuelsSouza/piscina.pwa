/**
 * API Route pública para criar agendamentos
 * IMPORTANTE: Esta rota valida server-side que o ownerId corresponde ao slug
 * Isso previne manipulação client-side do ownerId
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBySlug } from '@/lib/firebase/firestore/users.admin';
import { adminDb } from '@/lib/firebase/admin';
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNotes,
  sanitizeNumberOfPeople,
} from '@/lib/security/input-sanitizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slug,
      date,
      customerName,
      customerPhone,
      customerEmail,
      numberOfPeople,
      notes,
    } = body;

    // Validações básicas
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug do cliente não fornecido' },
        { status: 400 }
      );
    }

    if (!date || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // IMPORTANTE: Busca o cliente pelo slug SERVER-SIDE
    // Isso garante que não importa o que foi manipulado no client-side,
    // o ownerId será sempre o correto baseado no slug
    const client = await getUserBySlug(slug);

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se é um cliente ativo
    if (client.role !== 'client' || !client.isActive) {
      return NextResponse.json(
        { error: 'Cliente não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Sanitiza todos os dados
    const sanitizedData = {
      customerName: sanitizeName(customerName),
      customerPhone: sanitizePhone(customerPhone),
      customerEmail: sanitizeEmail(customerEmail || ''),
      numberOfPeople: sanitizeNumberOfPeople(numberOfPeople),
      notes: sanitizeNotes(notes || ''),
    };

    // Validações adicionais
    if (sanitizedData.customerName.length < 3) {
      return NextResponse.json(
        { error: 'Nome inválido (mínimo 3 caracteres)' },
        { status: 400 }
      );
    }

    if (sanitizedData.numberOfPeople < 1 || sanitizedData.numberOfPeople > 100) {
      return NextResponse.json(
        { error: 'Número de pessoas inválido (1-100)' },
        { status: 400 }
      );
    }

    // Cria o agendamento com o ownerId correto (obtido server-side)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora

    const bookingData = {
      date,
      customerName: sanitizedData.customerName,
      customerPhone: sanitizedData.customerPhone,
      customerEmail: sanitizedData.customerEmail,
      timeSlot: 'full-day',
      numberOfPeople: sanitizedData.numberOfPeople,
      status: 'pending',
      notes: sanitizedData.notes,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      expirationNotificationSent: false,
      // SEGURANÇA: ownerId é definido server-side baseado no slug
      // Não aceita ownerId do client-side!
      ownerId: client.uid,
      // Adiciona o slug para rastreamento
      clientSlug: slug,
    };

    // Salva no Firestore usando Firebase Admin
    const db = adminDb();
    const docRef = await db.collection('bookings').add(bookingData);

    return NextResponse.json({
      success: true,
      bookingId: docRef.id,
      message: 'Agendamento criado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao criar agendamento público:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento. Tente novamente.' },
      { status: 500 }
    );
  }
}
