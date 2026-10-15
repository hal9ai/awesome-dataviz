// Takes a screenshot of a web page with headless Chrome, driven over the
// DevTools protocol on a pipe (--remote-debugging-pipe), so it needs no npm
// packages: just Node and a Chrome or Chromium binary.
//
//   node demos/screenshot.mjs http://localhost:8080/ out.webp
//   node demos/screenshot.mjs --ready "#scatter img" URL out.webp
//
// Waits for the load event, the optional `ready` CSS selector and a quiet
// network, then a short settle delay for animations. CHROME_PATH picks the
// browser when it isn't in a usual place.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

export function findChrome() {
  return [process.env.CHROME_PATH, ...CANDIDATES].find((p) => p && existsSync(p)) ?? null;
}

class Browser {
  constructor(path) {
    this.profile = mkdtempSync(join(tmpdir(), 'adv-chrome-'));
    const args = ['--headless=new', '--remote-debugging-pipe', `--user-data-dir=${this.profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--disable-gpu', '--disable-extensions'];
    if (process.platform === 'linux') args.push('--no-sandbox'); // CI runners restrict user namespaces
    this.proc = spawn(path, [...args, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
    this.out = this.proc.stdio[3];
    this.next = 1;
    this.pending = new Map();
    this.listeners = new Set();
    let buffer = '';
    this.proc.stdio[4].on('data', (chunk) => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf('\0')) >= 0) {
        const message = JSON.parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
        if (message.id && this.pending.has(message.id)) {
          const { resolve, reject } = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) reject(new Error(message.error.message));
          else resolve(message.result);
        } else for (const listener of this.listeners) listener(message);
      }
    });
    this.closed = new Promise((r) => this.proc.on('exit', r));
  }

  send(method, params = {}, sessionId) {
    const id = this.next++;
    this.out.write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async close() {
    this.send('Browser.close').catch(() => {});
    if (!(await Promise.race([this.closed.then(() => true), sleep(3000)]))) {
      this.proc.kill();
      await Promise.race([this.closed, sleep(2000)]);
    }
    try {
      rmSync(this.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {} // Chrome may still be flushing its profile; it's a temp dir
  }
}

async function until(check, timeout, every = 250) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(every);
  }
  return false;
}

// Saves a screenshot of `url` to `file` (WebP, or PNG for a .png name).
// Throws when the page doesn't load, answers with an HTTP error or never
// shows the `ready` selector.
export async function screenshot(url, file, { ready = null, width = 1280, height = 800, delay = 1500, timeout = 90000, chrome = findChrome() } = {}) {
  if (!chrome) throw new Error('No Chrome or Chromium found; set CHROME_PATH.');
  const browser = new Browser(chrome);
  try {
    const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params) => browser.send(method, params, sessionId);

    const inflight = new Set();
    let quietSince = Date.now();
    let loaded = false;
    let status = null;
    browser.listeners.add(({ method, params, sessionId: from }) => {
      if (from !== sessionId) return;
      if (method === 'Network.requestWillBeSent') inflight.add(params.requestId);
      else if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') {
        inflight.delete(params.requestId);
        if (!inflight.size) quietSince = Date.now();
      } else if (method === 'Network.responseReceived' && params.type === 'Document' && status == null) status = params.response.status;
      else if (method === 'Page.loadEventFired') loaded = true;
    });
    await send('Page.enable');
    await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

    const started = Date.now();
    const left = () => Math.max(1000, timeout - (Date.now() - started));
    // A sleeping app answers 502-504 while it wakes up: try again until it's up.
    for (;;) {
      loaded = false;
      status = null;
      const nav = await send('Page.navigate', { url });
      if (nav.errorText) throw new Error(`${url}: ${nav.errorText}`);
      if (!(await until(() => loaded, left()))) throw new Error(`${url} did not finish loading.`);
      if (![502, 503, 504].includes(status) || left() <= 10000) break;
      await sleep(5000);
    }
    if (status >= 400) throw new Error(`${url} answered HTTP ${status}.`);
    if (ready) {
      const found = await until(async () => (await send('Runtime.evaluate', { expression: `!!document.querySelector(${JSON.stringify(ready)})`, returnByValue: true })).result.value, left(), 500);
      if (!found) throw new Error(`${url} never showed ${ready}.`);
    }
    await until(() => !inflight.size && Date.now() - quietSince > 1000, Math.min(20000, left()));
    await sleep(delay);

    const format = file.endsWith('.png') ? 'png' : 'webp';
    const { data } = await send('Page.captureScreenshot', { format, ...(format === 'webp' ? { quality: 82 } : {}) });
    mkdirSync(dirname(resolve(file)), { recursive: true });
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--ready');
  const ready = i >= 0 ? args.splice(i, 2)[1] : null;
  const [url, file] = args;
  if (!url || !file) {
    console.error('Usage: node demos/screenshot.mjs [--ready SELECTOR] URL FILE');
    process.exit(2);
  }
  screenshot(url, file, { ready })
    .then((f) => console.log(`Saved ${f}`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
