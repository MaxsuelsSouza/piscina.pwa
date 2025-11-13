/**
 * Script para verificar e corrigir slugs dos clientes
 * - Lista todos os slugs disponíveis
 * - Normaliza slugs para lowercase
 * - Verifica duplicatas
 *
 * Execute: node scripts/check-and-fix-slugs.js
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

async function checkAndFixSlugs() {
  try {
    console.log('🔍 Verificando slugs dos clientes...\n');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', 'client').get();

    if (snapshot.empty) {
      console.log('⚠️  Nenhum cliente encontrado.');
      process.exit(0);
    }

    console.log(`📊 Total de clientes: ${snapshot.size}\n`);
    console.log('═'.repeat(80));

    let fixedCount = 0;
    let validCount = 0;
    const slugs = new Map();

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const currentSlug = userData.publicSlug;

      console.log(`\n👤 ${userData.businessName || userData.displayName || userData.email}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   UID: ${userData.uid}`);
      console.log(`   Status: ${userData.isActive ? '✅ Ativo' : '❌ Inativo'}`);

      if (!currentSlug) {
        console.log(`   ⚠️  SEM SLUG!`);
        continue;
      }

      console.log(`   Slug atual: ${currentSlug}`);

      // Normaliza o slug (lowercase)
      const normalizedSlug = currentSlug.toLowerCase().trim();

      // Verifica se precisa atualizar
      if (currentSlug !== normalizedSlug) {
        console.log(`   🔧 Corrigindo para: ${normalizedSlug}`);

        await usersRef.doc(doc.id).update({
          publicSlug: normalizedSlug,
          updatedAt: new Date().toISOString(),
        });

        fixedCount++;
      } else {
        validCount++;
      }

      // Registra o slug para verificação de duplicatas
      const normalizedForCheck = normalizedSlug.toLowerCase();
      if (slugs.has(normalizedForCheck)) {
        console.log(`   ⚠️  DUPLICATA! Mesmo slug de: ${slugs.get(normalizedForCheck)}`);
      } else {
        slugs.set(normalizedForCheck, userData.email);
      }

      // Mostra o link público
      const publicUrl = `https://piscina-pwa.vercel.app/agendamento/${normalizedSlug}`;
      console.log(`   🔗 Link público: ${publicUrl}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RESUMO:');
    console.log(`   Total de clientes: ${snapshot.size}`);
    console.log(`   Slugs corrigidos: ${fixedCount}`);
    console.log(`   Slugs válidos: ${validCount}`);
    console.log(`   Slugs sem duplicatas: ${slugs.size === snapshot.size ? '✅' : '⚠️'}`);

    console.log('\n📋 LISTA DE SLUGS DISPONÍVEIS:');
    console.log('═'.repeat(80));
    for (const [slug, email] of slugs.entries()) {
      console.log(`   ${slug} → ${email}`);
    }

    console.log('\n✨ Verificação concluída!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkAndFixSlugs();
