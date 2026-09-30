import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ASSETS} from '../assets';
import {CroppedPhoto} from '../components/primitives';
import {BEAT, C, EASE_IN, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';

type Card = {
  word: string;
  src: string;
  crop: [number, number, number, number];
  tilt: number;
};

// Crop dalam koordinat foto asli (1086×1448).
const CARDS: Card[] = [
  {word: 'Renda', src: ASSETS.photos.sage, crop: [335, 30, 765, 603], tilt: -2.5},
  {word: 'Batik', src: ASSETS.photos.batik, crop: [330, 560, 750, 1120], tilt: 2.2},
  {word: 'Manik', src: ASSETS.photos.sage, crop: [360, 560, 760, 1093], tilt: -1.8},
  {word: 'Kerah', src: ASSETS.photos.batik, crop: [350, 40, 740, 560], tilt: 2.6},
  {word: 'Potongan', src: ASSETS.photos.mint, crop: [345, 520, 775, 1093], tilt: -2.2},
  {word: 'Peplum', src: ASSETS.photos.batik, crop: [335, 300, 755, 860], tilt: 1.8},
];

const CARD_W = 800;
const CARD_H = 1066; // 3:4
const CX = 540;
const CY = 880;
export const DETAIL_CIRCLE = {cx: 540, cy: 760, d: 500}; // titik temu dengan adegan logo

const Marquee: React.FC<{y: number; dir: 1 | -1; frame: number; opacity: number}> = ({y, dir, frame, opacity}) => {
  const text = CARDS.map((c) => c.word).join('  ·  ');
  const row = `${text}  ·  ${text}  ·  ${text}  ·  `;
  const x = dir === 1 ? -1400 + frame * 5 : -200 - frame * 5;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        whiteSpace: 'nowrap',
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 250,
        lineHeight: 1,
        color: 'transparent',
        WebkitTextStroke: `1.6px rgba(233,209,160,0.42)`,
        opacity,
      }}
    >
      {row}
    </div>
  );
};

// 00:04.8 – 00:09.6  ·  Montase detail: 6 kartu "dibagikan" tepat di ketukan
export const Details: React.FC = () => {
  const f = useCurrentFrame();
  const collapseStart = BEAT * 6; // 108
  const morph = tween(f, collapseStart, collapseStart + 18, 0, 1, EASE_IN_OUT);
  const ringP = tween(f, collapseStart + 16, collapseStart + 34, 0, 1, EASE_OUT);
  const bgBlue = tween(f, collapseStart + 8, collapseStart + 34, 0, 1, EASE_IN_OUT);
  const marqueeOpacity = tween(f, 0, 10) * (1 - tween(f, collapseStart, collapseStart + 12));

  return (
    <AbsoluteFill>
      {/* Latar berubah dari indigo ke biru Srikandi saat kartu menjadi lingkaran */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${C.blueLight} 0%, ${C.blue} 45%, ${C.blueDeep} 100%)`,
          opacity: bgBlue,
        }}
      />

      <Marquee y={60} dir={-1} frame={f} opacity={marqueeOpacity} />
      <Marquee y={1560} dir={1} frame={f} opacity={marqueeOpacity} />

      {CARDS.map((card, i) => {
        const t = i * BEAT;
        if (f < t) return null;
        const isLast = i === CARDS.length - 1;
        const enter = tween(f, t, t + 11, 0, 1, EASE_OUT);
        // posisi di tumpukan: 0 = paling atas
        const depth = CARDS.slice(i + 1).filter((_, j) => f >= (i + 1 + j) * BEAT).length;
        const depthSmooth =
          depth === 0
            ? 0
            : Math.min(3, depth - 1 + tween(f, (i + depth) * BEAT, (i + depth) * BEAT + 10, 0, 1, EASE_OUT));
        if (depthSmooth > 2.6) return null;
        const sideways = i % 2 === 0 ? -1 : 1;

        // kartu terakhir berubah menjadi lingkaran
        const w = isLast ? interpolate(morph, [0, 1], [CARD_W, DETAIL_CIRCLE.d]) : CARD_W;
        const h = isLast ? interpolate(morph, [0, 1], [CARD_H, DETAIL_CIRCLE.d]) : CARD_H;
        const cy = isLast ? interpolate(morph, [0, 1], [CY, DETAIL_CIRCLE.cy]) : CY;
        const radius = isLast ? interpolate(morph, [0, 1], [8, DETAIL_CIRCLE.d / 2]) : 8;
        const pad = isLast ? interpolate(morph, [0, 1], [14, 0]) : 14;

        const y = (1 - enter) * 1400 - depthSmooth * 34;
        const rot = (1 - enter) * sideways * 9 + card.tilt * (isLast ? 1 - morph : 1);
        const scale = 1 - depthSmooth * 0.06;
        const dim = depthSmooth * 0.28;
        const othersGone = !isLast ? 1 - tween(f, collapseStart, collapseStart + 10, 0, 1, EASE_IN) : 1;
        const labelP = tween(f, t + 5, t + 16, 0, 1, EASE_OUT) * (isLast ? 1 - tween(f, collapseStart, collapseStart + 8) : 1);
        const zoom = 1.1 + (f - t) * 0.0028;

        return (
          <div
            key={card.word}
            style={{
              position: 'absolute',
              left: CX - w / 2,
              top: cy - h / 2,
              width: w,
              height: h,
              transform: `translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
              opacity: othersGone,
              filter: `blur(${(1 - enter) * 6}px)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: C.paper,
                borderRadius: radius + pad,
                boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.3)',
              }}
            />
            <div style={{position: 'absolute', inset: pad, borderRadius: radius, overflow: 'hidden'}}>
              <CroppedPhoto src={card.src} crop={card.crop} width={w - pad * 2} height={h - pad * 2} zoom={zoom} />
              {/* bayangan bawah untuk label */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(10,27,63,0) 55%, rgba(10,27,63,0.78) 100%)',
                  opacity: labelP,
                }}
              />
              <div style={{position: 'absolute', inset: 0, background: '#000', opacity: dim}} />
              <div style={{position: 'absolute', left: 52, bottom: 46, opacity: labelP}}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 22,
                    letterSpacing: '0.3em',
                    color: C.goldLight,
                    marginBottom: 6,
                    transform: `translateY(${(1 - labelP) * 20}px)`,
                  }}
                >
                  {String(i + 1).padStart(2, '0')} / 06 · DETAIL
                </div>
                <div style={{overflow: 'hidden', padding: '0 0.2em 0.1em 0', margin: '0 -0.2em -0.1em 0'}}>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontStyle: 'italic',
                      fontWeight: 500,
                      fontSize: 124,
                      lineHeight: 1,
                      color: C.ivory,
                      transform: `translateY(${(1 - labelP) * 105}%)`,
                      textShadow: '0 6px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    {card.word}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Cincin emas (seperti ram sulam) mengunci lingkaran */}
      {ringP > 0 ? (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <circle
            cx={DETAIL_CIRCLE.cx}
            cy={DETAIL_CIRCLE.cy}
            r={DETAIL_CIRCLE.d / 2 + 22}
            fill="none"
            stroke={C.goldLight}
            strokeWidth={4}
            strokeDasharray={`${ringP * 2 * Math.PI * (DETAIL_CIRCLE.d / 2 + 22)} 9999`}
            transform={`rotate(-90 ${DETAIL_CIRCLE.cx} ${DETAIL_CIRCLE.cy})`}
            style={{filter: 'drop-shadow(0 0 10px rgba(233,209,160,0.8))'}}
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
