'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

const ASKED_KEY = 'notifications-asked';

export function NotificationSetup() {
  const { user, loading } = useAuth();
  const { permission, requestPermission } = useNotifications();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const alreadyAsked = localStorage.getItem(ASKED_KEY);
    if (alreadyAsked) return;

    if (Notification.permission === 'default') {
      setShow(true);
    }
  }, [user, loading]);

  // Hide if permission changed externally
  useEffect(() => {
    if (permission !== 'default') {
      setShow(false);
    }
  }, [permission]);

  const handleAllow = async () => {
    localStorage.setItem(ASKED_KEY, '1');
    await requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(ASKED_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Ativar lembretes?
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Receba avisos quando seus tratamentos estiverem disponiveis.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAllow}
                className="px-3 py-1.5 text-xs font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition"
              >
                Ativar
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
              >
                Agora nao
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
