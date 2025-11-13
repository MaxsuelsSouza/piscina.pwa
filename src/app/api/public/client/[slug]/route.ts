/**
 * API Route pública para buscar informações do cliente por slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBySlug } from '@/lib/firebase/firestore/users.admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug não fornecido' },
        { status: 400 }
      );
    }

    // Normaliza o slug (lowercase, trim)
    const normalizedSlug = slug.toLowerCase().trim();

    // Busca o cliente pelo slug
    const client = await getUserBySlug(normalizedSlug);

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se é um cliente ativo
    if (client.role !== 'client' || !client.isActive) {
      return NextResponse.json(
        { error: 'Cliente não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Retorna apenas informações públicas
    return NextResponse.json({
      success: true,
      client: {
        uid: client.uid,
        displayName: client.displayName,
        businessName: client.businessName,
        publicSlug: client.publicSlug,
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar cliente por slug:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    );
  }
}
