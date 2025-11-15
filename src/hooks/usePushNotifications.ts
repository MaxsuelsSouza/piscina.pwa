/**
 * Hook para gerenciar notificações push
 */

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener, isMessagingSupported } from '@/lib/firebase/messaging';
import { saveFCMToken } from '@/lib/firebase/firestore/fcmTokens';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Verifica o status da permissão de notificação
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Verifica suporte a notificações
  const isSupported = typeof window !== 'undefined' && isMessagingSupported();

  /**
   * Solicita permissão e obtém o token FCM
   */
  const requestPermission = useCallback(async () => {
    if (loading || !isSupported) return;

    setLoading(true);
    try {
      const fcmToken = await requestNotificationPermission();

      if (fcmToken) {
        setToken(fcmToken);
        setPermission('granted');

        // Salva o token no Firestore se o usuário estiver autenticado
        if (user?.uid) {
          await saveFCMToken(user.uid, fcmToken);
          console.log('Token FCM salvo para o usuário:', user.uid);
        }
      } else {
        setPermission('denied');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loading, isSupported]);

  /**
   * Escuta mensagens em primeiro plano
   */
  useEffect(() => {
    if (!isSupported || permission !== 'granted') return;

    const unsubscribe = onMessageListener((payload) => {
      console.log('Notificação recebida:', payload);

      // Mostra notificação no navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        const { title, body, icon } = payload.notification || {};

        new Notification(title || 'Nova notificação', {
          body: body || '',
          icon: icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: payload.data?.bookingId || 'notification',
          requireInteraction: true,
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [permission, isSupported]);

  /**
   * Registra o token quando o usuário faz login
   */
  useEffect(() => {
    if (user?.uid && token && permission === 'granted' && isSupported) {
      saveFCMToken(user.uid, token).catch((error) => {
        console.error('Erro ao salvar token FCM:', error);
      });
    }
  }, [user, token, permission, isSupported]);

  return {
    permission,
    token,
    loading,
    requestPermission,
    isSupported,
  };
}
