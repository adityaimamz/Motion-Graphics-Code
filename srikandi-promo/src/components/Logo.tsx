import React from 'react';
import {FACE_PATH, FACE_VIEWBOX, WORD_PATH, WORD_VIEWBOX} from '../logoPaths';

/** Ikon wajah Srikandi (vektor). */
export const FaceMark: React.FC<{height: number; color?: string; style?: React.CSSProperties}> = ({
  height,
  color = '#FFFFFF',
  style,
}) => {
  const width = (height * FACE_VIEWBOX.w) / FACE_VIEWBOX.h;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${FACE_VIEWBOX.w} ${FACE_VIEWBOX.h}`} style={{display: 'block', overflow: 'visible', ...style}}>
      <path d={FACE_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
};

/** Wordmark "Srikandi" + garis bawahnya (vektor). `reveal` 0→1 = tulisan muncul dari kiri. */
export const Wordmark: React.FC<{
  width: number;
  color?: string;
  reveal?: number;
  style?: React.CSSProperties;
}> = ({width, color = '#FFFFFF', reveal = 1, style}) => {
  const height = (width * WORD_VIEWBOX.h) / WORD_VIEWBOX.w;
  const edge = reveal * 112 - 6; // tepi lembut ±6%
  const mask =
    reveal >= 1
      ? undefined
      : `linear-gradient(90deg, #000 0%, #000 ${edge}%, transparent ${edge + 6}%, transparent 100%)`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${WORD_VIEWBOX.w} ${WORD_VIEWBOX.h}`}
      style={{display: 'block', overflow: 'visible', WebkitMaskImage: mask, maskImage: mask, ...style}}
    >
      <path d={WORD_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
};

export const faceWidthFor = (height: number) => (height * FACE_VIEWBOX.w) / FACE_VIEWBOX.h;
export const wordHeightFor = (width: number) => (width * WORD_VIEWBOX.h) / WORD_VIEWBOX.w;
