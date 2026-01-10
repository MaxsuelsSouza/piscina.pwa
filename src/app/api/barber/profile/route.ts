/**
 * API Route para barbeiro gerenciar seu próprio perfil
 * Apenas barbeiros autenticados podem acessar
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserByUid, updateBarber } from '@/lib/firebase/firestore/users.admin';

/**
 * GET - Busca perfil do barbeiro logado
 */
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

    // Busca o barbeiro
    const barber = await getUserByUid(decodedToken.uid);
    if (!barber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se é barbeiro
    if (barber.role !== 'barber') {
      return NextResponse.json(
        { error: 'Usuário não é um barbeiro' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      barber: {
        uid: barber.uid,
        email: barber.email,
        displayName: barber.displayName,
        phone: barber.phone,
        specialties: barber.specialties || [],
        photoURL: barber.photoURL,
        bio: barber.bio,
        isActive: barber.isActive,
        ownerId: barber.ownerId,
        mustChangePassword: barber.mustChangePassword,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao buscar perfil. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualiza perfil do barbeiro logado
 */
export async function PATCH(request: NextRequest) {
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

    // Busca o barbeiro
    const barber = await getUserByUid(decodedToken.uid);
    if (!barber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se é barbeiro
    if (barber.role !== 'barber') {
      return NextResponse.json(
        { error: 'Usuário não é um barbeiro' },
        { status: 403 }
      );
    }

    // Lê os dados do request (barbeiro pode atualizar: displayName, phone, specialties, photoURL, bio)
    const { displayName, phone, specialties, photoURL, bio } = await request.json();

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (specialties !== undefined) updateData.specialties = specialties;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (bio !== undefined) updateData.bio = bio;

    // Atualiza o perfil
    await updateBarber(decodedToken.uid, updateData);

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao atualizar perfil. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
