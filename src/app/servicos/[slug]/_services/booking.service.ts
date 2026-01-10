/**
 * Serviço para criar agendamentos de serviços
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ServiceBooking, Service, Professional } from '@/types/barbershop';
import type { CreateServiceBookingData } from '../_types';

/**
 * Calcula o horário de término baseado no início e duração
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

/**
 * Cria um novo agendamento de serviço
 */
export async function createServiceBooking(
  data: CreateServiceBookingData,
  ownerId: string,
  clientSlug: string,
  professional: Professional,
  services: Service[]
): Promise<string> {
  try {
    // Calcula duração total e preço total
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // Calcula horário de término
    const endTime = calculateEndTime(data.startTime, totalDuration);

    // Cria snapshot dos serviços
    const bookedServices = services.map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      duration: service.duration,
      price: service.price,
    }));

    const now = new Date().toISOString();

    const booking: Omit<ServiceBooking, 'id'> = {
      ownerId,
      clientSlug,
      professionalId: data.professionalId,
      professionalName: professional.name,
      date: data.date,
      startTime: data.startTime,
      endTime,
      totalDuration,
      services: bookedServices,
      totalPrice,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      status: 'pending',
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    const bookingsRef = collection(db, 'serviceBookings');
    const docRef = await addDoc(bookingsRef, booking);

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw new Error('Não foi possível criar o agendamento. Tente novamente.');
  }
}
