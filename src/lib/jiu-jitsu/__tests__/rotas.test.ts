import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirestoreFalso } from './firestore-falso';

const estado = vi.hoisted(() => ({ db: null as unknown }));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: () => estado.db,
  adminAuth: () => ({
    // Token "token-<uid>" é válido para o usuário <uid>.
    verifyIdToken: async (token: string) => {
      if (!token.startsWith('token-')) throw new Error('inválido');
      return { uid: token.slice('token-'.length) };
    },
  }),
}));

const lutadores = await import('@/app/api/jiu-jitsu/lutadores/route');
const lutador = await import('@/app/api/jiu-jitsu/lutadores/[id]/route');
const chaves = await import('@/app/api/jiu-jitsu/chaves/route');
const chave = await import('@/app/api/jiu-jitsu/chaves/[id]/route');
const sortear = await import('@/app/api/jiu-jitsu/chaves/[id]/sortear/route');
const resultado = await import('@/app/api/jiu-jitsu/chaves/[id]/lutas/[lutaId]/resultado/route');
const iniciar = await import('@/app/api/jiu-jitsu/chaves/[id]/lutas/[lutaId]/iniciar/route');

function req(url: string, init: { method?: string; body?: unknown; uid?: string | null } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.uid !== null) headers.authorization = `Bearer token-${init.uid ?? 'joao'}`;
  return new NextRequest(`http://localhost${url}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

async function cadastrar(nome: string, extra: Record<string, unknown> = {}, uid = 'joao') {
  const res = await lutadores.POST(req('/api/jiu-jitsu/lutadores', {
    method: 'POST', uid, body: { nome, sexo: 'M', peso: 75, faixa: 'branca', graus: 0, ...extra },
  }));
  return (await res.json()).lutador as { id: string; nivel: number };
}

beforeEach(() => {
  estado.db = new FirestoreFalso();
});

describe('autenticação', () => {
  it('sem token responde 401', async () => {
    const res = await lutadores.GET(req('/api/jiu-jitsu/lutadores', { uid: null }));
    expect(res.status).toBe(401);
  });
});

describe('rotas de lutadores', () => {
  it('cadastra, busca sem acento e edita com histórico', async () => {
    const joao = await cadastrar('João', { faixa: 'azul', graus: 2, peso: 76.5 });
    await cadastrar('Ana');
    expect(joao.nivel).toBe(12.3);

    const busca = await (await lutadores.GET(req('/api/jiu-jitsu/lutadores?q=joao'))).json();
    expect(busca.lutadores.map((l: { nome: string }) => l.nome)).toEqual(['João']);

    const res = await lutador.PATCH(req(`/api/jiu-jitsu/lutadores/${joao.id}`, { method: 'PATCH', body: { graus: 3 } }), { params: { id: joao.id } });
    const editado = (await res.json()).lutador;
    expect(editado.graus).toBe(3);
    expect(editado.nivel).toBe(13.3);
    expect(editado.historico[0].alteracoes).toEqual([{ campo: 'graus', de: 2, para: 3 }]);
  });

  it('recusa graus incompatíveis com a faixa nova', async () => {
    const l = await cadastrar('Pedro', { faixa: 'preta', graus: 6 });
    const res = await lutador.PATCH(req(`/x`, { method: 'PATCH', body: { faixa: 'marrom' } }), { params: { id: l.id } });
    expect(res.status).toBe(400);
  });

  it('não mostra lutador de outro usuário', async () => {
    const l = await cadastrar('Secreto', {}, 'maria');
    const res = await lutador.GET(req(`/x`, { uid: 'joao' }), { params: { id: l.id } });
    expect(res.status).toBe(404);
    const lista = await (await lutadores.GET(req('/api/jiu-jitsu/lutadores', { uid: 'joao' }))).json();
    expect(lista.lutadores).toEqual([]);
  });
});

describe('rotas de chaves', () => {
  it('cria, sorteia, lista e congela os dados dos atletas', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i++) ids.push((await cadastrar(`Aluno ${i}`, { peso: 60 + i * 5 })).id);

    const criada = await (await chaves.POST(req('/api/jiu-jitsu/chaves', { method: 'POST', body: { nome: 'Sexta', inscritos: ids } }))).json();
    expect(criada.chave.status).toBe('rascunho');
    const id = criada.chave.id;

    const sorteada = await (await sortear.POST(req(`/x`, { method: 'POST' }), { params: { id } })).json();
    expect(sorteada.chave.status).toBe('sorteada');
    expect(sorteada.chave.atletas).toHaveLength(6);
    expect(sorteada.chave.rodadas.map((r: { nome: string }) => r.nome)).toEqual(['Quartas', 'Semifinal', 'Final']);

    // Editar o lutador depois do sorteio não muda a chave.
    await lutador.PATCH(req(`/x`, { method: 'PATCH', body: { peso: 120 } }), { params: { id: ids[0] } });
    const depois = await (await chave.GET(req(`/x`), { params: { id } })).json();
    expect(depois.chave.atletas.find((a: { id: string }) => a.id === ids[0]).peso).toBe(60);

    const lista = await (await chaves.GET(req('/api/jiu-jitsu/chaves'))).json();
    expect(lista.chaves[0]).toMatchObject({ id, nome: 'Sexta', status: 'sorteada', totalAtletas: 6, rodadaAtual: 'Quartas' });
  });

  it('recusa inscrever lutador de outro usuário', async () => {
    const alheio = await cadastrar('Alheio', {}, 'maria');
    const res = await chaves.POST(req('/api/jiu-jitsu/chaves', { method: 'POST', body: { nome: 'Sexta', inscritos: [alheio.id] } }));
    expect(res.status).toBe(400);
  });

  it('não sorteia com menos de 2 inscritos', async () => {
    const um = await cadastrar('Sozinho');
    const criada = await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'Sexta', inscritos: [um.id] } }))).json();
    const res = await sortear.POST(req(`/x`, { method: 'POST' }), { params: { id: criada.chave.id } });
    expect(res.status).toBe(400);
  });

  it('mudar inscritos desfaz o sorteio', async () => {
    const ids = [await cadastrar('A'), await cadastrar('B'), await cadastrar('C')].map((l) => l.id);
    const id = (await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'S', inscritos: ids.slice(0, 2) } }))).json()).chave.id;
    await sortear.POST(req(`/x`, { method: 'POST' }), { params: { id } });

    const res = await chave.PATCH(req(`/x`, { method: 'PATCH', body: { inscritos: ids } }), { params: { id } });
    const json = await res.json();
    expect(json.chave.status).toBe('rascunho');
    expect(json.chave.chave).toBeNull();
    expect(json.chave.inscritos).toEqual(ids);
  });

  it('exclui chave e responde 404 para quem não é dono', async () => {
    const id = (await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'S' } }))).json()).chave.id;
    expect((await chave.DELETE(req(`/x`, { method: 'DELETE', uid: 'maria' }), { params: { id } })).status).toBe(404);
    expect((await chave.DELETE(req(`/x`, { method: 'DELETE' }), { params: { id } })).status).toBe(204);
    expect((await chave.GET(req(`/x`), { params: { id } })).status).toBe(404);
  });
});

describe('rotas de resultado', () => {
  type Detalhe = {
    status: string;
    fila: string[];
    chave: { lutas: { id: string; azul: string | null; branco: string | null; status: string }[] };
    classificacao: { campeao: string; terceiros: string[] } | null;
    regraFinal: { texto: string } | null;
  };

  async function chaveSorteada(n: number) {
    const ids: string[] = [];
    for (let i = 0; i < n; i++) ids.push((await cadastrar(`Aluno ${i}`, { peso: 60 + i * 8 })).id);
    const id = (await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'Sexta', inscritos: ids } }))).json()).chave.id;
    const det = (await (await sortear.POST(req('/x', { method: 'POST' }), { params: { id } })).json()).chave as Detalhe;
    return { id, det };
  }

  const ctx = (id: string, lutaId: string) => ({ params: { id, lutaId } });
  const luta = (det: Detalhe, lutaId: string) => det.chave.lutas.find((l) => l.id === lutaId)!;

  async function vencer(id: string, det: Detalhe, lutaId: string, cor: 'azul' | 'branco' = 'azul') {
    const res = await resultado.POST(
      req('/x', { method: 'POST', body: { vencedor: luta(det, lutaId)[cor], metodo: 'finalizacao' } }),
      ctx(id, lutaId)
    );
    expect(res.status).toBe(200);
    return (await res.json()).chave as Detalhe;
  }

  it('leva uma chave de 4 do sorteio ao campeão', async () => {
    let { id, det } = await chaveSorteada(4);
    expect(det.fila).toEqual(['A-1-1', 'B-1-1']);

    const inicio = await iniciar.POST(req('/x', { method: 'POST' }), ctx(id, 'A-1-1'));
    expect(inicio.status).toBe(200);
    det = (await (await chave.GET(req('/x'), { params: { id } })).json()).chave;
    expect(det.status).toBe('em_andamento');

    det = await vencer(id, det, 'A-1-1');
    det = await vencer(id, det, 'B-1-1', 'branco');
    expect(det.fila).toEqual(['final']);
    expect(det.regraFinal?.texto).toBeTruthy();

    det = await vencer(id, det, 'final');
    expect(det.status).toBe('encerrada');
    expect(det.classificacao?.terceiros).toHaveLength(2);

    const lista = await (await chaves.GET(req('/api/jiu-jitsu/chaves'))).json();
    expect(lista.chaves[0].campeao).toMatch(/^Aluno /);
  });

  it('com lutas iniciadas, não deixa sortear de novo nem mudar inscritos', async () => {
    const { id } = await chaveSorteada(4);
    await iniciar.POST(req('/x', { method: 'POST' }), ctx(id, 'A-1-1'));
    expect((await sortear.POST(req('/x', { method: 'POST' }), { params: { id } })).status).toBe(409);
    expect((await chave.PATCH(req('/x', { method: 'PATCH', body: { inscritos: [] } }), { params: { id } })).status).toBe(409);
    expect((await chave.DELETE(req('/x', { method: 'DELETE' }), { params: { id } })).status).toBe(409);
  });

  it('desfaz resultado, mas bloqueia se a luta seguinte já começou', async () => {
    let { id, det } = await chaveSorteada(4);
    det = await vencer(id, det, 'A-1-1');
    det = await vencer(id, det, 'B-1-1');

    const desfeito = await resultado.DELETE(req('/x', { method: 'DELETE' }), ctx(id, 'B-1-1'));
    expect(desfeito.status).toBe(200);
    det = (await desfeito.json()).chave;
    expect(luta(det, 'final').branco).toBeNull();

    det = await vencer(id, det, 'B-1-1');
    await iniciar.POST(req('/x', { method: 'POST' }), ctx(id, 'final'));
    expect((await resultado.DELETE(req('/x', { method: 'DELETE' }), ctx(id, 'B-1-1'))).status).toBe(409);
  });

  it('erros de regra viram 409, corpo inválido 400 e luta inexistente 404', async () => {
    const { id, det } = await chaveSorteada(4);
    const naoPronta = await resultado.POST(
      req('/x', { method: 'POST', body: { vencedor: luta(det, 'A-1-1').azul, metodo: 'decisao' } }),
      ctx(id, 'final')
    );
    expect(naoPronta.status).toBe(409);
    const metodoRuim = await resultado.POST(
      req('/x', { method: 'POST', body: { vencedor: luta(det, 'A-1-1').azul, metodo: 'pontos' } }),
      ctx(id, 'A-1-1')
    );
    expect(metodoRuim.status).toBe(400);
    expect((await iniciar.POST(req('/x', { method: 'POST' }), ctx(id, 'nao-existe'))).status).toBe(404);
  });

  it('chave de 3 e melhor de 3 funcionam pelas rotas', async () => {
    let { id, det } = await chaveSorteada(3);
    det = await vencer(id, det, 'c3-1');
    det = await vencer(id, det, 'c3-2');
    det = await vencer(id, det, 'final');
    expect(det.status).toBe('encerrada');

    ({ id, det } = await chaveSorteada(2));
    det = await vencer(id, det, 'm3-1');
    det = await vencer(id, det, 'm3-2');
    expect(det.status).toBe('encerrada');
    expect(luta(det, 'm3-3').status).toBe('cancelada');
  });

  it('não registra resultado em chave de outro usuário', async () => {
    const { id, det } = await chaveSorteada(4);
    const res = await resultado.POST(
      req('/x', { method: 'POST', uid: 'maria', body: { vencedor: luta(det, 'A-1-1').azul, metodo: 'decisao' } }),
      ctx(id, 'A-1-1')
    );
    expect(res.status).toBe(404);
  });
});

describe('rotas do tatame', () => {
  const chamar = () => import('@/app/api/jiu-jitsu/chaves/[id]/lutas/[lutaId]/chamar/route');
  const cronometro = () => import('@/app/api/jiu-jitsu/chaves/[id]/lutas/[lutaId]/cronometro/route');
  const tatame = () => import('@/app/api/jiu-jitsu/chaves/[id]/tatame/route');

  async function chaveDe(n: number) {
    const ids: string[] = [];
    for (let i = 0; i < n; i++) ids.push((await cadastrar(`Aluno ${i}`, { peso: 60 + i * 8 })).id);
    const id = (await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'Sexta', inscritos: ids } }))).json()).chave.id;
    await sortear.POST(req('/x', { method: 'POST' }), { params: { id } });
    return id as string;
  }
  const ctx = (id: string, lutaId: string) => ({ params: { id, lutaId } });

  it('chamar → play → pausar → retomar → resultado libera a área', async () => {
    const id = await chaveDe(8);
    const { POST: chamarPOST } = await chamar();
    const { POST: cronoPOST } = await cronometro();
    const { GET: tatameGET } = await tatame();

    let res = await chamarPOST(req('/x', { method: 'POST', body: { area: 1 } }), ctx(id, 'A-1-1'));
    let estado = (await res.json()).tatame;
    expect(estado.areas[0]).toMatchObject({ fase: 'aguardando', lutaId: 'A-1-1', restanteMs: 300_000 });
    expect(estado.fila).toHaveLength(3);

    estado = (await (await iniciar.POST(req('/x', { method: 'POST' }), ctx(id, 'A-1-1'))).json()).tatame;
    expect(estado.areas[0].fase).toBe('rodando');

    estado = (await (await cronoPOST(req('/x', { method: 'POST', body: { acao: 'pausar' } }), ctx(id, 'A-1-1'))).json()).tatame;
    expect(estado.areas[0].fase).toBe('pausada');
    estado = (await (await cronoPOST(req('/x', { method: 'POST', body: { acao: 'retomar' } }), ctx(id, 'A-1-1'))).json()).tatame;
    expect(estado.areas[0].fase).toBe('rodando');

    const det = (await (await chave.GET(req('/x'), { params: { id } })).json()).chave;
    const vencedor = det.chave.lutas.find((l: { id: string }) => l.id === 'A-1-1').azul;
    await resultado.POST(req('/x', { method: 'POST', body: { vencedor, metodo: 'finalizacao' } }), ctx(id, 'A-1-1'));

    estado = (await (await tatameGET(req('/x'), { params: { id } })).json()).tatame;
    expect(estado.areas[0].fase).toBe('livre');
    expect(estado.areas[0].ultimoResultado.vencedor).toMatch(/^Aluno /);
    expect(typeof estado.agora).toBe('string');
  });

  it('área ocupada responde 409', async () => {
    const id = await chaveDe(8);
    const { POST: chamarPOST } = await chamar();
    await chamarPOST(req('/x', { method: 'POST', body: { area: 1 } }), ctx(id, 'A-1-1'));
    const res = await chamarPOST(req('/x', { method: 'POST', body: { area: 1 } }), ctx(id, 'A-1-2'));
    expect(res.status).toBe(409);
  });

  it('configura áreas e duração, mas não reduz com área ocupada', async () => {
    const id = await chaveDe(8);
    const { POST: chamarPOST } = await chamar();
    let res = await chave.PATCH(req('/x', { method: 'PATCH', body: { tatame: { areas: 4, duracaoSeg: 240 } } }), { params: { id } });
    expect((await res.json()).chave.tatame).toEqual({ areas: 4, duracaoSeg: 240 });

    await chamarPOST(req('/x', { method: 'POST', body: { area: 4 } }), ctx(id, 'A-1-1'));
    res = await chave.PATCH(req('/x', { method: 'PATCH', body: { tatame: { areas: 3, duracaoSeg: 240 } } }), { params: { id } });
    expect(res.status).toBe(409);
  });

  it('tatame de chave não sorteada responde 409', async () => {
    const { GET: tatameGET } = await tatame();
    const id = (await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'S' } }))).json()).chave.id;
    expect((await tatameGET(req('/x'), { params: { id } })).status).toBe(409);
  });
});

describe('desempenho, repescagem, entradas e ranking pelas rotas', () => {
  const entradas = () => import('@/app/api/jiu-jitsu/chaves/[id]/entradas/route');
  const desafio = () => import('@/app/api/jiu-jitsu/chaves/[id]/lutas/[lutaId]/desafio/route');
  const wo = () => import('@/app/api/jiu-jitsu/chaves/[id]/lutas/[lutaId]/wo/route');
  const ranking = () => import('@/app/api/jiu-jitsu/ranking/route');
  const historico = () => import('@/app/api/jiu-jitsu/lutadores/[id]/resultados/route');

  type Det = {
    status: string;
    fila: string[];
    repescagemId: string | null;
    filaRepescagem: string[];
    chave: { lutas: { id: string; azul: string | null; branco: string | null; status: string; emDesvantagem?: string | null }[] };
  };
  const ctx = (id: string, lutaId: string) => ({ params: { id, lutaId } });
  const lutaDe = (d: Det, id: string) => d.chave.lutas.find((l) => l.id === id)!;

  async function montar(n: number) {
    const ids: string[] = [];
    for (let i = 0; i < n; i++) ids.push((await cadastrar(`Aluno ${i}`, { peso: 60 + i * 6 })).id);
    const id = (await (await chaves.POST(req('/x', { method: 'POST', body: { nome: 'Sexta', inscritos: ids } }))).json()).chave.id;
    const det = (await (await sortear.POST(req('/x', { method: 'POST' }), { params: { id } })).json()).chave as Det;
    return { id, det, ids };
  }
  async function vencer(id: string, det: Det, lutaId: string, metodo = 'decisao') {
    const res = await resultado.POST(req('/x', { method: 'POST', body: { vencedor: lutaDe(det, lutaId).azul, metodo } }), ctx(id, lutaId));
    expect(res.status).toBe(200);
    return (await res.json()).chave as Det;
  }
  const lerLutador = async (lid: string) => (await (await lutador.GET(req('/x'), { params: { id: lid } })).json()).lutador;

  it('resultado grava a tabela e mexe no desempenho; desfazer volta tudo', async () => {
    const { id, det } = await montar(8);
    const venc = lutaDe(det, 'A-1-1').azul!;
    const perd = lutaDe(det, 'A-1-1').branco!;
    await vencer(id, det, 'A-1-1', 'finalizacao');

    const v = await lerLutador(venc);
    const p = await lerLutador(perd);
    expect(v.desempenho.lutas).toBe(1);
    expect(v.desempenho.ajuste).toBeGreaterThan(0);
    expect(p.desempenho.ajuste).toBeLessThan(0);
    expect(v.nivelSorteio).toBeCloseTo(v.nivel + v.desempenho.ajuste, 2);

    const { GET } = await historico();
    const hist = (await (await GET(req('/x'), { params: { id: venc } })).json()).lutas;
    expect(hist[0]).toMatchObject({ resultado: 'vitoria', adversarioId: perd, metodo: 'finalizacao', condicao: 'normal' });

    await resultado.DELETE(req('/x', { method: 'DELETE' }), ctx(id, 'A-1-1'));
    expect((await lerLutador(venc)).desempenho).toMatchObject({ ajuste: 0, lutas: 0, vitorias: 0 });
    expect((await (await GET(req('/x'), { params: { id: venc } })).json()).lutas).toEqual([]);
  });

  it('repescagem nasce sozinha quando a 1ª rodada de uma chave de 8 termina', async () => {
    let { id, det } = await montar(8);
    for (const l of ['A-1-1', 'A-1-2', 'B-1-1']) det = await vencer(id, det, l);
    expect(det.repescagemId).toBeNull();
    det = await vencer(id, det, 'B-1-2');
    expect(det.repescagemId).toBeTruthy();

    const rep = (await (await chave.GET(req('/x'), { params: { id: det.repescagemId! } })).json()).chave;
    expect(rep).toMatchObject({ tipo: 'repescagem', principalId: id, status: 'sorteada' });
    expect(rep.atletas).toHaveLength(4);

    // Não dá para desfazer resultado da 1ª rodada depois da repescagem sorteada.
    expect((await resultado.DELETE(req('/x', { method: 'DELETE' }), ctx(id, 'B-1-2'))).status).toBe(409);
  });

  it('atrasado: opções, desafio recusado vai para a fila da repescagem e entra nela depois', async () => {
    let { id, det } = await montar(8);
    const atrasado = (await cadastrar('Atrasado', { peso: 80 })).id;
    const { GET, POST } = await entradas();

    const op = (await (await GET(req(`/api/jiu-jitsu/chaves/${id}/entradas?lutador=${atrasado}`), { params: { id } })).json()).opcoes;
    expect(op.recomendacao).toBe('desafio');
    expect(op.atleta.atrasado).toBe(true);
    const alvo = op.desafios[0];

    det = (await (await POST(req('/x', { method: 'POST', body: { tipo: 'desafio', lutadorId: atrasado, lutaId: alvo.lutaId, cor: alvo.cor } }), { params: { id } })).json()).chave;
    expect(lutaDe(det, 'E-1').status).toBe('proposta');

    const { POST: responder } = await desafio();
    const resp = await (await responder(req('/x', { method: 'POST', body: { aceitar: false } }), ctx(id, 'E-1'))).json();
    expect(resp.foiParaFilaRepescagem).toBe(true);
    expect(resp.chave.filaRepescagem).toEqual([atrasado]);

    // Quando a 1ª rodada acaba, o atrasado está na repescagem, marcado como atrasado.
    det = resp.chave;
    for (const l of ['A-1-1', 'A-1-2', 'B-1-1', 'B-1-2']) det = await vencer(id, det, l);
    const rep = (await (await chave.GET(req('/x'), { params: { id: det.repescagemId! } })).json()).chave;
    expect(rep.atletas).toHaveLength(5);
    expect(rep.atletas.find((a: { id: string }) => a.id === atrasado).atrasado).toBe(true);
  });

  it('desafio aceito: atrasado luta em desvantagem e a condição vai para a tabela', async () => {
    let { id, det } = await montar(8);
    const atrasado = (await cadastrar('Atrasado', { peso: 70 })).id;
    const { POST } = await entradas();
    const alvoLuta = 'A-1-2';
    det = (await (await POST(req('/x', { method: 'POST', body: { tipo: 'desafio', lutadorId: atrasado, lutaId: alvoLuta, cor: 'azul' } }), { params: { id } })).json()).chave;
    const { POST: responder } = await desafio();
    det = (await (await responder(req('/x', { method: 'POST', body: { aceitar: true } }), ctx(id, 'E-1'))).json()).chave;
    expect(lutaDe(det, 'E-1')).toMatchObject({ status: 'pronta', emDesvantagem: atrasado });

    const res = await resultado.POST(req('/x', { method: 'POST', body: { vencedor: atrasado, metodo: 'decisao' } }), ctx(id, 'E-1'));
    det = (await res.json()).chave;
    expect(lutaDe(det, alvoLuta).azul).toBe(atrasado);
    const { GET } = await historico();
    expect((await (await GET(req('/x'), { params: { id: atrasado } })).json()).lutas[0].condicao).toBe('desvantagem');
  });

  it('vaga de quem passou direto e W.O. pelas rotas', async () => {
    const { id, det } = await montar(7); // 1 bye no lado B
    const bye = det.chave.lutas.find((l) => l.status === 'bye')!;
    const { GET, POST } = await entradas();
    // Cadastra alguém com o mesmo físico de quem passou direto.
    const nivelBye = (await lerLutador(bye.azul!)).nivel;
    const parecido = (await cadastrar('Parecido', { peso: 50 + (nivelBye) * 5 })).id;
    const op = (await (await GET(req(`/x?lutador=${parecido}`), { params: { id } })).json()).opcoes;
    expect(op.vagas[0]).toMatchObject({ lutaId: bye.id, permitida: true });

    const depois = (await (await POST(req('/x', { method: 'POST', body: { tipo: 'vaga', lutadorId: parecido, lutaId: bye.id } }), { params: { id } })).json()).chave as Det;
    expect(lutaDe(depois, bye.id)).toMatchObject({ branco: parecido, status: 'pronta' });

    const { POST: woPOST } = await wo();
    const r = await woPOST(req('/x', { method: 'POST', body: { ausente: parecido } }), ctx(id, bye.id));
    expect(r.status).toBe(200);
    expect((await lerLutador(parecido)).desempenho.lutas).toBe(0); // W.O. não conta
  });

  it('ranking pelas rotas', async () => {
    let { id, det } = await montar(4);
    for (const l of ['A-1-1', 'B-1-1']) det = await vencer(id, det, l);
    det = await vencer(id, det, 'final', 'finalizacao');
    expect(det.status).toBe('encerrada');

    const { GET } = await ranking();
    const ano = new Date().getUTCFullYear();
    const r = await (await GET(req(`/api/jiu-jitsu/ranking?ano=${ano}`))).json();
    expect(r.ano).toBe(ano);
    const todos = Object.values(r.faixas).flat() as { pontos: number; podios: number }[];
    expect(todos).toHaveLength(4);
    expect(todos.every((l) => l.podios === 1)).toBe(true);
    expect((await GET(req('/api/jiu-jitsu/ranking?ano=abc'))).status).toBe(400);
  });
});
