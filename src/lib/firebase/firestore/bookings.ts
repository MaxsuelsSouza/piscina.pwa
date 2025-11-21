/**
 * Serviços do Firestore para gerenciar agendamentos
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config';
import type { Booking } from '@/app/(home)/_types/booking';

const BOOKINGS_COLLECTION = 'bookings';

/**
 * Cria um novo agendamento
 */
export async function createBooking(booking: Omit<Booking, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), booking);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
}

/**
 * Busca todos os agendamentos
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const querySnapshot = await getDocs(collection(db, BOOKINGS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
}

/**
 * Busca um agendamento por ID
 */
export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Booking;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    throw error;
  }
}

/**
 * Atualiza um agendamento
 */
export async function updateBooking(id: string, data: Partial<Booking>): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
}

/**
 * Confirma um agendamento
 */
export async function confirmBooking(id: string): Promise<void> {
  try {
    await updateBooking(id, {
      status: 'confirmed',
      expiresAt: undefined,
    });
  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    throw error;
  }
}

/**
 * Cancela um agendamento
 */
export async function cancelBooking(id: string): Promise<void> {
  try {
    await updateBooking(id, { status: 'cancelled' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    throw error;
  }
}

/**
 * Marca notificação de expiração como enviada
 */
export async function markExpirationNotificationSent(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, BOOKINGS_COLLECTION, id), {
      expirationNotificationSent: true,
    });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    throw error;
  }
}

/**
 * Deleta um agendamento
 */
export async function deleteBooking(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    throw error;
  }
}

/**
 * Busca agendamentos de um mês específico
 */
export async function getBookingsByMonth(month: number, year: number): Promise<Booking[]> {
  try {
    // Primeiro e último dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayStr = firstDay.toISOString().split('T')[0];
    const lastDayStr = lastDay.toISOString().split('T')[0];

    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('date', '>=', firstDayStr),
      where('date', '<=', lastDayStr),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];
  } catch (error) {
    console.error('Erro ao buscar agendamentos do mês:', error);
    throw error;
  }
}

/**
 * Escuta mudanças em tempo real nos agendamentos
 */
export function subscribeToBookings(callback: (bookings: Booking[]) => void): Unsubscribe {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
      const bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      callback(bookings);
    });
  } catch (error) {
    console.error('Erro ao escutar agendamentos:', error);
    throw error;
  }
}

/**
 * Atualiza o status de pagamento de um agendamento
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
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      'payment.status': paymentData.status,
      'payment.paymentId': paymentData.paymentId,
      'payment.paidAt': paymentData.paidAt,
      'payment.method': paymentData.paymentMethod,
      'payment.amount': paymentData.amount,
      // Se o pagamento foi aprovado, confirmar o booking automaticamente
      ...(paymentData.status === 'paid' && {
        status: 'confirmed',
        expiresAt: undefined,
      }),
    });
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    throw error;
  }
}
