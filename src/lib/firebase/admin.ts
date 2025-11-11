/**
 * Configuração do Firebase Admin SDK
 * Este arquivo deve ser usado apenas em rotas de API do Next.js (server-side)
 */

import * as admin from 'firebase-admin';

// Valida variáveis de ambiente necessárias
const validateEnvVariables = () => {
  const requiredVars = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    const errorMsg = `
❌ Variáveis de ambiente do Firebase Admin não configuradas!

Variáveis faltando:
${missingVars.map(v => `  - ${v}`).join('\n')}

Para corrigir:
1. Acesse o Firebase Console: https://console.firebase.google.com/
2. Vá em Project Settings > Service Accounts
3. Clique em "Generate New Private Key"
4. Adicione as credenciais no arquivo .env.local:

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nSua_Chave_Aqui\\n-----END PRIVATE KEY-----\\n"

5. Reinicie o servidor Next.js

Veja mais detalhes em: SETUP_USUARIOS.md
    `;
    console.error(errorMsg);
    return false;
  }

  return true;
};

// Inicializa o Firebase Admin SDK apenas uma vez
if (!admin.apps.length) {
  if (validateEnvVariables()) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // A chave privada pode vir com \n como string literal, então precisamos converter
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase Admin:', error);
    }
  }
}

// Funções auxiliares que verificam se o admin está inicializado
const getAdminAuth = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin não está inicializado. Verifique as variáveis de ambiente.');
  }
  return admin.auth();
};

const getAdminDb = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin não está inicializado. Verifique as variáveis de ambiente.');
  }
  return admin.firestore();
};

export const adminAuth = getAdminAuth;
export const adminDb = getAdminDb;

export default admin;
