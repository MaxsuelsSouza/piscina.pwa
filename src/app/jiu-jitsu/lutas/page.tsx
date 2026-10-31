'use client';

/** Tela 1 · Lutas — início: nova chave, ranking, em andamento e histórico. */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ResumoChave } from '@/lib/jiu-jitsu/chaves';
import { ExcluirChave } from './_components/ExcluirChave';
import { Aviso, Carregando, IconeMais, IconeTrofeu, Rotulo } from './_components/ui';
import { mensagemDe, useApi, useExigirLogin } from './_lib/api';
import { dataCurta } from './_lib/formato';

const STATUS_LABEL: Record<ResumoChave['status'], string> = {
  rascunho: 'Montando',
  sorteada: 'Sorteada',
  em_andamento: 'Em andamento',
  encerrada: 'Encerrada',
};

export default function LutasInicio() {
  const { pronto } = useExigirLogin();
  const api = useApi();
  const [chaves, setChaves] = useState<ResumoChave[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<ResumoChave | null>(null);
  useEffect(() => {
    if (!pronto) return;
    api<{ chaves: ResumoChave[] }>('/chaves')
      .then((r) => setChaves(r.chaves.filter((c) => c.tipo === 'principal')))
      .catch((e) => setErro(mensagemDe(e)));
  }, [pronto, api]);

  const abertas = chaves?.filter((c) => c.status !== 'encerrada') ?? [];
  const encerradas = chaves?.filter((c) => c.status === 'encerrada') ?? [];

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col">
      <div className="bg-stone-900 border-b border-stone-800 px-5 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Lutas</h1>
          <p className="text-[13px] text-stone-400 mt-1">Monte a chave, sorteie e vá eliminando até o campeão.</p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 pb-28 flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <Link href="/jiu-jitsu/lutas/nova" className="flex items-center gap-3.5 p-4 rounded-[20px] bg-red-600 hover:bg-red-500 transition">
            <span className="w-11 h-11 rounded-[14px] bg-black/20 flex items-center justify-center shrink-0">
              <IconeMais className="w-[22px] h-[22px]" />
            </span>
            <span className="flex-1 flex flex-col">
              <span className="text-base font-semibold">Nova chave</span>
              <span className="text-[13px] text-red-100">Adicione os alunos e sorteie os confrontos</span>
            </span>
          </Link>
          <Link href="/jiu-jitsu/lutas/ranking" className="flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] bg-stone-900 border border-stone-700 hover:bg-stone-800 transition">
            <span className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M8 21V11M16 21V7M12 21V3M4 21h16" />
              </svg>
            </span>
            <span className="flex-1 flex flex-col">
              <span className="text-[15px] font-semibold">Ranking {new Date().getFullYear()}</span>
              <span className="text-xs text-stone-400">Pontos por faixa na temporada</span>
            </span>
          </Link>
        </div>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {!chaves && !erro && <Carregando />}

        {abertas.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <Rotulo>Em andamento</Rotulo>
            {abertas.map((c) => {
              const href = c.status === 'rascunho' ? `/jiu-jitsu/lutas/nova?chave=${c.id}` : `/jiu-jitsu/lutas/${c.id}`;
              return (
                <div key={c.id} className="flex flex-col gap-3 p-4 rounded-[18px] bg-stone-900 border border-stone-700">
                  <Link href={href} className="flex flex-col gap-3">
                    <span className="flex justify-between items-center gap-3">
                      <span className="text-[15px] font-semibold truncate">{c.nome}</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 shrink-0">
                        {c.status === 'sorteada' ? STATUS_LABEL.sorteada : c.rodadaAtual ?? STATUS_LABEL[c.status]}
                      </span>
                    </span>
                    {c.status !== 'rascunho' && (
                      <span className="h-1.5 rounded bg-stone-700 overflow-hidden" aria-label={`${Math.round(c.progresso * 100)}% das lutas`}>
                        <span className="block h-full bg-red-500" style={{ width: `${c.progresso * 100}%` }} />
                      </span>
                    )}
                    <span className="text-[13px] text-stone-400">
                      {c.totalAtletas} atletas{c.status !== 'rascunho' ? ` · ${c.restantes} restantes` : ''}
                    </span>
                  </Link>
                  <span className="flex justify-between items-center -mb-1">
                    <button
                      onClick={() => setExcluir(c)}
                      className="flex items-center gap-1.5 h-9 -ml-2 px-2 rounded-lg text-[13px] text-stone-400 hover:text-red-300 hover:bg-stone-800"
                    >
                      <IconeLixo /> Excluir
                    </button>
                    <Link href={href} className="h-9 flex items-center text-[13px] text-red-400 font-semibold">
                      Continuar
                    </Link>
                  </span>
                </div>
              );
            })}
          </section>
        )}

        {encerradas.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <Rotulo>Histórico</Rotulo>
            {encerradas.map((c) => (
              <div key={c.id} className="flex items-center gap-1 pr-1.5 rounded-2xl bg-stone-900 border border-stone-800">
                <Link
                  href={`/jiu-jitsu/lutas/${c.id}/resultado`}
                  className="flex-1 min-w-0 flex items-center gap-3 pl-4 pr-2 py-3.5 rounded-2xl hover:bg-stone-800 transition"
                >
                  <span className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center shrink-0">
                    <IconeTrofeu />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-sm font-semibold truncate">{c.nome}</span>
                    <span className="text-xs text-stone-400">
                      {c.totalAtletas} atletas · {dataCurta(c.createdAt)}
                    </span>
                  </span>
                  <span className="text-[13px] font-semibold text-amber-400 truncate max-w-[30%]">{c.campeao}</span>
                </Link>
                <button
                  onClick={() => setExcluir(c)}
                  aria-label={`Excluir ${c.nome}`}
                  className="w-10 h-10 rounded-xl text-stone-500 hover:text-red-300 hover:bg-stone-800 flex items-center justify-center shrink-0"
                >
                  <IconeLixo />
                </button>
              </div>
            ))}
          </section>
        )}

        {chaves && chaves.length === 0 && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center text-stone-400 text-sm">
            Nenhuma chave ainda. Comece pela <strong className="text-white">Nova chave</strong>.
          </div>
        )}
      </main>

      <ExcluirChave
        chave={excluir}
        aoFechar={() => setExcluir(null)}
        aoExcluir={() => {
          setChaves((cs) => cs?.filter((c) => c.id !== excluir?.id) ?? null);
          setExcluir(null);
        }}
      />

      <NavJiuJitsu />
    </div>
  );
}

function NavJiuJitsu() {
  return (
    <nav aria-label="Jiu-Jitsu" className="fixed bottom-0 inset-x-0 z-20 bg-stone-950/95 backdrop-blur border-t border-stone-800">
      <div className="max-w-lg mx-auto grid grid-cols-3">
        <Link href="/jiu-jitsu" className="flex flex-col items-center gap-1 py-3 text-stone-500 hover:text-stone-300">
          <span className="text-2xl leading-none" aria-hidden="true">🥋</span>
          <span className="text-[11px] font-medium">Início</span>
        </Link>
        <Link href="/jiu-jitsu?tab=tecnicas" className="flex flex-col items-center gap-1 py-3 text-stone-500 hover:text-stone-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span className="text-[11px] font-medium">Técnicas</span>
        </Link>
        <span aria-current="page" className="relative flex flex-col items-center gap-1 py-3 text-red-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z" />
          </svg>
          <span className="text-[11px] font-semibold">Lutas</span>
          <span className="absolute bottom-1 w-5 h-0.5 bg-red-500 rounded-full" />
        </span>
      </div>
    </nav>
  );
}

function IconeLixo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}
