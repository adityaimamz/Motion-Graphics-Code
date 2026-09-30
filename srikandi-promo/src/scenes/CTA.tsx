import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FaceMark, Wordmark, faceWidthFor} from '../components/Logo';
import {GoldDust, Kawung, StitchLine} from '../components/primitives';
import {BEAT, BRAND, C, EASE_IN_OUT, EASE_OUT, SANS, SERIF, tween} from '../theme';

const PHONE =
  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';
const PIN =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

const FACE_H = 250;
const WORD_W = 600;

// 00:30.8 – 00:38.4  ·  Ajakan: WhatsApp + alamat, ditahan cukup lama untuk di-screenshot
export const CTA: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const open = tween(f, 0, 22, 0, 1, EASE_IN_OUT);
  const radius = open * 1250;

  const logoAt = 12;
  const faceS = spring({frame: f - logoAt, fps, config: {damping: 14, stiffness: 120, mass: 0.8}});
  const word = tween(f, logoAt + 6, logoAt + 30, 0, 1, EASE_IN_OUT);
  const tailor = tween(f, logoAt + 22, logoAt + 36, 0, 1, EASE_OUT);
  const headAt = BEAT * 2 - 6; // 30
  const pillAt = BEAT * 3 - 6; // 48
  const addrAt = BEAT * 4 - 6; // 66
  const pillS = spring({frame: f - pillAt, fps, config: {damping: 13, stiffness: 140, mass: 0.9}});
  const addr = tween(f, addrAt, addrAt + 16, 0, 1, EASE_OUT);
  const frameP = tween(f, 10, 50, 0, 1, EASE_IN_OUT);

  // Kilau berulang pada tombol + denyut cincin
  const shineCycle = 66;
  const shineT = ((f - pillAt - 20) % shineCycle + shineCycle) % shineCycle;
  const shineX = -300 + (shineT / 26) * 1300;
  const pulseCycle = 44;
  const pulseT = ((f - pillAt - 10) % pulseCycle + pulseCycle) % pulseCycle;
  const pulse = f > pillAt + 10 ? pulseT / pulseCycle : 0;

  const faceTop = 318;
  const wordTop = faceTop + FACE_H + 34;

  return (
    <AbsoluteFill style={{clipPath: `circle(${radius}px at 540px 960px)`}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 38%, ${C.blueLight} 0%, ${C.blue} 42%, ${C.blueDeep} 100%)`}} />
      <Kawung id="kawungCta" opacity={0.07} drift={f * 0.25} />
      <GoldDust seed="cta" count={30} opacity={0.9} />

      {/* bingkai garis emas ganda */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {[44, 58].map((m, i) => (
          <rect
            key={m}
            x={m}
            y={m}
            width={1080 - m * 2}
            height={1920 - m * 2}
            rx={i === 0 ? 6 : 2}
            fill="none"
            stroke={C.gold}
            strokeOpacity={i === 0 ? 0.75 : 0.4}
            strokeWidth={i === 0 ? 2 : 1.2}
            pathLength={1}
            strokeDasharray={`${frameP} 1`}
          />
        ))}
      </svg>

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          left: 540 - faceWidthFor(FACE_H) / 2,
          top: faceTop,
          transform: `scale(${0.8 + faceS * 0.2})`,
          opacity: Math.min(1, Math.max(0, faceS) * 1.4),
          filter: 'drop-shadow(0 10px 24px rgba(0,20,60,0.45))',
        }}
      >
        <FaceMark height={FACE_H} />
      </div>
      <div style={{position: 'absolute', left: 540 - WORD_W / 2 + 16, top: wordTop}}>
        <Wordmark width={WORD_W} reveal={word} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: wordTop + 160 + 22,
          width: '100%',
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: `${0.4 + tailor * 0.35}em`,
          paddingLeft: '0.7em',
          color: C.ivory,
          opacity: tailor,
        }}
      >
        TAILOR
      </div>

      {/* Headline */}
      <div
        style={{
          position: 'absolute',
          top: 918,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 78,
            lineHeight: 1,
            color: C.goldLight,
            opacity: tween(f, headAt, headAt + 14),
            transform: `translateY(${(1 - tween(f, headAt, headAt + 16, 0, 1, EASE_OUT)) * 30}px)`,
          }}
        >
          Wujudkan busana impianmu.
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 29,
            color: 'rgba(246,240,230,0.82)',
            opacity: tween(f, headAt + 6, headAt + 20),
          }}
        >
          Konsultasi dulu — kami bantu dari ukur sampai jadi.
        </div>
      </div>

      {/* Tombol WhatsApp */}
      <div style={{position: 'absolute', top: 1108, left: 110, width: 860, height: 156}}>
        {/* cincin denyut */}
        {pulse > 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: -pulse * 26,
              borderRadius: 100,
              border: `2px solid ${C.goldLight}`,
              opacity: (1 - pulse) * 0.7,
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 78,
            background: C.paper,
            boxShadow: '0 30px 60px rgba(0,16,48,0.45), inset 0 -4px 0 rgba(201,164,92,0.35)',
            transform: `translateY(${(1 - pillS) * 120}px) scale(${0.85 + Math.min(1, pillS) * 0.15 + Math.sin(f / 9) * 0.006 * Math.min(1, pillS)})`,
            opacity: Math.min(1, Math.max(0, pillS) * 1.5),
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            padding: '0 36px 0 26px',
            gap: 26,
          }}
        >
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: '50%',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 14px rgba(37,211,102,0.35)',
            }}
          >
            <svg width={58} height={58} viewBox="0 0 24 24">
              <path d={PHONE} fill="#fff" />
            </svg>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', color: C.blue}}>
              CHAT VIA WHATSAPP
            </div>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 54, letterSpacing: '0.005em', color: C.night, lineHeight: 1.05, whiteSpace: 'nowrap'}}>
              {BRAND.whatsapp}
            </div>
          </div>
          {/* kilau */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              left: shineX,
              width: 120,
              height: 240,
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0))',
              transform: 'rotate(20deg)',
              opacity: shineT < 26 ? 1 : 0,
            }}
          />
        </div>
      </div>

      {/* Alamat */}
      <div
        style={{
          position: 'absolute',
          top: 1318,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: addr,
          transform: `translateY(${(1 - addr) * 24}px)`,
        }}
      >
        <StitchLine width={180} progress={addr} thickness={2} color={C.gold} style={{marginBottom: 28}} />
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 16}}>
          <svg width={40} height={40} viewBox="0 0 24 24" style={{marginTop: 2, flexShrink: 0}}>
            <path d={PIN} fill={C.goldLight} />
          </svg>
          <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 31, lineHeight: 1.45, color: C.ivory}}>
            {BRAND.addressLine1}
            <br />
            <span style={{color: 'rgba(246,240,230,0.75)'}}>{BRAND.addressLine2}</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
