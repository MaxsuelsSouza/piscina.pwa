/**
 * Serviço para gerenciar tokens FCM dos usuários no Firestore
 */

import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config';

const FCM_TOKENS_COLLECTION = 'fcmTokens';

export interface FCMTokenDocument {
  userId: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
  };
}

/**
 * Salva ou atualiza o token FCM do usuário
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, FCM_TOKENS_COLLECTION, `${userId}_${token.substring(0, 20)}`);

    const deviceInfo = typeof window !== 'undefined' ? {
      userAgent: window.navigator.userAgent,
      platform: window.navigator.platform,
    } : undefined;

    const tokenData: FCMTokenDocument = {
      userId,
      token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceInfo,
    };

    await setDoc(tokenRef, tokenData, { merge: true });
    console.log('Token FCM salvo com sucesso');
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error);
    throw error;
  }
}

/**
 * Busca todos os tokens de um usuário
 */
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const tokensRef = collection(db, FCM_TOKENS_COLLECTION);
    const q = query(tokensRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data().token);
  } catch (error) {
    console.error('Erro ao buscar tokens FCM:', error);
    return [];
  }
}

/**
 * Busca todos os tokens de administradores
 */
export async function getAdminFCMTokens(): Promise<string[]> {
  try {
    // Busca todos os tokens de usuários com role 'admin'
    // Nota: você precisará de um índice composto no Firestore para essa query
    const tokensRef = collection(db, FCM_TOKENS_COLLECTION);
    const querySnapshot = await getDocs(tokensRef);

    // Filtra tokens de admins (você pode melhorar isso com uma query direta se tiver o campo role no token)
    const tokens: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Por enquanto, retorna todos os tokens
      // TODO: Filtrar apenas admins quando tiver o campo role
      tokens.push(data.token);
    });

    return tokens;
  } catch (error) {
    console.error('Erro ao buscar tokens de admin:', error);
    return [];
  }
}
