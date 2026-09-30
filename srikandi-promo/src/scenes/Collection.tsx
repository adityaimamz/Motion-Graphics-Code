import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ASSETS} from '../assets';
import {CroppedPhoto, Eyebrow, Kawung, PHOTO_H, PHOTO_W, RevealWords, Ruler} from '../components/primitives';
import {BEAT, C, EASE_IN, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';

const AW = 700;
const AH = 933; // 3:4 — sama dengan rasio foto
const AX = 540 - AW / 2;
const AY = 572;
const ARCH_RADIUS = `${AW / 2}px ${AW / 2}px 16px 16px`;
const FULL: [number, number, number, number] = [0, 0, PHOTO_W, PHOTO_H];

const archOutline = (inset: number) => {
  const x0 = AX - inset;
  const x1 = AX + AW + inset;
  const r = AW / 2 + inset;
  const top = AY - inset;
  const bottom = AY + AH + inset;
  return `M${x0},${bottom} L${x0},${top + r} A${r},${r} 0 0 1 ${x1},${top + r} L${x1},${bottom} Z`;
};

const Sticker: React.FC<{text: string; x: number; y: number; rot: number; at: number; f: number}> = ({text, x, y, rot, at, f}) => {
  const {fps} = useVideoConfig();
  if (f < at) return null;
  const s = spring({frame: f - at, fps, config: {damping: 11, stiffness: 180, mass: 0.7}});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `rotate(${rot}deg) scale(${0.4 + s * 0.6})`,
        opacity: Math.min(1, s * 2),
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '18px 30px 18px 22px',
        borderRadius: 60,
        background: 'rgba(251,248,242,0.94)',
        border: `1.5px solid ${C.gold}`,
        boxShadow: '0 18px 40px rgba(14,26,51,0.22)',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 33,
        color: C.night,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{width: 14, height: 14, borderRadius: '50%', background: C.gold, boxShadow: `0 0 0 5px rgba(201,164,92,0.22)`}} />
      {text}
    </div>
  );
};

const Arch: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: AX,
      top: AY,
      width: AW,
      height: AH,
      borderRadius: ARCH_RADIUS,
      overflow: 'hidden',
      boxShadow: '0 50px 90px rgba(14,26,51,0.28), 0 12px 30px rgba(14,26,51,0.18)',
      ...style,
    }}
  >
    {children}
  </div>
);

