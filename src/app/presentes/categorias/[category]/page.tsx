'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGifts } from '@/hooks/useGifts';
import { GIFT_CATEGORY_LABELS, getMaxSelectionsForCategory, type GiftCategory } from '@/types/gift';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const category = params.category as GiftCategory;
  const { client, loading: clientLoading } = useClientAuth();
  const { user: firebaseUser, loading: firebaseLoading } = useAuth();

  const authLoading = clientLoading || firebaseLoading;
  const isAuthenticated = client || firebaseUser;
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { gifts, loading, error, selectGift, mySelections, refreshGifts } =
    useGifts(client?.phone || '', client?.fullName || '');

  // Filter gifts by category
  const categoryGifts = useMemo(
    () => gifts.filter((g) => g.category === category),
    [gifts, category]
  );

  // Stats - considera o máximo de seleções por categoria e forceUnavailable
  const availableCount = categoryGifts.filter((g) => {
    if (g.forceUnavailable) return false;
    const maxSelections = getMaxSelectionsForCategory(g.category);
    const currentSelections = g.selectedBy?.length || 0;
    return currentSelections < maxSelections;
  }).length;
  const myCount = categoryGifts.filter((g) => mySelections.has(g.id)).length;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Toggle item in multi-select mode
  const toggleItemSelection = (giftId: string) => {
    const gift = categoryGifts.find((g) => g.id === giftId);
    if (!gift) return;

    // Can't select if already selected by someone else
    const isUnavailable = gift.isSelected && !mySelections.has(gift.id);
    if (isUnavailable) return;

    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(giftId)) {
        next.delete(giftId);
      } else {
        next.add(giftId);
      }
      return next;
    });

    // Enter multi-select mode on first selection
    if (!multiSelectMode) {
      setMultiSelectMode(true);
    }
  };

  // Exit multi-select mode
  const cancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedItems(new Set());
  };

  // Submit multi-select
  const handleMultiSelect = async () => {
    if (selectedItems.size === 0) return;

    setIsSubmitting(true);

    // Process each selected item
    for (const giftId of selectedItems) {
      const gift = categoryGifts.find((g) => g.id === giftId);
      if (!gift) continue;

      // Only select if not already mine
      if (!mySelections.has(giftId)) {
        await selectGift(giftId);
      }
    }

    setIsSubmitting(false);
    cancelMultiSelect();
  };

  // Single item selection (button click)
  const handleSingleSelect = async (giftId: string) => {
    if (multiSelectMode) {
      toggleItemSelection(giftId);
      return;
    }

    setSelectingId(giftId);
    await selectGift(giftId);
    setSelectingId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  const categoryLabel = GIFT_CATEGORY_LABELS[category] || category;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refreshGifts}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Count new selections (not already mine)
  const newSelectionsCount = Array.from(selectedItems).filter(
    (id) => !mySelections.has(id)
  ).length;

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {multiSelectMode ? (
            <button
              onClick={cancelMultiSelect}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <Link
              href="/presentes/categorias"
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
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-serif text-stone-800 truncate">
              {multiSelectMode
                ? `${selectedItems.size} selecionado${selectedItems.size !== 1 ? 's' : ''}`
                : categoryLabel}
            </h1>
            <p className="text-xs text-stone-400">
              {multiSelectMode
                ? 'Toque nos itens para selecionar'
                : `${availableCount} disponíveis · ${myCount} escolhido${myCount !== 1 ? 's' : ''} por você`}
            </p>
          </div>
        </div>
      </header>

      {/* Color Palette */}
      {!multiSelectMode && categoryGifts.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-white rounded-xl border border-stone-200 p-3">
            <p className="text-xs text-stone-500 text-center mb-2">
              Paleta de cores dos presentes
            </p>
            <div className="flex items-center justify-center gap-4">
              {/* Preto */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full border border-stone-300"
                  style={{ backgroundColor: '#000000' }}
                />
                <span className="text-xs text-stone-600">Preto</span>
              </div>
              {/* Inox */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full border border-stone-300"
                  style={{ backgroundColor: '#D1D1D1' }}
                />
                <span className="text-xs text-stone-600">Inox</span>
              </div>
              {/* Branco */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full border border-stone-300"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
                <span className="text-xs text-stone-600">Branco</span>
              </div>
              {/* Marrom */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full border border-stone-300"
                  style={{ backgroundColor: '#DEBF9F' }}
                />
                <span className="text-xs text-stone-600">Marrom</span>
              </div>
              {/* Verde */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full border border-stone-300"
                  style={{ backgroundColor: '#70765D' }}
                />
                <span className="text-xs text-stone-600">Verde</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gifts List */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {categoryGifts.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            Nenhum presente nesta categoria
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {categoryGifts.map((gift, index) => {
              const isMine = mySelections.has(gift.id);
              const maxSelections = getMaxSelectionsForCategory(gift.category);
              const currentSelections = gift.selectedBy?.length || 0;
              // Indisponível se: marcado pelo admin OU atingiu o máximo de seleções E não é meu
              const isUnavailable = gift.forceUnavailable || (currentSelections >= maxSelections && !isMine);
              const isSelecting = selectingId === gift.id;
              const isSelected = selectedItems.has(gift.id);

              return (
                <div
                  key={gift.id}
                  className={`px-4 py-4 flex items-center gap-3 ${
                    index !== categoryGifts.length - 1
                      ? 'border-b border-stone-100'
                      : ''
                  } ${isUnavailable ? 'opacity-60' : ''} ${
                    isSelected ? 'bg-rose-50' : ''
                  }`}
                >
                  {/* Checkbox area (when in multi-select mode) */}
                  {multiSelectMode && (
                    <button
                      onClick={() => toggleItemSelection(gift.id)}
                      disabled={isUnavailable}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-rose-500 border-rose-500'
                          : isUnavailable
                            ? 'border-stone-200 bg-stone-100'
                            : 'border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Gift name - clickable to toggle selection */}
                  <button
                    onClick={() => toggleItemSelection(gift.id)}
                    disabled={isUnavailable}
                    className={`flex-1 text-left text-sm ${
                      isMine || isSelected
                        ? 'text-stone-800 font-medium'
                        : isUnavailable
                          ? 'text-stone-400 line-through'
                          : 'text-stone-600'
                    }`}
                  >
                    {gift.name}
                  </button>

                  {/* Action buttons */}
                  {!multiSelectMode && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isUnavailable ? (
                        <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full">
                          Indisponível
                        </span>
                      ) : (
                        <>
                          {/* Sugestão button - only shows when selected by user and has link */}
                          {isMine && gift.link && (
                            <a
                              href={gift.link.startsWith('http') ? gift.link : `https://${gift.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                            >
                              Sugestão
                            </a>
                          )}
                          <button
                            onClick={() => handleSingleSelect(gift.id)}
                            disabled={isSelecting}
                            className={`px-4 py-1.5 text-sm rounded-full transition ${
                              isMine
                                ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                : 'bg-stone-800 text-white hover:bg-stone-900'
                            } disabled:opacity-50`}
                          >
                            {isSelecting ? (
                              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isMine ? (
                              'Remover'
                            ) : (
                              'Escolher'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar - Multi-select mode */}
      {multiSelectMode && selectedItems.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={cancelMultiSelect}
              className="px-4 py-3 text-stone-600 font-medium rounded-xl hover:bg-stone-100 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleMultiSelect}
              disabled={isSubmitting || newSelectionsCount === 0}
              className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Selecionando...
                </>
              ) : (
                <>
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
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                  Dar {selectedItems.size} presente{selectedItems.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bottom summary - Normal mode */}
      {!multiSelectMode && myCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-sm text-stone-600">
              <span className="font-medium text-stone-800">{myCount}</span> presente
              {myCount !== 1 ? 's' : ''} desta categoria
            </p>
            <Link
              href="/presentes/meus"
              className="text-sm text-stone-800 font-medium hover:underline"
            >
              Ver todos meus presentes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
