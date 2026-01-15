/**
 * Script para popular a coleção de presentes no Firestore
 *
 * Como usar:
 * 1. Certifique-se de que as variáveis de ambiente do Firebase estão configuradas
 * 2. Execute: npx ts-node --project tsconfig.json scripts/seed-gifts.ts
 *
 * Ou use a página /admin/seed-gifts para executar via interface web
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

// Configuração do Firebase (mesmas variáveis do .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Dados dos presentes
const GIFTS_DATA = [
  // COZINHA - Eletrodomésticos
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

  // COZINHA - Utensílios
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

  // COZINHA - Servir
  { name: 'Pratos (rasos, fundos e de sobremesa)', category: 'cozinha-servir' },
  { name: 'Copos (água/suco)', category: 'cozinha-servir' },
  { name: 'Taças (vinho/espumante)', category: 'cozinha-servir' },
  { name: 'Canecas/Xícaras com pires', category: 'cozinha-servir' },
  { name: 'Jarras', category: 'cozinha-servir' },
  { name: 'Potes Herméticos', category: 'cozinha-servir' },
  { name: 'Jogos americanos', category: 'cozinha-servir' },
  { name: 'Toalhas de mesa', category: 'cozinha-servir' },
  { name: 'Guardanapos e porta-guardanapos', category: 'cozinha-servir' },

  // ÁREA DE SERVIÇO - Maquinário
  { name: 'Máquina de Lavar Roupa (ou Lava e Seca)', category: 'area-servico-maquinario' },
  { name: 'Secadora', category: 'area-servico-maquinario' },
  { name: 'Aspirador de Pó', category: 'area-servico-maquinario' },
  { name: 'Ferro de Passar', category: 'area-servico-maquinario' },
  { name: 'Tábua de Passar', category: 'area-servico-maquinario' },

  // ÁREA DE SERVIÇO - Limpeza
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
  { name: 'Produtos Químicos Iniciais', category: 'area-servico-limpeza' },

  // QUARTO - Mobiliário
  { name: 'Cama Box + Colchão', category: 'quarto-mobiliario' },
  { name: 'Cabeceira', category: 'quarto-mobiliario' },
  { name: 'Criados-mudos (Mesas de cabeceira)', category: 'quarto-mobiliario' },
  { name: 'Guarda-roupa ou Closet', category: 'quarto-mobiliario' },
  { name: 'Cômoda', category: 'quarto-mobiliario' },

  // QUARTO - Enxoval
  { name: 'Protetor de Colchão Impermeável', category: 'quarto-enxoval' },
  { name: 'Travesseiros', category: 'quarto-enxoval' },
  { name: 'Jogos de Lençol', category: 'quarto-enxoval' },
  { name: 'Edredons ou Cobertores', category: 'quarto-enxoval' },
  { name: 'Manta leve', category: 'quarto-enxoval' },
  { name: 'Almofadas decorativas', category: 'quarto-enxoval' },
  { name: 'Peseira', category: 'quarto-enxoval' },

  // SALA - Mobiliário
  { name: 'Sofá', category: 'sala-mobiliario' },
  { name: 'Poltronas', category: 'sala-mobiliario' },
  { name: 'Mesa de Centro ou Lateral', category: 'sala-mobiliario' },
  { name: 'Estante ou Rack', category: 'sala-mobiliario' },
  { name: 'Mesa de Jantar + Cadeiras', category: 'sala-mobiliario' },
  { name: 'Aparador', category: 'sala-mobiliario' },

  // SALA - Decoração
  { name: 'Cortinas ou Persianas', category: 'sala-decoracao' },
  { name: 'Tapetes', category: 'sala-decoracao' },
  { name: 'Luminárias de piso ou mesa', category: 'sala-decoracao' },
  { name: 'Quadros e Espelhos', category: 'sala-decoracao' },
  { name: 'Vasos e Plantas', category: 'sala-decoracao' },

  // BANHEIRO
  { name: 'Toalhas de Banho', category: 'banheiro' },
  { name: 'Toalhas de Rosto', category: 'banheiro' },
  { name: 'Tapetes de banheiro', category: 'banheiro' },
  { name: 'Cortina de chuveiro', category: 'banheiro' },
  { name: 'Prateleiras/Nichos', category: 'banheiro' },
  { name: 'Porta-sabonete', category: 'banheiro' },
  { name: 'Porta-escova de dentes', category: 'banheiro' },
  { name: 'Espelho', category: 'banheiro' },
  { name: 'Lixeira pequena com pedal', category: 'banheiro' },
  { name: 'Escova de vaso sanitário', category: 'banheiro' },
  { name: 'Cesto de Roupa Suja (Banheiro)', category: 'banheiro' },

  // INFRAESTRUTURA - Ferramentas
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

  // INFRAESTRUTURA - Segurança
  { name: 'Kit Primeiros Socorros', category: 'infraestrutura-seguranca' },
  { name: 'Lâmpadas Reserva (LED)', category: 'infraestrutura-seguranca' },
];

async function seedGifts() {
  console.log('Iniciando seed de presentes...');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Verifica se já existem presentes
  const giftsRef = collection(db, 'gifts');
  const existingGifts = await getDocs(query(giftsRef, limit(1)));

  if (!existingGifts.empty) {
    console.log('Presentes já existem no banco. Abortando seed.');
    console.log('Para recriar, delete a coleção "gifts" primeiro.');
    return;
  }

  const now = new Date().toISOString();
  let count = 0;

  for (const gift of GIFTS_DATA) {
    await addDoc(giftsRef, {
      name: gift.name,
      category: gift.category,
      isSelected: false,
      createdAt: now,
      updatedAt: now,
    });
    count++;
    process.stdout.write(`\rCriados: ${count}/${GIFTS_DATA.length}`);
  }

  console.log(`\n\nSeed concluído! ${count} presentes criados.`);
}

// Executa se for chamado diretamente
seedGifts().catch(console.error);
