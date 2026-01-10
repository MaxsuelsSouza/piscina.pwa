/**
 * Serviço para criar agendamentos de barbearia
 */

import type { BookedService } from '@/types/barbershop';

export interface BarbershopBookingData {
  professionalId: string;
  services: BookedService[];
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

export interface BarbershopBookingResponse {
  success: boolean;
  bookingId?: string;
  message?: string;
  error?: string;
  requiresPayment?: boolean;
  payment?: {
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
  };
  businessName?: string;
  ownerPhone?: string;
}

/**
 * Cria um agendamento de serviço em barbearia
 */
export async function createBarbershopBooking(
  slug: string,
  date: string,
  bookingData: BarbershopBookingData
): Promise<BarbershopBookingResponse> {
  try {
    const response = await fetch('/api/public/barbershop/booking/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        date,
        ...bookingData,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar agendamento de barbearia:', error);
    return {
      success: false,
      error: 'Erro ao comunicar com o servidor',
    };
  }
}
