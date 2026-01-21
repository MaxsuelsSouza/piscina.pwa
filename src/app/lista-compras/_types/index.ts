/**
 * Tipos para o módulo Lista de Compras
 */

export interface ItemCompra {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  categoria: CategoriaItem;
  comprado: boolean;
  preco?: number;
  observacao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListaCompras {
  id: string;
  nome: string;
  descricao?: string;
  itens: ItemCompra[];
  status: StatusLista;
  createdAt: string;
  updatedAt: string;
}

export type StatusLista = 'ativa' | 'concluida' | 'arquivada';

export type CategoriaItem =
  | 'frutas-verduras'
  | 'carnes-proteinas'
  | 'laticinios'
  | 'padaria'
  | 'bebidas'
  | 'mantimentos'
  | 'limpeza'
  | 'higiene'
  | 'congelados'
  | 'graos-cereais'
  | 'temperos-molhos'
  | 'doces-snacks'
  | 'outros';

export const CATEGORIA_LABELS: Record<CategoriaItem, string> = {
  'frutas-verduras': 'Frutas e Verduras',
  'carnes-proteinas': 'Carnes e Proteínas',
  'laticinios': 'Laticínios',
  'padaria': 'Padaria',
  'bebidas': 'Bebidas',
  'mantimentos': 'Mantimentos',
  'limpeza': 'Limpeza',
  'higiene': 'Higiene',
  'congelados': 'Congelados',
  'graos-cereais': 'Grãos e Cereais',
  'temperos-molhos': 'Temperos e Molhos',
  'doces-snacks': 'Doces e Snacks',
  'outros': 'Outros',
};

export const CATEGORIA_ICONS: Record<CategoriaItem, string> = {
  'frutas-verduras': '🥬',
  'carnes-proteinas': '🥩',
  'laticinios': '🧀',
  'padaria': '🥖',
  'bebidas': '🥤',
  'mantimentos': '🥫',
  'limpeza': '🧹',
  'higiene': '🧴',
  'congelados': '🧊',
  'graos-cereais': '🌾',
  'temperos-molhos': '🧂',
  'doces-snacks': '🍫',
  'outros': '📦',
};

export const UNIDADES = [
  'un',
  'kg',
  'g',
  'L',
  'ml',
  'pct',
  'cx',
  'dz',
] as const;

export type Unidade = (typeof UNIDADES)[number];

export const UNIDADE_LABELS: Record<Unidade, string> = {
  'un': 'Unidade(s)',
  'kg': 'Kg',
  'g': 'Gramas',
  'L': 'Litro(s)',
  'ml': 'ml',
  'pct': 'Pacote(s)',
  'cx': 'Caixa(s)',
  'dz': 'Dúzia(s)',
};
