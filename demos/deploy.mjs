// Deploys the live demos to Cloudish (https://cloudish.ai), one project per
// demo, modeled on site/scripts/deploy.mjs: upload a build context (the
// demo's folder plus the shared data), wait for the server-side image build,
// give the project a readable subdomain and check that it answers.
//
//   CLOUDISH_API_KEY=... node demos/deploy.mjs all
//   CLOUDISH_API_KEY=... node demos/deploy.mjs streamlit matplotlib
//   node demos/deploy.mjs --dry-run all      build the contexts, call nothing
//   node demos/deploy.mjs --local shiny-r    docker build + run it on :8080
//   node demos/deploy.mjs --check bokeh      docker build, run, health check and
//                                            screenshot it into demos/.screenshots/
//   node demos/deploy.mjs --changed origin/main   print the demos changed since a ref
//
// Optional: CLOUDISH_API (default https://cloudish.ai), DEMOS_PREFIX (project
// and subdomain prefix; default "<your key's alias>-demo", and
// "awesomedataviz" only for the account that serves awesomedataviz.com, set by
// .github/workflows/demos.yaml), DEMOS_IDLE_TIMEOUT (seconds; sets the key's
// idle timeout, which applies to every app on the key),
// DEMOS_ALLOW_ALWAYS_ON=1 (deploy even if the key keeps apps always on).

import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DATA_FILES, DEMOS_DIR, loadDemos, screenshotKey } from './manifest.mjs';
import { screenshot } from './screenshot.mjs';

const API = process.env.CLOUDISH_API || 'https://cloudish.ai';
const KEY = process.env.CLOUDISH_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One entry per folder with a demo.json (manifest.mjs). Container sizes
// follow cloudish.ai/instances.md: `shared` (0.1 CPU, 0.2 GB, bursting to
// 1 CPU / 1 GB) suits small servers; Streamlit and Shiny keep a session per
// visitor and use more than 0.2 GB, so they ask for `small` in their demo.json.
const DEMOS = Object.fromEntries(loadDemos().map((d) => [d.name, d]));
const SKIP = new Set(['data', 'node_modules', '.venv', '__pycache__', 'README.md', 'demo.json']);

// The build context: the demo's own files at the root (so its Dockerfile is
// at the root, as Cloudish requires) plus the shared data under data/.
function buildContext(name) {
  const dir = join(DEMOS_DIR, name);
  const files = readdirSync(dir).filter((f) => !SKIP.has(f));
  if (!files.includes('Dockerfile')) throw new Error(`${name} has no Dockerfile.`);
  const tarball = join(mkdtempSync(join(tmpdir(), `adv-demo-${name}-`)), 'context.tar.gz');
  execFileSync('tar', ['-czf', tarball, '--exclude=__pycache__', '--exclude=node_modules', '-C', dir, ...files, '-C', DEMOS_DIR, ...DATA_FILES]);
  return tarball;
}

async function api(path, { method = 'GET', json, form } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${KEY}`, ...(json ? { 'content-type': 'application/json' } : {}) },
    body: json ? JSON.stringify(json) : form,
    signal: AbortSignal.timeout(10 * 60 * 1000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500)}`);
  return body;
}

