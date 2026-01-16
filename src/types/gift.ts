/**
 * Tipos para Lista de Presentes
 */

export type GiftCategory =
  | 'cozinha-eletrodomesticos'
  | 'cozinha-utensilios'
  | 'cozinha-servir'
  | 'area-servico-maquinario'
  | 'quarto-enxoval';

export const GIFT_CATEGORY_LABELS: Record<GiftCategory, string> = {
  'cozinha-eletrodomesticos': 'Cozinha - Eletrodomésticos',
  'cozinha-utensilios': 'Cozinha - Utensílios e Preparo',
  'cozinha-servir': 'Cozinha - Servir e Armazenar',
  'area-servico-maquinario': 'Área de Serviço - Maquinário',
  'quarto-enxoval': 'Quarto - Enxoval e Têxteis',
};

/**
 * Retorna o número máximo de seleções permitidas para uma categoria
 */
export function getMaxSelectionsForCategory(category: GiftCategory): number {
  // Categorias que permitem 2 pessoas escolherem o mesmo presente
  if (category === 'quarto-enxoval' || category === 'cozinha-servir') {
    return 2;
  }
  return 1;
}

export interface Gift {
  id: string;
  name: string;
  category: GiftCategory;
  description?: string;
  imageUrl?: string;
  link?: string; // Link de sugestão do produto
  isSelected: boolean; // Se já foi escolhido por alguém
  selectedBy?: string[]; // Array de phones dos clientes que selecionaram
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
