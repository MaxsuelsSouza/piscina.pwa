/**
 * Hook para gerenciar agendamentos de piscina
 */

import { useState, useEffect } from 'react';
import type { Booking } from '../_types/booking';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega agendamentos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pool-bookings');
      if (stored) {
        setBookings(JSON.parse(stored));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  // Salva agendamentos no localStorage
  const saveBookings = (newBookings: Booking[]) => {
    try {
      localStorage.setItem('pool-bookings', JSON.stringify(newBookings));
      setBookings(newBookings);
    } catch (error) {
    }
  };

  // Adiciona novo agendamento
  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    saveBookings([...bookings, newBooking]);
    return newBooking;
  };

  // Remove agendamento
  const removeBooking = (id: string) => {
    saveBookings(bookings.filter(b => b.id !== id));
  };

  // Atualiza status do agendamento
  const updateBookingStatus = (id: string, status: Booking['status']) => {
    saveBookings(
      bookings.map(b => b.id === id ? { ...b, status } : b)
    );
  };

  // Verifica se uma data/horário está disponível
  const isSlotAvailable = (date: string, timeSlot: Booking['timeSlot']) => {
    return !bookings.some(
      b => b.date === date &&
           b.timeSlot === timeSlot &&
           b.status !== 'cancelled'
    );
  };

  // Obtém agendamentos de uma data específica
  const getBookingsByDate = (date: string) => {
    return bookings.filter(b => b.date === date && b.status !== 'cancelled');
  };

  return {
    bookings,
    loading,
    addBooking,
    removeBooking,
    updateBookingStatus,
    isSlotAvailable,
    getBookingsByDate,
  };
}
