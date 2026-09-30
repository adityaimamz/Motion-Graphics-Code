import React from 'react';
import {Composition} from 'remotion';
import {SrikandiPromo, PromoProps} from './Main';
import {DURATION, FPS, HEIGHT, WIDTH} from './theme';

const defaultProps: PromoProps = {withMusic: true, withSfx: true};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SrikandiPromo"
    component={SrikandiPromo}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={defaultProps}
  />
);
