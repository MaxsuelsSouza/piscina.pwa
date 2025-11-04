/**
 * Hook para gerenciar dados do painel administrativo
 */

import { useState, useEffect } from 'react';
import type { Booking, BlockedDate } from '@/app/(home)/_types/booking';

const STORAGE_KEY = 'piscina_bookings';
const BLOCKED_DATES_KEY = 'piscina_blocked_dates';

export function useAdminData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // Carrega agendamentos
  useEffect(() => {
    const loadBookings = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedBookings = JSON.parse(stored);
        setBookings(parsedBookings);
      }
    };

    loadBookings();
    const interval = setInterval(loadBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  // Carrega dias bloqueados
  useEffect(() => {
    const loadBlockedDates = () => {
      const stored = localStorage.getItem(BLOCKED_DATES_KEY);
      if (stored) {
        const parsedBlockedDates = JSON.parse(stored);
        setBlockedDates(parsedBlockedDates);
      }
    };

    loadBlockedDates();
  }, []);

  const updateBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookings));
  };

  const updateBlockedDates = (newBlockedDates: BlockedDate[]) => {
    setBlockedDates(newBlockedDates);
    localStorage.setItem(BLOCKED_DATES_KEY, JSON.stringify(newBlockedDates));
  };

  const confirmBooking = (id: string) => {
    const updatedBookings = bookings.map(b =>
      b.id === id ? { ...b, status: 'confirmed' as const, expiresAt: undefined } : b
    );
    updateBookings(updatedBookings);
  };

  const cancelBooking = (id: string) => {
    const updatedBookings = bookings.map(b =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );
    updateBookings(updatedBookings);
  };

  const blockDate = (date: string) => {
    const newBlockedDate: BlockedDate = {
      id: `blocked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      createdAt: new Date().toISOString(),
    };

    const updatedBlockedDates = [...blockedDates, newBlockedDate];
    updateBlockedDates(updatedBlockedDates);
  };

  const unblockDate = (date: string) => {
    const blocked = blockedDates.find(d => d.date === date);
    if (blocked) {
      const updatedBlockedDates = blockedDates.filter(d => d.id !== blocked.id);
      updateBlockedDates(updatedBlockedDates);
    }
  };

  const markExpirationNotificationSent = (id: string) => {
    const updatedBookings = bookings.map(b =>
      b.id === id ? { ...b, expirationNotificationSent: true } : b
    );
    updateBookings(updatedBookings);
  };

  return {
    bookings,
    blockedDates,
    confirmBooking,
    cancelBooking,
    blockDate,
    unblockDate,
    markExpirationNotificationSent,
  };
}
