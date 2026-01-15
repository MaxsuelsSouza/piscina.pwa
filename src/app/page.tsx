/**
 * Lista de Casamento - Página Principal
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { getAllGifts, selectGift, getClientSelections } from '@/lib/firebase/firestore/gifts';
import type { Gift, GiftCategory, GiftSelection } from '@/types/gift';
import { GIFT_CATEGORY_LABELS } from '@/types/gift';

type View = 'home' | 'gifts' | 'category' | 'my-gifts' | 'confirm';

export default function HomePage() {
  const router = useRouter();
  const { client, loading, logout } = useClientAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [mySelections, setMySelections] = useState<GiftSelection[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<GiftCategory | null>(null);

  useEffect(() => {
    if (!loading && !client) {
      router.replace('/lista-casamento');
    }
  }, [client, loading, router]);

  const loadGifts = useCallback(async () => {
    if (!client) return;

    setLoadingGifts(true);
    try {
      const [giftsData, selectionsData] = await Promise.all([
        getAllGifts(),
        getClientSelections(client.phone),
      ]);
      setGifts(giftsData);
      setMySelections(selectionsData);
    } catch (err) {
      console.error('Erro ao carregar presentes:', err);
      setError('Erro ao carregar. Recarregue a página.');
    } finally {
      setLoadingGifts(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      loadGifts();
    }
  }, [client, loadGifts]);

  const giftsByCategory = gifts.reduce((acc, gift) => {
    if (!acc[gift.category]) {
      acc[gift.category] = [];
    }
    acc[gift.category].push(gift);
    return acc;
  }, {} as Record<GiftCategory, Gift[]>);

  const sortedCategories = Object.keys(giftsByCategory).sort() as GiftCategory[];

  const handleSelectGift = async (gift: Gift) => {
    if (!client || gift.isSelected || selectingId) return;

    setSelectingId(gift.id);
    setError('');

    try {
      await selectGift(gift.id, client.phone, client.fullName || 'Convidado');
      setSuccessMessage(`"${gift.name}" reservado!`);
      await loadGifts();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao selecionar');
    } finally {
      setSelectingId(null);
    }
  };

  const handleCategoryClick = (category: GiftCategory) => {
    setSelectedCategory(category);
    setView('category');
  };

  const handleBack = () => {
    if (view === 'category') {
      setView('gifts');
      setSelectedCategory(null);
    } else {
      setView('home');
    }
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  const availableCount = gifts.filter((g) => !g.isSelected).length;

  // Header component
  const Header = ({ title, showBack = false }: { title: string; showBack?: boolean }) => (
    <header className="bg-white border-b border-stone-200">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={handleBack} className="text-stone-400 hover:text-stone-600 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-serif text-stone-800">{title}</h1>
        </div>
        {!showBack && (
          <button onClick={logout} className="text-sm text-stone-400 hover:text-stone-600 transition">
            Sair
          </button>
        )}
      </div>
    </header>
  );

  // HOME VIEW
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="Lista de Presentes" />

        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Welcome */}
          <div className="text-center mb-8">
            <p className="text-stone-500">Olá, {client.fullName?.split(' ')[0] || 'Convidado'}!</p>
          </div>

          {/* Menu Options */}
          <div className="space-y-3">
            {/* Confirmar Presença */}
            <button
              onClick={() => setView('confirm')}
              className="w-full bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-4 hover:border-stone-300 transition text-left"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-stone-800">Confirmar Presença</h2>
                <p className="text-sm text-stone-400">Confirme sua presença no evento</p>
              </div>
            </button>

            {/* Seus Presentes */}
            <button
              onClick={() => setView('my-gifts')}
              className="w-full bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-4 hover:border-stone-300 transition text-left"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-stone-800">Seus Presentes</h2>
                <p className="text-sm text-stone-400">
                  {mySelections.length === 0
                    ? 'Nenhum presente escolhido'
                    : `${mySelections.length} presente${mySelections.length > 1 ? 's' : ''} escolhido${mySelections.length > 1 ? 's' : ''}`}
                </p>
              </div>
              {mySelections.length > 0 && (
                <span className="bg-rose-100 text-rose-600 text-sm font-medium px-2.5 py-1 rounded-full">
                  {mySelections.length}
                </span>
              )}
            </button>

            {/* Lista de Presentes */}
            <button
              onClick={() => setView('gifts')}
              className="w-full bg-white border border-stone-200 rounded-xl p-5 flex items-center gap-4 hover:border-stone-300 transition text-left"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-stone-800">Lista de Presentes</h2>
                <p className="text-sm text-stone-400">{availableCount} itens disponíveis</p>
              </div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // CONFIRM PRESENCE VIEW
  if (view === 'confirm') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="Confirmar Presença" showBack />

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-stone-800 mb-2">Presença Confirmada!</h2>
            <p className="text-stone-500 text-sm">
              Obrigado por confirmar sua presença, {client.fullName?.split(' ')[0]}!
            </p>
          </div>
        </main>
      </div>
    );
  }

  // MY GIFTS VIEW
  if (view === 'my-gifts') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="Seus Presentes" showBack />

        <main className="max-w-2xl mx-auto px-4 py-6">
          {mySelections.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <p className="text-stone-500 mb-4">Você ainda não escolheu nenhum presente</p>
              <button
                onClick={() => setView('gifts')}
                className="text-rose-600 font-medium hover:text-rose-700 transition"
              >
                Ver lista de presentes
              </button>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
              {mySelections.map((selection) => (
                <div key={selection.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-stone-700">{selection.giftName}</span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // GIFTS GRID VIEW (Categories)
  if (view === 'gifts') {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header title="Lista de Presentes" showBack />

        {/* Messages */}
        {(successMessage || error) && (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            {successMessage && (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        <main className="max-w-2xl mx-auto px-4 py-6">
          {loadingGifts ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {sortedCategories.map((category) => {
                const categoryGifts = giftsByCategory[category];
                const availableInCategory = categoryGifts.filter((g) => !g.isSelected).length;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="bg-white border border-stone-200 rounded-xl p-4 text-left hover:border-stone-300 hover:shadow-sm transition"
                  >
                    <h3 className="font-medium text-stone-800 text-sm leading-tight mb-2">
                      {GIFT_CATEGORY_LABELS[category]}
                    </h3>
                    <p className="text-xs text-stone-400">
                      {availableInCategory}/{categoryGifts.length} disponíveis
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // CATEGORY DETAIL VIEW
  if (view === 'category' && selectedCategory) {
    const categoryGifts = giftsByCategory[selectedCategory] || [];

    return (
      <div className="min-h-screen bg-stone-50">
        <Header title={GIFT_CATEGORY_LABELS[selectedCategory]} showBack />

        {/* Messages */}
        {(successMessage || error) && (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            {successMessage && (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {categoryGifts.map((gift, index) => {
              const isMySelection = mySelections.some((s) => s.giftId === gift.id);
              const isSelecting = selectingId === gift.id;

              return (
                <div
                  key={gift.id}
                  className={`px-4 py-3.5 flex items-center justify-between ${
                    index !== categoryGifts.length - 1 ? 'border-b border-stone-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {gift.isSelected ? (
                      <div className="w-5 h-5 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0" />
                    )}
                    <span className={`${gift.isSelected ? 'text-stone-400' : 'text-stone-700'}`}>
                      {gift.name}
                    </span>
                    {isMySelection && (
                      <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        seu
                      </span>
                    )}
                  </div>

                  {!gift.isSelected && (
                    <button
                      onClick={() => handleSelectGift(gift)}
                      disabled={isSelecting}
                      className="ml-3 px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                    >
                      {isSelecting ? '...' : 'Escolher'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
