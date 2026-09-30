import {loadFont} from '@remotion/fonts';
import {ASSETS} from './assets';

// Font disimpan lokal (bukan dari internet) supaya render selalu konsisten.
// Cormorant Garamond & Plus Jakarta Sans — keduanya lisensi SIL OFL.
const F = ASSETS.fonts;
const faces: Array<{family: string; url: string; weight: string; style?: string}> = [
  {family: 'Cormorant Garamond', url: F.serif300, weight: '300'},
  {family: 'Cormorant Garamond', url: F.serif400, weight: '400'},
  {family: 'Cormorant Garamond', url: F.serif500, weight: '500'},
  {family: 'Cormorant Garamond', url: F.serif600, weight: '600'},
  {family: 'Cormorant Garamond', url: F.serif300i, weight: '300', style: 'italic'},
  {family: 'Cormorant Garamond', url: F.serif400i, weight: '400', style: 'italic'},
  {family: 'Cormorant Garamond', url: F.serif500i, weight: '500', style: 'italic'},
  {family: 'Plus Jakarta Sans', url: F.sans400, weight: '400'},
  {family: 'Plus Jakarta Sans', url: F.sans500, weight: '500'},
  {family: 'Plus Jakarta Sans', url: F.sans600, weight: '600'},
  {family: 'Plus Jakarta Sans', url: F.sans700, weight: '700'},
];

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  for (const f of faces) {
    loadFont({family: f.family, url: f.url, weight: f.weight, style: f.style ?? 'normal', format: 'woff2'}).catch(
      (err) => console.error('Font gagal dimuat', f, err),
    );
  }
};
