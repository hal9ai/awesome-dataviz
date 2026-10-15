// Reads the demos: every folder under demos/ with a demo.json is one demo,
// deployed as one Cloudish project and shown on awesomedataviz.com. The folder
// name is the demo's id (and its URL label), so adding a demo needs nothing
// outside its folder. deploy.mjs and the site (site/data/demos.mjs) both read
// demos through here.
//
// demo.json:
//
//   runs       "browser" (the library draws in the browser) or "server"
//   health     path that answers 200 once the app is up (default "/")
//   size       Cloudish container and build sizes (default the smallest)
//   views      which of VIEWS it has (default all three)
//   libraries  one entry per library the demo shows, usually one:
//     tool     the exact URL the library's README entry links to
//     label    the name to show when the tool's name is too short ("Shiny for R")
//     page     path within the app, when one app serves several libraries
//     source   file or folder to link as the demo's source (default the folder)
//     note     one short caveat, shown next to the views
//     ready    CSS selector that appears once the charts are drawn, for screenshots

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEMOS_DIR = resolve(dirname(fileURLToPath(import.meta.url)));
export const DATA_FILES = ['data/gapminder.csv', 'data/world.geojson'];

export const VIEWS = {
  scatter: 'GDP per capita vs life expectancy by year',
  line: 'life expectancy over time for one country',
  map: 'a world map of one metric for one year',
};

// `shared` in cloudish.ai/instances.md: 0.1 CPU and 0.2 GB, bursting to 1 / 1.
const DEFAULT_SIZE = { cpuCores: '0.1', memoryGb: '0.2', buildCpuCores: '1', buildMemoryGb: '2' };
const NAME = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/; // also the Cloudish project and subdomain label
const LIBRARY_KEYS = new Set(['tool', 'label', 'page', 'source', 'note', 'ready']);
const DEMO_KEYS = new Set(['runs', 'health', 'size', 'views', 'libraries']);

// Validates one demo.json; returns a list of problems (empty when it's fine).
export function problems(name, spec, dir = join(DEMOS_DIR, name)) {
  const out = [];
  if (!NAME.test(name)) out.push(`folder name "${name}" must be lowercase letters, digits and dashes (it becomes the URL)`);
  if (!existsSync(join(dir, 'Dockerfile'))) out.push('no Dockerfile');
  if (!existsSync(join(dir, 'README.md'))) out.push('no README.md');
  for (const k of Object.keys(spec)) if (!DEMO_KEYS.has(k)) out.push(`unknown key "${k}"`);
  if (!['browser', 'server'].includes(spec.runs)) out.push('"runs" must be "browser" or "server"');
  if (spec.health != null && !String(spec.health).startsWith('/')) out.push('"health" must be a path starting with /');
  if (spec.views != null && !(Array.isArray(spec.views) && spec.views.length && spec.views.every((v) => VIEWS[v]))) out.push(`"views" must list some of ${Object.keys(VIEWS).join(', ')}`);
  if (!Array.isArray(spec.libraries) || !spec.libraries.length) out.push('"libraries" must list at least one library');
  for (const [i, lib] of (spec.libraries ?? []).entries()) {
    const at = `libraries[${i}]`;
    for (const k of Object.keys(lib)) if (!LIBRARY_KEYS.has(k)) out.push(`${at}: unknown key "${k}"`);
    if (!/^https?:\/\//.test(lib.tool ?? '')) out.push(`${at}: "tool" must be the URL the README entry links to`);
    if (lib.source && !existsSync(join(dir, lib.source))) out.push(`${at}: source "${lib.source}" not found in the folder`);
    if (lib.page && /^\/|^https?:/.test(lib.page)) out.push(`${at}: "page" is a path relative to the app, like "index.html"`);
  }
  return out;
}

// Every demo, sorted by folder name. Throws, listing every problem, when a
// demo.json is invalid, so a bad pull request fails its checks.
export function loadDemos(dir = DEMOS_DIR) {
  const demos = [];
  const errors = [];
  for (const name of readdirSync(dir).sort()) {
    const file = join(dir, name, 'demo.json');
    if (!statSync(join(dir, name)).isDirectory() || !existsSync(file)) continue;
    let spec;
    try {
      spec = JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      errors.push(`demos/${name}/demo.json: ${error.message}`);
      continue;
    }
    const found = problems(name, spec, join(dir, name));
    if (found.length) {
      errors.push(...found.map((p) => `demos/${name}/demo.json: ${p}`));
      continue;
    }
    demos.push({
      name,
      runs: spec.runs,
      health: spec.health ?? '/',
      size: { ...DEFAULT_SIZE, ...spec.size },
      views: spec.views ?? Object.keys(VIEWS),
      libraries: spec.libraries.map((lib) => ({ ...lib, page: lib.page ?? '', source: `demos/${name}${lib.source ? `/${lib.source}` : ''}` })),
    });
  }
  const tools = demos.flatMap((d) => d.libraries.map((l) => l.tool));
  for (const t of new Set(tools)) if (tools.indexOf(t) !== tools.lastIndexOf(t)) errors.push(`${t} has more than one demo`);
  if (errors.length) throw new Error(`Invalid demos:\n  ${errors.join('\n  ')}`);
  return demos;
}

// The file name a library's screenshot is stored under: the folder, plus the
// page when one app serves several libraries ("js-gallery-plotly").
export function screenshotKey(name, page = '') {
  const base = page.replace(/\.[a-z]+$/i, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return base && base !== 'index' ? `${name}-${base}` : name;
}
