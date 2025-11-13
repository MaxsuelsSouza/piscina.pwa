/**
 * Serviço para gerenciar usuários no Firestore usando Firebase Admin SDK
 * Este arquivo deve ser usado APENAS em API routes (server-side)
 */

import { adminDb } from '../../firebase/admin';
import type { AppUser, UserDocument, VenueLocation, VenueInfo } from '@/types/user';
import { userDocumentToAppUser } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Cria ou atualiza um documento de usuário no Firestore (Admin)
 */
export async function createUserDocument(
  uid: string,
  email: string,
  role: 'admin' | 'client' = 'client',
  displayName?: string,
  createdBy?: string,
  publicSlug?: string,
  businessName?: string,
  location?: VenueLocation,
  venueInfo?: VenueInfo
): Promise<void> {
  const db = adminDb();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);

  // Define data de vencimento para 30 dias no futuro (apenas para clientes)
  const subscriptionDueDate = role === 'client'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const userData: any = {
    uid,
    email,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    mustChangePassword: true, // Força troca de senha no primeiro login
  };

  // Adiciona campos opcionais apenas se tiverem valor
  if (displayName) userData.displayName = displayName;
  if (businessName) userData.businessName = businessName;
  if (createdBy) userData.createdBy = createdBy;
  if (publicSlug) userData.publicSlug = publicSlug;
  if (subscriptionDueDate) userData.subscriptionDueDate = subscriptionDueDate;
  if (location) userData.location = location;
  if (venueInfo) userData.venueInfo = venueInfo;

  await userRef.set(userData);
}

/**
 * Busca um usuário pelo UID (Admin)
 */
export async function getUserByUid(uid: string): Promise<AppUser | null> {
  try {
    const db = adminDb();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return null;
    }

    return userDocumentToAppUser(userSnap.data() as UserDocument);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

/**
 * Busca um usuário pelo email (Admin)
 */
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  try {
    const db = adminDb();
    const usersRef = db.collection(USERS_COLLECTION);
    const querySnapshot = await usersRef.where('email', '==', email).get();

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return userDocumentToAppUser(userDoc.data() as UserDocument);
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    throw error;
  }
}

/**
 * Busca um usuário pelo slug público (Admin)
 */
export async function getUserBySlug(slug: string): Promise<AppUser | null> {
  try {
    const db = adminDb();
    const usersRef = db.collection(USERS_COLLECTION);

    // Normaliza o slug para busca (lowercase)
    const normalizedSlug = slug.toLowerCase().trim();

    const querySnapshot = await usersRef.where('publicSlug', '==', normalizedSlug).get();

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as UserDocument;

    return userDocumentToAppUser(userData);
  } catch (error: any) {
    console.error('Erro ao buscar usuário por slug:', error);
    throw error;
  }
}

/**
 * Lista todos os usuários (Admin)
 */
export async function getAllUsers(): Promise<AppUser[]> {
  try {
    const db = adminDb();
    const usersRef = db.collection(USERS_COLLECTION);
    const querySnapshot = await usersRef.orderBy('createdAt', 'desc').get();

    return querySnapshot.docs.map((doc) => {
      try {
        const userData = doc.data() as UserDocument;
        return userDocumentToAppUser(userData);
      } catch (error) {
        console.error('Erro ao converter documento de usuário:', doc.id, error);
        console.error('Dados do documento:', doc.data());
        throw error;
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    console.error('Detalhes:', error.message, error.code);
    throw error;
  }
}

/**
 * Lista apenas usuários ativos (Admin)
 */
export async function getActiveUsers(): Promise<AppUser[]> {
  try {
    const db = adminDb();
    const usersRef = db.collection(USERS_COLLECTION);
    const querySnapshot = await usersRef
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return querySnapshot.docs.map((doc) =>
      userDocumentToAppUser(doc.data() as UserDocument)
    );
  } catch (error) {
    console.error('Erro ao listar usuários ativos:', error);
    throw error;
  }
}

/**
 * Lista apenas clientes ativos (Admin)
 */
export async function getAllActiveClients(): Promise<AppUser[]> {
  try {
    const db = adminDb();
    const usersRef = db.collection(USERS_COLLECTION);

    // Query simplificada sem orderBy para evitar necessidade de índice composto
    const querySnapshot = await usersRef
      .where('role', '==', 'client')
      .where('isActive', '==', true)
      .get();

    // Converte e ordena em memória
    const clients = querySnapshot.docs.map((doc) => {
      try {
        const userData = doc.data() as UserDocument;
        return userDocumentToAppUser(userData);
      } catch (error) {
        console.error('Erro ao converter documento de cliente:', doc.id, error);
        console.error('Dados do documento:', doc.data());
        throw error;
      }
    });

    // Ordena por data de criação em memória
    return clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Erro ao listar clientes ativos:', error);
    console.error('Detalhes:', error.message, error.code);
    throw error;
  }
}

/**
 * Atualiza um usuário (Admin)
 */
export async function updateUser(
  uid: string,
  data: Partial<Omit<AppUser, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const db = adminDb();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Converte subscriptionDueDate de Date para string ISO se for Date
    if (updateData.subscriptionDueDate && updateData.subscriptionDueDate instanceof Date) {
      updateData.subscriptionDueDate = updateData.subscriptionDueDate.toISOString();
    }

    await userRef.update(updateData);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

/**
 * Desativa um usuário (soft delete) (Admin)
 */
export async function deactivateUser(uid: string): Promise<void> {
  try {
    await updateUser(uid, { isActive: false });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    throw error;
  }
}

/**
 * Ativa um usuário (Admin)
 */
export async function activateUser(uid: string): Promise<void> {
  try {
    await updateUser(uid, { isActive: true });
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);
    throw error;
  }
}

/**
 * Deleta permanentemente um usuário do Firestore (Admin)
 * ATENÇÃO: Isso não remove o usuário do Firebase Auth
 */
export async function deleteUserDocument(uid: string): Promise<void> {
  try {
    const db = adminDb();
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    await userRef.delete();
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    throw error;
  }
}
