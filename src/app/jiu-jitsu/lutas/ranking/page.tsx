'use client';

/** Tela 1b · Ranking da temporada por faixa. */

import { useEffect, useState } from 'react';
import { FAIXAS_JJ, FAIXAS_JJ_LABELS, type FaixaJJ } from '../../_types';
import type { LinhaRanking, PONTOS as TipoPontos } from '@/lib/jiu-jitsu/ranking';
import { Aviso, Carregando, Faixa, Tela } from '../_components/ui';
import { mensagemDe, useApi, useExigirLogin } from '../_lib/api';

type Resposta = { ano: number; pontos: typeof TipoPontos; faixas: Record<string, LinhaRanking[]> };

const MEDALHA = ['bg-amber-400', 'bg-stone-300', 'bg-amber-600'];

export default function RankingPage() {
  const { pronto } = useExigirLogin();
  const api = useApi();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [faixa, setFaixa] = useState<FaixaJJ>('branca');
  const [dados, setDados] = useState<Resposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [regras, setRegras] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    setDados(null);
    api<Resposta>(`/ranking?ano=${ano}`)
      .then(setDados)
      .catch((e) => setErro(mensagemDe(e)));
  }, [pronto, api, ano]);

  const lista = dados?.faixas[faixa] ?? [];
  const podio = lista.length >= 3 ? [lista[1], lista[0], lista[2]] : [];
  const resto = podio.length ? lista.slice(3) : lista;
  const p = dados?.pontos;

  return (
    <Tela
      titulo={`Ranking ${ano}`}
      subtitulo="Pontos por faixa · zera em janeiro"
      voltar="/jiu-jitsu/lutas"
      direita={
        <button
          onClick={() => setRegras(!regras)}
          aria-expanded={regras}
          className="h-10 px-3 rounded-full border border-stone-700 bg-stone-900 text-[13px] text-stone-200"
        >
          Como pontua
        </button>
      }
    >
      <div className="flex items-center justify-between">
        <button onClick={() => setAno(ano - 1)} className="h-9 px-3 rounded-lg text-sm text-stone-400 hover:bg-stone-900">
          ← {ano - 1}
        </button>
        {ano < new Date().getFullYear() && (
          <button onClick={() => setAno(ano + 1)} className="h-9 px-3 rounded-lg text-sm text-stone-400 hover:bg-stone-900">
            {ano + 1} →
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Faixa" className="grid grid-cols-5 gap-1.5">
        {FAIXAS_JJ.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={f === faixa}
            onClick={() => setFaixa(f)}
            className={`h-[54px] rounded-xl bg-stone-900 flex flex-col items-center justify-center gap-1.5 text-[11px] font-semibold ${
              f === faixa ? 'border-2 border-red-500 text-white' : 'border border-stone-800 text-stone-400'
            }`}
          >
            <Faixa faixa={f} className="w-[30px] h-2" />
            {FAIXAS_JJ_LABELS[f]}
          </button>
        ))}
      </div>

      {regras && p && (
        <div className="rounded-2xl bg-stone-900 border border-stone-700 divide-y divide-stone-800 text-[13px]">
          {[
            ['Participar da noite', `${p.participacao}`],
            ['Cada vitória', `${p.vitoria}`],
            ['Vitória por finalização', `+${p.bonusFinalizacao}`],
            ['Pódio do absoluto', `${p.podio.campeao} · ${p.podio.vice} · ${p.podio.terceiro}`],
            ['Melhor da faixa na repescagem', `+${p.melhorDaFaixaRepescagem}`],
            ['Passar direto ou W.O.', '0'],
          ].map(([o, v]) => (
            <div key={o} className="flex justify-between px-4 py-2.5">
              <span className="text-stone-300">{o}</span>
              <span className="font-bold text-amber-400">{v}</span>
            </div>
          ))}
        </div>
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {!dados && !erro && <Carregando />}

      {podio.length > 0 && (
        <div className="grid grid-cols-3 gap-2 items-end">
          {podio.map((l, i) => {
            const pos = [1, 0, 2][i];
            return (
              <div
                key={l.lutadorId}
                className={`rounded-2xl bg-stone-900 flex flex-col items-center justify-end gap-0.5 px-1.5 py-2.5 border ${
                  pos === 0 ? 'h-[150px] border-amber-700' : pos === 1 ? 'h-32 border-stone-800' : 'h-[116px] border-stone-800'
                }`}
              >
                <span className={`w-7 h-7 rounded-full ${MEDALHA[pos]} text-stone-950 text-xs font-extrabold flex items-center justify-center`}>
                  {pos + 1}º
                </span>
                <span className="text-sm font-bold text-center truncate max-w-full">{l.nome}</span>
                <span className="text-lg font-extrabold text-amber-400">{l.pontos}</span>
                <span className="text-[11px] text-stone-400">pontos</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {resto.map((l, i) => (
          <div key={l.lutadorId} className="flex items-center gap-3 h-14 px-3.5 rounded-2xl bg-stone-900 border border-stone-800">
            <span className="w-6 text-center text-sm font-bold text-stone-400">{i + 1 + (podio.length ? 3 : 0)}º</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold truncate">{l.nome}</span>
              <span className="block text-xs text-stone-400">
                {l.noites} {l.noites === 1 ? 'noite' : 'noites'} · {l.vitorias} vitórias
                {l.podios ? ` · ${l.podios} ${l.podios === 1 ? 'pódio' : 'pódios'}` : ''}
              </span>
            </span>
            <span className="text-base font-extrabold text-amber-400">{l.pontos}</span>
          </div>
        ))}
        {dados && lista.length === 0 && (
          <p className="p-6 text-center text-sm text-stone-400">Ninguém dessa faixa pontuou ainda nesta temporada.</p>
        )}
      </div>
    </Tela>
  );
}
