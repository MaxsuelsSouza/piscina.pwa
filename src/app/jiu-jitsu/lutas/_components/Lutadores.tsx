'use client';

/**
 * Cadastro e ficha do lutador (telas 2b e modal do lutador), com o
 * desempenho aprendido nas lutas.
 */

import { useEffect, useState } from 'react';
import { FAIXAS_JJ, FAIXAS_JJ_LABELS, type FaixaJJ } from '../../_types';
import { composicaoNivel, calcularNivel } from '@/lib/jiu-jitsu/nivel';
import { MAX_GRAUS, type Lutador, type Sexo } from '@/lib/jiu-jitsu/schemas';
import { Aviso, Botao, Faixa, Folha } from './ui';
import { mensagemDe, useApi } from '../_lib/api';
import { COR_FAIXA, METODO_LABEL, dataCurta, faixaTxt, nivelTxt, pesoTxt, tempoTxt } from '../_lib/formato';

type Dados = { nome: string; sexo: Sexo; peso: string; faixa: FaixaJJ; graus: number; nascimento: string };

const VAZIO: Dados = { nome: '', sexo: 'M', peso: '', faixa: 'branca', graus: 0, nascimento: '' };

function pesoNumero(p: string) {
  return parseFloat(p.replace(',', '.'));
}

