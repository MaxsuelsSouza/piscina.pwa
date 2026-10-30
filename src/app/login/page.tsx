'use client';

/** Login por e-mail e senha (Firebase Auth). Depois de entrar, vai para o workspace. */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/workspace');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Digite seu e-mail');
    if (!password) return setError('Digite sua senha');

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError('E-mail ou senha incorretos');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-stone-300 rounded-full animate-spin" />
      </div>
    );
  }

  const campo =
    'w-full h-12 px-4 rounded-2xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500 outline-none focus:border-red-500 transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 p-5 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
          <p className="text-stone-400 text-sm mt-1">Acesse o seu workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <label className="sr-only" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="voce@email.com"
            className={campo}
            autoFocus
            autoComplete="email"
            disabled={isSubmitting}
          />
          <label className="sr-only" htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Senha"
            className={campo}
            autoComplete="current-password"
            disabled={isSubmitting}
          />

          {error && (
            <p role="alert" className="text-red-300 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-12 rounded-2xl bg-red-600 hover:bg-red-500 font-semibold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
