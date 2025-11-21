export interface CreatePixPaymentParams {
  amount: number;
  description: string;
  email: string;
  firstName?: string;
  lastName?: string;
  cpf?: string;
  externalReference?: string; // Referência externa (ex: booking ID)
}

export interface PixPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  qr_code: string; // Base64 do QR Code
  qr_code_base64: string; // Imagem base64
  ticket_url: string;
  transaction_amount: number;
  date_created: string;
  date_approved?: string;
  external_reference?: string;
}

export interface PaymentWebhookData {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';
