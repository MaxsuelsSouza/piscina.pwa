/**
 * Motor da chave de lutas (funções puras, sem banco).
 *
 * Formatos, seguindo o livro de regras da IBJJF/CBJJ:
 * - 2 atletas: melhor de três;
 * - 3 atletas: "chave de três" (o perdedor da 1ª luta enfrenta o 3º atleta);
 * - 4+ atletas: eliminação simples, sem disputa de 3º lugar (dois bronzes).
 *
 * Regras próprias do evento da academia:
 * - atletas ordenados por nível e divididos em lado A (níveis baixos) e
 *   lado B (níveis altos), que só se cruzam na final;
 * - em cada lado, confrontos entre vizinhos de nível;
 * - quem passa direto (bye) é o atleta de menor nível de cada lado;
 * - a final tem uma regra especial de posição, pela diferença de nível.
 *
 * Todas as funções retornam uma chave nova; a entrada nunca é alterada.
 */

import { MAX_ATLETAS_CHAVE, type MetodoLuta, type MetodoVitoria } from './schemas';

export type AtletaChave = {
  id: string;
  nome: string;
  nivel: number;
  /** Entrou depois do sorteio: não recebe compensação. */
  atrasado?: boolean;
  /** As garotas lutam entre si primeiro; sem sexo, conta como masculino. */
  sexo?: 'M' | 'F';
};

const ehGarota = (a: AtletaChave) => a.sexo === 'F';

export type Formato = 'eliminatoria' | 'chave-de-3' | 'melhor-de-3';
export type Cor = 'azul' | 'branco';
export type Lado = 'A' | 'B';
export type StatusLuta =
  | 'aguardando'
  | 'pronta'
  | 'em_andamento'
  | 'finalizada'
  | 'bye'
  | 'cancelada'
  /** Desafio de entrada esperando a resposta do desafiado. */
  | 'proposta'
  | 'recusada';

export type Destino = { lutaId: string; cor: Cor };

export type Luta = {
  id: string;
  /** 1 = primeira rodada. */
  rodada: number;
  /** Posição dentro da rodada (e do lado, na eliminatória), a partir de 1. */
  ordem: number;
  lado: Lado | null;
  final: boolean;
  azul: string | null;
  branco: string | null;
  status: StatusLuta;
  vencedor: string | null;
  metodo: MetodoLuta | null;
  /** 'desafio' = luta de entrada de um atrasado. Ausente = normal. */
  tipo?: 'normal' | 'desafio';
  /** Atleta que começa em desvantagem (atrasado que pulou rodadas). */
  emDesvantagem?: string | null;
  destinoVencedor: Destino | null;
  destinoPerdedor: Destino | null;
};

export type Chave = {
  formato: Formato;
  /** Vagas da chave (potência de 2 na eliminatória). */
  tamanho: number;
  totalRodadas: number;
  /** Atletas na ordem de nível (menor primeiro). */
  atletas: AtletaChave[];
  lutas: Luta[];
  avisos: string[];
  /** Atletas que desistiram ou foram substituídos. */
  desistentes?: string[];
};

export type Classificacao = {
  campeao: string;
  vice: string;
  terceiros: string[];
};

export class ErroChave extends Error {
  constructor(message: string, public naoEncontrado = false) {
    super(message);
    this.name = 'ErroChave';
  }
}

// ─── Criação ──────────────────────────────────────────────────────────────────

/**
 * Margem de "sorte" no sorteio: com `aleatorio`, cada nível recebe um
 * ruído de até ±TOLERANCIA_SORTEIO/2 antes de ordenar. Atletas de nível
 * parecido podem trocar de adversário entre um sorteio e outro, mas
 * ninguém salta para longe do próprio nível.
 */
export const TOLERANCIA_SORTEIO = 1.5;

export type OpcoesChave = {
  /** Gerador de números em [0, 1). Sem ele a chave é determinística. */
  aleatorio?: () => number;
};