// A sleeping app starts on the first request, so allow for a cold start.
async function answers(url, path) {
  // A ref'd timer, not AbortSignal.timeout(): that one doesn't keep Node
  // alive, and a fetch that stalls on a container still starting up then
  // lets the process exit, with status 0, halfway through.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}${path}`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function deploy(name, alias, prefix) {
  const { size, health } = DEMOS[name];
  const project = `${prefix}-${name}`;
  const tarball = buildContext(name);
  console.log(`${name}: context ${(statSync(tarball).size / 1e6).toFixed(2)} MB -> ${alias}/${project}`);

  const form = new FormData();
  for (const [k, v] of Object.entries({ name: project, port: '8080', ...size })) form.append(k, v);
  form.append('context', new Blob([readFileSync(tarball)], { type: 'application/gzip' }), 'context.tar.gz');
  const created = await api('/api/v1/projects', { method: 'POST', form });
  const id = created.build?.id;
  if (!id) throw new Error(`No build started: ${JSON.stringify(created).slice(0, 500)}`);

  let build;
  let last = '';
  const deadline = Date.now() + 30 * 60 * 1000;
  for (;;) {
    build = (await api(`/api/v1/images/builds/${id}`)).build;
    if (build.status !== last) console.log(`  build ${id}: ${(last = build.status)}`);
    if (build.status === 'succeeded' || build.status === 'failed') break;
    if (Date.now() > deadline) throw new Error(`Build ${id} did not finish in time.`);
    await sleep(5000);
  }
  if (build.status === 'failed') {
    console.error(build.error ?? '');
    console.error(String(build.logs ?? '').split('\n').slice(-40).join('\n'));
    throw new Error(`Build ${id} of ${name} failed.`);
  }

  // A readable URL (<prefix>-<name>.<run domain>); keep the random one if the label is taken.
  let url;
  try {
    url = (await api(`/api/v1/projects/${alias}/${project}/subdomain`, { method: 'PUT', json: { label: project } })).subdomain?.url;
  } catch (error) {
    console.log(`  could not set the subdomain label "${project}": ${error.message}`);
  }
  if (!url) {
    const info = await api(`/api/v1/projects/${alias}/${project}`);
    url = (info.project ?? info).subdomain?.url ?? info.subdomain?.url;
  }
  if (!url) throw new Error(`${project} has no subdomain URL.`);

  const deadlineLive = Date.now() + 5 * 60 * 1000;
  while (!(await answers(url, health))) {
    if (Date.now() > deadlineLive) throw new Error(`${name} is not answering at ${url}${health}.`);
    await sleep(5000);
  }
  console.log(`  live at ${url}`);
  return url;
}

function dockerBuild(name) {
  const tag = `awesomedataviz-${name}`;
  const tarball = buildContext(name);
  execFileSync('docker', ['build', '-t', tag, '-'], { input: readFileSync(tarball), stdio: ['pipe', 'inherit', 'inherit'], maxBuffer: 1 << 30 });
  return tag;
}

function local(name, port = process.env.PORT || '8080') {
  const tag = dockerBuild(name);
  console.log(`Running ${tag} on http://localhost:${port}/ (Ctrl-C to stop)`);
  spawn('docker', ['run', '--rm', '-p', `${port}:8080`, tag], { stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0));
}

// What a pull request's checks run: build the image, start it the way
// Cloudish does (PORT=8080), wait for the health path, then screenshot every
// library page into demos/.screenshots/ the way the site will.
async function check(name) {
  const { health, libraries } = DEMOS[name];
  const tag = dockerBuild(name);
  const port = String(18000 + Math.floor(Math.random() * 1000));
  const container = execFileSync('docker', ['run', '-d', '--rm', '-p', `${port}:8080`, '-e', 'PORT=8080', tag]).toString().trim();
  try {
    const base = `http://localhost:${port}`;
    const deadline = Date.now() + 3 * 60 * 1000;
    while (!(await answers(base, health))) {
      if (Date.now() > deadline) throw new Error(`${name} did not answer 200 at ${health} within 3 minutes.`);
      await sleep(2000);
    }
    console.log(`${name}: answers at ${health}`);
    for (const lib of libraries) {
      const file = join(DEMOS_DIR, '.screenshots', `${screenshotKey(name, lib.page)}.png`);
      await screenshot(`${base}/${lib.page}`, file, { ready: lib.ready });
      console.log(`  ${lib.tool}: screenshot ${file}`);
    }
  } catch (error) {
    console.error(execFileSync('docker', ['logs', '--tail', '60', container]).toString());
    throw error;
  } finally {
    execFileSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
  }
}

