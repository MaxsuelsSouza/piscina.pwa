'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/workspace');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    if (!password) {
      setError('Digite sua senha');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-stone-800">Lista de Casa Nova</h1>
          <p className="text-stone-400 text-sm mt-2">Acesso Admin</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                autoFocus
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Senha"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-sm text-stone-400 hover:text-stone-600 transition"
            >
              Voltar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
