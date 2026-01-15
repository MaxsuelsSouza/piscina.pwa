/**
 * API Route para selecionar/desselecionar presente
 * POST /api/public/gifts/select
 *
 * Regra especial: presentes da categoria "quarto-enxoval" podem ser
 * selecionados por até 2 pessoas diferentes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';

interface SelectGiftRequest {
  giftId: string;
  clientPhone: string;
  clientName: string;
}

/**
 * Normaliza telefone (remove caracteres não numéricos)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Retorna o número máximo de seleções permitidas para uma categoria
 */
function getMaxSelections(category: string): number {
  // Categorias que permitem 2 pessoas escolherem o mesmo presente
  if (category === 'quarto-enxoval' || category === 'cozinha-servir') {
    return 2;
  }
  return 1;
}

export async function POST(request: NextRequest) {
  try {
    const body: SelectGiftRequest = await request.json();
    const { giftId, clientName } = body;
    // Normaliza o telefone para garantir consistência
    const clientPhone = normalizePhone(body.clientPhone || '');

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
    const category = gift?.category || '';
    const maxSelections = getMaxSelections(category);

    // selectedBy pode ser string (formato antigo) ou array (formato novo)
    const rawSelectedBy = gift?.selectedBy;
    const currentSelectedBy: string[] = Array.isArray(rawSelectedBy)
      ? rawSelectedBy
      : (rawSelectedBy ? [rawSelectedBy] : []);
    const isSelectedByUser = currentSelectedBy.includes(clientPhone);
    const currentSelectionCount = currentSelectedBy.length;

    const now = new Date().toISOString();

    // Se o usuário já selecionou, desselecionar
    if (isSelectedByUser) {
      const newSelectedBy = currentSelectedBy.filter((phone: string) => phone !== clientPhone);

      await giftRef.update({
        isSelected: newSelectedBy.length > 0,
        selectedBy: newSelectedBy,
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
    }

    // Verificar se ainda há vagas para selecionar
    if (currentSelectionCount >= maxSelections) {
      const message = maxSelections === 1
        ? 'Este presente já foi escolhido por outra pessoa'
        : `Este presente já foi escolhido por ${maxSelections} pessoas`;

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    // Selecionar
    const newSelectedBy = [...currentSelectedBy, clientPhone];

    await giftRef.update({
      isSelected: true,
      selectedBy: newSelectedBy,
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
  } catch (error) {
    console.error('Erro ao selecionar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao selecionar presente', details: String(error) },
      { status: 500 }
    );
  }
}
