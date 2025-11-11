/**
 * Script para converter usuário antigo para cliente e adicionar slug
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

async function fixUser() {
  try {
    console.log('🔧 Corrigindo usuário...\n');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', 'user').get();

    if (snapshot.empty) {
      console.log('✅ Nenhum usuário com role "user" encontrado. Tudo certo!');
      process.exit(0);
    }

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      console.log('👤 Encontrado:', userData.email);

      const publicSlug = generateSlug(userData.displayName, userData.email);

      await usersRef.doc(doc.id).update({
        role: 'client',
        publicSlug,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Convertido para cliente');
      console.log('🔗 Slug gerado:', publicSlug);
      console.log('📍 Link público: http://localhost:3000/agendamento/' + publicSlug);
      console.log('');
    }

    console.log('✨ Concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixUser();
