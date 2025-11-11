/**
 * Tipos para a página de explorar espaços
 */

import type { VenueLocation, VenueInfo } from '@/types/user';

export interface Venue {
  uid: string;
  displayName?: string;
  businessName?: string;
  publicSlug?: string;
  location?: VenueLocation;
  venueInfo?: VenueInfo;
}

export interface VenuesResponse {
  success: boolean;
  venues?: Venue[];
  error?: string;
}
