/**
 * Funções Admin do Firestore para gerenciar agendamentos (server-side)
 */

import { adminDb } from '../admin';

/**
 * Atualiza o status de pagamento de um agendamento (Admin SDK)
 */
export async function updateBookingPaymentStatus(
  bookingId: string,
  paymentData: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentId?: string;
    paidAt?: Date;
    paymentMethod?: 'pix' | 'credit_card' | 'debit_card';
    amount?: number;
  }
): Promise<void> {
  try {
    const db = adminDb();
    const bookingRef = db.collection('bookings').doc(bookingId);

    const updateData: any = {
      'payment.status': paymentData.status,
      'payment.paymentId': paymentData.paymentId,
      'payment.paidAt': paymentData.paidAt,
      'payment.method': paymentData.paymentMethod,
      'payment.amount': paymentData.amount,
    };

    // Se o pagamento foi aprovado, confirmar o booking automaticamente
    if (paymentData.status === 'paid') {
      updateData.status = 'confirmed';
      updateData.expiresAt = null; // Remove expiração
    }

    await bookingRef.update(updateData);

    console.log(`✅ Payment status updated for booking ${bookingId}: ${paymentData.status}`);
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    throw error;
  }
}
