'use client';

/** Tela 3 · Chave sorteada: chave em colunas, lista, final, repescagem e ida ao tatame. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Luta } from '@/lib/jiu-jitsu/chave';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { Colunas, LutaCaixa, type Nomes } from '../_components/LutaCaixa';
import { Aviso, Botao, Carregando, Folha, IconeTrofeu, Rotulo, Tela } from '../_components/ui';
import { VsFaixas } from '../_components/VsFaixas';
import { mensagemDe, useApi, useExigirLogin } from '../_lib/api';
import { infoAtleta, nivelTxt } from '../_lib/formato';

const STATUS_TXT = { rascunho: 'montando', sorteada: 'sorteada', em_andamento: 'em andamento', encerrada: 'encerrada' } as const;

export default function ChavePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();
  const [det, setDet] = useState<DetalheChave | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [rodada, setRodada] = useState<number | null>(null);
  const [lado, setLado] = useState<'A' | 'B'>('A');
  const [vista, setVista] = useState<'chave' | 'lista'>('chave');
  const [confirmarTatame, setConfirmarTatame] = useState(false);
  const [confirmarSorteio, setConfirmarSorteio] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { chave } = await api<{ chave: DetalheChave }>(`/chaves/${params.id}`);
      if (chave.status === 'rascunho') return router.replace(`/jiu-jitsu/lutas/nova?chave=${params.id}`);
      setDet(chave);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, [api, params.id, router]);

  useEffect(() => {
    if (pronto) carregar();
  }, [pronto, carregar]);

  const nomes: Nomes = useMemo(
    () => Object.fromEntries((det?.atletas ?? []).map((a) => [a.id, { nome: a.nome, nivel: a.nivel, atrasado: a.atrasado }])),
    [det]
  );

  if (!det) {
    return (
      <Tela titulo="Chave" voltar="/jiu-jitsu/lutas">
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />}
      </Tela>
    );
  }

  const chave = det.chave!;
  const eliminatoria = chave.formato === 'eliminatoria';
  const total = chave.totalRodadas;
  // Rodada exibida: a escolhida, ou a primeira com luta pendente.
  const pendentes = chave.lutas.filter((l) => ['pronta', 'em_andamento', 'aguardando', 'proposta'].includes(l.status));
  const rodadaAtual = rodada ?? (pendentes.length ? Math.min(...pendentes.map((l) => l.rodada)) : total);
  const ehFinal = eliminatoria && rodadaAtual === total;
  const hrefDe = (l: Luta) =>
    ['pronta', 'em_andamento', 'finalizada', 'proposta'].includes(l.status) ? `/jiu-jitsu/lutas/${det.id}/luta/${l.id}` : undefined;

  const normais = chave.lutas.filter((l) => l.tipo !== 'desafio');
  const esquerda = normais.filter((l) => l.rodada === rodadaAtual && l.lado === lado).sort((a, b) => a.ordem - b.ordem);
  const direita =
    rodadaAtual + 1 === total
      ? normais.filter((l) => l.final)
      : normais.filter((l) => l.rodada === rodadaAtual + 1 && l.lado === lado).sort((a, b) => a.ordem - b.ordem);
  const desafios = chave.lutas.filter((l) => l.tipo === 'desafio' && l.status !== 'recusada' && l.status !== 'finalizada');
  const final = chave.lutas.find((l) => l.final);
  const fila = det.fila.map((id) => chave.lutas.find((l) => l.id === id)!).filter(Boolean);
  const nomeRodada = (n: number) => det.rodadas.find((r) => r.numero === n)?.nome ?? `Rodada ${n}`;
  const faixaNiveis = (l: 'A' | 'B') => {
    const ids = normais.filter((x) => x.rodada === 1 && x.lado === l).flatMap((x) => [x.azul, x.branco]).filter((x): x is string => !!x);
    const niveis = ids.map((i) => nomes[i]?.nivel ?? 0);
    return niveis.length ? `níveis ${nivelTxt(Math.min(...niveis))} a ${nivelTxt(Math.max(...niveis))}` : '';
  };

  const sortearDeNovo = async () => {
    setOcupado(true);
    try {
      await api(`/chaves/${det.id}/sortear`, { method: 'POST' });
      setConfirmarSorteio(false);
      setRodada(null);
      await carregar();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  };

  const excluirChave = async () => {
    setOcupado(true);
    try {
      await api(`/chaves/${det.id}`, { method: 'DELETE' });
      router.replace('/jiu-jitsu/lutas');
    } catch (e) {
      setErro(mensagemDe(e));
      setConfirmarExclusao(false);
      setOcupado(false);
    }
  };

  const levarAoTatame = async () => {
    setOcupado(true);
    try {
      // Chama as primeiras lutas da fila para as áreas livres; elas esperam o play.
      const { tatame } = await api<{ tatame: { areas: { area: number; fase: string }[] } }>(`/chaves/${det.id}/tatame`);
      const livres = tatame.areas.filter((a) => a.fase === 'livre').map((a) => a.area);
      for (const [i, area] of livres.entries()) {
        const luta = fila[i];
        if (!luta) break;
        await api(`/chaves/${det.id}/lutas/${luta.id}/chamar`, { method: 'POST', body: { area } });
      }
      router.push(`/jiu-jitsu/lutas/${det.id}/tatame`);
    } catch (e) {
      setErro(mensagemDe(e));
      setOcupado(false);
    }
  };

  const outraChave =
    det.tipo === 'principal'
      ? det.repescagemId && { href: `/jiu-jitsu/lutas/${det.repescagemId}`, txt: 'Repescagem' }
      : det.principalId && { href: `/jiu-jitsu/lutas/${det.principalId}`, txt: 'Absoluto' };

  return (
    <Tela
      titulo={det.nome}
      subtitulo={`${det.atletas.length} atletas · ${STATUS_TXT[det.status]}`}
      voltar="/jiu-jitsu/lutas"
      direita={
        <div className="flex gap-2">
          {det.status === 'sorteada' && det.tipo === 'principal' && (
            <button
              onClick={() => setConfirmarExclusao(true)}
              aria-label="Excluir chave"
              className="w-11 h-11 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-red-300 flex items-center justify-center"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
              </svg>
            </button>
          )}
          {det.status !== 'encerrada' && (
            <Link
              href={`/jiu-jitsu/lutas/${det.id}/chegou`}
              className="h-11 px-3 rounded-full bg-red-600 hover:bg-red-500 flex items-center gap-1.5 text-[13px] font-bold"
            >
              + Chegou
            </Link>
          )}
          {eliminatoria && (
            <button
              onClick={() => setVista(vista === 'chave' ? 'lista' : 'chave')}
              aria-label={vista === 'chave' ? 'Ver em lista' : 'Ver em chave'}
              className="w-11 h-11 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {vista === 'chave' ? <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /> : <path d="M3 5h5v4H3zM3 15h5v4H3zM8 7h3v10H8M11 12h4M15 10h6v4h-6z" />}
              </svg>
            </button>
          )}
        </div>
      }
      rodape={
        det.status === 'encerrada' ? (
          <Link href={`/jiu-jitsu/lutas/${det.id}/resultado`} className="flex-1 min-h-[52px] rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2 font-semibold">
            <IconeTrofeu /> Ver resultado da noite
          </Link>
        ) : det.status === 'sorteada' ? (
          <>
            <Botao variante="secundario" className="flex-1" onClick={() => setConfirmarSorteio(true)}>
              Sortear de novo
            </Botao>
            <Botao className="flex-[1.4]" onClick={() => setConfirmarTatame(true)} disabled={!fila.length}>
              Levar ao tatame
            </Botao>
          </>
        ) : (
          <>
            {fila[0] && (
              <Link href={`/jiu-jitsu/lutas/${det.id}/luta/${fila[0].id}`} className="flex-1 min-h-[48px] rounded-2xl border border-stone-700 hover:bg-stone-800 flex items-center justify-center text-[15px]">
                Próxima luta
              </Link>
            )}
            <Link href={`/jiu-jitsu/lutas/${det.id}/tatame`} className="flex-[1.4] min-h-[48px] rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center font-semibold">
              Tatame ao vivo
            </Link>
          </>
        )
      }
    >
      {outraChave && (
        <div role="tablist" aria-label="Chaves da noite" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-900">
          {det.tipo === 'principal' ? (
            <>
              <span role="tab" aria-selected="true" className="h-8 rounded-lg bg-stone-700 flex items-center justify-center text-[13px] font-bold">Absoluto</span>
              <Link role="tab" aria-selected="false" href={outraChave.href} className="h-8 rounded-lg flex items-center justify-center text-[13px] text-stone-400">Repescagem</Link>
            </>
          ) : (
            <>
              <Link role="tab" aria-selected="false" href={outraChave.href} className="h-8 rounded-lg flex items-center justify-center text-[13px] text-stone-400">Absoluto</Link>
              <span role="tab" aria-selected="true" className="h-8 rounded-lg bg-stone-700 flex items-center justify-center text-[13px] font-bold">Repescagem</span>
            </>
          )}
        </div>
      )}
      {det.tipo === 'principal' && !det.repescagemId && det.filaRepescagem.length > 0 && (
        <Aviso>
          {det.filaRepescagem.length} atrasado(s) esperando a repescagem, que é sorteada quando a 1ª rodada terminar.
        </Aviso>
      )}
      {chave.avisos.map((a) => (
        <Aviso key={a}>{a}</Aviso>
      ))}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {desafios.length > 0 && (
        <section className="flex flex-col gap-2">
          <Rotulo>Desafios de entrada</Rotulo>
          {desafios.map((d) => (
            <Link key={d.id} href={`/jiu-jitsu/lutas/${det.id}/luta/${d.id}`} className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900 border border-amber-700">
              <span className="flex-1 text-sm">
                <strong>{nomes[d.branco!]?.nome}</strong> desafia <strong>{nomes[d.azul!]?.nome ?? 'a definir'}</strong>
                <span className="block text-xs text-stone-400">{nomeRodada(d.rodada)} · atrasado começa por baixo, com o adversário nos 100 kg</span>
              </span>
              <span className={`text-xs font-bold ${d.status === 'proposta' ? 'text-amber-300' : 'text-red-300'}`}>
                {d.status === 'proposta' ? 'Responder' : 'Pronta'}
              </span>
            </Link>
          ))}
        </section>
      )}

      {eliminatoria ? (
        <>
          <div role="tablist" aria-label="Rodadas" className="flex gap-1 p-1 rounded-xl bg-stone-900 overflow-x-auto">
            {det.rodadas.map((r) => (
              <button
                key={r.numero}
                role="tab"
                aria-selected={r.numero === rodadaAtual}
                onClick={() => setRodada(r.numero)}
                className={`flex-1 min-w-[64px] h-[34px] rounded-lg text-xs whitespace-nowrap ${r.numero === rodadaAtual ? 'bg-red-600 font-bold' : 'text-stone-400'}`}
              >
                {r.nome}
              </button>
            ))}
          </div>

          {!ehFinal && (
            <div role="tablist" aria-label="Lado da chave" className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((l) => (
                <button
                  key={l}
                  role="tab"
                  aria-selected={lado === l}
                  onClick={() => setLado(l)}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center ${lado === l ? 'border-2 border-red-500 bg-stone-900' : 'border border-stone-800 bg-stone-950'}`}
                >
                  <span className="text-sm font-bold">Lado {l}</span>
                  <span className="text-[11px] text-stone-400">{faixaNiveis(l)}</span>
                </button>
              ))}
            </div>
          )}

          {ehFinal && final ? (
            <section className="flex flex-col gap-3">
              <Link href={hrefDe(final) ?? '#'} className="relative grid grid-cols-2 h-[150px] rounded-[18px] overflow-hidden border border-dashed border-amber-700">
                <div className="bg-blue-600 flex flex-col items-center justify-center gap-1 pr-14 pl-2">
                  <span className="text-[11px] font-bold tracking-[0.1em] text-blue-100">AZUL</span>
                  <span className="text-lg font-extrabold text-center">{final.azul ? nomes[final.azul]?.nome : 'Campeão lado A'}</span>
                </div>
                <div className="bg-stone-100 text-stone-900 flex flex-col items-center justify-center gap-1 pl-14 pr-2">
                  <span className="text-[11px] font-bold tracking-[0.1em] text-stone-600">BRANCO</span>
                  <span className="text-lg font-extrabold text-center">{final.branco ? nomes[final.branco]?.nome : 'Campeão lado B'}</span>
                </div>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <VsFaixas largura={96} />
                </span>
              </Link>
              {det.regraFinal && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-stone-900 border border-amber-700">
                  <span className="w-10 h-10 rounded-xl bg-amber-950 text-amber-300 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300">Regra especial</span>
                    <span className="block text-[15px] font-bold">{det.regraFinal.texto}</span>
                  </span>
                </div>
              )}
            </section>
          ) : vista === 'chave' ? (
            <Colunas
              esquerda={esquerda}
              direita={direita}
              tituloEsq={`${nomeRodada(rodadaAtual)} · lado ${lado}`}
              tituloDir={nomeRodada(rodadaAtual + 1)}
              nomes={nomes}
              hrefDe={hrefDe}
            />
          ) : (
            <ListaLutas lutas={esquerda} det={det} nomes={nomes} hrefDe={hrefDe} />
          )}
        </>
      ) : (
        <section className="flex flex-col gap-2">
          <Rotulo>{chave.formato === 'melhor-de-3' ? 'Melhor de três' : 'Chave de três'}</Rotulo>
          {chave.lutas.map((l) => (
            <div key={l.id} className="flex flex-col gap-1">
              <span className="text-xs text-stone-400">{nomeRodada(l.rodada)}{l.status === 'cancelada' ? ' · cancelada' : ''}</span>
              <LutaCaixa luta={l} nomes={nomes} href={hrefDe(l)} />
            </div>
          ))}
        </section>
      )}

      <Folha aberta={confirmarTatame} aoFechar={() => setConfirmarTatame(false)} titulo="Iniciar as lutas?" subtitulo="As primeiras lutas vão para as áreas e esperam o seu play.">
        <div className="rounded-2xl bg-stone-950 border border-stone-800 divide-y divide-stone-800">
          {fila.slice(0, det.tatame.areas).map((l, i) => (
            <div key={l.id} className="flex items-center gap-2.5 px-3.5 py-3">
              <span className="w-14 text-xs font-bold text-stone-400">Área {i + 1}</span>
              <span className="flex-1 text-sm font-semibold">
                {nomes[l.azul!]?.nome} <span className="text-stone-400 font-normal">×</span> {nomes[l.branco!]?.nome}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[13px] text-stone-300">
          <span>Na fila: {Math.max(0, fila.length - det.tatame.areas)} luta(s)</span>
          <span>{Math.round(det.tatame.duracaoSeg / 60)} min por luta</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Botao variante="secundario" onClick={() => setConfirmarTatame(false)}>Agora não</Botao>
          <Botao variante="sucesso" onClick={levarAoTatame} disabled={ocupado}>{ocupado ? 'Chamando…' : 'Ir para o tatame'}</Botao>
        </div>
      </Folha>

      <Folha aberta={confirmarSorteio} aoFechar={() => setConfirmarSorteio(false)} titulo="Sortear de novo?" subtitulo="Atletas de nível parecido podem trocar de adversário.">
        <div className="grid grid-cols-2 gap-2.5">
          <Botao variante="secundario" onClick={() => setConfirmarSorteio(false)}>Cancelar</Botao>
          <Botao onClick={sortearDeNovo} disabled={ocupado}>{ocupado ? 'Sorteando…' : 'Sortear'}</Botao>
        </div>
      </Folha>

      <Folha aberta={confirmarExclusao} aoFechar={() => setConfirmarExclusao(false)} titulo="Excluir a chave?" subtitulo="Nenhuma luta começou. O sorteio some; os lutadores continuam salvos.">
        <div className="grid grid-cols-2 gap-2.5">
          <Botao variante="secundario" onClick={() => setConfirmarExclusao(false)}>Cancelar</Botao>
          <Botao onClick={excluirChave} disabled={ocupado}>{ocupado ? 'Excluindo…' : 'Excluir'}</Botao>
        </div>
      </Folha>
    </Tela>
  );
}

function ListaLutas({ lutas, det, nomes, hrefDe }: { lutas: Luta[]; det: DetalheChave; nomes: Nomes; hrefDe: (l: Luta) => string | undefined }) {
  const atleta = (id: string | null) => (id ? det.atletas.find((a) => a.id === id) : undefined);
  return (
    <div className="flex flex-col gap-2">
      {lutas.map((l) => {
        const a = atleta(l.azul);
        const b = atleta(l.branco);
        const conteudo = (
          <>
            {[a, b].map((x, i) => (
              <span key={i} className="flex items-center gap-2.5 px-3 py-1.5">
                <span aria-hidden="true" className={`w-1 h-7 rounded-sm ${i === 0 ? 'bg-blue-600' : 'bg-stone-100'}`} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">{x ? x.nome : l.status === 'bye' && i === 1 ? 'passa direto' : 'a definir'}</span>
                  {x && <span className="block text-xs text-stone-400">{infoAtleta(x)}</span>}
                </span>
                {x && <span className="text-[13px] font-bold text-amber-400">{nivelTxt(x.nivel)}</span>}
              </span>
            ))}
            <span className="px-3 py-2 border-t border-stone-800 text-xs text-stone-300">
              {l.status === 'bye'
                ? 'Passa direto para a próxima rodada'
                : a && b
                  ? `Diferença de nível ${nivelTxt(Math.abs(a.nivel - b.nivel))}${l.status === 'finalizada' ? ` · venceu ${nomes[l.vencedor!]?.nome}` : ''}`
                  : 'Aguardando a rodada anterior'}
            </span>
          </>
        );
        const href = hrefDe(l);
        const classe = 'flex flex-col rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden';
        return href ? (
          <Link key={l.id} href={href} className={`${classe} hover:bg-stone-800`}>{conteudo}</Link>
        ) : (
          <div key={l.id} className={classe}>{conteudo}</div>
        );
      })}
    </div>
  );
}
