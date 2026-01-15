/**
 * Dados iniciais dos presentes para a Lista de Casamento
 */

import type { GiftCategory } from '@/types/gift';

interface GiftSeedData {
  name: string;
  category: GiftCategory;
}

export const GIFTS_SEED_DATA: GiftSeedData[] = [
  // ========================================
  // 1. COZINHA E COPA - Eletrodomésticos
  // ========================================
  { name: 'Geladeira (Frost Free)', category: 'cozinha-eletrodomesticos' },
  { name: 'Fogão', category: 'cozinha-eletrodomesticos' },
  { name: 'Micro-ondas', category: 'cozinha-eletrodomesticos' },
  { name: 'Air Fryer', category: 'cozinha-eletrodomesticos' },
  { name: 'Liquidificador', category: 'cozinha-eletrodomesticos' },
  { name: 'Processador de Alimentos', category: 'cozinha-eletrodomesticos' },
  { name: 'Torradeira e/ou Sanduicheira', category: 'cozinha-eletrodomesticos' },
  { name: 'Filtro de Água/Purificador', category: 'cozinha-eletrodomesticos' },

  // ========================================
  // 1. COZINHA E COPA - Utensílios e Preparo
  // ========================================
  { name: 'Jogo de Panelas (Grande, média, pequena)', category: 'cozinha-utensilios' },
  { name: 'Frigideira antiaderente', category: 'cozinha-utensilios' },
  { name: 'Tábuas de Corte (Bambu ou Polietileno)', category: 'cozinha-utensilios' },
  { name: 'Talheres (Garfos, facas, colheres de sopa e sobremesa)', category: 'cozinha-utensilios' },
  { name: 'Kit Utensílios De Cozinha', category: 'cozinha-utensilios' },
  { name: 'Jogo de Faca', category: 'cozinha-utensilios' },

  // ========================================
  // 1. COZINHA E COPA - Servir e Armazenar
  // ========================================
  { name: 'Pratos (rasos, fundos e de sobremesa)', category: 'cozinha-servir' },
  { name: 'Copos (água/suco)', category: 'cozinha-servir' },
  { name: 'Jarras', category: 'cozinha-servir' },
  { name: 'Potes Herméticos', category: 'cozinha-servir' },

  // ========================================
  // 2. ÁREA DE SERVIÇO - Maquinário
  // ========================================
  { name: 'Máquina de Lavar Roupa (ou Lava e Seca)', category: 'area-servico-maquinario' },
  { name: 'Secadora', category: 'area-servico-maquinario' },
  { name: 'Aspirador de Pó', category: 'area-servico-maquinario' },
  { name: 'Ferro de Passar', category: 'area-servico-maquinario' },
  { name: 'Tábua de Passar', category: 'area-servico-maquinario' },
  { name: 'Mop (Esfregão)', category: 'area-servico-maquinario' },

  // ========================================
  // 3. QUARTO - Enxoval e Têxteis
  // ========================================
  { name: 'Protetor de Colchão Impermeável', category: 'quarto-enxoval' },
  { name: 'Travesseiros', category: 'quarto-enxoval' },
  { name: 'Jogos de Lençol', category: 'quarto-enxoval' },
  { name: 'Edredons ou Cobertores', category: 'quarto-enxoval' },
  { name: 'Kit de Toalhas de Banho', category: 'quarto-enxoval' },
  { name: 'Tapetes', category: 'quarto-enxoval' },
  { name: 'Quadros e Espelhos', category: 'quarto-enxoval' },
];
