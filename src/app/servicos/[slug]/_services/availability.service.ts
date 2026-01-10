/**
 * Serviço para calcular disponibilidade de horários
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ServiceBooking, Professional, BarberSchedule, WeekDay } from '@/types/barbershop';
import type { TimeSlot } from '../_types';

/**
 * Mapeamento de índice do dia para WeekDay
 */
const dayIndexToWeekDay: WeekDay[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Gera todos os slots de horário possíveis para um dia
 */
function generateTimeSlots(
  schedule: BarberSchedule,
  date: Date
): string[] {
  const dayOfWeek = dayIndexToWeekDay[date.getDay()];
  const daySchedule = schedule.schedule[dayOfWeek];

  if (!daySchedule.isOpen) {
    return [];
  }

  const slots: string[] = [];
  const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  const slotDuration = schedule.slotDuration;
  const breakTime = schedule.breakBetweenSlots;

  for (
    let current = startMinutes;
    current < endMinutes;
    current += slotDuration + breakTime
  ) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    slots.push(timeString);
  }

  return slots;
}

/**
 * Verifica se um horário está disponível para um profissional
 */
async function isSlotAvailable(
  professionalId: string,
  ownerId: string,
  date: string,
  startTime: string,
  duration: number
): Promise<boolean> {
  try {
    // Busca agendamentos do profissional neste dia
    const bookingsRef = collection(db, 'serviceBookings');
    const q = query(
      bookingsRef,
      where('professionalId', '==', professionalId),
      where('ownerId', '==', ownerId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return true; // Nenhum agendamento neste dia
    }

    // Converte startTime e calcula endTime
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + duration;

    // Verifica conflitos
    for (const doc of snapshot.docs) {
      const booking = doc.data() as ServiceBooking;
      const [bookingStartHour, bookingStartMinute] = booking.startTime.split(':').map(Number);
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute;
      const bookingEndMinutes = bookingStartMinutes + booking.totalDuration;

      // Verifica sobreposição
      if (
        (startMinutes >= bookingStartMinutes && startMinutes < bookingEndMinutes) ||
        (endMinutes > bookingStartMinutes && endMinutes <= bookingEndMinutes) ||
        (startMinutes <= bookingStartMinutes && endMinutes >= bookingEndMinutes)
      ) {
        return false; // Conflito encontrado
      }
    }

    return true; // Sem conflitos
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return false;
  }
}

/**
 * Calcula a disponibilidade de horários para um profissional em uma data
 */
export async function getProfessionalAvailability(
  professional: Professional,
  ownerId: string,
  schedule: BarberSchedule,
  date: string,
  totalDuration: number
): Promise<TimeSlot[]> {
  const dateObj = new Date(date + 'T00:00:00');
  const allSlots = generateTimeSlots(schedule, dateObj);

  const slotsWithAvailability = await Promise.all(
    allSlots.map(async (time) => ({
      time,
      isAvailable: await isSlotAvailable(
        professional.id,
        ownerId,
        date,
        time,
        totalDuration
      ),
      professionalId: professional.id,
    }))
  );

  return slotsWithAvailability;
}
