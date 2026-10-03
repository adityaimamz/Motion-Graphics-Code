import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Eyebrow, Kawung, Thread} from '../components/primitives';
import {BEAT, C, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';

const LINES = [
  {text: 'Kebaya custom', italic: false},
  {text: 'Gaun pesta', italic: true},
  {text: 'Baju Dinas / PDH', italic: false},
  {text: 'Seragam sekolah', italic: true},
];

const THREAD =
  'M60,380 C400,360 900,420 960,470 C1010,520 700,545 540,548 C380,551 60,580 110,650 C150,700 400,706 540,708 C700,710 1020,740 970,810 C930,860 700,866 540,868 C380,870 60,900 110,970 C150,1030 400,1040 540,1040';

const Diamond: React.FC<{color: string}> = ({color}) => (
  <span style={{display: 'inline-block', width: 12, height: 12, background: color, transform: 'rotate(45deg)', margin: '0 34px', verticalAlign: 'middle'}} />
);

const Ribbon: React.FC<{
  words: string[];
  top: number;
  rot: number;
  bg: string;
  fg: string;
  dot: string;
  f: number;
  dir: 1 | -1;
  enter: number;
}> = ({words, top, rot, bg, fg, dot, f, dir, enter}) => {
  const seq = [...words, ...words, ...words, ...words];
  const x = dir === -1 ? -f * 6 : -1200 + f * 6;
  return (
    <div
      style={{
        position: 'absolute',
        left: -260,
        top,
        width: 1600,
        height: 100,
        background: bg,
        transform: `rotate(${rot}deg) scaleX(${enter})`,
        transformOrigin: dir === -1 ? 'left center' : 'right center',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(14,26,51,0.25)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          whiteSpace: 'nowrap',
          transform: `translateX(${x}px)`,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: '0.22em',
          color: fg,
        }}
      >
        {seq.map((w, i) => (
          <span key={i}>
            {w}
            <Diamond color={dot} />
          </span>
        ))}
      </div>
    </div>
  );
};

// 00:26.4 – 00:31.6  ·  Layanan
export const Services: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = tween(f, 0, 18, 0, 1, EASE_IN_OUT);
  const edgeX = (1 - wipe) * 1080;
  const thread = tween(f, 12, 96, 0, 1, EASE_IN_OUT);
  const r1 = tween(f, BEAT * 5, BEAT * 5 + 14, 0, 1, EASE_OUT);
  const r2 = tween(f, BEAT * 5 + 6, BEAT * 5 + 20, 0, 1, EASE_OUT);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `inset(0 0 0 ${edgeX}px)`}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 45%, ${C.paper} 0%, ${C.ivory} 60%, ${C.cream} 100%)`}} />
        <Kawung id="kawungLayanan" color={C.blue} opacity={0.05} drift={f * 0.3} />

        <div style={{position: 'absolute', top: 282, width: '100%', display: 'flex', justifyContent: 'center', opacity: tween(f, 8, 20)}}>
          <Eyebrow color={C.blue}>Layanan kami</Eyebrow>
        </div>

        <Thread id="svcThread" d={THREAD} progress={thread} strokeWidth={3.5} needle glow={false} />

        {LINES.map((l, i) => {
          const t = BEAT * (i + 1);
          const p = tween(f, t, t + 14, 0, 1, EASE_OUT);
          const side = i % 2 === 0 ? -1 : 1;
          return (
            <div
              key={l.text}
              style={{
                position: 'absolute',
                top: 400 + i * 160,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: SERIF,
                fontStyle: l.italic ? 'italic' : 'normal',
                fontWeight: l.italic ? 400 : 500,
                fontSize: 108,
                lineHeight: 1,
                color: l.italic ? C.goldDeep : C.night,
                opacity: p,
                transform: `translateX(${(1 - p) * side * 260}px)`,
                filter: `blur(${(1 - p) * 10}px)`,
                whiteSpace: 'nowrap',
              }}
            >
              {l.text}
            </div>
          );
        })}

        <Ribbon
          words={['WISUDA', 'LAMARAN', 'PERNIKAHAN', 'LEBARAN', 'KANTOR', 'ACARA KELUARGA']}
          top={1190}
          rot={-4}
          bg={C.blue}
          fg={C.ivory}
          dot={C.goldLight}
          f={f}
          dir={-1}
          enter={r1}
        />
        <Ribbon
          words={['UKUR', 'POTONG', 'JAHIT', 'PAS']}
          top={1310}
          rot={3}
          bg={C.gold}
          fg={C.night}
          dot={C.paper}
          f={f}
          dir={1}
          enter={r2}
        />
      </AbsoluteFill>

      {wipe > 0 && wipe < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: edgeX - 2,
            top: 0,
            width: 5,
            height: 1920,
            backgroundImage: `repeating-linear-gradient(180deg, ${C.gold} 0 20px, transparent 20px 32px)`,
            filter: 'drop-shadow(0 0 8px rgba(233,209,160,0.9))',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
