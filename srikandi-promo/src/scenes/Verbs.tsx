import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Eyebrow, Thread} from '../components/primitives';
import {BEAT, C, EASE_IN, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';

const WORD: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: 236,
  color: C.ivory,
  lineHeight: 1,
  letterSpacing: '-0.015em',
  whiteSpace: 'nowrap',
};

const Center: React.FC<{children: React.ReactNode; y?: number; style?: React.CSSProperties}> = ({children, y = 860, style}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', ...style}}>{children}</div>
);

// Kata masuk dengan sedikit "punch": dari besar & blur ke tajam.
const punch = (f: number, s: number) => {
  const p = tween(f, s, s + 9, 0, 1, EASE_OUT);
  return {transform: `scale(${1.18 - 0.18 * p})`, opacity: p, filter: `blur(${(1 - p) * 12}px)`};
};

// 00:02.4 – 00:05  ·  Diukur. Dipotong. Dijahit. Untukmu. — satu kata per ketukan
export const Verbs: React.FC = () => {
  const f = useCurrentFrame();
  const b1 = 0;
  const b2 = BEAT;
  const b3 = BEAT * 2;
  const b4 = BEAT * 3;

  return (
    <AbsoluteFill>
      {/* 1 — DIUKUR: garis dimensi seperti gambar pola */}
      {f >= b1 && f < b2 ? (
        <>
          <Center style={punch(f, b1)}>
            <div style={WORD}>Diukur.</div>
          </Center>
          {(() => {
            const w = 690 * tween(f, b1 + 3, b1 + 13, 0, 1, EASE_OUT);
            return (
              <div style={{position: 'absolute', top: 1140, left: 540 - w / 2, width: w, height: 40}}>
                <div style={{position: 'absolute', top: 19, left: 0, right: 0, height: 2, background: C.gold}} />
                <div style={{position: 'absolute', top: 4, left: 0, width: 2, height: 32, background: C.gold}} />
                <div style={{position: 'absolute', top: 4, right: 0, width: 2, height: 32, background: C.gold}} />
                <div
                  style={{
                    position: 'absolute',
                    top: -44,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 24,
                    letterSpacing: '0.2em',
                    color: C.goldLight,
                    opacity: tween(f, b1 + 8, b1 + 13),
                  }}
                >
                  92,5 CM
                </div>
              </div>
            );
          })()}
        </>
      ) : null}

      {/* 2 — DIPOTONG: garis potong lalu huruf terbelah dua */}
      {f >= b2 && f < b3
        ? (() => {
            const cut = tween(f, b2 + 4, b2 + 9, 0, 1, EASE_IN_OUT);
            const split = tween(f, b2 + 8, b2 + 15, 0, 1, EASE_OUT);
            const half = (top: boolean) => (
              <Center
                style={{
                  ...punch(f, b2),
                  clipPath: top ? 'inset(0 0 52% 0)' : 'inset(48% 0 0 0)',
                  transform: `${punch(f, b2).transform} translate(${(top ? -1 : 1) * split * 34}px, ${(top ? -1 : 1) * split * 8}px) rotate(${(top ? -1 : 1) * split * 1.2}deg)`,
                }}
              >
                <div style={WORD}>Dipotong.</div>
              </Center>
            );
            return (
              <>
                {half(true)}
                {half(false)}
                <div
                  style={{
                    position: 'absolute',
                    top: 860 + 236 * 0.5,
                    left: 110,
                    width: 860 * cut,
                    height: 3,
                    background: `linear-gradient(90deg, rgba(233,209,160,0), ${C.goldLight} 30%, #fff)`,
                    boxShadow: `0 0 18px 3px rgba(233,209,160,0.7)`,
                    opacity: 1 - split * 0.85,
                  }}
                />
              </>
            );
          })()
        : null}

      {/* 3 — DIJAHIT: jarum menjahit garis putus-putus */}
      {f >= b3 && f < b4 ? (
        <>
          <Center style={punch(f, b3)}>
            <div style={WORD}>Dijahit.</div>
          </Center>
          <Thread id="verbStitch" d="M170,1142 L910,1142" progress={tween(f, b3 + 2, b3 + 16, 0, 1, EASE_OUT)} dashed needle strokeWidth={4} />
        </>
      ) : null}

      {/* 4 — UNTUKMU. */}
      {f >= b4
        ? (() => {
            const exit = tween(f, b4 + 20, b4 + 30, 0, 1, EASE_IN);
            return (
              <AbsoluteFill style={{opacity: 1 - exit, transform: `scale(${1 + exit * 0.25})`}}>
                <Center y={770} style={{opacity: tween(f, b4 + 2, b4 + 10)}}>
                  <Eyebrow size={26}>Khusus</Eyebrow>
                </Center>
                <Center y={840} style={punch(f, b4)}>
                  <div
                    style={{
                      ...WORD,
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: 236,
                      color: C.goldLight,
                      textShadow: '0 0 60px rgba(233,209,160,0.35)',
                    }}
                  >
                    untukmu.
                  </div>
                </Center>
              </AbsoluteFill>
            );
          })()
        : null}
    </AbsoluteFill>
  );
};
