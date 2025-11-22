import { NextRequest, NextResponse } from 'next/server';
import { getPayment } from '@/lib/mercadopago';
import { updateBookingPaymentStatus } from '@/lib/firebase/firestore/bookings.admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();


    // Validar tipo de notificação
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    // Buscar informações completas do pagamento
    const paymentId = Number(body.data.id);
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID de pagamento inválido' },
        { status: 400 }
      );
    }

    const payment = await getPayment(paymentId);

    // Se o pagamento foi aprovado, atualizar o booking
    if (payment.status === 'approved' && payment.external_reference) {
      try {
        await updateBookingPaymentStatus(payment.external_reference, {
          status: 'paid',
          paymentId: payment.id?.toString(),
          paidAt: new Date(),
          paymentMethod: 'pix',
          amount: payment.transaction_amount || 0,
        });

      } catch (error) {
        // Não retornar erro para o Mercado Pago, apenas logar
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Retornar 200 mesmo com erro para evitar reenvios desnecessários
    return NextResponse.json({ received: true, error: error.message });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint do Mercado Pago',
    status: 'active',
  });
}
