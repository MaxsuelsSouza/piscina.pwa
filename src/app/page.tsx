'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) router.replace(user ? '/workspace' : '/login');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950">
      <div className="w-6 h-6 border-2 border-stone-700 border-t-stone-300 rounded-full animate-spin" />
    </div>
  );
}
