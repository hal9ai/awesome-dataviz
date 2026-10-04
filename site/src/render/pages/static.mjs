// Resources, about, submit, AI/API docs, search and 404.

import { html, raw, url, breadcrumbs, copyCommand, SITE, icon } from '../html.mjs';
import { descriptionHtml } from '../components.mjs';
import { breadcrumbLd } from './tool.mjs';
import { formatDate, formatNumber } from '../../util.mjs';

const RESOURCE_TITLES = { 'Twitter accounts': 'People to follow' };

export function renderResources(ctx) {
  const { model } = ctx;
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Resources' }])}
<header class="page-header"><h1>Learning resources</h1><p class="lead">Books, chart catalogs, podcasts, people and websites for learning data visualization, curated alongside the tools.</p></header>
<nav class="toc" aria-label="On this page"><ul>${model.resources.map((r) => html`<li><a href="#${r.slug}">${RESOURCE_TITLES[r.title] ?? r.title}</a></li>`)}</ul></nav>
${model.resources.map((r) => {
  const groups = [];
  for (const e of r.entries) {
    const last = groups.at(-1);
    if (e.group && last?.group === e.group) last.items.push(e);
    else groups.push({ group: e.group, items: [e] });
  }
  return html`<section aria-labelledby="${r.slug}"><h2 id="${r.slug}">${RESOURCE_TITLES[r.title] ?? r.title}</h2>
<ul class="resource-list">${groups.map((g) =>
    g.group
      ? html`<li>${g.group}<ul>${g.items.map((e) => resourceItem(e, model))}</ul></li>`
      : g.items.map((e) => resourceItem(e, model))
  )}</ul></section>`;
})}
</div>`;
  return {
    path: '/resources/',
    title: 'Data visualization books, podcasts, catalogs & websites',
    description: 'The best resources for learning data visualization: classic books, chart-type catalogs, podcasts, people to follow and websites, curated by the community.',
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['Resources', '/resources/']])],
    markdown: '/resources.md',
  };
}

// README resource lines read as prose: "[Book](url) by Author.", "[Site](url)'s
// blog", "[Site](url) - What it is." Keep that shape.
function resourceItem(e, model) {
  const joiner = !e.description ? '' : e.separator ? ' – ' : /^['’]/.test(e.description) ? '' : ' ';
  return html`<li><a href="${e.url}" rel="noopener">${e.name}</a>${joiner}${e.description ? descriptionHtml(e.description, model) : ''}</li>`;
}

export function renderAbout(ctx) {
  const { model, meta } = ctx;
  const github = model.tools.filter((t) => t.facts?.host === 'github').length;
  const packages = model.tools.reduce((n, t) => n + t.packages.length, 0);
  const body = html`<div class="wrap narrow">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'About' }])}
<header class="page-header"><h1>About Awesome Dataviz</h1><p class="lead">${SITE.tagline}, built in the open since ${meta.firstYear}.</p></header>
<div class="prose">
<p>Awesome Dataviz began as a GitHub “awesome list” of open-source data visualization frameworks, libraries and software, created by <a href="https://github.com/fasouto" rel="noopener">Fabio Souto</a> and now maintained by <a href="https://github.com/javierluraschi" rel="noopener">Javier Luraschi</a> with ${meta.contributors ? `${formatNumber(meta.contributors)} contributors` : 'many contributors'}. This website turns that list into a searchable directory with live data about every tool.</p>

<h2>How tools are selected</h2>
<p>Every tool on this site is one line in the <a href="${SITE.repo}" rel="noopener">README of the repository</a>. Anyone can propose a tool with a pull request; maintainers check that it is a working data visualization tool, that the description is short and neutral, and that it is not a duplicate. Open-source tools are preferred, and spam or projects whose functionality cannot be verified are declined. The website is rebuilt from the README automatically, so the list and the site never disagree.</p>

<h2>Where the numbers come from</h2>
<ul>
<li><strong>GitHub stars, forks, open issues, license, language, topics and releases</strong> come from the GitHub API for the ${formatNumber(github)} tools with a public GitHub repository (GitLab for a few others).</li>
<li><strong>Commits</strong> count commits to the repository's default branch in each of the last 12 complete calendar months.</li>
<li><strong>Contributors</strong> is the number of GitHub accounts with commits, as reported by the GitHub API.</li>
<li><strong>Packages and downloads</strong> come from npm, PyPI, CRAN, crates.io, the Go module proxy and RubyGems. A package is only shown when the registry links back to the same repository, or a maintainer confirmed it, so an install command never points at an unrelated package with the same name. ${formatNumber(packages)} packages are currently verified. Weekly downloads come from the npm downloads API, pypistats.org and the CRAN logs.</li>
<li><strong>Listed since</strong> is the date an entry first appeared in the README, from its git history.</li>
</ul>
<p>Everything is refreshed daily. When an API is unavailable, the previous day's value is kept rather than dropped.</p>

