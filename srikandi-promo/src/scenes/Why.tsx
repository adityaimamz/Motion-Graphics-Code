import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Eyebrow, GoldDust, Kawung, RevealWords, StitchLine} from '../components/primitives';
import {BEAT, C, EASE_IN, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';

const POINTS = [
  {n: '01', title: 'Pas di badan', desc: 'Diukur langsung, dipotong mengikuti bentuk tubuhmu.'},
  {n: '02', title: 'Jahitan rapi', desc: 'Detail dikerjakan teliti — rapi di luar, rapi di dalam.'},
  {n: '03', title: 'Bahan berkualitas', desc: 'Bahan, aksesori, dan manik-manik pilihan yang nyaman dipakai seharian.'},
];

// 00:20.4 – 00:27  ·  Kenapa Srikandi: tiga hal yang kami jaga
export const Why: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = tween(f, 0, 18, 0, 1, EASE_IN_OUT);
  const edgeY = (1 - wipe) * 1920;
  const exit = tween(f, 180, 198, 0, 1, EASE_IN);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(${edgeY}px 0 0 0)`}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 50% 30%, ${C.nightSoft} 0%, ${C.night} 70%)`}} />
        <Kawung id="kawungWhy" opacity={0.05} drift={-f * 0.3} />
        <GoldDust seed="why" count={16} opacity={0.6} />

        <AbsoluteFill style={{transform: `translateY(${-exit * 120}px)`, opacity: 1 - exit}}>
          <div style={{position: 'absolute', top: 330, left: 90, opacity: tween(f, 8, 22)}}>
            <Eyebrow>Kenapa Srikandi</Eyebrow>
          </div>
          <div style={{position: 'absolute', top: 384, left: 90, right: 90}}>
            <RevealWords
              align="left"
              text="Tiga hal yang"
              start={10}
              stagger={4}
              style={{fontFamily: SERIF, fontWeight: 500, fontSize: 112, color: C.ivory, lineHeight: 1}}
            />
            <RevealWords
              align="left"
              text="selalu kami jaga."
              start={16}
              stagger={4}
              style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 112, color: C.goldLight, lineHeight: 1.06}}
            />
          </div>

          {POINTS.map((p, i) => {
            const t = BEAT + i * BEAT * 2; // 18, 54, 90 → tepat di ketukan
            const top = 700 + i * 262;
            const num = tween(f, t, t + 14, 0, 1, EASE_OUT);
            const desc = tween(f, t + 8, t + 22, 0, 1, EASE_OUT);
            const line = tween(f, t + 4, t + 30, 0, 1, EASE_IN_OUT);
            if (f < t) return null;
            return (
              <div key={p.n} style={{position: 'absolute', top, left: 90, right: 90, height: 262}}>
                <div style={{position: 'absolute', left: 0, top: 6, overflow: 'hidden', height: 150, width: 170}}>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: 150,
                      lineHeight: 1,
                      color: C.gold,
                      transform: `translateY(${(1 - num) * 100}%)`,
                    }}
                  >
                    {p.n}
                  </div>
                </div>
                <div style={{position: 'absolute', left: 200, top: 18, right: 0}}>
                  <RevealWords
                    align="left"
                    text={p.title}
                    start={t + 3}
                    stagger={3}
                    style={{fontFamily: SERIF, fontWeight: 600, fontSize: 82, color: C.ivory, lineHeight: 1}}
                  />
                  <div
                    style={{
                      marginTop: 16,
                      fontFamily: SANS,
                      fontWeight: 400,
                      fontSize: 33,
                      lineHeight: 1.4,
                      color: 'rgba(246,240,230,0.78)',
                      opacity: desc,
                      transform: `translateY(${(1 - desc) * 18}px)`,
                      maxWidth: 690,
                    }}
                  >
                    {p.desc}
                  </div>
                </div>
                <StitchLine width={900} progress={line} thickness={2} dash={12} gap={9} color="rgba(201,164,92,0.55)" style={{position: 'absolute', left: 0, bottom: 20}} />
              </div>
            );
          })}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* tepi jahitan pada wipe */}
      {wipe > 0 && wipe < 1 ? (
        <div
          style={{
            position: 'absolute',
            top: edgeY - 2,
            left: 0,
            width: 1080,
            height: 5,
            backgroundImage: `repeating-linear-gradient(90deg, ${C.goldLight} 0 20px, transparent 20px 32px)`,
            filter: 'drop-shadow(0 0 8px rgba(233,209,160,0.9))',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
