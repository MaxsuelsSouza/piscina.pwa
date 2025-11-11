/**
 * Tipos para a página de gerenciamento de usuários
 */

import type { AppUser, VenueLocation, VenueInfo } from '@/types/user';

export type { AppUser };

/**
 * Dados para criação de novo usuário
 */
export interface CreateUserFormData {
  email: string;
  password: string;
  displayName?: string;
  businessName?: string; // Nome do estabelecimento/espaço
  role: 'client' | 'admin';

  // FASE 1 - Dados de localização e informações
  location?: VenueLocation;
  venueInfo?: VenueInfo;
}

/**
 * Estado do formulário de criação
 */
export interface UserFormState {
  email: string;
  password: string;
  displayName: string;
  businessName: string; // Nome do estabelecimento
  role: 'client' | 'admin';
}

/**
 * Props para componentes de usuário
 */
export interface UserListProps {
  users: AppUser[];
  loading: boolean;
  onToggleStatus: (uid: string, currentStatus: boolean) => void;
  onResetPassword: (email: string) => void;
  onRefresh: () => void;
}

export interface UserFormProps {
  onSubmit: (data: CreateUserFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
}
