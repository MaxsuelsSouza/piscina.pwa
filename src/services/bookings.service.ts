/**
 * Serviço de Agendamentos com Firestore
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking, BlockedDate } from '@/app/(home)/_types/booking';

const BOOKINGS_COLLECTION = 'bookings';
const BLOCKED_DATES_COLLECTION = 'blocked_dates';

/**
 * Cria um novo agendamento no Firestore
 */
export async function createBooking(booking: Omit<Booking, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString(),
    });
    console.log('✅ Agendamento criado no Firestore:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    throw error;
  }
}

/**
 * Busca todos os agendamentos
 */
export async function getBookings(): Promise<Booking[]> {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking);
    });

    console.log(`📚 ${bookings.length} agendamentos carregados do Firestore`);
    return bookings;
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    return [];
  }
}

/**
 * Atualiza um agendamento
 */
export async function updateBooking(id: string, data: Partial<Booking>): Promise<void> {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
    await updateDoc(bookingRef, data);
    console.log('✅ Agendamento atualizado:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    throw error;
  }
}

/**
 * Confirma um agendamento
 */
export async function confirmBooking(id: string): Promise<void> {
  return updateBooking(id, { status: 'confirmed' });
}

/**
 * Cancela um agendamento
 */
export async function cancelBooking(id: string): Promise<void> {
  return updateBooking(id, { status: 'cancelled' });
}

/**
 * Marca notificação de expiração como enviada
 */
export async function markExpirationNotificationSent(id: string): Promise<void> {
  return updateBooking(id, { expirationNotificationSent: true });
}

/**
 * Deleta um agendamento
 */
export async function deleteBooking(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
    console.log('✅ Agendamento deletado:', id);
  } catch (error) {
    console.error('❌ Erro ao deletar agendamento:', error);
    throw error;
  }
}

/**
 * Escuta mudanças nos agendamentos em tempo real
 */
export function onBookingsChange(callback: (bookings: Booking[]) => void): () => void {
  const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking);
    });

    console.log('🔄 Agendamentos atualizados em tempo real:', bookings.length);
    callback(bookings);
  }, (error) => {
    console.error('❌ Erro ao escutar mudanças:', error);
  });

  return unsubscribe;
}

/**
 * BLOCKED DATES
 */

/**
 * Busca todas as datas bloqueadas
 */
export async function getBlockedDates(): Promise<BlockedDate[]> {
  try {
    const querySnapshot = await getDocs(collection(db, BLOCKED_DATES_COLLECTION));

    const blockedDates: BlockedDate[] = [];
    querySnapshot.forEach((doc) => {
      blockedDates.push({
        id: doc.id,
        ...doc.data(),
      } as BlockedDate);
    });

    console.log(`🚫 ${blockedDates.length} datas bloqueadas carregadas`);
    return blockedDates;
  } catch (error) {
    console.error('❌ Erro ao buscar datas bloqueadas:', error);
    return [];
  }
}

/**
 * Bloqueia uma data
 */
export async function blockDate(date: string, reason?: string): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BLOCKED_DATES_COLLECTION), {
      date,
      reason: reason || 'Bloqueado pelo administrador',
      blockedAt: new Date().toISOString(),
    });
    console.log('✅ Data bloqueada:', date);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao bloquear data:', error);
    throw error;
  }
}

/**
 * Desbloqueia uma data
 */
export async function unblockDate(date: string): Promise<void> {
  try {
    // Busca a data bloqueada
    const q = query(collection(db, BLOCKED_DATES_COLLECTION), where('date', '==', date));
    const querySnapshot = await getDocs(q);

    // Deleta todos os bloqueios para essa data
    const deletePromises: Promise<void>[] = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    console.log('✅ Data desbloqueada:', date);
  } catch (error) {
    console.error('❌ Erro ao desbloquear data:', error);
    throw error;
  }
}

/**
 * Escuta mudanças nas datas bloqueadas em tempo real
 */
export function onBlockedDatesChange(callback: (blockedDates: BlockedDate[]) => void): () => void {
  const unsubscribe = onSnapshot(collection(db, BLOCKED_DATES_COLLECTION), (querySnapshot) => {
    const blockedDates: BlockedDate[] = [];
    querySnapshot.forEach((doc) => {
      blockedDates.push({
        id: doc.id,
        ...doc.data(),
      } as BlockedDate);
    });

    console.log('🔄 Datas bloqueadas atualizadas:', blockedDates.length);
    callback(blockedDates);
  }, (error) => {
    console.error('❌ Erro ao escutar mudanças de datas bloqueadas:', error);
  });

  return unsubscribe;
}
