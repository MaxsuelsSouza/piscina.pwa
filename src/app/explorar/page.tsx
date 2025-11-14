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
import { getUserLocation, calculateDistance, type UserLocation } from '@/services/geolocation.service';
import { useToast } from '@/hooks/useToast';

export default function ExplorePage() {
  const { venues, loading, error } = useVenues();
  const toast = useToast();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationCity, setLocationCity] = useState('Olinda');
  const [locationState, setLocationState] = useState('PE');

  // Atualiza o título da página
  useEffect(() => {
    document.title = 'Explorar Espaços - Piscina';
    return () => {
      document.title = 'Piscina';
    };
  }, []);

  // Função para pegar localização do usuário
  const handleGetLocation = async () => {
    setLoadingLocation(true);
    const location = await getUserLocation();

    if (location) {
      setUserLocation(location);
      if (location.city) {
        setLocationCity(location.city);
      }
      if (location.state) {
        setLocationState(location.state);
      }
    } else {
      toast.error('Não foi possível obter sua localização. Verifique as permissões do navegador.');
    }

    setLoadingLocation(false);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Filtra e ordena os espaços
  const filteredVenues = venues
    .filter((venue) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        venue.businessName?.toLowerCase().includes(searchLower) ||
        venue.displayName?.toLowerCase().includes(searchLower) ||
        venue.location?.city?.toLowerCase().includes(searchLower) ||
        venue.location?.neighborhood?.toLowerCase().includes(searchLower)
      );
    })
    .map((venue) => {
      // Calcula distância se tiver localização do usuário
      if (userLocation && venue.location?.latitude && venue.location?.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          venue.location.latitude,
          venue.location.longitude
        );
        return { ...venue, distance };
      }
      return { ...venue, distance: undefined };
    })
    .filter((venue) => {
      // Se tiver localização do usuário, filtra por raio de 10km
      if (userLocation && venue.distance !== undefined) {
        return venue.distance <= 10; // Apenas espaços dentro de 10km
      }
      return true; // Se não tiver localização, mostra todos
    })
    .sort((a, b) => {
      // Ordena por distância se disponível
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header compacto */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                Espaços de Festa em {locationCity}, {locationState}
              </h1>

              {/* Botão de localização */}
              <button
                onClick={handleGetLocation}
                disabled={loadingLocation}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Usar minha localização"
              >
                {loadingLocation ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {loadingLocation ? 'Buscando...' : 'Minha localização'}
              </button>
            </div>

            {/* Busca compacta */}
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar espaços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo: Lista + Mapa lado a lado */}
      {filteredVenues.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex justify-center">
          <div className="w-full max-w-7xl flex overflow-hidden">
            {/* Lista de espaços - Esquerda */}
            <div className="w-full lg:w-[35%] overflow-y-auto bg-white border-r border-gray-200">
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  {filteredVenues.length} {filteredVenues.length === 1 ? 'espaço encontrado' : 'espaços encontrados'}
                </p>

                <div className="space-y-3">
                  {filteredVenues.map((venue) => (
                    <div
                      key={venue.uid}
                      onClick={() => setSelectedVenue(venue)}
                    >
                      <VenueCard
                        venue={venue}
                        isSelected={selectedVenue?.uid === venue.uid}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mapa - Direita (Desktop) */}
            <div className="hidden lg:block lg:w-[65%] relative">
              <VenueMap selectedVenue={selectedVenue} userLocation={userLocation} />
            </div>
          </div>

          {/* Mapa fullscreen (Mobile) */}
          {showMap && (
            <div className="fixed inset-0 bg-white z-50 lg:hidden">
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
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="h-full pt-[73px]">
                <VenueMap selectedVenue={selectedVenue} userLocation={userLocation} />
              </div>
            </div>
          )}

          {/* Botão flutuante para abrir mapa no mobile */}
          <button
            onClick={() => setShowMap(true)}
            className="lg:hidden fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-40"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver Mapa
          </button>
        </div>
      )}
    </div>
  );
}
