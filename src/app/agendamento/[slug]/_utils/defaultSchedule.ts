/**
 * Schedule padrão para quando não houver configuração
 */

import type { BarberSchedule } from '@/types/barbershop';

export const defaultSchedule: BarberSchedule = {
  slotDuration: 30,
  breakBetweenSlots: 0,
  schedule: {
    sunday: { isOpen: false, startTime: '09:00', endTime: '18:00' },
    monday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    thursday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    friday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    saturday: { isOpen: true, startTime: '09:00', endTime: '14:00' },
  },
};
