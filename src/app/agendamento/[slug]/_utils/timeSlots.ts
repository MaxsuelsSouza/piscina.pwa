/**
 * Utilitários para cálculo de horários disponíveis
 * Implementa slots de 10 em 10 minutos com bloqueio bidirecional
 */

import type { BarberSchedule, ServiceBooking, WeekDay, Service, Professional } from '@/types/barbershop';

/**
 * Calcula os horários disponíveis para agendamento
 */
export function calculateAvailableTimeSlots(
  selectedDate: string, // YYYY-MM-DD
  professionalId: string,
  totalDuration: number, // em minutos
  existingBookings: ServiceBooking[],
  schedule: BarberSchedule,
  allServices: Service[], // Todos os serviços disponíveis
  professionals: Professional[] // Todos os profissionais
): string[] {
  // Verifica se schedule existe e tem as propriedades necessárias
  if (!schedule || !schedule.schedule) {
    return [];
  }

  // Calcula o menor serviço que este profissional oferece
  const minServiceDuration = getMinServiceDurationForProfessional(
    professionalId,
    professionals,
    allServices
  );

  // Pega o dia da semana
  const date = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = getDayOfWeek(date);

  const daySchedule = schedule.schedule[dayOfWeek];

  // Se não está aberto neste dia, retorna vazio
  if (!daySchedule || !daySchedule.isOpen) {
    return [];
  }

  // Gera todos os slots possíveis do dia (sempre de 10 em 10 minutos)
  const SLOT_INTERVAL = 10; // Slots fixos de 10 em 10 minutos
  const allSlots = generateDaySlots(
    daySchedule.startTime,
    daySchedule.endTime,
    SLOT_INTERVAL
  );

  // Filtra os horários que estão ocupados por agendamentos existentes
  const availableSlots = allSlots.filter(slotTime => {
    return isSlotAvailable(
      selectedDate,
      slotTime,
      totalDuration,
      professionalId,
      existingBookings,
      minServiceDuration // Passa o menor serviço do profissional
    );
  });

  // Remove horários passados se for hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return availableSlots.filter(slot => slot > currentTime);
  }

  return availableSlots;
}

/**
 * Obtém a duração mínima dos serviços que um profissional oferece
 */
function getMinServiceDurationForProfessional(
  professionalId: string,
  professionals: Professional[],
  allServices: Service[]
): number {
  // Encontra o profissional
  const professional = professionals.find(p => p.id === professionalId);

  if (!professional || !professional.services || professional.services.length === 0) {
    // Fallback: Se não encontrar profissional ou ele não tem serviços, usa 30min como padrão
    return 30;
  }

  // Filtra os serviços que este profissional oferece
  const professionalServices = allServices.filter(service =>
    professional.services.includes(service.id) && service.isActive
  );

  if (professionalServices.length === 0) {
    // Fallback: Se não encontrar serviços ativos, usa 30min como padrão
    return 30;
  }

  // Retorna a menor duração
  return Math.min(...professionalServices.map(s => s.duration));
}

/**
 * Converte Date para WeekDay
 */
function getDayOfWeek(date: Date): WeekDay {
  const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Gera todos os slots possíveis entre startTime e endTime
 */
function generateDaySlots(
  startTime: string, // HH:mm
  endTime: string, // HH:mm
  slotDuration: number // minutos
): string[] {
  const slots: string[] = [];

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    slots.push(timeStr);
    currentMinutes += slotDuration;
  }

  return slots;
}

/**
 * Verifica se um slot específico está disponível
 *
 * Lógica de bloqueio bidirecional:
 * - Se já existe um agendamento às 10:10:
 *   - Bloqueia `minServiceDuration` ANTES de 10:10 (ex: se menor serviço é 30min, bloqueia 09:40, 09:50, 10:00)
 *   - Bloqueia DURANTE o agendamento (10:10, 10:20, 10:30 conforme duração real)
 *
 * - Se quero agendar às 10:00:
 *   - Preciso verificar se não conflita com nenhum agendamento existente
 *   - Não posso terminar depois do início de outro agendamento
 */
function isSlotAvailable(
  date: string, // YYYY-MM-DD
  startTime: string, // HH:mm do slot que queremos verificar
  duration: number, // minutos do serviço que o cliente quer agendar
  professionalId: string,
  existingBookings: ServiceBooking[],
  minServiceDuration: number // Menor serviço que o profissional oferece
): boolean {
  const newStartMinutes = timeToMinutes(startTime);
  const newEndMinutes = newStartMinutes + duration;

  // Filtra agendamentos do mesmo profissional no mesmo dia e não cancelados
  const professionalBookings = existingBookings.filter(
    booking =>
      booking.professionalId === professionalId &&
      booking.date === date &&
      booking.status !== 'cancelled'
  );

  // Para cada agendamento existente, verifica se o novo slot conflita
  for (const booking of professionalBookings) {
    const existingStartMinutes = timeToMinutes(booking.startTime);
    const existingEndMinutes = timeToMinutes(booking.endTime);

    // ===== VERIFICAÇÕES DE CONFLITO =====

    // 1. CONFLITO DIRETO: O novo agendamento sobrepõe o existente
    if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
      return false;
    }

    // 2. BLOQUEIO ANTES DO AGENDAMENTO EXISTENTE
    // O agendamento existente bloqueia `minServiceDuration` minutos ANTES dele
    // Exemplo: Se o menor serviço é 30min e existe agendamento às 10:10, bloqueia de 09:40 até 10:10
    const blockedRangeStart = existingStartMinutes - minServiceDuration;
    const blockedRangeEnd = existingStartMinutes;

    // Verifica se o novo agendamento cai na zona bloqueada ANTES
    if (newStartMinutes >= blockedRangeStart && newStartMinutes < blockedRangeEnd) {
      return false; // Está na zona bloqueada antes
    }

    // Verifica se o novo agendamento TERMINA na zona bloqueada ANTES
    if (newEndMinutes > blockedRangeStart && newEndMinutes <= existingStartMinutes) {
      return false; // Termina na zona bloqueada
    }

    // 3. BLOQUEIO DURANTE/DEPOIS DO AGENDAMENTO EXISTENTE
    // O agendamento existente ocupa de existingStart até existingEnd
    // Não pode começar durante este período
    if (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) {
      return false; // Começa durante o agendamento existente
    }

    // 4. VERIFICA SE O NOVO AGENDAMENTO NÃO "INVADE" O ESPAÇO NECESSÁRIO ANTES DE OUTRO
    // Se o novo agendamento terminar muito perto do início do existente
    if (newEndMinutes > blockedRangeStart && newEndMinutes <= existingStartMinutes) {
      return false;
    }
  }

  return true;
}

/**
 * Converte HH:mm para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calcula o horário de término baseado em início e duração
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;

  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}
