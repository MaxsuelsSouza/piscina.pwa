/**
 * Componente para solicitar permissão de notificações push
 */

'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationPrompt() {
  const { user } = useAuth();
  const { permission, requestPermission, isSupported, loading } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Mostra o prompt apenas para admins que ainda não deram permissão
  useEffect(() => {
    if (!user || !isSupported) return;

    // Verifica se já foi dismissed nesta sessão
    const wasDismissed = sessionStorage.getItem('notificationPromptDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Mostra o prompt se ainda não tem permissão
    if (permission === 'default') {
      // Espera 2 segundos antes de mostrar o prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, permission, isSupported]);

  const handleAccept = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!showPrompt || dismissed || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Ativar Notificações
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Receba alertas instantâneos quando novos agendamentos forem feitos, mesmo com o navegador fechado.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ativando...' : 'Ativar'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
