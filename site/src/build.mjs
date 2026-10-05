// Builds the static site into dist/: one HTML page (plus a Markdown twin)
// per tool, category, topic and comparison, the JSON API, feeds and assets,
// all precompressed for the server.
//
//   node src/build.mjs            fetch fresh data (cached for ~a day)
//   node src/build.mjs --offline  use cached data only

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { brotliCompressSync, gzipSync, constants as zlib } from 'node:zlib';
import { loadCatalog, SITE_DIR, REPO_DIR } from './data.mjs';
import { comparisonPairs } from './compare.mjs';
import { loadPublished, slugRedirects, redirectMap, keptPairs } from './published.mjs';
import { Cache, DAY, limiter, request } from './enrich/http.mjs';
import { layout } from './render/html.mjs';
import { renderTool } from './render/pages/tool.mjs';
import { renderCollection } from './render/pages/collection.mjs';
import { renderCompare } from './render/pages/compare.mjs';
import { renderHome } from './render/pages/home.mjs';
import { renderToolsIndex, renderCategoriesIndex, renderTopicsIndex, renderCompareIndex } from './render/pages/indexes.mjs';
import { renderResources, renderAbout, renderSubmit, renderAi, renderSearch, renderNotFound } from './render/pages/static.mjs';
import * as feeds from './render/feeds.mjs';

const DIST = join(SITE_DIR, 'dist');
const PUBLIC = join(SITE_DIR, 'public');
const CACHE = join(SITE_DIR, '.cache');
const offline = process.argv.includes('--offline');
const log = (...args) => console.log(...args);

const hash = (data) => createHash('sha256').update(data).digest('hex').slice(0, 10);

function write(path, content) {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

// Page path "/tools/x/" -> "tools/x/index.html".
const pageFile = (path) => (path.endsWith('/') ? `${path}index.html` : path).replace(/^\//, '');

async function downloadAvatars(model) {
  const cache = new Cache(CACHE, 'avatars');
  const dir = join(CACHE, 'avatars');
  mkdirSync(dir, { recursive: true });
  const owners = new Map();
  for (const t of model.tools) {
    const o = t.facts?.owner;
    if (t.facts?.host === 'github' && o?.login && o.avatarUrl) owners.set(o.login.toLowerCase(), o.avatarUrl);
  }
  const run = limiter(8);
  await Promise.all(
    [...owners].map(([login, src]) =>
      run(async () => {
        let file = cache.get(login, 7 * DAY);
        if ((!file || !existsSync(join(dir, file))) && !offline) {
          const res = await request(`${src}${src.includes('?') ? '&' : '?'}s=80`, { as: 'buffer', retries: 2 });
          if (res.ok && res.body?.length) {
            const type = res.headers.get('content-type') || '';
            const ext = type.includes('jpeg') ? 'jpg' : type.includes('gif') ? 'gif' : type.includes('webp') ? 'webp' : 'png';
            file = `${login}.${ext}`;
            writeFileSync(join(dir, file), res.body);
            cache.set(login, file);
          }
        }
        file = file ?? cache.stale(login);
        if (file && existsSync(join(dir, file))) {
          const data = readFileSync(join(dir, file));
          const name = `${login}-${hash(data)}${extname(file)}`;
          write(`img/avatars/${name}`, data);
          owners.set(login, `/img/avatars/${name}`);
        } else owners.delete(login);
      })
    )
  );
  cache.save();
  for (const t of model.tools) {
    const login = t.facts?.owner?.login?.toLowerCase();
    t.avatar = login && owners.get(login)?.startsWith('/img/') ? owners.get(login) : null;
  }
}

function buildAssets(buildId) {
  const searchSrc = readFileSync(join(SITE_DIR, 'server', 'search.mjs'));
  const searchName = `/assets/search.${hash(searchSrc)}.mjs`;
  write(searchName, searchSrc);
  const css = readFileSync(join(PUBLIC, 'site.css'));
  const cssName = `/assets/site.${hash(css)}.css`;
  write(cssName, css);
  const js = readFileSync(join(PUBLIC, 'app.js'), 'utf8').replace('__SEARCH_MODULE__', searchName).replace('__BUILD_ID__', buildId);
  const jsName = `/assets/app.${hash(js)}.js`;
  write(jsName, js);
  for (const f of readdirSync(PUBLIC)) if (!['site.css', 'app.js'].includes(f)) copyFileSync(join(PUBLIC, f), join(DIST, f));
  return { css: cssName, js: jsName };
}

function repoMeta() {
  try {
    const first = execFileSync('git', ['log', '--reverse', '--format=%aI'], { cwd: REPO_DIR }).toString().split('\n')[0];
    const authors = new Set(execFileSync('git', ['log', '--format=%an'], { cwd: REPO_DIR }).toString().split('\n').filter(Boolean).map((a) => a.toLowerCase()));
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_DIR }).toString().trim();
    return { firstYear: new Date(first).getUTCFullYear(), contributors: authors.size, sha };
  } catch {
    return { firstYear: 2014, contributors: null, sha: null };
  }
}

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.md', '.svg']);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

