'use client';

/** Tela 5 · Resultado da noite: pódio do absoluto, melhores por faixa na repescagem e pontos. */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FAIXAS_JJ_LABELS, type FaixaJJ } from '../../../_types';
import { classificacao } from '@/lib/jiu-jitsu/chave';
import type { ChaveDoc, DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { calcularRanking } from '@/lib/jiu-jitsu/ranking';
import { melhoresPorFaixa } from '@/lib/jiu-jitsu/repescagem';
import { Aviso, Carregando, Faixa, IconeTrofeu, Rotulo, Tela } from '../../_components/ui';
import { mensagemDe, useApi, useExigirLogin } from '../../_lib/api';
import { dataCurta, faixaTxt } from '../../_lib/formato';

/** Adapta o detalhe vindo da API ao formato usado no cálculo de pontos. */
function comoDoc(d: DetalheChave): { id: string; doc: ChaveDoc } {
  return {
    id: d.id,
    doc: {
      ownerUid: '', nome: d.nome, tipo: d.tipo, principalId: d.principalId, inscritos: d.inscritos,
      atletas: d.atletas, chave: d.chave, sorteadaEm: d.sorteadaEm, createdAt: d.createdAt, updatedAt: d.updatedAt,
    },
  };
}

export default function ResultadoPage({ params }: { params: { id: string } }) {
  const { pronto } = useExigirLogin();
  const api = useApi();
  const [principal, setPrincipal] = useState<DetalheChave | null>(null);
  const [rep, setRep] = useState<DetalheChave | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pronto) return;
    (async () => {
      try {
        const { chave } = await api<{ chave: DetalheChave }>(`/chaves/${params.id}`);
        setPrincipal(chave);
        if (chave.repescagemId) setRep((await api<{ chave: DetalheChave }>(`/chaves/${chave.repescagemId}`)).chave);
      } catch (e) {
        setErro(mensagemDe(e));
      }
    })();
  }, [pronto, api, params.id]);

  const voltar = `/jiu-jitsu/lutas/${params.id}`;
  if (!principal) {
    return (
      <Tela titulo="Resultado da noite" voltar={voltar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />}
      </Tela>
    );
  }

  const res = principal.classificacao;
  const atleta = (id: string) => principal.atletas.find((a) => a.id === id) ?? rep?.atletas.find((a) => a.id === id);

  // Pontos só desta noite (absoluto + repescagem).
  const ano = new Date(principal.sorteadaEm ?? principal.createdAt).getUTCFullYear();
  const pontosNoite = new Map<string, number>();
  const ranking = calcularRanking([comoDoc(principal), ...(rep ? [comoDoc(rep)] : [])], ano);
  Object.values(ranking).flat().forEach((l) => pontosNoite.set(l.lutadorId, (pontosNoite.get(l.lutadorId) ?? 0) + l.pontos));

  const vitorias = (id: string) =>
    principal.chave!.lutas.filter((l) => l.status === 'finalizada' && l.metodo !== 'wo' && l.vencedor === id);

  const melhores = rep?.chave && classificacao(rep.chave) ? melhoresPorFaixa(rep.chave, rep.atletas) : null;

  const linhaPodio = (id: string, pos: string, cor: string) => {
    const a = atleta(id);
    if (!a) return null;
    const v = vitorias(id);
    return (
      <div key={`${pos}-${id}`} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-stone-900 border border-stone-800">
        <span className={`w-8 h-8 rounded-full ${cor} text-stone-950 text-xs font-extrabold flex items-center justify-center shrink-0`}>{pos}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold">{a.nome}</span>
          <span className="block text-xs text-stone-400">
            {faixaTxt(a.faixa, a.graus)} · {v.length} {v.length === 1 ? 'vitória' : 'vitórias'}
          </span>
        </span>
        <span className="text-sm font-extrabold text-amber-400">+{pontosNoite.get(id) ?? 0}</span>
      </div>
    );
  };

  return (
    <Tela titulo="Resultado da noite" subtitulo={`${principal.nome} · ${dataCurta(principal.createdAt)}`} voltar={voltar}>
      {!res && <Aviso>O absoluto ainda não terminou.</Aviso>}

      {res && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Pódio do absoluto</h2>
          <div className="flex items-center gap-3.5 p-4 rounded-[18px] bg-stone-900 border border-amber-700">
            <span className="w-14 h-14 rounded-full border-2 border-amber-400 text-amber-400 flex items-center justify-center shrink-0">
              <IconeTrofeu className="w-7 h-7" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-amber-400">1º lugar</span>
              <span className="block text-2xl font-extrabold truncate">{atleta(res.campeao)?.nome}</span>
              <span className="block text-xs text-stone-400">
                {(() => {
                  const a = atleta(res.campeao);
                  const v = vitorias(res.campeao);
                  const f = v.filter((l) => l.metodo === 'finalizacao').length;
                  return a ? `${faixaTxt(a.faixa, a.graus)} · ${v.length} vitórias${f ? `, ${f} por finalização` : ''}` : '';
                })()}
              </span>
            </span>
            <span className="text-[15px] font-extrabold text-amber-400">+{pontosNoite.get(res.campeao) ?? 0}</span>
          </div>
          {linhaPodio(res.vice, '2º', 'bg-stone-300')}
          {res.terceiros.map((t) => linhaPodio(t, '3º', 'bg-amber-600'))}
        </section>
      )}

      {rep && (
        <section className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline">
            <Rotulo>Repescagem · melhor de cada faixa</Rotulo>
            <Link href={`/jiu-jitsu/lutas/${rep.id}`} className="text-xs font-semibold text-red-400">Ver chave</Link>
          </div>
          {!melhores && <Aviso>A repescagem ainda está em andamento.</Aviso>}
          {melhores && (
            <div className="rounded-2xl bg-stone-900 border border-stone-800 divide-y divide-stone-800">
              {Object.entries(melhores).map(([faixa, id]) => {
                const a = atleta(id)!;
                return (
                  <div key={faixa} className="flex items-center gap-2.5 px-3.5 py-3">
                    <Faixa faixa={faixa as FaixaJJ} className="w-1.5 h-7" />
                    <span className="w-16 text-xs font-semibold text-stone-400">{FAIXAS_JJ_LABELS[faixa as FaixaJJ]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-semibold truncate">{a.nome}</span>
                      {a.atrasado && <span className="block text-xs text-stone-400">Chegou atrasado</span>}
                    </span>
                    <span className="text-sm font-extrabold text-amber-400">+{pontosNoite.get(id) ?? 0}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <Link href="/jiu-jitsu/lutas/ranking" className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-dashed border-stone-600 text-[13px] text-stone-200">
        <span className="flex-1">Os pontos da noite já entram no Ranking {ano}</span>
        <span aria-hidden="true">→</span>
      </Link>
      <Link href="/jiu-jitsu/lutas/nova" className="min-h-[50px] rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center font-semibold">
        Nova chave
      </Link>
    </Tela>
  );
}
