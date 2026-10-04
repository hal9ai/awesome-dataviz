// HTML templating: a tagged template that escapes every interpolation unless
// it was produced by `html` or wrapped in `raw()`. README text is
// contributor-supplied, so escaping by default is the safe choice.

import { escapeHtml } from '../markdown.mjs';
import { formatCompact, formatDate, formatNumber, timeAgo } from '../util.mjs';

export class Raw {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const raw = (value) => new Raw(String(value ?? ''));

function render(value) {
  if (value == null || value === false || value === true) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (value instanceof Raw) return value.value;
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Raw(out);
}

export const SITE = {
  name: 'Awesome Dataviz',
  url: 'https://awesomedataviz.com',
  repo: 'https://github.com/hal9ai/awesome-dataviz',
  tagline: 'The open directory of data visualization tools',
};

export const abs = (path) => `${SITE.url}${path}`;

// Links for pages and resources.
export const url = {
  tool: (t) => `/tools/${t.slug}/`,
  category: (c) => `/categories/${c.slug}/`,
  topic: (t) => `/topics/${t.slug}/`,
  compare: (pair) => `/compare/${pair.slug}/`,
};

export function readmeLineUrl(line) {
  return `${SITE.repo}/blob/main/README.md${line ? `#L${line}` : ''}`;
}

const STATUS_ICONS = {
  active: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M5 8.2l2 2 4-4.4" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  maintained: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.6" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>',
  inactive: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l6.6 11.6H1.4z"/><path d="M8 6v3.4M8 11.2v.1" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>',
  archived: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="3.2" rx="1"/><path d="M3 6.2h10V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M6.4 9h3.2" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

// Maintenance status: always an icon plus a text label, never color alone.
export function statusBadge(status, { long = false } = {}) {
  if (!status) return '';
  return html`<span class="status status-${status.key}" title="${status.detail}">${raw(STATUS_ICONS[status.key])}<span>${status.label}</span>${
    long ? html`<span class="status-detail"> · ${status.detail}</span>` : ''
  }</span>`;
}

export function avatar(tool, size = 20) {
  const src = tool.avatar;
  if (src) return html`<img class="avatar" src="${src}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;
  const letter = (tool.name.match(/[A-Za-z0-9]/)?.[0] ?? '?').toUpperCase();
  return html`<span class="avatar avatar-letter" aria-hidden="true" style="--size:${size}px">${letter}</span>`;
}

export const num = (n) => html`<span class="num" title="${n == null ? '' : formatNumber(n)}">${formatCompact(n)}</span>`;
export const date = (iso) => (iso ? html`<time datetime="${iso}">${formatDate(iso)}</time>` : '–');
export const ago = (iso, now) => (iso ? html`<time datetime="${iso}" title="${formatDate(iso)}">${timeAgo(iso, now)}</time>` : '–');

export function breadcrumbs(items) {
  return html`<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, i) =>
    i === items.length - 1
      ? html`<li><span aria-current="page">${item.name}</span></li>`
      : html`<li><a href="${item.href}">${item.name}</a></li>`
  )}</ol></nav>`;
}

export function copyCommand(command) {
  return html`<div class="cmd"><code>${command}</code><button type="button" class="copy" data-copy="${command}" aria-label="Copy command: ${command}">Copy</button></div>`;
}

const ICONS = {
  github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
  external: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2h5v5M14 2L7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  theme: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.3l1.95 4.1 4.5.55-3.3 3.1.86 4.45L8 11.3l-4.01 2.2.86-4.45-3.3-3.1 4.5-.55z" fill="currentColor"/></svg>',
};
export const icon = (name) => raw(ICONS[name]);

// The brand mark: three ascending bars, the first data-end rounded like the charts.
export const LOGO = raw(
  '<svg class="logo-mark" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="12" width="4.5" height="9" rx="1.4"/><rect x="9.75" y="7" width="4.5" height="14" rx="1.4"/><rect x="16.5" y="3" width="4.5" height="18" rx="1.4"/></svg>'
);

const NAV = [
  { href: '/tools/', label: 'Tools' },
  { href: '/categories/', label: 'Categories' },
  { href: '/topics/', label: 'Topics' },
  { href: '/compare/', label: 'Compare' },
  { href: '/resources/', label: 'Resources' },
  { href: '/ai/', label: 'For AI agents' },
];

export function layout({ title, description, path, body, jsonld = [], noindex = false, markdown = null, assets, model, ogType = 'website', bodyClass = '' }) {
  const canonical = abs(path);
  const fullTitle = path === '/' ? title : `${title} | ${SITE.name}`;
  const ld = jsonld.filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${abs('/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f9f9f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d0d0d" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${markdown ? `<link rel="alternate" type="text/markdown" href="${markdown}">\n` : ''}<link rel="alternate" type="application/atom+xml" title="Recently added to ${SITE.name}" href="/feed.xml">
<link rel="search" type="application/opensearchdescription+xml" title="${SITE.name}" href="/opensearch.xml">
<link rel="stylesheet" href="${assets.css}">
<script>${THEME_BOOT}</script>
<script type="module" src="${assets.js}"></script>
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
${header(path)}
<main id="main">
${body}
</main>
${footer(model)}
<div class="tooltip" role="tooltip" hidden></div>
</body>
</html>
`;
}

