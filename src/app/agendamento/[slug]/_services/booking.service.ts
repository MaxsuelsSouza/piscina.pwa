/**
 * Serviços para criação de agendamentos públicos
 */

import type { PublicBookingFormData } from '../_types';

export interface CreateBookingResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Cria um novo agendamento público
 *
 * IMPORTANTE: Usa API route server-side para garantir segurança
 * O ownerId é determinado pelo slug no servidor, não pelo client-side
 * Isso previne manipulação do ownerId no navegador
 */
export async function createPublicBooking(
  slug: string,
  selectedDate: string,
  formData: PublicBookingFormData
): Promise<CreateBookingResponse> {
  try {
    // Envia para API route que valida server-side
    const response = await fetch('/api/public/booking/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug, // Slug é usado server-side para buscar o cliente correto
        date: selectedDate,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        numberOfPeople: formData.numberOfPeople,
        notes: formData.notes,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao criar agendamento',
      };
    }

    return {
      success: true,
      bookingId: result.bookingId,
    };
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar agendamento',
    };
  }
}
