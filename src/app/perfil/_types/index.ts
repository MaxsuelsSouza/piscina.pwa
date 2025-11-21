/**
 * Tipos específicos da página de perfil
 */

export interface ProfileFormData {
  displayName: string;
  businessName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  capacity: string;
  description: string;
  instagram: string;
  facebook: string;
  condominiumPrice: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | '';
  accountHolder: string;
  bankName: string;
  amenities: {
    pool: boolean;
    grill: boolean;
    sound: boolean;
    wifi: boolean;
    airConditioning: boolean;
    kitchen: boolean;
    parking: boolean;
    coveredArea: boolean;
    outdoorArea: boolean;
    bathroom: boolean;
    furniture: boolean;
  };
}

export const initialFormData: ProfileFormData = {
  displayName: '',
  businessName: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  capacity: '',
  description: '',
  instagram: '',
  facebook: '',
  condominiumPrice: '',
  pixKey: '',
  pixKeyType: '',
  accountHolder: '',
  bankName: '',
  amenities: {
    pool: false,
    grill: false,
    sound: false,
    wifi: false,
    airConditioning: false,
    kitchen: false,
    parking: false,
    coveredArea: false,
    outdoorArea: false,
    bathroom: false,
    furniture: false,
  },
};
