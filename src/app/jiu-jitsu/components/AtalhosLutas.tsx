'use client';

/** Atalhos do início: a chave de lutas em andamento (ou nova chave) e o ranking. */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ResumoChave } from '@/lib/jiu-jitsu/chaves';
import { useApi } from '../lutas/_lib/api';

const STATUS: Record<ResumoChave['status'], string> = {
  rascunho: 'montando',
  sorteada: 'sorteada',
  em_andamento: 'em andamento',
  encerrada: 'encerrada',
};

export function AtalhosLutas() {
  const api = useApi();
  const [aberta, setAberta] = useState<ResumoChave | null | undefined>(undefined);

  useEffect(() => {
    api<{ chaves: ResumoChave[] }>('/chaves')
      .then((r) => setAberta(r.chaves.find((c) => c.tipo === 'principal' && c.status !== 'encerrada') ?? null))
      .catch(() => setAberta(null));
  }, [api]);

  const hrefLutas = !aberta
    ? '/jiu-jitsu/lutas'
    : aberta.status === 'rascunho'
      ? `/jiu-jitsu/lutas/nova?chave=${aberta.id}`
      : `/jiu-jitsu/lutas/${aberta.id}`;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href={hrefLutas} className="bg-stone-900 border border-stone-700/80 rounded-2xl px-3.5 py-3 flex flex-col gap-1.5 hover:bg-stone-800 transition min-w-0">
        <span className="w-8 h-8 rounded-[10px] bg-red-950 text-red-400 flex items-center justify-center">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-white">Lutas</span>
        <span className="text-xs text-stone-400 truncate">
          {aberta === undefined
            ? ' '
            : aberta
              ? `${aberta.nome} · ${aberta.rodadaAtual?.toLowerCase() ?? STATUS[aberta.status]}`
              : 'Montar uma chave'}
        </span>
      </Link>
      <Link href="/jiu-jitsu/lutas/ranking" className="bg-stone-900 border border-stone-700/80 rounded-2xl px-3.5 py-3 flex flex-col gap-1.5 hover:bg-stone-800 transition min-w-0">
        <span className="w-8 h-8 rounded-[10px] bg-amber-950 text-amber-400 flex items-center justify-center">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M8 21V11M16 21V7M12 21V3M4 21h16" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-white">Ranking {new Date().getFullYear()}</span>
        <span className="text-xs text-stone-400 truncate">Pontos por faixa</span>
      </Link>
    </div>
  );
}
