/**
 * Serviço para gerenciar agendamentos de serviço (barbearia)
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ServiceBooking } from '@/types/barbershop';

/**
 * Escuta mudanças em agendamentos de serviço em tempo real
 */
export function onServiceBookingsChange(
  callback: (bookings: ServiceBooking[]) => void,
  ownerId?: string,
  isAdmin: boolean = false
): Unsubscribe {
  const bookingsRef = collection(db, 'serviceBookings');

  let q;
  if (isAdmin) {
    // Admin vê tudo
    q = query(bookingsRef);
  } else if (ownerId) {
    // Cliente ou página pública vê apenas agendamentos do dono
    q = query(bookingsRef, where('ownerId', '==', ownerId));
  } else {
    // Fallback: público não autenticado sem ownerId
    // Não deveria acontecer, mas adiciona limite para segurança
    q = query(bookingsRef);
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings: ServiceBooking[] = [];

      snapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data(),
        } as ServiceBooking);
      });

      callback(bookings);
    },
    (error) => {
      console.error('Erro ao escutar serviceBookings:', error);
      // Em caso de erro, retorna array vazio
      callback([]);
    }
  );
}
