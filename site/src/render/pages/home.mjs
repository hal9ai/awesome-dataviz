// Home: what the directory is, search, the landscape of every tool, and
// entry points by category, popularity, activity and recency.

import { html, raw, url, abs, avatar, num, date, SITE, icon } from '../html.mjs';
import { statTiles, chips, descriptionHtml } from '../components.mjs';
import { landscape } from '../charts.mjs';
import { GROUPS } from '../../content/categories.mjs';
import { formatCompact, formatDate, formatNumber, plural } from '../../util.mjs';

export function landscapeRows(model) {
  const order = GROUPS.map((g) => g.key);
  return model.categories
    .filter((c) => c.tools.filter((t) => t.stars != null).length >= 2)
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || b.stars - a.stars)
    .map((c) => ({ label: c.label ?? c.title, href: url.category(c), tools: c.tools.filter((t) => t.stars != null) }));
}

export function renderHome(ctx) {
  const { model, now } = ctx;
  const tools = model.tools;
  const withStars = tools.filter((t) => t.stars != null);
  const totalStars = withStars.reduce((s, t) => s + t.stars, 0);
  const active = tools.filter((t) => t.status?.key === 'active').length;
  const rows = landscapeRows(model);
  const popular = withStars.slice(0, 10);
  const busiest = [...tools].filter((t) => t.commitsLastYear).sort((a, b) => b.commitsLastYear - a.commitsLastYear).slice(0, 10);
  const recent = [...tools].filter((t) => t.addedAt).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 8);

  const groups = GROUPS.map((g) => ({ ...g, categories: model.categories.filter((c) => c.group === g.key) })).filter((g) => g.categories.length);

  const body = html`<section class="hero">
  <div class="wrap">
    <h1>Every data visualization tool, <span class="nowrap">in one place</span></h1>
    <p class="lead">An open, community-curated directory of ${formatNumber(tools.length)} charting libraries, mapping toolkits, graph visualizers, dashboards and more, ranked with live GitHub, npm, PyPI and CRAN data refreshed daily.</p>
    <form class="hero-search" role="search" action="/search/" method="get">
      <label class="visually-hidden" for="hero-q">Search the directory</label>
      ${icon('search')}
      <input id="hero-q" name="q" type="search" placeholder="Try “react charts”, “maps”, “python 3d” or “terminal”" autocomplete="off" spellcheck="false" data-search-input aria-controls="hero-results" aria-expanded="false">
      <button type="submit" class="button primary">Search</button>
      <ul id="hero-results" class="search-results" role="listbox" hidden></ul>
    </form>
    <p class="quick-links">Popular: ${['javascript-charting-libraries', 'python', 'react', 'javascript-maps', 'r', 'javascript-graph-visualization']
      .map((s) => model.categories.find((c) => c.slug === s))
      .filter(Boolean)
      .map((c, i) => html`${i ? ' · ' : ''}<a href="${url.category(c)}">${c.label}</a>`)}</p>
  </div>
</section>
<div class="wrap">
${statTiles([
  { label: 'Tools', value: formatNumber(tools.length), sub: `${model.categories.length} categories` },
  { label: 'Combined GitHub stars', value: formatCompact(totalStars) },
  { label: 'Active in the last 90 days', value: formatNumber(active), sub: `${Math.round((active / Math.max(1, withStars.length)) * 100)}% of tracked repositories` },
  { label: 'Data refreshed', value: html`<time datetime="${model.builtAt}">${formatDate(model.builtAt)}</time>`, sub: 'daily, from public APIs' },
])}

<section class="landscape" aria-labelledby="landscape">
  <div class="section-head"><h2 id="landscape">The landscape</h2><a href="/tools/">View as a table</a></div>
  <p class="section-note">Each dot is one tool, placed by its GitHub stars on a log scale and grouped by category; the most-starred tool in each row is labeled. Hover for details, click to open.</p>
  <figure class="chart-figure">
    <div class="chart-wide">${raw(landscape(rows, { width: 1120, labelW: 170 }))}</div>
    <div class="chart-mid">${raw(landscape(rows, { width: 700, labelW: 130, dotR: 4 }))}</div>
    <div class="chart-narrow">${raw(landscape(rows, { width: 360, labelW: 104, dotR: 4, leaders: false }))}</div>
  </figure>
</section>

<section aria-labelledby="browse">
  <div class="section-head"><h2 id="browse">Browse by category</h2><a href="/categories/">All categories</a></div>
  ${groups.map(
    (g) => html`<h3 class="group-title">${g.title}</h3><ul class="category-grid">${g.categories.map(
      (c) => html`<li><a class="category-card" href="${url.category(c)}"><span class="cat-title">${c.title}</span><span class="cat-count">${plural(c.tools.length, 'tool')}</span><span class="cat-top">${c.tools
        .slice(0, 3)
        .map((t) => t.name)
        .join(', ')}</span></a></li>`
    )}</ul>`
  )}
</section>

<div class="two-col">
  <section aria-labelledby="popular">
    <div class="section-head"><h2 id="popular">Most popular</h2><a href="/tools/">Full ranking</a></div>
    <ol class="rank-list">${popular.map(
      (t) => html`<li><a class="tool-link" href="${url.tool(t)}">${avatar(t, 20)}<span class="tool-name">${t.name}</span></a><span class="rank-meta">${t.primaryCategory.label}</span><span class="rank-value">${num(t.stars)}<span class="unit"> stars</span></span></li>`
    )}</ol>
  </section>
  <section aria-labelledby="active">
    <div class="section-head"><h2 id="active">Most active this year</h2></div>
    <ol class="rank-list">${busiest.map(
      (t) => html`<li><a class="tool-link" href="${url.tool(t)}">${avatar(t, 20)}<span class="tool-name">${t.name}</span></a><span class="rank-meta">${t.primaryCategory.label}</span><span class="rank-value">${num(t.commitsLastYear)}<span class="unit"> commits</span></span></li>`
    )}</ol>
  </section>
</div>

<section aria-labelledby="recent">
  <div class="section-head"><h2 id="recent">Recently added</h2><a href="/feed.xml">Atom feed</a></div>
  <ul class="card-grid">${recent.map(
    (t) => html`<li class="tool-card"><a class="tool-link" href="${url.tool(t)}">${avatar(t, 24)}<span class="tool-name">${t.name}</span></a><p>${descriptionHtml(t.descriptionMd, model)}</p><p class="meta"><span>Added ${date(t.addedAt)}</span><span><a href="${url.category(t.primaryCategory)}">${t.primaryCategory.label}</a></span></p></li>`
  )}</ul>
</section>

<section aria-labelledby="topics">
  <div class="section-head"><h2 id="topics">Explore by topic</h2><a href="/topics/">All topics</a></div>
  ${chips(model.topics, (x) => url.topic(x), 'Topics')}
</section>

<section class="ai-panel" aria-labelledby="ai">
  <div>
    <h2 id="ai">Ask your AI assistant</h2>
    <p>The whole directory is available to AI agents through an <a href="/ai/">MCP server</a>, a JSON API and <a href="/llms.txt">llms.txt</a>, so assistants can recommend data visualization tools from current data instead of memory.</p>
  </div>
  <div class="cmd-stack">
    <div class="cmd"><code>claude mcp add --transport http awesome-dataviz ${SITE.url}/mcp</code><button type="button" class="copy" data-copy="claude mcp add --transport http awesome-dataviz ${SITE.url}/mcp" aria-label="Copy command">Copy</button></div>
    <p class="muted">Or point any MCP client at <code>${SITE.url}/mcp</code>.</p>
  </div>
</section>
</div>`;

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      alternateName: 'awesome-dataviz',
      url: `${SITE.url}/`,
      description: `${SITE.tagline}: ${tools.length} charting libraries, mapping toolkits, graph visualization frameworks and dashboards with live popularity and activity data.`,
      inLanguage: 'en',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search/?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Awesome Dataviz directory',
      description: `A curated catalog of ${tools.length} data visualization tools with GitHub stars, commit activity, licenses, package downloads and categories, refreshed daily.`,
      url: `${SITE.url}/`,
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
      creator: { '@type': 'Organization', name: 'Awesome Dataviz contributors', url: SITE.repo },
      dateModified: model.builtAt.slice(0, 10),
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs('/api/tools.json') }],
    },
  ];

  return {
    path: '/',
    title: `${SITE.name}: the directory of data visualization tools and libraries`,
    description: `Find the right data visualization tool: ${tools.length} charting libraries, maps, graph and network visualization, dashboards and more for JavaScript, Python, R and beyond, with live GitHub stars and activity.`,
    body,
    jsonld,
    markdown: '/index.md',
    bodyClass: 'home',
  };
}
