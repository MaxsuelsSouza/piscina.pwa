/**
 * Hook para gerenciar a listagem de espaços
 */

import { useState, useEffect } from 'react';
import { fetchVenues } from '../_services/venues.service';
import type { Venue } from '../_types';

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true);
      setError(null);

      const response = await fetchVenues();

      if (response.success && response.venues) {
        setVenues(response.venues);
      } else {
        setError(response.error || 'Erro ao carregar espaços');
      }

      setLoading(false);
    };

    loadVenues();
  }, []);

  return {
    venues,
    loading,
    error,
  };
}
