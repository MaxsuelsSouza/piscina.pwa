'use client';

/** Confirmação para excluir uma chave em qualquer estado. */

import { useEffect, useState } from 'react';
import type { StatusChave, TipoChave } from '@/lib/jiu-jitsu/chaves';
import { Botao, Folha } from './ui';
import { mensagemDe, useApi } from '../_lib/api';

export function ExcluirChave({
  chave,
  aoFechar,
  aoExcluir,
}: {
  chave: { id: string; nome: string; status: StatusChave; tipo: TipoChave; temRepescagem?: boolean } | null;
  aoFechar: () => void;
  aoExcluir: () => void;
}) {
  const api = useApi();
  const [desfazer, setDesfazer] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setDesfazer(false);
    setErro(null);
  }, [chave?.id]);

  const teveLutas = chave?.status === 'em_andamento' || chave?.status === 'encerrada';

  const excluir = async () => {
    if (!chave) return;
    setOcupado(true);
    setErro(null);
    try {
      await api(`/chaves/${chave.id}${desfazer ? '?desfazer=1' : ''}`, { method: 'DELETE' });
      aoExcluir();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
    }
  };

  const subtitulo = !chave
    ? undefined
    : chave.tipo === 'repescagem'
      ? 'Só a repescagem some. O absoluto continua e não sorteia outra.'
      : `"${chave.nome}"${chave.temRepescagem ? ' e a repescagem dela' : ''} somem. Os lutadores continuam salvos.`;

  return (
    <Folha aberta={!!chave} aoFechar={aoFechar} titulo={chave?.tipo === 'repescagem' ? 'Excluir a repescagem?' : 'Excluir a chave?'} subtitulo={subtitulo}>
      {teveLutas && (
        <button
          role="switch"
          aria-checked={desfazer}
          onClick={() => setDesfazer((v) => !v)}
          className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border ${desfazer ? 'border-red-500 bg-red-950/40' : 'border-stone-700 bg-stone-950'}`}
        >
          <span className={`mt-0.5 w-10 h-6 rounded-full p-0.5 shrink-0 transition ${desfazer ? 'bg-red-600' : 'bg-stone-700'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition ${desfazer ? 'translate-x-4' : ''}`} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">Apagar também as lutas</span>
            <span className="text-[13px] text-stone-400">
              {desfazer
                ? 'As lutas saem do histórico e o nível dos lutadores volta ao que era. Bom para chave de teste.'
                : 'Desligado: as lutas feitas continuam no histórico e no nível de cada lutador.'}
            </span>
          </span>
        </button>
      )}
      {erro && <p className="text-sm text-red-300">{erro}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        <Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao>
        <Botao onClick={excluir} disabled={ocupado}>{ocupado ? 'Excluindo…' : 'Excluir'}</Botao>
      </div>
    </Folha>
  );
}
