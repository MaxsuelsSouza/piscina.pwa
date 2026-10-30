/**
 * Chaves salvas (funções puras sobre o documento do Firestore).
 *
 * Ciclo de vida:
 *   rascunho  → inscrições abertas, sem lutas
 *   sorteada  → lutas geradas, nenhuma começou (pode sortear de novo)
 *   em_andamento → alguma luta começou ou terminou
 *   encerrada → campeão definido
 *
 * No sorteio, a chave guarda uma "foto" dos dados de cada atleta. Editar o
 * lutador depois não altera a chave já sorteada.
 */

import { z } from 'zod';
import {
  classificacao,
  filaDeLutas,
  nomeRodada,
  regraEspecialFinal,
  textoRegraFinal,
  type AtletaChave,
  type Chave,
  type Classificacao,
} from './chave';
import { calcularNivel } from './nivel';
import { desempenhoDe, nivelSorteio, type LutadorDoc } from './lutadores';
import { MAX_ATLETAS_CHAVE, METODOS_VITORIA, type Lutador } from './schemas';
import { ConfigTatameSchema, configTatame, type ConfigTatame, type Cronometro } from './tatame';

export const COLECAO_CHAVES = 'jj_chaves';

export type StatusChave = 'rascunho' | 'sorteada' | 'em_andamento' | 'encerrada';

/**
 * Foto do atleta no momento do sorteio (ou da entrada, se atrasado).
 * `nivel` é o nível do sorteio (físico + ajuste de desempenho).
 */
export type AtletaSnapshot = AtletaChave &
  Pick<Lutador, 'sexo' | 'faixa' | 'graus' | 'peso'> & {
    nivelFisico?: number;
    ajuste?: number;
  };

export type TipoChave = 'principal' | 'repescagem';

export type ChaveDoc = {
  ownerUid: string;
  nome: string;
  /** Ausente = 'principal' (o absoluto). */
  tipo?: TipoChave;
  /** Na repescagem: o absoluto de origem. */
  principalId?: string | null;
  /** No absoluto: a repescagem criada ao fim da 1ª rodada. */
  repescagemId?: string | null;
  /** No absoluto: atrasados que esperam a repescagem ser sorteada. */
  filaRepescagem?: string[];
  /** IDs dos lutadores inscritos (vale enquanto não sorteada). */
  inscritos: string[];
  atletas: AtletaSnapshot[];
  chave: Chave | null;
  sorteadaEm: string | null;
  /** Áreas e duração das lutas (ausente em chaves antigas: usa o padrão). */
  tatame?: ConfigTatame;
  /** Cronômetro e área de cada luta que passou pelo tatame. */
  cronometros?: Record<string, Cronometro>;
  createdAt: string;
  updatedAt: string;
};

// ─── Validação ───────────────────────────────────────────────────────────────

const nomeChave = z.string().trim().min(1, 'Nome da chave é obrigatório').max(60, 'Nome muito longo');
const listaInscritos = z
  .array(z.string().min(1))
  .max(MAX_ATLETAS_CHAVE, `A chave aceita no máximo ${MAX_ATLETAS_CHAVE} atletas`)
  .refine((ids) => new Set(ids).size === ids.length, 'Há lutadores repetidos');

export const ChaveCriarSchema = z.object({
  nome: nomeChave,
  inscritos: listaInscritos.default([]),
});

export const ChavePatchSchema = z
  .object({ nome: nomeChave, inscritos: listaInscritos, tatame: ConfigTatameSchema })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nenhum campo para atualizar' });

export const ResultadoSchema = z.object({
  vencedor: z.string().min(1, 'Informe o vencedor'),
  metodo: z.enum(METODOS_VITORIA, { errorMap: () => ({ message: 'Método deve ser finalização ou decisão' }) }),
});

// ─── Regras ──────────────────────────────────────────────────────────────────

export function novaChaveDoc(nome: string, inscritos: string[], ownerUid: string, agora: string): ChaveDoc {
  return {
    ownerUid, nome, inscritos, atletas: [], chave: null, sorteadaEm: null,
    tatame: configTatame({}), cronometros: {}, createdAt: agora, updatedAt: agora,
  };
}

export function statusDaChave(doc: Pick<ChaveDoc, 'chave'>): StatusChave {
  const { chave } = doc;
  if (!chave) return 'rascunho';
  if (classificacao(chave)) return 'encerrada';
  const comecou = chave.lutas.some((l) => l.status === 'finalizada' || l.status === 'em_andamento');
  return comecou ? 'em_andamento' : 'sorteada';
}

/** Inscrições e novo sorteio só antes da primeira luta começar. */
export function podeAlterarInscricoes(doc: Pick<ChaveDoc, 'chave'>): boolean {
  const status = statusDaChave(doc);
  return status === 'rascunho' || status === 'sorteada';
}

