// Coverage check: notable GitHub repositories in data visualization topics
// that the README doesn't list yet. Prints a Markdown report; the weekly
// workflow posts it to a single "coverage" issue for maintainers to review.
//
//   node scripts/coverage.mjs [--min-stars 2000] [--json]
//
// A candidate leaves the report once it is added to the README, or once it is
// recorded in data/coverage-ignore.json with the reason it is out of scope.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseReadme, detectRepo, parseRepoRef } from '../src/readme.mjs';
import { README, SITE_DIR } from '../src/data.mjs';
import { githubToken } from '../src/enrich/github.mjs';
import { request, sleep } from '../src/enrich/http.mjs';
import overrides from '../data/overrides.mjs';

const TOPICS = [
  'data-visualization', 'visualization', 'dataviz', 'charts', 'chart', 'charting-library', 'charting', 'plotting',
  'graph-visualization', 'network-visualization', 'd3', 'scientific-visualization', 'geospatial', 'maps',
  'financial-charts', 'candlestick-chart', 'diagrams', 'diagram-as-code', 'business-intelligence', 'webgpu',
];

// Repositories in these topics that are rarely visualization tools.
const NOISE = /\b(admin|template|boilerplate|starter|helm|kubernetes|awesome|course|tutorial|curriculum|interview|roadmap|cheat ?sheet|cms|crawler|scraper|chatbot|llm agent|ui kit|component library|icons|status page|uptime|e-?commerce|wallet|blockchain)\b/i;

const args = process.argv.slice(2);
const minStars = Number(args[args.indexOf('--min-stars') + 1]) || 2000;
const asJson = args.includes('--json');

function listedRepos() {
  const { sections } = parseReadme(readFileSync(README, 'utf8'));
  const keys = new Set();
  for (const s of sections) {
    for (const e of s.entries) {
      const ov = overrides[e.url] ?? {};
      const repo = ov.repo ? parseRepoRef(ov.repo) : detectRepo(e);
      if (repo?.host === 'github') keys.add(`${repo.owner}/${repo.name}`.toLowerCase());
    }
  }
  // Canonical names after renames, from the build cache when present.
  try {
    const cache = JSON.parse(readFileSync(join(SITE_DIR, '.cache', 'repositories.json'), 'utf8'));
    for (const v of Object.values(cache)) if (v.value?.fullName) keys.add(v.value.fullName.toLowerCase());
  } catch {
    // no cache yet: README names only
  }
  return keys;
}

async function search(token, topic) {
  const items = [];
  for (let page = 1; page <= 2; page++) {
    const q = encodeURIComponent(`topic:${topic} stars:>=${minStars} archived:false`);
    const res = await request(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=100&page=${page}`, {
      headers: { authorization: `bearer ${token}`, accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub search for topic:${topic} failed: ${res.status}`);
    items.push(...res.body.items);
    if (res.body.items.length < 100) break;
    await sleep(2500); // the search API allows 30 requests a minute
  }
  return items;
}

async function main() {
  const token = githubToken();
  if (!token) throw new Error('Set GITHUB_TOKEN (or run `gh auth login`).');
  const listed = listedRepos();
  const ignored = new Map(JSON.parse(readFileSync(join(SITE_DIR, 'data', 'coverage-ignore.json'), 'utf8')).map((x) => [x.repo.toLowerCase(), x.reason]));

  const found = new Map();
  for (const topic of TOPICS) {
    for (const r of await search(token, topic)) {
      const key = r.full_name.toLowerCase();
      if (listed.has(key) || ignored.has(key) || NOISE.test(`${r.full_name} ${r.description ?? ''}`)) continue;
      const hit = found.get(key) ?? { repo: r.full_name, stars: r.stargazers_count, license: r.license?.spdx_id ?? null, description: (r.description ?? '').trim(), pushedAt: r.pushed_at, topics: [] };
      hit.topics.push(topic);
      found.set(key, hit);
    }
    await sleep(2500);
  }
  const candidates = [...found.values()].sort((a, b) => b.stars - a.stars);

  if (asJson) return console.log(JSON.stringify(candidates, null, 2));
  const fmt = new Intl.NumberFormat('en');
  const rows = candidates.map(
    (c) => `| [${c.repo}](https://github.com/${c.repo}) | ${fmt.format(c.stars)} | ${c.license ?? '–'} | ${c.description.replace(/\|/g, '\\|').slice(0, 140)} |`
  );
  console.log(
    [
      `Repositories with at least ${fmt.format(minStars)} stars in GitHub's data visualization topics that the README doesn't list, generated ${new Date().toISOString().slice(0, 10)}.`,
      '',
      'For each one, either add it to the README (if it is an open-source data visualization library or tool), or add it to [`site/data/coverage-ignore.json`](https://github.com/hal9ai/awesome-dataviz/blob/main/site/data/coverage-ignore.json) with the reason it is out of scope, so it stops showing up here.',
      '',
      candidates.length ? '| Repository | Stars | License | Description |\n|---|---:|---|---|\n' + rows.join('\n') : 'Nothing to review: every notable repository is listed or ignored.',
      '',
    ].join('\n')
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
