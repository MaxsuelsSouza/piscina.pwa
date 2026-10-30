/**
 * Regras de negócio dos lutadores (funções puras, testáveis sem banco).
 */

import { DESEMPENHO_INICIAL, tendencia, type Desempenho } from './desempenho';
import { calcularNivel } from './nivel';
import {
  CAMPOS_HISTORICO,
  normalizarBusca,
  type AlteracaoLutador,
  type EventoHistoricoLutador,
  type Lutador,
  type LutadorInput,
} from './schemas';

export const COLECAO_LUTADORES = 'jj_lutadores';

/** Formato salvo no Firestore. */
export type LutadorDoc = Omit<Lutador, 'id' | 'nivel' | 'desempenho' | 'nivelSorteio' | 'tendencia'> & {
  ownerUid: string;
  nomeBusca: string;
  /** Ausente em lutadores criados antes do desempenho existir. */
  desempenho?: Desempenho;
};

export function desempenhoDe(doc: Pick<LutadorDoc, 'desempenho'>): Desempenho {
  return doc.desempenho ?? DESEMPENHO_INICIAL;
}

/** Nível usado no sorteio: físico + ajuste de desempenho. */
export function nivelSorteio(doc: LutadorDoc): number {
  return Math.round((calcularNivel(doc) + desempenhoDe(doc).ajuste) * 100) / 100;
}

export function novoLutadorDoc(dados: LutadorInput, ownerUid: string, agora: string): LutadorDoc {
  return {
    ownerUid,
    nome: dados.nome,
    nomeBusca: normalizarBusca(dados.nome),
    sexo: dados.sexo,
    peso: dados.peso,
    faixa: dados.faixa,
    graus: dados.graus,
    nascimento: dados.nascimento ?? null,
    desempenho: DESEMPENHO_INICIAL,
    historico: [],
    createdAt: agora,
    updatedAt: agora,
  };
}

export function paraLutador(id: string, doc: LutadorDoc): Lutador {
  const desempenho = desempenhoDe(doc);
  return {
    id,
    nome: doc.nome,
    sexo: doc.sexo,
    peso: doc.peso,
    faixa: doc.faixa,
    graus: doc.graus,
    nascimento: doc.nascimento ?? null,
    nivel: calcularNivel(doc),
    desempenho,
    nivelSorteio: nivelSorteio(doc),
    tendencia: tendencia(desempenho.ajuste),
    historico: doc.historico ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Lista o que mudou em faixa, graus e peso entre duas versões do lutador. */
export function alteracoesHistorico(
  antes: Pick<LutadorDoc, 'faixa' | 'graus' | 'peso'>,
  depois: Pick<LutadorDoc, 'faixa' | 'graus' | 'peso'>
): AlteracaoLutador[] {
  return CAMPOS_HISTORICO.filter((campo) => antes[campo] !== depois[campo]).map((campo) => ({
    campo,
    de: antes[campo],
    para: depois[campo],
  }));
}

/** Aplica uma atualização e registra no histórico o que mudou. */
export function aplicarAtualizacao(
  atual: LutadorDoc,
  mudancas: Partial<LutadorInput>,
  agora: string
): LutadorDoc {
  const proximo: LutadorDoc = {
    ...atual,
    ...mudancas,
    nascimento: mudancas.nascimento === undefined ? atual.nascimento : mudancas.nascimento ?? null,
    updatedAt: agora,
  };
  if (mudancas.nome !== undefined) proximo.nomeBusca = normalizarBusca(mudancas.nome);

  const alteracoes = alteracoesHistorico(atual, proximo);
  if (alteracoes.length > 0) {
    const evento: EventoHistoricoLutador = { data: agora, alteracoes };
    proximo.historico = [...(atual.historico ?? []), evento];
  }
  return proximo;
}

/** Filtra e ordena lutadores pela busca (sem acento, por trecho do nome). */
export function filtrarPorNome<T extends { nomeBusca: string; nome: string }>(lista: T[], busca: string): T[] {
  const q = normalizarBusca(busca);
  const filtrados = q ? lista.filter((l) => l.nomeBusca.includes(q)) : lista;
  return [...filtrados].sort((a, b) => {
    // Quem começa com o termo aparece primeiro.
    const aIni = q && a.nomeBusca.startsWith(q) ? 0 : 1;
    const bIni = q && b.nomeBusca.startsWith(q) ? 0 : 1;
    return aIni - bIni || a.nome.localeCompare(b.nome, 'pt-BR');
  });
}
