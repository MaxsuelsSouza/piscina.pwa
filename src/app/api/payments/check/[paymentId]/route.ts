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

    console.log('🔍 Verificando pagamento no Mercado Pago:', paymentId);

    // Busca o pagamento no Mercado Pago
    const payment = await getPayment(Number(paymentId));

    console.log('📊 Status do pagamento no MP:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    });

    // Se o pagamento foi aprovado e ainda não foi atualizado no Firebase
    if (payment.status === 'approved' && payment.external_reference) {
      console.log('💰 Pagamento aprovado! Atualizando booking...');

      try {
        await updateBookingPaymentStatus(payment.external_reference, {
          status: 'paid',
          paymentId: payment.id?.toString(),
          paidAt: new Date(),
          paymentMethod: 'pix',
          amount: payment.transaction_amount || 0,
        });

        console.log('✅ Booking atualizado com sucesso');

        return NextResponse.json({
          success: true,
          status: 'paid',
          bookingId: payment.external_reference,
          message: 'Pagamento confirmado!',
        });
      } catch (updateError) {
        console.error('❌ Erro ao atualizar booking:', updateError);
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
    console.error('❌ Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}
