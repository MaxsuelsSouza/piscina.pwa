'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Aula } from '../_types';

export default function AulasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [duracao, setDuracao] = useState('60');
  const [instrutor, setInstrutor] = useState('');
  const [notas, setNotas] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchAulas();
  }, [user]);

  const fetchAulas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jiu-jitsu/aulas');
      const json = await res.json();
      if (json.aulas) setAulas(json.aulas);
    } catch {
      showMsg('error', 'Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setData(new Date().toISOString().split('T')[0]);
    setDuracao('60');
    setInstrutor('');
    setNotas('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) {
      showMsg('error', 'Data é obrigatória');
      return;
    }
    const dur = parseInt(duracao);
    if (!dur || dur < 1) {
      showMsg('error', 'Duração inválida');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/jiu-jitsu/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, duracao: dur, instrutor: instrutor.trim(), notas: notas.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao registrar aula');
      showMsg('success', 'Aula registrada!');
      resetForm();
      await fetchAulas();
    } catch (err: any) {
      showMsg('error', err.message || 'Erro ao registrar aula');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jiu-jitsu/aulas/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showMsg('success', 'Aula removida!');
      setAulas((prev) => prev.filter((a) => a.id !== deletingId));
      setDeletingId(null);
    } catch {
      showMsg('error', 'Erro ao remover aula');
    } finally {
      setSaving(false);
    }
  };

  const formatarData = (iso: string) => {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  };

  const totalHoras = aulas.reduce((acc, a) => acc + a.duracao, 0);
  const horasFormatadas = `${Math.floor(totalHoras / 60)}h ${totalHoras % 60}min`;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/jiu-jitsu"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition"
          >
            <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-serif text-stone-800">Aulas</h1>
            <p className="text-xs text-stone-400">
              {aulas.length} aula{aulas.length !== 1 ? 's' : ''} • {horasFormatadas} de treino
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
            >
              + Registrar
            </button>
          )}
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Stats */}
        {aulas.length > 0 && !showForm && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{aulas.length}</p>
              <p className="text-xs text-stone-500 mt-1">Aulas realizadas</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{horasFormatadas}</p>
              <p className="text-xs text-stone-500 mt-1">Total no tatame</p>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
            <h2 className="text-lg font-medium text-stone-800 mb-4">Registrar Aula</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Data *</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-400 focus:ring-0 outline-none transition bg-white"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Duração */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Duração (minutos) *</label>
                <div className="flex gap-2">
                  {['60', '90', '120'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuracao(d)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        duracao === d ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {d}min
                    </button>
                  ))}
                  <input
                    type="number"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    min="1"
                    max="300"
                    placeholder="min"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-0 outline-none transition bg-white text-sm"
                    style={{ color: '#1c1917' }}
                  />
                </div>
              </div>

              {/* Instrutor */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Instrutor (opcional)</label>
                <input
                  type="text"
                  value={instrutor}
                  onChange={(e) => setInstrutor(e.target.value)}
                  placeholder="Nome do professor"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-400 focus:ring-0 outline-none transition bg-white"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="O que foi treinado, aprendizado do dia..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-400 focus:ring-0 outline-none transition bg-white resize-none"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {aulas.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhuma aula registrada</h2>
            <p className="text-stone-500">Clique em &quot;+ Registrar&quot; para adicionar a primeira aula.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aulas.map((aula) => (
              <div key={aula.id} className="bg-white rounded-xl border border-stone-200 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-stone-800">{formatarData(aula.data)}</span>
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 font-medium rounded-full">
                        {aula.duracao}min
                      </span>
                    </div>
                    {aula.instrutor && (
                      <p className="text-sm text-stone-500">Prof. {aula.instrutor}</p>
                    )}
                    {aula.notas && (
                      <p className="text-sm text-stone-400 mt-1 line-clamp-2">{aula.notas}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeletingId(aula.id)}
                    className="p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-2">Remover aula?</h3>
            <p className="text-sm text-stone-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
