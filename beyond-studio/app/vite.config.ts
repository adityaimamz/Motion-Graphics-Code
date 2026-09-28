import { defineConfig } from 'vite';
import path from 'node:path';

// BS_NO_HMR=1: no live reload (export renders must not reload mid-run when a file changes)
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 5173, strictPort: false, hmr: process.env.BS_NO_HMR ? false : undefined, fs: { allow: [path.resolve(import.meta.dirname, '..')] } },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});
