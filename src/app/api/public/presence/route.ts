/**
 * API Route para confirmação de presença
 * GET /api/public/presence?phone=11999999999
 * POST /api/public/presence
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

interface PresenceConfirmation {
  phone: string;
  name: string;
  status: 'pending' | 'confirmed' | 'declined';
  companions: number;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Parâmetro phone é obrigatório' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const docRef = db.collection('presenceConfirmations').doc(phone);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ confirmation: null });
    }

    return NextResponse.json({
      confirmation: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Erro ao buscar confirmação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar confirmação', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, status, companions } = body;

    if (!phone || !name || !status) {
      return NextResponse.json(
        { error: 'phone, name e status são obrigatórios' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const now = new Date().toISOString();
    const docRef = db.collection('presenceConfirmations').doc(phone);

    const existingDoc = await docRef.get();

    const data: PresenceConfirmation = {
      phone,
      name,
      status,
      companions: companions || 0,
      createdAt: existingDoc.exists ? existingDoc.data()?.createdAt : now,
      updatedAt: now,
    };

    await docRef.set(data);

    return NextResponse.json({
      success: true,
      confirmation: data,
    });
  } catch (error) {
    console.error('Erro ao salvar confirmação:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar confirmação', details: String(error) },
      { status: 500 }
    );
  }
}
