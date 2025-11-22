/**
 * Serviço para gerenciar tokens FCM usando Firebase Admin SDK
 * Este arquivo deve ser usado APENAS em API routes (server-side)
 */

import { adminDb } from '../admin';

const FCM_TOKENS_COLLECTION = 'fcmTokens';
const USERS_COLLECTION = 'users';

/**
 * Busca todos os tokens FCM de usuários admin
 */
export async function getAdminFCMTokens(): Promise<string[]> {
  try {
    const db = adminDb();

    // Primeiro, busca todos os usuários admin
    const usersRef = db.collection(USERS_COLLECTION);
    const adminUsersSnapshot = await usersRef
      .where('role', '==', 'admin')
      .where('isActive', '==', true)
      .get();

    if (adminUsersSnapshot.empty) {
      return [];
    }

    // Pega os UIDs dos admins
    const adminUids = adminUsersSnapshot.docs.map((doc) => doc.data().uid);

    // Busca todos os tokens FCM
    const tokensRef = db.collection(FCM_TOKENS_COLLECTION);
    const tokensSnapshot = await tokensRef.get();

    // Filtra tokens que pertencem a admins
    const adminTokens: string[] = [];
    tokensSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (adminUids.includes(data.userId)) {
        adminTokens.push(data.token);
      }
    });

    return adminTokens;
  } catch (error) {
    return [];
  }
}

/**
 * Busca tokens FCM de um usuário específico
 */
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const db = adminDb();
    const tokensRef = db.collection(FCM_TOKENS_COLLECTION);

    const tokensSnapshot = await tokensRef
      .where('userId', '==', userId)
      .get();

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token as string);

    return tokens;
  } catch (error) {
    return [];
  }
}
