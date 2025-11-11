/**
 * Serviços para buscar informações do cliente público
 */

import type { ClientInfo } from '../_types';

export interface FetchClientResponse {
  success: boolean;
  client?: ClientInfo;
  error?: string;
}

/**
 * Busca informações do cliente pelo slug público
 */
export async function fetchClientBySlug(slug: string): Promise<FetchClientResponse> {
  try {
    const response = await fetch(`/api/public/client/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Cliente não encontrado',
        };
      }
      throw new Error('Erro ao buscar cliente');
    }

    const data = await response.json();

    return {
      success: true,
      client: data.client,
    };
  } catch (error: any) {
    console.error('Erro ao buscar cliente:', error);
    return {
      success: false,
      error: error.message || 'Erro ao carregar informações',
    };
  }
}
