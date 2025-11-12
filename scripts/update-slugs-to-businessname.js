/**
 * Script para atualizar publicSlug dos usuários existentes
 * para usar o nome do estabelecimento (businessName) ao invés do nome da pessoa
 * Execute: node scripts/update-slugs-to-businessname.js
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuração do Firebase Admin
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Gera um slug único a partir do nome do estabelecimento, nome da pessoa ou email
 * Prioridade: businessName > displayName > email
 */
function generateSlug(displayName, email, businessName) {
  // Prioriza o nome do estabelecimento
  const base = businessName || displayName || email.split('@')[0];

  // Remove acentos e caracteres especiais
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Adiciona timestamp para garantir unicidade
  const timestamp = Date.now().toString(36).slice(-4);

  return `${slug}-${timestamp}`;
}

async function updateSlugsToBusinessName() {
  try {
    console.log('🔍 Buscando clientes para atualizar slugs...\n');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', 'client').get();

    if (snapshot.empty) {
      console.log('⚠️  Nenhum cliente encontrado.');
      process.exit(0);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const oldSlug = userData.publicSlug;

      // Se não tem businessName, pula
      if (!userData.businessName) {
        console.log(`⏭️  ${userData.email} - Sem businessName, mantendo slug atual`);
        skippedCount++;
        continue;
      }

      // Gera novo slug baseado no businessName
      const newSlug = generateSlug(userData.displayName, userData.email, userData.businessName);

      // Atualiza apenas se mudou
      if (oldSlug !== newSlug) {
        await usersRef.doc(doc.id).update({
          publicSlug: newSlug,
          updatedAt: new Date().toISOString(),
        });

        console.log(`✅ ${userData.email}`);
        console.log(`   Estabelecimento: ${userData.businessName}`);
        console.log(`   Antigo: /agendamento/${oldSlug}`);
        console.log(`   Novo:   /agendamento/${newSlug}\n`);
        updatedCount++;
      } else {
        console.log(`⏭️  ${userData.email} - Slug já está correto\n`);
        skippedCount++;
      }
    }

    console.log('📊 Resumo:');
    console.log(`✅ Atualizados: ${updatedCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log('\n✨ Concluído!');
    console.log('\n⚠️  IMPORTANTE: Os links públicos antigos não funcionarão mais.');
    console.log('   Comunique os novos links aos seus clientes.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updateSlugsToBusinessName();
