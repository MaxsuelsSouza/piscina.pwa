/**
 * Serviços para criação de agendamentos públicos
 */

import { createBooking as createBookingFirestore } from '@/services/bookings.service';
import type { PublicBookingFormData, ClientInfo } from '../_types';

export interface CreateBookingResponse {
  success: boolean;
  error?: string;
}

/**
 * Cria um novo agendamento público
 */
export async function createPublicBooking(
  client: ClientInfo,
  selectedDate: string,
  formData: PublicBookingFormData
): Promise<CreateBookingResponse> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora

    const bookingData = {
      date: selectedDate,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      timeSlot: 'full-day' as const,
      numberOfPeople: formData.numberOfPeople,
      status: 'pending' as const,
      notes: formData.notes,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      expirationNotificationSent: false,
      ownerId: client.uid,
    };

    await createBookingFirestore(bookingData);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar agendamento',
    };
  }
}
