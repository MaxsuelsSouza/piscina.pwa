'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { ListaCompras, StatusLista } from './_types';

export default function ListaComprasPage() {
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [listas, setListas] = useState<ListaCompras[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [nomeLista, setNomeLista] = useState('');
  const [descricaoLista, setDescricaoLista] = useState('');

  // Filter state
  const [filtroStatus, setFiltroStatus] = useState<StatusLista | 'todas'>('ativa');

  // Delete confirmation
  const [deletingLista, setDeletingLista] = useState<ListaCompras | null>(null);

  // Só Firebase Auth pode acessar
  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch listas
  useEffect(() => {
    if (!isAdmin) return;

    const fetchListas = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/lista-compras');
        const data = await res.json();
        if (data.listas) {
          setListas(data.listas);
        }
      } catch (error) {
        console.error('Erro ao carregar listas:', error);
        showMessage('error', 'Erro ao carregar listas');
      } finally {
        setLoading(false);
      }
    };

    fetchListas();
  }, [isAdmin]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setNomeLista('');
    setDescricaoLista('');
    setShowForm(false);
  };

  const handleCreateLista = async () => {
    if (!nomeLista.trim()) {
      showMessage('error', 'Nome da lista é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/lista-compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeLista,
          descricao: descricaoLista,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar lista');
      }

      setListas((prev) => [data.lista, ...prev]);
      resetForm();
      showMessage('success', 'Lista criada com sucesso!');
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao criar lista');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLista = async () => {
    if (!deletingLista) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/lista-compras/${deletingLista.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir lista');
      }

      setListas((prev) => prev.filter((l) => l.id !== deletingLista.id));
      setDeletingLista(null);
      showMessage('success', 'Lista excluída com sucesso!');
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao excluir lista');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (lista: ListaCompras) => {
    const newStatus: StatusLista = lista.status === 'ativa' ? 'concluida' : 'ativa';

    try {
      const res = await fetch(`/api/lista-compras/${lista.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar status');
      }

      setListas((prev) =>
        prev.map((l) => (l.id === lista.id ? data.lista : l))
      );
    } catch (error) {
      showMessage('error', 'Erro ao atualizar status');
    }
  };

  // Filter listas
  const listasFiltradas = listas.filter((lista) => {
    if (filtroStatus === 'todas') return true;
    return lista.status === filtroStatus;
  });

  // Stats
  const stats = {
    total: listas.length,
    ativas: listas.filter((l) => l.status === 'ativa').length,
    concluidas: listas.filter((l) => l.status === 'concluida').length,
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
            <h1 className="text-lg font-serif text-stone-800">Lista de Compras</h1>
            <p className="text-xs text-stone-400">{stats.total} lista{stats.total !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition"
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
            className={`px-4 py-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto">
          {(['todas', 'ativa', 'concluida'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition ${
                filtroStatus === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {status === 'todas' && `Todas (${stats.total})`}
              {status === 'ativa' && `Ativas (${stats.ativas})`}
              {status === 'concluida' && `Concluídas (${stats.concluidas})`}
            </button>
          ))}
        </div>
      </div>

      {/* Listas */}
      <div className="max-w-2xl mx-auto px-4">
        {listasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-stone-500">Nenhuma lista encontrada</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Criar primeira lista
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {listasFiltradas.map((lista) => {
              const totalItens = lista.itens?.length || 0;

              return (
                <div
                  key={lista.id}
                  className={`bg-white rounded-xl border overflow-hidden ${
                    lista.status === 'concluida' ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-200'
                  }`}
                >
                  <Link
                    href={`/lista-compras/${lista.id}`}
                    className="block px-4 py-4 hover:bg-stone-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium truncate ${lista.status === 'concluida' ? 'text-emerald-700' : 'text-stone-800'}`}>
                            {lista.nome}
                          </h3>
                          {lista.status === 'concluida' && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                              Concluída
                            </span>
                          )}
                        </div>
                        {lista.descricao && (
                          <p className="text-sm text-stone-500 truncate mt-0.5">{lista.descricao}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-stone-400">
                            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                          </span>
                          <span className="text-xs text-stone-400">
                            {formatDate(lista.createdAt)}
                          </span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-stone-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex border-t border-stone-100">
                    <button
                      onClick={() => handleToggleStatus(lista)}
                      className={`flex-1 py-2 text-xs font-medium transition ${
                        lista.status === 'concluida'
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {lista.status === 'concluida' ? 'Reabrir' : 'Concluir'}
                    </button>
                    <div className="w-px bg-stone-100" />
                    <button
                      onClick={() => setDeletingLista(lista)}
                      className="flex-1 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-4">Nova Lista</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-stone-600 mb-1">Nome da Lista</label>
                <input
                  type="text"
                  value={nomeLista}
                  onChange={(e) => setNomeLista(e.target.value)}
                  placeholder="Ex: Compras da semana"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Descrição (opcional)</label>
                <input
                  type="text"
                  value={descricaoLista}
                  onChange={(e) => setDescricaoLista(e.target.value)}
                  placeholder="Ex: Mercado do mês"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 text-stone-600 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLista}
                disabled={saving || !nomeLista.trim()}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Criando...' : 'Criar Lista'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingLista(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-2">Excluir lista?</h3>
            <p className="text-sm text-stone-500 mb-6">
              A lista &quot;{deletingLista.nome}&quot; será excluída permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLista(null)}
                className="flex-1 py-2.5 text-stone-600 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLista}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
