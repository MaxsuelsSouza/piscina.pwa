/**
 * Serviço para gerenciar notificações usando Firebase Admin SDK
 * Este arquivo deve ser usado APENAS em API routes (server-side)
 */

import { adminDb } from '../admin';

const NOTIFICATIONS_COLLECTION = 'notifications';

export interface NotificationDocument {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

/**
 * Salva uma notificação para um usuário específico
 */
export async function saveNotificationForUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const db = adminDb();
    const notificationData: NotificationDocument = {
      userId,
      title,
      body,
      data,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await db.collection(NOTIFICATIONS_COLLECTION).add(notificationData);
  } catch (error) {
    throw error;
  }
}

/**
 * Salva notificações para múltiplos usuários
 */
export async function saveNotificationsForUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const db = adminDb();
    const batch = db.batch();

    userIds.forEach((userId) => {
      const notificationData: NotificationDocument = {
        userId,
        title,
        body,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      };

      const newDocRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
      batch.set(newDocRef, notificationData);
    });

    await batch.commit();
  } catch (error) {
    throw error;
  }
}
