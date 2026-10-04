import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createServer, loadSite } from '../server/server.mjs';
import { handleMessage } from '../server/mcp.mjs';

const TOOL = {
  slug: 'chart-js', name: 'Chart.js', url: 'https://awesomedataviz.com/tools/chart-js/', description: 'Charts with the canvas tag.',
  homepage: 'https://www.chartjs.org/', repository: 'https://github.com/chartjs/Chart.js',
  category: { slug: 'javascript-charting-libraries', title: 'JavaScript charting libraries' }, categories: ['javascript-charting-libraries'], topics: [],
  language: 'JavaScript', license: 'MIT', status: 'active', stars: 67000, contributors: 400, commitsLast12Months: 21, lastCommitAt: '2026-10-01T00:00:00Z',
  latestRelease: { tag: 'v4.5.1', publishedAt: '2025-10-13T00:00:00Z' },
  packages: [{ registry: 'npm', name: 'chart.js', install: 'npm install chart.js', downloads: 100, downloadsPeriod: 'week' }], alternatives: ['echarts'],
};
const ECHARTS = { ...TOOL, slug: 'echarts', name: 'Apache ECharts', url: 'https://awesomedataviz.com/tools/echarts/', stars: 66000, packages: [], alternatives: [] };

let server, base, root;

function file(path, content) {
  const p = join(root, path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

before(async () => {
  root = mkdtempSync(join(tmpdir(), 'adv-'));
  const html = '<!doctype html><title>x</title><script>/*theme*/</script><p>Home</p>';
  const files = {
    '/index.html': html,
    '/index.md': '# Home',
    '/tools/chart-js/index.html': '<!doctype html><p>Chart.js</p>',
    '/tools/chart-js.md': '# Chart.js',
    '/404.html': '<!doctype html><p>Not found</p>',
    '/assets/app.abc.js': 'console.log(1)'.repeat(200),
    '/api/tools.json': JSON.stringify({ tools: [TOOL, ECHARTS] }),
    '/api/categories.json': JSON.stringify({ categories: [{ slug: 'javascript-charting-libraries', title: 'JavaScript charting libraries', tools: ['chart-js', 'echarts'], url: 'u' }] }),
    '/api/topics.json': JSON.stringify({ topics: [] }),
    '/search-index.json': JSON.stringify({ records: [TOOL, ECHARTS].map((t) => ({ ...t, category: t.category.title, categorySlug: t.category.slug, aliases: [], githubTopics: [] })) }),
    '/build.json': JSON.stringify({ buildId: 'test', builtAt: '2026-10-04T00:00:00Z' }),
  };
  const manifest = {};
  for (const [path, content] of Object.entries(files)) {
    file(path, content);
    const type = path.endsWith('.html') ? 'text/html; charset=utf-8' : path.endsWith('.md') ? 'text/markdown; charset=utf-8' : path.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/json; charset=utf-8';
    manifest[path] = { type, size: content.length, etag: `"${path.length}"` };
  }
  file('/assets/app.abc.js.gz', gzipSync(files['/assets/app.abc.js']));
  manifest['/assets/app.abc.js'].gz = true;
  file('/_manifest.json', JSON.stringify(manifest));
  server = createServer(loadSite(root));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('serves pages, redirects to trailing slashes and 404s', async () => {
  const home = await fetch(`${base}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy'), /script-src 'self' 'sha256-/);
  const redirect = await fetch(`${base}/tools/chart-js`, { redirect: 'manual' });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('location'), '/tools/chart-js/');
  const missing = await fetch(`${base}/nope/`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Not found/);
});

test('negotiates Markdown and compression', async () => {
  const md = await fetch(`${base}/tools/chart-js/`, { headers: { accept: 'text/markdown' } });
  assert.equal(md.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(await md.text(), '# Chart.js');
  const js = await fetch(`${base}/assets/app.abc.js`, { headers: { 'accept-encoding': 'gzip' } });
  assert.equal(js.headers.get('content-encoding'), 'gzip');
  assert.match(js.headers.get('cache-control'), /immutable/);
  const etag = js.headers.get('etag');
  const again = await fetch(`${base}/assets/app.abc.js`, { headers: { 'accept-encoding': 'gzip', 'if-none-match': etag } });
  assert.equal(again.status, 304);
});

test('search API returns ranked results with CORS', async () => {
  const res = await fetch(`${base}/api/search?q=chart.js`);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  const body = await res.json();
  assert.equal(body.results[0].slug, 'chart-js');
  assert.deepEqual(body.results[0].install, ['npm install chart.js']);
});

test('MCP over HTTP: initialize, list and call tools', async () => {
  const rpc = (msg) => fetch(`${base}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(msg) });
  const init = await (await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '1' } } })).json();
  assert.equal(init.result.protocolVersion, '2025-03-26');
  assert.ok(init.result.capabilities.tools);
  const note = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(note.status, 202);
  const list = await (await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  assert.deepEqual(list.result.tools.map((t) => t.name).sort(), ['compare_dataviz_tools', 'get_dataviz_tool', 'list_dataviz_categories', 'search_dataviz_tools']);
  const call = await (await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_dataviz_tool', arguments: { tool: 'Chart.js' } } })).json();
  assert.equal(call.result.isError, false);
  assert.match(call.result.content[0].text, /npm install chart\.js/);
  const get = await fetch(`${base}/mcp`);
  assert.equal(get.status, 405);
  const bad = await fetch(`${base}/mcp`, { method: 'POST', body: '{nope' });
  assert.equal((await bad.json()).error.code, -32700);
});

test('MCP errors: unknown method, unknown tool, bad arguments', () => {
  const site = loadSite(root);
  assert.equal(handleMessage(site, { jsonrpc: '2.0', id: 1, method: 'resources/list' }).error.code, -32601);
  assert.equal(handleMessage(site, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'nope' } }).error.code, -32602);
  const r = handleMessage(site, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'compare_dataviz_tools', arguments: { tools: ['chart-js'] } } });
  assert.equal(r.result.isError, true);
  const ok = handleMessage(site, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'compare_dataviz_tools', arguments: { tools: ['chart-js', 'echarts'] } } });
  assert.match(ok.result.content[0].text, /\| Chart\.js \| Apache ECharts \|/);
});
