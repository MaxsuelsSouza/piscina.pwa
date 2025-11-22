/**
 * API Route para ativar/desativar usuários
 * Apenas administradores podem acessar esta rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { activateUser, deactivateUser } from '@/lib/firebase/firestore/users.admin';
import { isAdmin } from '@/config/admin';

export async function POST(request: NextRequest) {
  try {
    // Verifica o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verifica se o usuário é admin
    if (!isAdmin(decodedToken.uid)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar status de usuários' },
        { status: 403 }
      );
    }

    // Lê os dados do request
    const { uid, isActive } = await request.json();

    // Validações
    if (!uid) {
      return NextResponse.json(
        { error: 'UID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive deve ser true ou false' },
        { status: 400 }
      );
    }

    // Atualiza o status do usuário
    if (isActive) {
      await activateUser(uid);
    } else {
      await deactivateUser(uid);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Erro ao atualizar status. Tente novamente.' },
      { status: 500 }
    );
  }
}
