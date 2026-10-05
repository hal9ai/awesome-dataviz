// Which "A vs B" pages exist, and the factual differences shown on them.
// Pages are generated for the most-starred tools within each category plus
// a few well-known cross-category matchups; every claim comes from data.

import { formatCompact, formatDate, formatNumber, perPeriod } from './util.mjs';

const TOP_PER_CATEGORY = 5;

// Popular matchups across categories (both tools must be listed).
const EXTRA_PAIRS = [
  ['d3', 'chart-js'],
  ['d3', 'echarts'],
  ['d3', 'plotly-js'],
  ['d3', 'observable-plot'],
  ['matplotlib', 'ggplot2'],
  ['plotly-python', 'plotly-js'],
  ['mermaid', 'graphviz'],
  ['deck-gl', 'kepler-gl'],
  ['vega-lite', 'altair'],
  ['shiny', 'streamlit'],
  ['superset', 'metabase'],
  ['grafana', 'superset'],
  ['metabase', 'redash'],
  ['recharts', 'chart-js'],
  ['echarts', 'apexcharts'],
  ['plotly-python', 'streamlit'],
  ['dash', 'streamlit'],
  ['panel', 'streamlit'],
  ['shiny-for-python', 'streamlit'],
  ['uplot', 'chart-js'],
  ['visx', 'recharts'],
  ['d3', 'visx'],
  ['maplibre-gl-js', 'leaflet'],
  ['openlayers', 'leaflet'],
  ['plotnine', 'ggplot2'],
  ['grafana', 'kibana'],
  ['lightweight-charts', 'dxcharts-lite'],
  ['xyflow', 'cytoscape-js'],
  ['plantuml', 'mermaid'],
  ['d2', 'mermaid'],
];

export function comparisonPairs(model, { keep = [] } = {}) {
  const pairs = new Map();
  const add = (a, b, context) => {
    if (!a || !b || a === b || a.stars == null || b.stars == null) return;
    const [x, y] = [a, b].sort((p, q) => p.slug.localeCompare(q.slug));
    const slug = `${x.slug}-vs-${y.slug}`;
    if (!pairs.has(slug)) pairs.set(slug, { slug, a: x, b: y, context });
  };
  for (const category of model.categories) {
    const top = category.tools.filter((t) => t.stars != null).slice(0, TOP_PER_CATEGORY);
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) add(top[i], top[j], category);
  }
  // Pages published before stay, as long as both tools are still listed.
  for (const [a, b] of [...EXTRA_PAIRS, ...keep]) {
    const x = model.toolBySlug.get(a);
    const y = model.toolBySlug.get(b);
    if (x && y) add(x, y, x.primaryCategory === y.primaryCategory ? x.primaryCategory : null);
  }
  const list = [...pairs.values()];
  for (const tool of model.tools) tool.comparisons = list.filter((p) => p.a === tool || p.b === tool);
  return list;
}

const ratio = (x, y) => (y ? x / y : Infinity);

function times(r) {
  if (r >= 10) return `${Math.round(r)}×`;
  return `${(Math.round(r * 10) / 10).toString()}×`;
}

// Neutral, data-backed bullet points. Returns strings (plain text).
export function keyDifferences(a, b, now = Date.now()) {
  const out = [];
  if (a.stars != null && b.stars != null && a.stars !== b.stars) {
    const [hi, lo] = a.stars > b.stars ? [a, b] : [b, a];
    const r = ratio(hi.stars, lo.stars);
    out.push(
      r >= 1.15
        ? `${hi.name} has ${times(r)} as many GitHub stars as ${lo.name} (${formatCompact(hi.stars)} vs ${formatCompact(lo.stars)}).`
        : `${hi.name} and ${lo.name} have a similar number of GitHub stars (${formatCompact(hi.stars)} vs ${formatCompact(lo.stars)}).`
    );
  }
  if (a.commitsLastYear != null && b.commitsLastYear != null && (a.commitsLastYear || b.commitsLastYear)) {
    const [hi, lo] = a.commitsLastYear >= b.commitsLastYear ? [a, b] : [b, a];
    if (hi.commitsLastYear !== lo.commitsLastYear) {
      out.push(`${hi.name} had more development activity over the last 12 months: ${formatNumber(hi.commitsLastYear)} commits vs ${formatNumber(lo.commitsLastYear)}.`);
    }
  }
  const da = a.downloads, db = b.downloads;
  if (da && db && da.registry === db.registry && da.downloads != null && db.downloads != null && da.downloads !== db.downloads) {
    const [hi, lo] = da.downloads > db.downloads ? [[a, da], [b, db]] : [[b, db], [a, da]];
    const r = ratio(hi[1].downloads, lo[1].downloads);
    if (r >= 1.15) out.push(`${hi[0].name} is downloaded ${times(r)} as often on ${hi[1].label} (${formatCompact(hi[1].downloads)} vs ${formatCompact(lo[1].downloads)} ${perPeriod(hi[1].period)}).`);
  }
  if (a.license && b.license) {
    out.push(a.license === b.license ? `Both are released under the ${a.license} license.` : `${a.name} is licensed under ${a.license}; ${b.name} under ${b.license}.`);
  }
  if (a.language && b.language && a.language !== b.language) {
    out.push(`${a.name} is written primarily in ${a.language}, ${b.name} in ${b.language}.`);
  }
  const ca = a.facts?.createdAt, cb = b.facts?.createdAt;
  if (ca && cb) {
    const [older, newer] = Date.parse(ca) <= Date.parse(cb) ? [a, b] : [b, a];
    const years = (Date.parse(newer.facts.createdAt) - Date.parse(older.facts.createdAt)) / (365.25 * 86400000);
    if (years >= 1) out.push(`${older.name} is the older project: its repository was created in ${new Date(older.facts.createdAt).getUTCFullYear()}, ${newer.name}'s in ${new Date(newer.facts.createdAt).getUTCFullYear()}.`);
  }
  for (const t of [a, b]) {
    if (t.status?.key === 'archived') out.push(`${t.name}'s repository is archived, so it no longer receives updates.`);
    else if (t.status?.key === 'inactive') out.push(`${t.name} has had no commits since ${formatDate(t.lastCommitAt)}.`);
  }
  return out;
}
