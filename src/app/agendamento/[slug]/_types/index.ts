/**
 * Tipos para a página pública de agendamento
 */

import type { Booking, BlockedDate } from '@/app/(home)/_types/booking';
import type { VenueInfo, VenueLocation } from '@/types/user';

export type { Booking, BlockedDate };

/**
 * Informações do cliente público
 */
export interface ClientInfo {
  uid: string;
  displayName?: string;
  businessName?: string; // Nome do estabelecimento
  publicSlug?: string;
  phone?: string; // Telefone/WhatsApp do cliente
  venueInfo?: VenueInfo; // Informações do espaço (incluindo preço)
  location?: VenueLocation; // Localização
}

/**
 * Dados do formulário de agendamento público
 */
export interface PublicBookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  numberOfPeople: number;
  notes?: string;
}

/**
 * Estado da página de agendamento
 */
export interface BookingPageState {
  client: ClientInfo | null;
  loading: boolean;
  error: string | null;
  bookings: Booking[];
  blockedDates: BlockedDate[];
  currentDate: Date;
  selectedDate: string;
  showForm: boolean;
}
