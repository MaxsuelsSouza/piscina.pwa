"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallControl() {
  const { user } = useAuth();
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;

      // Sempre previne o prompt padrão
      e.preventDefault();

      // Verifica se o usuário está logado
      if (!user) {
        return;
      }

      // Se estiver logado, armazena o evento para uso posterior
      deferredPromptRef.current = installEvent;

      // Permite que o navegador mostre o prompt automaticamente
      // para usuários autenticados
      setTimeout(() => {
        if (deferredPromptRef.current && user) {
          deferredPromptRef.current.prompt().catch((error) => {
          });
        }
      }, 1000);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
    };

    // Registra os event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [user]);

  return null;
}
