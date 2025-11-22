/**
 * API Route para atualizar data de vencimento da assinatura
 * Apenas administradores podem acessar esta rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { updateUser } from '@/lib/firebase/firestore/users.admin';
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
        { error: 'Apenas administradores podem atualizar datas de vencimento' },
        { status: 403 }
      );
    }

    // Lê os dados do request
    const { uid, subscriptionDueDate } = await request.json();

    // Validações
    if (!uid) {
      return NextResponse.json(
        { error: 'UID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    if (!subscriptionDueDate) {
      return NextResponse.json(
        { error: 'Data de vencimento é obrigatória' },
        { status: 400 }
      );
    }

    // Valida se a data é válida
    const dueDate = new Date(subscriptionDueDate);
    if (isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { error: 'Data de vencimento inválida' },
        { status: 400 }
      );
    }

    // Atualiza a data de vencimento
    await updateUser(uid, {
      subscriptionDueDate: dueDate,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {

    return NextResponse.json(
      { error: 'Erro ao atualizar data de vencimento. Tente novamente.' },
      { status: 500 }
    );
  }
}
