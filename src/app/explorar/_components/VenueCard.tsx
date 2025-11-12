/**
 * Card de espaço de festa - Design compacto horizontal para lista
 */

import Link from 'next/link';
import type { Venue } from '../_types';

interface VenueCardProps {
  venue: Venue & { distance?: number };
  isSelected?: boolean;
}

export function VenueCard({ venue, isSelected = false }: VenueCardProps) {
  const venueName = venue.businessName || venue.displayName || 'Espaço sem nome';
  const venueSlug = venue.publicSlug;

  // Informações de localização
  const city = venue.location?.city;
  const neighborhood = venue.location?.neighborhood;
  const locationText = neighborhood || city || 'Localização';

  // Informações do espaço
  const capacity = venue.venueInfo?.capacity;
  const phone = venue.venueInfo?.phone;
  const distance = venue.distance;

  // Cores para thumbnail
  const colors = ['#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12'];
  const color = colors[Math.abs(venue.uid.charCodeAt(0)) % colors.length];

  if (!venueSlug) {
    return null;
  }

  return (
    <div
      className={`flex gap-3 p-3 bg-white border rounded-xl transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Thumbnail compacto */}
      <div
        className="flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
            {venueName}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {distance !== undefined ? (
              <div className="flex items-center gap-1 font-medium text-blue-600 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{locationText}</span>
              </div>
            )}
            {capacity && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {capacity}
              </div>
            )}
          </div>
        </div>

        {/* Botão compacto */}
        <Link
          href={`/agendamento/${venueSlug}`}
          className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors w-fit"
          onClick={(e) => e.stopPropagation()}
        >
          Ver disponibilidade
          <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Indicador de seleção */}
      {isSelected && (
        <div className="flex-shrink-0 flex items-center">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
