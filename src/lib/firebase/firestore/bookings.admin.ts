/**
 * Funções Admin do Firestore para gerenciar agendamentos (server-side)
 */

import { adminDb } from '../admin';
import type { Booking } from '@/app/(home)/_types/booking';

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

  } catch (error) {
    throw error;
  }
}

/**
 * Busca todos os agendamentos de um barbeiro (Admin SDK)
 */
export async function getBookingsByBarberId(barberId: string): Promise<Booking[]> {
  try {
    const db = adminDb();
    const bookingsRef = db.collection('bookings');
    const querySnapshot = await bookingsRef
      .where('barberId', '==', barberId)
      .orderBy('date', 'desc')
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Booking));
  } catch (error) {
    throw error;
  }
}

/**
 * Busca agendamentos de um barbeiro filtrados por data (Admin SDK)
 */
export async function getBookingsByBarberIdAndDateRange(
  barberId: string,
  startDate: string,
  endDate: string
): Promise<Booking[]> {
  try {
    const db = adminDb();
    const bookingsRef = db.collection('bookings');
    const querySnapshot = await bookingsRef
      .where('barberId', '==', barberId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Booking));
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza o status de um agendamento (Admin SDK)
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<void> {
  try {
    const db = adminDb();
    const bookingRef = db.collection('bookings').doc(bookingId);

    await bookingRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw error;
  }
}
