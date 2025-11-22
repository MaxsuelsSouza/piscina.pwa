import { NextRequest, NextResponse } from 'next/server';
import { getPayment } from '@/lib/mercadopago';
import { updateBookingPaymentStatus } from '@/lib/firebase/firestore/bookings.admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID não fornecido' },
        { status: 400 }
      );
    }


    // Busca o pagamento no Mercado Pago
    const payment = await getPayment(Number(paymentId));

    // Se o pagamento foi aprovado e ainda não foi atualizado no Firebase
    if (payment.status === 'approved' && payment.external_reference) {

      try {
        await updateBookingPaymentStatus(payment.external_reference, {
          status: 'paid',
          paymentId: payment.id?.toString(),
          paidAt: new Date(),
          paymentMethod: 'pix',
          amount: payment.transaction_amount || 0,
        });


        return NextResponse.json({
          success: true,
          status: 'paid',
          bookingId: payment.external_reference,
          message: 'Pagamento confirmado!',
        });
      } catch (updateError) {
        throw updateError;
      }
    }

    // Retorna o status atual
    return NextResponse.json({
      success: true,
      status: payment.status,
      bookingId: payment.external_reference,
      message: `Status: ${payment.status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}