// Precompresses text files and writes the manifest the server serves from.
function finalize() {
  const manifest = {};
  for (const file of [...walk(DIST)]) {
    const rel = `/${relative(DIST, file).split('\\').join('/')}`;
    if (rel.endsWith('.br') || rel.endsWith('.gz')) continue;
    const ext = extname(file);
    const data = readFileSync(file);
    const entry = { type: TYPES[ext] ?? 'application/octet-stream', size: data.length, etag: `"${hash(data)}"` };
    if (COMPRESSIBLE.has(ext) && data.length > 1024) {
      writeFileSync(`${file}.br`, brotliCompressSync(data, { params: { [zlib.BROTLI_PARAM_QUALITY]: 10, [zlib.BROTLI_PARAM_SIZE_HINT]: data.length } }));
      writeFileSync(`${file}.gz`, gzipSync(data, { level: 9 }));
      entry.br = true;
      entry.gz = true;
    }
    manifest[rel] = entry;
  }
  write('_manifest.json', JSON.stringify(manifest));
  return manifest;
}

// Every internal link in the generated HTML must resolve to a file.
function checkLinks(manifest) {
  const broken = new Map();
  for (const [path] of Object.entries(manifest)) {
    if (!path.endsWith('.html')) continue;
    const content = readFileSync(join(DIST, path), 'utf8');
    for (const m of content.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const target = m[1];
      if (target.startsWith('//') || target.startsWith('/api/search') || target === '/mcp') continue;
      const resolved = target.endsWith('/') ? `${target}index.html` : target;
      if (!manifest[resolved]) broken.set(target, path);
    }
  }
  return broken;
}

