/**
 * API Route para gerar QR Code PIX para presente
 * POST /api/public/gifts/pix
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePix } from '@/lib/pix/generator';
import { PIX_CONFIG } from '@/app/lista-casamento/_config/pix';

interface PixGiftRequest {
  giftName: string;
  giftId: string;
  amount: number;
  clientName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PixGiftRequest = await request.json();
    const { giftName, giftId, amount, clientName } = body;

    if (!giftName || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'giftName e amount são obrigatórios' },
        { status: 400 }
      );
    }

    // Generate transaction ID (short version of gift ID + timestamp)
    const transactionId = `GIFT${giftId.slice(-6).toUpperCase()}`;

    // Generate PIX
    const { pixPayload, qrCodeBase64 } = await generatePix({
      pixKey: PIX_CONFIG.pixKey,
      pixKeyType: PIX_CONFIG.pixKeyType,
      merchantName: PIX_CONFIG.merchantName,
      merchantCity: PIX_CONFIG.merchantCity,
      amount,
      transactionId,
      description: giftName.substring(0, 25),
    });

    return NextResponse.json({
      success: true,
      pixPayload,
      qrCodeBase64,
      transactionId,
      amount,
      giftName,
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PIX', details: String(error) },
      { status: 500 }
    );
  }
}
