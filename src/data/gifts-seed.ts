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
  { name: 'Fogão ou Cooktop', category: 'cozinha-eletrodomesticos' },
  { name: 'Forno (Elétrico ou a Gás)', category: 'cozinha-eletrodomesticos' },
  { name: 'Micro-ondas', category: 'cozinha-eletrodomesticos' },
  { name: 'Air Fryer', category: 'cozinha-eletrodomesticos' },
  { name: 'Liquidificador', category: 'cozinha-eletrodomesticos' },
  { name: 'Processador de Alimentos', category: 'cozinha-eletrodomesticos' },
  { name: 'Panela Elétrica de Arroz', category: 'cozinha-eletrodomesticos' },
  { name: 'Batedeira', category: 'cozinha-eletrodomesticos' },
  { name: 'Torradeira e/ou Sanduicheira', category: 'cozinha-eletrodomesticos' },
  { name: 'Cafeteira + Garrafa Térmica', category: 'cozinha-eletrodomesticos' },
  { name: 'Filtro de Água/Purificador', category: 'cozinha-eletrodomesticos' },

  // ========================================
  // 1. COZINHA E COPA - Utensílios e Preparo
  // ========================================
  { name: 'Jogo de Panelas (Grande, média, pequena)', category: 'cozinha-utensilios' },
  { name: 'Frigideira antiaderente', category: 'cozinha-utensilios' },
  { name: 'Faca do Chef (8")', category: 'cozinha-utensilios' },
  { name: 'Faca de Legumes/Frutas', category: 'cozinha-utensilios' },
  { name: 'Faca de Pão (serrilhada)', category: 'cozinha-utensilios' },
  { name: 'Tábuas de Corte (Bambu ou Polietileno)', category: 'cozinha-utensilios' },
  { name: 'Talheres (Garfos, facas, colheres de sopa e sobremesa)', category: 'cozinha-utensilios' },
  { name: 'Colheres de pau (ou bambu/silicone)', category: 'cozinha-utensilios' },
  { name: 'Espátulas', category: 'cozinha-utensilios' },
  { name: 'Conchas', category: 'cozinha-utensilios' },
  { name: 'Escumadeira', category: 'cozinha-utensilios' },
  { name: 'Pegador de massas', category: 'cozinha-utensilios' },
  { name: 'Batedor de Ovos (Fouet)', category: 'cozinha-utensilios' },
  { name: 'Escorredor de macarrão', category: 'cozinha-utensilios' },
  { name: 'Peneira fina', category: 'cozinha-utensilios' },
  { name: 'Abridor de Latas e Garrafas', category: 'cozinha-utensilios' },
  { name: 'Tesoura de Cozinha', category: 'cozinha-utensilios' },

  // ========================================
  // 1. COZINHA E COPA - Servir e Armazenar
  // ========================================
  { name: 'Pratos (rasos, fundos e de sobremesa)', category: 'cozinha-servir' },
  { name: 'Copos (água/suco)', category: 'cozinha-servir' },
  { name: 'Taças (vinho/espumante)', category: 'cozinha-servir' },
  { name: 'Canecas/Xícaras com pires', category: 'cozinha-servir' },
  { name: 'Jarras', category: 'cozinha-servir' },
  { name: 'Potes Herméticos', category: 'cozinha-servir' },
  { name: 'Jogos americanos', category: 'cozinha-servir' },
  { name: 'Toalhas de mesa', category: 'cozinha-servir' },
  { name: 'Guardanapos e porta-guardanapos', category: 'cozinha-servir' },

  // ========================================
  // 2. ÁREA DE SERVIÇO - Maquinário e Estrutura
  // ========================================
  { name: 'Máquina de Lavar Roupa (ou Lava e Seca)', category: 'area-servico-maquinario' },
  { name: 'Secadora', category: 'area-servico-maquinario' },
  { name: 'Aspirador de Pó', category: 'area-servico-maquinario' },
  { name: 'Ferro de Passar', category: 'area-servico-maquinario' },
  { name: 'Tábua de Passar', category: 'area-servico-maquinario' },

  // ========================================
  // 2. ÁREA DE SERVIÇO - Limpeza e Organização
  // ========================================
  { name: 'Varal de teto', category: 'area-servico-limpeza' },
  { name: 'Varal de chão', category: 'area-servico-limpeza' },
  { name: 'Pregadores', category: 'area-servico-limpeza' },
  { name: 'Vassoura (pelo macio e cerdas duras)', category: 'area-servico-limpeza' },
  { name: 'Rodo', category: 'area-servico-limpeza' },
  { name: 'Pá de Lixo', category: 'area-servico-limpeza' },
  { name: 'Mop (Esfregão)', category: 'area-servico-limpeza' },
  { name: 'Baldes', category: 'area-servico-limpeza' },
  { name: 'Bacia', category: 'area-servico-limpeza' },
  { name: 'Cesto de Roupa Suja', category: 'area-servico-limpeza' },
  { name: 'Panos de chão', category: 'area-servico-limpeza' },
  { name: 'Flanelas de pó', category: 'area-servico-limpeza' },
  { name: 'Esponjas dupla face', category: 'area-servico-limpeza' },
  { name: 'Escovas de limpeza', category: 'area-servico-limpeza' },
  { name: 'Produtos Químicos Iniciais (Água sanitária, desinfetante, detergente, sabão, amaciante)', category: 'area-servico-limpeza' },

  // ========================================
  // 3. QUARTO - Mobiliário
  // ========================================
  { name: 'Cama Box + Colchão', category: 'quarto-mobiliario' },
  { name: 'Cabeceira', category: 'quarto-mobiliario' },
  { name: 'Criados-mudos (Mesas de cabeceira)', category: 'quarto-mobiliario' },
  { name: 'Guarda-roupa ou Closet', category: 'quarto-mobiliario' },
  { name: 'Cômoda', category: 'quarto-mobiliario' },

  // ========================================
  // 3. QUARTO - Enxoval e Têxteis
  // ========================================
  { name: 'Protetor de Colchão Impermeável', category: 'quarto-enxoval' },
  { name: 'Travesseiros', category: 'quarto-enxoval' },
  { name: 'Jogos de Lençol', category: 'quarto-enxoval' },
  { name: 'Edredons ou Cobertores', category: 'quarto-enxoval' },
  { name: 'Manta leve', category: 'quarto-enxoval' },
  { name: 'Almofadas decorativas', category: 'quarto-enxoval' },
  { name: 'Peseira', category: 'quarto-enxoval' },

  // ========================================
  // 4. SALA DE ESTAR E JANTAR - Mobiliário
  // ========================================
  { name: 'Sofá', category: 'sala-mobiliario' },
  { name: 'Poltronas', category: 'sala-mobiliario' },
  { name: 'Mesa de Centro ou Lateral', category: 'sala-mobiliario' },
  { name: 'Estante ou Rack', category: 'sala-mobiliario' },
  { name: 'Mesa de Jantar + Cadeiras', category: 'sala-mobiliario' },
  { name: 'Aparador', category: 'sala-mobiliario' },

  // ========================================
  // 4. SALA DE ESTAR E JANTAR - Decoração
  // ========================================
  { name: 'Cortinas ou Persianas', category: 'sala-decoracao' },
  { name: 'Tapetes', category: 'sala-decoracao' },
  { name: 'Luminárias de piso ou mesa', category: 'sala-decoracao' },
  { name: 'Quadros e Espelhos', category: 'sala-decoracao' },
  { name: 'Vasos e Plantas', category: 'sala-decoracao' },

  // ========================================
  // 5. BANHEIRO
  // ========================================
  { name: 'Toalhas de Banho', category: 'banheiro' },
  { name: 'Toalhas de Rosto', category: 'banheiro' },
  { name: 'Tapetes de banheiro (ou toalha de piso)', category: 'banheiro' },
  { name: 'Cortina de chuveiro', category: 'banheiro' },
  { name: 'Prateleiras/Nichos', category: 'banheiro' },
  { name: 'Porta-sabonete', category: 'banheiro' },
  { name: 'Porta-escova de dentes', category: 'banheiro' },
  { name: 'Espelho', category: 'banheiro' },
  { name: 'Lixeira pequena com pedal', category: 'banheiro' },
  { name: 'Escova de vaso sanitário', category: 'banheiro' },
  { name: 'Cesto de Roupa Suja (Banheiro)', category: 'banheiro' },

  // ========================================
  // 6. INFRAESTRUTURA - Ferramentas
  // ========================================
  { name: 'Chave de Fenda e Phillips', category: 'infraestrutura-ferramentas' },
  { name: 'Chave Inglesa', category: 'infraestrutura-ferramentas' },
  { name: 'Alicate Universal', category: 'infraestrutura-ferramentas' },
  { name: 'Martelo de Unha', category: 'infraestrutura-ferramentas' },
  { name: 'Trena', category: 'infraestrutura-ferramentas' },
  { name: 'Fita Veda Rosca', category: 'infraestrutura-ferramentas' },
  { name: 'Fita Isolante', category: 'infraestrutura-ferramentas' },
  { name: 'Cola Instantânea', category: 'infraestrutura-ferramentas' },
  { name: 'Lubrificante WD-40', category: 'infraestrutura-ferramentas' },
  { name: 'Extensões e Filtros de Linha', category: 'infraestrutura-ferramentas' },
  { name: 'Adaptadores de Tomada', category: 'infraestrutura-ferramentas' },
  { name: 'Escada Doméstica', category: 'infraestrutura-ferramentas' },

  // ========================================
  // 6. INFRAESTRUTURA - Segurança e Outros
  // ========================================
  { name: 'Kit Primeiros Socorros', category: 'infraestrutura-seguranca' },
  { name: 'Lâmpadas Reserva (LED)', category: 'infraestrutura-seguranca' },
];
