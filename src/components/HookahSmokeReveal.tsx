import React, { useEffect, useRef, useState } from 'react';

interface HookahSmokeRevealProps {
  onComplete: () => void;
  logoSrc: string;
}

// Hookah SVG dimensions
const HK_W = 130;
const HK_H = 230;
// Bowl top is at y=38 inside SVG → bowl is (HK_H - 38) = 192px from bottom of SVG
const BOWL_FROM_BOTTOM = HK_H - 38; // 192

const SMOKE_BLOBS = [
  { delay: '0s',    endX: -28, endY: -320, scale: 4.2, dur: '3.8s', alpha: 0.52 },
  { delay: '0.65s', endX:  34, endY: -295, scale: 3.8, dur: '3.6s', alpha: 0.45 },
  { delay: '1.3s',  endX: -44, endY: -340, scale: 5.0, dur: '4.1s', alpha: 0.48 },
  { delay: '0.32s', endX:  48, endY: -305, scale: 4.5, dur: '3.5s', alpha: 0.42 },
  { delay: '0.98s', endX:  -8, endY: -330, scale: 4.8, dur: '4.0s', alpha: 0.5  },
  { delay: '1.6s',  endX:  22, endY: -280, scale: 4.0, dur: '4.2s', alpha: 0.43 },
  { delay: '0.5s',  endX: -58, endY: -355, scale: 5.5, dur: '4.4s', alpha: 0.40 },
  { delay: '1.95s', endX:  58, endY: -300, scale: 4.3, dur: '3.7s', alpha: 0.38 },
  { delay: '0.18s', endX: -18, endY: -310, scale: 3.5, dur: '3.9s', alpha: 0.46 },
  { delay: '1.1s',  endX:  12, endY: -345, scale: 4.6, dur: '4.3s', alpha: 0.44 },
];

