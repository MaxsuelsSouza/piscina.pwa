/**
 * Configuração do Firebase Cloud Messaging para notificações push
 */

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { app } from './config';

let messaging: Messaging | null = null;

/**
 * Verifica se o navegador suporta notificações
 */
export const isMessagingSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Verifica se o navegador suporta Service Workers
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  // Verifica se o navegador suporta Notifications
  if (!('Notification' in window)) {
    return false;
  }

  // Verifica se está em contexto seguro (HTTPS ou localhost)
  const isSecureContext = window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return isSecureContext;
};

/**
 * Inicializa o Firebase Messaging (apenas no cliente)
 */
export const initializeMessaging = (): Messaging | null => {
  if (!isMessagingSupported()) {
    console.log('Firebase Messaging não suportado neste ambiente');
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
    // Verifica se o ambiente suporta messaging
    if (!isMessagingSupported()) {
      console.log('Firebase Messaging não suportado neste ambiente');
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
  if (!isMessagingSupported()) {
    console.log('Messaging não suportado, não é possível escutar mensagens');
    return () => {};
  }

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