<h2>Maintenance status</h2>
<ul>
<li><strong>Active</strong>: at least one commit in the last 90 days.</li>
<li><strong>Maintained</strong>: at least one commit in the last 12 months.</li>
<li><strong>Inactive</strong>: no commits for more than a year. Mature tools can be inactive and still work well.</li>
<li><strong>Archived</strong>: the repository is archived and read-only.</li>
</ul>

<h2>How rankings work</h2>
<p>Lists are ordered by GitHub stars, the most widely available signal of how many people know and use a project. Stars measure attention rather than quality, so each page also shows recent activity, contributors and package downloads, and every tool page links to alternatives and comparisons.</p>

<h2>Use the data</h2>
<p>The directory is available as <a href="/api/tools.json">JSON</a>, through an <a href="/ai/">MCP server</a> for AI assistants, and as plain text in <a href="/llms.txt">llms.txt</a>. Content is licensed under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a>: reuse it with attribution to Awesome Dataviz.</p>

<h2>Contact</h2>
<p>Found a mistake or a missing tool? <a href="${SITE.repo}/issues/new" rel="noopener">Open an issue</a> or <a href="/submit/">submit a pull request</a>.</p>
</div>
</div>`;
  return {
    path: '/about/',
    title: 'About & methodology',
    description: 'How Awesome Dataviz selects data visualization tools and where its GitHub stars, commit activity, package downloads and maintenance status come from.',
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['About', '/about/']])],
    markdown: '/about.md',
  };
}

export function renderSubmit(ctx) {
  const { model } = ctx;
  const example = '- [Name](https://github.com/owner/repo) - Short, neutral description of what it does.';
  const body = html`<div class="wrap narrow">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Add a tool' }])}
<header class="page-header"><h1>Add a tool</h1><p class="lead">The directory is built from one Markdown file. Adding a tool takes a one-line pull request.</p></header>
<div class="prose">
<ol class="steps">
<li><strong>Check that it isn't listed yet.</strong> Search the <a href="/tools/">${formatNumber(model.tools.length)} tools</a> by name.</li>
<li><strong>Edit the README.</strong> Open the <a href="${SITE.repo}/edit/main/README.md" rel="noopener">README editor on GitHub</a> and find the section that fits best: a language (Python, R, Rust…), a JavaScript category (charting, graphs, maps, React…) or Other tools for standalone apps.</li>
<li><strong>Add one line</strong> in this format:${copyCommand(example)}Link to the source repository when there is one: it is what lets the site show stars, activity, license and install commands.</li>
<li><strong>Open the pull request.</strong> Once a maintainer merges it, the tool gets its own page here within a day.</li>
</ol>
<h2>What gets accepted</h2>
<ul>
<li>Working data visualization tools: libraries, apps, services and frameworks whose main job is turning data into charts, maps, graphs or dashboards.</li>
<li>Open-source projects are preferred. Closed-source tools need a very good reason.</li>
<li>Short, neutral descriptions. No marketing superlatives.</li>
<li>Pull requests that look like spam, or whose functionality we can't verify, are closed.</li>
</ul>
<p>To fix incorrect data on a tool page (wrong repository, package or license), open an issue or edit <code>site/data/overrides.mjs</code>.</p>
</div>
</div>`;
  return {
    path: '/submit/',
    title: 'Add a data visualization tool',
    description: 'How to add a data visualization library or app to Awesome Dataviz with a one-line pull request.',
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['Add a tool', '/submit/']])],
    markdown: '/submit.md',
  };
}

export function renderAi(ctx) {
  const { model } = ctx;
  const endpoint = `${SITE.url}/mcp`;
  const cursor = JSON.stringify({ mcpServers: { 'awesome-dataviz': { url: endpoint } } }, null, 2);
  const vscode = JSON.stringify({ servers: { 'awesome-dataviz': { type: 'http', url: endpoint } } }, null, 2);
  const example = JSON.stringify(
    {
      slug: 'chart-js',
      name: 'Chart.js',
      url: `${SITE.url}/tools/chart-js/`,
      description: 'Charts with the canvas tag.',
      category: 'JavaScript charting libraries',
      stars: model.toolBySlug.get('chart-js')?.stars ?? 0,
      license: 'MIT',
      status: 'active',
      install: ['npm install chart.js'],
    },
    null,
    2
  );
  const body = html`<div class="wrap narrow">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'For AI agents' }])}
