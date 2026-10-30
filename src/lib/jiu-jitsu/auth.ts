/**
 * Autenticação para as rotas de API do módulo de Jiu-Jitsu.
 *
 * As rotas usam o Firebase Admin SDK, que ignora as Firestore Rules.
 * Por isso toda rota precisa validar o ID token do usuário aqui,
 * no servidor, antes de ler ou gravar qualquer dado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export type UsuarioAutenticado = { uid: string };

type ResultadoAuth =
  | { ok: true; usuario: UsuarioAutenticado }
  | { ok: false; resposta: NextResponse };

/**
 * Lê o header `Authorization: Bearer <idToken>` e valida o token.
 * Uso:
 *   const auth = await exigirUsuario(request);
 *   if (!auth.ok) return auth.resposta;
 */
export async function exigirUsuario(request: NextRequest): Promise<ResultadoAuth> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return {
      ok: false,
      resposta: NextResponse.json({ error: 'Token de autenticação não fornecido' }, { status: 401 }),
    };
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { ok: true, usuario: { uid: decoded.uid } };
  } catch {
    return {
      ok: false,
      resposta: NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 }),
    };
  }
}
