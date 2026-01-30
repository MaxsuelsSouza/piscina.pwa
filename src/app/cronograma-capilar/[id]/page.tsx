'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import type { CronogramaCapilar, TipoTratamento, TratamentoRealizado } from '../_types';
import {
  TRATAMENTO_LABELS,
  TRATAMENTO_COLORS,
  TRATAMENTO_PAUSA,
  TRATAMENTO_DICAS,
  INTERVALO_MINIMO_HORAS,
  INTERVALO_RECONSTRUCAO_DIAS,
  INTERVALO_NUTRICAO_DIAS,
} from '../_types';

/**
 * Calcula qual o proximo tratamento baseado no historico e regras.
 *
 * Regras:
 * 1. Sem historico -> Hidratacao
 * 2. Ultimo foi Reconstrucao -> Hidratacao (obrigatorio)
 * 3. Ultimo foi Nutricao -> Hidratacao
 * 4. Ultimo foi Hidratacao:
 *    a. Se Reconstrucao ativa E nao fez ha 15+ dias -> Reconstrucao
 *    b. Se Nutricao ativa E nao fez ha 7+ dias -> Nutricao
 *    c. Senao -> Hidratacao
 */
function calcularProximoTratamento(
  historico: TratamentoRealizado[],
  tratamentosAtivos: TipoTratamento[]
): TipoTratamento {
  if (historico.length === 0) return 'hidratacao';

  const ultimo = historico[historico.length - 1];

  if (ultimo.tipo === 'reconstrucao') return 'hidratacao';
  if (ultimo.tipo === 'nutricao') return 'hidratacao';

  // Ultimo foi hidratacao
  if (ultimo.tipo === 'hidratacao') {
    const agora = Date.now();

    // Verificar reconstrucao
    if (tratamentosAtivos.includes('reconstrucao')) {
      const ultimaReconstrucao = [...historico]
        .reverse()
        .find((t) => t.tipo === 'reconstrucao');
      const diasDesdeReconstrucao = ultimaReconstrucao
        ? (agora - new Date(ultimaReconstrucao.data).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      if (diasDesdeReconstrucao >= INTERVALO_RECONSTRUCAO_DIAS) {
        return 'reconstrucao';
      }
    }

    // Verificar nutricao
    if (tratamentosAtivos.includes('nutricao')) {
      const ultimaNutricao = [...historico]
        .reverse()
        .find((t) => t.tipo === 'nutricao');
      const diasDesdeNutricao = ultimaNutricao
        ? (agora - new Date(ultimaNutricao.data).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      if (diasDesdeNutricao >= INTERVALO_NUTRICAO_DIAS) {
        return 'nutricao';
      }
    }
  }

  return 'hidratacao';
}

/**
 * Verifica se o intervalo minimo de 48h ja passou desde o ultimo tratamento.
 * Retorna null se pode fazer, ou o timestamp de quando podera.
 */
function verificarIntervalo(historico: TratamentoRealizado[]): Date | null {
  if (historico.length === 0) return null;

  const ultimo = historico[historico.length - 1];
  const dataUltimo = new Date(ultimo.data);
  const proximoPermitido = new Date(dataUltimo.getTime() + INTERVALO_MINIMO_HORAS * 60 * 60 * 1000);

  if (proximoPermitido > new Date()) {
    return proximoPermitido;
  }

  return null;
}

function formatarContagem(dataAlvo: Date): string {
  const agora = new Date();
  const diff = dataAlvo.getTime() - agora.getTime();

  if (diff <= 0) return 'Disponivel agora!';

  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (horas > 0) {
    return `${horas}h ${minutos}min`;
  }
  return `${minutos}min`;
}

export default function CronogramaCapilarDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const cronogramaId = params.id as string;
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [cronograma, setCronograma] = useState<CronogramaCapilar | null>(null);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [contagem, setContagem] = useState<string | null>(null);
  const [intervaloAlvo, setIntervaloAlvo] = useState<Date | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { schedule: scheduleNotification, permission: notifPermission } = useNotifications();

  const isAdmin = !!firebaseUser;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchCronograma = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cronograma-capilar/${cronogramaId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Cronograma nao encontrado');
      }

      setCronograma(data.cronograma);

      const bloqueio = verificarIntervalo(data.cronograma.historico);
      setIntervaloAlvo(bloqueio);
    } catch (error) {
      console.error('Erro ao carregar cronograma:', error);
    } finally {
      setLoading(false);
    }
  }, [cronogramaId]);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (!isAdmin || !cronogramaId) return;
    fetchCronograma();
  }, [isAdmin, cronogramaId, fetchCronograma]);

  // Countdown timer
  useEffect(() => {
    if (!intervaloAlvo) {
      setContagem(null);
      return;
    }

    const atualizar = () => {
      const texto = formatarContagem(intervaloAlvo);
      setContagem(texto);

      if (intervaloAlvo <= new Date()) {
        setIntervaloAlvo(null);
        setContagem(null);
      }
    };

    atualizar();
    const interval = setInterval(atualizar, 60000);
    return () => clearInterval(interval);
  }, [intervaloAlvo]);

  const handleMarcarFeito = async () => {
    if (!cronograma) return;

    const proximo = calcularProximoTratamento(cronograma.historico, cronograma.tratamentosAtivos);

    const tratamentoRealizado: TratamentoRealizado = {
      id: `${Date.now()}`,
      tipo: proximo,
      data: new Date().toISOString(),
    };

    setMarcando(true);
    try {
      const res = await fetch(`/api/cronograma-capilar/${cronogramaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tratamentoRealizado }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao registrar tratamento');
      }

      showMessage('success', `${TRATAMENTO_LABELS[proximo]} registrada!`);

      // Calcular qual sera o proximo tratamento apos este
      const historicoAtualizado = [...cronograma.historico, tratamentoRealizado];
      const proximoTratamentoFuturo = calcularProximoTratamento(historicoAtualizado, cronograma.tratamentosAtivos);

      // Emojis para cada tipo de tratamento
      const tratamentoEmojis: Record<TipoTratamento, string> = {
        hidratacao: '💧',
        nutricao: '🥑',
        reconstrucao: '💪',
      };

      // Mensagens personalizadas para cada tipo
      const tratamentoMensagens: Record<TipoTratamento, string> = {
        hidratacao: 'Hora de repor a agua dos fios! Use mascaras com aloe vera ou pantenol.',
        nutricao: 'Seus fios precisam de oleos! Use mascaras com oleo de coco ou argan.',
        reconstrucao: 'Momento de fortalecer! Use mascaras com queratina ou aminoacidos.',
      };

      // Schedule notification for when 48h interval passes
      if (notifPermission === 'granted') {
        const scheduledFor = new Date(Date.now() + INTERVALO_MINIMO_HORAS * 60 * 60 * 1000).toISOString();
        const emoji = tratamentoEmojis[proximoTratamentoFuturo];
        const mensagem = tratamentoMensagens[proximoTratamentoFuturo];
        const tempo = TRATAMENTO_PAUSA[proximoTratamentoFuturo];

        scheduleNotification({
          id: `cronograma-capilar-${cronogramaId}`,
          module: 'cronograma-capilar',
          title: `${emoji} ${cronograma.nome} - ${TRATAMENTO_LABELS[proximoTratamentoFuturo]}`,
          body: `${mensagem} Tempo: ${tempo}`,
          scheduledFor,
          link: `/cronograma-capilar/${cronogramaId}`,
        });
      }

      await fetchCronograma();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar';
      showMessage('error', errorMessage);
    } finally {
      setMarcando(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin || !cronograma) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Cronograma nao encontrado</p>
          <Link href="/cronograma-capilar" className="text-pink-600 hover:underline">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const proximoTratamento = calcularProximoTratamento(cronograma.historico, cronograma.tratamentosAtivos);
  const podeRealizar = !intervaloAlvo;
  const colors = TRATAMENTO_COLORS[proximoTratamento];

  // Historico reverso (mais recentes primeiro)
  const historicoReverso = [...cronograma.historico].reverse();

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/cronograma-capilar"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition"
          >
            <svg
              className="w-5 h-5 text-stone-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-serif text-stone-800">{cronograma.nome}</h1>
            <p className="text-xs text-stone-400">Cronograma Capilar</p>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Card do tratamento do dia */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className={`px-5 py-4 bg-gradient-to-r ${
            proximoTratamento === 'hidratacao' ? 'from-blue-500 to-blue-600' :
            proximoTratamento === 'nutricao' ? 'from-amber-500 to-amber-600' :
            'from-rose-500 to-rose-600'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Proximo tratamento</span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                {TRATAMENTO_PAUSA[proximoTratamento]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              {TRATAMENTO_LABELS[proximoTratamento]}
            </h2>
          </div>

          <div className="p-5">
            {/* Dica */}
            <div className="p-4 bg-stone-50 rounded-xl mb-5">
              <p className="text-stone-700 leading-relaxed text-sm">
                {TRATAMENTO_DICAS[proximoTratamento]}
              </p>
            </div>

            {/* Intervalo ou Botao */}
            {!podeRealizar && contagem ? (
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 font-medium text-sm mb-1">Aguarde o intervalo de 48h</p>
                <p className="text-amber-600 text-2xl font-bold">{contagem}</p>
                <p className="text-amber-600 text-xs mt-1">
                  Disponivel em {intervaloAlvo!.toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ) : (
              <button
                onClick={handleMarcarFeito}
                disabled={marcando}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition disabled:opacity-50 ${
                  proximoTratamento === 'hidratacao' ? 'bg-blue-500 hover:bg-blue-600' :
                  proximoTratamento === 'nutricao' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {marcando ? 'Registrando...' : 'Feito!'}
              </button>
            )}
          </div>
        </div>

        {/* Historico */}
        {historicoReverso.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="font-medium text-stone-800">Historico</h3>
              <p className="text-xs text-stone-400">{historicoReverso.length} tratamento{historicoReverso.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="px-5 py-3">
              <div className="relative">
                {/* Linha do tempo */}
                {historicoReverso.length > 1 && (
                  <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-pink-300 via-stone-200 to-stone-100" />
                )}

                <div className="space-y-4">
                  {historicoReverso.slice(0, 20).map((tratamento, index) => {
                    const tColors = TRATAMENTO_COLORS[tratamento.tipo];
                    const data = new Date(tratamento.data);
                    const isHoje = data.toDateString() === new Date().toDateString();

                    return (
                      <div key={tratamento.id} className="relative flex gap-3">
                        {/* Ponto */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isHoje ? tColors.accent : 'bg-stone-300'
                          }`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tColors.bg} ${tColors.text}`}>
                              {TRATAMENTO_LABELS[tratamento.tipo]}
                            </span>
                            {isHoje && (
                              <span className="text-xs font-medium text-pink-600">Hoje</span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 mt-1">
                            {data.toLocaleDateString('pt-BR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {historicoReverso.length > 20 && (
                <p className="text-xs text-stone-400 text-center mt-3">
                  Mostrando ultimos 20 de {historicoReverso.length}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
