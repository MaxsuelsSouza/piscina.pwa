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
import { userDocumentToAppUser, appUserToUserDocument } from '@/types/user';

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
    console.error('Erro ao buscar usuário:', error);
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
    console.error('Erro ao buscar usuário por email:', error);
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
    console.error('Erro ao listar usuários:', error);
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
    console.error('Erro ao listar usuários ativos:', error);
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

    const updateData: Partial<UserDocument> = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.createdAt) {
      delete (updateData as any).createdAt;
    }

    await updateDoc(userRef, updateData as any);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
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
    console.error('Erro ao desativar usuário:', error);
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
    console.error('Erro ao ativar usuário:', error);
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
    console.error('Erro ao deletar usuário:', error);
    throw error;
  }
}
