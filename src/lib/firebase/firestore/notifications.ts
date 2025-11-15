/**
 * Serviço para gerenciar notificações do usuário no Firestore
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';

const NOTIFICATIONS_COLLECTION = 'notifications';

export interface NotificationDocument {
  id?: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

/**
 * Salva uma nova notificação no Firestore
 */
export async function saveNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const notificationData: Omit<NotificationDocument, 'id'> = {
      userId,
      title,
      body,
      data,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
    throw error;
  }
}

/**
 * Busca todas as notificações de um usuário
 */
export async function getUserNotifications(
  userId: string,
  limitCount: number = 50
): Promise<NotificationDocument[]> {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as NotificationDocument));
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
}

/**
 * Escuta mudanças nas notificações do usuário em tempo real
 */
export function onNotificationsChange(
  userId: string,
  callback: (notifications: NotificationDocument[]) => void,
  limitCount: number = 50
) {
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as NotificationDocument));

    callback(notifications);
  });
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
}

/**
 * Marca todas as notificações de um usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);

    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw error;
  }
}

/**
 * Conta o número de notificações não lidas
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return 0;
  }
}

/**
 * Deleta todas as notificações de um usuário
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
    console.log(`Todas as notificações do usuário ${userId} foram deletadas`);
  } catch (error) {
    console.error('Erro ao deletar todas as notificações:', error);
    throw error;
  }
}
