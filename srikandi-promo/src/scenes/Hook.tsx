import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Eyebrow, RevealWords, Ruler, Thread} from '../components/primitives';
import {C, EASE_IN, EASE_OUT, SERIF, tween} from '../theme';

// 00:00 – 00:02.8  ·  Hook: "Baju yang pas bukan kebetulan."
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const exit = tween(f, 62, 80, 0, 1, EASE_IN);
  const rulerIn = tween(f, -8, 22, 0, 1, EASE_OUT);

  return (
    <AbsoluteFill>
      {/* Pita meteran menyilang di bawah */}
      <div
        style={{
          position: 'absolute',
          left: -200,
          top: 1360,
          transform: `translateX(${(1 - rulerIn) * 1300 - exit * 400}px) rotate(-7deg)`,
          transformOrigin: 'center',
          opacity: 1 - exit,
          filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))',
        }}
      >
        <Ruler width={1500} offsetCm={42 + f * 0.09} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 318,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: tween(f, 2, 18) * (1 - exit),
          transform: `translateY(${(1 - tween(f, 2, 18)) * 14}px)`,
        }}
      >
        <Eyebrow>Srikandi Tailor · Tegal</Eyebrow>
      </div>

      <AbsoluteFill
        style={{
          transform: `translateY(${-exit * 90}px)`,
          opacity: 1 - exit,
          filter: `blur(${exit * 10}px)`,
        }}
      >
        <div style={{position: 'absolute', top: 700, left: 0, right: 0}}>
          <RevealWords
            text="Baju yang pas"
            start={-5}
            stagger={4}
            dur={18}
            style={{fontFamily: SERIF, fontWeight: 500, fontSize: 142, color: C.ivory, lineHeight: 1.02, letterSpacing: '-0.01em'}}
          />
          <RevealWords
            text="bukan kebetulan."
            start={14}
            stagger={5}
            dur={18}
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 138,
              color: C.goldLight,
              lineHeight: 1.08,
              marginTop: 4,
            }}
          />
        </div>
        {/* Garis benang di bawah kalimat */}
        <Thread
          id="hookThread"
          d="M150,1045 C330,1090 560,1010 760,1035 S905,1060 935,1052"
          progress={tween(f, 26, 54, 0, 1, EASE_OUT)}
          strokeWidth={4}
          needle
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
