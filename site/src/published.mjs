// URLs are forever: pages the live site already published keep working.
// Each build reads the live sitemap and tool API (falling back to a cached
// copy), keeps generating every comparison page that was published while both
// tools still exist, and 301-redirects tool slugs that changed.

import { Cache, DAY, request } from './enrich/http.mjs';

const SITE = 'https://awesomedataviz.com';
const norm = (u) => String(u ?? '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[/#?]+$/, '');

export async function loadPublished({ cacheDir, offline, log = console.log }) {
  const cache = new Cache(cacheDir, 'published');
  if (!offline) {
    const [sitemap, api] = await Promise.all([
      request(`${SITE}/sitemap.xml`, { as: 'text', timeout: 15000, retries: 1 }),
      request(`${SITE}/api/tools.json`, { timeout: 30000, retries: 1 }),
    ]);
    if (sitemap.ok && api.ok && Array.isArray(api.body?.tools)) {
      const comparisons = [...String(sitemap.body).matchAll(/\/compare\/([a-z0-9-]+-vs-[a-z0-9-]+)\//g)].map((m) => m[1]);
      const tools = api.body.tools.map((t) => ({ slug: t.slug, repository: t.repository, homepage: t.homepage }));
      // Merge with what was seen before, so a page dropped by one bad build still comes back.
      const previous = cache.stale('site') ?? { comparisons: [], tools: [] };
      const value = {
        comparisons: [...new Set([...previous.comparisons, ...comparisons])],
        tools: [...new Map([...previous.tools, ...tools].map((t) => [t.slug, t])).values()],
      };
      cache.set('site', value);
      cache.save();
      return value;
    }
    log('  Could not read the live site; using the cached list of published pages.');
  }
  return cache.get('site', 365 * DAY) ?? { comparisons: [], tools: [] };
}

// Old tool slug -> current slug, matched by repository or homepage.
export function slugRedirects(model, published) {
  const byRepo = new Map();
  for (const t of model.tools) {
    if (t.repoUrl) byRepo.set(norm(t.repoUrl), t.slug);
    if (t.homepage) byRepo.set(norm(t.homepage), t.slug);
  }
  const moved = {};
  for (const old of published.tools) {
    if (model.toolBySlug.has(old.slug)) continue;
    const next = byRepo.get(norm(old.repository)) ?? byRepo.get(norm(old.homepage));
    if (next && next !== old.slug) moved[old.slug] = next;
  }
  return moved;
}

// Path redirects for the server, from moved tool slugs and comparison pages.
export function redirectMap(moved, published, pairs) {
  const map = {};
  for (const [from, to] of Object.entries(moved)) {
    map[`/tools/${from}/`] = `/tools/${to}/`;
    map[`/tools/${from}.md`] = `/tools/${to}.md`;
    map[`/api/tools/${from}.json`] = `/api/tools/${to}.json`;
  }
  const live = new Set(pairs.map((p) => p.slug));
  for (const slug of published.comparisons) {
    if (live.has(slug)) continue;
    const parts = slug.split('-vs-');
    if (parts.length !== 2) continue;
    const [a, b] = parts.map((s) => moved[s] ?? s).sort();
    const target = `${a}-vs-${b}`;
    if (live.has(target)) map[`/compare/${slug}/`] = `/compare/${target}/`;
  }
  return map;
}

// Comparison pairs to keep, as [slugA, slugB] in current slugs.
export function keptPairs(published, moved) {
  return published.comparisons
    .map((s) => s.split('-vs-'))
    .filter((p) => p.length === 2)
    .map((p) => p.map((s) => moved[s] ?? s));
}
