'use client';

/**
 * Lutadores da chave, no meio da noite: tirar quem saiu, pôr quem faltou (ou
 * quem já tinha perdido) e sortear só o que falta. As lutas feitas ficam no
 * histórico. Com 1 saindo e 1 entrando, dá para só trocar no lugar.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { AtletaSnapshot, DetalheChave } from '@/lib/jiu-jitsu/chaves';
import { bloqueioReorganizar, situacaoDosAtletas } from '@/lib/jiu-jitsu/reorganizar';
import { MAX_ATLETAS_CHAVE, type Lutador } from '@/lib/jiu-jitsu/schemas';
import { LinhaLutador } from '../../_components/Lutadores';
import { SeletorLutadores } from '../../_components/SeletorLutadores';
import { Aviso, Botao, Carregando, Folha, Rotulo, Tela } from '../../_components/ui';
import { mensagemDe, useApi, useExigirLogin } from '../../_lib/api';

const comoLinha = (a: AtletaSnapshot) => ({ ...a, nivelSorteio: a.nivel });

export default function ReorganizarPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { pronto } = useExigirLogin();
  const api = useApi();
  const voltar = `/jiu-jitsu/lutas/${params.id}`;

  const [det, setDet] = useState<DetalheChave | null>(null);
  const [saem, setSaem] = useState<Set<string>>(new Set());
  const [entram, setEntram] = useState<Lutador[]>([]);
  const [confirmar, setConfirmar] = useState<'sortear' | 'trocar' | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!pronto) return;
    api<{ chave: DetalheChave }>(`/chaves/${params.id}`)
      .then((r) => setDet(r.chave))
      .catch((e) => setErro(mensagemDe(e)));
  }, [pronto, api, params.id]);

  const situacao = useMemo(() => (det?.chave ? situacaoDosAtletas(det.chave) : {}), [det]);
  const vivos = useMemo(
    () => (det?.atletas ?? []).filter((a) => situacao[a.id] === 'na_disputa').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [det, situacao]
  );

  if (!det) {
    return (
      <Tela titulo="Lutadores da chave" voltar={voltar}>
        {erro ? <Aviso tipo="erro">{erro}</Aviso> : <Carregando />}
      </Tela>
    );
  }

  const bloqueio = bloqueioReorganizar(det);
  const manter = vivos.filter((a) => !saem.has(a.id));
  const total = manter.length + entram.length;
  const mudou = saem.size > 0 || entram.length > 0;
  const lutasFeitas = (det.chave?.lutas.filter((l) => l.status === 'finalizada').length ?? 0) + det.fasesAnteriores.length;

  // Troca direta: 1 sai, 1 entra, e quem sai tem uma luta que ainda não começou.
  const naChave = new Set((det.chave?.lutas ?? []).filter((l) => l.status !== 'recusada').flatMap((l) => [l.azul, l.branco]));
  const quemSai = saem.size === 1 ? [...saem][0] : null;
  const quemEntra = entram.length === 1 ? entram[0] : null;
  const lutaDaTroca =
    quemSai && quemEntra && !naChave.has(quemEntra.id)
      ? det.chave?.lutas.find((l) => (l.status === 'aguardando' || l.status === 'pronta') && (l.azul === quemSai || l.branco === quemSai))
      : undefined;
  const nomeRodada = (n: number) => det.rodadas.find((r) => r.numero === n)?.nome ?? `Rodada ${n}`;
  const nome = (id: string) => det.atletas.find((a) => a.id === id)?.nome ?? '';

  const alternarSaida = (id: string) =>
    setSaem((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const alternarEntrada = (l: Lutador) =>
    setEntram((x) => (x.some((i) => i.id === l.id) ? x.filter((i) => i.id !== l.id) : [...x, l]));

  const executar = async () => {
    setOcupado(true);
    setErro(null);
    try {
      if (confirmar === 'trocar' && quemSai && quemEntra) {
        await api(`/chaves/${det.id}/entradas`, { method: 'POST', body: { tipo: 'substituir', lutadorId: quemEntra.id, ausente: quemSai } });
      } else {
        await api(`/chaves/${det.id}/reorganizar`, {
          method: 'POST',
          body: { manter: manter.map((a) => a.id), novos: entram.map((l) => l.id) },
        });
      }
      router.push(voltar);
    } catch (e) {
      setErro(mensagemDe(e));
      setConfirmar(null);
      setOcupado(false);
    }
  };

  // Na lista de adicionar: quem está na disputa não aparece como opção.
  const indisponiveis = Object.fromEntries(vivos.map((a) => [a.id, 'na disputa']));

  return (
    <Tela
      titulo="Lutadores da chave"
      subtitulo={det.nome}
      voltar={voltar}
      rodape={
        <div className="flex-1 flex flex-col gap-2">
          {mudou && (
            <p className="text-center text-[13px] text-stone-400">
              {saem.size > 0 && `Saem ${saem.size}`}
              {saem.size > 0 && entram.length > 0 && ' · '}
              {entram.length > 0 && `Entram ${entram.length}`} · ficam {total} na disputa
            </p>
          )}
          <div className="flex gap-2">
            {lutaDaTroca && (
              <Botao variante="secundario" className="flex-1" disabled={!!bloqueio || ocupado} onClick={() => setConfirmar('trocar')}>
                Só trocar
              </Botao>
            )}
            <Botao
              className="flex-[1.4] min-h-[52px]"
              disabled={!mudou || !!bloqueio || total < 2 || total > MAX_ATLETAS_CHAVE || ocupado}
              onClick={() => setConfirmar('sortear')}
            >
              {!mudou ? 'Marque quem sai ou entra' : total < 2 ? 'Precisa de 2 ou mais' : 'Sortear o que falta'}
            </Botao>
          </div>
        </div>
      }
    >
      {bloqueio && <Aviso tipo="erro">{bloqueio}</Aviso>}

      <section className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <Rotulo>Na disputa · {vivos.length}</Rotulo>
          <span className="text-xs text-stone-500">toque no ✕ de quem saiu</span>
        </div>
        {vivos.map((a) => {
          const sai = saem.has(a.id);
          return (
            <div key={a.id} className={sai ? 'opacity-50' : ''}>
              <LinhaLutador
                lutador={comoLinha(a)}
                acao={
                  sai ? (
                    <button
                      onClick={() => alternarSaida(a.id)}
                      className="h-11 px-3 rounded-xl bg-red-950 border border-red-800 text-red-200 text-xs font-bold shrink-0"
                    >
                      Saiu · voltar
                    </button>
                  ) : (
                    <button
                      onClick={() => alternarSaida(a.id)}
                      aria-label={`${a.nome} saiu`}
                      className="w-11 h-11 rounded-xl text-stone-400 hover:bg-stone-800 flex items-center justify-center shrink-0"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  )
                }
              />
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-2">
        <Rotulo>Adicionar · quem faltou ou quer voltar</Rotulo>
        <SeletorLutadores
          selecionados={new Set(entram.map((l) => l.id))}
          aoAlternar={alternarEntrada}
          indisponiveis={indisponiveis}
          cheio={total >= MAX_ATLETAS_CHAVE}
          rotuloMarcado="Entra"
        />
      </section>

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <Folha
        aberta={confirmar === 'sortear'}
        aoFechar={() => setConfirmar(null)}
        titulo="Sortear o que falta?"
        subtitulo={`Uma chave nova com ${total} lutadores.`}
      >
        <div className="flex flex-col gap-2 text-sm text-stone-300">
          {lutasFeitas > 0 && (
            <p>
              As <strong className="text-white">{lutasFeitas} luta(s) já feitas</strong> ficam no histórico e contam no ranking.
            </p>
          )}
          {saem.size > 0 && <p>Saem: {[...saem].map(nome).join(', ')}.</p>}
          {entram.length > 0 && <p>Entram: {entram.map((l) => l.nome).join(', ')}.</p>}
          <p className="text-stone-400">Quem entra agora entra com a compensação normal do sorteio.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Botao variante="secundario" onClick={() => setConfirmar(null)}>Cancelar</Botao>
          <Botao onClick={executar} disabled={ocupado}>{ocupado ? 'Sorteando…' : 'Sortear'}</Botao>
        </div>
      </Folha>

      <Folha
        aberta={confirmar === 'trocar'}
        aoFechar={() => setConfirmar(null)}
        titulo="Só trocar?"
        subtitulo="A chave continua igual; só muda quem luta."
      >
        {quemSai && quemEntra && lutaDaTroca && (
          <div className="flex flex-col gap-2 text-sm text-stone-300">
            <p>
              <strong className="text-white">{quemEntra.nome}</strong> entra no lugar de <strong className="text-white">{nome(quemSai)}</strong> na{' '}
              {nomeRodada(lutaDaTroca.rodada).toLowerCase()}.
            </p>
            {lutaDaTroca.rodada > 1 && (
              <p className="text-amber-300">Como pula rodada, {quemEntra.nome} começa em desvantagem (adversário nos 100 kg).</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Botao variante="secundario" onClick={() => setConfirmar(null)}>Cancelar</Botao>
          <Botao onClick={executar} disabled={ocupado}>{ocupado ? 'Trocando…' : 'Trocar'}</Botao>
        </div>
      </Folha>
    </Tela>
  );
}