// Demos whose folder changed since `ref`; all of them when the shared data
// or the tooling that builds, deploys and screenshots them did.
const SHARED = ['demos/data/', 'demos/deploy.mjs', 'demos/manifest.mjs', 'demos/screenshot.mjs'];
function changed(ref) {
  const files = execFileSync('git', ['diff', '--name-only', ref, 'HEAD', '--', '.'], { cwd: DEMOS_DIR }).toString().split('\n').filter(Boolean);
  if (files.some((f) => SHARED.some((s) => f.startsWith(s)))) return Object.keys(DEMOS);
  return [...new Set(files.map((f) => f.split('/')[1]))].filter((n) => DEMOS[n]);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  let names = args.filter((a) => !a.startsWith('--'));
  if (flags.has('--changed')) {
    if (names.length !== 1) throw new Error('Usage: node demos/deploy.mjs --changed <git ref>');
    return console.log(changed(names[0]).join(' '));
  }
  if (names.includes('all')) names = Object.keys(DEMOS);
  const unknown = names.filter((n) => !DEMOS[n]);
  if (!names.length || unknown.length) {
    throw new Error(`Usage: node demos/deploy.mjs [--dry-run|--local|--check] all|${Object.keys(DEMOS).join('|')}${unknown.length ? ` (unknown: ${unknown.join(', ')})` : ''}`);
  }

  if (flags.has('--local')) {
    if (names.length !== 1) throw new Error('--local runs one demo at a time.');
    return local(names[0]);
  }
  if (flags.has('--check')) {
    for (const name of names) await check(name);
    return;
  }
  if (flags.has('--dry-run')) {
    for (const name of names) {
      const tarball = buildContext(name);
      const listing = execFileSync('tar', ['-tzf', tarball]).toString().trim().split('\n');
      console.log(`${name}: ${(statSync(tarball).size / 1e6).toFixed(2)} MB, ${listing.length} entries, size ${DEMOS[name].size.cpuCores} CPU / ${DEMOS[name].size.memoryGb} GB`);
    }
    return;
  }

  if (!KEY) throw new Error('Set CLOUDISH_API_KEY.');
  const me = await api('/api/v1/me');
  // Not "awesomedataviz" by default: subdomain labels are global, and a
  // contributor's test deploy must not take the label the site links to.
  const prefix = process.env.DEMOS_PREFIX || `${me.alias}-demo`;
  console.log(`Deploying ${names.join(', ')} as ${me.alias} with prefix ${prefix} (balance ${me.balance ?? '?'} credits).`);

  // The idle timeout is a per-key setting. The site's own deploy sets its key
  // to always-on (0), so demos on that key would be billed around the clock.
  const idle = me.settings?.idleTimeoutSeconds;
  if (process.env.DEMOS_IDLE_TIMEOUT) {
    const seconds = Number(process.env.DEMOS_IDLE_TIMEOUT);
    await api('/api/v1/me', { method: 'PATCH', json: { settings: { ...(me.settings ?? {}), idleTimeoutSeconds: seconds } } });
    console.log(`  Set this key's idle timeout to ${seconds} s (applies to every app on the key).`);
  } else if (idle === 0 && process.env.DEMOS_ALLOW_ALWAYS_ON !== '1') {
    throw new Error('This key keeps apps always on (idleTimeoutSeconds 0), probably because it also serves awesomedataviz.com. Use a separate key for the demos, or set DEMOS_ALLOW_ALWAYS_ON=1 to deploy anyway.');
  } else {
    console.log(`  Idle timeout: ${idle == null ? 'the platform default' : `${idle} s`}.`);
  }

  const urls = {};
  for (const name of names) urls[name] = await deploy(name, me.alias, prefix);
  console.log('\nLive:');
  for (const [name, url] of Object.entries(urls)) console.log(`  ${name}: ${url}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Demos deployed\n\n${Object.entries(urls).map(([n, u]) => `- ${n}: ${u}`).join('\n')}\n`);
  }
}

// Never let a stalled promise end the run as a success.
let finished = false;
process.on('beforeExit', () => {
  if (finished) return;
  console.error('Deploy failed: exited before finishing (a request or build stalled).');
  process.exit(1);
});
main()
  .then(() => (finished = true))
  .catch((error) => {
    console.error(`Deploy failed: ${error.message}`);
    process.exit(1);
  });
