/**
 * API Route para selecionar/desselecionar presente
 * POST /api/public/gifts/select
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

interface SelectGiftRequest {
  giftId: string;
  clientPhone: string;
  clientName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SelectGiftRequest = await request.json();
    const { giftId, clientPhone, clientName } = body;

    if (!giftId || !clientPhone || !clientName) {
      return NextResponse.json(
        { error: 'giftId, clientPhone e clientName são obrigatórios' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const giftRef = db.collection('gifts').doc(giftId);
    const giftDoc = await giftRef.get();

    if (!giftDoc.exists) {
      return NextResponse.json(
        { error: 'Presente não encontrado' },
        { status: 404 }
      );
    }

    const gift = giftDoc.data();

    // Se já está selecionado por outra pessoa, não permite
    if (gift?.isSelected && gift?.selectedBy !== clientPhone) {
      return NextResponse.json(
        { error: 'Este presente já foi escolhido por outra pessoa' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // Toggle selection
    if (gift?.isSelected && gift?.selectedBy === clientPhone) {
      // Desselecionar
      await giftRef.update({
        isSelected: false,
        selectedBy: null,
        selectedAt: null,
        updatedAt: now,
      });

      // Remove from giftSelections
      const selectionsRef = db.collection('giftSelections');
      const selectionsQuery = selectionsRef
        .where('giftId', '==', giftId)
        .where('clientPhone', '==', clientPhone);
      const selectionsSnapshot = await selectionsQuery.get();

      const batch = db.batch();
      selectionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return NextResponse.json({
        success: true,
        action: 'unselected',
        message: 'Presente removido da sua lista',
      });
    } else {
      // Selecionar
      await giftRef.update({
        isSelected: true,
        selectedBy: clientPhone,
        selectedAt: now,
        updatedAt: now,
      });

      // Add to giftSelections
      await db.collection('giftSelections').add({
        giftId,
        giftName: gift?.name || '',
        clientPhone,
        clientName,
        selectedAt: now,
      });

      return NextResponse.json({
        success: true,
        action: 'selected',
        message: 'Presente adicionado à sua lista',
      });
    }
  } catch (error) {
    console.error('Erro ao selecionar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao selecionar presente', details: String(error) },
      { status: 500 }
    );
  }
}
