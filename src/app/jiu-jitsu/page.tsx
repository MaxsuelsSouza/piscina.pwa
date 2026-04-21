'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { Tecnica, Aula, CategoriaJJ, NivelJJ } from './_types';
import {
  CATEGORIAS_JJ,
  CATEGORIAS_JJ_LABELS,
  NIVEIS_JJ,
  NIVEIS_JJ_LABELS,
} from './_types';
import { BeltProgress, type EventoHistorico } from './components/BeltProgress';

type Tab = 'inicio' | 'tecnicas';
type FaixaId = 'branca' | 'azul' | 'roxa' | 'marrom' | 'preta';

export default function JiuJitsuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('inicio');

  // Belt progress state (loaded from API)
  const [beltFaixa, setBeltFaixa] = useState<FaixaId>('branca');
  const [beltListras, setBeltListras] = useState(0);
  const [beltHistorico, setBeltHistorico] = useState<EventoHistorico[]>([]);
  const [beltLoading, setBeltLoading] = useState(true);

  // Data
  const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Tecnicas form
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaJJ>('guarda');
  const [nivel, setNivel] = useState<NivelJJ>('iniciante');
  const [notas, setNotas] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters (tecnicas tab)
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaJJ | 'todas'>('todas');
  const [apenasF, setApenasF] = useState(false);

  // Message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete
  const [deletingTecId, setDeletingTecId] = useState<string | null>(null);

  // Edit
  const [editingTec, setEditingTec] = useState<Tecnica | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editNotas, setEditNotas] = useState('');

  // Video player expandido
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    fetchBelt();
  }, [user]);

  const fetchBelt = async () => {
    try {
      setBeltLoading(true);
      const res = await fetch('/api/jiu-jitsu/progresso');
      const data = await res.json();
      setBeltFaixa(data.faixa ?? 'branca');
      setBeltListras(data.listras ?? 0);
      setBeltHistorico(data.historico ?? []);
    } catch {
      // keep defaults
    } finally {
      setBeltLoading(false);
    }
  };

  const handleBeltUpdate = useCallback(async (faixa: FaixaId, listras: number, evento: EventoHistorico) => {
    setBeltFaixa(faixa);
    setBeltListras(listras);
    setBeltHistorico((prev) => [...prev, evento]);
    try {
      await fetch('/api/jiu-jitsu/progresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faixa, listras, evento }),
      });
    } catch {
      // silently ignore
    }
  }, []);

  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const [tecRes, aulRes] = await Promise.all([
        fetch('/api/jiu-jitsu/tecnicas'),
        fetch('/api/jiu-jitsu/aulas'),
      ]);
      const [tecData, aulData] = await Promise.all([tecRes.json(), aulRes.json()]);
      if (tecData.tecnicas) setTecnicas(tecData.tecnicas);
      if (aulData.aulas) setAulas(aulData.aulas);
    } catch {
      showMsg('error', 'Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ─── Técnicas CRUD ───────────────────────────────────────────────────────────
  const resetTecForm = () => {
    setNome(''); setCategoria('guarda'); setNivel('iniciante');
    setNotas(''); setVideoUrl(''); setShowForm(false);
  };

  const handleSubmitTec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { showMsg('error', 'Nome obrigatório'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/jiu-jitsu/tecnicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), categoria, nivel, notas: notas.trim(), videoUrl: videoUrl.trim() }),
      });
      if (!res.ok) throw new Error();
      showMsg('success', 'Técnica cadastrada!');
      resetTecForm();
      await fetchAll();
    } catch {
      showMsg('error', 'Erro ao salvar técnica');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFav = async (tec: Tecnica) => {
    try {
      await fetch(`/api/jiu-jitsu/tecnicas/${tec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorita: !tec.favorita }),
      });
      setTecnicas((prev) => prev.map((t) => t.id === tec.id ? { ...t, favorita: !tec.favorita } : t));
    } catch {
      showMsg('error', 'Erro ao atualizar');
    }
  };

  const handleDeleteTec = async () => {
    if (!deletingTecId) return;
    setSaving(true);
    try {
      await fetch(`/api/jiu-jitsu/tecnicas/${deletingTecId}`, { method: 'DELETE' });
      setTecnicas((prev) => prev.filter((t) => t.id !== deletingTecId));
      setDeletingTecId(null);
      showMsg('success', 'Técnica removida!');
    } catch {
      showMsg('error', 'Erro ao remover');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTec) return;
    setSaving(true);
    try {
      await fetch(`/api/jiu-jitsu/tecnicas/${editingTec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: editVideoUrl.trim(), notas: editNotas.trim() }),
      });
      setTecnicas((prev) => prev.map((t) =>
        t.id === editingTec.id ? { ...t, videoUrl: editVideoUrl.trim(), notas: editNotas.trim() } : t
      ));
      setEditingTec(null);
      showMsg('success', 'Técnica atualizada!');
    } catch {
      showMsg('error', 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────────
  const tecnicasFiltradas =tecnicas
    .filter((t) => filtroCategoria === 'todas' || t.categoria === filtroCategoria)
    .filter((t) => !apenasF || t.favorita);

  const getEmbedUrl = (url: string): string | null => {
    try {
      const base = 'autoplay=1&playsinline=1&rel=0&modestbranding=1';

      // youtube.com/shorts/ID
      const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?${base}`;

      // youtu.be/ID
      const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
      if (shortMatch) {
        const t = url.match(/[?&]t=(\d+)/);
        return `https://www.youtube.com/embed/${shortMatch[1]}?${base}${t ? `&start=${t[1]}` : ''}`;
      }

      // youtube.com/watch?v=ID
      const watchMatch = url.match(/youtube\.com\/watch\?.*v=([\w-]+)/);
      if (watchMatch) {
        const t = url.match(/[?&]t=(\d+)/);
        return `https://www.youtube.com/embed/${watchMatch[1]}?${base}${t ? `&start=${t[1]}` : ''}`;
      }

      return null; // Instagram ou outros — não embeddável
    } catch {
      return null;
    }
  };

  const nivelColor = (n: NivelJJ) =>
    n === 'iniciante' ? 'bg-emerald-100 text-emerald-700' :
    n === 'intermediario' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  const formatarData = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">

      {/* ── INÍCIO TAB ──────────────────────────────────────────────────────── */}
      {tab === 'inicio' && (
        <div className="flex-1 overflow-y-auto pb-24">

          {/* Header hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-red-950/60 to-stone-900 px-4 pt-10 pb-6">
            <Link
              href="/workspace"
              className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-red-700/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-red-900/20 blur-2xl pointer-events-none" />

            <div className="max-w-lg mx-auto text-center relative pt-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Jiu-Jitsu</h1>
              <p className="text-red-300/80 text-xs mt-0.5">Treine. Aprenda. Evolua.</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="max-w-lg mx-auto px-4 pt-4">
              <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800' : 'bg-red-900/60 text-red-300 border border-red-800'}`}>
                {message.text}
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto px-4 py-6 space-y-8">

            {/* ── BELT PROGRESS (replaces stats cards) ── */}
            {beltLoading ? (
              <div className="h-64 bg-stone-900/50 rounded-3xl animate-pulse" />
            ) : (
              <BeltProgress
                initialFaixa={beltFaixa}
                initialListras={beltListras}
                historico={beltHistorico}
                onUpdate={handleBeltUpdate}
              />
            )}


{/* Técnicas favoritas */}
            {tecnicas.filter((t) => t.favorita).length > 0 && (
              <div>
                <h2 className="text-stone-400 font-semibold text-xs uppercase tracking-widest mb-3">⭐ Favoritas</h2>
                <div className="space-y-2">
                  {tecnicas.filter((t) => t.favorita).slice(0, 4).map((tec) => (
                    <div key={tec.id} className="bg-stone-900 border border-stone-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center shrink-0 text-lg">★</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tec.nome}</p>
                        <p className="text-stone-500 text-xs">{CATEGORIAS_JJ_LABELS[tec.categoria]}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${nivelColor(tec.nivel)}`}>
                        {NIVEIS_JJ_LABELS[tec.nivel]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TÉCNICAS TAB ────────────────────────────────────────────────────── */}
      {tab === 'tecnicas' && (
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800 px-4 py-3">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold">Técnicas</h2>
                <p className="text-stone-500 text-xs">{tecnicas.length} cadastrada{tecnicas.length !== 1 ? 's' : ''}</p>
              </div>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition"
                >
                  + Nova
                </button>
              )}
            </div>
          </div>

          {message && (
            <div className="max-w-lg mx-auto px-4 pt-4">
              <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800' : 'bg-red-900/60 text-red-300 border border-red-800'}`}>
                {message.text}
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
            {showForm && (
              <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4">
                <h3 className="text-white font-medium mb-4">Nova Técnica</h3>
                <form onSubmit={handleSubmitTec} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Nome *</label>
                    <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Armlock da guarda"
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-600 focus:border-red-500 focus:ring-0 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Categoria *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIAS_JJ.map((cat) => (
                        <button key={cat} type="button" onClick={() => setCategoria(cat)}
                          className={`py-2 px-3 rounded-xl text-sm font-medium transition ${categoria === cat ? 'bg-red-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                          {CATEGORIAS_JJ_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Nível *</label>
                    <div className="flex gap-2">
                      {NIVEIS_JJ.map((n) => (
                        <button key={n} type="button" onClick={() => setNivel(n)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${nivel === n ? 'bg-red-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                          {NIVEIS_JJ_LABELS[n]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Notas (opcional)</label>
                    <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                      placeholder="Detalhes, dicas, variações..." rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-600 focus:border-red-500 focus:ring-0 outline-none transition resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1">Link de vídeo (opcional)</label>
                    <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-600 focus:border-red-500 focus:ring-0 outline-none transition" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={resetTecForm}
                      className="flex-1 py-3 text-stone-400 font-medium rounded-xl border border-stone-700 hover:bg-stone-800 transition text-sm">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving || !nome.trim()}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition disabled:opacity-50 text-sm">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && tecnicas.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setApenasF(!apenasF)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0 ${apenasF ? 'bg-amber-500 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                  ★ Fav
                </button>
                <button onClick={() => setFiltroCategoria('todas')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0 ${filtroCategoria === 'todas' ? 'bg-red-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                  Todas
                </button>
                {CATEGORIAS_JJ.map((cat) => (
                  <button key={cat} onClick={() => setFiltroCategoria(filtroCategoria === cat ? 'todas' : cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0 ${filtroCategoria === cat ? 'bg-red-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                    {CATEGORIAS_JJ_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}

            {loadingData ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-stone-900 rounded-2xl animate-pulse" />)}
              </div>
            ) : tecnicas.length === 0 && !showForm ? (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-10 text-center">
                <div className="text-5xl mb-3">🥋</div>
                <p className="text-stone-400 font-medium">Nenhuma técnica cadastrada</p>
                <p className="text-stone-600 text-sm mt-1">Clique em &quot;+ Nova&quot; para começar.</p>
              </div>
            ) : tecnicasFiltradas.length === 0 && !showForm ? (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
                <p className="text-stone-500 text-sm">Nenhuma técnica com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tecnicasFiltradas.map((tec) => {
                  const embedUrl = tec.videoUrl ? getEmbedUrl(tec.videoUrl) : null;
                  const isExpanded = expandedVideoId === tec.id;

                  return (
                    <div key={tec.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
                      <div className="flex items-start gap-3 px-4 py-3">
                        <button onClick={() => handleToggleFav(tec)}
                          className={`mt-0.5 text-xl leading-none transition shrink-0 ${tec.favorita ? 'text-amber-400' : 'text-stone-700 hover:text-amber-500'}`}>
                          ★
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-white text-sm font-medium">{tec.nome}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${nivelColor(tec.nivel)}`}>
                              {NIVEIS_JJ_LABELS[tec.nivel]}
                            </span>
                          </div>
                          <p className="text-stone-500 text-xs">{CATEGORIAS_JJ_LABELS[tec.categoria]}</p>
                          {tec.notas && <p className="text-stone-600 text-xs mt-1 line-clamp-2">{tec.notas}</p>}
                          {tec.videoUrl && (
                            <div className="flex items-center gap-3 mt-2">
                              {embedUrl ? (
                                <button
                                  onClick={() => setExpandedVideoId(isExpanded ? null : tec.id)}
                                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition font-medium"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d={isExpanded
                                      ? 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'
                                      : 'M8 5v14l11-7z'} />
                                  </svg>
                                  {isExpanded ? 'Fechar vídeo' : 'Ver vídeo'}
                                </button>
                              ) : (
                                <a href={tec.videoUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-red-400 hover:text-red-300 transition">
                                  Ver vídeo →
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setEditingTec(tec); setEditVideoUrl(tec.videoUrl ?? ''); setEditNotas(tec.notas ?? ''); }}
                          className="p-1.5 text-stone-700 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeletingTecId(tec.id)}
                          className="p-1.5 text-stone-700 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Player inline */}
                      {isExpanded && embedUrl && (
                        <div className="px-4 pb-4">
                          <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                            <iframe
                              src={embedUrl}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER TABS ─────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-stone-950/95 backdrop-blur border-t border-stone-800 safe-area-bottom">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setTab('inicio')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition ${tab === 'inicio' ? 'text-red-400' : 'text-stone-600 hover:text-stone-400'}`}
          >
            <span className="text-2xl leading-none">🥋</span>
            <span className="text-[11px] font-medium">Início</span>
            {tab === 'inicio' && (
              <span className="absolute bottom-1 w-5 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab('tecnicas')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition ${tab === 'tecnicas' ? 'text-red-400' : 'text-stone-600 hover:text-stone-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                strokeWidth={tab === 'tecnicas' ? 2.5 : 1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-[11px] font-medium">Técnicas</span>
            {tab === 'tecnicas' && (
              <span className="absolute bottom-1 w-5 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </nav>

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {editingTec && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditingTec(null)} />
          <div className="relative bg-stone-900 border border-stone-700 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-white font-semibold text-sm truncate">{editingTec.nome}</h3>
              <p className="text-stone-500 text-xs mt-0.5">{CATEGORIAS_JJ_LABELS[editingTec.categoria]}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Link do vídeo</label>
              <input
                type="url"
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-600 focus:border-blue-500 focus:ring-0 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Notas</label>
              <textarea
                value={editNotas}
                onChange={(e) => setEditNotas(e.target.value)}
                placeholder="Detalhes da técnica..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-600 focus:border-blue-500 focus:ring-0 outline-none transition resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingTec(null)}
                className="flex-1 py-3 text-stone-400 font-medium rounded-xl border border-stone-700 hover:bg-stone-800 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition disabled:opacity-50 text-sm"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ────────────────────────────────────────────────────── */}
      {deletingTecId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeletingTecId(null)} />
          <div className="relative bg-stone-900 border border-stone-700 w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-1">Remover técnica?</h3>
            <p className="text-stone-500 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingTecId(null)}
                className="flex-1 py-3 text-stone-400 font-medium rounded-xl border border-stone-700 hover:bg-stone-800 transition text-sm">
                Cancelar
              </button>
              <button onClick={handleDeleteTec} disabled={saving}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition disabled:opacity-50 text-sm">
                {saving ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
