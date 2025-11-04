/**
 * Categorias para Assinaturas e Boletos
 */

export const categorias = [
  'streaming',
  'software',
  'academia',
  'internet',
  'telefone',
  'energia',
  'agua',
  'gas',
  'condominio',
  'iptu',
  'seguro',
  'educacao',
  'outros',
] as const;

export type Categoria = (typeof categorias)[number];

export const getCategoriaIcon = (cat: string): string => {
  switch (cat) {
    case 'streaming':
      return 'film';
    case 'software':
      return 'code';
    case 'academia':
      return 'activity';
    case 'internet':
      return 'wifi';
    case 'telefone':
      return 'phone';
    case 'energia':
      return 'zap';
    case 'agua':
      return 'droplet';
    case 'gas':
      return 'flame';
    case 'condominio':
      return 'building';
    case 'iptu':
      return 'file-text';
    case 'seguro':
      return 'shield';
    case 'educacao':
      return 'book';
    case 'outros':
      return 'more-horizontal';
    default:
      return 'circle';
  }
};

export const getCategoriaColor = (cat: string): string => {
  switch (cat) {
    case 'streaming':
      return '#E91E63'; // Pink
    case 'software':
      return '#2196F3'; // Blue
    case 'academia':
      return '#FF5722'; // Deep Orange
    case 'internet':
      return '#00BCD4'; // Cyan
    case 'telefone':
      return '#4CAF50'; // Green
    case 'energia':
      return '#FFC107'; // Amber
    case 'agua':
      return '#03A9F4'; // Light Blue
    case 'gas':
      return '#FF9800'; // Orange
    case 'condominio':
      return '#795548'; // Brown
    case 'iptu':
      return '#607D8B'; // Blue Grey
    case 'seguro':
      return '#9C27B0'; // Purple
    case 'educacao':
      return '#673AB7'; // Deep Purple
    case 'outros':
      return '#9E9E9E'; // Grey
    default:
      return '#8A8FA5';
  }
};

export const getCategoriaLabel = (cat: string): string => {
  switch (cat) {
    case 'streaming':
      return 'Streaming';
    case 'software':
      return 'Software';
    case 'academia':
      return 'Academia';
    case 'internet':
      return 'Internet';
    case 'telefone':
      return 'Telefone';
    case 'energia':
      return 'Energia';
    case 'agua':
      return 'Água';
    case 'gas':
      return 'Gás';
    case 'condominio':
      return 'Condomínio';
    case 'iptu':
      return 'IPTU';
    case 'seguro':
      return 'Seguro';
    case 'educacao':
      return 'Educação';
    case 'outros':
      return 'Outros';
    default:
      return 'Categoria';
  }
};
