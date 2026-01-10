/**
 * Serviço para gerenciar usuários no Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { AppUser, UserDocument } from '@/types/user';
import { userDocumentToAppUser, appUserToUserDocument, generateSlug } from '@/types/user';

const USERS_COLLECTION = 'users';

/**
 * Cria ou atualiza um documento de usuário no Firestore
 */
export async function createUserDocument(
  uid: string,
  email: string,
  role: 'admin' | 'client' = 'client',
  displayName?: string,
  createdBy?: string
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);

  const userData: UserDocument = {
    uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    createdBy,
  };

  await setDoc(userRef, userData);
}

/**
 * Busca um usuário pelo UID
 */
export async function getUserByUid(uid: string): Promise<AppUser | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return userDocumentToAppUser(userSnap.data() as UserDocument);
  } catch (error) {
    throw error;
  }
}

/**
 * Busca um usuário pelo email
 */
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return userDocumentToAppUser(userDoc.data() as UserDocument);
  } catch (error) {
    throw error;
  }
}

/**
 * Lista todos os usuários
 */
export async function getAllUsers(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      userDocumentToAppUser(doc.data() as UserDocument)
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Lista apenas usuários ativos
 */
export async function getActiveUsers(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      userDocumentToAppUser(doc.data() as UserDocument)
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza um usuário
 */
export async function updateUser(
  uid: string,
  data: Partial<Omit<AppUser, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Busca o usuário atual para verificar se o businessName mudou
    const currentUserSnap = await getDoc(userRef);
    const currentUser = currentUserSnap.exists() ? currentUserSnap.data() as UserDocument : null;

    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Regenera o publicSlug se o businessName mudou e o usuário for cliente
    if (
      currentUser &&
      currentUser.role === 'client' &&
      data.businessName &&
      data.businessName !== currentUser.businessName
    ) {
      const newSlug = generateSlug(
        data.displayName || currentUser.displayName,
        currentUser.email,
        data.businessName
      );
      updateData.publicSlug = newSlug;
    }

    // Converte subscriptionDueDate de Date para string ISO se for Date
    if (updateData.subscriptionDueDate && updateData.subscriptionDueDate instanceof Date) {
      updateData.subscriptionDueDate = updateData.subscriptionDueDate.toISOString();
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    throw error;
  }
}

/**
 * Desativa um usuário (soft delete)
 */
export async function deactivateUser(uid: string): Promise<void> {
  try {
    await updateUser(uid, { isActive: false });
  } catch (error) {
    throw error;
  }
}

/**
 * Ativa um usuário
 */
export async function activateUser(uid: string): Promise<void> {
  try {
    await updateUser(uid, { isActive: true });
  } catch (error) {
    throw error;
  }
}

/**
 * Deleta permanentemente um usuário do Firestore
 * ATENÇÃO: Isso não remove o usuário do Firebase Auth
 */
export async function deleteUserDocument(uid: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza perfil do usuário usando notação de ponto do Firestore
 * Isso permite atualizar campos aninhados sem sobrescrever objetos pai
 */
export async function updateUserProfileWithDotNotation(
  uid: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Busca o usuário atual para verificar se o businessName mudou
    const currentUserSnap = await getDoc(userRef);
    const currentUser = currentUserSnap.exists() ? currentUserSnap.data() as UserDocument : null;

    // Remove campos undefined (Firestore ignora undefined, mas é melhor filtrar)
    const cleanData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    const updateData: Record<string, any> = {
      ...cleanData,
      updatedAt: new Date().toISOString(),
    };

    // Regenera o publicSlug se o businessName mudou e o usuário for cliente
    if (
      currentUser &&
      currentUser.role === 'client' &&
      data.businessName &&
      data.businessName !== currentUser.businessName
    ) {
      const newSlug = generateSlug(
        data.displayName || currentUser.displayName,
        currentUser.email,
        data.businessName
      );
      updateData.publicSlug = newSlug;
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar perfil com notação de ponto:', error);
    throw error;
  }
}

// Aliases for compatibility
export const getUserById = getUserByUid;
export const updateUserProfile = updateUser;
