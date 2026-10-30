'use client';

/**
 * Tela 3b · Chegou alguém.
 * Passo 1: marca uma ou mais pessoas que chegaram.
 * Passo 2: escolhe onde cada uma entra. Se nenhuma luta começou, dá para
 * incluir todo mundo na chave e sortear de novo (com compensação normal).
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import type { OpcoesComNomes } from '@/lib/jiu-jitsu/entradas-servidor';
import type { Lutador } from '@/lib/jiu-jitsu/schemas';
import { CadastroLutador, LinhaLutador } from '../../_components/Lutadores';
import { Aviso, Botao, Carregando, IconeBusca, IconeMais, Rotulo, Tela } from '../../_components/ui';
import { lerParametro, mensagemDe, useApi, useExigirLogin } from '../../_lib/api';
import { nivelTxt } from '../../_lib/formato';

type Escolha =
  | { tipo: 'vaga'; lutaId: string }
  | { tipo: 'desafio'; lutaId: string; cor: 'azul' | 'branco' }
  | { tipo: 'substituir'; ausente: string }
  | { tipo: 'repescagem' };

type Usados = { lutas: Set<string>; ausentes: Set<string> };

const lutaDa = (e: Escolha | null) => (e && (e.tipo === 'vaga' || e.tipo === 'desafio') ? e.lutaId : null);
const ausenteDa = (e: Escolha | null) => (e?.tipo === 'substituir' ? e.ausente : null);

/** O que cada pessoa já "pegou": uma luta (vaga/desafio) ou o lugar de quem saiu. */
function usadosPelosOutros(escolhas: Record<string, Escolha | null>, exceto: string): Usados {
  const u: Usados = { lutas: new Set(), ausentes: new Set() };
  for (const [id, e] of Object.entries(escolhas)) {
    if (id === exceto) continue;
    const l = lutaDa(e);
    const a = ausenteDa(e);
    if (l) u.lutas.add(l);
    if (a) u.ausentes.add(a);
  }
  return u;
}

function vagasLivres(o: OpcoesComNomes, u: Usados) {
  return o.vagas.filter((v) => v.permitida && !u.lutas.has(v.lutaId));
}
function desafiosLivres(o: OpcoesComNomes, u: Usados) {
  return o.desafios.filter((d) => !u.lutas.has(d.lutaId));
}
function substituicoesLivres(o: OpcoesComNomes, u: Usados) {
  return o.substituicoes.filter((s) => !u.ausentes.has(s.atleta));
}

/** Escolha inicial: a recomendada, se ainda estiver livre; senão a primeira que sobrar. */
function escolhaPadrao(o: OpcoesComNomes, u: Usados): Escolha | null {
  const vaga = vagasLivres(o, u)[0];
  const desafio = desafiosLivres(o, u)[0];
  const ordem: Escolha['tipo'][] = [o.recomendacao, 'vaga', 'desafio', 'repescagem'];
  for (const tipo of ordem) {
    if (tipo === 'vaga' && vaga) return { tipo: 'vaga', lutaId: vaga.lutaId };
    if (tipo === 'desafio' && desafio) return { tipo: 'desafio', lutaId: desafio.lutaId, cor: desafio.cor };
    if (tipo === 'repescagem' && o.repescagem.aceitaFila) return { tipo: 'repescagem' };
  }
  return null;
}

