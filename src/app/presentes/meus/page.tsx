'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGifts, groupGiftsByCategory } from '@/hooks/useGifts';
import { GIFT_CATEGORY_LABELS, type GiftCategory } from '@/types/gift';

export default function MyGiftsPage() {
  const router = useRouter();
  const { client, loading: clientLoading } = useClientAuth();
  const { user: firebaseUser, loading: firebaseLoading } = useAuth();

  const authLoading = clientLoading || firebaseLoading;
  const isAuthenticated = client || firebaseUser;
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const { gifts, loading, error, selectGift, mySelections, refreshGifts } =
    useGifts(client?.phone || '', client?.fullName || '');

  // Filter only my gifts
  const myGifts = useMemo(
    () => gifts.filter((g) => mySelections.has(g.id)),
    [gifts, mySelections]
  );

  // Group by category
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
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleRemove = async (giftId: string) => {
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/presentes"
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
          <div>
            <h1 className="text-lg font-serif text-stone-800">Meus Presentes</h1>
            <p className="text-xs text-stone-400">
              {mySelections.size} presente{mySelections.size !== 1 ? 's' : ''} escolhido
              {mySelections.size !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {myGifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-stone-400"
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
            </div>
            <p className="text-stone-500 mb-4">
              Você ainda não escolheu nenhum presente
            </p>
            <Link
              href="/presentes/categorias"
              className="inline-block px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition"
            >
              Ver Lista de Presentes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <h3 className="font-medium text-stone-700 text-sm">
                    {GIFT_CATEGORY_LABELS[category]}
                  </h3>
                </div>

                {groupedGifts[category].map((gift, index) => {
                  const isRemoving = selectingId === gift.id;

                  return (
                    <div
                      key={gift.id}
                      className={`px-4 py-3 flex items-center justify-between gap-2 ${
                        index !== groupedGifts[category].length - 1
                          ? 'border-b border-stone-100'
                          : ''
                      }`}
                    >
                      <span className="text-sm text-stone-800 font-medium flex-1 min-w-0 truncate">
                        {gift.name}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {gift.link && (
                          <a
                            href={gift.link.startsWith('http') ? gift.link : `https://${gift.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          >
                            Sugestão
                          </a>
                        )}

                        <button
                          onClick={() => handleRemove(gift.id)}
                          disabled={isRemoving}
                          className="px-3 py-1 text-xs rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 transition disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Remover'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
