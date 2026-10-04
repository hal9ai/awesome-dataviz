// HTTP and caching helpers shared by the enrichment steps. Every remote fact
// is cached on disk with a timestamp, so a failed request can fall back to
// the last good value instead of dropping data from the site.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const HOUR = 3600 * 1000;
export const DAY = 24 * HOUR;

export class Cache {
  constructor(dir, name) {
    this.file = join(dir, `${name}.json`);
    this.entries = existsSync(this.file) ? JSON.parse(readFileSync(this.file, 'utf8')) : {};
  }
  // Fresh value or undefined.
  get(key, ttl) {
    const hit = this.entries[key];
    if (!hit) return undefined;
    return Date.now() - hit.at < ttl ? hit.value : undefined;
  }
  // Any value, however old: the fallback when a refresh fails.
  stale(key) {
    return this.entries[key]?.value;
  }
  set(key, value) {
    this.entries[key] = { at: Date.now(), value };
  }
  save() {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.entries));
  }
}

// Runs async jobs with at most `size` in flight.
export function limiter(size) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= size || !queue.length) return;
    active++;
    const { job, resolve, reject } = queue.shift();
    job().then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (job) =>
    new Promise((resolve, reject) => {
      queue.push({ job, resolve, reject });
      next();
    });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const USER_AGENT = 'awesomedataviz.com (+https://github.com/hal9ai/awesome-dataviz)';

// fetch() with a timeout and retries on network errors, 429 and 5xx.
// Resolves to { status, ok, headers, body } and never throws for HTTP errors.
export async function request(url, { method = 'GET', headers = {}, body, timeout = 30000, retries = 3, as = 'json' } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        body,
        headers: { 'user-agent': USER_AGENT, ...headers },
        signal: AbortSignal.timeout(timeout),
        redirect: 'follow',
      });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const wait = Number(res.headers.get('retry-after')) * 1000 || 1000 * 2 ** attempt;
        await sleep(Math.min(wait, 30000));
        continue;
      }
      let parsed = null;
      if (as === 'buffer') parsed = Buffer.from(await res.arrayBuffer());
      else {
        const text = await res.text();
        if (as === 'text') parsed = text;
        else {
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch {
            parsed = null;
          }
        }
      }
      return { status: res.status, ok: res.ok, headers: res.headers, body: parsed };
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(1000 * 2 ** attempt);
    }
  }
  return { status: 0, ok: false, headers: new Headers(), body: null, error: String(lastError) };
}
