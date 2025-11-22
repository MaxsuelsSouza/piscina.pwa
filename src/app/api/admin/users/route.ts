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
        businessName: user.businessName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
        createdBy: user.createdBy,
        publicSlug: user.publicSlug,
        subscriptionDueDate: user.subscriptionDueDate instanceof Date ? user.subscriptionDueDate.toISOString() : user.subscriptionDueDate,
        mustChangePassword: user.mustChangePassword,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao listar usuários. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
