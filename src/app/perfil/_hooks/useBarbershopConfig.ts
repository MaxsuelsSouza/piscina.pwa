/**
 * Hook para gerenciar configuração de barbearia
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase/firestore/users';
import type { BarberSchedule, Professional, Service, WeekDay } from '@/types/barbershop';

const defaultSchedule: BarberSchedule = {
  slotDuration: 30,
  breakBetweenSlots: 0,
  schedule: {
    sunday: { isOpen: false, startTime: '09:00', endTime: '18:00' },
    monday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    tuesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    wednesday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    thursday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    friday: { isOpen: true, startTime: '09:00', endTime: '18:00' },
    saturday: { isOpen: true, startTime: '09:00', endTime: '14:00' },
  },
};

export function useBarbershopConfig() {
  const { user, userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<BarberSchedule>(defaultSchedule);
  const [requiresPayment, setRequiresPayment] = useState<boolean>(false);

  // Estados iniciais para comparação
  const [initialProfessionals, setInitialProfessionals] = useState<Professional[]>([]);
  const [initialServices, setInitialServices] = useState<Service[]>([]);
  const [initialSchedule, setInitialSchedule] = useState<BarberSchedule>(defaultSchedule);
  const [initialRequiresPayment, setInitialRequiresPayment] = useState<boolean>(false);

  // Carrega dados da barbearia quando userData estiver disponível
  useEffect(() => {
    if (userData?.venueInfo?.barbershopInfo) {
      const info = userData.venueInfo.barbershopInfo;
      const loadedProfessionals = info.professionals || [];
      const loadedServices = info.services || [];
      const loadedSchedule = info.schedule || defaultSchedule;
      const loadedRequiresPayment = info.requiresPayment || false;

      setProfessionals(loadedProfessionals);
      setServices(loadedServices);
      setSchedule(loadedSchedule);
      setRequiresPayment(loadedRequiresPayment);

      // Salva dados iniciais para comparação
      setInitialProfessionals(loadedProfessionals);
      setInitialServices(loadedServices);
      setInitialSchedule(loadedSchedule);
      setInitialRequiresPayment(loadedRequiresPayment);
    }
  }, [userData]);

  // Verifica se há alterações
  const hasChanges = useMemo(() => {
    // Compara requiresPayment
    if (requiresPayment !== initialRequiresPayment) return true;

    // Compara profissionais
    if (JSON.stringify(professionals) !== JSON.stringify(initialProfessionals)) return true;

    // Compara serviços
    if (JSON.stringify(services) !== JSON.stringify(initialServices)) return true;

    // Compara horários
    if (JSON.stringify(schedule) !== JSON.stringify(initialSchedule)) return true;

    return false;
  }, [professionals, services, schedule, requiresPayment, initialProfessionals, initialServices, initialSchedule, initialRequiresPayment]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Importa a função correta para usar notação de ponto
      const { updateUserProfileWithDotNotation } = await import('@/lib/firebase/firestore/users');

      // Usa notação de ponto para não sobrescrever outros campos de venueInfo
      await updateUserProfileWithDotNotation(user.uid, {
        'venueInfo.barbershopInfo': {
          professionals,
          services,
          schedule,
          requiresPayment,
        },
      });

      await refreshUserData();

      // Atualiza os dados iniciais para refletir o novo estado salvo
      setInitialProfessionals(professionals);
      setInitialServices(services);
      setInitialSchedule(schedule);
      setInitialRequiresPayment(requiresPayment);

      setSuccess('Configuração salva com sucesso!');

      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    professionals,
    services,
    schedule,
    requiresPayment,
    hasChanges,
    setProfessionals,
    setServices,
    setSchedule,
    setRequiresPayment,
    handleSave,
    loading,
    error,
    success,
    clearMessages: () => {
      setError(null);
      setSuccess(null);
    },
  };
}
