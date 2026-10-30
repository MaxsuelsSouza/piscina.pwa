/**
 * Ícone "VS" feito de faixas: o V é uma faixa branca, o S uma faixa azul.
 * `animado`: V e S vêm dos lados, se chocam e terminam encaixados.
 * Sem `animado`: já no estado final (encaixados).
 */

const S = 'M56 9 C52 4 38 4 38 12 C38 20 56 18 56 27 C56 35 40 36 36 31';

export function VsFaixas({ largura = 112, animado = false }: { largura?: number; animado?: boolean }) {
  const altura = Math.round((largura * 40) / 64);
  const animV = animado ? { animation: 'jjVEntra .6s cubic-bezier(.5,0,.3,1) .3s both' } : undefined;
  const animS = animado ? { animation: 'jjSEntra .6s cubic-bezier(.5,0,.3,1) .3s both' } : undefined;
  return (
    <svg width={largura} height={altura} viewBox="0 0 64 40" role="img" aria-label="VS" style={{ overflow: 'visible' }}>
      <g style={animV} transform={animado ? undefined : 'translate(4.9 -2.8)'}>
        <path d="M6 6 L16 34 L26 6" fill="none" stroke="#78716c" strokeWidth={9} strokeLinejoin="round" />
        <path d="M6 6 L16 34 L26 6" fill="none" stroke="#f5f5f4" strokeWidth={7} strokeLinejoin="round" />
        <path d="M6 6 L16 34 L26 6" fill="none" stroke="#a8a29e" strokeWidth={0.8} strokeDasharray="1.6 1.8" />
        <path d="M6.6 7.7 L9.6 16.1" fill="none" stroke="#1c1917" strokeWidth={7} />
        <path d="M4.9 11.6 L10.5 9.6 M5.7 13.9 L11.3 11.9" fill="none" stroke="#f5f5f4" strokeWidth={1.1} />
      </g>
      <g style={animS} transform={animado ? undefined : 'translate(-7 4.2)'}>
        <path d={S} fill="none" stroke="#1e3a8a" strokeWidth={9} strokeLinejoin="round" />
        <path d={S} fill="none" stroke="#2563eb" strokeWidth={7} strokeLinejoin="round" />
        <path d={S} fill="none" stroke="#93c5fd" strokeWidth={0.8} strokeDasharray="1.6 1.8" />
        <path d={S} pathLength={100} fill="none" stroke="#1c1917" strokeWidth={7} strokeDasharray="0 86 14 200" />
        <path d={S} pathLength={100} fill="none" stroke="#f5f5f4" strokeWidth={5} strokeDasharray="0 91.3 1.4 1.4 1.4 200" />
      </g>
    </svg>
  );
}
