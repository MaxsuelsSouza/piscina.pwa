/**
 * Tipos para sistema de agendamento de piscina
 */

export interface Booking {
  id: string;
  date: string; // formato: YYYY-MM-DD
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  timeSlot: TimeSlot;
  numberOfPeople: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  expiresAt?: string; // Flag temporário: se status=pending e expiresAt passou, libera o dia
  expirationNotificationSent?: boolean; // Controla se já enviou notificação de expiração
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'full-day';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface TimeSlotInfo {
  id: TimeSlot;
  label: string;
  time: string;
  price: number;
}

export interface BlockedDate {
  id: string;
  date: string; // formato: YYYY-MM-DD
  createdAt: string;
}
