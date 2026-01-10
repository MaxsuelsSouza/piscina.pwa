/**
 * API Route para atualizar ou deletar um barbeiro específico
 * Donos (clients) podem atualizar/deletar seus próprios barbeiros
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserByUid, updateBarber, deleteBarber } from '@/lib/firebase/firestore/users.admin';
import { isAdmin } from '@/config/admin';

interface RouteParams {
  params: {
    barberId: string;
  };
}

/**
 * PATCH - Atualiza status (isActive) de um barbeiro
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { barberId } = params;
    const { isActive } = await request.json();

    // Busca o barbeiro
    const barber = await getUserByUid(barberId);
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
        { status: 400 }
      );
    }

    // Verifica se o usuário logado é o dono do barbeiro ou admin
    if (!isAdmin(decodedToken.uid) && barber.ownerId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar este barbeiro' },
        { status: 403 }
      );
    }

    // Atualiza o barbeiro (dono só pode atualizar isActive)
    await updateBarber(barberId, { isActive });

    return NextResponse.json({
      success: true,
      message: 'Barbeiro atualizado com sucesso',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao atualizar barbeiro. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Deleta um barbeiro permanentemente
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { barberId } = params;

    // Busca o barbeiro
    const barber = await getUserByUid(barberId);
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
        { status: 400 }
      );
    }

    // Verifica se o usuário logado é o dono do barbeiro ou admin
    if (!isAdmin(decodedToken.uid) && barber.ownerId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar este barbeiro' },
        { status: 403 }
      );
    }

    // Deleta o barbeiro do Firestore
    await deleteBarber(barberId);

    // Deleta o barbeiro do Firebase Auth
    try {
      await adminAuth().deleteUser(barberId);
    } catch (error) {
      // Se falhar ao deletar do Auth, registra o erro mas continua
      console.error('Erro ao deletar barbeiro do Firebase Auth:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Barbeiro deletado com sucesso',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao deletar barbeiro. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
