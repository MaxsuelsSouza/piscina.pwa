/**
 * API Route para listar barbeiros de um dono
 * Donos (clients) e administradores podem acessar esta rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getBarbersByOwnerId } from '@/lib/firebase/firestore/users.admin';
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

    // Admin pode ver todos, owner vê apenas seus barbeiros
    const ownerId = decodedToken.uid;

    // Busca barbeiros do owner
    const barbers = await getBarbersByOwnerId(ownerId);

    return NextResponse.json({
      success: true,
      barbers: barbers.map((barber) => ({
        uid: barber.uid,
        email: barber.email,
        displayName: barber.displayName,
        phone: barber.phone,
        specialties: barber.specialties || [],
        photoURL: barber.photoURL,
        bio: barber.bio,
        isActive: barber.isActive,
        createdAt: barber.createdAt instanceof Date ? barber.createdAt.toISOString() : barber.createdAt,
        updatedAt: barber.updatedAt instanceof Date ? barber.updatedAt.toISOString() : barber.updatedAt,
        ownerId: barber.ownerId,
        mustChangePassword: barber.mustChangePassword,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erro ao listar barbeiros. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
