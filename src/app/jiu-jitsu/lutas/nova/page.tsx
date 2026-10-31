'use client';

/** Tela 2 · Montar chave: lista rápida de alunos salvos, cadastro, inscritos e sorteio. */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { MAX_ATLETAS_CHAVE, type Lutador } from '@/lib/jiu-jitsu/schemas';
import { FichaLutador, LinhaLutador } from '../_components/Lutadores';
import { SeletorLutadores } from '../_components/SeletorLutadores';
import { Aviso, Botao, Rotulo, Tela } from '../_components/ui';
import { lerParametro, mensagemDe, useApi, useExigirLogin } from '../_lib/api';
import { dataCurta } from '../_lib/formato';

export default function MontarChave() {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();

  const [chaveId, setChaveId] = useState<string | null>(null);
  const [nome, setNome] = useState(`Sexta da diversão ${dataCurta(new Date().toISOString())}`);
  const [inscritos, setInscritos] = useState<Lutador[]>([]);
  const [aba, setAba] = useState<'alunos' | 'inscritos'>('alunos');
  const [ficha, setFicha] = useState<Lutador | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sorteando, setSorteando] = useState(false);

  // Continuar uma chave em rascunho (?chave=ID).
  useEffect(() => {
    const id = lerParametro('chave');
    if (!pronto || !id) return;
    (async () => {
      try {
        const { chave } = await api<{ chave: DetalheChave }>(`/chaves/${id}`);
        setChaveId(id);
        setNome(chave.nome);
        const lista = await Promise.all(chave.inscritos.map((lid) => api<{ lutador: Lutador }>(`/lutadores/${lid}`)));
        setInscritos(lista.map((r) => r.lutador));
      } catch (e) {
        setErro(mensagemDe(e));
      }
    })();
  }, [pronto, api]);

  const ordenados = useMemo(() => [...inscritos].sort((a, b) => a.nivelSorteio - b.nivelSorteio), [inscritos]);
  const ids = new Set(inscritos.map((l) => l.id));
  const cheio = inscritos.length >= MAX_ATLETAS_CHAVE;

  const alternar = (l: Lutador) => {
    if (ids.has(l.id)) setInscritos((x) => x.filter((i) => i.id !== l.id));
    else if (!cheio) setInscritos((x) => [...x, l]);
  };
  const atualizar = (l: Lutador) => {
    setInscritos((x) => x.map((i) => (i.id === l.id ? l : i)));
    setFicha(l);
  };

  const sortear = async () => {
    setSorteando(true);
    setErro(null);
    try {
      const corpo = { nome: nome.trim() || 'Chave', inscritos: inscritos.map((l) => l.id) };
      let id = chaveId;
      if (id) await api(`/chaves/${id}`, { method: 'PATCH', body: corpo });
      else {
        id = (await api<{ chave: DetalheChave }>('/chaves', { method: 'POST', body: corpo })).chave.id;
        setChaveId(id);
      }
      await api(`/chaves/${id}/sortear`, { method: 'POST' });
      router.push(`/jiu-jitsu/lutas/${id}`);
    } catch (e) {
      setErro(mensagemDe(e));
      setSorteando(false);
    }
  };

  return (
    <Tela
      titulo="Nova chave"
      subtitulo="Passo 1 de 2 · quem vai lutar"
      voltar="/jiu-jitsu/lutas"
      rodape={
        <Botao className="flex-1 min-h-[52px] text-base" disabled={inscritos.length < 2 || sorteando} onClick={sortear}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          {sorteando ? 'Sorteando…' : inscritos.length < 2 ? 'Inscreva pelo menos 2' : 'Sortear chave'}
        </Botao>
      }
    >
      <div>
        <label htmlFor="jj-nome-chave" className="block text-xs font-medium text-stone-400 mb-1.5">Nome da chave</label>
        <input
          id="jj-nome-chave"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full h-11 px-3.5 rounded-2xl bg-stone-900 border border-stone-700 focus:border-red-500 outline-none"
        />
      </div>

      <div role="tablist" aria-label="Lista" className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-stone-900 border border-stone-800">
        {(['alunos', 'inscritos'] as const).map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={aba === x}
            onClick={() => setAba(x)}
            className={`h-10 rounded-xl text-sm font-semibold ${aba === x ? 'bg-red-600 text-white' : 'text-stone-400'}`}
          >
            {x === 'alunos' ? 'Alunos' : `Inscritos · ${inscritos.length}`}
          </button>
        ))}
      </div>

      {aba === 'alunos' ? (
        <SeletorLutadores selecionados={ids} aoAlternar={alternar} cheio={cheio} rotuloMarcado="Inscrito" />
      ) : (
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <Rotulo>Inscritos · por nível</Rotulo>
            <span className="text-[13px] font-semibold">
              {inscritos.length} <span className="font-normal text-stone-400">de {MAX_ATLETAS_CHAVE}</span>
            </span>
          </div>
          {ordenados.map((l) => (
            <LinhaLutador
              key={l.id}
              lutador={l}
              aoAbrir={() => setFicha(l)}
              acao={
                <button
                  onClick={() => setInscritos((x) => x.filter((i) => i.id !== l.id))}
                  aria-label={`Tirar ${l.nome} da chave`}
                  className="w-9 h-9 rounded-lg text-stone-400 hover:bg-stone-800 flex items-center justify-center shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              }
            />
          ))}
          {inscritos.length === 0 && (
            <p className="p-5 text-center text-sm text-stone-400 rounded-2xl border border-dashed border-stone-700">
              Toque no + dos alunos para inscrever.
            </p>
          )}
        </section>
      )}

      <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-700 text-[13px] text-stone-300 flex flex-col gap-1">
        <Rotulo>Como vai sortear</Rotulo>
        <p>Casamento por nível (faixa, peso, sexo e desempenho nas lutas). Regra especial de posição só na final.</p>
      </div>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <FichaLutador lutador={ficha} aoFechar={() => setFicha(null)} aoAtualizar={atualizar} />
    </Tela>
  );
}
