'use client';

import { useState, useEffect, useRef } from 'react';

type FaixaId = 'branca' | 'azul' | 'roxa' | 'marrom' | 'preta';

const ORDEM: FaixaId[] = ['branca', 'azul', 'roxa', 'marrom', 'preta'];

const FAIXA: Record<FaixaId, {
  label: string;
  main: string;
  dark: string;
  mid: string;
  light: string;
  stroke: string;
  seam: string;
  glow: string;
  textColor: string;
  shadow: string;
}> = {
  branca: {
    label: 'Branca',
    main: '#e8e0c8',
    dark: '#b8aa88',
    mid: '#d0c8a8',
    light: '#f0ece0',
    stroke: '#a89870',
    seam: '#988860',
    glow: 'rgba(200,190,160,0.5)',
    textColor: '#3a3020',
    shadow: 'rgba(180,160,120,0.4)',
  },
  azul: {
    label: 'Azul',
    main: '#1565d8',
    dark: '#0a3590',
    mid: '#1048b8',
    light: '#3d7ef0',
    stroke: '#082c80',
    seam: '#0a3898',
    glow: 'rgba(21,101,216,0.55)',
    textColor: '#fff',
    shadow: 'rgba(10,50,140,0.5)',
  },
  roxa: {
    label: 'Roxa',
    main: '#7025d8',
    dark: '#430d98',
    mid: '#5818b8',
    light: '#8f50f0',
    stroke: '#380a88',
    seam: '#4e14a8',
    glow: 'rgba(112,37,216,0.55)',
    textColor: '#fff',
    shadow: 'rgba(60,10,140,0.5)',
  },
  marrom: {
    label: 'Marrom',
    main: '#8c2e0e',
    dark: '#521402',
    mid: '#722208',
    light: '#b04018',
    stroke: '#481002',
    seam: '#601a05',
    glow: 'rgba(140,46,14,0.55)',
    textColor: '#ffeedd',
    shadow: 'rgba(80,20,5,0.5)',
  },
  preta: {
    label: 'Preta',
    main: '#181818',
    dark: '#060606',
    mid: '#0e0e0e',
    light: '#2a2a2a',
    stroke: '#020202',
    seam: '#080808',
    glow: 'rgba(80,80,80,0.6)',
    textColor: '#c0c0c0',
    shadow: 'rgba(0,0,0,0.7)',
  },
};

export interface EventoHistorico {
  tipo: 'inicio' | 'listra' | 'faixa';
  faixa: FaixaId;
  listras: number;
  data: string;
}

interface BeltProgressProps {
  initialFaixa?: FaixaId;
  initialListras?: number;
  historico?: EventoHistorico[];
  onUpdate?: (faixa: FaixaId, listras: number, evento: EventoHistorico) => void;
}

