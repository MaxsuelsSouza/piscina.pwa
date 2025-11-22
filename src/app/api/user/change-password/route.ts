/**
 * API Route para trocar senha do usuário
 * Qualquer usuário autenticado pode trocar sua própria senha
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { updateUser } from '@/lib/firebase/firestore/users.admin';

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

    // Lê os dados do request
    const { currentPassword, newPassword } = await request.json();

    // Validações
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Atualiza a senha no Firebase Auth
    await adminAuth().updateUser(decodedToken.uid, {
      password: newPassword,
    });

    // Atualiza o campo mustChangePassword para false no Firestore
    await updateUser(decodedToken.uid, {
      mustChangePassword: false,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Erro ao trocar senha. Tente novamente.' },
      { status: 500 }
    );
  }
}
