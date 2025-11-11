/**
 * Script para criar o documento do usuário admin inicial no Firestore
 *
 * COMO USAR:
 * 1. Certifique-se de que o Firebase Admin SDK está configurado no .env.local
 * 2. Execute: node scripts/create-admin-user.js
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Inicializa o Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function createAdminUser() {
  const adminUid = 'X7aWBsKSpkTQr25mAigi9DkGULG3';
  const adminEmail = 'maxsuelsouza238@gmail.com';

  try {
    console.log('Criando documento do usuário admin...');

    const userData = {
      uid: adminUid,
      email: adminEmail,
      displayName: 'Admin Principal',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(adminUid).set(userData);

    console.log('✅ Documento do usuário admin criado com sucesso!');
    console.log('UID:', adminUid);
    console.log('Email:', adminEmail);
    console.log('Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdminUser();
