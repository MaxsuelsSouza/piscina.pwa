/**
 * Configuracao PIX para recebimento de pagamentos
 */

export const PIX_CONFIG = {
  pixKey: process.env.PIX_KEY || '81994625990',
  pixKeyType: 'phone' as const,
  merchantName: 'Lista Casa Nova',
  merchantCity: 'Recife',
};
