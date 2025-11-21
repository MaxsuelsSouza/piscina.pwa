import { NextRequest, NextResponse } from 'next/server';
import { getPayment } from '@/lib/mercadopago';
import { updateBookingPaymentStatus } from '@/lib/firebase/firestore/bookings.admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Webhook Mercado Pago recebido:', body);

    // Validar tipo de notificação
    if (body.type !== 'payment') {
      console.log('Tipo de notificação ignorado:', body.type);
      return NextResponse.json({ received: true });
    }

    // Buscar informações completas do pagamento
    const paymentId = Number(body.data.id);
    if (!paymentId) {
      console.error('ID de pagamento inválido:', body.data.id);
      return NextResponse.json(
        { error: 'ID de pagamento inválido' },
        { status: 400 }
      );
    }

    const payment = await getPayment(paymentId);

    console.log('Status do pagamento:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    });

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

        console.log(
          'Booking atualizado com sucesso:',
          payment.external_reference
        );
      } catch (error) {
        console.error('Erro ao atualizar booking:', error);
        // Não retornar erro para o Mercado Pago, apenas logar
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
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