export function snapshotAtleta(id: string, lutador: LutadorDoc, atrasado = false): AtletaSnapshot {
  return {
    id,
    nome: lutador.nome,
    nivel: nivelSorteio(lutador),
    nivelFisico: calcularNivel(lutador),
    ajuste: desempenhoDe(lutador).ajuste,
    ...(atrasado ? { atrasado: true } : {}),
    sexo: lutador.sexo,
    faixa: lutador.faixa,
    graus: lutador.graus,
    peso: lutador.peso,
  };
}

// ─── Visões para as telas ────────────────────────────────────────────────────

export type ResumoChave = {
  id: string;
  nome: string;
  tipo: TipoChave;
  status: StatusChave;
  totalAtletas: number;
  /** Atletas ainda não eliminados. */
  restantes: number;
  rodadaAtual: string | null;
  /** Fração de lutas concluídas (0 a 1). */
  progresso: number;
  campeao: string | null;
  createdAt: string;
};

/** Resumo usado na tela 1 (em andamento e histórico). */
export function resumoChave(id: string, doc: ChaveDoc): ResumoChave {
  const status = statusDaChave(doc);
  const chave = doc.chave;
  const nomeDe = (atletaId: string | null) => doc.atletas.find((a) => a.id === atletaId)?.nome ?? null;

  if (!chave) {
    return {
      id, nome: doc.nome, tipo: doc.tipo ?? 'principal', status, totalAtletas: doc.inscritos.length, restantes: doc.inscritos.length,
      rodadaAtual: null, progresso: 0, campeao: null, createdAt: doc.createdAt,
    };
  }

  const reais = chave.lutas.filter((l) => l.status !== 'bye' && l.status !== 'cancelada');
  const feitas = reais.filter((l) => l.status === 'finalizada');
  const pendentes = chave.lutas.filter((l) => l.status === 'pronta' || l.status === 'em_andamento' || l.status === 'aguardando');
  const rodadaMin = pendentes.length ? Math.min(...pendentes.map((l) => l.rodada)) : null;

  const eliminados = new Set(
    chave.formato === 'melhor-de-3'
      ? []
      : chave.lutas
          .filter((l) => l.status === 'finalizada' && !l.destinoPerdedor)
          .map((l) => (l.vencedor === l.azul ? l.branco : l.azul))
  );
  const final = classificacao(chave);

  return {
    id,
    nome: doc.nome,
    tipo: doc.tipo ?? 'principal',
    status,
    totalAtletas: doc.atletas.length,
    restantes: final ? 1 : doc.atletas.length - eliminados.size,
    rodadaAtual: rodadaMin ? nomeRodada(chave, rodadaMin) : null,
    progresso: reais.length ? Math.round((feitas.length / reais.length) * 100) / 100 : 0,
    campeao: final ? nomeDe(final.campeao) : null,
    createdAt: doc.createdAt,
  };
}

export type DetalheChave = {
  id: string;
  nome: string;
  status: StatusChave;
  inscritos: string[];
  atletas: AtletaSnapshot[];
  chave: Chave | null;
  rodadas: { numero: number; nome: string }[];
  fila: string[];
  classificacao: Classificacao | null;
  regraFinal: { texto: string; diferenca: number; posicao: string } | null;
  tatame: ConfigTatame;
  tipo: TipoChave;
  principalId: string | null;
  repescagemId: string | null;
  filaRepescagem: string[];
  sorteadaEm: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Tudo que as telas 3, 4 e 5 precisam para desenhar a chave. */
export function detalheChave(id: string, doc: ChaveDoc): DetalheChave {
  const chave = doc.chave;
  const nomeDe = (atletaId: string) => doc.atletas.find((a) => a.id === atletaId)?.nome ?? '';
  // A regra especial de posição é só da final do absoluto.
  const regra = chave && (doc.tipo ?? 'principal') === 'principal' ? regraEspecialFinal(chave) : null;

  return {
    id,
    nome: doc.nome,
    status: statusDaChave(doc),
    inscritos: doc.inscritos,
    atletas: doc.atletas,
    chave,
    rodadas: chave
      ? Array.from({ length: chave.totalRodadas }, (_, i) => ({ numero: i + 1, nome: nomeRodada(chave, i + 1) }))
      : [],
    fila: chave ? filaDeLutas(chave).map((l) => l.id) : [],
    classificacao: chave ? classificacao(chave) : null,
    regraFinal: regra ? { texto: textoRegraFinal(regra, nomeDe), diferenca: regra.diferenca, posicao: regra.posicao } : null,
    tatame: configTatame(doc),
    tipo: doc.tipo ?? 'principal',
    principalId: doc.principalId ?? null,
    repescagemId: doc.repescagemId ?? null,
    filaRepescagem: doc.filaRepescagem ?? [],
    sorteadaEm: doc.sorteadaEm,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
