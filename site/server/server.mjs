// Production server for awesomedataviz.com: serves the prebuilt dist/
// (precompressed, ETagged), plus two dynamic endpoints over the same data:
// GET /api/search and the MCP server at /mcp. No dependencies.

import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, createReadStream, existsSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, search } from './search.mjs';
import { handleMcp } from './mcp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT || 8080);
const CANONICAL_HOST = process.env.CANONICAL_HOST || 'awesomedataviz.com';
// REDIRECT_TO_CANONICAL=1 makes other hostnames (the platform's default
// subdomain) 301 to the canonical one. The deploy script only sets it after
// /healthz on the canonical domain reports that host, so a proxy that hides
// the original hostname can never cause a redirect loop.
const REDIRECT = process.env.REDIRECT_TO_CANONICAL === '1';

// The hostname the visitor asked for. Behind the platform's proxy that may
// arrive in X-Forwarded-Host or Forwarded rather than Host.
export function requestHost(req) {
  const forwarded = /(?:^|[;,])\s*host="?([^;,"\s]+)/i.exec(req.headers.forwarded || '')?.[1];
  const raw = req.headers['x-forwarded-host'] || forwarded || req.headers.host || '';
  return String(raw).split(',')[0].trim().replace(/:\d+$/, '').toLowerCase();
}

export function loadSite(root = ROOT) {
  const manifest = JSON.parse(readFileSync(join(root, '_manifest.json'), 'utf8'));
  const api = JSON.parse(readFileSync(join(root, 'api', 'tools.json'), 'utf8'));
  const index = JSON.parse(readFileSync(join(root, 'search-index.json'), 'utf8'));
  const categories = JSON.parse(readFileSync(join(root, 'api', 'categories.json'), 'utf8')).categories;
  const topics = JSON.parse(readFileSync(join(root, 'api', 'topics.json'), 'utf8')).topics;
  const build = JSON.parse(readFileSync(join(root, 'build.json'), 'utf8'));
  const redirectsFile = join(root, '_redirects.json');
  const redirects = existsSync(redirectsFile) ? JSON.parse(readFileSync(redirectsFile, 'utf8')) : {};
  const tools = new Map(api.tools.map((t) => [t.slug, t]));
  return { root, manifest, tools, categories, topics, build, redirects, index: buildIndex(index.records) };
}

// Pages run one inline script (the theme boot, allowed by hash) and use
// inline style attributes for bar widths, hence 'unsafe-inline' for styles.
function securityHeaders(inlineScriptHash) {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'strict-transport-security': 'max-age=31536000',
    'content-security-policy': [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self'${inlineScriptHash ? ` '${inlineScriptHash}'` : ''}`,
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  };
}

function cacheControl(path) {
  if (path.startsWith('/assets/') || path.startsWith('/img/avatars/')) return 'public, max-age=31536000, immutable';
  if (path.endsWith('.html')) return 'public, max-age=300, stale-while-revalidate=86400';
  return 'public, max-age=3600, stale-while-revalidate=86400';
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, authorization' };

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-length': Buffer.byteLength(body), ...headers });
  res.end(body);
}