<header class="page-header"><h1>Awesome Dataviz for AI agents and developers</h1><p class="lead">Give your assistant current facts about ${formatNumber(model.tools.length)} data visualization tools, from ranking and activity to licenses and install commands, instead of whatever it remembers from training.</p></header>
<div class="prose">
<h2 id="mcp">MCP server</h2>
<p>A remote <a href="https://modelcontextprotocol.io" rel="noopener">Model Context Protocol</a> server is available at <code>${endpoint}</code> (Streamable HTTP, no authentication). It offers four read-only tools:</p>
<ul>
<li><code>search_dataviz_tools</code>: find tools by need (“react network graph”, “python 3d”, “terminal charts”), optionally filtered by category, topic, language or maintenance status.</li>
<li><code>get_dataviz_tool</code>: everything about one tool, including stars, activity, license, install commands and alternatives.</li>
<li><code>compare_dataviz_tools</code>: two to five tools side by side.</li>
<li><code>list_dataviz_categories</code>: the categories and topics, with counts.</li>
</ul>
<h3>Claude Code</h3>
${copyCommand(`claude mcp add --transport http awesome-dataviz ${endpoint}`)}
<h3>Claude.ai and Claude Desktop</h3>
<p>Go to Settings → Connectors → Add custom connector, and paste <code>${endpoint}</code> as the URL.</p>
<h3>Cursor</h3>
<p>Add to <code>.cursor/mcp.json</code>:</p>
<pre><code>${cursor}</code></pre>
<h3>VS Code</h3>
<p>Add to <code>.vscode/mcp.json</code>:</p>
<pre><code>${vscode}</code></pre>

<h2 id="api">JSON API</h2>
<p>Read-only, CORS-enabled and free to use with attribution. Data is refreshed daily.</p>
<ul>
<li><a href="/api/tools.json"><code>GET /api/tools.json</code></a>: every tool with its facts.</li>
<li><code>GET /api/tools/{slug}.json</code>: one tool, for example <a href="/api/tools/chart-js.json"><code>/api/tools/chart-js.json</code></a>.</li>
<li><a href="/api/categories.json"><code>GET /api/categories.json</code></a> and <a href="/api/topics.json"><code>GET /api/topics.json</code></a>.</li>
<li><a href="/api/search?q=react%20charts"><code>GET /api/search?q=react%20charts</code></a>: ranked search, with optional <code>category</code>, <code>topic</code>, <code>language</code>, <code>status</code> and <code>limit</code> parameters.</li>
</ul>
<p>A search result looks like this (abridged):</p>
<pre><code>${example}</code></pre>

<h2 id="llms">For crawlers and LLMs</h2>
<ul>
<li><a href="/llms.txt"><code>/llms.txt</code></a> is an index of the site in the <a href="https://llmstxt.org" rel="noopener">llms.txt</a> format, and <a href="/llms-full.txt"><code>/llms-full.txt</code></a> contains the whole directory as Markdown.</li>
<li>Every page has a Markdown version: append <code>.md</code> to a tool, category or topic URL (for example <a href="/tools/chart-js.md"><code>/tools/chart-js.md</code></a>), or request any page with <code>Accept: text/markdown</code>.</li>
<li>The <a href="/sitemap.xml">sitemap</a> lists every page, and new tools are announced in the <a href="/feed.xml">Atom feed</a>.</li>
</ul>
<p>Content is licensed under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a>. Please attribute “Awesome Dataviz (awesomedataviz.com)”.</p>
</div>
</div>`;
  return {
    path: '/ai/',
    title: 'MCP server, API and llms.txt',
    description: 'Connect AI assistants to Awesome Dataviz with a remote MCP server, a JSON API, llms.txt and Markdown versions of every page.',
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['For AI agents', '/ai/']])],
    markdown: '/ai.md',
  };
}

export function renderSearch() {
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Search' }])}
<header class="page-header"><h1>Search</h1></header>
<form class="hero-search page-search" role="search" action="/search/" method="get">
  <label class="visually-hidden" for="page-q">Search the directory</label>
  ${icon('search')}
  <input id="page-q" name="q" type="search" placeholder="Search tools" autocomplete="off" spellcheck="false">
  <button type="submit" class="button primary">Search</button>
</form>
<div id="search-page-results" aria-live="polite"><noscript><p>Search needs JavaScript. Browse <a href="/tools/">all tools</a> instead.</p></noscript></div>
</div>`;
  return { path: '/search/', title: 'Search', description: 'Search the directory of data visualization tools.', body, jsonld: [], noindex: true };
}

export function renderNotFound(ctx) {
  const { model } = ctx;
  const body = html`<div class="wrap narrow not-found">
<h1>Page not found</h1>
<p class="lead">That page doesn't exist, or it moved. Try a search, or start from one of these:</p>
<form class="hero-search page-search" role="search" action="/search/" method="get">
  <label class="visually-hidden" for="nf-q">Search the directory</label>
  ${icon('search')}
  <input id="nf-q" name="q" type="search" placeholder="Search tools" autocomplete="off">
  <button type="submit" class="button primary">Search</button>
</form>
<ul class="link-list">
<li><a href="/tools/">All ${formatNumber(model.tools.length)} tools</a></li>
<li><a href="/categories/">Categories</a></li>
<li><a href="/topics/">Topics</a></li>
<li><a href="/compare/">Comparisons</a></li>
</ul>
</div>`;
  return { path: '/404.html', title: 'Page not found', description: 'Page not found.', body, jsonld: [], noindex: true };
}

export { raw, url, formatDate };