export default function HookahSmokeReveal({ onComplete, logoSrc }: HookahSmokeRevealProps) {
  const [showLogo, setShowLogo] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = () => {
    timers.current.forEach(clearTimeout);
    setExiting(true);
    setTimeout(onComplete, 900);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 2000);
    const t2 = setTimeout(finish, 5000);
    timers.current = [t1, t2];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div
      onClick={finish}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        cursor: 'pointer',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.9s ease-in-out' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo reveal ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: showLogo
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -42%) scale(0.7)',
          width: 190,
          opacity: showLogo ? 1 : 0,
          filter: showLogo
            ? 'drop-shadow(0 0 50px rgba(210,150,40,1)) drop-shadow(0 0 100px rgba(210,150,40,0.55))'
            : 'blur(22px)',
          transition: 'all 1.8s cubic-bezier(0.34, 1.15, 0.64, 1)',
          pointerEvents: 'none',
          zIndex: 25,
        }}
      >
        <img src={logoSrc} alt="Cafe Nof" style={{ width: '100%', objectFit: 'contain' }} />
      </div>

      {/* ── Smoke blobs ── */}
      {SMOKE_BLOBS.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: BOWL_FROM_BOTTOM,
            left: '50%',
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: i % 3 === 0
              ? `rgba(255,250,240,${b.alpha})`
              : i % 3 === 1
              ? `rgba(235,220,195,${b.alpha})`
              : `rgba(255,255,255,${b.alpha - 0.05})`,
            filter: 'blur(13px)',
            animation: `hkSmoke${(i % 5) + 1} ${b.dur} ease-out infinite ${b.delay}`,
            pointerEvents: 'none',
            zIndex: 22,
          }}
        />
      ))}

      {/* ── Hookah SVG ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 23,
        }}
      >
        <svg width={HK_W} height={HK_H} viewBox={`0 0 ${HK_W} ${HK_H}`} overflow="visible">
          <defs>
            <linearGradient id="hkGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="hsl(42,85%,70%)" />
              <stop offset="50%"  stopColor="hsl(36,78%,56%)" />
              <stop offset="100%" stopColor="hsl(28,72%,42%)" />
            </linearGradient>
            <radialGradient id="hkEmber" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="hsl(25,100%,60%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(20,90%,40%)"  stopOpacity="0" />
            </radialGradient>
            <filter id="hkGlowF" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="hkEmberF" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          {/* Ember/coal glow */}
          <ellipse cx="65" cy="34" rx="18" ry="7"
            fill="url(#hkEmber)" filter="url(#hkEmberF)"
            style={{ animation: 'hkEmberPulse 2s ease-in-out infinite' }}
          />

          {/* Coal tray rim */}
          <ellipse cx="65" cy="38" rx="17" ry="5.5"
            fill="rgba(200,140,40,0.18)"
            stroke="url(#hkGold)" strokeWidth="1.8"
          />

          {/* Bowl body */}
          <path
            d="M48 38 Q45 60 54 70 Q65 76 76 70 Q85 60 82 38"
            fill="rgba(200,150,50,0.1)"
            stroke="url(#hkGold)" strokeWidth="2" strokeLinejoin="round"
            filter="url(#hkGlowF)"
          />
          {/* Bowl bottom rim */}
          <ellipse cx="65" cy="70" rx="13" ry="4.5"
            fill="none" stroke="url(#hkGold)" strokeWidth="1.6"
          />

          {/* Upper stem */}
          <rect x="61.5" y="74" width="7" height="42" rx="3"
            fill="rgba(200,150,50,0.1)"
            stroke="url(#hkGold)" strokeWidth="1.7"
          />

          {/* Center decorative ring */}
          <ellipse cx="65" cy="116" rx="14" ry="6"
            fill="rgba(200,150,50,0.14)"
            stroke="url(#hkGold)" strokeWidth="1.9"
            filter="url(#hkGlowF)"
          />
          {/* Ring detail lines */}
          <line x1="51" y1="116" x2="79" y2="116"
            stroke="rgba(255,220,130,0.15)" strokeWidth="1"
          />

          {/* Lower stem */}
          <rect x="61.5" y="122" width="7" height="34" rx="3"
            fill="rgba(200,150,50,0.1)"
            stroke="url(#hkGold)" strokeWidth="1.7"
          />

          {/* Water vase */}
          <path
            d="M62 156 Q28 160 24 183 Q20 202 24 215 Q34 237 65 239 Q96 237 106 215 Q110 202 106 183 Q102 160 68 156 Z"
            fill="rgba(200,150,50,0.08)"
            stroke="url(#hkGold)" strokeWidth="2.1" strokeLinejoin="round"
            filter="url(#hkGlowF)"
          />
          {/* Vase highlight (left sheen) */}
          <path d="M36 182 Q32 210 36 224"
            fill="none" stroke="rgba(255,220,140,0.15)" strokeWidth="5" strokeLinecap="round"
          />
          {/* Water level line */}
          <path d="M32 202 Q65 198 98 202"
            fill="none" stroke="rgba(120,200,255,0.12)" strokeWidth="1.5" strokeLinecap="round"
          />
          {/* Vase bottom band */}
          <path d="M30 220 Q65 224 100 220"
            fill="none" stroke="rgba(200,150,50,0.3)" strokeWidth="1.2" strokeLinecap="round"
          />

          {/* Base plate */}
          <ellipse cx="65" cy="239" rx="50" ry="9"
            fill="rgba(200,150,50,0.1)"
            stroke="url(#hkGold)" strokeWidth="1.7"
          />
          {/* Shadow */}
          <ellipse cx="65" cy="246" rx="55" ry="8" fill="rgba(0,0,0,0.45)" />

          {/* Hose pipe */}
          <path d="M26 188 Q6 190 4 212 Q2 230 14 238"
            fill="none" stroke="url(#hkGold)" strokeWidth="3.2" strokeLinecap="round"
          />
          {/* Mouthpiece */}
          <ellipse cx="11" cy="239" rx="9" ry="6"
            fill="rgba(200,150,50,0.12)"
            stroke="url(#hkGold)" strokeWidth="1.7"
          />
        </svg>
      </div>

      {/* Tap hint */}
      <p
        style={{
          position: 'absolute',
          bottom: 14,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.28)',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          zIndex: 26,
        }}
      >
        לחץ לדילוג
      </p>

      <style>{`
        /* Each smoke blob has a unique keyframe for organic spread */
        @keyframes hkSmoke1 {
          0%   { transform:translate(-50%,0) scale(0.3); opacity:0; }
          12%  { opacity:0.55; }
          68%  { opacity:0.28; }
          100% { transform:translate(calc(-50% - 28px),-320px) scale(4.2); opacity:0; }
        }
        @keyframes hkSmoke2 {
          0%   { transform:translate(-50%,0) scale(0.3); opacity:0; }
          12%  { opacity:0.48; }
          65%  { opacity:0.22; }
          100% { transform:translate(calc(-50% + 34px),-295px) scale(3.8); opacity:0; }
        }
        @keyframes hkSmoke3 {
          0%   { transform:translate(-50%,0) scale(0.3); opacity:0; }
          14%  { opacity:0.52; }
          70%  { opacity:0.24; }
          100% { transform:translate(calc(-50% - 44px),-340px) scale(5.0); opacity:0; }
        }
        @keyframes hkSmoke4 {
          0%   { transform:translate(-50%,0) scale(0.3); opacity:0; }
          10%  { opacity:0.45; }
          65%  { opacity:0.2; }
          100% { transform:translate(calc(-50% + 48px),-305px) scale(4.5); opacity:0; }
        }
        @keyframes hkSmoke5 {
          0%   { transform:translate(-50%,0) scale(0.3); opacity:0; }
          13%  { opacity:0.5; }
          68%  { opacity:0.26; }
          100% { transform:translate(calc(-50% - 8px),-330px) scale(4.8); opacity:0; }
        }

        @keyframes hkEmberPulse {
          0%,100% { opacity:0.7; transform:scale(1);   }
          50%     { opacity:1;   transform:scale(1.25); }
        }
      `}</style>
    </div>
  );
}
