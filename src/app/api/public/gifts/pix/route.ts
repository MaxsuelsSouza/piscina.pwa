/**
 * API Route para gerar QR Code PIX para presente via Mercado Pago
 * POST /api/public/gifts/pix
 *
 * Usa a API do Mercado Pago para criar pagamentos PIX com confirmação automática
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPixPayment, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { generatePix } from '@/lib/pix/generator';
import { PIX_CONFIG } from '@/app/lista-casamento/_config/pix';
import { adminDb } from '@/lib/firebase/admin';

interface PixGiftRequest {
  giftName: string;
  giftId: string;
  amount: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PixGiftRequest = await request.json();
    const { giftName, giftId, amount, clientName, clientPhone, clientEmail } = body;

    if (!giftName || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'giftName e amount são obrigatórios' },
        { status: 400 }
      );
    }

    // Se Mercado Pago está configurado, usa ele para verificação automática
    if (isMercadoPagoConfigured()) {
      try {
        // Email para o pagamento (usa um email genérico se não fornecido)
        const payerEmail = clientEmail || `${clientPhone.replace(/\D/g, '')}@pix.presente.com`;

        // Referência externa para identificar o pagamento
        const externalReference = `GIFT_${giftId}_${Date.now()}`;

        const payment = await createPixPayment({
          amount,
          email: payerEmail,
          description: `Presente: ${giftName.substring(0, 50)}`,
          firstName: clientName.split(' ')[0] || 'Convidado',
          lastName: clientName.split(' ').slice(1).join(' ') || '',
          externalReference,
        });

        // Salva o registro de pagamento no Firestore
        const db = adminDb();
        await db.collection('giftPayments').add({
          giftId,
          giftName,
          clientPhone: clientPhone.replace(/\D/g, ''),
          clientName,
          amount,
          paymentId: payment.id,
          externalReference,
          status: payment.status,
          createdAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          pixPayload: payment.qr_code,
          qrCodeBase64: payment.qr_code_base64,
          status: payment.status,
          externalReference,
          amount,
          giftName,
          useMercadoPago: true,
        });
      } catch (mpError: any) {
        console.error('Erro no Mercado Pago, usando PIX estático:', mpError);
        // Fallback para PIX estático se Mercado Pago falhar
      }
    }

    // Fallback: PIX estático (sem verificação automática)
    const transactionId = `GIFT${giftId.slice(-6).toUpperCase()}`;

    const { pixPayload, qrCodeBase64 } = await generatePix({
      pixKey: PIX_CONFIG.pixKey,
      pixKeyType: PIX_CONFIG.pixKeyType,
      merchantName: PIX_CONFIG.merchantName,
      merchantCity: PIX_CONFIG.merchantCity,
      amount,
      transactionId,
      description: giftName.substring(0, 25),
    });

    return NextResponse.json({
      success: true,
      pixPayload,
      qrCodeBase64,
      transactionId,
      amount,
      giftName,
      useMercadoPago: false,
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PIX', details: String(error) },
      { status: 500 }
    );
  }
}
