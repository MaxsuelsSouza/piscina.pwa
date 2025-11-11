/**
 * Tipos para usuários do sistema
 */

export type UserRole = 'admin' | 'client';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string; // UID do admin que criou este usuário
  publicSlug?: string; // Slug único para URL pública (ex: "joao-silva")
  subscriptionDueDate?: Date; // Data de vencimento da assinatura
  mustChangePassword?: boolean; // Força troca de senha no primeiro login
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string; // ISO string para serialização no Firestore
  updatedAt: string;
  isActive: boolean;
  createdBy?: string;
  publicSlug?: string; // Slug único para URL pública
  subscriptionDueDate?: string; // Data de vencimento da assinatura (ISO string)
  mustChangePassword?: boolean; // Força troca de senha no primeiro login
}

/**
 * Converte UserDocument do Firestore para AppUser
 */
export function userDocumentToAppUser(doc: UserDocument): AppUser {
  return {
    ...doc,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    subscriptionDueDate: doc.subscriptionDueDate ? new Date(doc.subscriptionDueDate) : undefined,
  };
}

/**
 * Converte AppUser para UserDocument (para salvar no Firestore)
 */
export function appUserToUserDocument(user: AppUser): UserDocument {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    subscriptionDueDate: user.subscriptionDueDate?.toISOString(),
  };
}

/**
 * Gera um slug único a partir do nome ou email
 */
export function generateSlug(displayName: string | undefined, email: string): string {
  const base = displayName || email.split('@')[0];

  // Remove acentos e caracteres especiais
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Adiciona timestamp para garantir unicidade
  const timestamp = Date.now().toString(36).slice(-4);

  return `${slug}-${timestamp}`;
}