async function main() {
  const started = Date.now();
  const model = await loadCatalog({ offline, log });
  // Never publish a site stripped of its numbers because an API was down:
  // fail instead, and the previous deploy stays live.
  const withRepo = model.tools.filter((t) => t.repo);
  const coverage = withRepo.filter((t) => t.facts).length / Math.max(1, withRepo.length);
  if (coverage < 0.9) {
    console.error(`Only ${Math.round(coverage * 100)}% of repositories have data; refusing to build.`);
    process.exit(1);
  }
  const published = await loadPublished({ cacheDir: CACHE, offline, log });
  const moved = slugRedirects(model, published);
  const pairs = comparisonPairs(model, { keep: keptPairs(published, moved) });
  const redirects = redirectMap(moved, published, pairs);
  const meta = repoMeta();
  const buildId = `${meta.sha ?? 'local'}-${hash(model.builtAt)}`;

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  await downloadAvatars(model);
  const assets = buildAssets(buildId);
  const ctx = { model, pairs, meta, now: Date.parse(model.builtAt), assets };

  const pages = [];
  const emit = (page) => {
    write(pageFile(page.path), layout({ ...page, assets, model }));
    pages.push(page);
  };

  emit(renderHome(ctx));
  emit(renderToolsIndex(ctx));
  emit(renderCategoriesIndex(ctx));
  emit(renderTopicsIndex(ctx));
  emit(renderCompareIndex(ctx));
  emit(renderResources(ctx));
  emit(renderAbout(ctx));
  emit(renderSubmit(ctx));
  emit(renderAi(ctx));
  emit(renderSearch(ctx));
  emit(renderNotFound(ctx));
  for (const t of model.tools) {
    emit(renderTool(t, ctx));
    write(`tools/${t.slug}.md`, feeds.toolMarkdown(t, model));
    write(`api/tools/${t.slug}.json`, JSON.stringify(feeds.apiTool(t, model), null, 1));
  }
  for (const c of model.categories) {
    emit(renderCollection(c, ctx, { kind: 'category' }));
    write(`categories/${c.slug}.md`, feeds.collectionMarkdown(c, model, { kind: 'category' }));
  }
  for (const tp of model.topics) {
    emit(renderCollection(tp, ctx, { kind: 'topic' }));
    write(`topics/${tp.slug}.md`, feeds.collectionMarkdown(tp, model, { kind: 'topic' }));
  }
  for (const p of pairs) {
    emit(renderCompare(p, ctx));
    write(`compare/${p.slug}.md`, feeds.compareMarkdown(p, model));
  }

  // Markdown twins for the index pages; prose pages are converted from HTML.
  write('index.md', feeds.homeMarkdown(model));
  write('resources.md', feeds.resourcesMarkdown(model));
  write('tools.md', feeds.toolsIndexMarkdown(model));
  write('categories.md', feeds.categoriesIndexMarkdown(model));
  write('topics.md', feeds.topicsIndexMarkdown(model));
  write('compare.md', feeds.compareIndexMarkdown(pairs));
  for (const p of pages) {
    if (p.markdown && !existsSync(join(DIST, p.markdown.slice(1)))) write(p.markdown.slice(1), feeds.htmlToMarkdown(p));
  }

  const api = {
    generatedAt: model.builtAt,
    license: 'CC-BY-4.0',
    attribution: 'Awesome Dataviz (https://awesomedataviz.com)',
    count: model.tools.length,
    tools: model.tools.map((t) => feeds.apiTool(t, model)),
  };
  write('api/tools.json', JSON.stringify(api));
  write(
    'api/categories.json',
    JSON.stringify({
      generatedAt: model.builtAt,
      categories: model.categories.map((c) => ({ slug: c.slug, title: c.title, group: c.group, summary: c.summary, url: `https://awesomedataviz.com/categories/${c.slug}/`, tools: c.tools.map((t) => t.slug) })),
    })
  );
  write(
    'api/topics.json',
    JSON.stringify({
      generatedAt: model.builtAt,
      topics: model.topics.map((tp) => ({ slug: tp.slug, title: tp.title, summary: tp.summary, url: `https://awesomedataviz.com/topics/${tp.slug}/`, tools: tp.tools.map((t) => t.slug) })),
    })
  );
  write('search-index.json', JSON.stringify({ buildId, records: model.tools.map(feeds.searchRecord) }));
  write('llms.txt', feeds.llmsTxt(model, pairs));
  write('llms-full.txt', feeds.llmsFullTxt(model));
  write('robots.txt', feeds.robotsTxt());
  write('feed.xml', feeds.atomFeed(model));
  write('opensearch.xml', feeds.openSearch());
  const indexable = pages.filter((p) => !p.noindex).map((p) => p.path);
  write('sitemap.xml', feeds.sitemap(indexable, model.builtAt.slice(0, 10)));
  write('_redirects.json', JSON.stringify(redirects));
  write('build.json', JSON.stringify({ buildId, builtAt: model.builtAt, sha: meta.sha, tools: model.tools.length, pages: pages.length }));

  const manifest = finalize();
  const broken = checkLinks(manifest);
  const files = Object.keys(manifest).length;
  if (Object.keys(redirects).length) log(`  ${Object.keys(redirects).length} redirects for moved pages.`);
  log(`Built ${pages.length} pages (${model.tools.length} tools, ${model.categories.length} categories, ${model.topics.length} topics, ${pairs.length} comparisons), ${files} files in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
  if (broken.size) {
    for (const [target, from] of broken) console.error(`  broken link ${target} (in ${from})`);
    if (!process.argv.includes('--allow-broken-links')) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
