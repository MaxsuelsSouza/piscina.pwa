/**
 * API Route para debug da configuração do Firebase Admin
 * ATENÇÃO: Remover em produção ou proteger adequadamente
 */

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verifica quais variáveis estão configuradas
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

    // Informações sobre a inicialização do Firebase Admin
    const isAdminInitialized = admin.apps.length > 0;

    let serviceAccountInfo = null;
    if (hasServiceAccount) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
        serviceAccountInfo = {
          hasProjectId: !!sa.project_id,
          hasClientEmail: !!sa.client_email,
          hasPrivateKey: !!sa.private_key,
          privateKeyLength: sa.private_key?.length || 0,
          privateKeyStartsWith: sa.private_key?.substring(0, 30) || '',
        };
      } catch (error: any) {
        serviceAccountInfo = { error: error.message };
      }
    }

    let privateKeyInfo = null;
    if (hasPrivateKey) {
      const pk = process.env.FIREBASE_PRIVATE_KEY!;
      privateKeyInfo = {
        length: pk.length,
        startsWith: pk.substring(0, 30),
        hasNewlines: pk.includes('\n'),
        hasLiteralBackslashN: pk.includes('\\n'),
      };
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      configuration: {
        method1_JSON: {
          FIREBASE_SERVICE_ACCOUNT: hasServiceAccount,
          details: serviceAccountInfo,
        },
        method2_Individual: {
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: hasProjectId,
          FIREBASE_CLIENT_EMAIL: hasClientEmail,
          FIREBASE_PRIVATE_KEY: hasPrivateKey,
          privateKeyDetails: privateKeyInfo,
        },
      },
      firebaseAdmin: {
        initialized: isAdminInitialized,
        appsCount: admin.apps.length,
      },
      recommendation: !hasServiceAccount && hasPrivateKey
        ? '⚠️ Recomendado: Use FIREBASE_SERVICE_ACCOUNT (JSON completo) ao invés de variáveis individuais'
        : hasServiceAccount
        ? '✅ Usando FIREBASE_SERVICE_ACCOUNT (método recomendado)'
        : '❌ Nenhuma configuração detectada',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
