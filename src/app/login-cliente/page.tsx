'use client';

/**
 * Página de Login/Cadastro do Cliente Público
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Toast } from '@/components/Toast';

function LoginClienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client, loading, login, register } = useClientAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Se já estiver logado, redireciona para o perfil
  useEffect(() => {
    if (!loading && client) {
      const returnUrl = searchParams.get('returnUrl') || '/perfil-cliente';
      router.push(returnUrl);
    }
  }, [client, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validações
    if (mode === 'register') {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
        setError('Nome completo deve ter pelo menos 3 caracteres');
        return;
      }
    }

    if (!formData.phone.trim()) {
      setError('Telefone é obrigatório');
      return;
    }

    if (!formData.birthDate) {
      setError('Data de nascimento é obrigatória');
      return;
    }

    setIsSubmitting(true);

    try {
      let success;

      if (mode === 'login') {
        success = await login(formData.phone, formData.birthDate);

        if (!success) {
          setError('Telefone ou data de nascimento incorretos');
          setIsSubmitting(false);
          return;
        }
      } else {
        success = await register(formData.fullName, formData.phone, formData.birthDate);

        if (!success) {
          setError('Erro ao criar conta. Verifique se o telefone já está cadastrado.');
          setIsSubmitting(false);
          return;
        }
      }

      // Sucesso - será redirecionado pelo useEffect
    } catch (err) {
      setError('Erro ao processar sua solicitação. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Entrar na Conta' : 'Criar Conta'}
            </h1>
            <p className="text-gray-600 text-sm">
              {mode === 'login'
                ? 'Acesse seus agendamentos'
                : 'Acompanhe seus agendamentos criando uma conta'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo (apenas no cadastro) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
                disabled={isSubmitting}
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </>
              ) : mode === 'login' ? (
                'Entrar'
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Alternar entre Login/Cadastro */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccess(null);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </div>

          {/* Informação adicional */}
          {mode === 'login' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                Use o telefone e data de nascimento cadastrados para acessar
              </p>
            </div>
          )}
        </div>

        {/* Voltar */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Toast de Erro */}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      {/* Toast de Sucesso */}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}
    </div>
  );
}

export default function LoginClientePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginClienteContent />
    </Suspense>
  );
}
