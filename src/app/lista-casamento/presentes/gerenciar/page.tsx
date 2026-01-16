'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { GIFT_CATEGORY_LABELS, type GiftCategory } from '@/types/gift';

const ADMIN_PHONE = '81994625990';

interface Gift {
  id: string;
  name: string;
  category: GiftCategory;
  link?: string;
  isSelected: boolean;
  selectedBy?: string[];
  forceUnavailable?: boolean;
}

interface Client {
  phone: string;
  fullName: string;
}

export default function GerenciarPresentesPage() {
  const router = useRouter();
  const { client, loading: authLoading } = useClientAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for new gift
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftCategory, setNewGiftCategory] = useState<GiftCategory>('cozinha-eletrodomesticos');
  const [newGiftLink, setNewGiftLink] = useState('');
  const [newGiftIsSelected, setNewGiftIsSelected] = useState(false);
  const [newGiftSelectedBy, setNewGiftSelectedBy] = useState<string[]>([]);

  // Edit modal state
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<GiftCategory>('cozinha-eletrodomesticos');
  const [editLink, setEditLink] = useState('');

  // Delete modal state
  const [deletingGift, setDeletingGift] = useState<Gift | null>(null);

  const isAdmin = client?.phone?.replace(/\D/g, '') === ADMIN_PHONE;

  useEffect(() => {
    if (!authLoading && !client) {
      router.replace('/lista-casamento');
    } else if (!authLoading && client && !isAdmin) {
      router.replace('/lista-casamento/presentes');
    }
  }, [authLoading, client, isAdmin, router]);

  // Fetch gifts and clients
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch gifts
        const giftsRes = await fetch('/api/public/gifts');
        const giftsData = await giftsRes.json();
        if (giftsData.gifts) {
          setGifts(giftsData.gifts);
        }

        // Fetch clients from admin endpoint
        const clientsRes = await fetch(`/api/public/gifts/admin?phone=${ADMIN_PHONE}`);
        const clientsData = await clientsRes.json();
        if (clientsData.guests) {
          setClients(clientsData.guests.map((g: any) => ({
            phone: g.phone,
            fullName: g.name,
          })));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMessage({ type: 'error', text: 'Erro ao carregar dados' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddGift = async () => {
    if (!newGiftName.trim()) {
      showMessage('error', 'Nome do presente é obrigatório');
      return;
    }

    setSaving(true);
    try {
      // First, create the gift
      const createRes = await fetch('/api/admin/gifts/seed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGiftName.trim(),
          category: newGiftCategory,
          link: newGiftLink.trim() || undefined,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || 'Erro ao criar presente');
      }

      // If isSelected is true and there are selected people, update the gift
      if (newGiftIsSelected && newGiftSelectedBy.length > 0) {
        // Use the select API for each person
        for (const phone of newGiftSelectedBy) {
          const selectedClient = clients.find(c => c.phone === phone);
          await fetch('/api/public/gifts/select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              giftId: createData.id,
              clientPhone: phone,
              clientName: selectedClient?.fullName || 'Desconhecido',
            }),
          });
        }
      }

      showMessage('success', `Presente "${newGiftName}" criado com sucesso!`);

      // Reset form
      setNewGiftName('');
      setNewGiftCategory('cozinha-eletrodomesticos');
      setNewGiftLink('');
      setNewGiftIsSelected(false);
      setNewGiftSelectedBy([]);

      // Refresh gifts list
      const giftsRes = await fetch('/api/public/gifts');
      const giftsData = await giftsRes.json();
      if (giftsData.gifts) {
        setGifts(giftsData.gifts);
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao criar presente');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (gift: Gift) => {
    setDeletingGift(gift);
  };

  const closeDeleteModal = () => {
    setDeletingGift(null);
  };

  const handleGiftAction = async (action: 'delete' | 'unavailable' | 'available') => {
    if (!deletingGift) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/gifts/seed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingGift.id, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar presente');
      }

      if (action === 'delete') {
        showMessage('success', `Presente "${deletingGift.name}" excluído!`);
      } else if (action === 'unavailable') {
        showMessage('success', `Presente "${deletingGift.name}" marcado como indisponível!`);
      } else {
        showMessage('success', `Presente "${deletingGift.name}" marcado como disponível!`);
      }

      closeDeleteModal();

      // Refresh gifts list
      const giftsRes = await fetch('/api/public/gifts');
      const giftsData = await giftsRes.json();
      if (giftsData.gifts) {
        setGifts(giftsData.gifts);
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao processar presente');
    } finally {
      setSaving(false);
    }
  };

  const togglePersonSelection = (phone: string) => {
    setNewGiftSelectedBy(prev =>
      prev.includes(phone)
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  };

  const openEditModal = (gift: Gift) => {
    setEditingGift(gift);
    setEditName(gift.name);
    setEditCategory(gift.category);
    setEditLink(gift.link || '');
  };

  const closeEditModal = () => {
    setEditingGift(null);
    setEditName('');
    setEditCategory('cozinha-eletrodomesticos');
    setEditLink('');
  };

  const handleEditGift = async () => {
    if (!editingGift || !editName.trim()) {
      showMessage('error', 'Nome do presente é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/gifts/seed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGift.id,
          name: editName.trim(),
          category: editCategory,
          link: editLink.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao editar presente');
      }

      showMessage('success', `Presente "${editName}" atualizado!`);
      closeEditModal();

      // Refresh gifts list
      const giftsRes = await fetch('/api/public/gifts');
      const giftsData = await giftsRes.json();
      if (giftsData.gifts) {
        setGifts(giftsData.gifts);
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao editar');
    } finally {
      setSaving(false);
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

  // Group gifts by category
  const giftsByCategory = gifts.reduce((acc, gift) => {
    if (!acc[gift.category]) {
      acc[gift.category] = [];
    }
    acc[gift.category].push(gift);
    return acc;
  }, {} as Record<GiftCategory, Gift[]>);

  // Create a map from phone to name for display
  const phoneToName = clients.reduce((acc, c) => {
    acc[c.phone] = c.fullName;
    return acc;
  }, {} as Record<string, string>);

  // Helper function to get names from phone numbers
  const getSelectedByNames = (selectedBy?: string[]): string => {
    if (!selectedBy || selectedBy.length === 0) return '';
    const names = selectedBy.map(phone => phoneToName[phone] || `***${phone.slice(-4)}`);
    return names.join(', ');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/lista-casamento/presentes"
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
            <h1 className="text-lg font-serif text-stone-800">Painel de Presentes</h1>
            <p className="text-xs text-stone-400">{gifts.length} presentes cadastrados</p>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Add Gift Form */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <h2 className="text-base font-medium text-stone-800 mb-4">Adicionar Presente</h2>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">Nome do Presente</label>
              <input
                type="text"
                value={newGiftName}
                onChange={(e) => setNewGiftName(e.target.value)}
                placeholder="Ex: Jogo de Panelas"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                style={{ color: '#1c1917' }}
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">Categoria</label>
              <select
                value={newGiftCategory}
                onChange={(e) => setNewGiftCategory(e.target.value as GiftCategory)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                style={{ color: '#1c1917' }}
              >
                {Object.entries(GIFT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Link de sugestão */}
            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">Link de Sugestão (opcional)</label>
              <input
                type="url"
                value={newGiftLink}
                onChange={(e) => setNewGiftLink(e.target.value)}
                placeholder="https://www.exemplo.com/produto"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                style={{ color: '#1c1917' }}
              />
              <p className="text-xs text-stone-400 mt-1">Link para sugerir onde comprar o presente</p>
            </div>

            {/* Já selecionado? */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGiftIsSelected}
                  onChange={(e) => {
                    setNewGiftIsSelected(e.target.checked);
                    if (!e.target.checked) {
                      setNewGiftSelectedBy([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-600">Já foi selecionado por alguém?</span>
              </label>
            </div>

            {/* Seleção de pessoas */}
            {newGiftIsSelected && (
              <div>
                <label className="block text-sm text-stone-600 mb-2">
                  Selecione quem escolheu este presente ({newGiftSelectedBy.length} selecionado{newGiftSelectedBy.length !== 1 ? 's' : ''})
                </label>
                <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg">
                  {clients.length === 0 ? (
                    <p className="p-3 text-sm text-stone-400">Nenhum convidado cadastrado</p>
                  ) : (
                    clients.map((c) => (
                      <label
                        key={c.phone}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-stone-50 border-b border-stone-100 last:border-b-0 ${
                          newGiftSelectedBy.includes(c.phone) ? 'bg-amber-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newGiftSelectedBy.includes(c.phone)}
                          onChange={() => togglePersonSelection(c.phone)}
                          className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-700 truncate">{c.fullName}</p>
                          <p className="text-xs text-stone-400">***{c.phone.slice(-4)}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleAddGift}
              disabled={saving || !newGiftName.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar Presente
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gifts List */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h2 className="text-base font-medium text-stone-800 mb-3">Presentes Cadastrados</h2>

        {Object.entries(giftsByCategory).length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <p className="text-stone-400">Nenhum presente cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(GIFT_CATEGORY_LABELS).map(([category, label]) => {
              const categoryGifts = giftsByCategory[category as GiftCategory] || [];
              if (categoryGifts.length === 0) return null;

              return (
                <div key={category} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
                    <h3 className="text-sm font-medium text-stone-700">{label}</h3>
                    <p className="text-xs text-stone-400">{categoryGifts.length} presente{categoryGifts.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {categoryGifts.map((gift) => (
                      <div key={gift.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${gift.forceUnavailable ? 'bg-stone-50' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${gift.isSelected || gift.forceUnavailable ? 'text-stone-500' : 'text-stone-700'}`}>
                              {gift.name}
                            </p>
                            {gift.link && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded shrink-0">
                                Link
                              </span>
                            )}
                            {gift.forceUnavailable && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded shrink-0">
                                Indisponível
                              </span>
                            )}
                          </div>
                          {gift.isSelected && gift.selectedBy && gift.selectedBy.length > 0 && (
                            <p className="text-xs text-amber-600">
                              Selecionado por: {getSelectedByNames(gift.selectedBy)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(gift)}
                            disabled={saving}
                            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition disabled:opacity-50"
                            title="Editar presente"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(gift)}
                            disabled={saving}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Excluir ou marcar indisponível"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeEditModal}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-4">Editar Presente</h3>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm text-stone-600 mb-1">Nome do Presente</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm text-stone-600 mb-1">Categoria</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as GiftCategory)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  style={{ color: '#1c1917' }}
                >
                  {Object.entries(GIFT_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm text-stone-600 mb-1">Link de Sugestão</label>
                <input
                  type="url"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="https://www.exemplo.com/produto"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                />
                <p className="text-xs text-stone-400 mt-1">Deixe vazio para remover o link</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="flex-1 py-2.5 text-stone-600 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditGift}
                disabled={saving || !editName.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Unavailable Modal */}
      {deletingGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              O que deseja fazer?
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              Presente: <span className="font-medium text-stone-700">{deletingGift.name}</span>
            </p>

            <div className="space-y-3">
              {/* Se já está indisponível, mostrar opção de tornar disponível */}
              {deletingGift.forceUnavailable ? (
                <button
                  onClick={() => handleGiftAction('available')}
                  disabled={saving}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {saving ? 'Processando...' : 'Tornar Disponível'}
                </button>
              ) : (
                <button
                  onClick={() => handleGiftAction('unavailable')}
                  disabled={saving}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  {saving ? 'Processando...' : 'Marcar como Indisponível'}
                </button>
              )}

              <button
                onClick={() => handleGiftAction('delete')}
                disabled={saving}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {saving ? 'Processando...' : 'Excluir Permanentemente'}
              </button>

              <button
                onClick={closeDeleteModal}
                disabled={saving}
                className="w-full py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
