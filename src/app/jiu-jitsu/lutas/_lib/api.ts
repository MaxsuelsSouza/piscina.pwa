'use client';

/**
 * Cliente da API de lutas: manda o ID token do Firebase em toda chamada
 * (as rotas validam o token no servidor).
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export class ErroApi extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Opcoes = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown };

export function useApi() {
  const { user } = useAuth();
  return useCallback(
    async <T,>(caminho: string, opcoes: Opcoes = {}): Promise<T> => {
      if (!user) throw new ErroApi(401, 'Sua sessão expirou. Entre de novo.');
      const token = await user.getIdToken();
      const res = await fetch(`/api/jiu-jitsu${caminho}`, {
        method: opcoes.method ?? 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body),
        cache: 'no-store',
      });
      if (res.status === 204) return undefined as T;
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ErroApi(res.status, json.error ?? 'Algo deu errado. Tente de novo.');
      return json as T;
    },
    [user]
  );
}

/** Redireciona para o login se não houver usuário. Retorna se já pode carregar dados. */
export function useExigirLogin() {
  const router = useRouter();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);
  return { pronto: !loading && !!user, carregandoAuth: loading };
}

export function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Algo deu errado. Tente de novo.';
}

/** Lê um parâmetro da URL no cliente (sem exigir Suspense como o useSearchParams). */
export function lerParametro(nome: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(nome);
}
