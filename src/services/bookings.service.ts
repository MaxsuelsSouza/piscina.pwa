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
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNotes,
  sanitizeNumberOfPeople,
} from '@/lib/security/input-sanitizer';

const BOOKINGS_COLLECTION = 'bookings';
const BLOCKED_DATES_COLLECTION = 'blocked_dates';

/**
 * Cria um novo agendamento no Firestore
 * Com validação e sanitização de dados
 */
export async function createBooking(booking: Omit<Booking, 'id'>): Promise<string> {
  try {
    // Sanitiza todos os dados antes de salvar (proteção server-side)
    const sanitizedBooking = {
      ...booking,
      customerName: sanitizeName(booking.customerName),
      customerPhone: sanitizePhone(booking.customerPhone),
      customerEmail: sanitizeEmail(booking.customerEmail || ''),
      numberOfPeople: sanitizeNumberOfPeople(booking.numberOfPeople),
      notes: sanitizeNotes(booking.notes || ''),
      createdAt: booking.createdAt || new Date().toISOString(),
    };

    // Validações básicas
    if (!sanitizedBooking.customerName || sanitizedBooking.customerName.length < 3) {
      throw new Error('Nome inválido');
    }

    if (!sanitizedBooking.customerPhone) {
      throw new Error('Telefone inválido');
    }

    if (sanitizedBooking.numberOfPeople < 1 || sanitizedBooking.numberOfPeople > 100) {
      throw new Error('Número de pessoas inválido');
    }

    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), sanitizedBooking);
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

    callback(blockedDates);
  }, (error) => {
    console.error('❌ Erro ao escutar mudanças de datas bloqueadas:', error);
  });

  return unsubscribe;
}
