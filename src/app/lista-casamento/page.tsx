'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { isAdmin } from './_config/admin';

type Step = 'phone' | 'login' | 'create-password' | 'register';

export default function ListaCasamentoLoginPage() {
  const router = useRouter();
  const { client, loading, login, register, checkPhoneStatus, createPassword } = useClientAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingName, setExistingName] = useState('');

  useEffect(() => {
    if (!loading && client) {
      // Se é admin, redireciona para workspace
      if (isAdmin(client.phone)) {
        router.replace('/lista-casamento/workspace');
      } else {
        router.replace('/lista-casamento/presentes');
      }
    }
  }, [client, loading, router]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phoneNumbers = phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError('Telefone inválido');
      return;
    }

    setIsSubmitting(true);

    try {
      const status = await checkPhoneStatus(phoneNumbers);

      if (status.exists) {
        if (status.hasPassword) {
          setStep('login');
        } else {
          // Usuário existe mas não tem senha (cadastrado pelo admin)
          setExistingName(status.fullName || '');
          setStep('create-password');
        }
      } else {
        setStep('register');
      }
    } catch {
      setError('Erro ao verificar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Digite sua senha');
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumbers = phone.replace(/\D/g, '');
      const success = await login(phoneNumbers, password);

      if (!success) {
        setError('Senha incorreta');
      }
    } catch {
      setError('Erro ao entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Digite seu nome');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter 6+ caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumbers = phone.replace(/\D/g, '');
      const success = await register(phoneNumbers, password, fullName.trim());

      if (!success) {
        setError('Erro ao criar conta');
      }
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Senha deve ter 6+ caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNumbers = phone.replace(/\D/g, '');
      const success = await createPassword(phoneNumbers, password);

      if (!success) {
        setError('Erro ao criar senha');
      }
    } catch {
      setError('Erro ao criar senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setExistingName('');
    setError('');
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-stone-800">Lista de Casa Nova</h1>
          <p className="text-stone-400 text-sm mt-2">
            {step === 'phone' && 'Digite seu telefone'}
            {step === 'login' && 'Bem-vindo de volta'}
            {step === 'create-password' && `Olá, ${existingName || 'convidado'}!`}
            {step === 'register' && 'Criar conta'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          {/* Phone Step */}
          {step === 'phone' && (
            <form onSubmit={handleCheckPhone} className="space-y-4">
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                  style={{ color: '#1c1917' }}
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !phone}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          )}

          {/* Login Step */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-sm text-stone-500 bg-stone-50 px-3 py-2 rounded-lg">
                {phone}
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Senha"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                autoFocus
                disabled={isSubmitting}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm text-stone-400 hover:text-stone-600 transition"
              >
                Voltar
              </button>
            </form>
          )}

          {/* Create Password Step (for guests added by admin) */}
          {step === 'create-password' && (
            <form onSubmit={handleCreatePassword} className="space-y-4">
              <div className="text-sm text-stone-500 bg-stone-50 px-3 py-2 rounded-lg">
                {phone}
              </div>

              <p className="text-sm text-stone-600 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                Você foi convidado! Crie uma senha para acessar.
              </p>

              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Criar senha"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                autoFocus
                disabled={isSubmitting}
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirmar senha"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                disabled={isSubmitting}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Criando...' : 'Criar senha e entrar'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm text-stone-400 hover:text-stone-600 transition"
              >
                Voltar
              </button>
            </form>
          )}

          {/* Register Step */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-sm text-stone-500 bg-stone-50 px-3 py-2 rounded-lg">
                {phone}
              </div>

              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                autoFocus
                disabled={isSubmitting}
              />

              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Criar senha"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                disabled={isSubmitting}
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirmar senha"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                disabled={isSubmitting}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !fullName || !password || !confirmPassword}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Criando...' : 'Criar conta'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm text-stone-400 hover:text-stone-600 transition"
              >
                Voltar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
