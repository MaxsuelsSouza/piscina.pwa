'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { CronogramaCapilar, TipoTratamento } from './_types';
import { TIPOS_TRATAMENTO, TRATAMENTO_LABELS, TRATAMENTO_COLORS } from './_types';

export default function CronogramaCapilarPage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [cronogramas, setCronogramas] = useState<CronogramaCapilar[]>([]);
  const [loading, setLoading] = useState(true);
  const [criando, setCriando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState('');
  const [tratamentosAtivos, setTratamentosAtivos] = useState<TipoTratamento[]>(['hidratacao']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchCronogramas();
  }, [isAdmin]);

  const fetchCronogramas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cronograma-capilar');
      const data = await res.json();
      if (data.cronogramas) {
        setCronogramas(data.cronogramas);
      }
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error);
      showMessage('error', 'Erro ao carregar cronogramas');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleTratamento = (tipo: TipoTratamento) => {
    if (tipo === 'hidratacao') return; // Hidratacao e obrigatoria
    setTratamentosAtivos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const handleCriar = async () => {
    if (!nome.trim()) {
      showMessage('error', 'Digite um nome para o cronograma');
      return;
    }

    setCriando(true);
    try {
      const res = await fetch('/api/cronograma-capilar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), tratamentosAtivos }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar cronograma');
      }

      showMessage('success', 'Cronograma criado!');
      setNome('');
      setTratamentosAtivos(['hidratacao']);
      setMostrarForm(false);
      fetchCronogramas();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar cronograma';
      showMessage('error', errorMessage);
    } finally {
      setCriando(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/workspace"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition"
          >
            <svg
              className="w-5 h-5 text-stone-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-serif text-stone-800">Cronograma Capilar</h1>
            <p className="text-xs text-stone-400">
              {cronogramas.length} cronograma{cronogramas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-500 text-white hover:bg-pink-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Form para criar */}
      {mostrarForm && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="font-medium text-stone-800 mb-3">Novo Cronograma</h3>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome (ex: Meu cabelo)"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 focus:border-pink-500 focus:ring-0 outline-none transition text-stone-800 text-sm mb-3"
            />

            <p className="text-sm text-stone-600 mb-2">Tratamentos ativos:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {TIPOS_TRATAMENTO.map((tipo) => {
                const ativo = tratamentosAtivos.includes(tipo);
                const obrigatorio = tipo === 'hidratacao';
                return (
                  <button
                    key={tipo}
                    onClick={() => toggleTratamento(tipo)}
                    disabled={obrigatorio}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      ativo
                        ? `${TRATAMENTO_COLORS[tipo].bg} ${TRATAMENTO_COLORS[tipo].text}`
                        : 'bg-stone-100 text-stone-400'
                    } ${obrigatorio ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    {TRATAMENTO_LABELS[tipo]}
                    {obrigatorio && ' (obrigatoria)'}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMostrarForm(false);
                  setNome('');
                  setTratamentosAtivos(['hidratacao']);
                }}
                className="flex-1 py-2.5 text-stone-600 font-medium text-sm rounded-lg border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriar}
                disabled={criando}
                className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                {criando ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {cronogramas.length === 0 && !mostrarForm ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhum cronograma</h2>
            <p className="text-stone-500 mb-6">
              Crie um cronograma capilar para organizar seus tratamentos.
            </p>
            <button
              onClick={() => setMostrarForm(true)}
              className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition"
            >
              Criar Cronograma
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cronogramas.map((cronograma) => (
              <Link
                key={cronograma.id}
                href={`/cronograma-capilar/${cronograma.id}`}
                className="block bg-white rounded-xl border border-stone-200 overflow-hidden hover:border-stone-300 transition"
              >
                <div className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg
                        className="w-6 h-6 text-pink-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-stone-800 truncate">{cronograma.nome}</h3>
                      <p className="text-sm text-stone-500">
                        {cronograma.historico.length} tratamento{cronograma.historico.length !== 1 ? 's' : ''} realizado{cronograma.historico.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-stone-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Tags dos tratamentos ativos */}
                  <div className="flex gap-2 mt-3">
                    {cronograma.tratamentosAtivos.map((tipo) => (
                      <span
                        key={tipo}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${TRATAMENTO_COLORS[tipo].bg} ${TRATAMENTO_COLORS[tipo].text}`}
                      >
                        {TRATAMENTO_LABELS[tipo]}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
