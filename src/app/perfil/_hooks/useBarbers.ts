/**
 * Hook para gerenciar barbeiros
 */

import { useState, useEffect, useCallback } from 'react';
import { getBarbers, createBarber, updateBarberStatus, deleteBarber, type Barber, type CreateBarberData } from '@/services/barbers/barbers.service';
import { useToast } from '@/hooks/useToast';

export function useBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  /**
   * Carrega lista de barbeiros
   */
  const loadBarbers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBarbers();
      setBarbers(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar barbeiros');
      toast.error(err.message || 'Erro ao carregar barbeiros');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Cria um novo barbeiro
   */
  const addBarber = useCallback(async (barberData: CreateBarberData) => {
    try {
      const newBarber = await createBarber(barberData);
      setBarbers((prev) => [newBarber, ...prev]);
      toast.success('Barbeiro criado com sucesso!');
      return newBarber;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar barbeiro');
      throw err;
    }
  }, [toast]);

  /**
   * Ativa ou desativa um barbeiro
   */
  const toggleBarberStatus = useCallback(async (barberId: string, isActive: boolean) => {
    try {
      await updateBarberStatus(barberId, isActive);
      setBarbers((prev) =>
        prev.map((barber) =>
          barber.uid === barberId ? { ...barber, isActive } : barber
        )
      );
      toast.success(
        isActive ? 'Barbeiro ativado com sucesso!' : 'Barbeiro desativado com sucesso!'
      );
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar barbeiro');
      throw err;
    }
  }, [toast]);

  /**
   * Remove um barbeiro
   */
  const removeBarber = useCallback(async (barberId: string) => {
    try {
      await deleteBarber(barberId);
      setBarbers((prev) => prev.filter((barber) => barber.uid !== barberId));
      toast.success('Barbeiro removido com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover barbeiro');
      throw err;
    }
  }, [toast]);

  // Carrega barbeiros ao montar o componente
  useEffect(() => {
    loadBarbers();
  }, [loadBarbers]);

  return {
    barbers,
    loading,
    error,
    loadBarbers,
    addBarber,
    toggleBarberStatus,
    removeBarber,
  };
}
