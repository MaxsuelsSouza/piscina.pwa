/**
 * Script para verificar os publicSlug de todos os usuários
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

async function checkUsers() {
  try {
    console.log('📋 Verificando usuários no sistema...\n');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('❌ Nenhum usuário encontrado!');
      process.exit(1);
    }

    let clientsCount = 0;
    let clientsWithSlug = 0;

    snapshot.forEach(doc => {
      const user = doc.data();
      const isClient = user.role === 'client';

      console.log('👤 Email:', user.email);
      console.log('   Nome:', user.displayName || 'N/A');
      console.log('   Role:', user.role);
      console.log('   Slug:', user.publicSlug || '❌ SEM SLUG');

      if (user.publicSlug) {
        console.log('   🔗 Link público:');
        console.log('      http://localhost:3000/agendamento/' + user.publicSlug);
      }

      console.log('');

      if (isClient) {
        clientsCount++;
        if (user.publicSlug) clientsWithSlug++;
      }
    });

    console.log('📊 Resumo:');
    console.log(`   Total de usuários: ${snapshot.size}`);
    console.log(`   Clientes: ${clientsCount}`);
    console.log(`   Clientes com slug: ${clientsWithSlug}`);

    if (clientsCount === 0) {
      console.log('\n💡 Dica: Crie um cliente em /admin/usuarios para testar o link público!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkUsers();
