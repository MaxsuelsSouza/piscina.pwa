/**
 * API Route para enviar email de redefinição de senha
 * Apenas administradores podem acessar esta rota
 *
 * IMPORTANTE: Esta rota usa Firebase Admin SDK que APENAS gera o link.
 * Para enviar emails automaticamente, use o Firebase Client SDK no frontend
 * ou integre um serviço de email como SendGrid/AWS SES.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { isAdmin } from '@/config/admin';

export async function POST(request: NextRequest) {
  try {
    // Verifica o token de autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verifica se o usuário é admin
    if (!isAdmin(decodedToken.uid)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem enviar emails de redefinição de senha' },
        { status: 403 }
      );
    }

    // Obtém o email do corpo da requisição
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se o usuário existe
    const auth = adminAuth();
    try {
      await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Gera o link de redefinição de senha
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
      handleCodeInApp: false,
    };

    const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);

    // TODO: Aqui você deve enviar o email usando um serviço como:
    // - SendGrid
    // - AWS SES
    // - Nodemailer com SMTP
    // - Resend
    // etc.

    // Por enquanto, apenas logamos o link (NÃO FAZER EM PRODUÇÃO)
    console.log('🔑 Link de redefinição gerado para:', email);
    console.log('🔗 Link:', resetLink);

    // TEMPORÁRIO: Retorna o link na resposta para teste
    // REMOVER ISSO EM PRODUÇÃO por segurança!
    return NextResponse.json({
      success: true,
      message: 'Link de redefinição gerado com sucesso. Configure um serviço de email para enviar automaticamente.',
      // REMOVER em produção:
      resetLink: resetLink,
    });
  } catch (error: any) {
    console.error('Erro ao gerar link de redefinição:', error);

    // Mensagens de erro mais amigáveis
    let errorMessage = 'Erro ao gerar link de redefinição. Tente novamente.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
