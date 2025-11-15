/**
 * Configuração do Firebase Cloud Messaging para notificações push
 */

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { app } from './config';

let messaging: Messaging | null = null;

/**
 * Inicializa o Firebase Messaging (apenas no cliente)
 */
export const initializeMessaging = (): Messaging | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Messaging:', error);
    return null;
  }
};

/**
 * Solicita permissão para notificações e retorna o token FCM
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Verifica se o navegador suporta notificações
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return null;
    }

    // Solicita permissão
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Inicializa messaging
    const messagingInstance = initializeMessaging();
    if (!messagingInstance) {
      console.error('Não foi possível inicializar o messaging');
      return null;
    }

    // Obtém o token FCM
    // IMPORTANTE: Você precisa configurar o VAPID key no Firebase Console
    // e adicionar como variável de ambiente NEXT_PUBLIC_FIREBASE_VAPID_KEY
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error('VAPID key não configurada');
      return null;
    }

    const token = await getToken(messagingInstance, { vapidKey });

    if (token) {
      console.log('Token FCM obtido:', token);
      return token;
    } else {
      console.log('Não foi possível obter o token FCM');
      return null;
    }
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return null;
  }
};

/**
 * Escuta mensagens em primeiro plano
 */
export const onMessageListener = (callback: (payload: any) => void) => {
  const messagingInstance = initializeMessaging();

  if (!messagingInstance) {
    console.error('Messaging não inicializado');
    return () => {};
  }

  return onMessage(messagingInstance, (payload) => {
    console.log('Mensagem recebida em primeiro plano:', payload);
    callback(payload);
  });
};
