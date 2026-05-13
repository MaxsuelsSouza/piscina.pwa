'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'phone' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { client, loading, loginByPhone, registerWithName, checkPhoneStatus } = useClientAuth();
  const { user: firebaseUser, loading: firebaseLoading } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!firebaseLoading && firebaseUser) {
      router.replace('/workspace');
      return;
    }
    if (!loading && client) {
      router.replace('/presentes');
    }
  }, [client, loading, firebaseUser, firebaseLoading, router]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
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
        const success = await loginByPhone(phoneNumbers);
        if (!success) setError('Erro ao entrar. Tente novamente.');
      } else {
        setStep('register');
      }
    } catch {
      setError('Erro ao verificar. Tente novamente.');
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

    setIsSubmitting(true);

    try {
      const phoneNumbers = phone.replace(/\D/g, '');
      const success = await registerWithName(phoneNumbers, fullName.trim());
      if (!success) setError('Erro ao criar conta. Tente novamente.');
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setFullName('');
    setError('');
  };

  if (loading || firebaseLoading) {
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
          <p className="text-stone-400 text-sm mt-2">
            {step === 'phone' ? 'Digite seu telefone' : 'Como devemos te chamar?'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          {step === 'phone' && (
            <form onSubmit={handleCheckPhone} className="space-y-4">
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

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !phone}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-sm text-stone-500 bg-stone-50 px-3 py-2 rounded-lg">
                {phone}
              </div>

              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(''); }}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-0 outline-none transition bg-white placeholder-stone-400"
                style={{ color: '#1c1917' }}
                autoFocus
                disabled={isSubmitting}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || !fullName.trim()}
                className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {isSubmitting ? 'Criando...' : 'Continuar'}
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
