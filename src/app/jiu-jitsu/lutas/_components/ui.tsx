'use client';

/**
 * Peças de interface das telas de lutas (tema escuro do módulo de jiu-jitsu).
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { FaixaJJ } from '../../_types';
import { COR_FAIXA } from '../_lib/formato';

export function Tela({
  titulo,
  subtitulo,
  voltar,
  direita,
  rodape,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  voltar?: string;
  direita?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col">
      <header className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur border-b border-stone-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {voltar && (
            <Link
              href={voltar}
              aria-label="Voltar"
              className="w-11 h-11 shrink-0 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center transition"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
              </svg>
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-semibold truncate">{titulo}</h1>
            {subtitulo && <p className="text-xs text-stone-400 truncate">{subtitulo}</p>}
          </div>
          {direita}
        </div>
      </header>
      <main className={`flex-1 w-full max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 ${rodape ? 'pb-28' : 'pb-8'}`}>{children}</main>
      {rodape && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-stone-950/95 backdrop-blur border-t border-stone-800">
          <div className="max-w-lg mx-auto px-4 pt-3 pb-6 flex gap-2.5">{rodape}</div>
        </div>
      )}
    </div>
  );
}

export function Faixa({ faixa, className = 'w-2 h-[30px]' }: { faixa: FaixaJJ; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} rounded-[3px] border border-stone-600 shrink-0`}
      style={{ background: COR_FAIXA[faixa] }}
    />
  );
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{children}</h2>;
}

export function Botao({
  children,
  onClick,
  variante = 'primario',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'primario' | 'secundario' | 'sucesso' | 'fantasma';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const estilos = {
    primario: 'bg-red-600 hover:bg-red-500 text-white font-semibold',
    secundario: 'border border-stone-700 hover:bg-stone-800 text-stone-200 font-medium',
    sucesso: 'bg-green-600 hover:bg-green-500 text-white font-bold',
    fantasma: 'text-stone-300 hover:bg-stone-800 font-medium',
  }[variante];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] px-4 rounded-2xl text-[15px] transition disabled:opacity-50 flex items-center justify-center gap-2 ${estilos} ${className}`}
    >
      {children}
    </button>
  );
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro' | 'ok'; children: ReactNode }) {
  const estilos = {
    info: 'bg-stone-900 border-stone-700 text-stone-300',
    erro: 'bg-red-950/60 border-red-800 text-red-200',
    ok: 'bg-green-950/60 border-green-800 text-green-200',
  }[tipo];
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`p-3 rounded-xl border text-sm ${estilos}`}>
      {children}
    </div>
  );
}

/** Painel que sobe de baixo, sobre um fundo escuro. */
export function Folha({
  aberta,
  aoFechar,
  titulo,
  subtitulo,
  children,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  if (!aberta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="Fechar" className="absolute inset-0 bg-black/70 animate-[jjFade_.2s_ease-out]" onClick={aoFechar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto text-white bg-stone-900 border-t border-stone-700 rounded-t-3xl px-5 pt-2 pb-7 flex flex-col gap-4 animate-[jjSobe_.28s_cubic-bezier(.2,.9,.3,1)]"
      >
        <div className="flex justify-center">
          <span className="w-10 h-1 rounded bg-stone-600" />
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{titulo}</h2>
            {subtitulo && <p className="text-[13px] text-stone-400">{subtitulo}</p>}
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-stone-900 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export function IconeTrofeu({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function IconeMais({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeBusca({ className = 'w-[18px] h-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
