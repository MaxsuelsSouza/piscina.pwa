/**
 * Login Page
 * Rota: /login
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { sanitizeEmail } from '@/lib/security/input-sanitizer';
import { rateLimiter, RATE_LIMIT_CONFIGS, formatBlockedTime } from '@/lib/security/rate-limiter';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (user && !authLoading && userData) {
      // Verifica se precisa trocar senha
      if (userData.mustChangePassword) {
        router.push('/change-password');
        return;
      }

      // Usa o parâmetro redirect da URL se existir
      const redirectParam = searchParams.get('redirect');

      if (redirectParam) {
        router.push(redirectParam);
      } else {
        // Admin vai para painel admin, clientes vão para /admin
        if (userData.role === 'admin') {
          router.push('/admin/painel');
        } else {
          router.push('/admin');
        }
      }
    }
  }, [user, userData, authLoading, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verifica rate limiting
    const rateLimitKey = `login:${email}`;
    const rateLimitResult = rateLimiter.attempt(rateLimitKey, RATE_LIMIT_CONFIGS.login);

    if (!rateLimitResult.allowed) {
      const timeRemaining = rateLimitResult.blockedUntil
        ? formatBlockedTime(rateLimitResult.blockedUntil)
        : '30 minutos';
      setError(`Muitas tentativas de login. Tente novamente em ${timeRemaining}.`);
      return;
    }

    // Mostra aviso se está próximo do limite
    if (rateLimitResult.remainingAttempts <= 2 && rateLimitResult.remainingAttempts > 0) {
      setError(`Atenção: Restam apenas ${rateLimitResult.remainingAttempts} tentativa(s) antes do bloqueio temporário.`);
    }

    setLoading(true);

    try {
      await login(email, password);
      // Login bem-sucedido - reseta o rate limit
      rateLimiter.reset(rateLimitKey);
      // O redirecionamento será feito pelo useEffect acima
    } catch (err: any) {

      // Mensagens de erro amigáveis
      let errorMessage = 'Erro ao fazer login';

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou senha incorretos';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Esta conta foi desabilitada';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-3 sm:mb-4 shadow-lg">
          <svg className="w-8 h-8 sm:w-9 sm:h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {/* Sol */}
            <circle cx="12" cy="8" r="3" fill="currentColor" />
            {/* Raios do sol */}
            <line x1="12" y1="2" x2="12" y2="3.5" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16.5" y1="4.5" x2="15.5" y2="5.5" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="8" x2="16.5" y2="8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7.5" y1="4.5" x2="8.5" y2="5.5" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="8" x2="7.5" y2="8" strokeWidth="1.5" strokeLinecap="round" />
            {/* Ondas de água */}
            <path d="M 3 15 Q 5 13.5 7 15 T 11 15 T 15 15 T 19 15 T 21 15" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 3 18 Q 5 16.5 7 18 T 11 18 T 15 18 T 19 18 T 21 18" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 3 21 Q 5 19.5 7 21 T 11 21 T 15 21 T 19 21 T 21 21" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Piscina</h1>
        <p className="text-xs sm:text-sm text-gray-500">Bem-vindo de volta</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
            className={cn(
              'w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-all',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
            )}
            placeholder="seu@email.com"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-all pr-10',
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
              )}
              placeholder="Digite sua senha"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
