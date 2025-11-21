/**
 * Hook customizado para gerenciar o formulário de perfil
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase/firestore/users';
import { ProfileFormData, initialFormData } from '../_types';

export function useProfileForm() {
  const router = useRouter();
  const { user, userData, loading: authLoading, isAdmin, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [initialData, setInitialData] = useState<ProfileFormData>(initialFormData);

  // Carrega os dados do usuário quando disponível
  useEffect(() => {
    if (userData) {
      const loadedData = {
        displayName: userData.displayName || '',
        businessName: userData.businessName || '',
        street: userData.location?.street || '',
        number: userData.location?.number || '',
        neighborhood: userData.location?.neighborhood || '',
        city: userData.location?.city || '',
        state: userData.location?.state || '',
        zipCode: userData.location?.zipCode || '',
        phone: userData.venueInfo?.phone || '',
        capacity: userData.venueInfo?.capacity?.toString() || '',
        description: userData.venueInfo?.description || '',
        instagram: userData.venueInfo?.instagram || '',
        facebook: userData.venueInfo?.facebook || '',
        condominiumPrice: userData.venueInfo?.condominiumPrice?.toString() || '',
        pixKey: userData.venueInfo?.bankingInfo?.pixKey || '',
        pixKeyType: (userData.venueInfo?.bankingInfo?.pixKeyType || '') as ProfileFormData['pixKeyType'],
        accountHolder: userData.venueInfo?.bankingInfo?.accountHolder || '',
        bankName: userData.venueInfo?.bankingInfo?.bankName || '',
        amenities: {
          pool: userData.venueInfo?.amenities?.pool || false,
          grill: userData.venueInfo?.amenities?.grill || false,
          sound: userData.venueInfo?.amenities?.sound || false,
          wifi: userData.venueInfo?.amenities?.wifi || false,
          airConditioning: userData.venueInfo?.amenities?.airConditioning || false,
          kitchen: userData.venueInfo?.amenities?.kitchen || false,
          parking: userData.venueInfo?.amenities?.parking || false,
          coveredArea: userData.venueInfo?.amenities?.coveredArea || false,
          outdoorArea: userData.venueInfo?.amenities?.outdoorArea || false,
          bathroom: userData.venueInfo?.amenities?.bathroom || false,
          furniture: userData.venueInfo?.amenities?.furniture || false,
        },
      };
      setFormData(loadedData);
      setInitialData(loadedData);
    }
  }, [userData]);

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Verifica se há mudanças no formulário
  const hasChanges = useMemo(() => {
    // Compara os campos básicos
    if (formData.displayName !== initialData.displayName) return true;
    if (formData.businessName !== initialData.businessName) return true;
    if (formData.street !== initialData.street) return true;
    if (formData.number !== initialData.number) return true;
    if (formData.neighborhood !== initialData.neighborhood) return true;
    if (formData.city !== initialData.city) return true;
    if (formData.state !== initialData.state) return true;
    if (formData.zipCode !== initialData.zipCode) return true;
    if (formData.phone !== initialData.phone) return true;
    if (formData.capacity !== initialData.capacity) return true;
    if (formData.description !== initialData.description) return true;
    if (formData.instagram !== initialData.instagram) return true;
    if (formData.facebook !== initialData.facebook) return true;
    if (formData.condominiumPrice !== initialData.condominiumPrice) return true;
    if (formData.pixKey !== initialData.pixKey) return true;
    if (formData.pixKeyType !== initialData.pixKeyType) return true;
    if (formData.accountHolder !== initialData.accountHolder) return true;
    if (formData.bankName !== initialData.bankName) return true;

    // Compara amenidades
    const amenitiesKeys = Object.keys(formData.amenities) as Array<keyof typeof formData.amenities>;
    for (const key of amenitiesKeys) {
      if (formData.amenities[key] !== initialData.amenities[key]) return true;
    }

    return false;
  }, [formData, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: {
        ...formData.amenities,
        [amenity]: !formData.amenities[amenity as keyof typeof formData.amenities],
      },
    });
  };

  // Busca endereço pelo CEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');

    setFormData({
      ...formData,
      zipCode: e.target.value,
    });

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData({
            ...formData,
            zipCode: e.target.value,
            street: data.logradouro || formData.street,
            neighborhood: data.bairro || formData.neighborhood,
            city: data.localidade || formData.city,
            state: data.uf || formData.state,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user?.uid) {
      setError('Usuário não autenticado');
      return;
    }

    if (!formData.businessName.trim()) {
      setError('Nome do estabelecimento é obrigatório');
      return;
    }

    setLoading(true);

    try {
      await updateUserProfile(user.uid, {
        displayName: formData.displayName.trim(),
        businessName: formData.businessName.trim(),
        location: {
          street: formData.street.trim(),
          number: formData.number.trim(),
          neighborhood: formData.neighborhood.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        },
        venueInfo: {
          phone: formData.phone.trim(),
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          description: formData.description.trim(),
          instagram: formData.instagram.trim(),
          facebook: formData.facebook.trim(),
          condominiumPrice: formData.condominiumPrice ? parseFloat(formData.condominiumPrice) : undefined,
          amenities: formData.amenities,
          bankingInfo: {
            pixKey: formData.pixKey.trim(),
            pixKeyType: formData.pixKeyType || undefined,
            accountHolder: formData.accountHolder.trim(),
            bankName: formData.bankName.trim(),
          },
        },
      });

      // Recarrega os dados do usuário do Firestore
      await refreshUserData();

      // Atualiza os dados iniciais para refletir o novo estado salvo
      setInitialData(formData);

      setSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    formData,
    loading,
    error,
    success,
    authLoading,
    userData,
    hasChanges,
    handleChange,
    handleAmenityChange,
    handleCepChange,
    handleSubmit,
    handleCancel,
    clearMessages,
  };
}