export function BeltProgress({
  initialFaixa = 'branca',
  initialListras = 0,
  historico = [],
  onUpdate,
}: BeltProgressProps) {
  const [idx, setIdx] = useState(ORDEM.indexOf(initialFaixa));
  const [listras, setListras] = useState(initialListras);
  const [leveling, setLeveling] = useState(false);
  const [burst, setBurst] = useState(false);
  const [flash, setFlash] = useState(false);
  const [pulse, setPulse] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const f = FAIXA[ORDEM[idx]];
  const isPreta = ORDEM[idx] === 'preta';
  const nextFaixa = !isPreta ? FAIXA[ORDEM[idx + 1]] : null;

  useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout); }, []);

  const addTimeout = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  };

  const agora = () => new Date().toISOString();

  const adicionar = () => {
    if (leveling) return;
    const novas = listras + 1;

    if (novas >= 4 && !isPreta) {
      setListras(4);
      setFlash(true);
      setLeveling(true);
      setBurst(true);
      addTimeout(() => {
        setIdx((i) => {
          const ni = i + 1;
          const novaFaixa = ORDEM[ni];
          const evento: EventoHistorico = { tipo: 'faixa', faixa: novaFaixa, listras: 0, data: agora() };
          onUpdate?.(novaFaixa, 0, evento);
          return ni;
        });
        setListras(0);
        setFlash(false);
        addTimeout(() => {
          setLeveling(false);
          setBurst(false);
        }, 1400);
      }, 1000);
    } else if (novas <= 4) {
      const v = Math.min(novas, 4);
      setPulse(v - 1);
      setListras(v);
      setFlash(true);
      addTimeout(() => { setFlash(false); setPulse(null); }, 400);
      const evento: EventoHistorico = { tipo: 'listra', faixa: ORDEM[idx], listras: v, data: agora() };
      onUpdate?.(ORDEM[idx], v, evento);
    }
  };

  const remover = () => {
    if (leveling || listras === 0) return;
    const v = listras - 1;
    setListras(v);
    // Remoção não gera evento no histórico
    onUpdate?.(ORDEM[idx], v, { tipo: 'listra', faixa: ORDEM[idx], listras: v, data: agora() });
  };

  // ─── SVG layout ──────────────────────────────────────────────────────────────
  // viewBox 800 × 320
  // Belt knot center: (400, 118)
  // Belt height (arm thickness): 64px total → 32px each side of center-line

  // Seam (horizontal center-line) y = 118
  // Arm top edge y = 86, bottom edge y = 150

  // Upper arms (straight, slight angle)
  // UL: from (0, 80) top-left to knot entrance (292, 84) top, (292, 128) bottom, (0, 138) bottom-left
  const armUL = '0,80 292,86 292,128 0,136';
  // UR: mirror
  const armUR = '508,86 800,80 800,136 508,128';

  // Lower-left arm: diagonal from knot down-left
  // From (285,122) to (60,296) left-bottom, (100,310) right-bottom
  const armLL = '292,110 318,126 110,308 68,292';
  // Lower-right arm: diagonal from knot down-right — TIP end
  const armRL = '482,126 508,110 732,292 690,308';

  // Knot geometry
  const knotBack = '286,82 514,82 518,160 400,176 282,160';
  const knotFront = '286,82 400,70 514,82 510,144 400,158 290,144';
  const knotInner = '306,86 494,86 490,136 400,150 310,136';

  // Black tip — on lower-right arm tip end
  // Arm direction vector from (495,118) to (711,300): (216,182), len≈282
  // t=0.62: cx = 495+0.62*216=629, cy = 118+0.62*182 = 231
  // Perp: (-182,216) normalized *27 = (-17.4, 20.7)
  // A: (629+17, 231-21) = (646,210), B: (629-17, 231+21) = (612,252)
  // tip corners: (732,292) and (690,308)
  const blackTip = '646,210 732,292 690,308 612,252';

  // Stripe positions along lower-right arm
  // t = 0.67, 0.76, 0.85, 0.94
  const stripeData = [0.67, 0.76, 0.85, 0.94].map((t) => {
    const cx = 495 + t * 216;
    const cy = 118 + t * 182;
    const px = -182 / 282;
    const py = 216 / 282;
    const off = 20;
    return {
      x1: cx + px * off, y1: cy + py * off,
      x2: cx - px * off, y2: cy - py * off,
    };
  });

  const beltGrad = `linear-gradient(180deg, ${f.dark} 0%, ${f.mid} 18%, ${f.light} 45%, ${f.mid} 75%, ${f.dark} 100%)`;

  return (
    <div className="relative select-none">

      {/* ── Level-up burst overlay ── */}
      {burst && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none gap-3">
          <div
            className="text-6xl"
            style={{ animation: 'bounce 0.6s infinite' }}
          >🎉</div>
          <div
            className="px-5 py-2 rounded-full font-black text-xl tracking-wide"
            style={{
              background: FAIXA[ORDEM[idx]].main,
              color: FAIXA[ORDEM[idx]].textColor,
              boxShadow: `0 0 32px ${FAIXA[ORDEM[idx]].glow}`,
              animation: 'pulse 0.8s infinite',
            }}
          >
            Faixa {FAIXA[ORDEM[idx]].label}!
          </div>
        </div>
      )}

      {/* ── Belt SVG Art ── */}
      <div
        className="relative"
        style={{
          filter: `drop-shadow(0 4px ${leveling ? '32px' : '14px'} ${f.glow}) drop-shadow(0 8px 24px rgba(0,0,0,0.6))`,
          transform: leveling ? 'scale(1.04)' : 'scale(1)',
          transition: 'filter 0.7s ease, transform 0.6s ease',
          opacity: burst ? 0.35 : 1,
        }}
      >
        <svg
          viewBox="0 0 800 320"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          style={{
            filter: flash ? 'brightness(1.6)' : 'brightness(1)',
            transition: 'filter 0.25s',
          }}
        >
          <defs>
            {/* Belt arm gradient */}
            <linearGradient id={`gArm-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={f.dark}  />
              <stop offset="22%"  stopColor={f.mid}   />
              <stop offset="50%"  stopColor={f.light} />
              <stop offset="78%"  stopColor={f.mid}   />
              <stop offset="100%" stopColor={f.dark}  />
            </linearGradient>

            {/* Knot gradient */}
            <linearGradient id={`gKnot-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={f.mid}   />
              <stop offset="40%"  stopColor={f.light} />
              <stop offset="100%" stopColor={f.dark}  />
            </linearGradient>

            {/* Seam gradient (darker center line) */}
            <linearGradient id={`gSeam-${idx}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={f.seam} stopOpacity="0.9" />
              <stop offset="50%"  stopColor={f.dark} stopOpacity="0.6" />
              <stop offset="100%" stopColor={f.seam} stopOpacity="0.9" />
            </linearGradient>

            {/* Tip gradient */}
            <linearGradient id="gTip" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"  stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#060606" />
            </linearGradient>

            {/* Glow filter for stripes */}
            <filter id="stripeGlow" x="-30%" y="-80%" width="160%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Belt shadow */}
            <filter id="bShadow" x="-4%" y="-6%" width="108%" height="120%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000" floodOpacity="0.55" />
            </filter>

            {/* Knot shadow */}
            <filter id="kShadow" x="-8%" y="-8%" width="116%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.65" />
            </filter>
          </defs>

          {/* ════ LOWER ARMS (behind knot) ════ */}
          {/* Lower-left */}
          <polygon
            points={armLL}
            fill={`url(#gArm-${idx})`}
            stroke={f.stroke}
            strokeWidth="1.5"
            filter="url(#bShadow)"
          />
          {/* LL edge highlights */}
          <line x1="292" y1="110" x2="110" y2="308" stroke={f.light} strokeWidth="1.5" opacity="0.3" />
          <line x1="318" y1="126" x2="68"  y2="292" stroke={f.dark}  strokeWidth="2"   opacity="0.5" />
          {/* LL center seam */}
          <line x1="305" y1="118" x2="89"  y2="300" stroke={f.seam} strokeWidth="1.5" opacity="0.55" strokeDasharray="12 6" />

          {/* Lower-right */}
          <polygon
            points={armRL}
            fill={`url(#gArm-${idx})`}
            stroke={f.stroke}
            strokeWidth="1.5"
            filter="url(#bShadow)"
          />
          {/* RL edge highlights */}
          <line x1="482" y1="126" x2="690" y2="308" stroke={f.dark}  strokeWidth="2"   opacity="0.5" />
          <line x1="508" y1="110" x2="732" y2="292" stroke={f.light} strokeWidth="1.5" opacity="0.3" />
          {/* RL center seam */}
          <line x1="495" y1="118" x2="711" y2="300" stroke={f.seam} strokeWidth="1.5" opacity="0.55" strokeDasharray="12 6" />

          {/* ════ BLACK TIP ════ */}
          <polygon
            points={blackTip}
            fill="url(#gTip)"
            stroke="#000"
            strokeWidth="1.5"
          />
          {/* Tip border highlight (left edge) */}
          <line x1="646" y1="210" x2="612" y2="252" stroke="#333" strokeWidth="2.5" />
          {/* Tip inner texture */}
          <line x1="640" y1="218" x2="618" y2="244" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          {/* ════ STRIPES ════ */}
          {stripeData.map((s, i) => {
            const active = i < listras;
            const isPulsing = i === pulse;
            return (
              <g key={i} filter={active ? 'url(#stripeGlow)' : undefined}>
                {/* Stripe glow halo */}
                {active && (
                  <line
                    x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={isPulsing ? 18 : 12}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-width 0.3s' }}
                  />
                )}
                {/* Stripe main */}
                <line
                  x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke={active ? '#ffffff' : 'rgba(255,255,255,0.10)'}
                  strokeWidth={active ? (isPulsing ? 7 : 5.5) : 2.5}
                  strokeLinecap="round"
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                />
              </g>
            );
          })}

          {/* ════ UPPER ARMS (in front) ════ */}
          {/* Upper-left */}
          <polygon
            points={armUL}
            fill={`url(#gArm-${idx})`}
            stroke={f.stroke}
            strokeWidth="1.5"
            filter="url(#bShadow)"
          />
          {/* UL top/bottom edge lines */}
          <line x1="0"   y1="80"  x2="292" y2="86"  stroke={f.dark}  strokeWidth="2"   opacity="0.5" />
          <line x1="0"   y1="136" x2="292" y2="128" stroke={f.dark}  strokeWidth="2"   opacity="0.5" />
          <line x1="2"   y1="82"  x2="289" y2="88"  stroke={f.light} strokeWidth="1"   opacity="0.35" />
          {/* UL center seam */}
          <line x1="0"   y1="108" x2="292" y2="107" stroke={`url(#gSeam-${idx})`} strokeWidth="1.5" opacity="0.6" />

          {/* Upper-right */}
          <polygon
            points={armUR}
            fill={`url(#gArm-${idx})`}
            stroke={f.stroke}
            strokeWidth="1.5"
            filter="url(#bShadow)"
          />
          <line x1="508" y1="86"  x2="800" y2="80"  stroke={f.dark}  strokeWidth="2"   opacity="0.5" />
          <line x1="508" y1="128" x2="800" y2="136" stroke={f.dark}  strokeWidth="2"   opacity="0.5" />
          <line x1="511" y1="88"  x2="798" y2="82"  stroke={f.light} strokeWidth="1"   opacity="0.35" />
          {/* UR center seam */}
          <line x1="508" y1="107" x2="800" y2="108" stroke={`url(#gSeam-${idx})`} strokeWidth="1.5" opacity="0.6" />

          {/* ════ KNOT ════ */}
          {/* Knot shadow base */}
          <polygon points={knotBack} fill={f.dark} stroke={f.stroke} strokeWidth="1" filter="url(#kShadow)" />

          {/* Tuck shadows on sides */}
          <polygon points="286,82 316,108 305,150 282,160" fill={f.dark} opacity="0.7" />
          <polygon points="514,82 484,108 495,150 518,160" fill={f.dark} opacity="0.7" />

          {/* Knot fold creases */}
          <line x1="300" y1="90" x2="310" y2="150" stroke={f.seam} strokeWidth="1.5" opacity="0.4" />
          <line x1="500" y1="90" x2="490" y2="150" stroke={f.seam} strokeWidth="1.5" opacity="0.4" />

          {/* Knot front loop */}
          <polygon
            points={knotFront}
            fill={`url(#gKnot-${idx})`}
            stroke={f.stroke}
            strokeWidth="1.5"
            filter="url(#kShadow)"
          />

          {/* Knot inner highlight */}
          <polygon points={knotInner} fill={f.light} opacity="0.15" />

          {/* Knot peak highlight (oval at top-center) */}
          <ellipse cx="400" cy="78" rx="44" ry="9" fill={f.light} opacity="0.3" />

          {/* Knot horizontal seam */}
          <line x1="292" y1="138" x2="508" y2="138" stroke={f.seam} strokeWidth="2" opacity="0.5" />

          {/* Knot vertical crease center */}
          <line x1="400" y1="70" x2="400" y2="158" stroke={f.dark} strokeWidth="2" opacity="0.4" />
        </svg>
      </div>

      {/* ── Belt badge ── */}
      <div className="flex justify-center -mt-1 mb-5">
        <div
          className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm border-2 shadow-xl"
          style={{
            background: f.main,
            color: f.textColor,
            borderColor: f.dark,
            boxShadow: `0 0 24px ${f.glow}, 0 4px 12px rgba(0,0,0,0.4)`,
            transition: 'all 0.7s ease',
          }}
        >
          <span className="text-base">🥋</span>
          Faixa {f.label}
          <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>
            {listras}/4 ▪
          </span>
          {nextFaixa
            ? <span style={{ color: nextFaixa.main === f.main ? f.textColor : nextFaixa.main, textShadow: `0 0 8px ${nextFaixa.glow}`, fontSize: '0.75rem' }}>→ {nextFaixa.label}</span>
            : <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>Nível Máximo 🏆</span>
          }
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="px-2 mt-5 space-y-4">
        {/* Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={remover}
            disabled={listras === 0 || leveling}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-light transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{ background: '#181818', color: '#666', border: '1px solid #2a2a2a' }}
            title="Remover listra"
          >
            −
          </button>

          {/* Listras no centro */}
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: 10,
                  height: 28,
                  background: i < listras ? '#fff' : 'rgba(255,255,255,0.08)',
                  boxShadow: i < listras ? '0 0 8px rgba(255,255,255,0.7)' : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}
              />
            ))}
          </div>

          <button
            onClick={adicionar}
            disabled={(listras >= 4 && isPreta) || leveling}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-light transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: f.main,
              color: f.textColor,
              border: `1px solid ${f.light}`,
              boxShadow: `0 0 12px ${f.glow}`,
              transition: 'background 0.7s, box-shadow 0.7s',
            }}
            title="Adicionar listra"
          >
            +
          </button>
        </div>

        {/* Progress status */}
        <div className="text-center">
          {isPreta && listras === 4 ? (
            <p className="text-amber-400 font-semibold text-sm">Grau máximo atingido! 🏆</p>
          ) : (
            <p className="text-stone-500 text-xs">
              {4 - listras} listra{4 - listras !== 1 ? 's' : ''} para
              {nextFaixa && (
                <span style={{ color: nextFaixa.main, textShadow: `0 0 8px ${nextFaixa.glow}` }}>
                  {' '}faixa {nextFaixa.label}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Belt progression dots */}
        <div className="flex justify-center items-center gap-2 pb-1">
          {ORDEM.map((id, i) => (
            <div
              key={id}
              title={`Faixa ${FAIXA[id].label}`}
              className="rounded-full transition-all duration-600"
              style={{
                width: i === idx ? 28 : 11,
                height: 11,
                background: i <= idx ? FAIXA[id].main : '#1e1e1e',
                border: i === idx
                  ? `2px solid ${FAIXA[id].light}`
                  : i < idx
                  ? `2px solid ${FAIXA[id].dark}`
                  : '2px solid #2a2a2a',
                boxShadow: i === idx ? `0 0 12px ${FAIXA[id].glow}` : 'none',
                transition: 'all 0.6s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Histórico ── */}
      {historico.length > 0 && (
        <div className="px-2 mt-6">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
            style={{ background: '#111', border: '1px solid #222' }}
          >
            <span className="text-stone-400 text-sm font-semibold">📜 Histórico de progresso</span>
            <span className="text-stone-600 text-xs">
              {historico.length} evento{historico.length !== 1 ? 's' : ''} {showHistory ? '▲' : '▼'}
            </span>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-0 relative">
              {/* Linha vertical da timeline */}
              <div
                className="absolute left-5 top-3 bottom-3 w-px"
                style={{ background: 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)' }}
              />

              {[...historico].reverse().map((ev, i) => {
                const isFaixa = ev.tipo === 'faixa';
                const isInicio = ev.tipo === 'inicio';
                const fc = FAIXA[ev.faixa as FaixaId] ?? FAIXA.branca;
                const data = new Date(ev.data);
                const dataFmt = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                const horaFmt = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={i} className="flex gap-4 pb-4 relative">
                    {/* Dot na timeline */}
                    <div className="relative z-10 shrink-0 flex items-start pt-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: isFaixa || isInicio ? fc.main : '#111',
                          border: `2px solid ${isFaixa || isInicio ? fc.light : '#333'}`,
                          boxShadow: isFaixa ? `0 0 14px ${fc.glow}` : 'none',
                        }}
                      >
                        {isInicio ? '🥋' : isFaixa ? '🎉' : '▪'}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div
                      className="flex-1 rounded-2xl px-4 py-3"
                      style={{
                        background: isFaixa ? `${fc.main}18` : isInicio ? '#161616' : '#0e0e0e',
                        border: `1px solid ${isFaixa ? fc.dark + '55' : '#1e1e1e'}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: isFaixa || isInicio ? fc.main : '#888' }}
                        >
                          {isInicio
                            ? 'Início da jornada'
                            : isFaixa
                            ? `Faixa ${fc.label} conquistada!`
                            : `Listra ${ev.listras}/4`}
                        </span>
                        {isFaixa && (
                          <div
                            className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: fc.main, color: fc.textColor }}
                          >
                            {fc.label}
                          </div>
                        )}
                      </div>
                      <p className="text-stone-600 text-xs">
                        {dataFmt} · {horaFmt}
                      </p>
                      {!isInicio && !isFaixa && (
                        <div className="flex gap-1 mt-2">
                          {[0, 1, 2, 3].map((j) => (
                            <div
                              key={j}
                              className="rounded-sm"
                              style={{
                                width: 8, height: 14,
                                background: j < ev.listras ? '#fff' : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
