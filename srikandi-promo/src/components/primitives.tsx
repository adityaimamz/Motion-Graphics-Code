import React from 'react';
import {AbsoluteFill, Img, random, useCurrentFrame} from 'remotion';
import {evolvePath, getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {ASSETS} from '../assets';
import {C, EASE_OUT, SANS, tween} from '../theme';

// ─── Grain film + vignette (dipakai di seluruh video) ───────────────────────
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.075}) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2); // grain berganti tiap 2 frame
  const x = Math.floor(random(`gx${step}`) * 384);
  const y = Math.floor(random(`gy${step}`) * 384);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${ASSETS.grain})`,
        backgroundSize: '384px 384px',
        backgroundPosition: `${x}px ${y}px`,
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.45}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

// ─── Motif kawung (batik Jawa) sebagai tekstur latar yang sangat halus ──────
export const Kawung: React.FC<{
  color?: string;
  opacity?: number;
  size?: number;
  drift?: number;
  id: string;
}> = ({color = C.gold, opacity = 0.08, size = 132, drift = 0, id}) => {
  const s = size;
  const r = s * 0.2;
  const petal = (cx: number, cy: number, rot: number) => (
    <ellipse
      key={`${cx}-${cy}-${rot}`}
      cx={cx}
      cy={cy}
      rx={r * 1.25}
      ry={r * 0.72}
      transform={`rotate(${rot} ${cx} ${cy})`}
      fill="none"
      stroke={color}
      strokeWidth={1.4}
    />
  );
  const h = s / 2;
  const d = s * 0.25;
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id={id}
            width={s}
            height={s}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${drift} ${drift * 0.6})`}
          >
            {petal(h - d, h - d, 45)}
            {petal(h + d, h + d, 45)}
            {petal(h + d, h - d, -45)}
            {petal(h - d, h + d, -45)}
            <circle cx={h} cy={h} r={2.2} fill={color} />
            <circle cx={0} cy={0} r={3.2} fill="none" stroke={color} strokeWidth={1.2} />
            <circle cx={s} cy={0} r={3.2} fill="none" stroke={color} strokeWidth={1.2} />
            <circle cx={0} cy={s} r={3.2} fill="none" stroke={color} strokeWidth={1.2} />
            <circle cx={s} cy={s} r={3.2} fill="none" stroke={color} strokeWidth={1.2} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Debu emas melayang ─────────────────────────────────────────────────────
