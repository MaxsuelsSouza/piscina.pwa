'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { isAdmin as checkIsAdmin, ADMIN_PHONE } from '../../_config/admin';

interface Guest {
  phone: string;
  fullName: string;
  hasPassword: boolean;
  presenceStatus: 'confirmed' | 'declined' | 'pending' | null;
  companions: number;
  companionNames: string[];
  createdAt: string;
}

interface Stats {
  total: number;
  withPassword: number;
  withoutPassword: number;
  confirmed: number;
  declined: number;
  pending: number;
}

export default function ConvidadosPage() {
  const router = useRouter();
  const { client, loading: authLoading } = useClientAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for new guest
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'declined' | 'pending'>('all');

  const isAdmin = checkIsAdmin(client?.phone);

  useEffect(() => {
    if (!authLoading && !client) {
      router.replace('/lista-casamento');
    } else if (!authLoading && client && !isAdmin) {
      router.replace('/lista-casamento/presentes');
    }
  }, [authLoading, client, isAdmin, router]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/guests?phone=${ADMIN_PHONE}`);
      const data = await res.json();

      if (data.guests) {
        setGuests(data.guests);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar convidados:', error);
      showMessage('error', 'Erro ao carregar convidados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchGuests();
    }
  }, [isAdmin]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddGuest = async () => {
    if (!newGuestName.trim() || !newGuestPhone.trim()) {
      showMessage('error', 'Nome e telefone são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/public/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: ADMIN_PHONE,
          fullName: newGuestName.trim(),
          guestPhone: newGuestPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar convidado');
      }

      showMessage('success', `Convidado "${newGuestName}" cadastrado!`);
      setNewGuestName('');
      setNewGuestPhone('');
      setShowAddForm(false);
      await fetchGuests();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao cadastrar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuest = async (guest: Guest) => {
    if (!confirm(`Tem certeza que deseja excluir "${guest.fullName}"?\n\nIsso também removerá os presentes selecionados por esta pessoa.`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/public/guests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: ADMIN_PHONE,
          guestPhone: guest.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir convidado');
      }

      showMessage('success', `Convidado "${guest.fullName}" excluído!`);
      await fetchGuests();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePresence = async (guest: Guest, status: 'confirmed' | 'declined' | 'pending') => {
    setSaving(true);
    try {
      const res = await fetch('/api/public/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: ADMIN_PHONE,
          guestPhone: guest.phone,
          status,
          companions: status === 'confirmed' ? guest.companions : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar presença');
      }

      showMessage('success', `Presença de "${guest.fullName}" atualizada!`);
      await fetchGuests();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const filteredGuests = guests.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return g.presenceStatus === 'confirmed';
    if (filter === 'declined') return g.presenceStatus === 'declined';
    if (filter === 'pending') return !g.presenceStatus || g.presenceStatus === 'pending';
    return true;
  });

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

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/lista-casamento/workspace"
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
            <h1 className="text-lg font-serif text-stone-800">Painel de Convidados</h1>
            <p className="text-xs text-stone-400">{stats?.total || 0} convidados cadastrados</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-600 text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
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

      {/* Add Guest Form */}
      {showAddForm && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-base font-medium text-stone-800 mb-4">Novo Convidado</h2>
            <p className="text-xs text-stone-500 mb-4">
              O convidado precisará criar sua senha no primeiro acesso ao sistema.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                />
              </div>

              <div>
                <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1">Telefone (com DDD)</label>
                <input
                  type="tel"
                  value={newGuestPhone}
                  onChange={(e) => setNewGuestPhone(e.target.value)}
                  placeholder="Ex: 81999999999"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  style={{ color: '#1c1917' }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewGuestName('');
                    setNewGuestPhone('');
                  }}
                  className="flex-1 py-2 text-stone-600 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddGuest}
                  disabled={saving || !newGuestName.trim() || !newGuestPhone.trim()}
                  className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-700">{stats.confirmed}</p>
              <p className="text-xs text-emerald-600">Confirmados</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
              <p className="text-2xl font-bold text-red-700">{stats.declined}</p>
              <p className="text-xs text-red-600">Recusados</p>
            </div>
            <div className="bg-stone-100 rounded-lg p-3 text-center border border-stone-200">
              <p className="text-2xl font-bold text-stone-700">{stats.pending}</p>
              <p className="text-xs text-stone-600">Pendentes</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'confirmed', label: 'Confirmados' },
            { value: 'declined', label: 'Recusados' },
            { value: 'pending', label: 'Pendentes' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition ${
                filter === f.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guests List */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {filteredGuests.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
            <p className="text-stone-400">
              {filter === 'all' ? 'Nenhum convidado cadastrado' : 'Nenhum convidado nesta categoria'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
            {filteredGuests.map((guest) => (
              <div key={guest.phone} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {guest.fullName}
                      </p>
                      {!guest.hasPassword && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Sem senha
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      ***{guest.phone.slice(-4)}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                    guest.presenceStatus === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : guest.presenceStatus === 'declined'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-stone-100 text-stone-600'
                  }`}>
                    {guest.presenceStatus === 'confirmed'
                      ? 'Confirmado'
                      : guest.presenceStatus === 'declined'
                        ? 'Recusado'
                        : 'Pendente'}
                  </div>
                </div>

                {/* Companion Names */}
                {guest.presenceStatus === 'confirmed' && guest.companionNames && guest.companionNames.length > 0 && (
                  <div className="mt-2 bg-stone-50 rounded-lg p-2">
                    <p className="text-xs text-stone-400 mb-1">Acompanhantes:</p>
                    <div className="flex flex-wrap gap-1">
                      {guest.companionNames.map((name, idx) => (
                        <span key={idx} className="text-xs bg-white text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                          {name || `Acompanhante ${idx + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {guest.presenceStatus !== 'confirmed' && (
                    <button
                      onClick={() => handleUpdatePresence(guest, 'confirmed')}
                      disabled={saving}
                      className="flex-1 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  )}
                  {guest.presenceStatus !== 'declined' && (
                    <button
                      onClick={() => handleUpdatePresence(guest, 'declined')}
                      disabled={saving}
                      className="flex-1 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Recusar
                    </button>
                  )}
                  {guest.presenceStatus && guest.presenceStatus !== 'pending' && (
                    <button
                      onClick={() => handleUpdatePresence(guest, 'pending')}
                      disabled={saving}
                      className="flex-1 py-1.5 text-xs bg-stone-50 text-stone-600 rounded-lg hover:bg-stone-100 transition disabled:opacity-50"
                    >
                      Pendente
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteGuest(guest)}
                    disabled={saving}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Excluir convidado"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
