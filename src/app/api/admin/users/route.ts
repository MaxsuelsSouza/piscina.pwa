/**
 * API Route para listar usuários
 * Apenas administradores podem acessar esta rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getAllUsers } from '@/lib/firebase/firestore/users.admin';
import { isAdmin } from '@/config/admin';

export async function GET(request: NextRequest) {
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
        { error: 'Apenas administradores podem listar usuários' },
        { status: 403 }
      );
    }

    // Busca todos os usuários
    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        createdBy: user.createdBy,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários. Tente novamente.' },
      { status: 500 }
    );
  }
}
