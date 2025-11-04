/**
 * Funções de cálculo para o painel administrativo
 */

import type { Booking } from '@/app/(home)/_types/booking';
import type { AdminStats } from '../_types';

const PRICE_PER_DAY = 400;

export function calculateMonthlyStats(bookings: Booking[], currentDate: Date): AdminStats {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date + 'T00:00:00');
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });

  const totalBookings = monthlyBookings.length;

  const confirmedBookings = monthlyBookings.filter(b => b.status === 'confirmed').length;

  const pendingBookings = monthlyBookings.filter(b => {
    if (b.status !== 'pending') return false;
    if (b.expiresAt) {
      return new Date(b.expiresAt) > new Date();
    }
    return true;
  }).length;

  const monthlyRevenue = confirmedBookings * PRICE_PER_DAY;

  return {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    monthlyRevenue
  };
}
