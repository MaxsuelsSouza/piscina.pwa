'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ScheduledNotification {
  id: string;
  module: string;
  title: string;
  body: string;
  scheduledFor: string; // ISO timestamp
  link?: string;
}

const STORAGE_KEY = 'scheduled-notifications';

function getStoredNotifications(): ScheduledNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledNotification[];
  } catch {
    return [];
  }
}

function setStoredNotifications(notifications: ScheduledNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

async function fireNotification(notification: ScheduledNotification) {
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: notification.id,
    data: { link: notification.link },
    vibrate: [200, 100, 200],
  };

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(notification.title, options);
      return;
    }
  } catch {
    // fallback below
  }

  new Notification(notification.title, options);
}

function checkAndFirePending() {
  const now = Date.now();
  const stored = getStoredNotifications();
  const remaining: ScheduledNotification[] = [];

  for (const n of stored) {
    if (new Date(n.scheduledFor).getTime() <= now) {
      fireNotification(n);
    } else {
      remaining.push(n);
    }
  }

  if (remaining.length !== stored.length) {
    setStoredNotifications(remaining);
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setPermission(Notification.permission);

    // Check pending on mount
    if (Notification.permission === 'granted') {
      checkAndFirePending();
    }

    // Poll every 60s
    intervalRef.current = setInterval(() => {
      if (Notification.permission === 'granted') {
        checkAndFirePending();
      }
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      checkAndFirePending();
    }

    return result;
  }, []);

  const schedule = useCallback((notification: Omit<ScheduledNotification, 'id'> & { id?: string }) => {
    const entry: ScheduledNotification = {
      ...notification,
      id: notification.id || `${notification.module}-${Date.now()}`,
    };

    const stored = getStoredNotifications();
    // Replace if same id exists
    const filtered = stored.filter((n) => n.id !== entry.id);
    filtered.push(entry);
    setStoredNotifications(filtered);
  }, []);

  const cancel = useCallback((id: string) => {
    const stored = getStoredNotifications();
    setStoredNotifications(stored.filter((n) => n.id !== id));
  }, []);

  const cancelByModule = useCallback((module: string) => {
    const stored = getStoredNotifications();
    setStoredNotifications(stored.filter((n) => n.module !== module));
  }, []);

  return {
    permission,
    requestPermission,
    schedule,
    cancel,
    cancelByModule,
  };
}
