/**
 * Tipos para página pública de agendamento de serviços (barbearia)
 */

import type { AppUser } from '@/types/user';
import type { Professional, Service, ServiceBooking } from '@/types/barbershop';

export type { AppUser, Professional, Service, ServiceBooking };

/**
 * Dados para criar um novo agendamento de serviço
 */
export interface CreateServiceBookingData {
  professionalId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  serviceIds: string[]; // IDs dos serviços selecionados
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

/**
 * Slot de horário disponível para agendamento
 */
export interface TimeSlot {
  time: string; // HH:mm
  isAvailable: boolean;
  professionalId: string;
}

/**
 * Disponibilidade de um profissional em um dia
 */
export interface ProfessionalAvailability {
  professional: Professional;
  slots: TimeSlot[];
}