/** Campos de faixa, graus e peso (usados no cadastro e na edição). */
function CamposFisicos({ dados, mudar }: { dados: Dados; mudar: (d: Partial<Dados>) => void }) {
  const peso = pesoNumero(dados.peso);
  const passo = (d: number) => {
    const base = isNaN(peso) ? 70 : peso;
    mudar({ peso: String(Math.round((base + d) * 10) / 10).replace('.', ',') });
  };
  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-stone-400 mb-2">Faixa *</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {FAIXAS_JJ.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={dados.faixa === f}
              onClick={() => mudar({ faixa: f, graus: Math.min(dados.graus, MAX_GRAUS[f]) })}
              className={`h-[60px] rounded-xl bg-stone-950 flex flex-col items-center justify-center gap-1.5 text-[11px] ${
                dados.faixa === f ? 'border-2 border-red-500 text-white' : 'border border-stone-700 text-stone-400'
              }`}
            >
              <Faixa faixa={f} className="w-[34px] h-2.5" />
              {FAIXAS_JJ_LABELS[f]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-xs font-medium text-stone-400 mb-1.5">Graus</legend>
        <div className="flex gap-1 p-1 rounded-xl bg-stone-950">
          {Array.from({ length: MAX_GRAUS[dados.faixa] + 1 }, (_, n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={dados.graus === n}
              onClick={() => mudar({ graus: n })}
              className={`flex-1 h-9 rounded-lg text-sm ${dados.graus === n ? 'bg-red-600 font-semibold' : 'text-stone-400'}`}
            >
              {n === 0 ? '0' : `${n}º`}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="jj-peso" className="block text-xs font-medium text-stone-400 mb-1.5">
          Peso (kg) *
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => passo(-0.5)} aria-label="Diminuir peso" className="w-12 h-12 rounded-xl border border-stone-700 bg-stone-950 text-xl">
            −
          </button>
          <input
            id="jj-peso"
            inputMode="decimal"
            value={dados.peso}
            onChange={(e) => mudar({ peso: e.target.value })}
            placeholder="76,5"
            className="flex-1 min-w-0 h-12 px-3 rounded-xl bg-stone-950 border border-stone-700 focus:border-red-500 outline-none text-center text-lg font-semibold"
          />
          <button type="button" onClick={() => passo(0.5)} aria-label="Aumentar peso" className="w-12 h-12 rounded-xl border border-stone-700 bg-stone-950 text-xl">
            +
          </button>
        </div>
      </div>
    </>
  );
}

function CaixaNivel({ dados, titulo = 'Nível calculado' }: { dados: Dados; titulo?: string }) {
  const peso = pesoNumero(dados.peso);
  if (isNaN(peso)) return null;
  const c = composicaoNivel({ faixa: dados.faixa, graus: dados.graus, peso, sexo: dados.sexo });
  return (
    <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-700 flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{titulo}</span>
        <span className="text-[22px] font-bold text-amber-400">{nivelTxt(c.total)}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-xs text-stone-300">
        <span>Faixa <strong className="text-white">{c.faixa >= 0 ? '+' : ''}{nivelTxt(c.faixa)}</strong></span>
        <span>Peso <strong className="text-white">{c.peso >= 0 ? '+' : ''}{nivelTxt(c.peso)}</strong></span>
        <span>Sexo <strong className="text-white">{c.sexo === 0 ? '0' : nivelTxt(c.sexo)}</strong></span>
      </div>
    </div>
  );
}

/** Tela 2b · cadastro de um lutador novo. */
export function CadastroLutador({
  aberta,
  nomeInicial = '',
  aoFechar,
  aoSalvar,
}: {
  aberta: boolean;
  nomeInicial?: string;
  aoFechar: () => void;
  aoSalvar: (l: Lutador, maisUm: boolean) => void;
}) {
  const api = useApi();
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberta) {
      setDados({ ...VAZIO, nome: nomeInicial });
      setErro(null);
    }
  }, [aberta, nomeInicial]);

  const mudar = (d: Partial<Dados>) => setDados((x) => ({ ...x, ...d }));

  const salvar = async (maisUm: boolean) => {
    const peso = pesoNumero(dados.peso);
    if (!dados.nome.trim()) return setErro('Informe o nome.');
    if (isNaN(peso)) return setErro('Informe o peso.');
    setSalvando(true);
    setErro(null);
    try {
      const { lutador } = await api<{ lutador: Lutador }>('/lutadores', {
        method: 'POST',
        body: { nome: dados.nome.trim(), sexo: dados.sexo, peso, faixa: dados.faixa, graus: dados.graus, nascimento: dados.nascimento || null },
      });
      aoSalvar(lutador, maisUm);
      if (maisUm) setDados(VAZIO);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Novo lutador">
      <div>
        <label htmlFor="jj-nome" className="block text-xs font-medium text-stone-400 mb-1.5">Nome *</label>
        <input
          id="jj-nome"
          value={dados.nome}
          onChange={(e) => mudar({ nome: e.target.value })}
          autoFocus
          className="w-full h-11 px-3.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-red-500 outline-none"
        />
      </div>
      <fieldset>
        <legend className="text-xs font-medium text-stone-400 mb-1.5">Sexo *</legend>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-950">
          {(['M', 'F'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={dados.sexo === s}
              onClick={() => mudar({ sexo: s })}
              className={`h-[38px] rounded-lg text-sm ${dados.sexo === s ? 'bg-red-600 font-semibold' : 'text-stone-400'}`}
            >
              {s === 'M' ? 'Masculino' : 'Feminino'}
            </button>
          ))}
        </div>
      </fieldset>
      <CamposFisicos dados={dados} mudar={mudar} />
      <div>
        <label htmlFor="jj-nasc" className="block text-xs font-medium text-stone-400 mb-1.5">Nascimento (opcional)</label>
        <input
          id="jj-nasc"
          type="date"
          value={dados.nascimento}
          onChange={(e) => mudar({ nascimento: e.target.value })}
          className="w-full h-11 px-3.5 rounded-xl bg-stone-950 border border-stone-700 focus:border-red-500 outline-none [color-scheme:dark]"
        />
      </div>
      <CaixaNivel dados={dados} />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <div className="flex gap-2.5">
        <Botao variante="secundario" className="flex-1" disabled={salvando} onClick={() => salvar(true)}>
          Salvar e novo
        </Botao>
        <Botao className="flex-[1.2]" disabled={salvando} onClick={() => salvar(false)}>
          {salvando ? 'Salvando…' : 'Salvar lutador'}
        </Botao>
      </div>
    </Folha>
  );
}

type LutaHistorico = {
  data: string;
  resultado: 'vitoria' | 'derrota';
  adversario: string;
  metodo: 'finalizacao' | 'decisao' | 'wo';
  duracaoSeg: number | null;
  condicao: string;
  deltaAjuste: number;
};

