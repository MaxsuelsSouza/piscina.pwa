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
import { generatePixQRCode } from '@/lib/pix';

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

    // Criar pagamento PIX usando os dados bancários do perfil do admin
    let pixPayment = null;

    try {
      // Verifica se o admin configurou dados bancários
      if (!client.venueInfo?.bankingInfo?.pixKey) {
        throw new Error('Chave PIX não configurada no perfil do estabelecimento');
      }

      if (!client.venueInfo?.bankingInfo?.pixKeyType) {
        throw new Error('Tipo de chave PIX não configurado');
      }

      if (!client.venueInfo?.bankingInfo?.accountHolder) {
        throw new Error('Nome do titular não configurado');
      }

      // Usa o valor do condomínio cadastrado no perfil, ou valor padrão
      const amount = client.venueInfo?.condominiumPrice || 0.01;

      const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(
        'pt-BR'
      );
      const businessName =
        client.businessName || client.displayName || 'Estabelecimento';

      // Gera QR Code PIX usando os dados do perfil
      pixPayment = await generatePixQRCode({
        pixKey: client.venueInfo.bankingInfo.pixKey,
        pixKeyType: client.venueInfo.bankingInfo.pixKeyType,
        accountHolder: client.venueInfo.bankingInfo.accountHolder,
        amount: amount,
        description: `Agendamento ${businessName} - ${formattedDate}`,
        city: client.location?.city || 'Recife',
        transactionId: docRef.id, // ID do booking como identificador
      });

      // Atualiza o booking com informações de pagamento
      await docRef.update({
        'payment.status': 'pending',
        'payment.method': 'pix',
        'payment.amount': amount,
        'payment.pixQrCode': pixPayment.qrCodeBase64,
        'payment.pixQrCodeText': pixPayment.qrCode,
        'payment.pixKey': client.venueInfo.bankingInfo.pixKey,
        'payment.accountHolder': client.venueInfo.bankingInfo.accountHolder,
      });

      console.log('✅ Booking criado com sucesso:', {
        bookingId: docRef.id,
        amount: amount,
        pixKey: client.venueInfo.bankingInfo.pixKey,
        paymentStatus: 'pending',
        bookingStatus: 'pending'
      });
    } catch (paymentError: any) {
      console.error('Erro ao criar pagamento PIX:', paymentError);
      // Não falha a criação do booking se o pagamento falhar
      // O booking ficará sem informações de pagamento
    }

    // Envia notificação push para os admins
    try {
      const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(
        'pt-BR'
      );
      const businessName =
        client.businessName || client.displayName || 'Estabelecimento';

      await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '🎉 Novo Agendamento!',
          body: `${sanitizedData.customerName} agendou para ${formattedDate} - ${businessName}`,
          data: {
            bookingId: docRef.id,
            date,
            customerName: sanitizedData.customerName,
            link: '/admin',
            tag: `booking-${docRef.id}`,
          },
          toAdmins: true,
        }),
      });

      console.log('Notificação enviada para admins sobre novo agendamento');
    } catch (notificationError) {
      // Não falha a criação do agendamento se a notificação falhar
      console.error('Erro ao enviar notificação:', notificationError);
    }

    return NextResponse.json({
      success: true,
      bookingId: docRef.id,
      message: 'Agendamento criado com sucesso',
      payment: pixPayment
        ? {
            qrCodeBase64: pixPayment.qrCodeBase64,
            qrCode: pixPayment.qrCode,
            amount: pixPayment.amount,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Erro ao criar agendamento público:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento. Tente novamente.' },
      { status: 500 }
    );
  }
}
