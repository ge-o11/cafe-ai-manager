import React, { useEffect, useRef, useState } from 'react';

interface CoffeeFillRevealProps {
  onComplete: () => void;
  logoSrc: string;
}

const FILL_DURATION = 3200;

export default function CoffeeFillReveal({ onComplete, logoSrc }: CoffeeFillRevealProps) {
  const [fill, setFill] = useState(0); // 0–1
  const [phase, setPhase] = useState<'filling' | 'full' | 'exiting'>('filling');
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const skipped = useRef(false);

  const complete = () => {
    if (skipped.current) return;
    skipped.current = true;
    setFill(1);
    setPhase('full');
    setTimeout(() => {
      setPhase('exiting');
      setTimeout(onComplete, 700);
    }, 1100);
  };

  useEffect(() => {
    startRef.current = performance.now();
    const step = (ts: number) => {
      const raw = (ts - startRef.current) / FILL_DURATION;
      const p = Math.min(raw, 1);
      // ease-in-out cubic
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setFill(e);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        complete();
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTap = () => {
    if (phase === 'filling') {
      cancelAnimationFrame(rafRef.current);
      complete();
    }
  };

  // Cup geometry (viewBox 0 0 180 175)
  const CUP_TOP_Y = 28;
  const CUP_BOT_Y = 128;
  const INTERIOR_H = CUP_BOT_Y - CUP_TOP_Y; // 100px
  const fillH = fill * INTERIOR_H;
  const fillY = CUP_BOT_Y - fillH;

  const steamOpacity = Math.max(0, Math.min(fill * 5 - 1, 1));
  const isFull = phase === 'full' || phase === 'exiting';
  const isExiting = phase === 'exiting';

  return (
    <div
      onClick={handleTap}
      className="flex flex-col items-center"
      style={{
        cursor: phase === 'filling' ? 'pointer' : 'default',
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? 'opacity 0.65s ease-in-out' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Steam wisps */}
      <svg
        width="100" height="48"
        viewBox="0 0 100 48"
        style={{ opacity: steamOpacity, transition: 'opacity 1s ease-in-out', overflow: 'visible' }}
      >
        {([
          { x: 22, delay: '0s' },
          { x: 50, delay: '0.45s' },
          { x: 78, delay: '0.22s' },
        ] as const).map(({ x, delay }, i) => (
          <path
            key={i}
            d={`M${x} 48 Q${x - 8} 32 ${x} 18 Q${x + 8} 5 ${x} 0`}
            fill="none"
            stroke="rgba(255,255,255,0.42)"
            strokeWidth="2.2"
            strokeLinecap="round"
            style={{ animation: `cfSteam 2.4s ease-in-out infinite ${delay}` }}
          />
        ))}
      </svg>

      {/* Coffee cup SVG */}
      <svg
        width="180" height="175"
        viewBox="0 0 180 175"
        style={{ overflow: 'visible', marginTop: -6 }}
      >
        <defs>
          <clipPath id="cfCupClip">
            <path d="M24 28 L156 28 L145 128 L35 128 Z" />
          </clipPath>

          <linearGradient id="cfCoffeeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(32,62%,44%)" />
            <stop offset="30%"  stopColor="hsl(28,55%,28%)" />
            <stop offset="100%" stopColor="hsl(24,50%,14%)" />
          </linearGradient>

          <radialGradient id="cfFoamGrad" cx="50%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="hsl(36,45%,76%)" />
            <stop offset="55%"  stopColor="hsl(31,38%,60%)" />
            <stop offset="100%" stopColor="hsl(28,32%,48%)" />
          </radialGradient>

          <linearGradient id="cfCupSheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
            <stop offset="38%"  stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <radialGradient id="cfSaucerGrad" cx="50%" cy="25%" r="70%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.16)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </radialGradient>

          <filter id="cfGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Saucer */}
        <ellipse cx="90" cy="154" rx="72" ry="14"
          fill="url(#cfSaucerGrad)"
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <ellipse cx="90" cy="150" rx="55" ry="8"
          fill="rgba(255,255,255,0.05)" />

        {/* Cup base shadow */}
        <ellipse cx="90" cy="132" rx="54" ry="8" fill="rgba(0,0,0,0.4)" />

        {/* Cup body fill */}
        <path
          d="M22 26 L158 26 L147 130 L33 130 Z"
          fill="rgba(255,255,255,0.06)"
        />

        {/* Cup outline — glows amber when full */}
        <path
          d="M22 26 L158 26 L147 130 L33 130 Z"
          fill="none"
          stroke={isFull ? 'rgba(210,155,70,0.6)' : 'rgba(255,255,255,0.28)'}
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.6s ease-out', filter: isFull ? 'url(#cfGlow)' : 'none' }}
        />

        {/* Coffee liquid (clipped to cup interior) */}
        <g clipPath="url(#cfCupClip)">
          {fillH > 0 && (
            <rect
              x="0"
              y={fillY}
              width="180"
              height={fillH + 3}
              fill="url(#cfCoffeeGrad)"
            />
          )}

          {/* Liquid surface oval */}
          {fillH > 4 && (
            <ellipse
              cx="90"
              cy={fillY}
              rx={Math.min(66, 16 + fill * 62)}
              ry={2.8 + fill * 2}
              fill="hsl(30,54%,36%)"
              opacity="0.72"
              style={{ animation: 'cfWave 2s ease-in-out infinite' }}
            />
          )}

          {/* Surface highlight */}
          {fillH > 12 && (
            <ellipse
              cx="72"
              cy={fillY - 1.5}
              rx={5 + fill * 18}
              ry="2"
              fill="rgba(255,215,140,0.18)"
            />
          )}

          {/* Foam crema layer when full */}
          {isFull && (
            <ellipse
              cx="90" cy="33" rx="63" ry="13"
              fill="url(#cfFoamGrad)"
              style={{ animation: 'cfFoam 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            />
          )}

          {/* Latte art swirl when full */}
          {isFull && (
            <path
              d="M70 28 Q80 22 90 28 Q100 34 90 38 Q82 42 78 36"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ animation: 'cfArt 0.8s ease-out 0.3s both' }}
            />
          )}
        </g>

        {/* Rim ellipse */}
        <ellipse
          cx="90" cy="26" rx="68" ry="10"
          fill="none"
          stroke={isFull ? 'rgba(210,155,70,0.5)' : 'rgba(255,255,255,0.28)'}
          strokeWidth="2"
          style={{ transition: 'stroke 0.6s ease-out' }}
        />

        {/* Sheen */}
        <path d="M22 26 L158 26 L147 130 L33 130 Z" fill="url(#cfCupSheen)" />

        {/* Handle (right side) */}
        <path
          d="M147 62 Q182 62 182 90 Q182 118 147 118"
          fill="none"
          stroke="rgba(255,255,255,0.26)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M147 76 Q168 76 168 90 Q168 108 147 108"
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Progress ring on rim when filling */}
        {!isFull && fill > 0 && (
          <ellipse
            cx="90" cy="26" rx="68" ry="10"
            fill="none"
            stroke="hsla(32,65%,52%,0.7)"
            strokeWidth="2"
            strokeDasharray={`${Math.round(fill * 278)} 278`}
            strokeLinecap="round"
            style={{ transformOrigin: '90px 26px', transform: 'rotate(-90deg)' }}
          />
        )}
      </svg>

      {/* Logo reveal from above the cup */}
      <div
        style={{
          marginTop: -28,
          width: 118,
          opacity: isFull ? 1 : 0,
          transform: isFull
            ? 'scale(1) translateY(0px)'
            : 'scale(0.55) translateY(24px)',
          transition: 'opacity 0.75s ease-out, transform 0.75s cubic-bezier(0.34,1.56,0.64,1)',
          filter: 'drop-shadow(0 0 26px rgba(210,148,50,0.85)) drop-shadow(0 4px 14px rgba(0,0,0,0.55))',
          pointerEvents: 'none',
        }}
      >
        <img src={logoSrc} alt="Cafe Nof" style={{ width: '100%', objectFit: 'contain' }} />
      </div>

      {/* Skip hint */}
      {phase === 'filling' && (
        <p
          style={{
            marginTop: 10,
            color: 'rgba(255,255,255,0.3)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: fill > 0.15 ? 0.7 : 0,
            transition: 'opacity 0.5s',
          }}
        >
          לחץ לדילוג
        </p>
      )}

      <style>{`
        @keyframes cfSteam {
          0%,100% { opacity:0.35; transform:translateY(0) scaleX(1); }
          50%      { opacity:0.75; transform:translateY(-9px) scaleX(1.18); }
        }
        @keyframes cfWave {
          0%,100% { transform:scaleY(1); }
          50%      { transform:scaleY(1.9); }
        }
        @keyframes cfFoam {
          0%   { transform:scaleX(0.15); opacity:0; }
          100% { transform:scaleX(1);    opacity:1; }
        }
        @keyframes cfArt {
          0%   { stroke-dasharray:0 120; opacity:0; }
          100% { stroke-dasharray:120 0; opacity:1; }
        }
      `}</style>
    </div>
  );
}
