// Vice Cover Studio — the program that hands this entry in (Node 22, standard
// library only). It copies the app's static files and the screenshots from
// beside this file into /output and writes /output/dossier.json with the
// vendored make.fun library, so the judge reads exactly the app the browser
// ran. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer refuses an entry that breaks its caps, so refuse early here with
// a plain message instead of writing a dossier the gate would reject: at most
// 4 screenshots, each at most 256 KiB, each a whole JPEG or PNG, and app/
// within its file and byte caps.
const SHOT_DIR = join(here, 'screenshots');
const shotNames = existsSync(SHOT_DIR) ? readdirSync(SHOT_DIR).filter((n) => !n.startsWith('.')) : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(
    `screenshots/ must hold 3 or 4 images, found ${shotNames.length}: ${shotNames.join(', ')}`,
  );
}
for (const name of shotNames) {
  const file = join(SHOT_DIR, name);
  const bytes = statSync(file).size;
  if (bytes > 262144) throw new Error(`screenshots/${name} is ${bytes} bytes, over the 256 KiB cap`);
  const head = readFileSync(file).subarray(0, 8);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (!isJpeg && !isPng) throw new Error(`screenshots/${name} is not a JPEG or PNG file`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(SHOT_DIR, join(out, 'screenshots'), { recursive: true });

// Only text_max_bytes shapes the dossier's bytes; the other caps mirror the
// scorer's gate so a dossier written here is one the gate accepts.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
