/**
 * Hook para gerenciar agendamentos de barbearia
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ServiceBooking } from '@/types/barbershop';

export function useBarbershopBookings(ownerId: string | undefined) {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'serviceBookings'),
      where('ownerId', '==', ownerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData: ServiceBooking[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          ...data,
        } as ServiceBooking);
      });

      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar agendamentos de barbearia:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ownerId]);

  const confirmBooking = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'serviceBookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      return false;
    }
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    try {
      const bookingRef = doc(db, 'serviceBookings', bookingId);
      const updateData: any = {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      };

      if (reason) {
        updateData.cancellationReason = reason;
      }

      await updateDoc(bookingRef, updateData);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return false;
    }
  };

  const completeBooking = async (bookingId: string) => {
    try {
      const bookingRef = doc(db, 'serviceBookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Erro ao completar agendamento:', error);
      return false;
    }
  };

  return {
    bookings,
    loading,
    confirmBooking,
    cancelBooking,
    completeBooking,
  };
}
