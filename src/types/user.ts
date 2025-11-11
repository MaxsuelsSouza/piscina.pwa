/**
 * Tipos para usuários do sistema
 */

export type UserRole = 'admin' | 'client';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string; // Nome da pessoa (ex: "João Silva")
  businessName?: string; // Nome do estabelecimento/espaço (ex: "Muca Fest", "Max Fest")
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
  businessName?: string; // Nome do estabelecimento
  role?: UserRole;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string; // Nome da pessoa
  businessName?: string; // Nome do estabelecimento
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
export function userDocumentToAppUser(doc: UserDocument | any): AppUser {
  try {
    // Função auxiliar para converter timestamps do Firestore ou strings ISO para Date
    const convertToDate = (value: any): Date => {
      if (!value) {
        return new Date();
      }

      // Se for um Timestamp do Firestore (tem _seconds)
      if (value && typeof value === 'object' && '_seconds' in value) {
        return new Date(value._seconds * 1000);
      }

      // Se for um Timestamp do Firestore Admin SDK (tem toDate)
      if (value && typeof value === 'object' && 'toDate' in value) {
        return value.toDate();
      }

      // Se for uma string ISO ou número
      return new Date(value);
    };

    const createdAt = convertToDate(doc.createdAt);
    const updatedAt = convertToDate(doc.updatedAt);
    const subscriptionDueDate = doc.subscriptionDueDate ? convertToDate(doc.subscriptionDueDate) : undefined;

    // Verifica se as datas são válidas
    if (isNaN(createdAt.getTime())) {
      console.warn('Data de criação inválida para usuário:', doc.uid);
    }
    if (isNaN(updatedAt.getTime())) {
      console.warn('Data de atualização inválida para usuário:', doc.uid);
    }

    return {
      uid: doc.uid,
      email: doc.email,
      displayName: doc.displayName,
      businessName: doc.businessName,
      role: doc.role,
      createdAt,
      updatedAt,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      publicSlug: doc.publicSlug,
      subscriptionDueDate,
      mustChangePassword: doc.mustChangePassword,
    };
  } catch (error) {
    console.error('Erro ao converter UserDocument para AppUser:', error);
    console.error('Documento problemático:', doc);
    throw error;
  }
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
