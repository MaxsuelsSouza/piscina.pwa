/**
 * API Route para criar novos barbeiros no Firebase Auth
 * Donos (clients) podem criar barbeiros vinculados a eles
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createBarberDocument } from '@/lib/firebase/firestore/users.admin';
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

    // Lê os dados do request
    const { email, password, displayName, phone, specialties, photoURL, bio } = await request.json();

    // Validações
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Owner ID é o uid do usuário logado (dono)
    const ownerId = decodedToken.uid;

    // Cria o barbeiro no Firebase Auth
    const userRecord = await adminAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Cria o documento do barbeiro no Firestore
    await createBarberDocument(
      userRecord.uid,
      email,
      displayName,
      ownerId,
      phone,
      specialties,
      photoURL,
      bio
    );

    return NextResponse.json({
      success: true,
      barber: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        phone,
        specialties: specialties || [],
        photoURL,
        bio,
        ownerId,
      },
    });
  } catch (error: any) {

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
      {
        error: 'Erro ao criar barbeiro. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
