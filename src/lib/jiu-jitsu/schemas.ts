/**
 * Validações (zod) e tipos do módulo de lutas.
 * Podem ser importados tanto no servidor quanto no cliente.
 */

import { z } from 'zod';
import { FAIXAS_JJ } from '@/app/jiu-jitsu/_types';
import type { Desempenho, Tendencia } from './desempenho';

export const SEXOS = ['M', 'F'] as const;
export type Sexo = (typeof SEXOS)[number];

/** Graus máximos por faixa (faixas coloridas até 4, preta até 6). */
export const MAX_GRAUS = { branca: 4, azul: 4, roxa: 4, marrom: 4, preta: 6 } as const;

/** Métodos que o usuário escolhe ao definir o vencedor. */
export const METODOS_VITORIA = ['finalizacao', 'decisao'] as const;
export type MetodoVitoria = (typeof METODOS_VITORIA)[number];
/** Métodos registrados numa luta (W.O. é registrado pelo app, não escolhido). */
export type MetodoLuta = MetodoVitoria | 'wo';

export const MAX_ATLETAS_CHAVE = 30;

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

const camposLutador = {
  nome: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(60, 'Nome deve ter no máximo 60 caracteres'),
  sexo: z.enum(SEXOS),
  peso: z
    .number({ invalid_type_error: 'Peso deve ser um número' })
    .min(20, 'Peso mínimo é 20 kg')
    .max(250, 'Peso máximo é 250 kg'),
  faixa: z.enum(FAIXAS_JJ),
  graus: z.number().int('Graus deve ser inteiro').min(0).max(6),
  nascimento: dataIso.nullable().optional(),
};

const grausCompativeis = (d: { faixa: (typeof FAIXAS_JJ)[number]; graus: number }) =>
  d.graus <= MAX_GRAUS[d.faixa];

const mensagemGraus = {
  message: 'Quantidade de graus inválida para essa faixa',
  path: ['graus'],
};

export const LutadorSchema = z.object(camposLutador).refine(grausCompativeis, mensagemGraus);
export type LutadorInput = z.infer<typeof LutadorSchema>;

export const LutadorPatchSchema = z
  .object(camposLutador)
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nenhum campo para atualizar' });
export type LutadorPatch = z.infer<typeof LutadorPatchSchema>;

/** Campos que entram no histórico quando mudam. */
export const CAMPOS_HISTORICO = ['faixa', 'graus', 'peso'] as const;
export type CampoHistorico = (typeof CAMPOS_HISTORICO)[number];

export type AlteracaoLutador = {
  campo: CampoHistorico;
  de: string | number;
  para: string | number;
};

export type EventoHistoricoLutador = {
  data: string;
  alteracoes: AlteracaoLutador[];
};

export type Lutador = {
  id: string;
  /** Nível físico (faixa, graus, peso, sexo). */
  nome: string;
  sexo: Sexo;
  peso: number;
  faixa: (typeof FAIXAS_JJ)[number];
  graus: number;
  nascimento: string | null;
  nivel: number;
  /** Ajuste aprendido com as lutas; nível do sorteio = nivel + desempenho.ajuste. */
  desempenho: Desempenho;
  nivelSorteio: number;
  tendencia: Tendencia;
  historico: EventoHistoricoLutador[];
  createdAt: string;
  updatedAt: string;
};

/** Converte a primeira mensagem de erro do zod em texto para a resposta da API. */
export function primeiraMensagemErro(erro: z.ZodError): string {
  const issue = erro.issues[0];
  return issue?.message ?? 'Dados inválidos';
}

/** Normaliza nome para busca: minúsculas e sem acentos. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