export default function ChegouPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();
  const voltar = `/jiu-jitsu/lutas/${params.id}`;

  const [det, setDet] = useState<DetalheChave | null>(null);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Lutador[]>([]);
  const [selecionados, setSelecionados] = useState<Lutador[]>([]);
  const [passo, setPasso] = useState<'quem' | 'onde'>('quem');
  const [opcoes, setOpcoes] = useState<Record<string, OpcoesComNomes>>({});
  const [escolhas, setEscolhas] = useState<Record<string, Escolha | null>>({});
  const [incluir, setIncluir] = useState(false);
  const [cadastro, setCadastro] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregarOpcoes = useCallback(
    async (lista: Lutador[]) => {
      setErro(null);
      setOpcoes({});
      setEscolhas({});
      const res = await Promise.allSettled(
        lista.map((l) => api<{ opcoes: OpcoesComNomes }>(`/chaves/${params.id}/entradas?lutador=${l.id}`))
      );
      const ok: Record<string, OpcoesComNomes> = {};
      const falhas: string[] = [];
      res.forEach((r, i) => {
        if (r.status === 'fulfilled') ok[lista[i].id] = r.value.opcoes;
        else falhas.push(`${lista[i].nome}: ${mensagemDe(r.reason)}`);
      });
      const restantes = lista.filter((l) => ok[l.id]);
      // Distribui as escolhas sem duas pessoas pegarem a mesma luta.
      const iniciais: Record<string, Escolha | null> = {};
      for (const l of restantes) iniciais[l.id] = escolhaPadrao(ok[l.id], usadosPelosOutros(iniciais, l.id));
      setSelecionados(restantes);
      setOpcoes(ok);
      setEscolhas(iniciais);
      const primeira = restantes[0] && ok[restantes[0].id];
      setIncluir(!!primeira?.incluir.possivel && primeira.incluir.lugares >= restantes.length);
      if (falhas.length) setErro(falhas.join(' · '));
      if (!restantes.length) setPasso('quem');
    },
    [api, params.id]
  );

  useEffect(() => {
    if (!pronto) return;
    api<{ chave: DetalheChave }>(`/chaves/${params.id}`)
      .then((r) => setDet(r.chave))
      .catch((e) => setErro(mensagemDe(e)));
    // Vindo de outra chave (ex.: a repescagem já sorteada) com ?lutadores=ID,ID
    const ids = (lerParametro('lutadores') ?? lerParametro('lutador') ?? '').split(',').filter(Boolean);
    if (ids.length) {
      Promise.all(ids.map((id) => api<{ lutador: Lutador }>(`/lutadores/${id}`).then((r) => r.lutador)))
        .then((lista) => {
          setPasso('onde');
          return carregarOpcoes(lista);
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, api, params.id]);

  useEffect(() => {
    const q = busca.trim();
    if (!q || !pronto) return setResultados([]);
    const t = setTimeout(() => {
      api<{ lutadores: Lutador[] }>(`/lutadores?q=${encodeURIComponent(q)}`)
        .then((r) => setResultados(r.lutadores.slice(0, 6)))
        .catch((e) => setErro(mensagemDe(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [busca, pronto, api]);

  const naChave = new Set((det?.chave?.lutas ?? []).filter((l) => l.status !== 'recusada').flatMap((l) => [l.azul, l.branco]));
  const marcado = (id: string) => selecionados.some((s) => s.id === id);
  const marcar = (l: Lutador) => {
    setSelecionados((s) => (s.some((x) => x.id === l.id) ? s : [...s, l]));
    setBusca('');
  };
  const desmarcar = (id: string) => setSelecionados((s) => s.filter((x) => x.id !== id));

  const continuar = () => {
    setPasso('onde');
    carregarOpcoes(selecionados);
  };

  const confirmar = async () => {
    setOcupado(true);
    setErro(null);
    if (incluir) {
      try {
        await api(`/chaves/${params.id}/entradas`, { method: 'POST', body: { tipo: 'incluir', lutadorIds: selecionados.map((s) => s.id) } });
        return router.push(voltar);
      } catch (e) {
        setErro(mensagemDe(e));
        return setOcupado(false);
      }
    }
    // Uma pessoa por vez: se alguma falhar, as anteriores já entraram e o resto recarrega.
    const feitos: string[] = [];
    for (const l of selecionados) {
      const escolha = escolhas[l.id];
      if (!escolha) continue;
      try {
        await api(`/chaves/${params.id}/entradas`, { method: 'POST', body: { ...escolha, lutadorId: l.id } });
        feitos.push(l.id);
      } catch (e) {
        const resto = selecionados.filter((s) => !feitos.includes(s.id));
        await carregarOpcoes(resto);
        setErro(`${feitos.length ? `${feitos.length} já entrou(aram). ` : ''}${l.nome}: ${mensagemDe(e)}`);
        return setOcupado(false);
      }
    }
    router.push(voltar);
  };

  // ── Passo 2: onde cada um entra ──
  if (passo === 'onde') {
    const carregando = selecionados.length > 0 && selecionados.some((l) => !opcoes[l.id]) && !erro;
    const n = selecionados.length;
    const info = selecionados[0] && opcoes[selecionados[0].id]?.incluir;
    const cabe = !!info && info.lugares >= n;
    const todosRepescagem = n > 1 && selecionados.every((l) => opcoes[l.id]?.repescagem.aceitaFila);
    const faltaEscolha = !incluir && selecionados.some((l) => !escolhas[l.id]);
    const repescagemSorteada = selecionados.map((l) => opcoes[l.id]?.repescagem.id).find(Boolean);

    return (
      <Tela
        titulo={n === 1 ? `Onde ${selecionados[0].nome} entra?` : `Onde os ${n} entram?`}
        subtitulo={selecionados.map((s) => s.nome).join(', ')}
        voltar={voltar}
        rodape={
          <Botao className="flex-1 min-h-[52px]" disabled={!n || carregando || faltaEscolha || ocupado} onClick={confirmar}>
            {ocupado ? 'Salvando…' : incluir ? 'Incluir e sortear de novo' : n === 1 ? 'Confirmar entrada' : `Confirmar as ${n} entradas`}
          </Botao>
        }
      >
        <button onClick={() => setPasso('quem')} className="self-start text-sm text-stone-400 underline underline-offset-4">
          ← Mudar quem chegou
        </button>
        {carregando && <Carregando />}

        {!carregando && info?.possivel && (
          <div role="radiogroup" aria-label="Como entram" className="flex flex-col gap-2.5">
            <Opcao
              marcada={incluir}
              aoMarcar={cabe ? () => setIncluir(true) : null}
              titulo="Entrar na chave e sortear de novo"
              detalhe="Nenhuma luta começou ainda. Entram como inscritos normais, com compensação, e a chave é refeita."
              etiqueta={cabe ? `Sem desvantagem · cabem mais ${info.lugares}` : `Só cabem mais ${info.lugares} (máx. 30)`}
              tom={cabe ? 'verde' : 'cinza'}
              recomendada={cabe}
            />
            <Opcao
              marcada={!incluir}
              aoMarcar={() => setIncluir(false)}
              titulo="Manter a chave como está"
              detalhe="Cada um entra por vaga, desafio, substituição ou repescagem, sem compensação."
              etiqueta="Escolha abaixo para cada pessoa"
              tom="amarelo"
            />
          </div>
        )}

        {!carregando && !incluir && n > 0 && (
          <>
            <Aviso>
              Chegou depois do sorteio: <strong className="text-white">não recebe compensação</strong>, nem na final.
            </Aviso>
            {todosRepescagem && (
              <button
                onClick={() => setEscolhas(Object.fromEntries(selecionados.map((l) => [l.id, { tipo: 'repescagem' } as Escolha])))}
                className="h-11 rounded-xl border border-stone-700 hover:bg-stone-800 text-sm font-semibold"
              >
                Mandar todos para a repescagem
              </button>
            )}
            {repescagemSorteada && (
              <button
                onClick={() =>
                  router.push(`/jiu-jitsu/lutas/${repescagemSorteada}/chegou?lutadores=${selecionados.map((s) => s.id).join(',')}`)
                }
                className="p-3.5 rounded-2xl border border-stone-700 bg-stone-950 text-left text-sm"
              >
                <span className="block text-[15px] font-bold">Repescagem</span>
                <span className="text-stone-300">Já foi sorteada · entrar por ela →</span>
              </button>
            )}
            {selecionados.map((l) =>
              opcoes[l.id] ? (
                <CartaoPessoa
                  key={l.id}
                  lutador={l}
                  o={opcoes[l.id]}
                  escolha={escolhas[l.id] ?? null}
                  usados={usadosPelosOutros(escolhas, l.id)}
                  aoEscolher={(e) => setEscolhas((x) => ({ ...x, [l.id]: e }))}
                />
              ) : null
            )}
          </>
        )}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
      </Tela>
    );
  }

  // ── Passo 1: quem chegou ──
  const n = selecionados.length;
  return (
    <Tela
      titulo="Chegou alguém"
      subtitulo="Marque todo mundo que chegou"
      voltar={voltar}
      rodape={
        <Botao className="flex-1 min-h-[52px]" disabled={!n} onClick={continuar}>
          {n ? `Continuar com ${n}` : 'Marque quem chegou'}
        </Botao>
      }
    >
      {n > 0 && (
        <section className="flex flex-col gap-2">
          <Rotulo>Chegaram · {n}</Rotulo>
          {selecionados.map((l) => (
            <LinhaLutador
              key={l.id}
              lutador={l}
              acao={
                <button
                  onClick={() => desmarcar(l.id)}
                  aria-label={`Tirar ${l.nome}`}
                  className="w-9 h-9 rounded-lg text-stone-400 hover:bg-stone-800 flex items-center justify-center shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              }
            />
          ))}
        </section>
      )}

      <label className="h-12 flex items-center gap-2.5 px-3.5 rounded-2xl bg-stone-900 border border-stone-700 focus-within:border-red-500">
        <IconeBusca className="w-[18px] h-[18px] text-stone-400" />
        <span className="sr-only">Buscar aluno</span>
        <input
          type="search"
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aluno pelo nome"
          className="flex-1 h-11 bg-transparent outline-none placeholder:text-stone-500"
        />
      </label>
      {resultados
        .filter((l) => !naChave.has(l.id))
        .map((l) => (
          <LinhaLutador
            key={l.id}
            lutador={l}
            aoAbrir={() => marcar(l)}
            acao={
              marcado(l.id) ? (
                <span className="px-2.5 text-xs font-semibold text-green-300">Marcado</span>
              ) : (
                <button
                  onClick={() => marcar(l)}
                  aria-label={`Marcar ${l.nome}`}
                  className="w-11 h-11 rounded-xl bg-red-600 hover:bg-red-500 flex items-center justify-center shrink-0"
                >
                  <IconeMais />
                </button>
              )
            }
          />
        ))}
      {busca.trim() && resultados.length > 0 && resultados.every((l) => naChave.has(l.id)) && (
        <p className="text-sm text-stone-400">Quem tem esse nome já está na chave.</p>
      )}
      <button
        onClick={() => setCadastro(true)}
        className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-stone-600 text-sm"
      >
        <IconeMais className="w-[18px] h-[18px] text-red-400" /> Cadastrar novo lutador
      </button>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <CadastroLutador
        aberta={cadastro}
        nomeInicial={busca.trim()}
        aoFechar={() => setCadastro(false)}
        aoSalvar={(l) => {
          setCadastro(false);
          marcar(l);
        }}
      />
    </Tela>
  );
}

// ─── Peças ───────────────────────────────────────────────────────────────────

function Opcao({
  marcada,
  aoMarcar,
  titulo,
  detalhe,
  etiqueta,
  tom,
  recomendada = false,
}: {
  marcada: boolean;
  aoMarcar: (() => void) | null;
  titulo: string;
  detalhe: string;
  etiqueta: string;
  tom: 'verde' | 'amarelo' | 'cinza';
  recomendada?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={marcada}
      aria-disabled={!aoMarcar}
      onClick={() => aoMarcar?.()}
      className={`flex gap-3 items-start p-3.5 rounded-2xl bg-stone-950 text-left ${
        !aoMarcar ? 'opacity-55 border border-dashed border-stone-700' : marcada ? 'border-2 border-red-500' : 'border border-stone-700'
      }`}
    >
      <span className={`w-5 h-5 mt-0.5 rounded-full shrink-0 ${marcada ? 'border-[6px] border-red-500 bg-white' : 'border-2 border-stone-600'}`} />
      <span className="flex-1 flex flex-col gap-1">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-bold">{titulo}</span>
          {recomendada && <span className="px-2 py-0.5 rounded-full bg-green-950 text-green-300 text-[11px] font-bold">Recomendado</span>}
        </span>
        <span className="text-[13px] text-stone-300">{detalhe}</span>
        <span
          className={`self-start px-2 py-0.5 rounded-lg text-xs font-semibold ${
            tom === 'verde' ? 'bg-green-950 text-green-200' : tom === 'amarelo' ? 'bg-amber-950 text-amber-200' : 'bg-stone-800 text-stone-400'
          }`}
        >
          {etiqueta}
        </span>
      </span>
    </button>
  );
}

const TIPOS: { tipo: Escolha['tipo']; rotulo: string }[] = [
  { tipo: 'vaga', rotulo: 'Vaga' },
  { tipo: 'desafio', rotulo: 'Desafio' },
  { tipo: 'substituir', rotulo: 'Substituir' },
  { tipo: 'repescagem', rotulo: 'Repescagem' },
];

function CartaoPessoa({
  lutador,
  o,
  escolha,
  usados,
  aoEscolher,
}: {
  lutador: Lutador;
  o: OpcoesComNomes;
  escolha: Escolha | null;
  usados: Usados;
  aoEscolher: (e: Escolha) => void;
}) {
  const nome = (id: string) => o.nomes[id] ?? id;
  const vagas = vagasLivres(o, usados);
  const desafios = desafiosLivres(o, usados).slice(0, 5);
  const subs = substituicoesLivres(o, usados);

  const primeiro: Record<Escolha['tipo'], Escolha | null> = {
    vaga: vagas[0] ? { tipo: 'vaga', lutaId: vagas[0].lutaId } : null,
    desafio: desafios[0] ? { tipo: 'desafio', lutaId: desafios[0].lutaId, cor: desafios[0].cor } : null,
    substituir: subs[0] ? { tipo: 'substituir', ausente: subs[0].atleta } : null,
    repescagem: o.repescagem.aceitaFila ? { tipo: 'repescagem' } : null,
  };
  const igual = (e: Escolha) => JSON.stringify(e) === JSON.stringify(escolha);

  const motivo: Record<Escolha['tipo'], string> = {
    vaga: o.vagas.some((v) => v.permitida)
      ? 'A vaga aberta já ficou com outra pessoa que chegou.'
      : o.vagas.length
        ? `Ninguém passando direto com nível perto (diferença acima de 3).`
        : 'Nenhuma vaga de quem passou direto.',
    desafio: o.desafios.length ? 'Os desafios possíveis já foram pegos.' : 'A chave já passou das quartas.',
    substituir: 'Ninguém desistiu.',
    repescagem: o.repescagem.id ? 'A repescagem já foi sorteada.' : 'A repescagem só existe na chave principal.',
  };

  const linha = (key: string, marcada: boolean, aoClicar: () => void, esquerda: React.ReactNode, direita: string) => (
    <button
      key={key}
      onClick={aoClicar}
      aria-pressed={marcada}
      className={`flex justify-between items-center gap-2 min-h-11 px-3 rounded-xl text-sm text-left ${
        marcada ? 'bg-red-950 border border-red-500' : 'bg-stone-900 border border-stone-800'
      }`}
    >
      <span>{esquerda}</span>
      <span className="text-xs text-stone-400 shrink-0">{direita}</span>
    </button>
  );

  return (
    <section className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-stone-900 border border-stone-700">
      <div className="flex justify-between items-center">
        <span className="text-[15px] font-bold">{lutador.nome}</span>
        <span className="px-2 py-0.5 rounded-lg bg-stone-800 text-amber-400 text-[13px] font-bold">{nivelTxt(lutador.nivelSorteio)}</span>
      </div>

      <div role="radiogroup" aria-label={`Como ${lutador.nome} entra`} className="grid grid-cols-4 gap-1.5">
        {TIPOS.map(({ tipo, rotulo }) => {
          const e = primeiro[tipo];
          const ativa = escolha?.tipo === tipo;
          return (
            <button
              key={tipo}
              role="radio"
              aria-checked={ativa}
              disabled={!e}
              onClick={() => e && aoEscolher(e)}
              className={`h-10 rounded-xl text-[12px] font-semibold ${
                ativa ? 'bg-red-600 text-white' : e ? 'bg-stone-950 border border-stone-700 text-stone-200' : 'bg-stone-950 border border-dashed border-stone-800 text-stone-600'
              }`}
            >
              {rotulo}
              {o.recomendacao === tipo && e && !ativa ? ' ★' : ''}
            </button>
          );
        })}
      </div>

      {!escolha && <p className="text-[13px] text-stone-400">Nenhuma forma de entrada disponível agora.</p>}

      {escolha?.tipo === 'vaga' && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-green-300">Sem desvantagem · luta com quem ia passar direto</p>
          {vagas.map((v) =>
            linha(v.lutaId, igual({ tipo: 'vaga', lutaId: v.lutaId }), () => aoEscolher({ tipo: 'vaga', lutaId: v.lutaId }), <>Contra <strong>{nome(v.ocupante)}</strong></>, `dif. ${nivelTxt(v.diferenca)}`)
          )}
        </div>
      )}

      {escolha?.tipo === 'desafio' && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-amber-300">{lutador.nome} começa por baixo, adversário nos 100 kg · o desafiado pode recusar</p>
          {desafios.map((d) =>
            linha(
              `${d.lutaId}-${d.cor}`,
              igual({ tipo: 'desafio', lutaId: d.lutaId, cor: d.cor }),
              () => aoEscolher({ tipo: 'desafio', lutaId: d.lutaId, cor: d.cor }),
              <>Desafiar <strong>{nome(d.desafiado)}</strong> · {d.rodada}</>,
              `dif. ${nivelTxt(d.diferenca)}`
            )
          )}
        </div>
      )}

      {escolha?.tipo === 'substituir' && (
        <div className="flex flex-col gap-1">
          {subs.map((s) =>
            linha(
              s.atleta,
              igual({ tipo: 'substituir', ausente: s.atleta }),
              () => aoEscolher({ tipo: 'substituir', ausente: s.atleta }),
              <><strong>{nome(s.atleta)}</strong> saiu</>,
              `${s.rodada}${s.comDesvantagem ? ' · desvantagem' : ''}`
            )
          )}
        </div>
      )}

      {escolha?.tipo === 'repescagem' && (
        <p className="text-xs text-green-300">Entra na repescagem, sorteada quando a 1ª rodada terminar · sem desvantagem</p>
      )}

      {escolha && !primeiro[escolha.tipo] && <p className="text-xs text-red-300">{motivo[escolha.tipo]}</p>}
      {TIPOS.filter(({ tipo }) => !primeiro[tipo] && tipo !== escolha?.tipo).length > 0 && (
        <p className="text-[11px] text-stone-500">
          {TIPOS.filter(({ tipo }) => !primeiro[tipo])
            .map(({ rotulo, tipo }) => `${rotulo}: ${motivo[tipo]}`)
            .join(' ')}
        </p>
      )}
    </section>
  );
}