export const GoldDust: React.FC<{count?: number; seed?: string; opacity?: number; area?: [number, number, number, number]}> = ({
  count = 28,
  seed = 'dust',
  opacity = 1,
  area = [0, 0, 1080, 1920],
}) => {
  const frame = useCurrentFrame();
  const [ax, ay, aw, ah] = area;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      {new Array(count).fill(0).map((_, i) => {
        const x0 = ax + random(`${seed}x${i}`) * aw;
        const y0 = ay + random(`${seed}y${i}`) * ah;
        const speed = 0.25 + random(`${seed}s${i}`) * 0.7;
        const size = 2 + random(`${seed}r${i}`) * 4.5;
        const phase = random(`${seed}p${i}`) * Math.PI * 2;
        const y = ((y0 - frame * speed - ay + ah * 4) % ah) + ay;
        const x = x0 + Math.sin(frame / 38 + phase) * 14;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / 22 + phase));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: C.goldLight,
              opacity: tw,
              boxShadow: `0 0 ${size * 3}px ${size}px rgba(233,209,160,0.35)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Teks yang naik per kata dari balik "masker" ────────────────────────────
export const RevealWords: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  dur?: number;
  exitAt?: number;
  exitDur?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number) => React.CSSProperties | undefined;
  align?: 'left' | 'center' | 'right';
}> = ({text, start, stagger = 3, dur = 16, exitAt, exitDur = 12, style, wordStyle, align = 'center'}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={{textAlign: align, ...style}}>
      {words.map((w, i) => {
        const s = start + i * stagger;
        const p = tween(frame, s, s + dur);
        let y = (1 - p) * 110;
        let o = Math.min(1, p * 1.6);
        if (exitAt !== undefined) {
          const e = tween(frame, exitAt + i * 1.5, exitAt + i * 1.5 + exitDur, 0, 1, (t) => t * t * t);
          y -= e * 110;
          o *= 1 - e;
        }
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              padding: '0.06em 0.12em 0.14em',
              margin: '-0.06em -0.12em -0.14em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y}%)`,
                opacity: o,
                ...(wordStyle ? wordStyle(i) : {}),
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

// ─── Pita meteran penjahit ──────────────────────────────────────────────────
export const Ruler: React.FC<{
  width: number;
  height?: number;
  pxPerCm?: number;
  offsetCm?: number;
  bg?: string;
  ink?: string;
  accent?: string;
}> = ({width, height = 92, pxPerCm = 38, offsetCm = 0, bg = '#F1E6CC', ink = C.ink, accent = C.blue}) => {
  const first = Math.floor(offsetCm * 2) / 2;
  const count = Math.ceil(width / (pxPerCm / 2)) + 3;
  const ticks = [];
  for (let k = 0; k < count; k++) {
    const cm = first + k * 0.5;
    const x = (cm - offsetCm) * pxPerCm;
    if (x < -40 || x > width + 40) continue;
    const whole = Math.abs(cm - Math.round(cm)) < 0.001;
    const five = whole && Math.round(cm) % 5 === 0;
    const len = five ? 0.46 : whole ? 0.34 : 0.2;
    ticks.push(
      <g key={cm}>
        <line x1={x} x2={x} y1={0} y2={height * len} stroke={ink} strokeWidth={five ? 2.4 : 1.6} />
        <line x1={x} x2={x} y1={height} y2={height * (1 - len * 0.55)} stroke={ink} strokeWidth={1.2} opacity={0.6} />
        {whole && Math.round(cm) > 0 ? (
          <text
            x={x}
            y={height * 0.74}
            textAnchor="middle"
            fontFamily={SANS}
            fontWeight={five ? 700 : 600}
            fontSize={five ? 24 : 19}
            fill={five ? accent : ink}
          >
            {Math.round(cm)}
          </text>
        ) : null}
      </g>,
    );
  }
  return (
    <svg width={width} height={height} style={{display: 'block', overflow: 'visible'}}>
      <defs>
        <linearGradient id="tapeShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.12} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={bg} />
      {ticks}
      <rect width={width} height={height} fill="url(#tapeShade)" />
      <rect y={0} width={width} height={3} fill={C.gold} />
      <rect y={height - 3} width={width} height={3} fill={C.gold} />
    </svg>
  );
};

// ─── Jarum (elemen <g> SVG; ujung di kanan, lubang di kiri) ────────────────
export const NeedleG: React.FC<{length?: number; id: string}> = ({length = 150, id}) => {
  const L = length;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#C9CED6" />
          <stop offset="1" stopColor="#6F7682" />
        </linearGradient>
      </defs>
      <path
        d={`M0,8 C2,3.5 8,3.2 14,4.2 L${L - 22},6.4 L${L},8 L${L - 22},9.6 L14,11.8 C8,12.8 2,12.5 0,8 Z`}
        fill={`url(#${id})`}
        style={{filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))'}}
      />
      <ellipse cx={9} cy={8} rx={4.6} ry={1.5} fill="#2A2F3A" />
    </g>
  );
};

// ─── Benang emas yang "dijahit" mengikuti path, opsional dengan jarum ───────
export const Thread: React.FC<{
  d: string;
  progress: number;
  width?: number;
  height?: number;
  strokeWidth?: number;
  dashed?: boolean;
  needle?: boolean;
  glow?: boolean;
  color?: string;
  id: string;
  style?: React.CSSProperties;
}> = ({d, progress, width = 1080, height = 1920, strokeWidth = 4, dashed = false, needle = false, glow = true, color, id, style}) => {
  const p = Math.max(0, Math.min(1, progress));
  const len = getLength(d);
  const evo = evolvePath(p, d);
  const at = Math.max(0.001, Math.min(len - 0.001, len * p));
  const pt = getPointAtLength(d, at);
  const tan = getTangentAtLength(d, at);
  const ang = tan ? (Math.atan2(tan.y, tan.x) * 180) / Math.PI : 0;
  const stroke = color ?? `url(#${id}-grad)`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.goldDeep} />
          <stop offset="0.45" stopColor={C.goldLight} />
          <stop offset="1" stopColor={C.gold} />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="-200" y="-200" width={width + 400} height={height + 400}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={strokeWidth + 6} strokeLinecap="round" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
        </mask>
      </defs>
      {glow ? (
        <path
          d={d}
          fill="none"
          stroke={C.goldLight}
          strokeOpacity={0.35}
          strokeWidth={strokeWidth * 3.2}
          strokeLinecap="round"
          strokeDasharray={evo.strokeDasharray}
          strokeDashoffset={evo.strokeDashoffset}
          style={{filter: 'blur(6px)'}}
        />
      ) : null}
      {dashed ? (
        <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${strokeWidth * 4} ${strokeWidth * 3}`} mask={`url(#${id}-mask)`} />
      ) : (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={evo.strokeDasharray}
          strokeDashoffset={evo.strokeDashoffset}
        />
      )}
      {needle && pt && p > 0.001 && p < 0.999 ? (
        <g transform={`translate(${pt.x} ${pt.y}) rotate(${ang})`}>
          <g transform="translate(-136 -8)">
            <NeedleG length={150} id={`${id}-steel`} />
          </g>
        </g>
      ) : null}
    </svg>
  );
};

