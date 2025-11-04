/**
 * Login Page
 * Rota: /login
 */

'use client';

import { useState } from 'react';
import { useAuth } from './_hooks/useAuth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register, loading, getError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register({ name, email, password, confirmPassword });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Dash Financeiro</h1>
          <p className="text-xs text-gray-400">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-8 mb-8 border-b border-gray-100">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'pb-3 text-sm font-medium transition-all relative',
                mode === 'login'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Entrar
              {mode === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                'pb-3 text-sm font-medium transition-all relative',
                mode === 'register'
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Criar conta
              {mode === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm outline-none transition-all',
                    'focus:bg-white focus:ring-1',
                    getError('email')
                      ? 'ring-1 ring-red-200 focus:ring-red-300'
                      : 'focus:ring-gray-900'
                  )}
                  placeholder="seu@email.com"
                  disabled={loading}
                />
                {getError('email') && (
                  <p className="mt-1.5 text-xs text-red-500">{getError('email')}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      'w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm outline-none transition-all pr-10',
                      'focus:bg-white focus:ring-1',
                      getError('password')
                        ? 'ring-1 ring-red-200 focus:ring-red-300'
                        : 'focus:ring-gray-900'
                    )}
                    placeholder="••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {getError('password') && (
                  <p className="mt-1.5 text-xs text-red-500">{getError('password')}</p>
                )}
              </div>

              {getError('general') && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">{getError('general')}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm outline-none transition-all',
                    'focus:bg-white focus:ring-1',
                    getError('name')
                      ? 'ring-1 ring-red-200 focus:ring-red-300'
                      : 'focus:ring-gray-900'
                  )}
                  placeholder="Seu nome"
                  disabled={loading}
                />
                {getError('name') && (
                  <p className="mt-1.5 text-xs text-red-500">{getError('name')}</p>
                )}
              </div>

              <div>
                <label htmlFor="email-register" className="block text-xs font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email-register"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm outline-none transition-all',
                    'focus:bg-white focus:ring-1',
                    getError('email')
                      ? 'ring-1 ring-red-200 focus:ring-red-300'
                      : 'focus:ring-gray-900'
                  )}
                  placeholder="seu@email.com"
                  disabled={loading}
                />
                {getError('email') && (
                  <p className="mt-1.5 text-xs text-red-500">{getError('email')}</p>
                )}
              </div>

              <div>
                <label htmlFor="password-register" className="block text-xs font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  id="password-register"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm outline-none transition-all',
                    'focus:bg-white focus:ring-1',
                    getError('password')
                      ? 'ring-1 ring-red-200 focus:ring-red-300'
                      : 'focus:ring-gray-900'
                  )}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
                {getError('password') && (
                  <p className="mt-1.5 text-xs text-red-500">{getError('password')}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-2">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-sm outline-none transition-all',
                    'focus:bg-white focus:ring-1',
                    getError('confirmPassword')
                      ? 'ring-1 ring-red-200 focus:ring-red-300'
                      : 'focus:ring-gray-900'
                  )}
                  placeholder="Digite a senha novamente"
                  disabled={loading}
                />
                {getError('confirmPassword') && (
                  <p className="mt-1.5 text-xs text-red-500">{getError('confirmPassword')}</p>
                )}
              </div>

              {getError('general') && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">{getError('general')}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          )}
        </div>

        {/* Info */}
        {mode === 'login' && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Admin: maxsuelsouza238@gmail.com
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-300">
            Dash Financeiro
          </p>
        </div>
      </div>
    </div>
  );
}
