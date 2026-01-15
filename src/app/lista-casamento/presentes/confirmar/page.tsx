'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useGifts, groupGiftsByCategory } from '../../_hooks/useGifts';
import { GIFT_CATEGORY_LABELS, type GiftCategory } from '@/types/gift';

type PresenceStatus = 'pending' | 'confirmed' | 'declined';

export default function ConfirmPresencePage() {
  const router = useRouter();
  const { client, loading: authLoading } = useClientAuth();
  const [status, setStatus] = useState<PresenceStatus>('pending');
  const [companions, setCompanions] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [giftsToRemove, setGiftsToRemove] = useState<Set<string>>(new Set());
  const [isRemovingGifts, setIsRemovingGifts] = useState(false);

  const { gifts, loading: giftsLoading, selectGift, mySelections } = useGifts(
    client?.phone || '',
    client?.fullName || ''
  );

  // My gifts
  const myGifts = useMemo(
    () => gifts.filter((g) => mySelections.has(g.id)),
    [gifts, mySelections]
  );

  // Grouped by category
  const groupedGifts = useMemo(() => groupGiftsByCategory(myGifts), [myGifts]);

  // Categories with gifts
  const categories = useMemo(
    () =>
      Object.keys(groupedGifts).filter(
        (cat) => groupedGifts[cat as GiftCategory]?.length > 0
      ) as GiftCategory[],
    [groupedGifts]
  );

  useEffect(() => {
    if (!authLoading && !client) {
      router.replace('/lista-casamento');
    }
  }, [authLoading, client, router]);

  // Load existing confirmation if any
  useEffect(() => {
    if (client?.phone) {
      fetchConfirmation();
    }
  }, [client?.phone]);

  const fetchConfirmation = async () => {
    try {
      const res = await fetch(`/api/public/presence?phone=${client?.phone}`);
      if (res.ok) {
        const data = await res.json();
        if (data.confirmation) {
          setStatus(data.confirmation.status);
          setCompanions(data.confirmation.companions || 0);
          setSubmitted(true);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar confirmação:', err);
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: PresenceStatus) => {
    setStatus(newStatus);

    // If declining and has gifts, show modal
    if (newStatus === 'declined' && myGifts.length > 0) {
      setGiftsToRemove(new Set(myGifts.map((g) => g.id)));
      setShowRemoveModal(true);
    }
  };

  // Toggle gift to remove
  const toggleGiftToRemove = (giftId: string) => {
    setGiftsToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(giftId)) {
        next.delete(giftId);
      } else {
        next.add(giftId);
      }
      return next;
    });
  };

  // Remove selected gifts
  const handleRemoveGifts = async () => {
    if (giftsToRemove.size === 0) {
      setShowRemoveModal(false);
      return;
    }

    setIsRemovingGifts(true);

    for (const giftId of giftsToRemove) {
      await selectGift(giftId); // Toggle off
    }

    setIsRemovingGifts(false);
    setShowRemoveModal(false);
  };

  // Cancel remove modal
  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setStatus('pending'); // Reset status since they cancelled
  };

  const handleSubmit = async () => {
    if (!client) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/public/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: client.phone,
          name: client.fullName,
          status,
          companions: status === 'confirmed' ? companions : 0,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Erro ao confirmar presença:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || giftsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
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
          <h1 className="text-lg font-serif text-stone-800">Confirmar Presença</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {submitted ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                status === 'confirmed'
                  ? 'bg-emerald-100'
                  : status === 'declined'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
              }`}
            >
              {status === 'confirmed' ? (
                <svg
                  className="w-8 h-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : status === 'declined' ? (
                <svg
                  className="w-8 h-8 text-red-600"
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
              ) : (
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>

            <h2 className="text-xl font-medium text-stone-800 mb-2">
              {status === 'confirmed'
                ? 'Presença Confirmada!'
                : status === 'declined'
                  ? 'Ausência Registrada'
                  : 'Resposta Pendente'}
            </h2>

            <p className="text-stone-500 mb-6">
              {status === 'confirmed'
                ? `Você${companions > 0 ? ` e mais ${companions} acompanhante${companions > 1 ? 's' : ''}` : ''} confirmou presença no casamento.`
                : status === 'declined'
                  ? 'Você informou que não poderá comparecer. Sentiremos sua falta!'
                  : 'Ainda aguardando sua confirmação.'}
            </p>

            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-stone-500 hover:text-stone-700 underline"
            >
              Alterar resposta
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Name display */}
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-sm text-stone-400">Convidado</p>
              <p className="text-lg text-stone-800 font-medium">{client?.fullName}</p>
            </div>

            {/* Presence options */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <button
                onClick={() => handleStatusChange('confirmed')}
                className={`w-full px-4 py-4 flex items-center gap-4 border-b border-stone-100 transition ${
                  status === 'confirmed' ? 'bg-emerald-50' : 'hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    status === 'confirmed'
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-stone-300'
                  }`}
                >
                  {status === 'confirmed' && (
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
                </div>
                <div className="text-left">
                  <p className="font-medium text-stone-800">Vou comparecer</p>
                  <p className="text-sm text-stone-400">Confirmo minha presença</p>
                </div>
              </button>

              <button
                onClick={() => handleStatusChange('declined')}
                className={`w-full px-4 py-4 flex items-center gap-4 transition ${
                  status === 'declined' ? 'bg-red-50' : 'hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    status === 'declined'
                      ? 'border-red-600 bg-red-600'
                      : 'border-stone-300'
                  }`}
                >
                  {status === 'declined' && (
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-stone-800">Não poderei ir</p>
                  <p className="text-sm text-stone-400">Infelizmente não poderei comparecer</p>
                </div>
              </button>
            </div>

            {/* Companions */}
            {status === 'confirmed' && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <p className="text-sm text-stone-500 mb-3">
                  Quantos acompanhantes virão com você?
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCompanions(Math.max(0, companions - 1))}
                    className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition"
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
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span className="text-2xl font-medium text-stone-800 w-12 text-center">
                    {companions}
                  </span>
                  <button
                    onClick={() => setCompanions(companions + 1)}
                    className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-stone-400 text-center mt-2">
                  Total: {1 + companions} pessoa{1 + companions > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || status === 'pending'}
              className="w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl transition disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>

      {/* Remove Gifts Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCancelRemove}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100">
              <h3 className="text-lg font-medium text-stone-800">
                {myGifts.length === 1
                  ? 'Remover presente?'
                  : 'Remover presentes?'}
              </h3>
              <p className="text-sm text-stone-500 mt-1">
                {myGifts.length === 1
                  ? 'Como você não irá comparecer, deseja desmarcar o presente selecionado?'
                  : 'Como você não irá comparecer, deseja desmarcar os presentes selecionados?'}
              </p>
            </div>

            {/* Gifts list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {myGifts.length === 1 ? (
                <div className="bg-stone-50 rounded-lg p-4 text-center">
                  <p className="text-stone-800 font-medium">{myGifts[0].name}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {GIFT_CATEGORY_LABELS[myGifts[0].category]}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category}>
                      <p className="text-xs text-stone-400 mb-2">
                        {GIFT_CATEGORY_LABELS[category]}
                      </p>
                      <div className="space-y-2">
                        {groupedGifts[category].map((gift) => {
                          const isSelected = giftsToRemove.has(gift.id);
                          return (
                            <button
                              key={gift.id}
                              onClick={() => toggleGiftToRemove(gift.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
                                isSelected
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white border-stone-200'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-stone-300'
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3 text-white"
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
                              </div>
                              <span
                                className={`text-sm ${
                                  isSelected ? 'text-red-700' : 'text-stone-700'
                                }`}
                              >
                                {gift.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-stone-100 flex gap-3">
              <button
                onClick={handleCancelRemove}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveGifts}
                disabled={isRemovingGifts}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition disabled:opacity-50"
              >
                {isRemovingGifts ? (
                  'Removendo...'
                ) : myGifts.length === 1 ? (
                  'Remover'
                ) : giftsToRemove.size === myGifts.length ? (
                  'Remover todos'
                ) : giftsToRemove.size === 0 ? (
                  'Manter todos'
                ) : (
                  `Remover ${giftsToRemove.size} presente${giftsToRemove.size !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