export function gerarChave(entrada: AtletaChave[], opcoes: OpcoesChave = {}): Chave {
  validarAtletas(entrada);
  const ordem = opcoes.aleatorio ? ordenarComSorte(entrada, opcoes.aleatorio) : ordenarParaSorteio(entrada);

  const chave =
    ordem.length === 2 ? gerarMelhorDeTres(ordem) : ordem.length === 3 ? gerarChaveDeTres(ordem) : gerarEliminatoria(ordem);
  // A lista de atletas fica sempre na ordem real de nível, para exibição.
  return { ...chave, atletas: ordenarPorNivel(entrada) };
}

function ordenarComSorte(atletas: AtletaChave[], aleatorio: () => number): AtletaChave[] {
  // Garotas primeiro (ficam juntas na chave); dentro de cada grupo, nível com um pouco de sorte.
  return atletas
    .map((a) => ({ a, chave: a.nivel + (aleatorio() - 0.5) * TOLERANCIA_SORTEIO }))
    .sort((x, y) => Number(ehGarota(y.a)) - Number(ehGarota(x.a)) || x.chave - y.chave)
    .map((x) => x.a);
}

/** Ordem do sorteio sem sorte: garotas primeiro, depois por nível. */
function ordenarParaSorteio(atletas: AtletaChave[]): AtletaChave[] {
  return [...atletas].sort(
    (a, b) => Number(ehGarota(b)) - Number(ehGarota(a)) || a.nivel - b.nivel || a.nome.localeCompare(b.nome, 'pt-BR')
  );
}

function validarAtletas(atletas: AtletaChave[]) {
  if (atletas.length < 2) throw new ErroChave('A chave precisa de pelo menos 2 atletas');
  if (atletas.length > MAX_ATLETAS_CHAVE) {
    throw new ErroChave(`A chave aceita no máximo ${MAX_ATLETAS_CHAVE} atletas`);
  }
  const ids = new Set(atletas.map((a) => a.id));
  if (ids.size !== atletas.length) throw new ErroChave('Há atletas repetidos na chave');
}

