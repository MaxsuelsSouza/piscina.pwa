/**
 * API Route para criar novos usuários no Firebase Auth
 * Apenas administradores podem acessar esta rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createUserDocument } from '@/lib/firebase/firestore/users.admin';
import { isAdmin } from '@/config/admin';
import { generateSlug } from '@/types/user';

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
        { error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      );
    }

    // Lê os dados do request
    const { email, password, displayName, businessName, role = 'user' } = await request.json();

    // Validações
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'client') {
      return NextResponse.json(
        { error: 'Role inválida. Use "admin" ou "client"' },
        { status: 400 }
      );
    }

    // Cria o usuário no Firebase Auth
    const userRecord = await adminAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Gera slug público único (apenas para clientes)
    const publicSlug = role === 'client' ? generateSlug(displayName, email) : undefined;

    // Cria o documento do usuário no Firestore
    await createUserDocument(
      userRecord.uid,
      email,
      role,
      displayName,
      decodedToken.uid, // UID do admin que criou o usuário
      publicSlug,
      businessName
    );

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);

    // Erros específicos do Firebase
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Senha muito fraca' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuário. Tente novamente.' },
      { status: 500 }
    );
  }
}
