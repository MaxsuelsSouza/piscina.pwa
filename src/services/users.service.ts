/**
 * Serviço client-side para gerenciar usuários
 */

import { auth } from '@/lib/firebase/config';
import type { AppUser, CreateUserData } from '@/types/user';

export interface CreateUserResponse {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    role: string;
  };
  error?: string;
}

export interface ListUsersResponse {
  success: boolean;
  users?: AppUser[];
  error?: string;
}

export interface ToggleUserStatusResponse {
  success: boolean;
  error?: string;
}

export interface UpdateDueDateResponse {
  success: boolean;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
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
 * Cria um novo usuário (apenas admin)
 */
export async function createUser(
  data: CreateUserData
): Promise<CreateUserResponse> {
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

    return result;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return {
      success: false,
      error: 'Erro ao criar usuário. Tente novamente.',
    };
  }
}

/**
 * Lista todos os usuários (apenas admin)
 */
export async function listUsers(): Promise<ListUsersResponse> {
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

    return result;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return {
      success: false,
      error: 'Erro ao listar usuários. Tente novamente.',
    };
  }
}

/**
 * Ativa ou desativa um usuário (apenas admin)
 */
export async function toggleUserStatus(
  uid: string,
  isActive: boolean
): Promise<ToggleUserStatusResponse> {
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

    return result;
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    return {
      success: false,
      error: 'Erro ao atualizar status. Tente novamente.',
    };
  }
}

/**
 * Atualiza a data de vencimento da assinatura (apenas admin)
 */
export async function updateSubscriptionDueDate(
  uid: string,
  subscriptionDueDate: Date
): Promise<UpdateDueDateResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Você precisa estar autenticado',
      };
    }

    const response = await fetch('/api/admin/users/update-due-date', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid, subscriptionDueDate: subscriptionDueDate.toISOString() }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao atualizar data de vencimento',
      };
    }

    return result;
  } catch (error) {
    console.error('Erro ao atualizar data de vencimento:', error);
    return {
      success: false,
      error: 'Erro ao atualizar data de vencimento. Tente novamente.',
    };
  }
}

/**
 * Envia email de redefinição de senha para um usuário (apenas admin)
 * Usa o Firebase Client SDK que envia o email automaticamente
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<ResetPasswordResponse> {
  try {
    // Verifica se o usuário atual é admin
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
    // O Firebase envia o email automaticamente
    await sendPasswordReset(email);

    return {
      success: true,
      message: 'Email de redefinição de senha enviado com sucesso!',
    };
  } catch (error: any) {
    console.error('Erro ao enviar email de redefinição:', error);

    let errorMessage = 'Erro ao enviar email de redefinição. Tente novamente.';

    // Mensagens de erro específicas do Firebase
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
