/**
 * Componente de mapa que mostra a localização do espaço selecionado
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Venue } from '../_types';

interface VenueMapProps {
  selectedVenue: Venue | null;
}

export function VenueMap({ selectedVenue }: VenueMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && selectedVenue) {
      // Monta o endereço completo para busca no Google Maps
      const location = selectedVenue.location;
      let searchQuery = '';

      if (location?.latitude && location?.longitude) {
        // Se tiver coordenadas, usa elas (mais preciso)
        searchQuery = `${location.latitude},${location.longitude}`;
      } else if (location) {
        // Senão, monta o endereço textual
        const parts = [
          location.street,
          location.number,
          location.neighborhood,
          location.city,
          location.state,
        ].filter(Boolean);
        searchQuery = parts.join(', ');
      } else {
        // Fallback: usa o nome do estabelecimento
        searchQuery = selectedVenue.businessName || selectedVenue.displayName || '';
      }

      // Atualiza o src do iframe
      const encodedQuery = encodeURIComponent(searchQuery);
      iframeRef.current.src = `https://maps.google.com/maps?q=${encodedQuery}&output=embed&z=15`;
    }
  }, [selectedVenue]);

  if (!selectedVenue) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Selecione um espaço</p>
          <p className="text-xs text-gray-500">A localização será exibida aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
