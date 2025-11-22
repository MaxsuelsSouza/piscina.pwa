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
const BLOCKED_DATES_COLLECTION = 'blockedDates';

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
    throw error;
  }
}

/**
 * Busca todos os agendamentos
 * @param ownerId - Opcional. Se fornecido, filtra apenas agendamentos deste owner (segurança)
 * @param isAdmin - Se true, não aplica filtro de ownerId
 */
export async function getBookings(ownerId?: string, isAdmin: boolean = false): Promise<Booking[]> {
  try {
    let q;

    if (isAdmin) {
      // Admin pode ver todos os agendamentos sem filtro
      q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
    } else if (ownerId) {
      // Usuários normais devem filtrar por ownerId (SEGURANÇA)
      // NOTA: Removido orderBy para evitar necessidade de índice composto
      q = query(
        collection(db, BOOKINGS_COLLECTION),
        where('ownerId', '==', ownerId)
      );
    } else {
      // Sem ownerId e sem ser admin, retorna vazio
      return [];
    }

    const querySnapshot = await getDocs(q);

    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking);
    });

    // Ordena no client-side se não for admin
    if (!isAdmin) {
      bookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // desc
      });
    }

    return bookings;
  } catch (error) {
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
    throw error;
  }
}

/**
 * Escuta mudanças nos agendamentos em tempo real
 * @param callback - Função chamada quando há mudanças
 * @param ownerId - Opcional. Se fornecido, filtra apenas agendamentos deste owner (segurança)
 * @param isAdmin - Se true, não aplica filtro de ownerId
 */
export function onBookingsChange(
  callback: (bookings: Booking[]) => void,
  ownerId?: string,
  isAdmin: boolean = false
): () => void {
  let q;

  if (isAdmin) {
    // Admin pode ver todos os agendamentos sem filtro
    q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
  } else if (ownerId) {
    // Usuários normais devem filtrar por ownerId (SEGURANÇA)
    // NOTA: Removido orderBy para evitar necessidade de índice composto
    q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('ownerId', '==', ownerId)
    );
  } else {
    // Sem ownerId e sem ser admin, retorna listener vazio
    return () => {};
  }

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking);
    });

    // Ordena no client-side se não for admin
    if (!isAdmin) {
      bookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // desc
      });
    }

    callback(bookings);
  }, (error) => {
  });

  return unsubscribe;
}

/**
 * BLOCKED DATES
 */

/**
 * Busca todas as datas bloqueadas
 * @param ownerId - Opcional. Se fornecido, filtra bloqueios deste owner + bloqueios públicos (segurança)
 * @param isAdmin - Se true, não aplica filtro de ownerId
 */
export async function getBlockedDates(ownerId?: string, isAdmin: boolean = false): Promise<BlockedDate[]> {
  try {
    if (isAdmin) {
      // Admin pode ver todos os bloqueios
      const querySnapshot = await getDocs(collection(db, BLOCKED_DATES_COLLECTION));
      const blockedDates: BlockedDate[] = [];
      querySnapshot.forEach((doc) => {
        blockedDates.push({
          id: doc.id,
          ...doc.data(),
        } as BlockedDate);
      });
      return blockedDates;
    } else if (ownerId) {
      // Usuários normais veem apenas seus bloqueios
      // NOTA: Bloqueios públicos (sem ownerId) são visíveis através das regras do Firestore
      // mas não podemos fazer query por "campo inexistente", então retornamos apenas os do owner
      const ownerQuery = query(
        collection(db, BLOCKED_DATES_COLLECTION),
        where('ownerId', '==', ownerId)
      );
      const querySnapshot = await getDocs(ownerQuery);

      const blockedDates: BlockedDate[] = [];
      querySnapshot.forEach((doc) => {
        blockedDates.push({
          id: doc.id,
          ...doc.data(),
        } as BlockedDate);
      });

      return blockedDates;
    } else {
      // Sem ownerId e sem ser admin, retorna vazio
      return [];
    }
  } catch (error) {
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
    throw error;
  }
}

/**
 * Escuta mudanças nas datas bloqueadas em tempo real
 * @param callback - Função chamada quando há mudanças
 * @param ownerId - Opcional. Se fornecido, filtra bloqueios deste owner + públicos (segurança)
 * @param isAdmin - Se true, não aplica filtro de ownerId
 */
export function onBlockedDatesChange(
  callback: (blockedDates: BlockedDate[]) => void,
  ownerId?: string,
  isAdmin: boolean = false
): () => void {
  if (isAdmin) {
    // Admin pode ver todos os bloqueios
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
    });

    return unsubscribe;
  } else if (ownerId) {
    // Usuários normais veem apenas seus bloqueios
    // NOTA: Bloqueios públicos (sem ownerId) não podem ser consultados via query
    // apenas via regras de permissão individual
    const q = query(
      collection(db, BLOCKED_DATES_COLLECTION),
      where('ownerId', '==', ownerId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const blockedDates: BlockedDate[] = [];
      querySnapshot.forEach((doc) => {
        blockedDates.push({
          id: doc.id,
          ...doc.data(),
        } as BlockedDate);
      });

      callback(blockedDates);
    }, (error) => {
    });

    return unsubscribe;
  } else {
    // Sem ownerId e sem ser admin, retorna listener vazio
    return () => {};
  }
}
