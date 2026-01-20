'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { GIFT_CATEGORY_LABELS, type GiftCategory } from '@/types/gift';
import { ADMIN_PHONE } from '@/config/admin';

interface GuestGift {
  id: string;
  name: string;
  category: string;
}

interface Guest {
  phone: string;
  name: string;
  presenceStatus: 'pending' | 'confirmed' | 'declined' | null;
  companions: number;
  gifts: GuestGift[];
  createdAt: string;
}

interface Stats {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  totalCompanions: number;
  totalAttending: number;
  giftsSelected: number;
  giftsTotal: number;
}

type FilterType = 'all' | 'confirmed' | 'declined' | 'pending';

export default function AdminPage() {
  const router = useRouter();
  const { client, loading: clientLoading } = useClientAuth();
  const { user: firebaseUser, loading: firebaseLoading } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);

  const authLoading = clientLoading || firebaseLoading;
  // Admin é quem está logado via Firebase Auth
  const isAdmin = !!firebaseUser;
  const isAuthenticated = client || firebaseUser;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      router.replace('/presentes');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Se logado via Firebase Auth, usa ADMIN_PHONE; se via ClientAuth, usa o telefone do cliente
      const phoneToUse = firebaseUser ? ADMIN_PHONE : client?.phone?.replace(/\D/g, '');
      const res = await fetch(`/api/public/gifts/admin?phone=${phoneToUse}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao buscar dados');
      }

      setGuests(data.guests);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter((guest) => {
    switch (filter) {
      case 'confirmed':
        return guest.presenceStatus === 'confirmed';
      case 'declined':
        return guest.presenceStatus === 'declined';
      case 'pending':
        return !guest.presenceStatus || guest.presenceStatus === 'pending';
      default:
        return true;
    }
  });

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    if (phone.length === 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: Guest['presenceStatus']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
            Confirmado
          </span>
        );
      case 'declined':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            Não vai
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
            Pendente
          </span>
        );
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/workspace"
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
            <h1 className="text-lg font-serif text-stone-800">Painel Admin</h1>
            <p className="text-xs text-stone-400">Gerenciar convidados</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-bold text-stone-800">{stats.totalAttending}</p>
              <p className="text-xs text-stone-500">Pessoas confirmadas</p>
              <p className="text-xs text-stone-400 mt-1">
                {stats.confirmed} convidados + {stats.totalCompanions} acompanhantes
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-2xl font-bold text-stone-800">
                {stats.giftsSelected}/{stats.giftsTotal}
              </p>
              <p className="text-xs text-stone-500">Presentes escolhidos</p>
              <p className="text-xs text-stone-400 mt-1">
                {Math.round((stats.giftsSelected / stats.giftsTotal) * 100)}% da lista
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{stats.confirmed}</p>
              <p className="text-xs text-emerald-600">Confirmados</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
              <p className="text-xl font-bold text-red-700">{stats.declined}</p>
              <p className="text-xs text-red-600">Não vão</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-xs text-amber-600">Pendentes</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="max-w-2xl mx-auto px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'confirmed', 'declined', 'pending'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition ${
                filter === f
                  ? 'bg-stone-800 text-white'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {f === 'all' && `Todos (${guests.length})`}
              {f === 'confirmed' && `Confirmados (${stats?.confirmed || 0})`}
              {f === 'declined' && `Não vão (${stats?.declined || 0})`}
              {f === 'pending' && `Pendentes (${stats?.pending || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Guests List */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            Nenhum convidado encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGuests.map((guest) => {
              const isExpanded = expandedGuest === guest.phone;

              return (
                <div
                  key={guest.phone}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden"
                >
                  {/* Guest header */}
                  <button
                    onClick={() => setExpandedGuest(isExpanded ? null : guest.phone)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-stone-800 truncate">
                          {guest.name}
                        </p>
                        {getStatusBadge(guest.presenceStatus)}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {formatPhone(guest.phone)}
                        {guest.presenceStatus === 'confirmed' && guest.companions > 0 && (
                          <span className="ml-2">
                            +{guest.companions} acompanhante{guest.companions > 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {guest.gifts.length > 0 && (
                        <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                          {guest.gifts.length} presente{guest.gifts.length > 1 ? 's' : ''}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-stone-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-stone-100">
                      {/* Status info */}
                      <div className="py-3 border-b border-stone-100">
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-stone-500">Status: </span>
                            <span className="font-medium">
                              {guest.presenceStatus === 'confirmed'
                                ? 'Vai comparecer'
                                : guest.presenceStatus === 'declined'
                                  ? 'Não vai comparecer'
                                  : 'Aguardando resposta'}
                            </span>
                          </div>
                          {guest.presenceStatus === 'confirmed' && (
                            <div>
                              <span className="text-stone-500">Acompanhantes: </span>
                              <span className="font-medium">{guest.companions}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gifts */}
                      <div className="pt-3">
                        <p className="text-xs text-stone-500 mb-2">
                          Presentes escolhidos ({guest.gifts.length})
                        </p>
                        {guest.gifts.length === 0 ? (
                          <p className="text-sm text-stone-400 italic">
                            Nenhum presente selecionado
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {guest.gifts.map((gift) => (
                              <div
                                key={gift.id}
                                className="flex items-center justify-between text-sm py-1"
                              >
                                <span className="text-stone-700">{gift.name}</span>
                                <span className="text-xs text-stone-400">
                                  {GIFT_CATEGORY_LABELS[gift.category as GiftCategory]?.split(' - ')[0] || gift.category}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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
  );
}
