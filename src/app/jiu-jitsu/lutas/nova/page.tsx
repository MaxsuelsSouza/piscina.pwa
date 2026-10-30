'use client';

/** Tela 2 · Montar chave: busca de alunos salvos, cadastro, inscritos e sorteio. */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { MAX_ATLETAS_CHAVE, type Lutador } from '@/lib/jiu-jitsu/schemas';
import { CadastroLutador, FichaLutador, LinhaLutador } from '../_components/Lutadores';
import { Aviso, Botao, IconeBusca, IconeMais, Rotulo, Tela } from '../_components/ui';
import { lerParametro, mensagemDe, useApi, useExigirLogin } from '../_lib/api';
import { dataCurta } from '../_lib/formato';

export default function MontarChave() {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();

  const [chaveId, setChaveId] = useState<string | null>(null);
  const [nome, setNome] = useState(`Sexta da diversão ${dataCurta(new Date().toISOString())}`);
  const [inscritos, setInscritos] = useState<Lutador[]>([]);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Lutador[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cadastroAberto, setCadastroAberto] = useState(false);
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

  // Busca com pequena espera para não chamar a API a cada letra.
  useEffect(() => {
    const q = busca.trim();
    if (!q || !pronto) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      api<{ lutadores: Lutador[] }>(`/lutadores?q=${encodeURIComponent(q)}`)
        .then((r) => setResultados(r.lutadores.slice(0, 5)))
        .catch((e) => setErro(mensagemDe(e)))
        .finally(() => setBuscando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [busca, pronto, api]);

  const ordenados = useMemo(() => [...inscritos].sort((a, b) => a.nivelSorteio - b.nivelSorteio), [inscritos]);
  const ids = new Set(inscritos.map((l) => l.id));
  const cheio = inscritos.length >= MAX_ATLETAS_CHAVE;

  const inscrever = (l: Lutador) => {
    if (ids.has(l.id) || cheio) return;
    setInscritos((x) => [...x, l]);
    setBusca('');
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

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <label className={`flex-1 min-w-0 h-12 flex items-center gap-2.5 px-3.5 rounded-2xl bg-stone-900 border ${busca ? 'border-red-500' : 'border-stone-700'}`}>
            <IconeBusca className="w-[18px] h-[18px] text-stone-400 shrink-0" />
            <span className="sr-only">Buscar aluno pelo nome</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno pelo nome"
              className="flex-1 min-w-0 h-11 bg-transparent outline-none text-[15px] placeholder:text-stone-500"
            />
          </label>
          <Botao className="shrink-0" onClick={() => setCadastroAberto(true)}>
            <IconeMais className="w-[18px] h-[18px]" /> Novo
          </Botao>
        </div>

        {busca.trim() && (
          <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-stone-900 border border-stone-700">
            <span className="px-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">
              {cheio ? `Chave cheia (${MAX_ATLETAS_CHAVE} de ${MAX_ATLETAS_CHAVE})` : buscando ? 'Buscando…' : `${resultados.length} encontrado(s)`}
            </span>
            {resultados.map((l) => (
              <LinhaLutador
                key={l.id}
                lutador={l}
                acao={
                  ids.has(l.id) ? (
                    <span className="px-2.5 text-xs font-semibold text-green-300">Inscrito</span>
                  ) : (
                    <button
                      onClick={() => inscrever(l)}
                      disabled={cheio}
                      aria-label={`Inscrever ${l.nome}`}
                      className="w-11 h-11 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 flex items-center justify-center shrink-0"
                    >
                      <IconeMais />
                    </button>
                  )
                }
              />
            ))}
            {!buscando && resultados.length === 0 && (
              <button
                onClick={() => setCadastroAberto(true)}
                className="flex items-center gap-2.5 h-12 px-3 rounded-xl border border-dashed border-stone-600 text-sm text-stone-200"
              >
                <IconeMais className="w-[18px] h-[18px] text-red-400" />
                Ninguém com esse nome · cadastrar novo lutador
              </button>
            )}
          </div>
        )}
      </div>

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
            Busque um aluno ou cadastre um lutador novo.
          </p>
        )}
      </section>

      <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-700 text-[13px] text-stone-300 flex flex-col gap-1">
        <Rotulo>Como vai sortear</Rotulo>
        <p>Casamento por nível (faixa, peso, sexo e desempenho nas lutas). Regra especial de posição só na final.</p>
      </div>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <CadastroLutador
        aberta={cadastroAberto}
        nomeInicial={busca.trim()}
        aoFechar={() => setCadastroAberto(false)}
        aoSalvar={(l, maisUm) => {
          inscrever(l);
          if (!maisUm) setCadastroAberto(false);
        }}
      />
      <FichaLutador lutador={ficha} aoFechar={() => setFicha(null)} aoAtualizar={atualizar} />
    </Tela>
  );
}
