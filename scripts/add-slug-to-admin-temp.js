/**
 * Script TEMPORÁRIO para adicionar publicSlug ao admin para teste
 * Execute: node scripts/add-slug-to-admin-temp.js
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

function generateSlug(displayName, email) {
  const base = displayName || email.split('@')[0];
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const timestamp = Date.now().toString(36).slice(-4);
  return `${slug}-${timestamp}`;
}

async function addSlugToAdmin() {
  try {
    console.log('🔍 Adicionando publicSlug temporário ao admin...');

    const adminUid = 'X7aWBsKSpkTQr25mAigi9DkGULG3';
    const userRef = db.collection('users').doc(adminUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('❌ Admin não encontrado');
      process.exit(1);
    }

    const userData = userDoc.data();
    const publicSlug = generateSlug(userData.displayName, userData.email);

    await userRef.update({
      publicSlug,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Slug adicionado: ${publicSlug}`);
    console.log('\n📋 Você pode acessar:');
    console.log(`   http://localhost:3000/agendamento/${publicSlug}`);
    console.log('\n⚠️  LEMBRE-SE: Isso é apenas para teste!');
    console.log('   Em produção, apenas clientes devem ter publicSlug.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

addSlugToAdmin();
