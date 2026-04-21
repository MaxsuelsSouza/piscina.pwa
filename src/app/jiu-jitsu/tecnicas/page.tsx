'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Tecnica, CategoriaJJ, NivelJJ } from '../_types';
import {
  CATEGORIAS_JJ,
  CATEGORIAS_JJ_LABELS,
  NIVEIS_JJ,
  NIVEIS_JJ_LABELS,
} from '../_types';

export default function TecnicasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaJJ>('guarda');
  const [nivel, setNivel] = useState<NivelJJ>('iniciante');
  const [notas, setNotas] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Filters
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaJJ | 'todas'>('todas');
  const [filtroNivel, setFiltroNivel] = useState<NivelJJ | 'todos'>('todos');
  const [apenasF, setApenasF] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchTecnicas();
  }, [user]);

  const fetchTecnicas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jiu-jitsu/tecnicas');
      const data = await res.json();
      if (data.tecnicas) setTecnicas(data.tecnicas);
    } catch {
      showMsg('error', 'Erro ao carregar técnicas');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setNome('');
    setCategoria('guarda');
    setNivel('iniciante');
    setNotas('');
    setVideoUrl('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showMsg('error', 'Nome da técnica é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/jiu-jitsu/tecnicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), categoria, nivel, notas: notas.trim(), videoUrl: videoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar técnica');
      showMsg('success', 'Técnica cadastrada!');
      resetForm();
      await fetchTecnicas();
    } catch (err: any) {
      showMsg('error', err.message || 'Erro ao criar técnica');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorita = async (tecnica: Tecnica) => {
    try {
      const res = await fetch(`/api/jiu-jitsu/tecnicas/${tecnica.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorita: !tecnica.favorita }),
      });
      if (!res.ok) throw new Error();
      setTecnicas((prev) =>
        prev.map((t) => (t.id === tecnica.id ? { ...t, favorita: !tecnica.favorita } : t))
      );
    } catch {
      showMsg('error', 'Erro ao atualizar favorita');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/jiu-jitsu/tecnicas/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showMsg('success', 'Técnica removida!');
      setTecnicas((prev) => prev.filter((t) => t.id !== deletingId));
      setDeletingId(null);
    } catch {
      showMsg('error', 'Erro ao remover técnica');
    } finally {
      setSaving(false);
    }
  };

  const tecnicasFiltradas = tecnicas
    .filter((t) => filtroCategoria === 'todas' || t.categoria === filtroCategoria)
    .filter((t) => filtroNivel === 'todos' || t.nivel === filtroNivel)
    .filter((t) => !apenasF || t.favorita);

  const nivelColor = (n: NivelJJ) => {
    if (n === 'iniciante') return 'bg-emerald-100 text-emerald-700';
    if (n === 'intermediario') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

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
            <h1 className="text-lg font-serif text-stone-800">Técnicas</h1>
            <p className="text-xs text-stone-400">{tecnicas.length} técnica{tecnicas.length !== 1 ? 's' : ''}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition"
            >
              + Nova
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
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4">
            <h2 className="text-lg font-medium text-stone-800 mb-4">Nova Técnica</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Armlock da guarda"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-red-400 focus:ring-0 outline-none transition bg-white"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Categoria *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS_JJ.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoria(cat)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition ${
                        categoria === cat ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {CATEGORIAS_JJ_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nível */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nível *</label>
                <div className="flex gap-2">
                  {NIVEIS_JJ.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNivel(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                        nivel === n ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {NIVEIS_JJ_LABELS[n]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalhes, dicas, variações..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-red-400 focus:ring-0 outline-none transition bg-white resize-none"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Link de vídeo (opcional)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-red-400 focus:ring-0 outline-none transition bg-white"
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
                  disabled={saving || !nome.trim()}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        {!showForm && tecnicas.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setApenasF(!apenasF)}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                apenasF ? 'bg-amber-400 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              ★ Favoritas
            </button>
            <button
              onClick={() => setFiltroCategoria('todas')}
              className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filtroCategoria === 'todas' && filtroNivel === 'todos'
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              Todas
            </button>
            {CATEGORIAS_JJ.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(filtroCategoria === cat ? 'todas' : cat)}
                className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  filtroCategoria === cat
                    ? 'bg-stone-800 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {CATEGORIAS_JJ_LABELS[cat]}
              </button>
            ))}
          </div>
        )}

        {/* Lista */}
        {tecnicas.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Nenhuma técnica cadastrada</h2>
            <p className="text-stone-500">Clique em &quot;+ Nova&quot; para cadastrar a primeira técnica.</p>
          </div>
        ) : tecnicasFiltradas.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
            <p className="text-stone-500">Nenhuma técnica encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tecnicasFiltradas.map((tecnica) => (
              <div key={tecnica.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleFavorita(tecnica)}
                      className={`mt-0.5 text-xl leading-none transition ${tecnica.favorita ? 'text-amber-400' : 'text-stone-300 hover:text-amber-300'}`}
                    >
                      ★
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium text-stone-800">{tecnica.nome}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${nivelColor(tecnica.nivel)}`}>
                          {NIVEIS_JJ_LABELS[tecnica.nivel]}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">{CATEGORIAS_JJ_LABELS[tecnica.categoria]}</p>
                      {tecnica.notas && (
                        <p className="text-sm text-stone-400 mt-1 line-clamp-2">{tecnica.notas}</p>
                      )}
                      {tecnica.videoUrl && (
                        <a
                          href={tecnica.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-500 hover:text-red-700 mt-1 inline-block"
                        >
                          Ver vídeo →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => setDeletingId(tecnica.id)}
                      className="p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
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
            <h3 className="text-lg font-medium text-stone-800 mb-2">Remover técnica?</h3>
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
