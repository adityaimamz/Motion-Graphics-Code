import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// Ubah ke angka lebih kecil (mis. 2) kalau komputer terasa berat saat render.
// Config.setConcurrency(2);
