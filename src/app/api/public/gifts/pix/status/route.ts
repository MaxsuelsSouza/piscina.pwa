/**
 * API Route para verificar status de pagamento PIX de presente
 * GET /api/public/gifts/pix/status?paymentId=123
 *
 * Verifica o status do pagamento no Mercado Pago e atualiza o Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayment, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      );
    }

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado' },
        { status: 503 }
      );
    }

    // Busca o pagamento no Mercado Pago
    const payment = await getPayment(Number(paymentId));

    // Se o pagamento foi aprovado, atualiza o registro no Firestore
    if (payment.status === 'approved') {
      const db = adminDb();
      const paymentsRef = db.collection('giftPayments');
      const snapshot = await paymentsRef
        .where('paymentId', '==', Number(paymentId))
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const paymentData = doc.data();

        // Só atualiza se ainda não foi marcado como aprovado
        if (paymentData.status !== 'approved') {
          await doc.ref.update({
            status: 'approved',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: 'Pagamento confirmado!',
        paymentId: payment.id,
        amount: payment.transaction_amount,
        paidAt: payment.date_approved,
      });
    }

    // Pagamento pendente ou outro status
    return NextResponse.json({
      success: true,
      status: payment.status,
      statusDetail: payment.status_detail,
      message: getStatusMessage(payment.status as string),
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: 'Aguardando pagamento...',
    approved: 'Pagamento confirmado!',
    authorized: 'Pagamento autorizado',
    in_process: 'Processando pagamento...',
    in_mediation: 'Pagamento em mediação',
    rejected: 'Pagamento rejeitado',
    cancelled: 'Pagamento cancelado',
    refunded: 'Pagamento estornado',
    charged_back: 'Pagamento estornado',
  };

  return messages[status] || `Status: ${status}`;
}