export function ordenarPorNivel(atletas: AtletaChave[]): AtletaChave[] {
  return [...atletas].sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function novaLuta(parcial: Partial<Luta> & Pick<Luta, 'id' | 'rodada' | 'ordem'>): Luta {
  return {
    lado: null,
    final: false,
    azul: null,
    branco: null,
    status: 'aguardando',
    vencedor: null,
    metodo: null,
    destinoVencedor: null,
    destinoPerdedor: null,
    ...parcial,
  };
}

function gerarMelhorDeTres([a, b]: AtletaChave[]): Chave {
  const lutas = [1, 2, 3].map((n) =>
    novaLuta({ id: `m3-${n}`, rodada: n, ordem: 1, azul: a.id, branco: b.id, status: n === 1 ? 'pronta' : 'aguardando' })
  );
  return { formato: 'melhor-de-3', tamanho: 2, totalRodadas: 3, atletas: [a, b], lutas, avisos: [] };
}

function gerarChaveDeTres(atletas: AtletaChave[]): Chave {
  // Os dois de nível mais próximo fazem a 1ª luta; o terceiro espera.
  const [x, y, z] = atletas;
  const primeiraEntre01 = y.nivel - x.nivel <= z.nivel - y.nivel;
  const [p1, p2, espera] = primeiraEntre01 ? [x, y, z] : [y, z, x];

  const lutas = [
    novaLuta({
      id: 'c3-1', rodada: 1, ordem: 1, azul: p1.id, branco: p2.id, status: 'pronta',
      destinoVencedor: { lutaId: 'final', cor: 'azul' },
      destinoPerdedor: { lutaId: 'c3-2', cor: 'azul' },
    }),
    novaLuta({
      id: 'c3-2', rodada: 2, ordem: 1, branco: espera.id,
      destinoVencedor: { lutaId: 'final', cor: 'branco' },
    }),
    novaLuta({ id: 'final', rodada: 3, ordem: 1, final: true }),
  ];
  return { formato: 'chave-de-3', tamanho: 3, totalRodadas: 3, atletas, lutas, avisos: [] };
}

function gerarEliminatoria(atletas: AtletaChave[]): Chave {
  const n = atletas.length;
  const tamanho = proximaPotenciaDe2(n);
  const porLado = tamanho / 2;
  const rodadasLado = Math.log2(porLado);
  const metade = Math.ceil(n / 2);
  const lados: Record<Lado, AtletaChave[]> = { A: atletas.slice(0, metade), B: atletas.slice(metade) };

  const lutas: Luta[] = [];
  (['A', 'B'] as const).forEach((lado) => {
    const gente = lados[lado];
    const byes = porLado - gente.length;

    const pares = paresDaPrimeiraRodada(gente, porLado - gente.length);

    for (let rodada = 1; rodada <= rodadasLado; rodada++) {
      const qtd = porLado / 2 ** rodada;
      for (let ordem = 1; ordem <= qtd; ordem++) {
        const ultimaDoLado = rodada === rodadasLado;
        const par = rodada === 1 ? pares[ordem - 1] : null;
        lutas.push(
          novaLuta({
            id: idLuta(lado, rodada, ordem),
            rodada,
            ordem,
            lado,
            azul: par ? par[0].id : null,
            branco: par && par[1] ? par[1].id : null,
            destinoVencedor: ultimaDoLado
              ? { lutaId: 'final', cor: lado === 'A' ? 'azul' : 'branco' }
              : { lutaId: idLuta(lado, rodada + 1, Math.ceil(ordem / 2)), cor: ordem % 2 === 1 ? 'azul' : 'branco' },
          })
        );
      }
    }
  });
  lutas.push(novaLuta({ id: 'final', rodada: rodadasLado + 1, ordem: 1, final: true }));

  let chave: Chave = {
    formato: 'eliminatoria',
    tamanho,
    totalRodadas: rodadasLado + 1,
    atletas,
    lutas,
    avisos: [],
  };

  // Resolve os byes: quem está sozinho avança direto.
  for (const luta of chave.lutas.filter((l) => l.rodada === 1 && l.azul && !l.branco)) {
    chave = avancar(chave, luta.id, luta.azul!, null, 'bye');
  }
  chave = atualizarProntas(chave);

  const totalByes = tamanho - n;
  if (totalByes > tamanho / 4) {
    chave.avisos.push(
      `${totalByes} de ${n} atletas passam direto na 1ª rodada. ` +
        `Com ${tamanho / 2 + 1} a ${tamanho} inscritos a chave fica mais equilibrada.`
    );
  }
  return chave;
}

/**
 * 1ª rodada de um lado. Sem garotas: byes para os menores níveis e o resto em
 * pares de vizinhos de nível. Com garotas: elas vêm primeiro e se enfrentam
 * entre si; os byes são distribuídos para que sobre um número par delas (assim
 * nenhuma precisa cair com um garoto na 1ª rodada). Como os pares das garotas
 * ficam lado a lado, elas continuam se cruzando nas rodadas seguintes até
 * acabarem; só então encontram os garotos.
 */
function paresDaPrimeiraRodada(gente: AtletaChave[], byes: number): [AtletaChave, AtletaChave | null][] {
  const garotas = gente.filter(ehGarota);
  const garotos = gente.filter((a) => !ehGarota(a));

  let byesGarotas = Math.min(byes, garotas.length % 2);
  let byesGarotos = byes - byesGarotas;
  if (byesGarotos > garotos.length) {
    byesGarotas += byesGarotos - garotos.length;
    byesGarotos = garotos.length;
  }

  const pares: [AtletaChave, AtletaChave | null][] = [];
  const juntar = (lista: AtletaChave[]) => {
    for (let i = 0; i + 1 < lista.length; i += 2) pares.push([lista[i], lista[i + 1]]);
    return lista.length % 2 ? lista[lista.length - 1] : null;
  };

  garotas.slice(0, byesGarotas).forEach((a) => pares.push([a, null]));
  const sobraGarota = juntar(garotas.slice(byesGarotas));
  const restoGarotos = garotos.slice(byesGarotos);
  // Se ainda sobrar uma garota, ela pega o garoto de menor nível.
  const garotosPareados = sobraGarota && restoGarotos.length ? (pares.push([sobraGarota, restoGarotos[0]]), restoGarotos.slice(1)) : restoGarotos;
  garotos.slice(0, byesGarotos).forEach((a) => pares.push([a, null]));
  juntar(garotosPareados);
  return pares;
}

function idLuta(lado: Lado, rodada: number, ordem: number) {
  return `${lado}-${rodada}-${ordem}`;
}

export function proximaPotenciaDe2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ─── Resultados ───────────────────────────────────────────────────────────────

export function registrarResultado(
  chave: Chave,
  lutaId: string,
  vencedorId: string,
  metodo: MetodoVitoria
): Chave {
  const luta = buscarLuta(chave, lutaId);
  if (luta.status !== 'pronta' && luta.status !== 'em_andamento') {
    throw new ErroChave('Essa luta não está pronta para receber resultado');
  }
  if (vencedorId !== luta.azul && vencedorId !== luta.branco) {
    throw new ErroChave('O vencedor precisa ser um dos dois atletas da luta');
  }

  const perdedorId = vencedorId === luta.azul ? luta.branco : luta.azul;
  let proxima = avancar(chave, lutaId, vencedorId, metodo, 'finalizada', perdedorId);
  if (proxima.formato === 'melhor-de-3') proxima = sequenciarMelhorDeTres(proxima);
  return atualizarProntas(proxima);
}

/**
 * Desfaz o resultado de uma luta. Só é permitido enquanto as lutas que
 * receberam o vencedor/perdedor ainda não começaram.
 */
export function desfazerResultado(chave: Chave, lutaId: string): Chave {
  const luta = buscarLuta(chave, lutaId);
  if (luta.status !== 'finalizada') throw new ErroChave('Só é possível desfazer uma luta finalizada');

  const proxima = clonar(chave);
  const alvo = buscarLuta(proxima, lutaId);
  const destinos = [alvo.destinoVencedor, alvo.destinoPerdedor].filter((d): d is Destino => d !== null);

  for (const destino of destinos) {
    const seguinte = buscarLuta(proxima, destino.lutaId);
    if (seguinte.status === 'em_andamento' || seguinte.status === 'finalizada') {
      throw new ErroChave('A luta seguinte já começou; desfaça ela primeiro');
    }
    seguinte[destino.cor] = null;
    seguinte.status = 'aguardando';
  }

  if (proxima.formato === 'melhor-de-3') {
    const posteriores = proxima.lutas.filter((l) => l.rodada > alvo.rodada);
    if (posteriores.some((l) => l.status === 'finalizada' || l.status === 'em_andamento')) {
      throw new ErroChave('A luta seguinte já começou; desfaça ela primeiro');
    }
    posteriores.forEach((l) => (l.status = 'aguardando'));
  }

  if (alvo.metodo === 'wo') {
    // Desfazer um W.O. traz o ausente de volta.
    const ausente = alvo.vencedor === alvo.azul ? alvo.branco : alvo.azul;
    proxima.desistentes = (proxima.desistentes ?? []).filter((id) => id !== ausente);
  }
  alvo.status = 'pronta';
  alvo.vencedor = null;
  alvo.metodo = null;
  return atualizarProntas(proxima);
}

/** Marca o início de uma luta (usado pelo modo tatame). */
export function iniciarLuta(chave: Chave, lutaId: string): Chave {
  const luta = buscarLuta(chave, lutaId);
  if (luta.status !== 'pronta') throw new ErroChave('Essa luta não está pronta para começar');
  if (chave.lutas.some((l) => l.status === 'proposta' && l.destinoVencedor?.lutaId === lutaId)) {
    throw new ErroChave('Há um desafio de entrada esperando resposta para essa luta');
  }
  const proxima = clonar(chave);
  buscarLuta(proxima, lutaId).status = 'em_andamento';
  return proxima;
}

/**
 * W.O.: o atleta ausente perde sem luta e é marcado como desistente.
 * Não conta para o desempenho nem para o ranking.
 */
export function registrarWO(chave: Chave, lutaId: string, ausenteId: string): Chave {
  const luta = buscarLuta(chave, lutaId);
  if (luta.status !== 'pronta') throw new ErroChave('W.O. só pode ser dado numa luta pronta que ainda não começou');
  if (ausenteId !== luta.azul && ausenteId !== luta.branco) {
    throw new ErroChave('O ausente precisa ser um dos dois atletas da luta');
  }
  const presente = ausenteId === luta.azul ? luta.branco! : luta.azul!;
  let proxima = avancar(chave, lutaId, presente, 'wo', 'finalizada', ausenteId);
  proxima = { ...proxima, desistentes: [...(proxima.desistentes ?? []), ausenteId] };
  if (proxima.formato === 'melhor-de-3') proxima = sequenciarMelhorDeTres(proxima);
  return atualizarProntas(proxima);
}

function avancar(
  chave: Chave,
  lutaId: string,
  vencedorId: string,
  metodo: MetodoLuta | null,
  status: 'finalizada' | 'bye',
  perdedorId: string | null = null
): Chave {
  const proxima = clonar(chave);
  const luta = buscarLuta(proxima, lutaId);
  luta.status = status;
  luta.vencedor = vencedorId;
  luta.metodo = metodo;

  if (luta.destinoVencedor) buscarLuta(proxima, luta.destinoVencedor.lutaId)[luta.destinoVencedor.cor] = vencedorId;
  if (luta.destinoPerdedor && perdedorId) {
    buscarLuta(proxima, luta.destinoPerdedor.lutaId)[luta.destinoPerdedor.cor] = perdedorId;
  }
  return proxima;
}

function atualizarProntas(chave: Chave): Chave {
  for (const luta of chave.lutas) {
    if (luta.status === 'aguardando' && luta.azul && luta.branco && chave.formato !== 'melhor-de-3') {
      luta.status = 'pronta';
    }
  }
  return chave;
}

function sequenciarMelhorDeTres(chave: Chave): Chave {
  const [a, b] = chave.atletas.map((x) => x.id);
  const vitorias = (id: string) => chave.lutas.filter((l) => l.status === 'finalizada' && l.vencedor === id).length;
  const decidido = vitorias(a) >= 2 || vitorias(b) >= 2;

  let liberouProxima = false;
  for (const luta of chave.lutas) {
    if (luta.status !== 'aguardando') continue;
    if (decidido) luta.status = 'cancelada';
    else if (!liberouProxima) {
      luta.status = 'pronta';
      liberouProxima = true;
    }
  }
  return chave;
}

// ─── Consultas ────────────────────────────────────────────────────────────────

export function buscarLuta(chave: Chave, lutaId: string): Luta {
  const luta = chave.lutas.find((l) => l.id === lutaId);
  if (!luta) throw new ErroChave('Luta não encontrada', true);
  return luta;
}

/** Lutas prontas na ordem em que devem ir ao tatame (rodada, lado A, ordem). */
export function filaDeLutas(chave: Chave): Luta[] {
  return chave.lutas
    .filter((l) => l.status === 'pronta')
    .sort(
      (x, y) =>
        x.rodada - y.rodada ||
        // Desafio de entrada vai antes da luta que ele alimenta.
        Number(y.tipo === 'desafio') - Number(x.tipo === 'desafio') ||
        (x.lado ?? '').localeCompare(y.lado ?? '') ||
        x.ordem - y.ordem
    );
}

export function classificacao(chave: Chave): Classificacao | null {
  if (chave.formato === 'melhor-de-3') {
    const [a, b] = chave.atletas.map((x) => x.id);
    const vitorias = (id: string) => chave.lutas.filter((l) => l.status === 'finalizada' && l.vencedor === id).length;
    if (vitorias(a) >= 2) return { campeao: a, vice: b, terceiros: [] };
    if (vitorias(b) >= 2) return { campeao: b, vice: a, terceiros: [] };
    return null;
  }

  const final = buscarLuta(chave, 'final');
  if (final.status !== 'finalizada' || !final.vencedor) return null;
  const vice = final.vencedor === final.azul ? final.branco! : final.azul!;

  const perdedor = (l: Luta) => (l.vencedor === l.azul ? l.branco : l.azul);
  const terceiros =
    chave.formato === 'chave-de-3'
      ? [perdedor(buscarLuta(chave, 'c3-2'))]
      : chave.lutas.filter((l) => l.destinoVencedor?.lutaId === 'final' && l.status === 'finalizada').map(perdedor);

  return { campeao: final.vencedor, vice, terceiros: terceiros.filter((t): t is string => !!t) };
}

/** Nome da rodada para exibir ("Oitavas", "Semifinal"...). */
export function nomeRodada(chave: Chave, rodada: number): string {
  if (chave.formato === 'melhor-de-3') return `Luta ${rodada}`;
  if (chave.formato === 'chave-de-3') return rodada === 3 ? 'Final' : 'Semifinal';
  const vagas = chave.tamanho / 2 ** (rodada - 1);
  const nomes: Record<number, string> = { 2: 'Final', 4: 'Semifinal', 8: 'Quartas', 16: 'Oitavas', 32: '16 avos' };
  return nomes[vagas] ?? `Rodada ${rodada}`;
}

// ─── Regra especial da final ─────────────────────────────────────────────────

export type PosicaoInicial = 'em-pe' | 'dentro-da-guarda' | 'cem-quilos' | 'montada';

export type RegraFinal = {
  posicao: PosicaoInicial;
  diferenca: number;
  /** Atleta de maior nível. */
  maisForte: string;
  /** Atleta de menor nível. */
  maisFraco: string;
  /** O mais fraco entrou atrasado: perde o direito à compensação. */
  semCompensacao: boolean;
};

/** Faixas de diferença de nível → posição inicial (limites inclusivos). */
export const ESCALA_REGRA_FINAL: { ate: number; posicao: PosicaoInicial }[] = [
  { ate: 3, posicao: 'em-pe' },
  { ate: 8, posicao: 'dentro-da-guarda' },
  { ate: 14, posicao: 'cem-quilos' },
  { ate: Infinity, posicao: 'montada' },
];

export function posicaoPorDiferenca(diferenca: number): PosicaoInicial {
  return ESCALA_REGRA_FINAL.find((e) => diferenca <= e.ate)!.posicao;
}

/** Regra da final quando os dois finalistas já são conhecidos. */
export function regraEspecialFinal(chave: Chave): RegraFinal | null {
  if (chave.formato === 'melhor-de-3') return null;
  const final = buscarLuta(chave, 'final');
  if (!final.azul || !final.branco) return null;

  const nivel = (id: string) => chave.atletas.find((a) => a.id === id)!.nivel;
  const [maisFraco, maisForte] =
    nivel(final.azul) <= nivel(final.branco) ? [final.azul, final.branco] : [final.branco, final.azul];
  const diferenca = Math.round((nivel(maisForte) - nivel(maisFraco)) * 10) / 10;
  const semCompensacao = !!chave.atletas.find((a) => a.id === maisFraco)?.atrasado;
  return {
    posicao: semCompensacao ? 'em-pe' : posicaoPorDiferenca(diferenca),
    diferenca,
    maisForte,
    maisFraco,
    semCompensacao,
  };
}

/** Frase curta para o card da final. */
export function textoRegraFinal(regra: RegraFinal, nomeDe: (id: string) => string): string {
  const fraco = nomeDe(regra.maisFraco);
  const forte = nomeDe(regra.maisForte);
  if (regra.semCompensacao) return `${fraco} chegou depois do sorteio: luta em pé, sem compensação`;
  switch (regra.posicao) {
    case 'em-pe':
      return 'Luta normal, começando em pé';
    case 'dentro-da-guarda':
      return `${forte} começa dentro da guarda de ${fraco}`;
    case 'cem-quilos':
      return `${fraco} começa nos 100 kg`;
    case 'montada':
      return `${fraco} começa com a montada ganha`;
  }
}

function clonar(chave: Chave): Chave {
  return {
    ...chave,
    atletas: chave.atletas.map((a) => ({ ...a })),
    avisos: [...chave.avisos],
    desistentes: [...(chave.desistentes ?? [])],
    lutas: chave.lutas.map((l) => ({
      ...l,
      destinoVencedor: l.destinoVencedor && { ...l.destinoVencedor },
      destinoPerdedor: l.destinoPerdedor && { ...l.destinoPerdedor },
    })),
  };
}
