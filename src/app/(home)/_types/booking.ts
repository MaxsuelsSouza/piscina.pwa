/**
 * Tipos para sistema de agendamento de piscina
 */

export interface Booking {
  id: string;
  date: string; // formato: YYYY-MM-DD
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  timeSlot: TimeSlot;
  numberOfPeople: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  expiresAt?: string; // Flag temporário: se status=pending e expiresAt passou, libera o dia
  expirationNotificationSent?: boolean; // Controla se já enviou notificação de expiração
  ownerId?: string; // UID do cliente que gerencia este agendamento (opcional para retrocompatibilidade)
  clientSlug?: string; // Slug do cliente para construir URL pública de agendamento
  payment?: PaymentInfo; // Informações de pagamento
}

export interface PaymentInfo {
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  method?: 'pix' | 'credit_card' | 'debit_card';
  amount?: number;
  paymentId?: string; // ID do pagamento no Mercado Pago
  paidAt?: Date;
  pixQrCode?: string; // QR Code PIX (base64)
  pixQrCodeText?: string; // Código Pix Copia e Cola
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'full-day';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface TimeSlotInfo {
  id: TimeSlot;
  label: string;
  time: string;
  price: number;
}

export interface BlockedDate {
  id: string;
  date: string; // formato: YYYY-MM-DD
  createdAt: string;
  ownerId?: string; // UID do cliente que gerencia este bloqueio (opcional para retrocompatibilidade)
}
