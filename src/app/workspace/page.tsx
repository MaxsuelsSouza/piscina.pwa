'use client';

/** Workspace: entrada dos módulos (Jiu-Jitsu e Lista de Compras), com um resumo de cada um. */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaixaReal, type FaixaId } from '@/app/jiu-jitsu/components/FaixaReal';
import type { ListaCompras } from '@/app/lista-compras/_types';

const NOME_FAIXA: Record<FaixaId, string> = { branca: 'Branca', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta' };

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function WorkspacePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [faixa, setFaixa] = useState<{ faixa: FaixaId; listras: number } | null>(null);
  const [listas, setListas] = useState<ListaCompras[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/jiu-jitsu/progresso')
      .then((r) => r.json())
      .then((d) => setFaixa({ faixa: d.faixa ?? 'branca', listras: d.listras ?? 0 }))
      .catch(() => setFaixa(null));
    fetch('/api/lista-compras')
      .then((r) => r.json())
      .then((d) => setListas(d.listas ?? []))
      .catch(() => setListas(null));
  }, [user]);

  const sair = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-stone-300 rounded-full animate-spin" />
      </div>
    );
  }

  const abertas = (listas ?? []).filter((l) => l.status !== 'concluida' && l.status !== 'arquivada');
  const pendentes = abertas.reduce((n, l) => n + l.itens.filter((i) => !i.comprado).length, 0);

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="max-w-lg mx-auto px-5 pt-10 pb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-stone-400 first-letter:uppercase">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">{saudacao()}</h1>
          <p className="text-xs text-stone-500 truncate mt-0.5">{user.email}</p>
        </div>
        <button
          onClick={sair}
          className="shrink-0 h-9 px-3.5 rounded-full border border-stone-700 text-sm text-stone-300 hover:bg-stone-900 transition"
        >
          Sair
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-10 flex flex-col gap-3">
        <Link
          href="/jiu-jitsu"
          className="group block rounded-3xl bg-stone-900 border border-stone-800 hover:border-stone-700 p-5 transition"
        >
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-red-950 text-red-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z" />
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-lg font-semibold">Jiu-Jitsu</span>
              <span className="block text-[13px] text-stone-400">
                {faixa ? `Faixa ${NOME_FAIXA[faixa.faixa].toLowerCase()} · ${faixa.listras ? `${faixa.listras}º grau` : 'sem grau'}` : 'Faixa, técnicas e lutas'}
              </span>
            </span>
            <Seta />
          </div>
          {faixa && <FaixaReal faixa={faixa.faixa} graus={faixa.listras} className="w-full mt-4" />}
        </Link>

        <Link
          href="/lista-compras"
          className="group block rounded-3xl bg-stone-900 border border-stone-800 hover:border-stone-700 p-5 transition"
        >
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-lg font-semibold">Lista de Compras</span>
              <span className="block text-[13px] text-stone-400">
                {listas === null
                  ? 'Suas listas de mercado'
                  : abertas.length === 0
                    ? 'Nenhuma lista aberta'
                    : `${abertas.length} ${abertas.length === 1 ? 'lista aberta' : 'listas abertas'} · ${pendentes} ${pendentes === 1 ? 'item' : 'itens'} para comprar`}
              </span>
            </span>
            <Seta />
          </div>
        </Link>
      </main>
    </div>
  );
}

function Seta() {
  return (
    <svg
      className="w-5 h-5 text-stone-600 group-hover:text-stone-300 group-hover:translate-x-0.5 transition shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