const TENDENCIA = {
  alta: { txt: 'Em alta', cor: 'text-green-400', seta: '↑' },
  estavel: { txt: 'Estável', cor: 'text-stone-300', seta: '→' },
  baixa: { txt: 'Em baixa', cor: 'text-amber-400', seta: '↓' },
} as const;

/** Ficha do lutador: dados, faixa desenhada, nível, desempenho, lutas e edição. */
export function FichaLutador({
  lutador,
  aoFechar,
  aoAtualizar,
}: {
  lutador: Lutador | null;
  aoFechar: () => void;
  aoAtualizar: (l: Lutador) => void;
}) {
  const api = useApi();
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState<Dados>(VAZIO);
  const [lutas, setLutas] = useState<LutaHistorico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!lutador) return;
    setEditando(false);
    setErro(null);
    setLutas(null);
    setDados({
      nome: lutador.nome,
      sexo: lutador.sexo,
      peso: String(lutador.peso).replace('.', ','),
      faixa: lutador.faixa,
      graus: lutador.graus,
      nascimento: lutador.nascimento ?? '',
    });
    api<{ lutas: LutaHistorico[] }>(`/lutadores/${lutador.id}/resultados`)
      .then((r) => setLutas(r.lutas))
      .catch(() => setLutas([]));
  }, [lutador, api]);

  if (!lutador) return null;
  const faixaVisivel = editando ? dados.faixa : lutador.faixa;
  const grausVisiveis = editando ? dados.graus : lutador.graus;
  const tend = TENDENCIA[lutador.tendencia];
  const pesoNovo = pesoNumero(dados.peso);
  const novoNivel = isNaN(pesoNovo) ? null : calcularNivel({ ...dados, peso: pesoNovo }) + lutador.desempenho.ajuste;

  const salvar = async () => {
    if (isNaN(pesoNovo)) return setErro('Peso inválido.');
    setSalvando(true);
    setErro(null);
    try {
      const { lutador: atualizado } = await api<{ lutador: Lutador }>(`/lutadores/${lutador.id}`, {
        method: 'PATCH',
        body: { faixa: dados.faixa, graus: dados.graus, peso: pesoNovo },
      });
      aoAtualizar(atualizado);
      setEditando(false);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Folha aberta aoFechar={aoFechar} titulo={lutador.nome} subtitulo={`${lutador.sexo === 'F' ? 'Feminino' : 'Masculino'} · aluno salvo`}>
      {/* Faixa desenhada, com ponteira e graus */}
      <div aria-hidden="true" className="relative h-[30px] rounded border border-stone-600 overflow-hidden" style={{ background: COR_FAIXA[faixaVisivel] }}>
        <div
          className="absolute right-[14%] inset-y-0 w-[22%] flex justify-end gap-[5px] pr-2"
          style={{ background: faixaVisivel === 'preta' ? '#b91c1c' : '#0c0a09' }}
        >
          {Array.from({ length: grausVisiveis }, (_, i) => (
            <span key={i} className="w-1 h-full bg-stone-100" />
          ))}
        </div>
      </div>

      {!editando ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Faixa', FAIXAS_JJ_LABELS[lutador.faixa]],
              ['Graus', lutador.graus ? `${lutador.graus}º` : 'Nenhum'],
              ['Peso', pesoTxt(lutador.peso)],
            ].map(([r, v]) => (
              <div key={r} className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-400">{r}</span>
                <span className="block text-base font-bold">{v}</span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-700 flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">Nível no sorteio</span>
              <span className="text-2xl font-bold text-amber-400">{nivelTxt(lutador.nivelSorteio)}</span>
            </div>
            <div className="flex justify-between text-xs text-stone-300">
              <span>Físico <strong className="text-white">{nivelTxt(lutador.nivel)}</strong></span>
              <span>
                Desempenho <strong className="text-white">{lutador.desempenho.ajuste >= 0 ? '+' : ''}{nivelTxt(lutador.desempenho.ajuste)}</strong>
              </span>
              <span className={`font-semibold ${tend.cor}`}>
                {tend.seta} {tend.txt}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {lutador.desempenho.lutas} lutas · {lutador.desempenho.vitorias} vitórias
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">Últimas lutas</h3>
            {lutas === null && <div className="h-12 rounded-xl bg-stone-950 animate-pulse" />}
            {lutas?.length === 0 && <p className="text-sm text-stone-400">Ainda não lutou.</p>}
            {lutas?.slice(0, 6).map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800">
                <span className={`text-xs font-bold w-14 ${l.resultado === 'vitoria' ? 'text-green-400' : 'text-stone-400'}`}>
                  {l.resultado === 'vitoria' ? 'Venceu' : 'Perdeu'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate">{l.adversario}</span>
                  <span className="block text-xs text-stone-400">
                    {METODO_LABEL[l.metodo]}
                    {l.duracaoSeg !== null ? ` · ${tempoTxt(l.duracaoSeg * 1000)}` : ''} · {dataCurta(l.data)}
                  </span>
                </span>
                <span className={`text-xs font-bold ${l.deltaAjuste >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {l.deltaAjuste >= 0 ? '+' : ''}
                  {nivelTxt(l.deltaAjuste)}
                </span>
              </div>
            ))}
          </div>

          {lutador.historico.length > 0 && (
            <p className="text-xs text-stone-400">
              Última atualização: {lutador.historico[lutador.historico.length - 1].alteracoes
                .map((a) => (a.campo === 'peso' ? `peso ${a.de} → ${a.para} kg` : a.campo === 'graus' ? `graus ${a.de} → ${a.para}` : `faixa ${a.de} → ${a.para}`))
                .join(', ')}{' '}
              em {dataCurta(lutador.historico[lutador.historico.length - 1].data)}
            </p>
          )}

          <Botao onClick={() => setEditando(true)}>Editar dados</Botao>
        </>
      ) : (
        <>
          <CamposFisicos dados={dados} mudar={(d) => setDados((x) => ({ ...x, ...d }))} />
          {novoNivel !== null && (
            <div className="flex justify-between items-center px-3.5 py-3 rounded-2xl bg-stone-950 border border-stone-700">
              <span className="text-[13px] text-stone-300">Nível no sorteio</span>
              <span className="text-[15px] font-bold">
                <span className="text-stone-400">{nivelTxt(lutador.nivelSorteio)}</span> →{' '}
                <span className="text-amber-400">{nivelTxt(novoNivel)}</span>
              </span>
            </div>
          )}
          <p className="text-xs text-stone-400">Chaves já sorteadas não mudam; vale a partir do próximo sorteio.</p>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className="grid grid-cols-2 gap-2.5">
            <Botao variante="secundario" onClick={() => setEditando(false)} disabled={salvando}>
              Cancelar
            </Botao>
            <Botao variante="sucesso" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </Botao>
          </div>
        </>
      )}
    </Folha>
  );
}

export function LinhaLutador({
  lutador,
  aoAbrir,
  acao,
}: {
  lutador: Pick<Lutador, 'nome' | 'faixa' | 'graus' | 'peso' | 'sexo' | 'nivelSorteio'>;
  aoAbrir?: () => void;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 min-h-[54px] pr-1.5 rounded-2xl bg-stone-900 border border-stone-800">
      <button
        type="button"
        onClick={aoAbrir}
        disabled={!aoAbrir}
        className="flex-1 min-w-0 h-[52px] flex items-center gap-3 pl-3 pr-2 text-left"
      >
        <Faixa faixa={lutador.faixa} />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium truncate">{lutador.nome}</span>
          <span className="block text-xs text-stone-400 truncate">
            {lutador.sexo === 'F' ? 'Fem' : 'Masc'} · {faixaTxt(lutador.faixa, lutador.graus)} · {pesoTxt(lutador.peso)}
          </span>
        </span>
        <span className="min-w-[44px] px-2 py-1 rounded-lg bg-stone-800 text-amber-400 text-[13px] font-bold text-center">
          {nivelTxt(lutador.nivelSorteio)}
        </span>
      </button>
      {acao}
    </div>
  );
}
