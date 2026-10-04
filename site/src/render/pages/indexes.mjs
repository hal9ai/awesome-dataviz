// Index pages: every tool (filterable table), categories, topics, comparisons.

import { html, url, breadcrumbs, abs } from '../html.mjs';
import { toolTable } from '../components.mjs';
import { breadcrumbLd } from './tool.mjs';
import { GROUPS } from '../../content/categories.mjs';
import { formatDate, formatNumber } from '../../util.mjs';

export function renderToolsIndex(ctx) {
  const { model, now } = ctx;
  const languages = count(model.tools.map((t) => t.language).filter(Boolean));
  const licenses = count(model.tools.map((t) => t.license).filter(Boolean));
  const option = ([v, n]) => html`<option value="${v}">${v} (${n})</option>`;
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'All tools' }])}
<header class="page-header">
  <h1>All data visualization tools</h1>
  <p class="lead">${formatNumber(model.tools.length)} tools across ${model.categories.length} categories, ranked by GitHub stars. Filter by category, language, license or maintenance status; click a column to sort. Updated ${formatDate(model.builtAt)}.</p>
</header>
<form class="filters" data-filter-table="all-tools" aria-label="Filter tools">
  <label>Filter<input type="search" name="text" placeholder="Name or description" autocomplete="off"></label>
  <label>Category<select name="category"><option value="">All</option>${model.categories.map((c) => html`<option value="${c.slug}">${c.title} (${c.tools.length})</option>`)}</select></label>
  <label>Language<select name="language"><option value="">All</option>${languages.map(option)}</select></label>
  <label>License<select name="license"><option value="">All</option>${licenses.map(option)}</select></label>
  <label>Status<select name="status"><option value="">All</option><option value="active">Active (90 days)</option><option value="maintained">Maintained (12 months)</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
  <output class="filter-count" aria-live="polite">${formatNumber(model.tools.length)} tools</output>
</form>
${toolTable(model.tools, { model, now, showCategory: true, id: 'all-tools', caption: 'All tools, ranked by GitHub stars' })}
</div>`;
  return {
    path: '/tools/',
    title: `All ${model.tools.length} data visualization tools, ranked`,
    description: `Every tool in the directory in one sortable table: ${model.tools.length} data visualization libraries and apps with GitHub stars, commits, last activity and license.`,
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['All tools', '/tools/']])],
    markdown: '/tools.md',
  };
}

export function renderCategoriesIndex(ctx) {
  const { model } = ctx;
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Categories' }])}
<header class="page-header"><h1>Categories</h1><p class="lead">Data visualization tools grouped by language and platform, following the sections of the community-maintained list.</p></header>
${GROUPS.map((g) => {
  const cats = model.categories.filter((c) => c.group === g.key);
  if (!cats.length) return '';
  return html`<section aria-labelledby="g-${g.key}"><h2 id="g-${g.key}">${g.title}</h2><ul class="category-list">${cats.map(
    (c) => html`<li><a href="${url.category(c)}"><span class="cat-title">${c.title}</span></a><span class="cat-count">${c.tools.length} tools</span><p>${c.summary}${
      c.tools.length ? html` Top: ${c.tools.slice(0, 4).map((t, i) => html`${i ? ', ' : ''}<a href="${url.tool(t)}">${t.name}</a>`)}.` : ''
    }</p></li>`
  )}</ul></section>`;
})}
</div>`;
  return {
    path: '/categories/',
    title: 'Data visualization tools by category',
    description: `Browse ${model.categories.length} categories of data visualization tools: JavaScript charting, maps and graphs, Python, R, mobile, C++, Rust, dashboards, diagrams as code and more.`,
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['Categories', '/categories/']])],
    markdown: '/categories.md',
  };
}

export function renderTopicsIndex(ctx) {
  const { model } = ctx;
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Topics' }])}
<header class="page-header"><h1>Topics</h1><p class="lead">Collections that cut across languages: maps, networks, 3D, terminal charts, financial charts and more.</p></header>
<ul class="category-list">${model.topics.map(
    (tp) => html`<li><a href="${url.topic(tp)}"><span class="cat-title">${tp.title}</span></a><span class="cat-count">${tp.tools.length} tools</span><p>${tp.summary} Top: ${tp.tools
      .slice(0, 4)
      .map((t, i) => html`${i ? ', ' : ''}<a href="${url.tool(t)}">${t.name}</a>`)}.</p></li>`
  )}</ul>
</div>`;
  return {
    path: '/topics/',
    title: 'Data visualization topics',
    description: 'Data visualization tools by use case: maps and geospatial, graph and network visualization, 3D and scientific, terminal charts, financial charts, dashboards, notebooks and more.',
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['Topics', '/topics/']])],
    markdown: '/topics.md',
  };
}

export function renderCompareIndex(ctx) {
  const { model, pairs } = ctx;
  const byContext = new Map();
  for (const p of pairs) {
    const key = p.context?.title ?? 'Across categories';
    if (!byContext.has(key)) byContext.set(key, []);
    byContext.get(key).push(p);
  }
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Compare' }])}
<header class="page-header"><h1>Compare data visualization tools</h1><p class="lead">${pairs.length} head-to-head comparisons of popular tools: GitHub stars, development activity, contributors, downloads, licenses and install commands side by side.</p></header>
${[...byContext.entries()].map(
  ([title, list]) => html`<section><h2>${title}</h2><ul class="link-list columns">${list.map((p) => html`<li><a href="${url.compare(p)}">${p.a.name} vs ${p.b.name}</a></li>`)}</ul></section>`
)}
</div>`;
  return {
    path: '/compare/',
    title: 'Compare data visualization tools',
    description: `${pairs.length} side-by-side comparisons of popular charting, mapping and visualization tools, such as ${pairs
      .slice(0, 3)
      .map((p) => `${p.a.name} vs ${p.b.name}`)
      .join(', ')}.`,
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['Compare', '/compare/']])],
    markdown: '/compare.md',
  };
}

function count(values) {
  const m = new Map();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export { abs };
