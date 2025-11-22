/**
 * Serviço para geração de PIX usando os dados bancários do perfil
 */

import { createStaticPix } from 'pix-utils';
import QRCode from 'qrcode';

export interface PixPaymentData {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  accountHolder: string;
  amount: number;
  description: string;
  city: string;
  transactionId: string; // ID único para identificar a transação
}

export interface PixPaymentResult {
  qrCodeBase64: string;
  qrCode: string; // Código PIX copia e cola
  amount: number;
}

/**
 * Normaliza a chave PIX de acordo com o tipo
 */
function normalizePixKey(key: string, type: string): string {
  // Remove todos os caracteres não numéricos para CPF/CNPJ/Phone
  if (type === 'cpf' || type === 'cnpj' || type === 'phone') {
    return key.replace(/\D/g, '');
  }
  // Para email e random, retorna como está
  return key;
}

/**
 * Gera QR Code PIX com os dados bancários do perfil
 */
export async function generatePixQRCode(data: PixPaymentData): Promise<PixPaymentResult> {
  try {
    // Normaliza a chave PIX
    const normalizedKey = normalizePixKey(data.pixKey, data.pixKeyType);

    // Gera o código PIX usando pix-utils
    // Usa apenas campos essenciais para garantir compatibilidade
    const pixCode = createStaticPix({
      merchantName: data.accountHolder.substring(0, 25).toUpperCase(), // Máximo 25 caracteres, maiúsculo
      merchantCity: data.city.substring(0, 15).toUpperCase(), // Máximo 15 caracteres, maiúsculo
      pixKey: normalizedKey,
      transactionAmount: data.amount,
    });

    // Verifica se houve erro na geração do código PIX
    if ('error' in pixCode) {
      throw new Error(`Erro ao gerar código PIX: ${pixCode.error}`);
    }

    // Gera o QR Code em base64
    const qrCodeDataUrl = await QRCode.toDataURL(pixCode.toBRCode(), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 512,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Remove o prefixo "data:image/png;base64,"
    const base64Data = qrCodeDataUrl.split(',')[1];


    return {
      qrCodeBase64: base64Data,
      qrCode: pixCode.toBRCode(),
      amount: data.amount,
    };
  } catch (error) {
    throw new Error('Falha ao gerar QR Code PIX: ' + (error as Error).message);
  }
}
