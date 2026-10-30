'use client';

/** Tela 3b · Chegou alguém: escolhe o aluno e a forma de entrada na chave. */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { DetalheChave } from '@/lib/jiu-jitsu/chaves';
import type { OpcoesComNomes } from '@/lib/jiu-jitsu/entradas-servidor';
import type { Lutador } from '@/lib/jiu-jitsu/schemas';
import { CadastroLutador, LinhaLutador } from '../../_components/Lutadores';
import { Aviso, Botao, Carregando, IconeBusca, IconeMais, Tela } from '../../_components/ui';
import { lerParametro, mensagemDe, useApi, useExigirLogin } from '../../_lib/api';
import { nivelTxt } from '../../_lib/formato';

type Escolha =
  | { tipo: 'vaga'; lutaId: string }
  | { tipo: 'desafio'; lutaId: string; cor: 'azul' | 'branco' }
  | { tipo: 'substituir'; ausente: string }
  | { tipo: 'repescagem' };

export default function ChegouPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();
  const voltar = `/jiu-jitsu/lutas/${params.id}`;

  const [det, setDet] = useState<DetalheChave | null>(null);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Lutador[]>([]);
  const [lutador, setLutador] = useState<Lutador | null>(null);
  const [opcoes, setOpcoes] = useState<OpcoesComNomes | null>(null);
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [cadastro, setCadastro] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!pronto) return;
    api<{ chave: DetalheChave }>(`/chaves/${params.id}`)
      .then((r) => setDet(r.chave))
      .catch((e) => setErro(mensagemDe(e)));
    // Vindo de outra chave com ?lutador=ID (ex.: atrasado mandado para a repescagem).
    const lid = lerParametro('lutador');
    if (lid) api<{ lutador: Lutador }>(`/lutadores/${lid}`).then((r) => escolherLutador(r.lutador)).catch(() => undefined);
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

  async function escolherLutador(l: Lutador) {
    setErro(null);
    setLutador(l);
    setOpcoes(null);
    setEscolha(null);
    try {
      const { opcoes: o } = await api<{ opcoes: OpcoesComNomes }>(`/chaves/${params.id}/entradas?lutador=${l.id}`);
      setOpcoes(o);
      const vaga = o.vagas.find((v) => v.permitida);
      if (o.recomendacao === 'vaga' && vaga) setEscolha({ tipo: 'vaga', lutaId: vaga.lutaId });
      else if (o.recomendacao === 'desafio' && o.desafios[0]) setEscolha({ tipo: 'desafio', lutaId: o.desafios[0].lutaId, cor: o.desafios[0].cor });
      else if (o.repescagem.aceitaFila) setEscolha({ tipo: 'repescagem' });
    } catch (e) {
      setErro(mensagemDe(e));
      setLutador(null);
    }
  }

  const confirmar = async () => {
    if (!lutador || !escolha) return;
    setOcupado(true);
    setErro(null);
    try {
      await api(`/chaves/${params.id}/entradas`, { method: 'POST', body: { ...escolha, lutadorId: lutador.id } });
      router.push(voltar);
    } catch (e) {
      setErro(mensagemDe(e));
      setOcupado(false);
    }
  };

  const nome = (id: string) => opcoes?.nomes[id] ?? id;
  const opcao = (
    chave: string,
    marcada: boolean,
    aoMarcar: (() => void) | null,
    titulo: string,
    detalhe: string,
    etiqueta: string,
    tom: 'verde' | 'amarelo' | 'cinza',
    recomendada = false
  ) => (
    <button
      key={chave}
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

  // ── Passo 2: onde a pessoa entra ──
  if (lutador) {
    const o = opcoes;
    const vaga = o?.vagas[0];
    const igual = (e: Escolha) => JSON.stringify(e) === JSON.stringify(escolha);
    return (
      <Tela
        titulo={`Onde ${lutador.nome} entra?`}
        subtitulo={`Nível ${nivelTxt(lutador.nivelSorteio)}`}
        voltar={voltar}
        rodape={
          <Botao className="flex-1 min-h-[52px]" disabled={!escolha || ocupado} onClick={confirmar}>
            {escolha?.tipo === 'vaga' ? 'Encaixar na vaga' : escolha?.tipo === 'desafio' ? 'Criar desafio de entrada' : escolha?.tipo === 'substituir' ? 'Confirmar substituição' : 'Colocar na repescagem'}
          </Botao>
        }
      >
        <button onClick={() => setLutador(null)} className="self-start text-sm text-stone-400 underline underline-offset-4">
          ← Escolher outro aluno
        </button>
        <Aviso>
          Chegou depois do sorteio: <strong className="text-white">não recebe compensação</strong>, nem na final.
        </Aviso>
        {!o && !erro && <Carregando />}
        {o && (
          <div role="radiogroup" aria-label="Forma de entrada" className="flex flex-col gap-2.5">
            {vaga
              ? opcao(
                  'vaga',
                  igual({ tipo: 'vaga', lutaId: vaga.lutaId }),
                  vaga.permitida ? () => setEscolha({ tipo: 'vaga', lutaId: vaga.lutaId }) : null,
                  'Vaga de quem passou direto',
                  `Luta com ${nome(vaga.ocupante)}, que passava direto.`,
                  vaga.permitida ? `Diferença ${nivelTxt(vaga.diferenca)} · sem desvantagem` : `Diferença ${nivelTxt(vaga.diferenca)} · acima do limite de 3`,
                  vaga.permitida ? 'verde' : 'cinza',
                  o.recomendacao === 'vaga'
                )
              : opcao('vaga', false, null, 'Vaga de quem passou direto', 'Nenhuma vaga aberta agora.', 'Indisponível', 'cinza')}

            {o.desafios.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {opcao(
                  'desafio',
                  escolha?.tipo === 'desafio',
                  () => setEscolha({ tipo: 'desafio', lutaId: o.desafios[0].lutaId, cor: o.desafios[0].cor }),
                  'Desafio de entrada',
                  'Desafia alguém pela vaga numa luta que ainda não começou. O desafiado pode recusar.',
                  `${lutador.nome} começa por baixo, com o adversário nos 100 kg`,
                  'amarelo',
                  o.recomendacao === 'desafio'
                )}
                {escolha?.tipo === 'desafio' && (
                  <div className="flex flex-col gap-1 pl-8">
                    {o.desafios.slice(0, 5).map((d) => (
                      <button
                        key={`${d.lutaId}-${d.cor}`}
                        onClick={() => setEscolha({ tipo: 'desafio', lutaId: d.lutaId, cor: d.cor })}
                        aria-pressed={igual({ tipo: 'desafio', lutaId: d.lutaId, cor: d.cor })}
                        className={`flex justify-between items-center h-11 px-3 rounded-xl text-sm ${
                          igual({ tipo: 'desafio', lutaId: d.lutaId, cor: d.cor }) ? 'bg-red-950 border border-red-500' : 'bg-stone-900 border border-stone-800'
                        }`}
                      >
                        <span>Desafiar <strong>{nome(d.desafiado)}</strong> · {d.rodada}</span>
                        <span className="text-xs text-stone-400">dif. {nivelTxt(d.diferenca)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              opcao('desafio', false, null, 'Desafio de entrada', 'A chave já passou das quartas.', 'Indisponível', 'cinza')
            )}

            {o.substituicoes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {opcao(
                  'substituir',
                  escolha?.tipo === 'substituir',
                  () => setEscolha({ tipo: 'substituir', ausente: o.substituicoes[0].atleta }),
                  'Substituir quem saiu',
                  'Assume o lugar de quem desistiu, do ponto onde a pessoa parou.',
                  'Em desvantagem se for depois da 1ª rodada',
                  'amarelo'
                )}
                {escolha?.tipo === 'substituir' && (
                  <div className="flex flex-col gap-1 pl-8">
                    {o.substituicoes.map((s) => (
                      <button
                        key={s.atleta}
                        onClick={() => setEscolha({ tipo: 'substituir', ausente: s.atleta })}
                        aria-pressed={igual({ tipo: 'substituir', ausente: s.atleta })}
                        className={`flex justify-between items-center h-11 px-3 rounded-xl text-sm ${
                          igual({ tipo: 'substituir', ausente: s.atleta }) ? 'bg-red-950 border border-red-500' : 'bg-stone-900 border border-stone-800'
                        }`}
                      >
                        <span><strong>{nome(s.atleta)}</strong> saiu</span>
                        <span className="text-xs text-stone-400">{s.rodada}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {o.repescagem.aceitaFila
              ? opcao('repescagem', escolha?.tipo === 'repescagem', () => setEscolha({ tipo: 'repescagem' }), 'Repescagem', 'Entra na repescagem, sorteada quando a 1ª rodada terminar.', 'Sem desvantagem', 'verde', o.recomendacao === 'repescagem')
              : o.repescagem.id && (
                  <button
                    onClick={() => router.push(`/jiu-jitsu/lutas/${o.repescagem.id}/chegou?lutador=${lutador.id}`)}
                    className="p-3.5 rounded-2xl border border-stone-700 bg-stone-950 text-left text-sm"
                  >
                    <span className="block text-[15px] font-bold">Repescagem</span>
                    <span className="text-stone-300">Já foi sorteada · entrar por ela →</span>
                  </button>
                )}
          </div>
        )}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
      </Tela>
    );
  }

  // ── Passo 1: quem chegou ──
  return (
    <Tela titulo="Chegou alguém" subtitulo="A chave continua; ninguém precisa sortear de novo" voltar={voltar}>
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
          <LinhaLutador key={l.id} lutador={l} aoAbrir={() => escolherLutador(l)} />
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
          escolherLutador(l);
        }}
      />
    </Tela>
  );
}
