/**
 * Hook para gerenciar notificações do usuário
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  onNotificationsChange,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  saveNotification,
  type NotificationDocument,
} from '@/lib/firebase/firestore/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Escuta mudanças nas notificações em tempo real
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onNotificationsChange(user.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Marca uma notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marca todas as notificações como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await markAllNotificationsAsRead(user.uid);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [user]);

  // Deleta todas as notificações
  const deleteAll = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await deleteAllNotifications(user.uid);
    } catch (error) {
      console.error('Erro ao deletar todas as notificações:', error);
      throw error;
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteAll,
  };
}
