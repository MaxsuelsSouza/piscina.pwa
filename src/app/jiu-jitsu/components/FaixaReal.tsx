/**
 * Desenho de uma faixa de jiu-jitsu estendida, com costuras, ponteira e graus
 * de fita. Preta tem ponteira vermelha; as outras, preta.
 */

export type FaixaId = 'branca' | 'azul' | 'roxa' | 'marrom' | 'preta';

type Cores = { base: string; luz: string; sombra: string; costura: string; ponteira: string };

const CORES: Record<FaixaId, Cores> = {
  branca: { base: '#ecebe8', luz: '#ffffff', sombra: '#c9c6c0', costura: 'rgba(0,0,0,.13)', ponteira: '#111111' },
  azul: { base: '#1d4ed8', luz: '#3b82f6', sombra: '#1e3a8a', costura: 'rgba(255,255,255,.22)', ponteira: '#111111' },
  roxa: { base: '#6b21a8', luz: '#9333ea', sombra: '#3b0764', costura: 'rgba(255,255,255,.2)', ponteira: '#111111' },
  marrom: { base: '#78350f', luz: '#a16207', sombra: '#3f1d07', costura: 'rgba(255,255,255,.18)', ponteira: '#111111' },
  preta: { base: '#1c1917', luz: '#3a3532', sombra: '#050505', costura: 'rgba(255,255,255,.12)', ponteira: '#b91c1c' },
};

/** Cor sólida de cada faixa, para chips e marcadores pequenos. */
export const COR_SOLIDA: Record<FaixaId, string> = {
  branca: CORES.branca.base,
  azul: CORES.azul.base,
  roxa: CORES.roxa.base,
  marrom: CORES.marrom.base,
  preta: CORES.preta.base,
};

const Y0 = 28;
const ALTURA = 54;
const X0 = 8;
const X1 = 592;
const PONTEIRA_X = 430;
const PONTEIRA_L = 112;

const COSTURAS = Array.from({ length: 9 }, (_, i) => Y0 + 6 + i * 5.2);

export function FaixaReal({ faixa, graus, className }: { faixa: FaixaId; graus: number; className?: string }) {
  const c = CORES[faixa];
  const n = Math.max(0, Math.min(graus, 6));
  const passo = n > 4 ? 15 : 20;
  const nome = faixa.charAt(0).toUpperCase() + faixa.slice(1);

  return (
    <svg viewBox="0 0 600 110" className={className} role="img" aria-label={`Faixa ${nome}${n ? ` com ${n} grau${n > 1 ? 's' : ''}` : ''}`}>
      <rect x={X0} y={Y0 + 3} width={X1 - X0} height={ALTURA} rx={4} fill="#000" opacity={0.35} />
      <rect x={X0} y={Y0} width={X1 - X0} height={ALTURA} rx={4} fill={c.base} />
      {faixa === 'preta' && <rect x={X0 + 0.5} y={Y0 + 0.5} width={X1 - X0 - 1} height={ALTURA - 1} rx={4} fill="none" stroke="#57534e" />}
      <rect x={X0} y={Y0} width={X1 - X0} height={5} rx={2} fill={c.luz} opacity={0.55} />
      <rect x={X0} y={Y0 + ALTURA - 6} width={X1 - X0} height={6} rx={2} fill={c.sombra} opacity={0.7} />
      <rect x={PONTEIRA_X} y={Y0} width={PONTEIRA_L} height={ALTURA} fill={c.ponteira} />
      {COSTURAS.map((y) => (
        <line key={y} x1={X0 + 12} y1={y} x2={X1 - 12} y2={y} stroke={c.costura} strokeDasharray="3 1.6" />
      ))}
      <rect x={X1 - 14} y={Y0 + 5} width={8} height={ALTURA - 10} fill="none" stroke={c.costura} strokeDasharray="2 1.5" />
      <rect x={X0 + 6} y={Y0 + 5} width={8} height={ALTURA - 10} fill="none" stroke={c.costura} strokeDasharray="2 1.5" />
      {Array.from({ length: n }, (_, i) => {
        const x = PONTEIRA_X + 14 + i * passo;
        return (
          <g key={i}>
            <rect x={x} y={Y0 - 3} width={11} height={ALTURA + 6} rx={1.2} fill="#f5f5f4" />
            <rect x={x} y={Y0 - 3} width={11} height={2} fill="#ffffff" />
            <rect x={x + 9.5} y={Y0 - 3} width={1.5} height={ALTURA + 6} fill="#d6d3d1" />
          </g>
        );
      })}
    </svg>
  );
}