// ─── Garis jahitan putus-putus lurus yang tergambar dari kiri ke kanan ─────
export const StitchLine: React.FC<{
  width: number;
  progress: number;
  color?: string;
  thickness?: number;
  dash?: number;
  gap?: number;
  style?: React.CSSProperties;
}> = ({width, progress, color = C.gold, thickness = 3, dash = 14, gap = 10, style}) => (
  <div style={{width, height: thickness, overflow: 'hidden', ...style}}>
    <div
      style={{
        width: width * Math.max(0, Math.min(1, progress)),
        height: thickness,
        backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 ${dash}px, transparent ${dash}px ${dash + gap}px)`,
        borderRadius: thickness,
      }}
    />
  </div>
);

// ─── Label kecil berhuruf kapital renggang ──────────────────────────────────
export const Eyebrow: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({
  children,
  color = C.gold,
  size = 24,
  style,
}) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: '0.42em',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Foto yang dipotong ke area tertentu (koordinat foto asli 1086×1448) ───
export const PHOTO_W = 1086;
export const PHOTO_H = 1448;
export const CroppedPhoto: React.FC<{
  src: string;
  crop: [number, number, number, number]; // x0,y0,x1,y1 di foto asli
  width: number;
  height: number;
  zoom?: number; // zoom tambahan dari tengah crop
  panX?: number; // geser (px layar)
  panY?: number;
  style?: React.CSSProperties;
}> = ({src, crop, width, height, zoom = 1, panX = 0, panY = 0, style}) => {
  const [x0, y0, x1, y1] = crop;
  const cw = x1 - x0;
  const ch = y1 - y0;
  const s = Math.max(width / cw, height / ch) * zoom;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const left = width / 2 - cx * s + panX;
  const top = height / 2 - cy * s + panY;
  return (
    <div style={{position: 'relative', width, height, overflow: 'hidden', ...style}}>
      <Img
        src={src}
        style={{
          position: 'absolute',
          left,
          top,
          width: PHOTO_W * s,
          height: PHOTO_H * s,
          maxWidth: 'none',
        }}
      />
    </div>
  );
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeOut = EASE_OUT;
