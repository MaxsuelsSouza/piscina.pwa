/**
 * API Route para enviar notificações push
 */

import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { getAdminFCMTokens, getUserFCMTokens } from '@/lib/firebase/firestore/fcmTokens.admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: messageBody, data, toAdmins, toUser } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Título e corpo da mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    let tokens: string[] = [];

    // Busca tokens dos destinatários
    if (toAdmins) {
      const adminTokens = await getAdminFCMTokens();
      tokens = [...tokens, ...adminTokens];
    }

    if (toUser) {
      const userTokens = await getUserFCMTokens(toUser);
      tokens = [...tokens, ...userTokens];
    }

    if (tokens.length === 0) {
      console.log('Nenhum token encontrado para enviar notificação');
      return NextResponse.json({
        success: true,
        message: 'Nenhum dispositivo registrado para receber notificações',
        sentCount: 0,
      });
    }

    // Remove duplicatas
    tokens = Array.from(new Set(tokens));

    console.log(`Enviando notificação para ${tokens.length} dispositivos`);

    // Prepara a mensagem
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body: messageBody,
        imageUrl: data?.imageUrl,
      },
      data: data || {},
      tokens,
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: true,
          tag: data?.tag || 'notification',
        },
        fcmOptions: {
          link: data?.link || '/',
        },
      },
    };

    // Envia a notificação
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('Notificações enviadas:', {
      success: response.successCount,
      failure: response.failureCount,
    });

    // Log de erros
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Erro ao enviar para token ${idx}:`, resp.error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error: any) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação', details: error.message },
      { status: 500 }
    );
  }
}
