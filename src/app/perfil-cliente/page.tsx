'use client';

/**
 * Página de Perfil do Cliente Público
 * Mostra todos os agendamentos do cliente (confirmados, pendentes, expirados)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import type { Booking } from '@/app/(home)/_types/booking';

interface VenueInfo {
  slug: string;
  businessName: string;
  displayName: string;
  location?: {
    latitude?: number;
    longitude?: number;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
}

export default function PerfilClientePage() {
  const router = useRouter();
  const { client, loading: authLoading, logout } = useClientAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [venues, setVenues] = useState<VenueInfo[]>([]);

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!authLoading && !client) {
      router.push('/login-cliente?returnUrl=/perfil-cliente');
    }
  }, [client, authLoading, router]);

  // Busca agendamentos do cliente
  useEffect(() => {
    const fetchBookings = async () => {
      if (!client) return;

      try {
        console.log('🔍 Buscando agendamentos para telefone:', client.phone);

        // Usa API route para buscar agendamentos (bypassa regras do Firestore)
        const response = await fetch('/api/client/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: client.phone,
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Agendamentos encontrados:', result.bookings.length);
          setBookings(result.bookings);
        } else {
          console.error('❌ Erro na resposta:', result.error);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [client]);

  // Busca informações dos espaços únicos
  useEffect(() => {
    const fetchVenues = async () => {
      if (bookings.length === 0) return;

      try {
        // Extrai slugs únicos dos bookings
        const uniqueSlugs = Array.from(
          new Set(
            bookings
              .map((b) => b.clientSlug)
              .filter((slug): slug is string => !!slug)
          )
        );

        if (uniqueSlugs.length === 0) return;

        // Busca informações de cada espaço
        const venuesData = await Promise.all(
          uniqueSlugs.map(async (slug) => {
            try {
              const response = await fetch(`/api/public/client/${slug}`);
              const result = await response.json();

              if (result.success && result.client) {
                return {
                  slug,
                  businessName: result.client.businessName || '',
                  displayName: result.client.displayName || '',
                  location: result.client.location || undefined,
                };
              }
              return null;
            } catch (error) {
              console.error(`Erro ao buscar espaço ${slug}:`, error);
              return null;
            }
          })
        );

        // Filtra nulls e atualiza state
        const validVenues = venuesData.filter((v): v is NonNullable<typeof v> => v !== null);
        setVenues(validVenues);
      } catch (error) {
        console.error('Erro ao buscar espaços:', error);
      }
    };

    fetchVenues();
  }, [bookings]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getStatusBadge = (booking: Booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.date + 'T00:00:00');

    if (booking.status === 'confirmed') {
      return <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">Confirmado</span>;
    }

    if (booking.status === 'cancelled') {
      return <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">Cancelado</span>;
    }

    if (booking.status === 'pending') {
      // Verifica se expirou
      if (booking.expiresAt) {
        const expiresAt = new Date(booking.expiresAt);
        if (now > expiresAt) {
          return <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">Expirado</span>;
        }
      }

      return <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">Pendente</span>;
    }

    return <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">{booking.status}</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Olá, {client.fullName}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Card de Informações do Cliente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Suas Informações</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Telefone:</span>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{client.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Data de Nascimento:</span>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {new Date(client.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Agendamentos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Meus Agendamentos</h2>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-gray-400 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-300">Você ainda não tem agendamentos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(booking.date)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Dia Inteiro (08:00 - 22:00)</p>
                    </div>
                    {getStatusBadge(booking)}
                  </div>

                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Observações:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{booking.notes}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Criado em {new Date(booking.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {booking.payment?.status === 'paid' && (
                      <span className="text-green-600 dark:text-green-400 font-medium">● Pago</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Espaços onde fez agendamentos */}
        {venues.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Espaços Onde Você Agendou</h2>
            <div className="space-y-3">
              {venues.map((venue) => (
                <div
                  key={venue.slug}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={`/agendamento/${venue.slug}`}
                      className="flex items-center gap-3 flex-1 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                        <svg
                          className="w-6 h-6 text-blue-600 dark:text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {venue.businessName || venue.displayName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {bookings.filter((b) => b.clientSlug === venue.slug).length} agendamento(s)
                        </p>
                        {venue.location?.street && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {venue.location.street}{venue.location.number ? `, ${venue.location.number}` : ''} - {venue.location.neighborhood || venue.location.city}
                          </p>
                        )}
                      </div>
                    </a>

                    {/* Botão Waze */}
                    {venue.location?.latitude && venue.location?.longitude && (
                      <a
                        href={`https://waze.com/ul?ll=${venue.location.latitude},${venue.location.longitude}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 px-4 py-2 bg-[#33CCFF] text-white rounded-lg hover:bg-[#00B8FF] transition-colors font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.5 0C6.804 0 3 3.804 3 8.5c0 6.5 8.5 15.5 8.5 15.5s8.5-9 8.5-15.5C20 3.804 16.196 0 11.5 0zm0 11.5c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                        </svg>
                        Waze
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Agendamento */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detalhes do Agendamento</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-center">
                {getStatusBadge(selectedBooking)}
              </div>

              {/* Data */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Data do Agendamento</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedBooking.date)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Dia Inteiro (08:00 - 22:00)</p>
              </div>

              {/* Informações */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nome</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedBooking.customerName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {selectedBooking.customerPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                  </p>
                </div>

                {selectedBooking.customerEmail && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedBooking.customerEmail}</p>
                  </div>
                )}

                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Observações</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedBooking.notes}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Criado em</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(selectedBooking.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Status de Pagamento */}
                {selectedBooking.payment && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pagamento</p>
                    <div className="flex items-center gap-2">
                      {selectedBooking.payment.status === 'paid' ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-700 dark:text-green-400 font-medium">Pago</span>
                        </>
                      ) : selectedBooking.payment.status === 'pending' ? (
                        <>
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          <span className="text-yellow-700 dark:text-yellow-400 font-medium">Pendente</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {selectedBooking.payment.status || 'N/A'}
                          </span>
                        </>
                      )}
                    </div>
                    {selectedBooking.payment.amount && (
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-2">
                        R$ {selectedBooking.payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                )}

                {/* Informação de Expiração */}
                {selectedBooking.status === 'pending' && selectedBooking.expiresAt && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {new Date() > new Date(selectedBooking.expiresAt) ? (
                        <>
                          <span className="font-medium">⚠️ Agendamento expirado</span>
                          <br />
                          <span className="text-xs">
                            Expirou em: {new Date(selectedBooking.expiresAt).toLocaleString('pt-BR')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">⏳ Aguardando confirmação</span>
                          <br />
                          <span className="text-xs">
                            Expira em: {new Date(selectedBooking.expiresAt).toLocaleString('pt-BR')}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 rounded-b-2xl">
              <div className="flex gap-3">
                {/* Botão WhatsApp */}
                <a
                  href={`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá! Tenho um agendamento para o dia ${formatDate(selectedBooking.date)}.\n\nNome: ${selectedBooking.customerName}\nTelefone: ${selectedBooking.customerPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>

                {/* Botão Fechar */}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
