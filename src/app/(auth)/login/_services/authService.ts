/**
 * Serviço de Autenticação com Firebase
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { LoginCredentials, LoginResponse, RegisterCredentials } from '../_types';

/**
 * Converte User do Firebase para formato da aplicação
 */
function userToResponse(firebaseUser: User): LoginResponse {
  return {
    success: true,
    user: {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || '',
      email: firebaseUser.email || '',
    },
    token: '', // Token é gerenciado automaticamente pelo Firebase
  };
}

/**
 * Faz login com email e senha usando Firebase Authentication
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    console.log('🔐 Tentando fazer login com:', credentials.email);
    console.log('🔥 Auth object:', auth ? 'OK' : 'UNDEFINED');

    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    console.log('✅ Login bem-sucedido:', userCredential.user.email);
    return userToResponse(userCredential.user);
  } catch (error: any) {
    console.error('❌ Erro ao fazer login:', error);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Mensagem do erro:', error.message);

    // Mensagens de erro amigáveis
    let message = 'Erro ao fazer login';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Email ou senha incorretos';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/user-disabled':
        message = 'Esta conta foi desabilitada';
        break;
      case 'auth/too-many-requests':
        message = 'Muitas tentativas. Tente novamente mais tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Erro de conexão. Verifique sua internet';
        break;
      default:
        message = error.message || 'Erro ao fazer login';
    }

    return {
      success: false,
      message,
    };
  }
}

/**
 * Registra novo usuário usando Firebase Authentication
 */
export async function register(credentials: RegisterCredentials): Promise<LoginResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    // Atualiza o perfil com o nome
    await updateProfile(userCredential.user, {
      displayName: credentials.name,
    });

    return userToResponse(userCredential.user);
  } catch (error: any) {
    console.error('Erro ao registrar:', error);

    let message = 'Erro ao criar conta';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este email já está cadastrado';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/weak-password':
        message = 'Senha muito fraca. Use no mínimo 6 caracteres';
        break;
      case 'auth/network-request-failed':
        message = 'Erro de conexão. Verifique sua internet';
        break;
      default:
        message = error.message || 'Erro ao criar conta';
    }

    return {
      success: false,
      message,
    };
  }
}

/**
 * Faz logout do Firebase
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

/**
 * Retorna o usuário atual
 */
export function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    id: user.uid,
    name: user.displayName || '',
    email: user.email || '',
  };
}
