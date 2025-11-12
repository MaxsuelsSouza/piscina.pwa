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
    // Informações Básicas (2 campos = 15%)
    { name: 'Nome da Pessoa', value: user.displayName, weight: 7.5 },
    { name: 'Nome do Estabelecimento', value: user.businessName, weight: 7.5 },

    // Endereço (6 campos = 30%)
    { name: 'CEP', value: user.location?.zipCode, weight: 5 },
    { name: 'Rua', value: user.location?.street, weight: 5 },
    { name: 'Número', value: user.location?.number, weight: 5 },
    { name: 'Bairro', value: user.location?.neighborhood, weight: 5 },
    { name: 'Cidade', value: user.location?.city, weight: 5 },
    { name: 'Estado', value: user.location?.state, weight: 5 },

    // Informações do Espaço (7 campos = 55%)
    { name: 'Descrição do Espaço', value: user.venueInfo?.description, weight: 10 },
    { name: 'Telefone/WhatsApp', value: user.venueInfo?.phone, weight: 8 },
    { name: 'Capacidade', value: user.venueInfo?.capacity, weight: 7 },
    { name: 'Instagram', value: user.venueInfo?.instagram, weight: 10 },
    { name: 'Facebook', value: user.venueInfo?.facebook, weight: 5 },
    {
      name: 'Amenidades',
      value: hasAnyAmenity(user.venueInfo?.amenities),
      weight: 10,
    },
    {
      name: '3+ Amenidades',
      value: hasMinimumAmenities(user.venueInfo?.amenities, 3),
      weight: 5,
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
