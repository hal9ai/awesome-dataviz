// Deploys the built site to Cloudish (https://cloudish.ai): uploads a build
// context (Dockerfile, server, dist), waits for the server-side image build,
// then confirms the new build is the one serving traffic.
//
//   CLOUDISH_API_KEY=... node scripts/deploy.mjs
//
// Optional: CLOUDISH_PROJECT (default "awesomedataviz"), SITE_DOMAIN
// (default "awesomedataviz.com"), CLOUDISH_API (default https://cloudish.ai).

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = process.env.CLOUDISH_API || 'https://cloudish.ai';
const KEY = process.env.CLOUDISH_API_KEY;
const PROJECT = process.env.CLOUDISH_PROJECT || 'awesomedataviz';
const DOMAIN = process.env.SITE_DOMAIN || 'awesomedataviz.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// The /healthz payload at `url` ({ buildId, host, ... }), or null.
async function health(url) {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/healthz`, { signal: AbortSignal.timeout(15000), redirect: 'manual' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
const liveBuild = async (url) => (await health(url))?.buildId ?? null;

async function waitFor(label, check, { timeout, every = 5000 }) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(every);
  }
  console.log(`  ${label}: timed out`);
  return false;
}

async function main() {
  if (!KEY) throw new Error('Set CLOUDISH_API_KEY.');
  const buildFile = join(SITE_DIR, 'dist', 'build.json');
  if (!existsSync(buildFile)) throw new Error('No dist/ build found. Run "npm run build" first.');
  const { buildId } = JSON.parse(readFileSync(buildFile, 'utf8'));

  const me = await api('/api/v1/me');
  const alias = me.alias;
  console.log(`Deploying build ${buildId} as ${alias}/${PROJECT} (balance ${me.balance ?? '?'} credits).`);

  // A public website should not cold-start: keep the container always on.
  if (me.settings?.idleTimeoutSeconds !== 0) {
    await api('/api/v1/me', { method: 'PATCH', json: { settings: { ...(me.settings ?? {}), idleTimeoutSeconds: 0 } } });
    console.log('  Set the idle timeout to always-on.');
  }

  // Redirect platform hostnames to the custom domain only once the running
  // server proves it sees that hostname; otherwise a redirect would loop.
  const probe = await health(`https://${DOMAIN}`);
  const domainLive = probe !== null;
  const hostSeen = probe?.host ?? null;
  const redirect = process.env.CANONICAL_REDIRECT === 'off' ? false : hostSeen === DOMAIN;
  const env = { CANONICAL_HOST: DOMAIN, REDIRECT_TO_CANONICAL: redirect ? '1' : '0' };
  if (!domainLive) console.log(`  https://${DOMAIN} is not serving yet; keeping the platform URL reachable.`);
  else if (redirect) console.log(`  https://${DOMAIN} is live; the platform URL will redirect to it.`);
  else console.log(`  https://${DOMAIN} is live, but the server sees host "${hostSeen ?? 'unknown'}"; not redirecting other hostnames.`);

  const tarball = join(mkdtempSync(join(tmpdir(), 'adv-deploy-')), 'context.tar.gz');
  execFileSync('tar', ['-czf', tarball, '-C', SITE_DIR, 'Dockerfile', 'package.json', 'server', 'dist']);
  console.log(`  Build context: ${(statSync(tarball).size / 1e6).toFixed(1)} MB.`);

  const form = new FormData();
  const fields = { name: PROJECT, port: '8080', cpuCores: '0.1', memoryGb: '0.2', buildCpuCores: '1', buildMemoryGb: '2', env: JSON.stringify(env) };
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append('context', new Blob([readFileSync(tarball)], { type: 'application/gzip' }), 'context.tar.gz');
  const created = await api('/api/v1/projects', { method: 'POST', form });
  const id = created.build?.id;
  if (!id) throw new Error(`No build started: ${JSON.stringify(created).slice(0, 500)}`);
  console.log(`  Image build ${id} started.`);

  let build;
  let last = '';
  const deadline = Date.now() + 25 * 60 * 1000;
  for (;;) {
    build = (await api(`/api/v1/images/builds/${id}`)).build;
    if (build.status !== last) console.log(`  Build ${id}: ${(last = build.status)}`);
    if (build.status === 'succeeded' || build.status === 'failed') break;
    if (Date.now() > deadline) throw new Error(`Build ${id} did not finish in time.`);
    await sleep(5000);
  }
  if (build.status === 'failed') {
    console.error(build.error ?? '');
    console.error(String(build.logs ?? '').split('\n').slice(-40).join('\n'));
    throw new Error(`Build ${id} failed.`);
  }

  const project = await api(`/api/v1/projects/${alias}/${PROJECT}`);
  const url = (project.project ?? project).subdomain?.url;
  if (!url) throw new Error('The project has no subdomain URL.');
  const live = await waitFor('Platform URL', async () => (await liveBuild(url)) === buildId, { timeout: 8 * 60 * 1000 });
  if (!live) throw new Error(`Build ${buildId} is not live at ${url}.`);
  console.log(`  Live at ${url}`);
  if (domainLive) {
    const ok = await waitFor(`https://${DOMAIN}`, async () => (await liveBuild(`https://${DOMAIN}`)) === buildId, { timeout: 3 * 60 * 1000 });
    if (ok) console.log(`  Live at https://${DOMAIN}/`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Deployed ${buildId}\n\n- ${domainLive ? `https://${DOMAIN}/` : url}\n- Cloudish image build ${id}\n`);
  }
}

main().catch((error) => {
  console.error(`Deploy failed: ${error.message}`);
  process.exit(1);
});
