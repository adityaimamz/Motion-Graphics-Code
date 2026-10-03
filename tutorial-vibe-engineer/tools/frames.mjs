// frames.mjs — extracts the frames of every clip in assets/ve/klip/*.mp4 into assets/ve/.frames/<name>/0001.jpg…
// (git-ignored cache). render.mjs calls ensureFrames() before serving or rendering, so a fresh clone only needs ffmpeg.
// Frame k of a clip is always the same image: the film stays a pure function of t.
import { readdir, mkdir, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KLIP = path.join(ROOT, 'assets/ve/klip'), CACHE = path.join(ROOT, 'assets/ve/.frames');
const run = (args) => new Promise((ok, bad) => spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] }).on('close', (c) => (c ? bad(new Error('ffmpeg ' + c)) : ok())));
const mtime = (p) => stat(p).then((s) => s.mtimeMs, () => 0);

export async function ensureFrames(force = false) {
  let files = [];
  try { files = (await readdir(KLIP)).filter((f) => f.endsWith('.mp4')); } catch { return 0; }
  let made = 0;
  for (const f of files) {
    const name = f.replace('.mp4', ''), dir = path.join(CACHE, name);
    const fresh = !force && (await mtime(path.join(dir, '0001.jpg'))) > (await mtime(path.join(KLIP, f)));
    if (fresh) continue;
    await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
    await run(['-v', 'error', '-y', '-i', path.join(KLIP, f), '-q:v', '2', path.join(dir, '%04d.jpg')]);
    made++;
  }
  if (made) console.log(`frame klip diekstrak: ${made} klip → assets/ve/.frames/`);
  return made;
}
