/**
 * Serviço para gerenciar barbeiros (frontend)
 */

import { auth } from '@/lib/firebase/config';

export interface Barber {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  specialties?: string[];
  photoURL?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  mustChangePassword?: boolean;
}

export interface CreateBarberData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  specialties?: string[];
  photoURL?: string;
  bio?: string;
}

/**
 * Busca todos os barbeiros do dono logado
 */
export async function getBarbers(): Promise<Barber[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const token = await user.getIdToken();
  const response = await fetch('/api/admin/barbers', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar barbeiros');
  }

  const data = await response.json();
  return data.barbers;
}

/**
 * Cria um novo barbeiro
 */
export async function createBarber(barberData: CreateBarberData): Promise<Barber> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const token = await user.getIdToken();
  const response = await fetch('/api/admin/barbers/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(barberData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar barbeiro');
  }

  const data = await response.json();
  return data.barber;
}

/**
 * Atualiza status (isActive) de um barbeiro
 */
export async function updateBarberStatus(barberId: string, isActive: boolean): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const token = await user.getIdToken();
  const response = await fetch(`/api/admin/barbers/${barberId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar barbeiro');
  }
}

/**
 * Deleta um barbeiro
 */
export async function deleteBarber(barberId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const token = await user.getIdToken();
  const response = await fetch(`/api/admin/barbers/${barberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar barbeiro');
  }
}

/**
 * Busca barbeiros ativos de um estabelecimento (para agendamento público)
 */
export async function getActiveBarbersBySlug(slug: string): Promise<Barber[]> {
  const response = await fetch(`/api/public/barbers/${slug}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar barbeiros');
  }

  const data = await response.json();
  return data.barbers || [];
}