function json(res, status, value, extra = {}) {
  send(res, status, JSON.stringify(value), { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', ...CORS, ...extra });
}

// Maps a URL path to a manifest path: "/tools/x/" -> "/tools/x/index.html".
function resolvePath(site, pathname) {
  if (site.manifest[pathname]) return { file: pathname };
  if (pathname.endsWith('/') && site.manifest[`${pathname}index.html`]) return { file: `${pathname}index.html` };
  if (!pathname.endsWith('/') && site.manifest[`${pathname}/index.html`]) return { redirect: `${pathname}/` };
  return null;
}

function wantsMarkdown(req) {
  const accept = req.headers.accept || '';
  const md = /text\/markdown/.exec(accept);
  if (!md) return false;
  // Prefer Markdown only if it is not explicitly ranked below HTML.
  const q = (type) => {
    const m = new RegExp(`${type.replace('/', '\\/')}\\s*(?:;\\s*q=([0-9.]+))?`).exec(accept);
    return m ? Number(m[1] ?? 1) : 0;
  };
  return q('text/markdown') >= q('text/html');
}

function markdownTwin(site, file) {
  if (file === '/index.html') return site.manifest['/index.md'] ? '/index.md' : null;
  const m = /^(.*)\/index\.html$/.exec(file);
  const twin = m ? `${m[1]}.md` : null;
  return twin && site.manifest[twin] ? twin : null;
}

function serveFile(req, res, site, file, { status = 200, headers = {} } = {}) {
  const pageHeaders = site.securityHeaders ?? {};
  const entry = site.manifest[file];
  const accept = req.headers['accept-encoding'] || '';
  const encoding = entry.br && /\bbr\b/.test(accept) ? 'br' : entry.gz && /\bgzip\b/.test(accept) ? 'gzip' : null;
  const etag = encoding ? `${entry.etag.slice(0, -1)}-${encoding}"` : entry.etag;
  const base = {
    'content-type': entry.type,
    'cache-control': cacheControl(file),
    etag,
    vary: 'Accept-Encoding, Accept',
    ...(file.endsWith('.html') ? pageHeaders : {}),
    ...(file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.txt') ? CORS : {}),
    ...headers,
  };
  if (status === 200 && req.headers['if-none-match'] === etag) {
    res.writeHead(304, base);
    return res.end();
  }
  const path = join(site.root, encoding ? `${file}.${encoding === 'br' ? 'br' : 'gz'}` : file);
  if (encoding) base['content-encoding'] = encoding;
  res.writeHead(status, base);
  if (req.method === 'HEAD') return res.end();
  createReadStream(path).pipe(res);
}

function searchApi(req, res, site, url) {
  const q = url.searchParams.get('q') ?? '';
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
  const options = { limit };
  for (const k of ['category', 'topic', 'language', 'status']) if (url.searchParams.get(k)) options[k] = url.searchParams.get(k);
  const results = search(site.index, q, options).map(({ record, score }) => {
    const t = site.tools.get(record.slug);
    return {
      slug: t.slug,
      name: t.name,
      url: t.url,
      description: t.description,
      category: t.category.title,
      stars: t.stars,
      license: t.license,
      language: t.language,
      status: t.status,
      install: t.packages.map((p) => p.install),
      score: Math.round(score * 100) / 100,
    };
  });
  json(res, 200, { query: q, count: results.length, results, generatedAt: site.build.builtAt });
}

export function createServer(site = loadSite()) {
  // Hash the inline theme script so the CSP allows exactly that script.
  const sample = readFileSync(join(site.root, 'index.html'), 'utf8');
  const inline = /<script>([\s\S]*?)<\/script>/.exec(sample)?.[1] ?? '';
  site.securityHeaders = securityHeaders(inline ? `sha256-${createHash('sha256').update(inline).digest('base64')}` : null);

  return http.createServer(async (req, res) => {
    const started = Date.now();
    const host = requestHost(req);
    res.on('finish', () => {
      if (process.env.ACCESS_LOG !== '0') console.log(`${req.method} ${host}${req.url} ${res.statusCode} ${Date.now() - started}ms`);
    });
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);

      // Health check (never redirected): which build is live and which host
      // the server saw, so the deploy can tell whether redirects are safe.
      if (pathname === '/healthz') {
        return send(res, 200, JSON.stringify({ ok: true, buildId: site.build.buildId, builtAt: site.build.builtAt, host }), { 'content-type': 'application/json', 'cache-control': 'no-store' });
      }
      if (REDIRECT && host && host !== CANONICAL_HOST && host !== 'localhost' && !host.startsWith('127.')) {
        res.writeHead(301, { location: `https://${CANONICAL_HOST}${req.url}`, 'cache-control': 'public, max-age=86400' });
        return res.end();
      }
      const extra = {};

      if (req.method === 'OPTIONS') {
        res.writeHead(204, { ...CORS, 'access-control-max-age': '86400' });
        return res.end();
      }
      if (pathname === '/mcp') return handleMcp(req, res, site);
      if (pathname === '/api/search') {
        if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Use GET' }, { allow: 'GET' });
        return searchApi(req, res, site, url);
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { allow: 'GET, HEAD', 'content-type': 'text/plain' });
      if (normalize(pathname).split(sep).includes('..')) return send(res, 400, 'Bad request', { 'content-type': 'text/plain' });

      const hit = resolvePath(site, pathname);
      if (hit?.redirect) {
        res.writeHead(301, { location: hit.redirect + (url.search || ''), 'cache-control': 'public, max-age=86400', ...extra });
        return res.end();
      }
      if (hit?.file) {
        const twin = hit.file.endsWith('.html') && wantsMarkdown(req) ? markdownTwin(site, hit.file) : null;
        return serveFile(req, res, site, twin ?? hit.file, { headers: { ...extra, ...(twin ? { 'content-location': twin } : {}) } });
      }
      const moved = site.redirects[pathname] ?? site.redirects[`${pathname}/`];
      if (moved) {
        res.writeHead(301, { location: moved + (url.search || ''), 'cache-control': 'public, max-age=86400' });
        return res.end();
      }
      return serveFile(req, res, site, '/404.html', { status: 404, headers: { ...extra, 'cache-control': 'public, max-age=60' } });
    } catch (error) {
      console.error(error);
      if (!res.headersSent) send(res, 500, 'Internal server error', { 'content-type': 'text/plain' });
      else res.destroy();
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(join(ROOT, '_manifest.json'))) {
    console.error(`No build found in ${ROOT}. Run "npm run build" first.`);
    process.exit(1);
  }
  const site = loadSite();
  const server = createServer(site);
  server.keepAliveTimeout = 65000;
  server.listen(PORT, '0.0.0.0', () => console.log(`awesomedataviz.com ${site.build.buildId}: ${site.tools.size} tools on :${PORT}`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