// 00:13.2 – 00:21  ·  Koleksi: satu model, banyak cerita → hingga gaun pesta
export const Collection: React.FC = () => {
  const f = useCurrentFrame();

  const archIn = tween(f, 4, 26, 0, 1, EASE_OUT);
  const outline = tween(f, 10, 40, 0, 1, EASE_IN_OUT);
  const sliderStart = BEAT * 2; // 36 → global 432
  const slide = tween(f, sliderStart, sliderStart + 30, 0, 1, EASE_IN_OUT);
  const swapStart = BEAT * 8; // 144 → global 540
  const swap = tween(f, swapStart, swapStart + 22, 0, 1, EASE_IN_OUT);
  const kb = tween(f, swapStart + 10, 234, 0, 1, (t) => t);
  const outro = tween(f, 214, 234, 0, 1, EASE_IN);

  const handleX = AX + slide * AW;

  return (
    <AbsoluteFill style={{background: C.ivory}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 55%, ${C.paper} 0%, ${C.ivory} 55%, ${C.cream} 100%)`}} />
      <Kawung id="kawungKoleksi" color={C.blue} opacity={0.05} drift={f * 0.25} />

      <AbsoluteFill style={{transform: `scale(${1 + outro * 0.06})`, opacity: 1 - outro * 0.4}}>
        {/* Judul */}
        <div style={{position: 'absolute', top: 262, width: '100%', display: 'flex', justifyContent: 'center', opacity: tween(f, 0, 14)}}>
          <Eyebrow color={C.blue}>Koleksi</Eyebrow>
        </div>
        <div style={{position: 'absolute', top: 318, left: 0, right: 0}}>
          <RevealWords
            text="Satu model,"
            start={6}
            stagger={4}
            exitAt={swapStart - 4}
            style={{fontFamily: SERIF, fontWeight: 500, fontSize: 104, color: C.night, lineHeight: 1}}
          />
          <RevealWords
            text="banyak cerita."
            start={sliderStart + 14}
            stagger={4}
            exitAt={swapStart - 2}
            style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 104, color: C.goldDeep, lineHeight: 1.05}}
          />
        </div>
        <div style={{position: 'absolute', top: 318, left: 0, right: 0}}>
          <RevealWords
            text="Dari kebaya"
            start={swapStart + 6}
            stagger={4}
            style={{fontFamily: SERIF, fontWeight: 500, fontSize: 104, color: C.night, lineHeight: 1}}
          />
          <RevealWords
            text="hingga gaun pesta."
            start={swapStart + 12}
            stagger={4}
            style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 104, color: C.goldDeep, lineHeight: 1.05}}
          />
        </div>

        {/* Garis bingkai lengkung emas */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, transform: `translateX(${-swap * 60}px)`}}>
          <path
            d={archOutline(22)}
            fill="none"
            stroke={C.gold}
            strokeWidth={2}
            pathLength={1}
            strokeDasharray={`${outline} 1`}
          />
        </svg>

        {/* Lengkung 1: mint → sage (geser) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${(1 - archIn) * 700}px) translateX(${-swap * 1100}px) rotate(${-swap * 7}deg)`,
            transformOrigin: '540px 1100px',
          }}
        >
          <Arch>
            <CroppedPhoto src={ASSETS.photos.mint} crop={FULL} width={AW} height={AH} zoom={1.06} panY={16} />
            <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - slide) * 100}% 0 0)`}}>
              <CroppedPhoto src={ASSETS.photos.sage} crop={FULL} width={AW} height={AH} zoom={1.06} panY={16} />
            </div>
          </Arch>
          {slide > 0 && slide < 1 ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: handleX - 2,
                  top: AY - 40,
                  width: 4,
                  height: AH + 80,
                  background: `linear-gradient(180deg, rgba(233,209,160,0), ${C.goldLight} 12%, ${C.goldLight} 88%, rgba(233,209,160,0))`,
                  boxShadow: '0 0 16px rgba(233,209,160,0.9)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: handleX - 38,
                  top: AY + AH * 0.52 - 38,
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  background: C.paper,
                  border: `2px solid ${C.gold}`,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width={40} height={20} viewBox="0 0 40 20">
                  <path d="M12,3 L4,10 L12,17 M28,3 L36,10 L28,17" fill="none" stroke={C.night} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </>
          ) : null}
          <Sticker text="Pilih warna" x={96} y={760} rot={-5} at={BEAT * 4} f={f} />
          <Sticker text="Pilih renda" x={652} y={1010} rot={4} at={BEAT * 5} f={f} />
          <Sticker text="Tambah payet" x={120} y={1290} rot={-3} at={BEAT * 6} f={f} />
        </div>

        {/* Lengkung 2: gaun batik */}
        {swap > 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateX(${(1 - swap) * 1100}px) rotate(${(1 - swap) * 7}deg)`,
              transformOrigin: '540px 1100px',
            }}
          >
            <Arch>
              <CroppedPhoto src={ASSETS.photos.batik} crop={FULL} width={AW} height={AH} zoom={1.04 + kb * 0.1} panY={60 * kb + 10} />
            </Arch>
            {/* pita meteran vertikal di sisi lengkung */}
            <div
              style={{
                position: 'absolute',
                left: AX + AW + 30,
                top: AY + 40,
                transform: `rotate(90deg) translateY(-100%)`,
                transformOrigin: '0 0',
                opacity: tween(f, swapStart + 16, swapStart + 30),
                filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))',
              }}
            >
              <Ruler width={AH - 80} height={70} pxPerCm={40} offsetCm={30 + (f - swapStart) * 0.1} />
            </div>
            <Sticker text="Dibuat sesuai ukuranmu" x={70} y={1340} rot={-3} at={swapStart + BEAT} f={f} />
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