// Applies the saved theme before first paint so the page never flashes.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`;

function header(path) {
  return html`<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/" aria-label="${SITE.name} home">${LOGO}<span>Awesome<b>Dataviz</b></span></a>
    <nav class="main-nav" aria-label="Main">
      <ul>${NAV.map((n) => html`<li><a href="${n.href}"${path.startsWith(n.href) ? raw(' aria-current="page"') : ''}>${n.label}</a></li>`)}</ul>
    </nav>
    <form class="search" role="search" action="/search/" method="get">
      <label class="visually-hidden" for="q">Search tools</label>
      ${icon('search')}
      <input id="q" name="q" type="search" placeholder="Search tools" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="search-results" aria-expanded="false">
      <kbd aria-hidden="true">/</kbd>
      <ul id="search-results" class="search-results" role="listbox" hidden></ul>
    </form>
    <button type="button" class="icon-button theme-toggle" aria-label="Toggle dark mode">${icon('theme')}</button>
    <a class="icon-button" href="${SITE.repo}" aria-label="GitHub repository" rel="noopener">${icon('github')}</a>
  </div>
</header>`;
}

function footer(model) {
  const updated = model?.builtAt;
  return html`<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="brand" href="/">${LOGO}<span>Awesome<b>Dataviz</b></span></a>
      <p>${SITE.tagline}. Curated by the community on <a href="${SITE.repo}" rel="noopener">GitHub</a> since 2014${
        updated ? html`, with data refreshed daily (last update <time datetime="${updated}">${formatDate(updated)}</time>)` : ''
      }.</p>
      <p class="muted">Content is available under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a>. Maintained by <a href="https://github.com/javierluraschi" rel="noopener">Javier Luraschi</a> and contributors, sponsored by <a href="https://hal9.com" rel="noopener">Hal9</a>.</p>
    </div>
    <nav aria-label="Directory">
      <h2>Directory</h2>
      <ul>
        <li><a href="/tools/">All tools</a></li>
        <li><a href="/categories/">Categories</a></li>
        <li><a href="/topics/">Topics</a></li>
        <li><a href="/compare/">Comparisons</a></li>
        <li><a href="/resources/">Books, podcasts &amp; more</a></li>
      </ul>
    </nav>
    <nav aria-label="Project">
      <h2>Project</h2>
      <ul>
        <li><a href="/about/">About &amp; methodology</a></li>
        <li><a href="/submit/">Add a tool</a></li>
        <li><a href="/ai/">MCP server &amp; API</a></li>
        <li><a href="/llms.txt">llms.txt</a></li>
        <li><a href="/feed.xml">Recently added (Atom)</a></li>
      </ul>
    </nav>
  </div>
</footer>`;
}
