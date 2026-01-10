/**
 * Tipos para sistema de barbearia
 */

/**
 * Dias da semana
 */
export type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/**
 * Horário de funcionamento por dia
 */
export interface DaySchedule {
  isOpen: boolean; // Se está aberto neste dia
  startTime: string; // Horário de abertura (formato HH:mm, ex: "09:00")
  endTime: string; // Horário de fechamento (formato HH:mm, ex: "18:00")
}

/**
 * Configuração de horários da barbearia
 */
export interface BarberSchedule {
  slotDuration: number; // Duração de cada slot em minutos (ex: 30)
  breakBetweenSlots: number; // Intervalo entre agendamentos em minutos (ex: 0, 10)
  schedule: Record<WeekDay, DaySchedule>; // Horários por dia da semana
}

/**
 * Serviço oferecido pela barbearia
 */
export interface Service {
  id: string; // ID único do serviço
  name: string; // Nome do serviço (ex: "Corte Masculino", "Barba")
  description?: string; // Descrição do serviço
  duration: number; // Duração em minutos
  price: number; // Preço em reais
  isActive: boolean; // Se o serviço está ativo
}

/**
 * Profissional (barbeiro)
 */
export interface Professional {
  id: string; // ID único do profissional
  name: string; // Nome do barbeiro
  phone?: string; // Telefone/WhatsApp
  photo?: string; // URL da foto do profissional
  isActive: boolean; // Se está ativo (disponível para agendamentos)
  services: string[]; // IDs dos serviços que este profissional oferece
}

/**
 * Serviço selecionado em um agendamento
 */
export interface BookedService {
  serviceId: string; // ID do serviço
  serviceName: string; // Nome do serviço (snapshot para histórico)
  duration: number; // Duração em minutos (snapshot)
  price: number; // Preço em reais (snapshot)
}

/**
 * Agendamento de serviço (barbearia)
 */
export interface ServiceBooking {
  id: string;
  ownerId: string; // UID do dono da barbearia
  clientSlug: string; // Slug público da barbearia
  professionalId: string; // ID do profissional que vai atender
  professionalName: string; // Nome do profissional (snapshot)

  date: string; // Data do agendamento (formato YYYY-MM-DD)
  startTime: string; // Horário de início (formato HH:mm)
  endTime: string; // Horário de término (formato HH:mm)
  totalDuration: number; // Duração total em minutos

  services: BookedService[]; // Serviços agendados
  totalPrice: number; // Preço total de todos os serviços

  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  notes?: string; // Observações do cliente
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Pagamento (opcional, usando mesma estrutura do sistema de piscinas)
  payment?: {
    method: 'pix' | 'cash' | 'card';
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    paymentId?: string;
    paidAt?: string;
  };
}

/**
 * Dados estendidos de VenueInfo para barbearias
 */
export interface BarbershopInfo {
  professionals: Professional[]; // Lista de profissionais
  services: Service[]; // Lista de serviços
  schedule: BarberSchedule; // Configuração de horários
  requiresPayment?: boolean; // Se requer pagamento PIX na hora (padrão: false)
}
