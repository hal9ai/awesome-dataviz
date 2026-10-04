// Ranked search over the directory. The same module runs in the browser
// (header search, /search/) and on the server (/api/search, MCP), so results
// agree everywhere. Records come from /search-index.json.

const SYNONYMS = {
  js: ['javascript'],
  javascript: ['js'],
  ts: ['typescript'],
  py: ['python'],
  golang: ['go'],
  ml: ['machine', 'learning'],
  ai: ['machine', 'learning', 'llm'],
  viz: ['visualization'],
  dataviz: ['visualization'],
  vis: ['visualization'],
  map: ['maps'],
  maps: ['map', 'geospatial'],
  geo: ['maps', 'geospatial'],
  gis: ['maps', 'geospatial'],
  network: ['graph', 'networks'],
  networks: ['network', 'graph'],
  graph: ['network'],
  cli: ['terminal'],
  console: ['terminal'],
  terminal: ['cli'],
  financial: ['finance', 'stock', 'candlestick'],
  stock: ['financial', 'candlestick'],
  dotnet: ['net', 'csharp'],
  csharp: ['dotnet', 'net'],
  cpp: ['c'],
  plot: ['plotting', 'charts'],
  plots: ['plot', 'plotting'],
  chart: ['charts', 'charting'],
  charts: ['chart', 'charting'],
  diagram: ['diagrams'],
  dashboard: ['dashboards', 'bi'],
  bi: ['dashboards', 'business'],
  '3d': ['three', 'scientific'],
  realtime: ['real', 'time', 'streaming'],
  timeseries: ['time', 'series'],
  jupyter: ['notebook', 'notebooks'],
};

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/c\+\+/g, 'cpp')
    .replace(/c#/g, 'csharp')
    .replace(/\.net\b/g, 'dotnet')
    .replace(/f#/g, 'fsharp');
}

export function tokenize(text) {
  return normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
}

const compactName = (text) => normalize(text).replace(/[^a-z0-9]+/g, '');

// Precomputes token sets per record. Records: { slug, name, description,
// category, categorySlug, categories, language, stars, status, aliases,
// topics, githubTopics, license }.
export function buildIndex(records) {
  return records.map((r) => ({
    record: r,
    full: compactName(r.name),
    name: new Set([...tokenize(r.name), compactName(r.name), ...(r.aliases ?? []).flatMap((a) => [...tokenize(a), compactName(a)])]),
    meta: new Set([
      ...tokenize(r.category),
      ...(r.categories ?? []).flatMap(tokenize),
      ...tokenize(r.language),
      ...(r.topics ?? []).flatMap(tokenize),
    ]),
    tags: new Set((r.githubTopics ?? []).flatMap(tokenize)),
    text: new Set(tokenize(r.description)),
  }));
}

function matchSet(set, token, prefix) {
  if (set.has(token)) return 2;
  if (prefix && token.length >= 2) {
    for (const v of set) if (v.startsWith(token)) return 1;
  }
  return 0;
}

function scoreToken(entry, token, prefix) {
  let best = 0;
  const alternatives = [token, ...(SYNONYMS[token] ?? [])];
  alternatives.forEach((t, i) => {
    // A synonym counts, but less, and only as a whole word ("cli" must not match "client").
    const weight = i === 0 ? 1 : 0.6;
    const p = prefix && i === 0;
    const m = matchSet(entry.name, t, p);
    const nameScore = m === 2 ? 5 : m === 1 ? 3.5 : i === 0 && entry.full.includes(t) && t.length >= 3 ? 3 : 0;
    const metaScore = [0, 2.5, 4][matchSet(entry.meta, t, p)];
    const tagScore = [0, 1.5, 2.5][matchSet(entry.tags, t, p)];
    const textScore = [0, 1, 1.5][matchSet(entry.text, t, p)];
    best = Math.max(best, (nameScore + metaScore + tagScore + textScore) * weight);
  });
  return best;
}

// Returns [{ record, score }], best first. Every query token has to match
// somewhere; if nothing matches them all, tokens are combined with OR.
export function search(index, query, { limit = 20, category, topic, language, status } = {}) {
  const tokens = tokenize(query);
  const filtered = index.filter(({ record: r }) => {
    if (category && r.categorySlug !== category && !(r.categorySlugs ?? []).includes(category)) return false;
    if (topic && !(r.topicSlugs ?? []).includes(topic)) return false;
    if (language && normalize(r.language) !== normalize(language)) return false;
    if (status === 'maintained' && !['active', 'maintained'].includes(r.status)) return false;
    if (status && status !== 'maintained' && r.status !== status) return false;
    return true;
  });
  if (!tokens.length) {
    return filtered
      .map((e) => ({ record: e.record, score: 0 }))
      .sort((a, b) => (b.record.stars ?? -1) - (a.record.stars ?? -1))
      .slice(0, limit);
  }
  const compact = compactName(query);
  const run = (requireAll) =>
    filtered
      .map((entry) => {
        let total = 0;
        let matched = 0;
        tokens.forEach((t, i) => {
          const s = scoreToken(entry, t, i === tokens.length - 1 || t.length >= 3);
          if (s > 0) matched++;
          total += s;
        });
        if (requireAll ? matched < tokens.length : matched === 0) return null;
        // Navigational queries ("chart.js", "leaflet") put the exact tool first.
        if (entry.full === compact) total += 40;
        else if (entry.full.startsWith(compact) && compact.length >= 3) total += 10;
        // Descriptive queries ("react charts") favor popular, maintained tools.
        const popularity = 1 + Math.log10((entry.record.stars ?? 0) + 10) / 4;
        const health = entry.record.status === 'archived' ? 0.5 : entry.record.status === 'inactive' ? 0.8 : 1;
        return { record: entry.record, score: total * popularity * health * (matched / tokens.length) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || (b.record.stars ?? -1) - (a.record.stars ?? -1));
  let results = run(true);
  if (!results.length && tokens.length > 1) results = run(false);
  return results.slice(0, limit);
}
