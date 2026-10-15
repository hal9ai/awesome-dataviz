// Screenshots every live demo (data/demos.mjs) from its deployed URL into
// .cache/demo-screenshots/, where the build picks them up for the /demos/ page
// and the tool pages. A screenshot is retaken when its demo folder (or the
// shared data) or its URL changed since it was taken, or once it is a week old; a demo
// that doesn't answer keeps its previous screenshot, so this never fails a
// build. Needs Chrome or Chromium (CHROME_PATH), no npm packages.
//
//   node scripts/screenshots.mjs              refresh what's missing or stale
//   node scripts/screenshots.mjs --force      retake all
//   node scripts/screenshots.mjs js-gallery   only these demo folders

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import DEMOS, { demoFor } from '../data/demos.mjs';
import { DATA_FILES, DEMOS_DIR } from '../../demos/manifest.mjs';
import { findChrome, screenshot } from '../../demos/screenshot.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCREENSHOTS_DIR = join(SITE_DIR, '.cache', 'demo-screenshots'); // read by src/build.mjs
const INDEX = join(SCREENSHOTS_DIR, 'index.json');
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function* files(dir) {
  for (const name of readdirSync(dir).sort()) {
    if (['node_modules', '__pycache__', '.venv', 'data'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else yield p;
  }
}

// Changes when anything that could change how the demo looks changes.
function fingerprint(folder) {
  const hash = createHash('sha256');
  for (const f of [...files(join(DEMOS_DIR, folder)), ...DATA_FILES.map((d) => join(DEMOS_DIR, d))]) {
    hash.update(relative(DEMOS_DIR, f)).update(readFileSync(f));
  }
  return hash.digest('hex').slice(0, 16);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = new Set(args.filter((a) => !a.startsWith('--')));
  const warn = (message) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `  warning: ${message}`);
  if (!findChrome()) return warn('No Chrome or Chromium found (set CHROME_PATH); demo screenshots not refreshed.');

  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : {};
  const demos = Object.keys(DEMOS).map((url) => demoFor(url)).filter((d) => !only.size || only.has(d.demo));
  let taken = 0;
  for (const d of demos) {
    const print = fingerprint(d.demo);
    const file = join(SCREENSHOTS_DIR, `${d.key}.webp`);
    const prev = index[d.key];
    const fresh = prev && prev.fingerprint === print && prev.url === d.url && existsSync(file) && Date.now() - Date.parse(prev.takenAt) < MAX_AGE;
    if (fresh && !force) continue;
    const started = Date.now();
    try {
      // Write next to the old one and swap, so a failure keeps the old screenshot.
      await screenshot(d.url, `${file}.tmp.webp`, { ready: d.ready, timeout: 150000 });
      renameSync(`${file}.tmp.webp`, file);
      index[d.key] = { fingerprint: print, takenAt: new Date().toISOString(), url: d.url };
      writeFileSync(INDEX, JSON.stringify(index, null, 1));
      taken++;
      console.log(`  ${d.key}: ${d.url} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    } catch (error) {
      warn(`screenshot of ${d.url} failed: ${error.message}${existsSync(file) ? ' (keeping the previous one)' : ''}`);
    }
  }
  console.log(`Demo screenshots: ${taken} taken, ${demos.length - taken} kept.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
