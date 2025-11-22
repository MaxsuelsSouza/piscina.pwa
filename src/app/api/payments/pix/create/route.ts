import { NextRequest, NextResponse } from 'next/server';
import { createPixPayment } from '@/lib/mercadopago';
import { sanitizeEmail, sanitizeName, sanitizeNotes } from '@/lib/security/input-sanitizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    if (!body.amount || !body.email || !body.description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: amount, email, description' },
        { status: 400 }
      );
    }

    // Sanitização dos inputs
    const sanitizedData = {
      amount: Number(body.amount),
      email: sanitizeEmail(body.email),
      description: sanitizeNotes(body.description),
      firstName: body.firstName ? sanitizeName(body.firstName) : undefined,
      lastName: body.lastName ? sanitizeName(body.lastName) : undefined,
      cpf: body.cpf ? body.cpf.replace(/\D/g, '') : undefined,
      externalReference: body.externalReference
        ? sanitizeNotes(body.externalReference)
        : undefined,
    };

    // Validação do valor
    if (isNaN(sanitizedData.amount) || sanitizedData.amount <= 0) {
      return NextResponse.json(
        { error: 'Valor do pagamento inválido' },
        { status: 400 }
      );
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Criar pagamento PIX
    const payment = await createPixPayment(sanitizedData);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        qrCode: payment.qr_code,
        qrCodeBase64: payment.qr_code_base64,
        amount: payment.transaction_amount,
        externalReference: payment.external_reference,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
