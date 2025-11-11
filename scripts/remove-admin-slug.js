/**
 * Script para remover publicSlug do admin (apenas clientes devem ter)
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
const FieldValue = admin.firestore.FieldValue;

async function removeAdminSlug() {
  try {
    console.log('🔧 Removendo publicSlug dos admins...\n');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', 'admin').get();

    if (snapshot.empty) {
      console.log('✅ Nenhum admin encontrado.');
      process.exit(0);
    }

    for (const doc of snapshot.docs) {
      const userData = doc.data();

      if (userData.publicSlug) {
        console.log('👤 Admin:', userData.email);

        await usersRef.doc(doc.id).update({
          publicSlug: FieldValue.delete(),
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ publicSlug removido');
        console.log('');
      }
    }

    console.log('✨ Concluído! Apenas clientes têm links públicos agora.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

removeAdminSlug();
