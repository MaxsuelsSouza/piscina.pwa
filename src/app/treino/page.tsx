'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Treino, PessoaTreino, StatusTreino, DiaTreino } from './_types';
import { PESSOAS_TREINO, STATUS_TREINO_LABELS } from './_types';

export default function TreinoPage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [nomeTreino, setNomeTreino] = useState('');
  const [descricaoTreino, setDescricaoTreino] = useState('');
  const [pessoaTreino, setPessoaTreino] = useState<PessoaTreino>('Maxsuel');
  const [quantidadeDias, setQuantidadeDias] = useState('3');

  // Filter state
  const [filtroAtivo, setFiltroAtivo] = useState<PessoaTreino | 'todos'>('todos');
  const [mostrarInativos, setMostrarInativos] = useState(false);

  // Inactivate confirmation
  const [inactivatingTreino, setInactivatingTreino] = useState<Treino | null>(null);

  // Só Firebase Auth pode acessar
  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch treinos
  useEffect(() => {
    if (!isAdmin) return;

    const fetchTreinos = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/treino');
        const data = await res.json();
        if (data.treinos) {
          setTreinos(data.treinos);
        }
      } catch (error) {
        console.error('Erro ao carregar treinos:', error);
        showMessage('error', 'Erro ao carregar treinos');
      } finally {
        setLoading(false);
      }
    };

    fetchTreinos();
  }, [isAdmin]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setNomeTreino('');
    setDescricaoTreino('');
    setPessoaTreino('Maxsuel');
    setQuantidadeDias('3');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeTreino.trim()) {
      showMessage('error', 'Nome do treino é obrigatório');
      return;
    }

    const numDias = parseInt(quantidadeDias) || 3;
    if (numDias < 1 || numDias > 7) {
      showMessage('error', 'Quantidade de dias deve ser entre 1 e 7');
      return;
    }

    setSaving(true);

    // Criar os dias automaticamente
    const dias: DiaTreino[] = Array.from({ length: numDias }, (_, i) => ({
      id: `dia-${Date.now()}-${i + 1}`,
      numero: i + 1,
      status: 'ativo' as const,
      exercicios: [],
    }));

    try {
      const res = await fetch('/api/treino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeTreino.trim(),
          descricao: descricaoTreino.trim(),
          pessoa: pessoaTreino,
          quantidadeDias: numDias,
          dias,
          exercicios: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar treino');
      }

      showMessage('success', 'Treino criado!');
      resetForm();

      // Navegar para a página do treino para adicionar exercícios
      router.push(`/treino/${data.id}`);
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao criar treino');
    } finally {
      setSaving(false);
    }
  };

  const handleInactivate = async () => {
    if (!inactivatingTreino) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/treino/${inactivatingTreino.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inativo' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao inativar treino');
      }

      showMessage('success', 'Treino inativado!');
      setTreinos(treinos.map(t =>
        t.id === inactivatingTreino.id ? { ...t, status: 'inativo' as StatusTreino } : t
      ));
      setInactivatingTreino(null);
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao inativar treino');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (treino: Treino) => {
    setSaving(true);

    try {
      const res = await fetch(`/api/treino/${treino.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'em_construcao' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao reativar treino');
      }

      showMessage('success', 'Treino reativado!');
      setTreinos(treinos.map(t =>
        t.id === treino.id ? { ...t, status: 'em_construcao' as StatusTreino } : t
      ));
    } catch (error: any) {
      showMessage('error', error.message || 'Erro ao reativar treino');
    } finally {
      setSaving(false);
    }
  };

  // Filtrar treinos
  const treinosAtivos = treinos.filter(t => t.status !== 'inativo');
  const treinosInativos = treinos.filter(t => t.status === 'inativo');

  const treinosFiltrados = (mostrarInativos ? treinosInativos : treinosAtivos)
    .filter(t => filtroAtivo === 'todos' || t.pessoa === filtroAtivo);

  // Agrupar por pessoa (apenas ativos)
  const treinosMaxsuel = treinosAtivos.filter(t => t.pessoa === 'Maxsuel');
  const treinosKirley = treinosAtivos.filter(t => t.pessoa === 'Kirley');

  const getStatusColor = (status: StatusTreino) => {
    switch (status) {
      case 'em_construcao':
        return 'bg-amber-100 text-amber-700';
      case 'em_progresso':
        return 'bg-emerald-100 text-emerald-700';
      case 'inativo':
        return 'bg-stone-100 text-stone-500';
      default:
        return 'bg-stone-100 text-stone-500';
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
            <h1 className="text-lg font-serif text-stone-800">Treinos</h1>
            <p className="text-xs text-stone-400">
              {treinosAtivos.length} treino{treinosAtivos.length !== 1 ? 's' : ''} ativo{treinosAtivos.length !== 1 ? 's' : ''}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition"
            >
              + Novo
            </button>
          )}
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

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Form - Criar novo treino */}
        {showForm && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
            <h2 className="text-lg font-medium text-stone-800 mb-4">
              Novo Treino
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pessoa */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Para quem é o treino? *
                </label>
                <div className="flex gap-2">
                  {PESSOAS_TREINO.map((pessoa) => (
                    <button
                      key={pessoa}
                      type="button"
                      onClick={() => setPessoaTreino(pessoa)}
                      className={`flex-1 py-3 rounded-xl font-medium transition ${
                        pessoaTreino === pessoa
                          ? 'bg-blue-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {pessoa}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome do treino */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Nome do Treino *
                </label>
                <input
                  type="text"
                  value={nomeTreino}
                  onChange={(e) => setNomeTreino(e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition bg-white"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Quantidade de dias */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Quantidade de Dias *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantidadeDias(num.toString())}
                      className={`w-10 h-10 rounded-xl font-medium transition ${
                        quantidadeDias === num.toString()
                          ? 'bg-blue-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Selecione quantos dias terá o treino
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={descricaoTreino}
                  onChange={(e) => setDescricaoTreino(e.target.value)}
                  placeholder="Ex: Foco em hipertrofia"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition bg-white"
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
                  disabled={saving || !nomeTreino.trim()}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar Treino'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        {treinos.length > 0 && !showForm && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => {
                setFiltroAtivo('todos');
                setMostrarInativos(false);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filtroAtivo === 'todos' && !mostrarInativos
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              Todos ({treinosAtivos.length})
            </button>
            {PESSOAS_TREINO.map((pessoa) => {
              const count = pessoa === 'Maxsuel' ? treinosMaxsuel.length : treinosKirley.length;
              return (
                <button
                  key={pessoa}
                  onClick={() => {
                    setFiltroAtivo(pessoa);
                    setMostrarInativos(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    filtroAtivo === pessoa && !mostrarInativos
                      ? 'bg-stone-800 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {pessoa} ({count})
                </button>
              );
            })}
            <button
              onClick={() => {
                setFiltroAtivo('todos');
                setMostrarInativos(true);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                mostrarInativos
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              Inativos ({treinosInativos.length})
            </button>
          </div>
        )}

        {/* Lista de treinos */}
        {treinos.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h3m0 0V4m0 3v3m14-3h3m-3 0V4m0 3v3M6 17h3m-3 0v3m0-3v-3m11 3h3m-3 0v3m0-3v-3M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhum treino cadastrado</h2>
            <p className="text-stone-500 mb-4">
              Clique no botão &quot;+ Novo&quot; para criar seu primeiro treino.
            </p>
          </div>
        ) : treinosFiltrados.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <p className="text-stone-500">
              {mostrarInativos
                ? 'Nenhum treino inativo.'
                : `Nenhum treino ${filtroAtivo !== 'todos' ? `para ${filtroAtivo}` : ''}.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {treinosFiltrados.map((treino) => (
              <div
                key={treino.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  treino.status === 'inativo' ? 'border-stone-200 opacity-70' : 'border-stone-200'
                }`}
              >
                {/* Treino card - clicável */}
                <Link
                  href={`/treino/${treino.id}`}
                  className="block px-4 py-4 hover:bg-stone-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      treino.pessoa === 'Maxsuel' ? 'bg-blue-100' : 'bg-pink-100'
                    }`}>
                      <svg
                        className={`w-6 h-6 ${treino.pessoa === 'Maxsuel' ? 'text-blue-600' : 'text-pink-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h3m0 0V4m0 3v3m14-3h3m-3 0V4m0 3v3M6 17h3m-3 0v3m0-3v-3m11 3h3m-3 0v3m0-3v-3M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-stone-800 truncate">{treino.nome}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                          treino.pessoa === 'Maxsuel'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {treino.pessoa}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${getStatusColor(treino.status || 'em_construcao')}`}>
                          {STATUS_TREINO_LABELS[treino.status || 'em_construcao']}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">
                        {treino.quantidadeDias || treino.dias?.length || 1} dia{(treino.quantidadeDias || treino.dias?.length || 1) !== 1 ? 's' : ''}
                        {treino.descricao && ` • ${treino.descricao}`}
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
                </Link>

                {/* Quick actions */}
                <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex justify-end gap-2">
                  {treino.status === 'inativo' ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleReactivate(treino);
                      }}
                      disabled={saving}
                      className="px-3 py-1 text-xs text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                    >
                      Reativar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setInactivatingTreino(treino);
                        }}
                        className="px-3 py-1 text-xs text-stone-500 font-medium hover:bg-stone-100 rounded-lg transition"
                      >
                        Inativar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactivate Modal */}
      {inactivatingTreino && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setInactivatingTreino(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              Inativar treino?
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              Tem certeza que deseja inativar o treino &quot;{inactivatingTreino.nome}&quot;? Você poderá reativá-lo depois.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setInactivatingTreino(null)}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleInactivate}
                disabled={saving}
                className="flex-1 py-3 bg-stone-600 hover:bg-stone-700 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Inativando...' : 'Inativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
