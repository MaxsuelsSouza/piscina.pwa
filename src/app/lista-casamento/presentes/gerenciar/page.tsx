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
  isSelected: boolean;
  selectedBy?: string[];
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
  const [newGiftIsSelected, setNewGiftIsSelected] = useState(false);
  const [newGiftSelectedBy, setNewGiftSelectedBy] = useState<string[]>([]);

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

  const handleDeleteGift = async (giftName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${giftName}"?`)) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/gifts/seed', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: giftName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir presente');
      }

      showMessage('success', `Presente "${giftName}" excluído!`);

      // Refresh gifts list
      const giftsRes = await fetch('/api/public/gifts');
      const giftsData = await giftsRes.json();
      if (giftsData.gifts) {
        setGifts(giftsData.gifts);
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao excluir presente');
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
              <label className="block text-sm text-stone-600 mb-1">Nome do Presente</label>
              <input
                type="text"
                value={newGiftName}
                onChange={(e) => setNewGiftName(e.target.value)}
                placeholder="Ex: Jogo de Panelas"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm text-stone-600 mb-1">Categoria</label>
              <select
                value={newGiftCategory}
                onChange={(e) => setNewGiftCategory(e.target.value as GiftCategory)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                {Object.entries(GIFT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
                      <div key={gift.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${gift.isSelected ? 'text-stone-500' : 'text-stone-700'}`}>
                            {gift.name}
                          </p>
                          {gift.isSelected && gift.selectedBy && gift.selectedBy.length > 0 && (
                            <p className="text-xs text-amber-600">
                              Selecionado por {gift.selectedBy.length} pessoa{gift.selectedBy.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteGift(gift.name)}
                          disabled={saving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Excluir presente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
