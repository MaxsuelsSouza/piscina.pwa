'use client';

/**
 * Página pública para explorar espaços de festa
 * URL: /explorar
 */

import { useEffect, useState } from 'react';
import { useVenues } from './_hooks/useVenues';
import type { Venue } from './_types';
import {
  VenueCard,
  LoadingState,
  ErrorState,
  EmptyState,
  VenueMap,
} from './_components';

export default function ExplorePage() {
  const { venues, loading, error } = useVenues();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Atualiza o título da página
  useEffect(() => {
    document.title = 'Explorar Espaços - Piscina';
    return () => {
      document.title = 'Piscina';
    };
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Filtra os espaços pela busca
  const filteredVenues = venues.filter((venue) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      venue.businessName?.toLowerCase().includes(searchLower) ||
      venue.displayName?.toLowerCase().includes(searchLower) ||
      venue.location?.city?.toLowerCase().includes(searchLower) ||
      venue.location?.neighborhood?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com busca */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Título e busca */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Espaços de Festa</h1>
              <p className="text-gray-600">Descubra o local perfeito para seu evento</p>
            </div>

            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nome ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filtros e toggle do mapa */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                {filteredVenues.length} {filteredVenues.length === 1 ? 'espaço encontrado' : 'espaços encontrados'}
              </span>
            </div>

            {/* Botão de mapa */}
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showMap
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? 'Ocultar mapa' : 'Mostrar mapa'}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredVenues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12">
            <EmptyState />
          </div>
        ) : (
          <div className="relative">
            {/* Grid de cards */}
            <div className={`grid ${showMap ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 transition-all duration-300`}>
              {filteredVenues.map((venue) => (
                <div
                  key={venue.uid}
                  onClick={() => {
                    setSelectedVenue(venue);
                    if (!showMap) setShowMap(true);
                  }}
                >
                  <VenueCard
                    venue={venue}
                    isSelected={selectedVenue?.uid === venue.uid && showMap}
                  />
                </div>
              ))}
            </div>

            {/* Mapa fixo lateral quando ativo (Desktop) */}
            {showMap && (
              <div className="fixed top-[180px] right-6 w-[500px] h-[calc(100vh-220px)] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white z-30 hidden lg:block">
                <VenueMap selectedVenue={selectedVenue} />
              </div>
            )}

            {/* Mapa fullscreen quando ativo (Mobile) */}
            {showMap && (
              <div className="fixed inset-0 bg-white z-50 lg:hidden">
                {/* Header do mapa mobile */}
                <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <div>
                        <h2 className="font-semibold text-gray-900">Mapa</h2>
                        {selectedVenue && (
                          <p className="text-xs text-gray-500">
                            {selectedVenue.businessName || selectedVenue.displayName}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMap(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Fechar mapa"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Mapa */}
                <div className="h-full pt-[73px]">
                  <VenueMap selectedVenue={selectedVenue} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
