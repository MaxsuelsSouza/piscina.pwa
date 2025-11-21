/**
 * Calcula a porcentagem de completude do perfil
 */

import { AppUser } from '@/types/user';

export interface ProfileCompletenessResult {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
}

export function calculateProfileCompleteness(user: AppUser | null): ProfileCompletenessResult {
  if (!user) {
    return {
      percentage: 0,
      missingFields: [],
      completedFields: [],
    };
  }

  const fields = [
    // Informações Básicas (2 campos = 10%)
    { name: 'Nome da Pessoa', value: user.displayName, weight: 5 },
    { name: 'Nome do Estabelecimento', value: user.businessName, weight: 5 },

    // Endereço (6 campos = 20%)
    { name: 'CEP', value: user.location?.zipCode, weight: 3.33 },
    { name: 'Rua', value: user.location?.street, weight: 3.33 },
    { name: 'Número', value: user.location?.number, weight: 3.33 },
    { name: 'Bairro', value: user.location?.neighborhood, weight: 3.34 },
    { name: 'Cidade', value: user.location?.city, weight: 3.33 },
    { name: 'Estado', value: user.location?.state, weight: 3.34 },

    // Informações Financeiras (5 campos = 30%)
    { name: 'Valor do Condomínio', value: user.venueInfo?.condominiumPrice, weight: 8 },
    { name: 'Chave PIX', value: user.venueInfo?.bankingInfo?.pixKey, weight: 6 },
    { name: 'Tipo de Chave PIX', value: user.venueInfo?.bankingInfo?.pixKeyType, weight: 4 },
    { name: 'Nome do Titular', value: user.venueInfo?.bankingInfo?.accountHolder, weight: 6 },
    { name: 'Nome do Banco', value: user.venueInfo?.bankingInfo?.bankName, weight: 6 },

    // Informações do Espaço (7 campos = 40%)
    { name: 'Descrição do Espaço', value: user.venueInfo?.description, weight: 8 },
    { name: 'Telefone/WhatsApp', value: user.venueInfo?.phone, weight: 6 },
    { name: 'Capacidade', value: user.venueInfo?.capacity, weight: 5 },
    { name: 'Instagram', value: user.venueInfo?.instagram, weight: 7 },
    { name: 'Facebook', value: user.venueInfo?.facebook, weight: 4 },
    {
      name: 'Amenidades',
      value: hasAnyAmenity(user.venueInfo?.amenities),
      weight: 7,
    },
    {
      name: '3+ Amenidades',
      value: hasMinimumAmenities(user.venueInfo?.amenities, 3),
      weight: 3,
    },
  ];

  const completedFields: string[] = [];
  const missingFields: string[] = [];
  let totalPercentage = 0;

  fields.forEach((field) => {
    if (isFieldFilled(field.value)) {
      completedFields.push(field.name);
      totalPercentage += field.weight;
    } else {
      missingFields.push(field.name);
    }
  });

  return {
    percentage: Math.round(totalPercentage),
    missingFields,
    completedFields,
  };
}

function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'boolean') return value;
  return false;
}

function hasAnyAmenity(amenities: any): boolean {
  if (!amenities) return false;
  return Object.values(amenities).some((value) => value === true);
}

function hasMinimumAmenities(amenities: any, min: number): boolean {
  if (!amenities) return false;
  const count = Object.values(amenities).filter((value) => value === true).length;
  return count >= min;
}
