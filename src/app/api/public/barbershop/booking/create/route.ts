/**
 * API Route para criar agendamentos de serviço em barbearias (públic)
 * POST /api/public/barbershop/booking/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sanitizeName, sanitizePhone, sanitizeEmail, sanitizeNotes } from '@/lib/security/input-sanitizer';
import { calculateEndTime } from '@/app/agendamento/[slug]/_utils/timeSlots';
import { generatePix, type PixKeyType } from '@/lib/pix/generator';
import type { ServiceBooking, BookedService } from '@/types/barbershop';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      date,
      professionalId,
      services, // BookedService[]
      startTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    } = body;

    // Validações
    if (!slug || !date || !professionalId || !services || !Array.isArray(services) || services.length === 0 || !startTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Sanitiza inputs
    const sanitizedData = {
      customerName: sanitizeName(customerName),
      customerPhone: sanitizePhone(customerPhone),
      customerEmail: customerEmail ? sanitizeEmail(customerEmail) : undefined,
      notes: notes ? sanitizeNotes(notes) : undefined,
    };

    // Busca o usuário pelo slug usando Admin SDK
    const db = adminDb();
    const usersSnapshot = await db.collection('users')
      .where('publicSlug', '==', slug)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Estabelecimento não encontrado' },
        { status: 404 }
      );
    }

    const clientDoc = usersSnapshot.docs[0];
    const client = clientDoc.data();
    const ownerId = client.uid;

    // Verifica se é realmente uma barbearia
    if (client.venueType !== 'barbershop') {
      return NextResponse.json(
        { success: false, error: 'Este estabelecimento não é uma barbearia' },
        { status: 400 }
      );
    }

    // Calcula duração total e preço total
    const totalDuration = services.reduce((sum: number, s: BookedService) => sum + s.duration, 0);
    const totalPrice = services.reduce((sum: number, s: BookedService) => sum + s.price, 0);

    // Calcula horário de término
    const endTime = calculateEndTime(startTime, totalDuration);

    // Busca dados do profissional (para snapshot)
    const barbershopInfo = client.venueInfo?.barbershopInfo;
    const professional = barbershopInfo?.professionals?.find((p: any) => p.id === professionalId);

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se requer pagamento
    const requiresPayment = barbershopInfo?.requiresPayment || false;

    // Determina o status inicial
    const initialStatus = requiresPayment ? 'pending' : 'confirmed';

    // Cria o agendamento
    const serviceBooking: any = {
      ownerId,
      clientSlug: slug,
      professionalId,
      professionalName: professional.name,
      date,
      startTime,
      endTime,
      totalDuration,
      services: services.map((s: BookedService) => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        duration: s.duration,
        price: s.price,
      })),
      totalPrice,
      customerName: sanitizedData.customerName,
      customerPhone: sanitizedData.customerPhone,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Adiciona campos opcionais apenas se tiverem valor
    if (sanitizedData.customerEmail) {
      serviceBooking.customerEmail = sanitizedData.customerEmail;
    }
    if (sanitizedData.notes) {
      serviceBooking.notes = sanitizedData.notes;
    }

    // Gera PIX se pagamento for obrigatório
    let pixData = null;
    if (requiresPayment) {
      // Verifica se tem dados PIX cadastrados
      const pixKey = client.venueInfo?.bankingInfo?.pixKey;
      const pixKeyType = client.venueInfo?.bankingInfo?.pixKeyType as PixKeyType;
      const merchantName = client.venueInfo?.bankingInfo?.accountHolder || client.businessName || client.displayName;
      const merchantCity = client.location?.city || 'Cidade';

      if (!pixKey || !pixKeyType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Estabelecimento não possui dados PIX configurados. Entre em contato com o estabelecimento.'
          },
          { status: 400 }
        );
      }

      try {
        // Gera o PIX
        const pixResult = await generatePix({
          pixKey,
          pixKeyType,
          merchantName,
          merchantCity,
          amount: totalPrice,
          transactionId: `AG${Date.now()}`,
          description: `Agendamento ${professional.name}`,
        });

        // Adiciona dados do PIX ao agendamento
        serviceBooking.payment = {
          method: 'pix',
          status: 'pending',
          amount: totalPrice,
          pixQrCode: pixResult.pixPayload,
          pixQrCodeBase64: pixResult.qrCodeBase64,
        };

        pixData = {
          qrCode: pixResult.pixPayload,
          qrCodeBase64: pixResult.qrCodeBase64,
          amount: totalPrice,
        };
      } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        return NextResponse.json(
          { success: false, error: 'Erro ao gerar pagamento PIX' },
          { status: 500 }
        );
      }
    }

    const docRef = await db.collection('serviceBookings').add(serviceBooking);

    // Monta resposta baseada no tipo de confirmação
    if (requiresPayment && pixData) {
      return NextResponse.json({
        success: true,
        bookingId: docRef.id,
        requiresPayment: true,
        payment: pixData,
        businessName: client.businessName || client.displayName,
        ownerPhone: client.venueInfo?.phone,
        message: 'Agendamento criado! Complete o pagamento PIX para confirmar.',
      });
    } else {
      return NextResponse.json({
        success: true,
        bookingId: docRef.id,
        requiresPayment: false,
        businessName: client.businessName || client.displayName,
        ownerPhone: client.venueInfo?.phone,
        message: 'Agendamento confirmado com sucesso!',
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar agendamento de serviço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
