'use client';

/**
 * Faixa no início do módulo: mostra a faixa e os graus (sem editar por toque
 * acidental), a jornada da branca à preta e o histórico. Para mudar, o botão
 * "Atualizar" abre uma folha com faixa, graus e a data em que aconteceu.
 */

import { useMemo, useState } from 'react';
import { Botao, Folha } from '../lutas/_components/ui';
import { COR_SOLIDA, FaixaReal, type FaixaId } from './FaixaReal';

export type { FaixaId };

const ORDEM: FaixaId[] = ['branca', 'azul', 'roxa', 'marrom', 'preta'];
const NOME: Record<FaixaId, string> = { branca: 'Branca', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta' };
const COR_TEXTO: Record<FaixaId, string> = {
  branca: '#e7e5e4',
  azul: '#60a5fa',
  roxa: '#c084fc',
  marrom: '#d97706',
  preta: '#f87171',
};

/** Cor das barrinhas de progresso: a da faixa; na preta, o vermelho da ponteira. */
const corDestaque = (f: FaixaId) => (f === 'preta' ? '#b91c1c' : COR_SOLIDA[f]);

/** Faixas coloridas vão até 4 graus; a preta, até 6. */
export const maxGraus = (f: FaixaId) => (f === 'preta' ? 6 : 4);

export interface EventoHistorico {
  tipo: 'inicio' | 'listra' | 'faixa';
  faixa: FaixaId;
  listras: number;
  data: string;
}

interface Props {
  initialFaixa?: FaixaId;
  initialListras?: number;
  historico?: EventoHistorico[];
  onUpdate?: (faixa: FaixaId, listras: number, evento: EventoHistorico) => Promise<void> | void;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const dataTxt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};
const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const grauTxt = (n: number) => (n === 0 ? 'sem grau' : `${n}º grau`);

function tempoDesde(iso: string) {
  const ini = new Date(iso);
  const agora = new Date();
  const meses = (agora.getFullYear() - ini.getFullYear()) * 12 + agora.getMonth() - ini.getMonth() - (agora.getDate() < ini.getDate() ? 1 : 0);
  if (meses < 1) return 'menos de 1 mês';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}${resto ? ` e ${resto} ${resto === 1 ? 'mês' : 'meses'}` : ''}`;
}

export function BeltProgress({ initialFaixa = 'branca', initialListras = 0, historico = [], onUpdate }: Props) {
  const faixa = initialFaixa;
  const graus = initialListras;
  const idx = ORDEM.indexOf(faixa);
  const proxima = idx < ORDEM.length - 1 ? ORDEM[idx + 1] : null;
  const max = maxGraus(faixa);

  const [editando, setEditando] = useState(false);
  const [verHistorico, setVerHistorico] = useState(false);

  const ordenado = useMemo(() => [...historico].sort((a, b) => a.data.localeCompare(b.data)), [historico]);

  // Quando chegou na faixa atual: o evento mais recente que trouxe essa faixa.
  const desde = useMemo(() => {
    const chegada = [...ordenado].reverse().find((e) => e.faixa === faixa && (e.tipo === 'faixa' || e.tipo === 'inicio'));
    return chegada?.data ?? null;
  }, [ordenado, faixa]);

  // Ano em que cada faixa anterior foi conquistada.
  const anoDe = (f: FaixaId) => {
    const e = ordenado.find((x) => x.faixa === f && (x.tipo === 'faixa' || x.tipo === 'inicio'));
    return e ? String(new Date(e.data).getFullYear()) : null;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Sua faixa ── */}
      <section className="bg-stone-900 border border-stone-700/80 rounded-2xl p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-stone-400">Sua faixa</p>
            <p className="text-[22px] font-semibold text-white mt-0.5">
              {NOME[faixa]} · {grauTxt(graus)}
            </p>
            {desde && (
              <p className="text-xs text-stone-400">
                Desde {dataTxt(desde)} · {tempoDesde(desde)}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditando(true)}
            className="shrink-0 h-9 px-3 rounded-full border border-stone-600 text-stone-200 text-[13px] flex items-center gap-1.5 hover:bg-stone-800 transition"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
            </svg>
            Atualizar
          </button>
        </div>

        <FaixaReal faixa={faixa} graus={graus} className="w-full mt-3 mb-1" />

        <div className="flex gap-1 mt-1.5" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className="flex-1 h-[5px] rounded-full" style={{ background: i < graus ? corDestaque(faixa) : '#44403c' }} />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-stone-400">
          <span>
            {graus} de {max} graus
          </span>
          {proxima ? (
            graus >= max ? (
              <span>
                Pronto para a <span style={{ color: COR_TEXTO[proxima] }}>{NOME[proxima].toLowerCase()}</span>
              </span>
            ) : (
              <span>
                Faltam {max - graus} para a <span style={{ color: COR_TEXTO[proxima] }}>{NOME[proxima].toLowerCase()}</span>
              </span>
            )
          ) : (
            <span>{graus >= max ? 'Grau máximo' : `Faltam ${max - graus} para o ${max}º grau`}</span>
          )}
        </div>
      </section>

      {/* ── Jornada (toque para ver o histórico) ── */}
      <section className="bg-stone-900 border border-stone-700/80 rounded-2xl">
        <button
          onClick={() => setVerHistorico((v) => !v)}
          aria-expanded={verHistorico}
          className="w-full px-4 pt-3 pb-3.5 text-left"
        >
          <span className="flex justify-between items-center">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-stone-400">Jornada</span>
            {ordenado.length > 0 && (
              <span className="text-[11px] text-stone-500">
                Histórico {verHistorico ? '▲' : '▼'}
              </span>
            )}
          </span>
          <span className="flex items-center mt-2.5">
            {ORDEM.map((f, i) => {
              const passada = i < idx;
              const atual = i === idx;
              return (
                <span key={f} className="contents">
                  {i > 0 && <span className="flex-1 h-0.5" style={{ background: i <= idx ? corDestaque(faixa) : '#44403c' }} />}
                  <span className="flex flex-col items-center gap-1 w-11">
                    <span
                      className={`w-[30px] h-2.5 rounded-[2px] ${atual ? 'outline outline-2 outline-offset-2 outline-white' : ''} ${f === 'preta' ? 'border border-stone-600' : ''}`}
                      style={{ background: COR_SOLIDA[f], opacity: passada || atual || f === 'preta' ? 1 : 0.4 }}
                    />
                    <span className={`text-[11px] ${atual ? 'text-white' : passada ? 'text-stone-300' : 'text-stone-500'}`}>
                      {atual ? 'Agora' : passada ? anoDe(f) ?? '✓' : NOME[f]}
                    </span>
                  </span>
                </span>
              );
            })}
          </span>
        </button>

        {verHistorico && ordenado.length > 0 && (
          <ol className="border-t border-stone-800 px-4 py-2">
            {[...ordenado].reverse().map((ev, i) => (
              <li key={`${ev.data}-${i}`} className="flex items-center gap-3 py-2">
                <span className="w-6 h-2 rounded-[2px] shrink-0 border border-stone-700" style={{ background: COR_SOLIDA[ev.faixa] }} />
                <span className="flex-1 text-sm text-stone-200">
                  {ev.tipo === 'inicio'
                    ? `Começou na ${NOME[ev.faixa].toLowerCase()}`
                    : ev.tipo === 'faixa'
                      ? `Faixa ${NOME[ev.faixa].toLowerCase()}`
                      : `${grauTxt(ev.listras)} na ${NOME[ev.faixa].toLowerCase()}`}
                </span>
                <span className="text-xs text-stone-500">{dataTxt(ev.data)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <AtualizarFaixa
        aberta={editando}
        faixa={faixa}
        graus={graus}
        aoFechar={() => setEditando(false)}
        aoSalvar={async (f, g, dataISO) => {
          const mudouFaixa = f !== faixa;
          const evento: EventoHistorico = { tipo: mudouFaixa ? 'faixa' : 'listra', faixa: f, listras: g, data: dataISO };
          await onUpdate?.(f, g, evento);
          setEditando(false);
        }}
      />
    </div>
  );
}

function AtualizarFaixa({
  aberta,
  faixa,
  graus,
  aoFechar,
  aoSalvar,
}: {
  aberta: boolean;
  faixa: FaixaId;
  graus: number;
  aoFechar: () => void;
  aoSalvar: (faixa: FaixaId, graus: number, dataISO: string) => Promise<void>;
}) {
  const [f, setF] = useState(faixa);
  const [g, setG] = useState(graus);
  const [dia, setDia] = useState(hojeISO());
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(aberta);

  // Ao abrir, começa do estado atual.
  if (aberta !== aberto) {
    setAberto(aberta);
    if (aberta) {
      setF(faixa);
      setG(graus);
      setDia(hojeISO());
    }
  }

  const max = maxGraus(f);
  const igual = f === faixa && g === graus;
  const diaValido = /^\d{4}-\d{2}-\d{2}$/.test(dia) && dia <= hojeISO();

  const salvar = async () => {
    if (igual || !diaValido) return;
    setSalvando(true);
    try {
      // Meio-dia local, para a data não "voltar um dia" no fuso.
      await aoSalvar(f, g, new Date(`${dia}T12:00:00`).toISOString());
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Atualizar faixa" subtitulo="Fica registrado no seu histórico">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-stone-400 mb-1.5">Faixa</p>
          <div role="radiogroup" aria-label="Faixa" className="grid grid-cols-5 gap-1.5">
            {ORDEM.map((x) => (
              <button
                key={x}
                role="radio"
                aria-checked={f === x}
                aria-label={NOME[x]}
                onClick={() => {
                  setF(x);
                  setG((v) => Math.min(v, maxGraus(x)));
                }}
                className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 ${f === x ? 'border-2 border-red-500' : 'border border-stone-700'}`}
              >
                <span className={`w-6 h-[7px] rounded-[2px] ${x === 'preta' ? 'border border-stone-500' : ''}`} style={{ background: COR_SOLIDA[x] }} />
                <span className="text-[10px] text-stone-400">{NOME[x]}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-stone-400 mb-1.5">Graus</p>
          <div role="radiogroup" aria-label="Graus" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${max + 1}, minmax(0, 1fr))` }}>
            {Array.from({ length: max + 1 }, (_, n) => (
              <button
                key={n}
                role="radio"
                aria-checked={g === n}
                onClick={() => setG(n)}
                className={`h-11 rounded-xl text-sm ${g === n ? 'bg-red-600 text-white font-semibold' : 'bg-stone-950 text-stone-400'}`}
              >
                {n === 0 ? '0' : `${n}º`}
              </button>
            ))}
          </div>
        </div>

        <FaixaReal faixa={f} graus={g} className="w-full" />

        <label className="block">
          <span className="block text-[11px] font-semibold tracking-widest uppercase text-stone-400 mb-1.5">Quando</span>
          <input
            type="date"
            value={dia}
            max={hojeISO()}
            onChange={(e) => setDia(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-stone-950 border border-stone-700 text-white [color-scheme:dark]"
          />
          {!diaValido && <span className="block mt-1 text-xs text-red-300">Escolha uma data até hoje</span>}
        </label>

        <div className="grid grid-cols-[1fr_1.4fr] gap-2">
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="sucesso" onClick={salvar} disabled={igual || !diaValido || salvando}>
            {salvando ? 'Salvando…' : igual ? 'Nada mudou' : 'Salvar'}
          </Botao>
        </div>
      </div>
    </Folha>
  );
}
