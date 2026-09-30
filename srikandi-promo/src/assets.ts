import {staticFile} from 'remotion';

// Semua aset lokal di satu tempat. Ganti file di folder /public dengan nama
// yang sama bila ingin memakai foto lain.
export const ASSETS = {
  photos: {
    sage: staticFile('img/kebaya-sage.jpg'), // kebaya sage berpayet
    mint: staticFile('img/kebaya-mint.jpg'), // kebaya mint polos
    batik: staticFile('img/gaun-batik.jpg'), // gaun batik cokelat
  },
  grain: staticFile('img/grain.png'),
  audio: {
    music: staticFile('audio/musik.wav'),
    sfx: staticFile('audio/sfx.wav'),
  },
  fonts: {
    serif300: staticFile('fonts/cormorant-garamond-latin-300-normal.woff2'),
    serif400: staticFile('fonts/cormorant-garamond-latin-400-normal.woff2'),
    serif500: staticFile('fonts/cormorant-garamond-latin-500-normal.woff2'),
    serif600: staticFile('fonts/cormorant-garamond-latin-600-normal.woff2'),
    serif300i: staticFile('fonts/cormorant-garamond-latin-300-italic.woff2'),
    serif400i: staticFile('fonts/cormorant-garamond-latin-400-italic.woff2'),
    serif500i: staticFile('fonts/cormorant-garamond-latin-500-italic.woff2'),
    sans400: staticFile('fonts/plus-jakarta-sans-latin-400-normal.woff2'),
    sans500: staticFile('fonts/plus-jakarta-sans-latin-500-normal.woff2'),
    sans600: staticFile('fonts/plus-jakarta-sans-latin-600-normal.woff2'),
    sans700: staticFile('fonts/plus-jakarta-sans-latin-700-normal.woff2'),
  },
};
