import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FaceMark, Wordmark, faceWidthFor} from '../components/Logo';
import {GoldDust, Kawung, StitchLine} from '../components/primitives';
import {BEAT, C, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';
import {DETAIL_CIRCLE} from './Details';

const FACE_H = 360;
const WORD_W = 720;

const LogoContent: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const faceS = spring({frame: f, fps, config: {damping: 14, mass: 0.8, stiffness: 120}});
  const ring = tween(f, 2, 26, 0, 1, EASE_OUT);
  const ringFade = 1 - tween(f, BEAT * 2, BEAT * 3, 0, 1);
  const word = tween(f, BEAT, BEAT + 26, 0, 1, EASE_IN_OUT);
  const tailor = tween(f, BEAT * 2, BEAT * 2 + 16, 0, 1, EASE_OUT);
  const tag = tween(f, BEAT * 3, BEAT * 3 + 18, 0, 1, EASE_OUT);
  const faceTop = DETAIL_CIRCLE.cy - FACE_H / 2 - 10;
  const R = DETAIL_CIRCLE.d / 2 + 22;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${C.blueLight} 0%, ${C.blue} 45%, ${C.blueDeep} 100%)`}} />
      <Kawung id="kawungLogo" opacity={0.09} drift={f * 0.3} />
      <GoldDust seed="logo" count={26} />

      {/* cahaya lembut di belakang wajah */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 420,
          top: DETAIL_CIRCLE.cy - 420,
          width: 840,
          height: 840,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,209,160,0.22) 0%, rgba(233,209,160,0) 65%)',
          opacity: faceS,
        }}
      />

      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle
          cx={540}
          cy={DETAIL_CIRCLE.cy}
          r={R + ring * 40}
          fill="none"
          stroke={C.goldLight}
          strokeWidth={3}
          opacity={ringFade * 0.9}
          strokeDasharray="10 9"
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 540 - faceWidthFor(FACE_H) / 2,
          top: faceTop,
          transform: `scale(${0.82 + faceS * 0.18})`,
          opacity: Math.min(1, faceS * 1.4),
          filter: 'drop-shadow(0 12px 30px rgba(0,20,60,0.45))',
        }}
      >
        <FaceMark height={FACE_H} />
      </div>

      <div style={{position: 'absolute', left: 540 - WORD_W / 2 + 20, top: faceTop + FACE_H + 48}}>
        <Wordmark width={WORD_W} reveal={word} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: faceTop + FACE_H + 48 + 192 + 26,
          width: '100%',
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: `${0.4 + tailor * 0.35}em`,
          paddingLeft: '0.7em',
          color: C.ivory,
          opacity: tailor,
        }}
      >
        TAILOR
      </div>

      <div
        style={{
          position: 'absolute',
          top: faceTop + FACE_H + 48 + 192 + 118,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <StitchLine width={220} progress={tag} color={C.gold} thickness={3} />
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 70,
            color: C.goldLight,
            opacity: tag,
            transform: `translateY(${(1 - tag) * 24}px)`,
          }}
        >
          Dijahit pas, tampil anggun.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 00:09.6 – 00:14  ·  Reveal logo, lalu "digunting" di tengah untuk membuka koleksi
export const LogoReveal: React.FC = () => {
  const f = useCurrentFrame();
  const open = tween(f, 0, 18, 0, 1, EASE_IN_OUT);
  const radius = DETAIL_CIRCLE.d / 2 + open * 1500;
  const splitStart = BEAT * 6; // 108 → global 396
  const seam = tween(f, splitStart - 8, splitStart + 2, 0, 1, EASE_OUT);
  const split = tween(f, splitStart, splitStart + 22, 0, 1, EASE_IN_OUT);

  const halves = split > 0;
  return (
    <AbsoluteFill style={{clipPath: `circle(${radius}px at 540px ${DETAIL_CIRCLE.cy}px)`}}>
      {!halves ? (
        <LogoContent f={f} />
      ) : (
        <>
          <AbsoluteFill style={{clipPath: 'inset(0 50% 0 0)', transform: `translateX(${-split * 620}px) rotate(${-split * 3}deg)`}}>
            <LogoContent f={f} />
          </AbsoluteFill>
          <AbsoluteFill style={{clipPath: 'inset(0 0 0 50%)', transform: `translateX(${split * 620}px) rotate(${split * 3}deg)`}}>
            <LogoContent f={f} />
          </AbsoluteFill>
        </>
      )}
      {/* garis jahitan tempat "gunting" lewat */}
      {seam > 0 && split < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 538,
            top: 0,
            width: 4,
            height: 1920 * seam,
            backgroundImage: `repeating-linear-gradient(180deg, ${C.goldLight} 0 18px, transparent 18px 30px)`,
            opacity: 1 - split,
            filter: 'drop-shadow(0 0 8px rgba(233,209,160,0.9))',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
