/**
 * Serviços para buscar espaços de festa
 */

import type { VenuesResponse } from '../_types';

/**
 * Busca todos os espaços ativos
 */
export async function fetchVenues(): Promise<VenuesResponse> {
  try {
    const response = await fetch('/api/public/venues', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao buscar espaços',
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar espaços. Tente novamente.',
    };
  }
}
