'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { isAdmin } from '@/config/admin';

export default function RootPage() {
  const router = useRouter();
  const { client, loading } = useClientAuth();

  useEffect(() => {
    if (!loading) {
      if (!client) {
        // Nao autenticado - vai para login
        router.replace('/login');
      } else if (isAdmin(client.phone)) {
        // Admin - vai para workspace
        router.replace('/workspace');
      } else {
        // Convidado - vai para presentes
        router.replace('/presentes');
      }
    }
  }, [client, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
    </div>
  );
}
