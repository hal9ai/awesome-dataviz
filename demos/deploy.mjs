// Deploys the live demos to Cloudish (https://cloudish.ai), one project per
// demo, modeled on site/scripts/deploy.mjs: upload a build context (the
// demo's folder plus the shared data), wait for the server-side image build,
// give the project a readable subdomain and check that it answers.
//
//   CLOUDISH_API_KEY=... node demos/deploy.mjs all
//   CLOUDISH_API_KEY=... node demos/deploy.mjs streamlit matplotlib
//   node demos/deploy.mjs --dry-run all      build the contexts, call nothing
//   node demos/deploy.mjs --local shiny-r    docker build + run it on :8080
//
// Optional: CLOUDISH_API (default https://cloudish.ai), DEMOS_PREFIX (project
// and subdomain prefix, default "awesomedataviz"), DEMOS_IDLE_TIMEOUT (seconds;
// sets the key's idle timeout, which applies to every app on the key),
// DEMOS_ALLOW_ALWAYS_ON=1 (deploy even if the key keeps apps always on).

import { execFileSync, spawn } from 'node:child_process';
import { appendFileSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEMOS_DIR = resolve(dirname(fileURLToPath(import.meta.url)));
const API = process.env.CLOUDISH_API || 'https://cloudish.ai';
const KEY = process.env.CLOUDISH_API_KEY;
const PREFIX = process.env.DEMOS_PREFIX || 'awesomedataviz';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Container sizes follow cloudish.ai/instances.md: `shared` (0.1 CPU, 0.2 GB,
// bursting to 1 CPU / 1 GB) suits small servers; Streamlit and Shiny keep a
// session per visitor and use more than 0.2 GB, so they get `small`.
const DEMOS = {
  'js-gallery': { cpuCores: '0.1', memoryGb: '0.2', buildCpuCores: '1', buildMemoryGb: '2', health: '/healthz' },
  matplotlib: { cpuCores: '0.1', memoryGb: '0.2', buildCpuCores: '2', buildMemoryGb: '2', health: '/healthz' },
  streamlit: { cpuCores: '0.5', memoryGb: '1', buildCpuCores: '2', buildMemoryGb: '2', health: '/_stcore/health' },
  'shiny-r': { cpuCores: '0.5', memoryGb: '1', buildCpuCores: '2', buildMemoryGb: '4', health: '/' },
};
const SKIP = new Set(['data', 'node_modules', '.venv', '__pycache__', 'README.md']);
const DATA_FILES = ['data/gapminder.csv', 'data/world.geojson'];

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
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}${path}`, { signal: AbortSignal.timeout(60000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function deploy(name, alias) {
  const spec = DEMOS[name];
  const project = `${PREFIX}-${name}`;
  const tarball = buildContext(name);
  console.log(`${name}: context ${(statSync(tarball).size / 1e6).toFixed(2)} MB -> ${alias}/${project}`);

  const form = new FormData();
  const { health, ...sizes } = spec;
  for (const [k, v] of Object.entries({ name: project, port: '8080', ...sizes })) form.append(k, v);
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

function local(name, port = process.env.PORT || '8080') {
  const tag = `${PREFIX}-${name}`;
  const tarball = buildContext(name);
  execFileSync('docker', ['build', '-t', tag, '-'], { input: readFileSync(tarball), stdio: ['pipe', 'inherit', 'inherit'] });
  console.log(`Running ${tag} on http://localhost:${port}/ (Ctrl-C to stop)`);
  spawn('docker', ['run', '--rm', '-p', `${port}:8080`, tag], { stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0));
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  let names = args.filter((a) => !a.startsWith('--'));
  if (names.includes('all')) names = Object.keys(DEMOS);
  const unknown = names.filter((n) => !DEMOS[n]);
  if (!names.length || unknown.length) {
    throw new Error(`Usage: node demos/deploy.mjs [--dry-run|--local] all|${Object.keys(DEMOS).join('|')}${unknown.length ? ` (unknown: ${unknown.join(', ')})` : ''}`);
  }

  if (flags.has('--local')) {
    if (names.length !== 1) throw new Error('--local runs one demo at a time.');
    return local(names[0]);
  }
  if (flags.has('--dry-run')) {
    for (const name of names) {
      const tarball = buildContext(name);
      const listing = execFileSync('tar', ['-tzf', tarball]).toString().trim().split('\n');
      console.log(`${name}: ${(statSync(tarball).size / 1e6).toFixed(2)} MB, ${listing.length} entries, project ${PREFIX}-${name}, size ${DEMOS[name].cpuCores} CPU / ${DEMOS[name].memoryGb} GB`);
    }
    return;
  }

  if (!KEY) throw new Error('Set CLOUDISH_API_KEY.');
  const me = await api('/api/v1/me');
  console.log(`Deploying ${names.join(', ')} as ${me.alias} (balance ${me.balance ?? '?'} credits).`);

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
  for (const name of names) urls[name] = await deploy(name, me.alias);
  console.log('\nFor site/data/demos.mjs:');
  for (const [name, url] of Object.entries(urls)) console.log(`  ${name}: ${url}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Demos deployed\n\n${Object.entries(urls).map(([n, u]) => `- ${n}: ${u}`).join('\n')}\n`);
  }
}

main().catch((error) => {
  console.error(`Deploy failed: ${error.message}`);
  process.exit(1);
});
