/**
 * Configuração do Firebase Admin SDK
 * Este arquivo deve ser usado apenas em rotas de API do Next.js (server-side)
 */

import * as admin from 'firebase-admin';

// Função para obter as credenciais do Firebase Admin
const getFirebaseCredentials = () => {
  // Opção 1: Usar FIREBASE_SERVICE_ACCOUNT (JSON completo)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      };
    } catch (error) {
      console.error('❌ Erro ao parsear FIREBASE_SERVICE_ACCOUNT:', error);
    }
  }

  // Opção 2: Usar variáveis individuais
  if (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    // A chave privada pode vir com \n como string literal, então precisamos converter
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Remove aspas duplas se existirem ao redor da chave
    privateKey = privateKey.replace(/^"(.*)"$/, '$1');

    // Verifica se a chave já está no formato correto (com quebras de linha reais)
    if (!privateKey.includes('\n')) {
      // Se não tem quebras de linha reais, substitui os literais \n
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };
  }

  return null;
};

// Valida variáveis de ambiente necessárias
const validateEnvVariables = () => {
  const credentials = getFirebaseCredentials();

  if (!credentials) {
    const errorMsg = `
❌ Variáveis de ambiente do Firebase Admin não configuradas!

Opção 1 - Usar JSON completo:
  FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

Opção 2 - Usar variáveis individuais:
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
  FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\nSua_Chave_Aqui\\n-----END PRIVATE KEY-----\\n

Para obter as credenciais:
1. Acesse o Firebase Console: https://console.firebase.google.com/
2. Vá em Project Settings > Service Accounts
3. Clique em "Generate New Private Key"
4. Baixe o arquivo JSON

No Vercel:
- Cole o JSON completo em FIREBASE_SERVICE_ACCOUNT OU
- Adicione as variáveis individuais (FIREBASE_PRIVATE_KEY SEM aspas e com \\n literais)

5. Reinicie/redeploy o servidor
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
      const credentials = getFirebaseCredentials();

      if (!credentials) {
        throw new Error('Credenciais do Firebase não configuradas');
      }

      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      console.log('✅ Firebase Admin inicializado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar Firebase Admin:', error);
      console.error('❌ Detalhes:', {
        message: error.message,
        code: error.code,
      });
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
