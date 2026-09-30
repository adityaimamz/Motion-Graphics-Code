import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence} from 'remotion';
import {ASSETS} from './assets';
import {Grain, Vignette} from './components/primitives';
import {ensureFonts} from './fonts';
import {CTA} from './scenes/CTA';
import {Collection} from './scenes/Collection';
import {Details} from './scenes/Details';
import {Hook} from './scenes/Hook';
import {LogoReveal} from './scenes/LogoReveal';
import {Services} from './scenes/Services';
import {Verbs} from './scenes/Verbs';
import {Why} from './scenes/Why';
import {C, DURATION, SCENES} from './theme';

ensureFonts();

export type PromoProps = {
  /** Musik latar (bernuansa gamelan, 100 BPM). Matikan kalau mau pakai lagu dari TikTok/IG. */
  withMusic: boolean;
  /** Efek suara (whoosh, gong, klik) yang sinkron dengan animasi. */
  withSfx: boolean;
};

const S = SCENES;

export const SrikandiPromo: React.FC<PromoProps> = ({withMusic, withSfx}) => {
  return (
    <AbsoluteFill style={{background: C.night}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 65% at 50% 45%, ${C.nightSoft} 0%, ${C.night} 72%)`}} />

      <Sequence from={S.hook.from} durationInFrames={S.hook.dur} name="01 Hook">
        <Hook />
      </Sequence>
      <Sequence from={S.verbs.from} durationInFrames={S.verbs.dur} name="02 Diukur·Dipotong·Dijahit">
        <Verbs />
      </Sequence>
      <Sequence from={S.details.from} durationInFrames={S.details.dur} name="03 Detail">
        <Details />
      </Sequence>
      {/* Koleksi sengaja di bawah logo: logo "terbelah" membuka koleksi */}
      <Sequence from={S.collection.from} durationInFrames={S.collection.dur} name="05 Koleksi">
        <Collection />
      </Sequence>
      <Sequence from={S.logo.from} durationInFrames={S.logo.dur} name="04 Logo">
        <LogoReveal />
      </Sequence>
      <Sequence from={S.why.from} durationInFrames={S.why.dur} name="06 Kenapa Srikandi">
        <Why />
      </Sequence>
      <Sequence from={S.services.from} durationInFrames={S.services.dur} name="07 Layanan">
        <Services />
      </Sequence>
      <Sequence from={S.cta.from} durationInFrames={S.cta.dur} name="08 WhatsApp & Alamat">
        <CTA />
      </Sequence>

      <Grain />
      <Vignette strength={0.2} />

      {withMusic ? (
        <Audio
          src={ASSETS.audio.music}
          volume={(f) => interpolate(f, [0, 4, DURATION - 30, DURATION], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        />
      ) : null}
      {withSfx ? <Audio src={ASSETS.audio.sfx} volume={0.9} /> : null}
    </AbsoluteFill>
  );
};
