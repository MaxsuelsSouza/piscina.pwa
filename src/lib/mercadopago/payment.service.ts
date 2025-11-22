import { paymentClient, isMercadoPagoConfigured } from './index';
import type {
  CreatePixPaymentParams,
  PixPaymentResponse,
  PaymentStatus,
} from './types';

/**
 * Cria um pagamento PIX via Mercado Pago
 */
export async function createPixPayment(
  params: CreatePixPaymentParams
): Promise<PixPaymentResponse> {
  // Verifica se o Mercado Pago está configurado
  if (!isMercadoPagoConfigured() || !paymentClient) {
    throw new Error(
      'Mercado Pago não configurado. Adicione MERCADO_PAGO_ACCESS_TOKEN ao .env.local'
    );
  }

  try {
    // Verifica se a URL base está configurada e não é localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

    const body = {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: 'pix',
      payer: {
        email: params.email,
        ...(params.firstName && {
          first_name: params.firstName,
        }),
        ...(params.lastName && {
          last_name: params.lastName,
        }),
        ...(params.cpf && {
          identification: {
            type: 'CPF',
            number: params.cpf,
          },
        }),
      },
      ...(params.externalReference && {
        external_reference: params.externalReference,
      }),
      // Só adiciona notification_url se não for localhost (produção)
      ...(!isLocalhost && appUrl && {
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      }),
    };

    const payment = await paymentClient.create({ body });

    if (!payment.point_of_interaction?.transaction_data) {
      throw new Error('Falha ao gerar dados do PIX');
    }


    return {
      id: payment.id!,
      status: payment.status!,
      status_detail: payment.status_detail!,
      qr_code: payment.point_of_interaction.transaction_data.qr_code!,
      qr_code_base64:
        payment.point_of_interaction.transaction_data.qr_code_base64!,
      ticket_url: payment.point_of_interaction.transaction_data.ticket_url!,
      transaction_amount: payment.transaction_amount!,
      date_created: payment.date_created!,
      date_approved: payment.date_approved || undefined,
      external_reference: payment.external_reference || undefined,
    };
  } catch (error: any) {
    throw new Error(
      error?.message || 'Erro ao criar pagamento. Tente novamente.'
    );
  }
}

/**
 * Busca informações de um pagamento
 */
export async function getPayment(paymentId: number) {
  if (!isMercadoPagoConfigured() || !paymentClient) {
    throw new Error('Mercado Pago não configurado');
  }

  try {
    const payment = await paymentClient.get({ id: paymentId });
    return payment;
  } catch (error: any) {
    throw new Error(error?.message || 'Erro ao buscar pagamento');
  }
}

/**
 * Verifica o status de um pagamento
 */
export async function checkPaymentStatus(
  paymentId: number
): Promise<PaymentStatus> {
  if (!isMercadoPagoConfigured() || !paymentClient) {
    throw new Error('Mercado Pago não configurado');
  }

  try {
    const payment = await paymentClient.get({ id: paymentId });
    return payment.status as PaymentStatus;
  } catch (error: any) {
    throw new Error(error?.message || 'Erro ao verificar pagamento');
  }
}
