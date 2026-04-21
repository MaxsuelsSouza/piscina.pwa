/**
 * API Route - Aula individual
 * DELETE /api/jiu-jitsu/aulas/[id] - Remove uma aula
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'jj_aulas';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = adminDb();
    await db.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    return NextResponse.json({ error: 'Erro ao deletar aula' }, { status: 500 });
  }
}
