/**
 * Configuração do Firebase
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';

// Configuração do Firebase obtida do Console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Valida se todas as variáveis de ambiente estão definidas
const validateConfig = () => {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missing = required.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missing.length > 0 && typeof window !== 'undefined') {
  }
};

validateConfig();

// Inicializa apenas uma vez e apenas no cliente
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
  // Só inicializa no navegador (client-side)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);

  // Configura persistência para manter sessão mesmo após fechar o navegador
  // Os tokens do Firebase são válidos e renovados automaticamente
  setPersistence(auth, browserLocalPersistence).catch((error) => {
  });
} else {
  // No servidor, cria objetos vazios para evitar erros
  app = {} as FirebaseApp;
  db = {} as Firestore;
  auth = {} as Auth;
}

export { app, db, auth };
