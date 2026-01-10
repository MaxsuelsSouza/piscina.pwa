/**
 * Gerador de QR Code PIX (Pix Copia e Cola)
 * Sem integração com processadores de pagamento
 * Formato: Payload PIX (BRCode)
 */

import QRCode from 'qrcode';

/**
 * Gera o CRC16 CCITT para o payload PIX
 */
function crc16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  crc = crc & 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um campo do payload PIX
 */
function formatField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

/**
 * Tipos de chave PIX
 */
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

/**
 * Interface para dados do PIX
 */
export interface PixData {
  pixKey: string;
  pixKeyType: PixKeyType;
  merchantName: string;
  merchantCity: string;
  amount: number;
  transactionId?: string;
  description?: string;
}

/**
 * Gera o payload PIX (Pix Copia e Cola)
 */
export function generatePixPayload(data: PixData): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    transactionId = '***',
    description = '',
  } = data;

  // 00: Payload Format Indicator
  let payload = formatField('00', '01');

  // 26: Merchant Account Information
  let merchantAccount = formatField('00', 'BR.GOV.BCB.PIX');
  merchantAccount += formatField('01', pixKey);
  if (description) {
    merchantAccount += formatField('02', description.substring(0, 25));
  }
  payload += formatField('26', merchantAccount);

  // 52: Merchant Category Code (0000 = não especificado)
  payload += formatField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatField('53', '986');

  // 54: Transaction Amount
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatField('58', 'BR');

  // 59: Merchant Name (max 25 chars)
  payload += formatField('59', merchantName.substring(0, 25));

  // 60: Merchant City (max 15 chars)
  payload += formatField('60', merchantCity.substring(0, 15));

  // 62: Additional Data Field Template
  if (transactionId) {
    const additionalData = formatField('05', transactionId.substring(0, 25));
    payload += formatField('62', additionalData);
  }

  // 63: CRC16
  payload += '6304';
  const crcValue = crc16(payload);
  payload += crcValue;

  return payload;
}

/**
 * Gera o QR Code em base64 a partir do payload PIX
 */
export async function generatePixQRCode(pixPayload: string): Promise<string> {
  try {
    const qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    });
    return qrCodeBase64;
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    throw new Error('Falha ao gerar QR Code');
  }
}

/**
 * Gera o PIX completo (payload + QR Code base64)
 */
export async function generatePix(data: PixData): Promise<{
  pixPayload: string;
  qrCodeBase64: string;
}> {
  const pixPayload = generatePixPayload(data);
  const qrCodeBase64 = await generatePixQRCode(pixPayload);

  return {
    pixPayload,
    qrCodeBase64,
  };
}
