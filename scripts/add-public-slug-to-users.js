/**
 * Script para adicionar publicSlug aos usuários existentes
 * Execute: node scripts/add-public-slug-to-users.js
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
 * Gera um slug único a partir do nome ou email
 */
function generateSlug(displayName, email) {
  const base = displayName || email.split('@')[0];

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

async function addPublicSlugToUsers() {
  try {
    console.log('🔍 Buscando usuários sem publicSlug...');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of snapshot.docs) {
      const userData = doc.data();

      // Pula se já tem publicSlug ou se é admin
      if (userData.publicSlug || userData.role === 'admin') {
        skippedCount++;
        console.log(`⏭️  Pulando ${userData.email} (${userData.role === 'admin' ? 'admin' : 'já tem slug'})`);
        continue;
      }

      // Gera slug apenas para clientes
      if (userData.role === 'client') {
        const publicSlug = generateSlug(userData.displayName, userData.email);

        await usersRef.doc(doc.id).update({
          publicSlug,
          updatedAt: new Date().toISOString(),
        });

        console.log(`✅ Adicionado slug para ${userData.email}: ${publicSlug}`);
        updatedCount++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ Atualizados: ${updatedCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log('\n✨ Concluído!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

addPublicSlugToUsers();
