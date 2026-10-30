/**
 * Caixa de uma luta na visualização em chave (duas linhas: azul e branco).
 */

import Link from 'next/link';
import type { Luta } from '@/lib/jiu-jitsu/chave';
import { nivelTxt } from '../_lib/formato';

export type Nomes = Record<string, { nome: string; nivel: number; atrasado?: boolean }>;

export function LutaCaixa({ luta, nomes, href }: { luta: Luta; nomes: Nomes; href?: string }) {
  const borda =
    luta.status === 'pronta'
      ? 'border-red-500'
      : luta.status === 'em_andamento'
        ? 'border-amber-500'
        : luta.status === 'bye'
          ? 'border-dashed border-green-800'
          : luta.status === 'finalizada'
            ? 'border-stone-700'
            : 'border-dashed border-stone-600';

  const linha = (id: string | null, cor: 'azul' | 'branco') => {
    const a = id ? nomes[id] : null;
    const venceu = luta.status === 'finalizada' && luta.vencedor === id;
    const perdeu = luta.status === 'finalizada' && id && luta.vencedor !== id;
    const vazio = !a;
    return (
      <span className={`flex items-center gap-1.5 h-[26px] px-2 ${cor === 'azul' ? 'border-b border-stone-800' : ''}`}>
        <span aria-hidden="true" className={`w-1 h-3.5 rounded-sm shrink-0 ${vazio ? 'bg-stone-700' : cor === 'azul' ? 'bg-blue-600' : 'bg-stone-100'}`} />
        <span
          className={`flex-1 min-w-0 truncate text-[13px] ${
            vazio ? 'italic text-stone-400' : perdeu ? 'line-through text-stone-400' : venceu ? 'font-bold text-white' : 'font-semibold text-white'
          }`}
        >
          {a ? a.nome : luta.status === 'bye' && cor === 'branco' ? 'passa direto' : 'a definir'}
          {a?.atrasado && <span className="ml-1 text-[10px] font-semibold text-amber-300">atrasado</span>}
        </span>
        {a && <span className="text-[11px] font-bold text-amber-400">{nivelTxt(a.nivel)}</span>}
      </span>
    );
  };

  const conteudo = (
    <>
      {linha(luta.azul, 'azul')}
      {linha(luta.branco, 'branco')}
    </>
  );
  const classe = `flex flex-col w-full h-[54px] rounded-[10px] bg-stone-900 overflow-hidden border ${borda}`;
  return href ? (
    <Link href={href} className={`${classe} hover:bg-stone-800`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

/** Duas colunas (rodada atual → próxima) ligadas por linhas. */
export function Colunas({
  esquerda,
  direita,
  tituloEsq,
  tituloDir,
  nomes,
  hrefDe,
}: {
  esquerda: Luta[];
  direita: Luta[];
  tituloEsq: string;
  tituloDir: string;
  nomes: Nomes;
  hrefDe: (l: Luta) => string | undefined;
}) {
  const BH = 54;
  const PASSO = 62;
  const TOPO = 22;
  const yEsq = esquerda.map((_, i) => TOPO + i * PASSO);
  const centro = (y: number) => y + BH / 2;
  const altura = TOPO + Math.max(esquerda.length, 1) * PASSO;

  const yDir = direita.map((_, k) => {
    const y1 = yEsq[2 * k] ?? yEsq[0];
    const y2 = yEsq[2 * k + 1] ?? y1;
    return (centro(y1) + centro(y2)) / 2 - BH / 2;
  });

  return (
    <div className="relative w-full" style={{ height: altura }}>
      <span className="absolute left-0 top-0 w-[47%] text-center text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{tituloEsq}</span>
      <span className="absolute right-0 top-0 w-[47%] text-center text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{tituloDir}</span>
      {direita.map((_, k) => {
        const y1 = centro(yEsq[2 * k] ?? yEsq[0]);
        const y2 = centro(yEsq[2 * k + 1] ?? yEsq[2 * k] ?? yEsq[0]);
        const yd = centro(yDir[k]);
        return (
          <span key={k} aria-hidden="true">
            <span className="absolute bg-stone-700" style={{ left: '47%', width: '3%', top: y1 - 1, height: 2 }} />
            <span className="absolute bg-stone-700" style={{ left: '47%', width: '3%', top: y2 - 1, height: 2 }} />
            <span className="absolute bg-stone-700" style={{ left: '50%', width: 2, top: y1 - 1, height: y2 - y1 + 2 }} />
            <span className="absolute bg-stone-700" style={{ left: '50%', width: '3%', top: yd - 1, height: 2 }} />
          </span>
        );
      })}
      {esquerda.map((l, i) => (
        <div key={l.id} className="absolute left-0 w-[47%]" style={{ top: yEsq[i] }}>
          <LutaCaixa luta={l} nomes={nomes} href={hrefDe(l)} />
        </div>
      ))}
      {direita.map((l, k) => (
        <div key={l.id} className="absolute right-0 w-[47%]" style={{ top: yDir[k] }}>
          <LutaCaixa luta={l} nomes={nomes} href={hrefDe(l)} />
        </div>
      ))}
    </div>
  );
}
