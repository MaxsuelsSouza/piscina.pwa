'use client';

/**
 * Tela 4b · Tatame ao vivo.
 *
 * O tempo de cada área é calculado a partir do horário salvo no servidor
 * (com correção do relógio do celular), então a tela pode apagar ou o app
 * fechar sem perder o tempo. Quando o tempo acaba: vibra, apita, o card
 * pisca e se enche de verde, e aparece a escolha do vencedor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { restanteMs, type EstadoArea, type EstadoTatame } from '@/lib/jiu-jitsu/tatame';
import { Aviso, Botao, Carregando, Folha, IconeMais, IconeTrofeu, Tela } from '../../_components/ui';
import { VsFaixas } from '../../_components/VsFaixas';
import { mensagemDe, useApi, useExigirLogin } from '../../_lib/api';
import { METODO_LABEL, tempoTxt } from '../../_lib/formato';

type Metodo = 'finalizacao' | 'decisao';
/** Fase local de uma luta que terminou no tatame, antes de registrar o vencedor. */
type FimLocal = { fase: 'acabou' | 'escolher'; motivo: 'TEMPO!' | 'FINALIZOU!' };

const ATUALIZAR_A_CADA_MS = 5000;

export default function TatamePage({ params }: { params: { id: string } }) {
  const { pronto } = useExigirLogin();
  const api = useApi();
  const voltar = `/jiu-jitsu/lutas/${params.id}`;

  const [estado, setEstado] = useState<EstadoTatame | null>(null);
  const [det, setDet] = useState<DetalheChave | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [fins, setFins] = useState<Record<string, FimLocal>>({});
  const [confirmar, setConfirmar] = useState<{ lutaId: string; vencedor: string; nome: string; perdedor: string; area: number; cor: 'azul' | 'branco'; metodo: Metodo } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const offset = useRef(0); // relógio do servidor - relógio do celular
  const avisados = useRef(new Set<string>());

  const carregar = useCallback(async () => {
    try {
      const [{ tatame }, { chave }] = await Promise.all([
        api<{ tatame: EstadoTatame }>(`/chaves/${params.id}/tatame`),
        api<{ chave: DetalheChave }>(`/chaves/${params.id}`),
      ]);
      offset.current = new Date(tatame.agora).getTime() - Date.now();
      setEstado(tatame);
      setDet(chave);
      setErro(null);
    } catch (e) {
      setErro(mensagemDe(e));
    }
  }, [api, params.id]);

  useEffect(() => {
    if (!pronto) return;
    carregar();
    const t = setInterval(carregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(t);
  }, [pronto, carregar]);

  // Relógio local para animar o cronômetro.
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Mantém a tela acesa enquanto o tatame estiver aberto (quando o navegador permite).
  useEffect(() => {
    let trava: { release: () => Promise<void> } | null = null;
    const pedir = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
        if (wl && document.visibilityState === 'visible') trava = await wl.request('screen');
      } catch {
        // sem suporte ou negado: segue sem travar a tela
      }
    };
    pedir();
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') {
        pedir();
        carregar();
      }
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar);
      trava?.release().catch(() => undefined);
    };
  }, [carregar]);

  const agoraServidor = new Date(agora + offset.current).toISOString();

  // Detecta tempo esgotado: avisa uma vez por luta e dispara a animação.
  useEffect(() => {
    if (!estado) return;
    for (const a of estado.areas) {
      if (!a.lutaId || !a.cronometro?.iniciadoEm || a.cronometro.pausadoEm) continue;
      if (restanteMs(a.cronometro, agoraServidor) > 0 || fins[a.lutaId]) continue;
      if (!avisados.current.has(a.lutaId)) {
        avisados.current.add(a.lutaId);
        avisar(a.area);
      }
      encerrarLocal(a.lutaId, 'TEMPO!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agora, estado]);

  function encerrarLocal(lutaId: string, motivo: FimLocal['motivo']) {
    setFins((f) => ({ ...f, [lutaId]: { fase: 'acabou', motivo } }));
    setTimeout(() => setFins((f) => (f[lutaId] ? { ...f, [lutaId]: { ...f[lutaId], fase: 'escolher' } } : f)), 1900);
  }

  const agir = async (fn: () => Promise<unknown>) => {
    setOcupado(true);
    try {
      await fn();
      await carregar();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  };

  const finalizou = (a: EstadoArea) =>
    agir(async () => {
      // Pausa para o tempo da luta ficar certo enquanto você escolhe o vencedor.
      if (a.cronometro && !a.cronometro.pausadoEm) {
        await api(`/chaves/${params.id}/lutas/${a.lutaId}/cronometro`, { method: 'POST', body: { acao: 'pausar' } });
      }
      encerrarLocal(a.lutaId!, 'FINALIZOU!');
    });

  const registrar = async () => {
    if (!confirmar) return;
    const { lutaId, vencedor, metodo } = confirmar;
    await agir(() => api(`/chaves/${params.id}/lutas/${lutaId}/resultado`, { method: 'POST', body: { vencedor, metodo } }));
    setFins((f) => {
      const { [lutaId]: _, ...resto } = f;
      return resto;
    });
    setConfirmar(null);
  };

  if (!estado || !det) {
    return (
      <Tela titulo="Tatame ao vivo" voltar={voltar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />}
      </Tela>
    );
  }

  const rolando = estado.areas.filter((a) => a.fase === 'rodando' || a.fase === 'pausada' || a.fase === 'tempo_esgotado').length;
  const livres = estado.areas.filter((a) => a.fase === 'livre');
  const proxima = estado.fila[0];
  const duracaoMin = Math.round(estado.config.duracaoSeg / 60);

  return (
    <Tela
      titulo="Tatame ao vivo"
      subtitulo={`${det.nome} · ${estado.config.areas} áreas · ${duracaoMin} min`}
      voltar={voltar}
      direita={
        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-900 text-xs font-semibold text-red-300">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-[jjPiscar_1.2s_infinite]" />
          {rolando} rolando
        </span>
      }
    >
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {estado.areas.map((a) => {
        const fim = a.lutaId ? fins[a.lutaId] : undefined;
        const restante = a.cronometro ? restanteMs(a.cronometro, agoraServidor) : null;

        // ── Terminou: animação e escolha do vencedor ──
        if (a.lutaId && fim) {
          if (fim.fase === 'acabou') {
            return (
              <div key={a.area} className="relative h-[204px] rounded-[18px] overflow-hidden bg-stone-900 border-2 border-green-600">
                <div className="absolute inset-0 bg-green-600 origin-left" style={{ animation: 'jjEncher 1.1s cubic-bezier(.65,0,.35,1) .6s both' }} />
                <div className="relative h-full flex flex-col items-center justify-center gap-1.5" style={{ animation: 'jjPiscar .3s ease-in-out 4' }}>
                  <span className="text-xs font-bold uppercase tracking-[0.12em]">Área {a.area}</span>
                  <span className="text-[34px] font-extrabold tracking-wide">{fim.motivo}</span>
                  <span className="text-sm">{a.azul} × {a.branco}</span>
                </div>
              </div>
            );
          }
          const escolher = (cor: 'azul' | 'branco') => {
            const nome = cor === 'azul' ? a.azul! : a.branco!;
            const vencedor = cor === 'azul' ? a.azulId : a.brancoId;
            if (vencedor) {
              setConfirmar({
                lutaId: a.lutaId!, vencedor, nome, perdedor: cor === 'azul' ? a.branco! : a.azul!, area: a.area, cor,
                metodo: fim.motivo === 'FINALIZOU!' ? 'finalizacao' : 'decisao',
              });
            }
          };
          return (
            <div key={a.area} className="h-[204px] rounded-[18px] overflow-hidden border-2 border-green-600 flex flex-col">
              <div className="h-[30px] shrink-0 bg-green-700 flex items-center justify-center text-xs font-bold tracking-wider" style={{ animation: 'jjFade .3s ease-out both' }}>
                ÁREA {a.area} · TOQUE NO VENCEDOR
              </div>
              <div className="relative flex-1 grid grid-cols-2 overflow-hidden">
                <button onClick={() => escolher('azul')} className="bg-blue-600 flex flex-col items-center justify-center gap-1 pl-3 pr-14" style={{ animation: 'jjEsq .45s cubic-bezier(.2,.9,.3,1.2) both' }}>
                  <span className="text-xs font-bold tracking-[0.1em] text-blue-100">AZUL</span>
                  <span className="text-[22px] font-extrabold truncate max-w-full">{a.azul}</span>
                </button>
                <button onClick={() => escolher('branco')} className="bg-stone-100 text-stone-900 flex flex-col items-center justify-center gap-1 pr-3 pl-14" style={{ animation: 'jjDir .45s cubic-bezier(.2,.9,.3,1.2) both' }}>
                  <span className="text-xs font-bold tracking-[0.1em] text-stone-600">BRANCO</span>
                  <span className="text-[22px] font-extrabold truncate max-w-full">{a.branco}</span>
                </button>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <VsFaixas largura={112} animado />
                </span>
              </div>
            </div>
          );
        }

        // ── Rodando / pausada / tempo esgotado (antes da animação local) ──
        if (a.fase === 'rodando' || a.fase === 'pausada' || a.fase === 'tempo_esgotado') {
          const urgente = a.fase === 'rodando' && restante !== null && restante <= 10_000;
          return (
            <div key={a.area} className={`h-[204px] rounded-[18px] bg-stone-900 border-2 px-3.5 py-3 flex flex-col gap-2 ${urgente ? 'border-red-500' : 'border-stone-800'}`}>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">Área {a.area}{a.fase === 'pausada' ? ' · pausada' : ''}</span>
              <div
                className={`text-center text-[44px] font-extrabold leading-none tabular-nums ${urgente ? 'text-red-400' : a.fase === 'pausada' ? 'text-stone-400' : 'text-white'}`}
                style={urgente ? { animation: 'jjPiscar 1s infinite' } : undefined}
                role="timer"
                aria-live="off"
              >
                {tempoTxt(restante ?? 0)}
              </div>
              <Nomes azul={a.azul} branco={a.branco} />
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Botao
                  variante="secundario"
                  className="min-h-[44px] rounded-xl text-sm"
                  disabled={ocupado}
                  onClick={() => agir(() => api(`/chaves/${params.id}/lutas/${a.lutaId}/cronometro`, { method: 'POST', body: { acao: a.fase === 'pausada' ? 'retomar' : 'pausar' } }))}
                >
                  {a.fase === 'pausada' ? 'Retomar' : 'Pausar'}
                </Botao>
                <Botao className="min-h-[44px] rounded-xl text-sm" disabled={ocupado} onClick={() => finalizou(a)}>
                  Finalizou
                </Botao>
              </div>
            </div>
          );
        }

        // ── Chamada, esperando o play ──
        if (a.fase === 'aguardando') {
          return (
            <div key={a.area} className="h-[204px] rounded-[18px] bg-stone-900 border-2 border-stone-600 px-3.5 py-3 flex flex-col gap-2" style={{ animation: 'jjFade .35s ease-out both' }}>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">Área {a.area} · aguardando</span>
              <div className="mt-1.5">
                <Nomes azul={a.azul} branco={a.branco} centro={tempoTxt(estado.config.duracaoSeg * 1000)} />
              </div>
              <Botao
                variante="sucesso"
                className="mt-auto min-h-[56px]"
                disabled={ocupado}
                onClick={() => agir(() => api(`/chaves/${params.id}/lutas/${a.lutaId}/iniciar`, { method: 'POST' }))}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
                Começar luta
              </Botao>
            </div>
          );
        }

        // ── Livre ──
        return a.ultimoResultado ? (
          <div key={a.area} className="h-[68px] rounded-[18px] bg-stone-900 border-2 border-green-900 px-3.5 flex items-center gap-3" style={{ animation: 'jjFade .35s ease-out both' }}>
            <span className="w-10 h-10 rounded-full bg-green-950 text-green-300 flex items-center justify-center shrink-0">
              <IconeTrofeu />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-green-300">Área {a.area} · encerrada</span>
              <span className="block text-base font-bold truncate">{a.ultimoResultado.vencedor} venceu</span>
            </span>
            <span className="text-xs text-stone-400">contra {a.ultimoResultado.perdedor}</span>
          </div>
        ) : (
          <div key={a.area} className="h-[68px] rounded-[18px] border border-dashed border-stone-700 flex items-center justify-center text-sm text-stone-400">
            Área {a.area} livre
          </div>
        );
      })}

      {/* Próxima luta e áreas livres */}
      <div className="flex flex-col gap-2.5 mt-1">
        {proxima && livres.length > 0 && (
          <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-stone-900 border border-dashed border-red-500">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">Próxima luta</span>
              <span className="flex-1 text-right text-[15px] font-bold">{proxima.azul} × {proxima.branco}</span>
            </div>
            <div className="flex gap-2">
              {livres.map((a) => (
                <Botao
                  key={a.area}
                  className="flex-1 min-h-[48px] rounded-xl text-sm"
                  disabled={ocupado}
                  onClick={() => agir(() => api(`/chaves/${params.id}/lutas/${proxima.lutaId}/chamar`, { method: 'POST', body: { area: a.area } }))}
                >
                  <IconeMais className="w-4 h-4" /> Área {a.area}
                </Botao>
              ))}
            </div>
          </div>
        )}
        <p className="text-[13px] text-stone-300">
          {estado.fila.length ? `${estado.fila.length} luta(s) na fila` : rolando ? 'Fila vazia · esperando as lutas em andamento' : 'Nada na fila agora.'}
        </p>
      </div>

      <Folha
        aberta={!!confirmar}
        aoFechar={() => setConfirmar(null)}
        titulo={confirmar ? `${confirmar.nome} venceu?` : ''}
        subtitulo={confirmar ? `Área ${confirmar.area} · lado ${confirmar.cor}` : ''}
      >
        {confirmar && (
          <>
            <p className="text-sm text-stone-300">
              Tem certeza? {confirmar.nome} avança na chave e {confirmar.perdedor} é eliminado(a).
            </p>
            <div className="flex gap-2">
              {(['finalizacao', 'decisao'] as const).map((m) => (
                <button
                  key={m}
                  aria-pressed={confirmar.metodo === m}
                  onClick={() => setConfirmar({ ...confirmar, metodo: m })}
                  className={`flex-1 h-12 rounded-[14px] font-semibold border ${confirmar.metodo === m ? 'border-red-500 bg-red-950' : 'border-stone-700 text-stone-300'}`}
                >
                  {METODO_LABEL[m]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Botao variante="secundario" onClick={() => setConfirmar(null)}>Cancelar</Botao>
              <Botao variante="sucesso" onClick={registrar} disabled={ocupado}>Sim, confirmar</Botao>
            </div>
          </>
        )}
      </Folha>
    </Tela>
  );
}

function Nomes({ azul, branco, centro }: { azul: string | null; branco: string | null; centro?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <span className="flex items-center gap-2 min-w-0">
        <span aria-hidden="true" className="w-1.5 h-6 rounded-sm bg-blue-600 shrink-0" />
        <span className="text-base font-semibold truncate">{azul}</span>
      </span>
      {centro ? <span className="text-[22px] font-extrabold tabular-nums text-stone-400">{centro}</span> : <VsFaixas largura={38} />}
      <span className="flex items-center justify-end gap-2 min-w-0">
        <span className="text-base font-semibold truncate">{branco}</span>
        <span aria-hidden="true" className="w-1.5 h-6 rounded-sm bg-stone-100 shrink-0" />
      </span>
    </div>
  );
}

/** Vibra e apita quando o tempo de uma área acaba (você está olhando o tatame, não o celular). */
function avisar(area: number) {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    // sem vibração
  }
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    // Um bipe por área: área 1 = 1 bipe, área 2 = 2 bipes...
    for (let i = 0; i < area; i++) {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.35);
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.35 + 0.25);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.35);
      osc.stop(ctx.currentTime + i * 0.35 + 0.26);
    }
    setTimeout(() => ctx.close(), area * 400 + 300);
  } catch {
    // sem áudio
  }
}
