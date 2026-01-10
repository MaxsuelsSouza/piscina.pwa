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

  const isBarbershop = user.venueType === 'barbershop';

  // Campos comuns a todos
  const commonFields = [
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

    // Dados Bancários (4 campos = 20%)
    { name: 'Chave PIX', value: user.venueInfo?.bankingInfo?.pixKey, weight: 5 },
    { name: 'Tipo de Chave PIX', value: user.venueInfo?.bankingInfo?.pixKeyType, weight: 5 },
    { name: 'Nome do Titular', value: user.venueInfo?.bankingInfo?.accountHolder, weight: 5 },
    { name: 'Nome do Banco', value: user.venueInfo?.bankingInfo?.bankName, weight: 5 },

    // Contato e Informações (3 campos = 15%)
    { name: 'Descrição', value: user.venueInfo?.description, weight: 5 },
    { name: 'Telefone/WhatsApp', value: user.venueInfo?.phone, weight: 5 },
    { name: 'Instagram', value: user.venueInfo?.instagram, weight: 5 },
  ];

  let specificFields: Array<{ name: string; value: any; weight: number }> = [];

  if (isBarbershop) {
    // Campos específicos para barbearia (35%)
    specificFields = [
      { name: 'Facebook', value: user.venueInfo?.facebook, weight: 5 },
      // Configurações de barbearia (30%)
      {
        name: 'Horários Configurados',
        value: user.venueInfo?.barbershopInfo?.schedule,
        weight: 10,
      },
      {
        name: 'Serviços Cadastrados',
        value: hasServices(user.venueInfo?.barbershopInfo?.services),
        weight: 10,
      },
      {
        name: 'Profissionais Cadastrados',
        value: hasProfessionals(user.venueInfo?.barbershopInfo?.professionals),
        weight: 10,
      },
    ];
  } else {
    // Campos específicos para espaço de festa (35%)
    specificFields = [
      { name: 'Valor do Condomínio', value: user.venueInfo?.condominiumPrice, weight: 8 },
      { name: 'Capacidade', value: user.venueInfo?.capacity, weight: 5 },
      { name: 'Facebook', value: user.venueInfo?.facebook, weight: 4 },
      {
        name: 'Amenidades',
        value: hasAnyAmenity(user.venueInfo?.amenities),
        weight: 10,
      },
      {
        name: '3+ Amenidades',
        value: hasMinimumAmenities(user.venueInfo?.amenities, 3),
        weight: 8,
      },
    ];
  }

  const fields = [...commonFields, ...specificFields];

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

function hasServices(services: any): boolean {
  if (!services) return false;
  if (!Array.isArray(services)) return false;
  return services.length > 0 && services.some((service: any) => service.isActive);
}

function hasProfessionals(professionals: any): boolean {
  if (!professionals) return false;
  if (!Array.isArray(professionals)) return false;
  return professionals.length > 0 && professionals.some((prof: any) => prof.isActive);
}
