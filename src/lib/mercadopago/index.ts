import { MercadoPagoConfig, Payment } from 'mercadopago';

// Verifica se o token está configurado
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// Configuração do cliente Mercado Pago (só inicializa se o token existir)
let mercadoPagoClient: MercadoPagoConfig | null = null;
let paymentClient: Payment | null = null;

if (accessToken) {
  mercadoPagoClient = new MercadoPagoConfig({
    accessToken: accessToken,
    options: {
      timeout: 5000,
    },
  });
  paymentClient = new Payment(mercadoPagoClient);
}

// Função auxiliar para verificar se está configurado
export function isMercadoPagoConfigured(): boolean {
  return !!accessToken;
}

export { mercadoPagoClient, paymentClient };
export * from './payment.service';
export * from './types';
