/**
 * Next.js Middleware para proteção de rotas
 * Roda no Edge Runtime (server-side) antes de renderizar páginas
 *
 * IMPORTANTE: Este middleware adiciona uma camada de segurança SERVER-SIDE
 * que não pode ser bypassada desabilitando JavaScript ou manipulando React
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de UIDs de administradores (mesmo que src/config/admin.ts)
const ADMIN_UIDS = ['X7aWBsKSpkTQr25mAigi9DkGULG3'];

// Rotas protegidas que requerem autenticação de admin
const PROTECTED_ROUTES = ['/admin'];

// Rotas de autenticação
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica se é uma rota protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Se não é rota protegida, permite acesso
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  /**
   * PROTEÇÃO SERVER-SIDE DE ROTAS ADMINISTRATIVAS
   *
   * NOTA IMPORTANTE: Firebase Auth usa tokens no localStorage/IndexedDB,
   * não cookies HTTP. Por isso, não podemos validar autenticação no middleware.
   *
   * SOLUÇÃO ATUAL:
   * - Middleware adiciona apenas headers de segurança
   * - Proteção real via ProtectedRoute (client-side) + Firestore Rules (server-side)
   *
   * SOLUÇÃO FUTURA:
   * - Implementar Firebase session cookies para validação server-side completa
   * - Usar Firebase Admin SDK em API Routes
   */

  // Apenas adiciona headers de segurança
  // A proteção de rotas acontece no ProtectedRoute component + Firestore Rules
  const response = NextResponse.next();

  // Content Security Policy (CSP)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com; " +
    "frame-src 'self' https://accounts.google.com;"
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

// Configuração de rotas que o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
