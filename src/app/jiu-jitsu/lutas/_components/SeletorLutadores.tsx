'use client';

/**
 * Lista rápida: todos os lutadores salvos, de uma vez, com um toque para marcar
 * ou desmarcar. A busca só filtra a lista; "Novo" cadastra e já marca.
 */

import { useEffect, useMemo, useState } from 'react';
import { normalizarBusca, type Lutador } from '@/lib/jiu-jitsu/schemas';
import { CadastroLutador, LinhaLutador } from './Lutadores';
import { Botao, Carregando, IconeBusca, IconeMais } from './ui';
import { mensagemDe, useApi } from '../_lib/api';

export function SeletorLutadores({
  selecionados,
  aoAlternar,
  indisponiveis = {},
  cheio = false,
  rotuloMarcado = 'Adicionado',
}: {
  selecionados: Set<string>;
  aoAlternar: (l: Lutador) => void;
  /** id → motivo (ex.: "na chave"); some da lista e só aparece, sem botão, ao buscar. */
  indisponiveis?: Record<string, string>;
  /** Sem espaço para mais ninguém: só deixa desmarcar. */
  cheio?: boolean;
  rotuloMarcado?: string;
}) {
  const api = useApi();
  const [todos, setTodos] = useState<Lutador[] | null>(null);
  const [busca, setBusca] = useState('');
  const [cadastro, setCadastro] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<{ lutadores: Lutador[] }>('/lutadores')
      .then((r) => setTodos(r.lutadores))
      .catch((e) => setErro(mensagemDe(e)));
  }, [api]);

  const visiveis = useMemo(() => {
    const q = normalizarBusca(busca);
    // Quem não pode ser escolhido só aparece quando a busca procura por ele.
    const lista = (todos ?? []).filter((l) => (q ? normalizarBusca(l.nome).includes(q) : !indisponiveis[l.id]));
    // Disponíveis primeiro; quem já está na chave vai para o fim.
    return lista.sort((a, b) => Number(!!indisponiveis[a.id]) - Number(!!indisponiveis[b.id]) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [todos, busca, indisponiveis]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className={`flex-1 min-w-0 h-12 flex items-center gap-2.5 px-3.5 rounded-2xl bg-stone-900 border ${busca ? 'border-red-500' : 'border-stone-700'}`}>
          <IconeBusca className="w-[18px] h-[18px] text-stone-400 shrink-0" />
          <span className="sr-only">Filtrar pelo nome</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar pelo nome"
            className="flex-1 min-w-0 h-11 bg-transparent outline-none text-[15px] placeholder:text-stone-500"
          />
        </label>
        <Botao className="shrink-0" onClick={() => setCadastro(true)}>
          <IconeMais className="w-[18px] h-[18px]" /> Novo
        </Botao>
      </div>

      {!todos && !erro && <Carregando />}
      {erro && <p className="text-sm text-red-300">{erro}</p>}

      {todos && (
        <div className="flex flex-col gap-1.5">
          {visiveis.map((l) => {
            const motivo = indisponiveis[l.id];
            const marcado = selecionados.has(l.id);
            return (
              <LinhaLutador
                key={l.id}
                lutador={l}
                aoAbrir={motivo || (cheio && !marcado) ? undefined : () => aoAlternar(l)}
                acao={
                  motivo ? (
                    <span className="px-2.5 text-xs font-semibold text-stone-500">{motivo}</span>
                  ) : marcado ? (
                    <button
                      onClick={() => aoAlternar(l)}
                      aria-label={`Desmarcar ${l.nome}`}
                      className="h-11 px-3 rounded-xl bg-green-950 border border-green-800 text-green-300 text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                      {rotuloMarcado}
                    </button>
                  ) : (
                    <button
                      onClick={() => aoAlternar(l)}
                      disabled={cheio}
                      aria-label={`Adicionar ${l.nome}`}
                      className="w-11 h-11 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 flex items-center justify-center shrink-0"
                    >
                      <IconeMais />
                    </button>
                  )
                }
              />
            );
          })}
          {visiveis.length === 0 && (
            <button
              onClick={() => setCadastro(true)}
              className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-dashed border-stone-600 text-sm text-stone-200"
            >
              <IconeMais className="w-[18px] h-[18px] text-red-400" />
              {busca.trim()
                ? 'Ninguém com esse nome · cadastrar novo lutador'
                : (todos ?? []).length
                  ? 'Todo mundo já está na chave · cadastrar novo lutador'
                  : 'Nenhum lutador salvo · cadastrar o primeiro'}
            </button>
          )}
        </div>
      )}

      <CadastroLutador
        aberta={cadastro}
        nomeInicial={busca.trim()}
        aoFechar={() => setCadastro(false)}
        aoSalvar={(l, maisUm) => {
          setTodos((t) => [...(t ?? []), l]);
          setBusca('');
          if (!selecionados.has(l.id)) aoAlternar(l);
          if (!maisUm) setCadastro(false);
        }}
      />
    </div>
  );
}
