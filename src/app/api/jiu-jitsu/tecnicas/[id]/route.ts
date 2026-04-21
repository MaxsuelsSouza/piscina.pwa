/**
 * API Route - Técnica individual
 * PATCH  /api/jiu-jitsu/tecnicas/[id] - Atualiza uma técnica
 * DELETE /api/jiu-jitsu/tecnicas/[id] - Remove uma técnica
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'jj_tecnicas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = adminDb();

    await db.collection(COLLECTION).doc(id).update({
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar técnica:', error);
    return NextResponse.json({ error: 'Erro ao atualizar técnica' }, { status: 500 });
  }
}

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
    console.error('Erro ao deletar técnica:', error);
    return NextResponse.json({ error: 'Erro ao deletar técnica' }, { status: 500 });
  }
}
