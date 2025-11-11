/**
 * Serviços para gerenciamento de usuários na interface admin
 */

import { auth } from '@/lib/firebase/config';
import type { AppUser } from '@/types/user';
import type { CreateUserFormData } from '../_types';

export interface ServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtém o token de autenticação do usuário atual
 */
async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }

  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
}

/**
 * Lista todos os usuários
 */
export async function fetchUsers(): Promise<ServiceResponse<AppUser[]>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar autenticado para listar usuários',
      };
    }

    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao listar usuários',
      };
    }

    return {
      success: true,
      data: result.users,
    };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return {
      success: false,
      error: 'Erro ao listar usuários. Tente novamente.',
    };
  }
}

/**
 * Cria um novo usuário
 */
export async function createNewUser(
  data: CreateUserFormData
): Promise<ServiceResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar autenticado para criar usuários',
      };
    }

    const response = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao criar usuário',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return {
      success: false,
      error: 'Erro ao criar usuário. Tente novamente.',
    };
  }
}

/**
 * Alterna o status de um usuário (ativo/inativo)
 */
export async function toggleStatus(
  uid: string,
  isActive: boolean
): Promise<ServiceResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar autenticado',
      };
    }

    const response = await fetch('/api/admin/users/toggle-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid, isActive }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao atualizar status do usuário',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    return {
      success: false,
      error: 'Erro ao atualizar status. Tente novamente.',
    };
  }
}

/**
 * Envia email de redefinição de senha
 */
export async function resetUserPassword(email: string): Promise<ServiceResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar autenticado',
      };
    }

    // Importa dinamicamente o authService para evitar problemas de SSR
    const { sendPasswordReset } = await import('@/lib/firebase/auth/authService');

    // Envia o email de redefinição usando Firebase Client SDK
    await sendPasswordReset(email);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Erro ao enviar email de redefinição:', error);

    let errorMessage = 'Erro ao enviar email de redefinição. Tente novamente.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
