/**
 * Card flutuante Flat Design - compacto e minimalista
 */

'use client';

import Link from 'next/link';
import type { Venue } from '../_types';

interface MapVenueCardProps {
  venue: Venue;
  onClose: () => void;
}

export function MapVenueCard({ venue, onClose }: MapVenueCardProps) {
  const venueName = venue.businessName || venue.displayName || 'Espaço sem nome';
  const venueSlug = venue.publicSlug;

  // Informações de localização
  const city = venue.location?.city;
  const neighborhood = venue.location?.neighborhood;
  const locationText = neighborhood || city || 'Localização';

  // Informações do espaço
  const capacity = venue.venueInfo?.capacity;

  // Cores flat para thumbnail
  const colors = ['#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12'];
  const color = colors[Math.abs(venue.uid.charCodeAt(0)) % colors.length];

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 w-64 -mt-12">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
        {/* Pontinha apontando para baixo (para o pin) */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-lg"></div>
        {/* Thumbnail flat */}
        <div className="relative h-20 z-10" style={{ backgroundColor: color }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 z-20"
          >
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo minimal */}
        <div className="p-3 relative z-10 bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
            {venueName}
          </h3>

          <div className="flex items-center text-xs text-gray-500 mb-2">
            <svg className="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{locationText}</span>
          </div>

          {capacity && (
            <p className="text-xs text-gray-500 mb-3">Até {capacity} pessoas</p>
          )}

          {venueSlug && (
            <Link
              href={`/agendamento/${venueSlug}`}
              className="block w-full text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Ver disponibilidade
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
