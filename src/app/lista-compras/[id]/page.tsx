'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { ListaCompras, ItemCompra, CategoriaItem, Unidade } from '../_types';
import { CATEGORIA_LABELS, CATEGORIA_ICONS, UNIDADES, UNIDADE_LABELS } from '../_types';

export default function ListaComprasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listaId = params.id as string;
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [lista, setLista] = useState<ListaCompras | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCompra | null>(null);
  const [nomeItem, setNomeItem] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState<Unidade>('un');
  const [categoria, setCategoria] = useState<CategoriaItem>('outros');
  const [preco, setPreco] = useState('');

  // Modal de preço rápido (só para adicionar preço em item existente no modo comprando)
  const [precificandoItem, setPrecificandoItem] = useState<ItemCompra | null>(null);
  const [precoRapido, setPrecoRapido] = useState('');

  // View state
  const [showOverview, setShowOverview] = useState(false);

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState<ItemCompra | null>(null);

  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (!listaId || !isAdmin) return;

    const fetchLista = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/lista-compras/${listaId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Lista não encontrada');
        }

        setLista(data.lista);
      } catch (error) {
        console.error('Erro ao carregar lista:', error);
        showMessage('error', 'Erro ao carregar lista');
        router.replace('/lista-compras');
      } finally {
        setLoading(false);
      }
    };

    fetchLista();
  }, [listaId, isAdmin, router]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setNomeItem('');
    setQuantidade('1');
    setUnidade('un');
    setCategoria('outros');
    setPreco('');
    setEditingItem(null);
    setShowForm(false);
  };

  const openEditForm = (item: ItemCompra) => {
    setEditingItem(item);
    setNomeItem(item.nome);
    setQuantidade(item.quantidade.toString());
    setUnidade(item.unidade as Unidade);
    setCategoria(item.categoria);
    setPreco(item.preco ? applyPrecoMask(String(Math.round(item.preco * 100))) : '');
    setShowForm(true);
  };

  const openPrecificar = (item: ItemCompra) => {
    setPrecificandoItem(item);
    setPrecoRapido(item.preco ? applyPrecoMask(String(Math.round(item.preco * 100))) : '');
  };

  // Fase da lista
  const fase = lista?.status ?? 'planejamento';
  const isPlanejamento = fase === 'planejamento' || fase === 'ativa'; // ativa = legado
  const isComprando = fase === 'comprando';
  const isConcluida = fase === 'concluida';

  const handleSaveItem = async () => {
    if (!nomeItem.trim()) {
      showMessage('error', 'Nome do produto é obrigatório');
      return;
    }

    const precoValor = parsePreco(preco);

    setSaving(true);
    try {
      const action = editingItem ? 'updateItem' : 'addItem';
      const res = await fetch(`/api/lista-compras/${listaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          itemId: editingItem?.id,
          item: {
            nome: nomeItem.trim(),
            quantidade: parseInt(quantidade) || 1,
            unidade,
            categoria,
            preco: precoValor,
            comprado: isComprando && !!precoValor,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar');
      }

      setLista(data.lista);
      resetForm();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleAdicionarPreco = async () => {
    if (!precificandoItem) return;
    const precoValor = parsePreco(precoRapido);

    setSaving(true);
    try {
      const res = await fetch(`/api/lista-compras/${listaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateItem',
          itemId: precificandoItem.id,
          item: {
            preco: precoValor,
            comprado: !!precoValor,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar preço');
      }

      setLista(data.lista);
      setPrecificandoItem(null);
      setPrecoRapido('');
    } catch (error) {
      showMessage('error', 'Erro ao salvar preço');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/lista-compras/${listaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteItem',
          itemId: deletingItem.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setLista(data.lista);
      setDeletingItem(null);
    } catch (error) {
      showMessage('error', 'Erro ao remover');
    } finally {
      setSaving(false);
    }
  };

  // Ir às compras: planejamento → comprando
  const handleIrAsCompras = async () => {
    try {
      const res = await fetch(`/api/lista-compras/${listaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'comprando' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error('Erro ao iniciar compras');
      }

      setLista(data.lista);
    } catch (error) {
      showMessage('error', 'Erro ao iniciar compras');
    }
  };

  // Finalizar: comprando → concluida
  const handleFinalizarCompra = async () => {
    try {
      const res = await fetch(`/api/lista-compras/${listaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluida' }),
      });

      if (!res.ok) {
        throw new Error('Erro ao finalizar');
      }

      router.push('/lista-compras');
    } catch (error) {
      showMessage('error', 'Erro ao finalizar compra');
    }
  };

  const itens = lista?.itens || [];

  const calcularValorItem = (item: ItemCompra): number => {
    if (!item.preco) return 0;
    if (item.unidade === 'un') {
      return item.preco * item.quantidade;
    }
    return item.preco;
  };

  const totalCompra = useMemo(() => {
    return itens.reduce((acc, item) => acc + calcularValorItem(item), 0);
  }, [itens]);

  const itensComPreco = useMemo(() => itens.filter((i) => i.preco), [itens]);
  const itensSemPreco = useMemo(() => itens.filter((i) => !i.preco), [itens]);

  const itensPorCategoria = useMemo(() => {
    const grupos: Record<CategoriaItem, { itens: ItemCompra[]; total: number }> = {} as Record<CategoriaItem, { itens: ItemCompra[]; total: number }>;
    itens.forEach((item) => {
      if (!grupos[item.categoria]) {
        grupos[item.categoria] = { itens: [], total: 0 };
      }
      grupos[item.categoria].itens.push(item);
      grupos[item.categoria].total += calcularValorItem(item);
    });
    return grupos;
  }, [itens]);

  const categoriasComItens = Object.keys(itensPorCategoria) as CategoriaItem[];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const applyPrecoMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const cents = parseInt(digits, 10);
    const reais = Math.floor(cents / 100);
    const centavos = String(cents % 100).padStart(2, '0');
    const reaisFormatado = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${reaisFormatado},${centavos}`;
  };

  const parsePreco = (masked: string): number | null => {
    if (!masked) return null;
    const value = parseFloat(masked.replace(/\./g, '').replace(',', '.'));
    return isNaN(value) ? null : value;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin || !lista) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      {/* Header — muda de cor por fase */}
      <header
        className={`sticky top-0 z-10 px-4 py-3 shadow-lg text-white ${
          isConcluida
            ? 'bg-emerald-600'
            : isComprando
            ? 'bg-emerald-600'
            : 'bg-stone-700'
        }`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/lista-compras"
              className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                isPlanejamento ? 'hover:bg-stone-600' : 'hover:bg-emerald-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-medium truncate">{lista.nome}</h1>
              <p className={`text-sm ${isPlanejamento ? 'text-stone-300' : 'text-emerald-100'}`}>
                {isPlanejamento && `${itens.length} produto${itens.length !== 1 ? 's' : ''} na lista`}
                {isComprando && `${itens.length} produto${itens.length !== 1 ? 's' : ''} · ${itensSemPreco.length} sem preço`}
                {isConcluida && `Compra finalizada · ${itens.length} itens`}
              </p>
            </div>
            {(isComprando || isConcluida) && (
              <button
                onClick={() => setShowOverview(true)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
                  isPlanejamento ? 'hover:bg-stone-600' : 'hover:bg-emerald-500'
                }`}
                title="Ver resumo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
          </div>

          {/* Total — só no modo comprando/concluída */}
          {(isComprando || isConcluida) && (
            <div className="mt-3 bg-emerald-700 rounded-xl p-4 text-center">
              <p className="text-emerald-200 text-sm mb-1">
                {isConcluida ? 'Total gasto' : 'Total até agora'}
              </p>
              <p className="text-3xl font-bold">{formatCurrency(totalCompra)}</p>
            </div>
          )}

          {/* Banner de planejamento */}
          {isPlanejamento && itens.length === 0 && (
            <div className="mt-3 bg-stone-600 rounded-xl p-3 text-center">
              <p className="text-stone-300 text-sm">Adicione os produtos que você precisa comprar</p>
            </div>
          )}
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

      {/* Itens */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Modo: Planejamento */}
        {isPlanejamento && (
          <>
            {itens.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-stone-600 font-medium">Lista vazia</p>
                <p className="text-stone-400 text-sm mt-1">Adicione os produtos que você precisa</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...itens].reverse().map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {CATEGORIA_ICONS[item.categoria]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{item.nome}</p>
                      <p className="text-xs text-stone-400">
                        {item.quantidade} {UNIDADE_LABELS[item.unidade as Unidade] || item.unidade}
                        {' · '}{CATEGORIA_LABELS[item.categoria]}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditForm(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modo: Comprando */}
        {isComprando && (
          <>
            {itens.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-500">Nenhum produto na lista</p>
              </div>
            ) : (
              <>
                {/* Itens sem preço (pendentes) */}
                {itensSemPreco.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
                      Pendentes ({itensSemPreco.length})
                    </p>
                    <div className="space-y-2">
                      {itensSemPreco.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-amber-200 px-4 py-3 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                            {CATEGORIA_ICONS[item.categoria]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">{item.nome}</p>
                            <p className="text-xs text-stone-400">
                              {item.quantidade} {UNIDADE_LABELS[item.unidade as Unidade] || item.unidade}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openPrecificar(item)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition"
                            >
                              + Preço
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itens com preço (comprados) */}
                {itensComPreco.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">
                      Comprados ({itensComPreco.length})
                    </p>
                    <div className="space-y-2">
                      {[...itensComPreco].reverse().map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-emerald-200 px-4 py-3 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                            {CATEGORIA_ICONS[item.categoria]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 truncate">{item.nome}</p>
                            <p className="text-xs text-stone-400">
                              {item.quantidade} {UNIDADE_LABELS[item.unidade as Unidade] || item.unidade}
                              {item.unidade === 'un' && item.quantidade > 1 && item.preco && (
                                <span> × {formatCurrency(item.preco)}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-emerald-600">
                              {formatCurrency(calcularValorItem(item))}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditForm(item)}
                              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Modo: Concluída (somente leitura) */}
        {isConcluida && (
          <div className="space-y-2">
            {itens.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Nenhum item registrado</p>
            ) : (
              [...itens].reverse().map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {CATEGORIA_ICONS[item.categoria]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.nome}</p>
                    <p className="text-xs text-stone-400">
                      {item.quantidade} {UNIDADE_LABELS[item.unidade as Unidade] || item.unidade}
                      {item.unidade === 'un' && item.quantidade > 1 && item.preco && (
                        <span> × {formatCurrency(item.preco)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.preco ? (
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(calcularValorItem(item))}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400">Sem preço</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {!isConcluida && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 safe-area-bottom">
          <div className="max-w-2xl mx-auto flex gap-3">
            {isPlanejamento && (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex-1 py-3 bg-stone-700 hover:bg-stone-800 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Produto
                </button>
                {itens.length > 0 && (
                  <button
                    onClick={handleIrAsCompras}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition whitespace-nowrap flex items-center gap-1"
                  >
                    Ir às Compras
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}

            {isComprando && (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Produto
                </button>
                <button
                  onClick={handleFinalizarCompra}
                  className="px-4 py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition"
                >
                  Finalizar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal - Adicionar/Editar Produto */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-stone-800">
                {editingItem ? 'Editar Produto' : 'Adicionar Produto'}
              </h3>
              <button onClick={resetForm} className="p-1 text-stone-400 hover:text-stone-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm text-stone-600 mb-1">Produto</label>
                <input
                  type="text"
                  value={nomeItem}
                  onChange={(e) => setNomeItem(e.target.value)}
                  placeholder="Ex: Arroz Tio João 5kg"
                  className="w-full px-3 py-3 border border-stone-200 rounded-xl text-base bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                  autoFocus
                />
              </div>

              {/* Preço — visível apenas no modo comprando */}
              {isComprando && (
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={preco}
                    onChange={(e) => setPreco(applyPrecoMask(e.target.value))}
                    placeholder="0,00"
                    className="w-full px-3 py-3 border border-stone-200 rounded-xl text-xl font-semibold bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                    style={{ color: '#059669' }}
                  />
                </div>
              )}

              {/* Quantidade e Unidade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Qtd</label>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    min="1"
                    className="w-full px-3 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                    style={{ color: '#1c1917' }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-600 mb-1">Unidade</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value as Unidade)}
                    className="w-full px-3 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    style={{ color: '#1c1917' }}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {UNIDADE_LABELS[u]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm text-stone-600 mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaItem)}
                  className="w-full px-3 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                >
                  {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {CATEGORIA_ICONS[value as CategoriaItem]} {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview total (comprando, unidade=un, qty>1, tem preço) */}
              {isComprando && unidade === 'un' && parseInt(quantidade) > 1 && preco && (
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-emerald-600">
                    {quantidade} × {formatCurrency(parsePreco(preco) ?? 0)} ={' '}
                    <span className="font-semibold">
                      {formatCurrency((parsePreco(preco) ?? 0) * (parseInt(quantidade) || 1))}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveItem}
              disabled={saving || !nomeItem.trim()}
              className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingItem ? 'Salvar' : 'Adicionar'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal - Adicionar Preço Rápido */}
      {precificandoItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setPrecificandoItem(null); setPrecoRapido(''); }} />
          <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                {CATEGORIA_ICONS[precificandoItem.categoria]}
              </div>
              <div>
                <p className="font-medium text-stone-800">{precificandoItem.nome}</p>
                <p className="text-xs text-stone-400">
                  {precificandoItem.quantidade} {UNIDADE_LABELS[precificandoItem.unidade as Unidade] || precificandoItem.unidade}
                </p>
              </div>
            </div>

            <label className="block text-sm text-stone-600 mb-2">Qual foi o preço? (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              value={precoRapido}
              onChange={(e) => setPrecoRapido(applyPrecoMask(e.target.value))}
              placeholder="0,00"
              className="w-full px-3 py-4 border border-stone-200 rounded-xl text-3xl font-bold bg-white placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
              style={{ color: '#059669' }}
              autoFocus
            />

            {precificandoItem.unidade === 'un' && precificandoItem.quantidade > 1 && precoRapido && (
              <p className="text-center text-sm text-emerald-600 mt-2">
                Total: {formatCurrency((parsePreco(precoRapido) ?? 0) * precificandoItem.quantidade)}
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setPrecificandoItem(null); setPrecoRapido(''); }}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarPreco}
                disabled={saving || !precoRapido.trim()}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Overview/Resumo */}
      {showOverview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOverview(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-stone-800">Resumo da Compra</h3>
                <button onClick={() => setShowOverview(false)} className="p-1 text-stone-400 hover:text-stone-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {categoriasComItens.length === 0 ? (
                <p className="text-center text-stone-400 py-8">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-4">
                  {categoriasComItens.map((cat) => (
                    <div key={cat} className="bg-stone-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{CATEGORIA_ICONS[cat]}</span>
                          <span className="font-medium text-stone-700">{CATEGORIA_LABELS[cat]}</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(itensPorCategoria[cat].total)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {itensPorCategoria[cat].itens.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-stone-600">
                              {item.quantidade}x {item.nome}
                            </span>
                            <span className="text-stone-500">
                              {item.preco ? formatCurrency(calcularValorItem(item)) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-stone-100 bg-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCompra)}</p>
                </div>
                {isComprando && (
                  <button
                    onClick={() => { setShowOverview(false); handleFinalizarCompra(); }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition"
                  >
                    Finalizar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Confirmar exclusão */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingItem(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 text-center">
            <h3 className="text-lg font-medium text-stone-800 mb-2">Remover item?</h3>
            <p className="text-sm text-stone-500 mb-6">
              &quot;{deletingItem.nome}&quot; será removido da lista.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="flex-1 py-2.5 text-stone-600 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition disabled:opacity-50"
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
