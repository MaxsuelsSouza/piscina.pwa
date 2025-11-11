/**
 * Card de espaço de festa - Design minimalista e elegante
 */

import Link from 'next/link';
import type { Venue } from '../_types';

interface VenueCardProps {
  venue: Venue;
  isSelected?: boolean;
}

export function VenueCard({ venue, isSelected = false }: VenueCardProps) {
  const venueName = venue.businessName || venue.displayName || 'Espaço sem nome';
  const venueSlug = venue.publicSlug;

  // Informações de localização
  const city = venue.location?.city;
  const state = venue.location?.state;
  const neighborhood = venue.location?.neighborhood;
  const locationText = city && state ? `${neighborhood ? neighborhood + ', ' : ''}${city} - ${state}` : city || 'Localização não informada';

  // Informações do espaço
  const capacity = venue.venueInfo?.capacity;
  const phone = venue.venueInfo?.phone;
  const description = venue.venueInfo?.description;

  if (!venueSlug) {
    return null;
  }

  return (
    <div className="group cursor-pointer">
      <div
        className={`relative bg-white border overflow-hidden transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 shadow-lg'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
        style={{ borderRadius: '20px' }}
      >
        {/* Imagem placeholder minimalista */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
          {/* Grid pattern sutil */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, black 1px, transparent 1px),
                               linear-gradient(to bottom, black 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Ícone minimalista */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-300">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          {/* Indicador de seleção */}
          {isSelected && (
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1.5 leading-snug">
              {venueName}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locationText}
            </div>
          </div>

          {/* Descrição */}
          {description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Informações */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
            {capacity && (
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {capacity}
              </div>
            )}
            {phone && (
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                WhatsApp
              </div>
            )}
          </div>

          {/* Botão */}
          <Link
            href={`/agendamento/${venueSlug}`}
            className="group/btn flex items-center justify-center w-full py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Ver disponibilidade
            <svg className="w-4 h-4 ml-1.5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
