/**
 * Tipos para Lista de Presentes
 */

export type GiftCategory =
  | 'cozinha-eletrodomesticos'
  | 'cozinha-utensilios'
  | 'cozinha-servir'
  | 'area-servico-maquinario'
  | 'area-servico-limpeza'
  | 'quarto-mobiliario'
  | 'quarto-enxoval'
  | 'sala-mobiliario'
  | 'sala-decoracao'
  | 'banheiro'
  | 'infraestrutura-ferramentas'
  | 'infraestrutura-seguranca';

export const GIFT_CATEGORY_LABELS: Record<GiftCategory, string> = {
  'cozinha-eletrodomesticos': 'Cozinha - Eletrodomésticos',
  'cozinha-utensilios': 'Cozinha - Utensílios e Preparo',
  'cozinha-servir': 'Cozinha - Servir e Armazenar',
  'area-servico-maquinario': 'Área de Serviço - Maquinário',
  'area-servico-limpeza': 'Área de Serviço - Limpeza',
  'quarto-mobiliario': 'Quarto - Mobiliário',
  'quarto-enxoval': 'Quarto - Enxoval e Têxteis',
  'sala-mobiliario': 'Sala - Mobiliário',
  'sala-decoracao': 'Sala - Decoração',
  'banheiro': 'Banheiro',
  'infraestrutura-ferramentas': 'Infraestrutura - Ferramentas',
  'infraestrutura-seguranca': 'Infraestrutura - Segurança',
};

export interface Gift {
  id: string;
  name: string;
  category: GiftCategory;
  description?: string;
  imageUrl?: string;
  isSelected: boolean; // Se já foi escolhido por alguém
  selectedBy?: string; // Phone do cliente que selecionou
  selectedAt?: string; // Data da seleção
  createdAt: string;
  updatedAt: string;
}

export interface GiftSelection {
  id: string;
  giftId: string;
  giftName: string;
  clientPhone: string;
  clientName: string;
  selectedAt: string;
}

export interface GiftDocument extends Omit<Gift, 'id'> {}
export interface GiftSelectionDocument extends Omit<GiftSelection, 'id'> {}
