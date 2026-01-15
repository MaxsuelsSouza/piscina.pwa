'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Gift, GiftCategory } from '@/types/gift';

interface UseGiftsReturn {
  gifts: Gift[];
  loading: boolean;
  error: string | null;
  selectGift: (giftId: string) => Promise<boolean>;
  mySelections: Set<string>;
  refreshGifts: () => Promise<void>;
}

export function useGifts(clientPhone: string, clientName: string): UseGiftsReturn {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mySelections, setMySelections] = useState<Set<string>>(new Set());

  const fetchGifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/public/gifts');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao buscar presentes');
      }

      setGifts(data.gifts);

      // Set my selections based on selectedBy field (now an array)
      const myGiftIds = new Set<string>(
        data.gifts
          .filter((g: Gift) => {
            const selectedByArray = Array.isArray(g.selectedBy) ? g.selectedBy : (g.selectedBy ? [g.selectedBy] : []);
            return selectedByArray.includes(clientPhone);
          })
          .map((g: Gift) => g.id)
      );
      setMySelections(myGiftIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [clientPhone]);

  useEffect(() => {
    if (clientPhone) {
      fetchGifts();
    }
  }, [clientPhone, fetchGifts]);

  const selectGift = useCallback(
    async (giftId: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/public/gifts/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ giftId, clientPhone, clientName }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao selecionar presente');
        }

        // Update local state
        if (data.action === 'selected') {
          setMySelections((prev) => new Set([...prev, giftId]));
          setGifts((prev) =>
            prev.map((g) => {
              if (g.id === giftId) {
                const currentSelectedBy = Array.isArray(g.selectedBy) ? g.selectedBy : (g.selectedBy ? [g.selectedBy] : []);
                return { ...g, isSelected: true, selectedBy: [...currentSelectedBy, clientPhone] };
              }
              return g;
            })
          );
        } else {
          setMySelections((prev) => {
            const next = new Set(prev);
            next.delete(giftId);
            return next;
          });
          setGifts((prev) =>
            prev.map((g) => {
              if (g.id === giftId) {
                const currentSelectedBy = Array.isArray(g.selectedBy) ? g.selectedBy : (g.selectedBy ? [g.selectedBy] : []);
                const newSelectedBy = currentSelectedBy.filter((phone) => phone !== clientPhone);
                return { ...g, isSelected: newSelectedBy.length > 0, selectedBy: newSelectedBy.length > 0 ? newSelectedBy : undefined };
              }
              return g;
            })
          );
        }

        return true;
      } catch (err) {
        console.error('Erro ao selecionar presente:', err);
        return false;
      }
    },
    [clientPhone, clientName]
  );

  return {
    gifts,
    loading,
    error,
    selectGift,
    mySelections,
    refreshGifts: fetchGifts,
  };
}

// Group gifts by category
export function groupGiftsByCategory(
  gifts: Gift[]
): Record<GiftCategory, Gift[]> {
  return gifts.reduce(
    (acc, gift) => {
      if (!acc[gift.category]) {
        acc[gift.category] = [];
      }
      acc[gift.category].push(gift);
      return acc;
    },
    {} as Record<GiftCategory, Gift[]>
  );
}
