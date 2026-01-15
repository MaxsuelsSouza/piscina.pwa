'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/contexts/ClientAuthContext';

type PresenceStatus = 'pending' | 'confirmed' | 'declined' | null;

const ADMIN_PHONE = '81994625990';

export default function HomePage() {
  const router = useRouter();
  const { client, loading, logout } = useClientAuth();
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>(null);
  const [presenceCompanions, setPresenceCompanions] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isAdmin = client?.phone?.replace(/\D/g, '') === ADMIN_PHONE;

  useEffect(() => {
    if (!loading && !client) {
      router.replace('/lista-casamento');
    }
  }, [loading, client, router]);

  // Fetch presence status
  useEffect(() => {
    if (client?.phone) {
      fetch(`/api/public/presence?phone=${client.phone}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.confirmation) {
            setPresenceStatus(data.confirmation.status);
            setPresenceCompanions(data.confirmation.companions || 0);
          }
        })
        .catch(console.error);
    }
  }, [client?.phone]);

  // Handle click on Lista de Presentes
  const handleGiftListClick = (e: React.MouseEvent) => {
    // Only block if explicitly declined
    if (presenceStatus === 'declined') {
      e.preventDefault();
      setShowConfirmModal(true);
    }
    // Allow navigation for everyone else (confirmed, pending, or no response)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif text-stone-800">
              Lista de Casamento
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              Olá, {client?.fullName?.split(' ')[0]}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-stone-400 hover:text-stone-600"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Menu Options */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Admin Panel - Only for admin */}
          {isAdmin && (
            <Link
              href="/lista-casamento/presentes/admin"
              className="block bg-purple-50 rounded-2xl border border-purple-200 p-6 hover:border-purple-300 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-purple-800">
                    Painel Admin
                  </h2>
                  <p className="text-sm text-purple-600">
                    Gerenciar convidados e presentes
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-purple-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          )}

          {/* Guest options - hidden for admin */}
          {!isAdmin && (
            <>
              {/* Confirmar Presença */}
              <Link
            href="/lista-casamento/presentes/confirmar"
            className={`block rounded-2xl border p-6 hover:shadow-sm transition ${
              presenceStatus === 'confirmed'
                ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                : presenceStatus === 'declined'
                  ? 'bg-red-50 border-red-200 hover:border-red-300'
                  : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  presenceStatus === 'confirmed'
                    ? 'bg-emerald-200'
                    : presenceStatus === 'declined'
                      ? 'bg-red-200'
                      : 'bg-emerald-100'
                }`}
              >
                {presenceStatus === 'declined' ? (
                  <svg
                    className="w-6 h-6 text-red-600"
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
                    className="w-6 h-6 text-emerald-600"
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
                )}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-lg font-medium ${
                    presenceStatus === 'confirmed'
                      ? 'text-emerald-800'
                      : presenceStatus === 'declined'
                        ? 'text-red-800'
                        : 'text-stone-800'
                  }`}
                >
                  {presenceStatus === 'confirmed'
                    ? 'Presença Confirmada!'
                    : presenceStatus === 'declined'
                      ? 'Não Comparecerá'
                      : 'Confirmar Presença'}
                </h2>
                <p
                  className={`text-sm ${
                    presenceStatus === 'confirmed'
                      ? 'text-emerald-600'
                      : presenceStatus === 'declined'
                        ? 'text-red-600'
                        : 'text-stone-400'
                  }`}
                >
                  {presenceStatus === 'confirmed'
                    ? presenceCompanions > 0
                      ? `Você + ${presenceCompanions} acompanhante${presenceCompanions > 1 ? 's' : ''}`
                      : 'Você confirmou sua presença'
                    : presenceStatus === 'declined'
                      ? 'Toque para alterar'
                      : 'Confirme sua presença no casamento'}
                </p>
              </div>
              <svg
                className={`w-5 h-5 ${
                  presenceStatus === 'confirmed'
                    ? 'text-emerald-300'
                    : presenceStatus === 'declined'
                      ? 'text-red-300'
                      : 'text-stone-300'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Meus Presentes */}
          <Link
            href="/lista-casamento/presentes/meus"
            className="block bg-white rounded-2xl border border-stone-200 p-6 hover:border-stone-300 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-rose-600"
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
              <div className="flex-1">
                <h2 className="text-lg font-medium text-stone-800">
                  Meus Presentes
                </h2>
                <p className="text-sm text-stone-400">
                  Veja os presentes que você escolheu
                </p>
              </div>
              <svg
                className="w-5 h-5 text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          {/* Lista de Presentes */}
          <Link
            href="/lista-casamento/presentes/categorias"
            onClick={handleGiftListClick}
            className={`block rounded-2xl border p-6 hover:shadow-sm transition ${
              presenceStatus === 'declined'
                ? 'bg-stone-100 border-stone-200 opacity-60'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                presenceStatus === 'declined' ? 'bg-stone-200' : 'bg-amber-100'
              }`}>
                <svg
                  className={`w-6 h-6 ${presenceStatus === 'declined' ? 'text-stone-400' : 'text-amber-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-medium ${
                  presenceStatus === 'declined' ? 'text-stone-500' : 'text-stone-800'
                }`}>
                  Lista de Presentes
                </h2>
                <p className={`text-sm ${
                  presenceStatus === 'declined' ? 'text-stone-400' : 'text-stone-400'
                }`}>
                  {presenceStatus === 'declined'
                    ? 'Confirme presença para escolher'
                    : 'Explore todas as categorias'}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
            </>
          )}
        </div>
      </div>

      {/* Confirm Presence Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-stone-800 mb-2">
              Você informou que não virá
            </h3>

            <p className="text-sm text-stone-500 mb-6">
              Para escolher presentes, você precisa confirmar que irá comparecer ao casamento.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 text-stone-600 font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
              >
                Fechar
              </button>
              <Link
                href="/lista-casamento/presentes/confirmar"
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition text-center"
              >
                Confirmar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
