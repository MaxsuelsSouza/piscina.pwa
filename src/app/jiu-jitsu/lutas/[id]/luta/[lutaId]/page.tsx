'use client';

/**
 * Tela 4 · Definir vencedor. Também responde desafio de entrada, dá W.O. e
 * desfaz resultado.
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { Aviso, Botao, Carregando, Folha, Tela } from '../../../_components/ui';
import { mensagemDe, useApi, useExigirLogin } from '../../../_lib/api';
import { infoAtleta, METODO_LABEL, nivelTxt } from '../../../_lib/formato';

type Metodo = 'finalizacao' | 'decisao';

export default function LutaPage({ params }: { params: { id: string; lutaId: string } }) {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();
  const [det, setDet] = useState<DetalheChave | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [vencedor, setVencedor] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<Metodo>('finalizacao');
  const [ocupado, setOcupado] = useState(false);
  const [folhaWO, setFolhaWO] = useState(false);
  const [folhaDesfazer, setFolhaDesfazer] = useState(false);

  const voltar = `/jiu-jitsu/lutas/${params.id}`;

  const carregar = useCallback(async () => {
    try {
      setDet((await api<{ chave: DetalheChave }>(`/chaves/${params.id}`)).chave);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, [api, params.id]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const agir = async (fn: () => Promise<unknown>, depois: 'voltar' | 'recarregar' = 'voltar') => {
    setOcupado(true);
    setErro(null);
    try {
      await fn();
      if (depois === 'voltar') router.push(voltar);
      else await carregar();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  };

  if (!det) {
    return (
      <Tela titulo="Luta" voltar={voltar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />}
      </Tela>
    );
  }

  const luta = det.chave?.lutas.find((l) => l.id === params.lutaId);
  if (!luta) {
    return (
      <Tela titulo="Luta" voltar={voltar}>
        <Aviso tipo="erro">Luta não encontrada.</Aviso>
      </Tela>
    );
  }

  const atleta = (id: string | null) => (id ? det.atletas.find((a) => a.id === id) : undefined);
  const azul = atleta(luta.azul);
  const branco = atleta(luta.branco);
  const rodada = det.rodadas.find((r) => r.numero === luta.rodada)?.nome ?? '';
  const titulo = luta.tipo === 'desafio' ? 'Desafio de entrada' : luta.final ? 'Final' : `${rodada}${luta.lado ? ` · lado ${luta.lado}` : ''}`;
  const desvantagem = atleta(luta.emDesvantagem ?? null);
  const adversarioDaDesvantagem = desvantagem && (desvantagem.id === azul?.id ? branco : azul);

  // ── Desafio esperando resposta ──
  if (luta.status === 'proposta') {
    return (
      <Tela titulo="Desafio de entrada" subtitulo={`${rodada} · esperando resposta`} voltar={voltar}>
        <div className="p-4 rounded-2xl bg-stone-900 border border-amber-700 flex flex-col gap-2">
          <p className="text-lg">
            <strong>{branco?.nome}</strong> chegou atrasado e desafia <strong>{azul?.nome}</strong> pela vaga dele.
          </p>
          <p className="text-sm text-stone-300">
            Se {azul?.nome} aceitar, {branco?.nome} começa por baixo, com {azul?.nome} nos 100 kg. Quem vencer fica com a vaga.
          </p>
          <p className="text-sm text-stone-400">Se recusar, {branco?.nome} vai para a repescagem.</p>
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="grid grid-cols-2 gap-2.5">
          <Botao variante="secundario" disabled={ocupado} onClick={() => agir(() => api(`/chaves/${det.id}/lutas/${luta.id}/desafio`, { method: 'POST', body: { aceitar: false } }))}>
            {azul?.nome} recusa
          </Botao>
          <Botao variante="sucesso" disabled={ocupado} onClick={() => agir(() => api(`/chaves/${det.id}/lutas/${luta.id}/desafio`, { method: 'POST', body: { aceitar: true } }), 'recarregar')}>
            {azul?.nome} aceita
          </Botao>
        </div>
      </Tela>
    );
  }

  // ── Luta já decidida ──
  if (luta.status === 'finalizada' || luta.status === 'bye') {
    const v = atleta(luta.vencedor);
    return (
      <Tela titulo={titulo} subtitulo="Luta encerrada" voltar={voltar}>
        <div className="p-5 rounded-2xl bg-stone-900 border border-green-900 flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-green-300">Vencedor</span>
          <span className="text-2xl font-extrabold">{v?.nome}</span>
          <span className="text-sm text-stone-400">
            {luta.status === 'bye' ? 'Passou direto' : `${METODO_LABEL[luta.metodo ?? 'decisao']} · contra ${atleta(luta.vencedor === luta.azul ? luta.branco : luta.azul)?.nome}`}
          </span>
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {luta.status === 'finalizada' && (
          <Botao variante="secundario" onClick={() => setFolhaDesfazer(true)}>Desfazer resultado</Botao>
        )}
        <Folha aberta={folhaDesfazer} aoFechar={() => setFolhaDesfazer(false)} titulo="Desfazer o resultado?" subtitulo="A luta volta para a fila e o desempenho dos dois volta ao que era.">
          <div className="grid grid-cols-2 gap-2.5">
            <Botao variante="secundario" onClick={() => setFolhaDesfazer(false)}>Cancelar</Botao>
            <Botao disabled={ocupado} onClick={() => agir(() => api(`/chaves/${det.id}/lutas/${luta.id}/resultado`, { method: 'DELETE' }), 'recarregar').then(() => setFolhaDesfazer(false))}>
              Desfazer
            </Botao>
          </div>
        </Folha>
      </Tela>
    );
  }

  if (luta.status !== 'pronta' && luta.status !== 'em_andamento') {
    return (
      <Tela titulo={titulo} voltar={voltar}>
        <Aviso>Essa luta ainda espera o resultado da rodada anterior.</Aviso>
      </Tela>
    );
  }

  // ── Escolher o vencedor ──
  const cartao = (a: typeof azul, cor: 'azul' | 'branco') => {
    if (!a) return null;
    const marcado = vencedor === a.id;
    return (
      <button
        type="button"
        aria-pressed={marcado}
        onClick={() => setVencedor(a.id)}
        className={`flex items-center gap-4 px-4 py-5 rounded-[22px] bg-stone-900 text-left border-2 transition ${marcado ? 'border-red-500' : 'border-stone-800'}`}
      >
        <span className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${cor === 'azul' ? 'bg-blue-600' : 'bg-stone-100 text-stone-900'}`}>
          {a.nome.charAt(0)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xl font-bold truncate">{a.nome}</span>
          <span className="block text-[13px] text-stone-400">{infoAtleta(a)} · nível {nivelTxt(a.nivel)}</span>
        </span>
        <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${marcado ? 'bg-red-500' : 'border-2 border-stone-600'}`}>
          {marcado && (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
          )}
        </span>
      </button>
    );
  };

  const nomeVencedor = atleta(vencedor)?.nome;

  return (
    <Tela
      titulo={titulo}
      subtitulo={luta.status === 'em_andamento' ? 'Em andamento · quem venceu?' : 'Quem venceu?'}
      voltar={voltar}
      rodape={
        <Botao
          className="flex-1 min-h-[52px] text-base"
          disabled={!vencedor || ocupado}
          onClick={() => agir(() => api(`/chaves/${det.id}/lutas/${luta.id}/resultado`, { method: 'POST', body: { vencedor, metodo } }))}
        >
          {vencedor ? `Confirmar: ${nomeVencedor} avança` : 'Escolha o vencedor'}
        </Botao>
      }
    >
      {desvantagem && adversarioDaDesvantagem && (
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-amber-700 text-sm">
          <span className="block text-xs font-bold uppercase tracking-[0.12em] text-amber-300 mb-1">Entrada atrasada</span>
          <strong>{desvantagem.nome}</strong> começa por baixo, com <strong>{adversarioDaDesvantagem.nome}</strong> nos 100 kg.
        </div>
      )}
      {luta.final && det.regraFinal && (
        <div className="p-3.5 rounded-2xl bg-stone-900 border border-amber-700 text-sm">
          <span className="block text-xs font-bold uppercase tracking-[0.12em] text-amber-300 mb-1">Regra especial</span>
          {det.regraFinal.texto}
        </div>
      )}

      {cartao(azul, 'azul')}
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-stone-800" />
        <span className="text-[13px] font-extrabold tracking-[0.1em] text-stone-400">VS</span>
        <span className="flex-1 h-px bg-stone-800" />
      </div>
      {cartao(branco, 'branco')}

      <fieldset className="flex flex-col gap-2.5 mt-2">
        <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2.5">Como venceu?</legend>
        <div className="flex gap-2">
          {(['finalizacao', 'decisao'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metodo === m}
              onClick={() => setMetodo(m)}
              className={`flex-1 h-12 rounded-[14px] text-[15px] font-semibold border ${metodo === m ? 'border-red-500 bg-red-950' : 'border-stone-700 bg-stone-900 text-stone-200'}`}
            >
              {METODO_LABEL[m]}
            </button>
          ))}
        </div>
      </fieldset>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {luta.status === 'pronta' && (
        <button onClick={() => setFolhaWO(true)} className="self-center text-sm text-stone-400 underline underline-offset-4 py-2">
          Alguém não apareceu? Dar W.O.
        </button>
      )}

      <Folha aberta={folhaWO} aoFechar={() => setFolhaWO(false)} titulo="Quem não apareceu?" subtitulo="O outro avança sem luta. W.O. não conta para o ranking nem para o desempenho.">
        {[azul, branco].map((a) =>
          a ? (
            <Botao
              key={a.id}
              variante="secundario"
              disabled={ocupado}
              onClick={() => agir(() => api(`/chaves/${det.id}/lutas/${luta.id}/wo`, { method: 'POST', body: { ausente: a.id } }))}
            >
              {a.nome} faltou
            </Botao>
          ) : null
        )}
        <p className="text-xs text-stone-400">Para pôr alguém no lugar de quem saiu, use “+ Chegou” na chave e escolha “Substituir”.</p>
      </Folha>
    </Tela>
  );
}
