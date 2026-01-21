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

  // Form state - simplificado para adição rápida
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCompra | null>(null);
  const [nomeItem, setNomeItem] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState<Unidade>('un');
  const [categoria, setCategoria] = useState<CategoriaItem>('outros');
  const [preco, setPreco] = useState('');

  // View state
  const [showOverview, setShowOverview] = useState(false);

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState<ItemCompra | null>(null);

  // Só Firebase Auth pode acessar
  const isAdmin = !!firebaseUser;

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Fetch lista
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
    setPreco(item.preco ? item.preco.toString() : '');
    setShowForm(true);
  };

  const handleSaveItem = async () => {
    if (!nomeItem.trim()) {
      showMessage('error', 'Nome do produto é obrigatório');
      return;
    }

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
            preco: preco ? parseFloat(preco.replace(',', '.')) : null,
            comprado: true, // Sempre true pois está comprando agora
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

  // Itens da lista
  const itens = lista?.itens || [];

  // Calcula o valor total de um item
  const calcularValorItem = (item: ItemCompra): number => {
    if (!item.preco) return 0;
    if (item.unidade === 'un') {
      return item.preco * item.quantidade;
    }
    return item.preco;
  };

  // Total da compra
  const totalCompra = useMemo(() => {
    return itens.reduce((acc, item) => acc + calcularValorItem(item), 0);
  }, [itens]);

  // Total de itens
  const totalItens = itens.length;

  // Agrupamento por categoria para overview
  const itensPorCategoria = useMemo(() => {
    const grupos: Record<CategoriaItem, { itens: ItemCompra[]; total: number }> = {} as any;
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
      {/* Header com total em destaque */}
      <header className="sticky top-0 z-10 bg-emerald-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/lista-compras"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-500 transition"
            >
              <svg
                className="w-5 h-5"
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
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-medium truncate">{lista.nome}</h1>
              <p className="text-emerald-100 text-sm">{totalItens} {totalItens === 1 ? 'item' : 'itens'} no carrinho</p>
            </div>
            <button
              onClick={() => setShowOverview(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-500 transition"
              title="Ver resumo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          {/* Total em destaque */}
          <div className="mt-3 bg-emerald-700 rounded-xl p-4 text-center">
            <p className="text-emerald-200 text-sm mb-1">Total da compra</p>
            <p className="text-3xl font-bold">{formatCurrency(totalCompra)}</p>
          </div>
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

      {/* Lista de itens - ordenados por mais recente */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {itens.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-stone-600 font-medium">Carrinho vazio</p>
            <p className="text-stone-400 text-sm mt-1">Adicione produtos para começar</p>
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
      </div>

      {/* Bottom bar - Adicionar produto */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Produto
          </button>
          {itens.length > 0 && (
            <button
              onClick={handleFinalizarCompra}
              className="px-4 py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>

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
              {/* Nome do produto */}
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

              {/* Preço - em destaque */}
              <div>
                <label className="block text-sm text-stone-600 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-3 border border-stone-200 rounded-xl text-xl font-semibold bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                  style={{ color: '#059669' }}
                />
              </div>

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

              {/* Preview do valor total se quantidade > 1 e unidade = un */}
              {unidade === 'un' && parseInt(quantidade) > 1 && preco && (
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-emerald-600">
                    {quantidade} × {formatCurrency(parseFloat(preco.replace(',', '.')) || 0)} = {' '}
                    <span className="font-semibold">
                      {formatCurrency((parseFloat(preco.replace(',', '.')) || 0) * (parseInt(quantidade) || 1))}
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
                  {editingItem ? 'Salvar' : 'Adicionar ao Carrinho'}
                </>
              )}
            </button>
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
                              {item.preco ? formatCurrency(calcularValorItem(item)) : '-'}
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
                  <p className="text-sm text-emerald-600">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCompra)}</p>
                </div>
                <button
                  onClick={handleFinalizarCompra}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition"
                >
                  Finalizar Compra
                </button>
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
              &quot;{deletingItem.nome}&quot; será removido do carrinho.
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
