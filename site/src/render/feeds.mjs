// Machine-readable outputs: JSON API, search index, Markdown twins of
// pages, llms.txt, sitemap, robots.txt, Atom feed and OpenSearch.

import { abs, url, SITE } from './html.mjs';
import { plainText } from './components.mjs';
import { toolSummary, alternativesFor } from './pages/tool.mjs';
import { keyDifferences } from '../compare.mjs';
import { inlineToText } from '../markdown.mjs';
import { formatCompact, formatDate, formatNumber, perPeriod, plural } from '../util.mjs';

const LICENSE_NOTE = 'Content: CC BY 4.0, Awesome Dataviz (https://awesomedataviz.com).';

export function apiTool(t, model) {
  const facts = t.facts;
  return {
    slug: t.slug,
    name: t.name,
    url: abs(url.tool(t)),
    description: t.description,
    homepage: t.homepage,
    repository: t.repoUrl,
    category: { slug: t.primaryCategory.slug, title: t.primaryCategory.title, url: abs(url.category(t.primaryCategory)) },
    categories: t.categories.map((c) => c.slug),
    topics: t.topics.map((x) => x.slug),
    language: t.language,
    license: t.license,
    status: t.status?.key ?? null,
    stars: t.stars,
    forks: facts?.forks ?? null,
    contributors: t.contributors,
    openIssues: facts?.openIssues ?? null,
    commitsLast12Months: t.commitsLastYear,
    monthlyCommits: t.monthlyCommits?.map(([month, commits]) => ({ month, commits })) ?? null,
    lastCommitAt: t.lastCommitAt,
    createdAt: facts?.createdAt ?? null,
    latestRelease: facts?.latestRelease ? { tag: facts.latestRelease.tag, publishedAt: facts.latestRelease.publishedAt, url: facts.latestRelease.url } : null,
    packages: t.packages.map((p) => ({
      registry: p.registry,
      name: p.name,
      version: p.version,
      install: p.install,
      url: p.registryUrl,
      downloads: p.downloads,
      downloadsPeriod: p.downloads == null ? null : p.period,
    })),
    githubTopics: t.githubTopics,
    addedAt: t.addedAt,
    alternatives: alternativesFor(t, model).map((x) => x.slug),
    comparisons: (t.comparisons ?? []).map((p) => abs(url.compare(p))),
  };
}

export function searchRecord(t) {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: t.primaryCategory.label ?? t.primaryCategory.title,
    categorySlug: t.primaryCategory.slug,
    categorySlugs: t.categories.map((c) => c.slug),
    categories: t.categories.map((c) => c.title),
    language: t.language,
    stars: t.stars,
    status: t.status?.key ?? null,
    license: t.license,
    aliases: t.aliases,
    topics: t.topics.map((x) => x.title),
    topicSlugs: t.topics.map((x) => x.slug),
    githubTopics: t.githubTopics.slice(0, 10),
    avatar: t.avatar ?? null,
  };
}

const mdEscape = (s) => String(s ?? '').replace(/\|/g, '\\|');
const mdLink = (text, href) => `[${text.replace(/[[\]]/g, '')}](${href})`;

export function toolMarkdown(t, model) {
  const facts = t.facts;
  const lines = [`# ${t.name}`, '', `> ${t.description}`, ''];
  const bullet = (k, v) => v != null && v !== '' && lines.push(`- ${k}: ${v}`);
  bullet('Category', t.categories.map((c) => mdLink(c.title, abs(url.category(c)))).join(', '));
  bullet('Website', t.homepage);
  bullet('Repository', t.repoUrl);
  bullet('License', t.license);
  bullet('Language', t.language);
  bullet('Status', t.status ? `${t.status.label} (${t.status.detail.replace(/\.$/, '').toLowerCase()})` : null);
  bullet('GitHub stars', t.stars != null ? formatNumber(t.stars) : null);
  bullet('Commits in the last 12 months', t.commitsLastYear != null ? formatNumber(t.commitsLastYear) : null);
  bullet('Contributors', t.contributors != null ? formatNumber(t.contributors) : null);
  bullet('Last commit', t.lastCommitAt ? formatDate(t.lastCommitAt) : null);
  bullet('Latest release', facts?.latestRelease?.publishedAt ? `${facts.latestRelease.tag} (${formatDate(facts.latestRelease.publishedAt)})` : null);
  for (const p of t.packages) bullet(`Install (${p.label})`, `\`${p.install}\`${p.downloads != null ? `, ${formatCompact(p.downloads)} downloads ${perPeriod(p.period)}` : ''}`);
  bullet('Topics', t.topics.map((x) => x.title).join(', '));
  lines.push('', '## Overview', '', toolSummary(t));
  const alts = alternativesFor(t, model);
  if (alts.length) {
    lines.push('', '## Alternatives', '');
    for (const a of alts) lines.push(`- ${mdLink(a.name, abs(url.tool(a)))}: ${a.description}${a.stars != null ? ` (${formatCompact(a.stars)} stars)` : ''}`);
  }
  if (t.comparisons?.length) {
    lines.push('', '## Comparisons', '');
    for (const p of t.comparisons) lines.push(`- ${mdLink(`${p.a.name} vs ${p.b.name}`, abs(url.compare(p)))}`);
  }
  lines.push('', `Source: ${abs(url.tool(t))} · Data updated ${model.builtAt.slice(0, 10)} · ${LICENSE_NOTE}`, '');
  return lines.join('\n');
}

function toolTableMarkdown(tools) {
  const rows = ['| # | Tool | GitHub stars | Commits (12 mo) | License | Description |', '|---:|---|---:|---:|---|---|'];
  tools.forEach((t, i) =>
    rows.push(
      `| ${i + 1} | ${mdLink(t.name, abs(url.tool(t)))} | ${t.stars != null ? formatNumber(t.stars) : '–'} | ${t.commitsLastYear != null ? formatNumber(t.commitsLastYear) : '–'} | ${t.license ?? '–'} | ${mdEscape(t.description)} |`
    )
  );
  return rows.join('\n');
}

export function collectionMarkdown(item, model, { kind }) {
  const intro = kind === 'category' ? item.intro : [item.intro];
  const path = kind === 'category' ? url.category(item) : url.topic(item);
  return [
    `# ${item.title}`,
    '',
    `> ${item.summary} ${plural(item.tools.length, 'tool')}, ranked by GitHub stars.`,
    '',
    ...intro.map((p) => plainText(p, model)).flatMap((p) => [p, '']),
    toolTableMarkdown(item.tools),
    '',
    `Source: ${abs(path)} · Data updated ${model.builtAt.slice(0, 10)} · ${LICENSE_NOTE}`,
    '',
  ].join('\n');
}

export function compareMarkdown(pair, model) {
  const { a, b } = pair;
  const row = (label, fn) => `| ${label} | ${mdEscape(fn(a))} | ${mdEscape(fn(b))} |`;
  const n = (v) => (v == null ? '–' : formatNumber(v));
  return [
    `# ${a.name} vs ${b.name}`,
    '',
    '## Key differences',
    '',
    ...keyDifferences(a, b).map((d) => `- ${d}`),
    '',
    `| | ${a.name} | ${b.name} |`,
    '|---|---|---|',
    row('Description', (t) => t.description),
    row('GitHub stars', (t) => n(t.stars)),
    row('Commits (12 months)', (t) => n(t.commitsLastYear)),
    row('Contributors', (t) => n(t.contributors)),
    row('License', (t) => t.license ?? '–'),
    row('Language', (t) => t.language ?? '–'),
    row('Status', (t) => t.status?.label ?? '–'),
    row('Install', (t) => t.packages.map((p) => `\`${p.install}\``).join(', ') || '–'),
    '',
    `Source: ${abs(url.compare(pair))} · Data updated ${model.builtAt.slice(0, 10)} · ${LICENSE_NOTE}`,
    '',
  ].join('\n');
}

export function homeMarkdown(model) {
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline}: ${plural(model.tools.length, 'tool')} in ${model.categories.length} categories, with live GitHub stars, activity, licenses and package downloads.`,
    '',
    '## Categories',
    '',
    ...model.categories.map((c) => `- ${mdLink(c.title, abs(url.category(c)))}: ${c.summary} (${plural(c.tools.length, 'tool')})`),
    '',
    '## Most popular tools',
    '',
    toolTableMarkdown(model.tools.filter((t) => t.stars != null).slice(0, 25)),
    '',
    `Source: ${SITE.url}/ · ${LICENSE_NOTE}`,
    '',
  ];
  return lines.join('\n');
}

export function llmsTxt(model, pairs) {
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline}. ${model.tools.length} charting libraries, mapping toolkits, graph and network visualization frameworks, dashboards and other tools for JavaScript, Python, R, Rust, C++, mobile and more, ranked with GitHub, npm, PyPI and CRAN data that is refreshed daily.`,
    '',
    `Every tool page lists what the tool is, its license, GitHub stars, commits per month, contributors, latest release, verified install commands and alternatives. Data was last refreshed on ${model.builtAt.slice(0, 10)}. Agents can query the directory live through the MCP server at ${SITE.url}/mcp or the JSON API documented at ${SITE.url}/ai/. Content is licensed CC BY 4.0.`,
    '',
    '## Categories',
    '',
    ...model.categories.map((c) => `- ${mdLink(c.title, abs(url.category(c).replace(/\/$/, '.md')))}: ${c.summary} ${plural(c.tools.length, 'tool')}.`),
    '',
    '## Topics',
    '',
    ...model.topics.map((tp) => `- ${mdLink(tp.title, abs(url.topic(tp).replace(/\/$/, '.md')))}: ${tp.summary} ${plural(tp.tools.length, 'tool')}.`),
    '',
    '## Tools',
    '',
    ...model.tools.map(
      (t) =>
        `- ${mdLink(t.name, abs(`/tools/${t.slug}.md`))}: ${t.description}${[t.primaryCategory.label, t.license, t.stars != null ? `${formatCompact(t.stars)} stars` : null].filter(Boolean).length ? ` (${[t.primaryCategory.label, t.license, t.stars != null ? `${formatCompact(t.stars)} stars` : null].filter(Boolean).join(', ')})` : ''}`
    ),
    '',
    '## API',
    '',
    `- ${mdLink('MCP server and API documentation', abs('/ai/'))}: connect AI assistants with \`claude mcp add --transport http awesome-dataviz ${SITE.url}/mcp\`.`,
    `- ${mdLink('All tools as JSON', abs('/api/tools.json'))}`,
    `- ${mdLink('Search API', abs('/api/search?q=react%20charts'))}: \`/api/search?q=\` with optional category, topic, language and status.`,
    '',
    '## Optional',
    '',
    `- ${mdLink('Full directory as Markdown', abs('/llms-full.txt'))}`,
    `- ${mdLink('Comparisons', abs('/compare/'))}: ${pairs.length} head-to-head comparisons.`,
    `- ${mdLink('Learning resources', abs('/resources.md'))}: books, catalogs, podcasts and websites.`,
    `- ${mdLink('About and methodology', abs('/about.md'))}`,
    '',
  ];
  return lines.join('\n');
}

export function llmsFullTxt(model) {
  return [
    `# ${SITE.name}: full directory`,
    '',
    `> ${SITE.tagline}. ${plural(model.tools.length, 'tool')}, data refreshed ${model.builtAt.slice(0, 10)}. ${LICENSE_NOTE}`,
    '',
    ...model.categories.flatMap((c) => [collectionMarkdown(c, model, { kind: 'category' }).replace(/^# /, '## '), '']),
    '# Tools',
    '',
    ...model.tools.flatMap((t) => [toolMarkdown(t, model).replace(/^# /, '## ').replace(/\n## /g, '\n### '), '']),
  ].join('\n');
}

export function toolsIndexMarkdown(model) {
  return [`# All data visualization tools`, '', `> ${plural(model.tools.length, 'tool')} ranked by GitHub stars. Data updated ${model.builtAt.slice(0, 10)}.`, '', toolTableMarkdown(model.tools), '', LICENSE_NOTE, ''].join('\n');
}

export function categoriesIndexMarkdown(model) {
  return ['# Categories', '', ...model.categories.map((c) => `- ${mdLink(c.title, abs(url.category(c)))}: ${c.summary} (${plural(c.tools.length, 'tool')})`), '', LICENSE_NOTE, ''].join('\n');
}

export function topicsIndexMarkdown(model) {
  return ['# Topics', '', ...model.topics.map((t) => `- ${mdLink(t.title, abs(url.topic(t)))}: ${t.summary} (${plural(t.tools.length, 'tool')})`), '', LICENSE_NOTE, ''].join('\n');
}

export function compareIndexMarkdown(pairs) {
  return ['# Comparisons', '', ...pairs.map((p) => `- ${mdLink(`${p.a.name} vs ${p.b.name}`, abs(url.compare(p)))}`), '', LICENSE_NOTE, ''].join('\n');
}

// Good-enough HTML -> Markdown for the prose pages (about, submit, AI docs).
export function htmlToMarkdown(page) {
  const body = String(page.body)
    .replace(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/, '')
    .replace(/<button[\s\S]*?<\/button>/g, '')
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => `\n\n\`\`\`\n${decode(code)}\n\`\`\`\n\n`)
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n\n')
    .replace(/<li[^>]*>/g, '\n- ')
    .replace(/<\/(p|ul|ol|div|section|header)>/g, '\n\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => `[${text.replace(/<[^>]+>/g, '')}](${href.startsWith('/') ? abs(href) : href})`)
    .replace(/<code>([\s\S]*?)<\/code>/g, '`$1`')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<[^>]+>/g, '');
  const text = decode(body)
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `${text}\n\nSource: ${abs(page.path)} · ${LICENSE_NOTE}\n`;
}

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export function resourcesMarkdown(model) {
  const lines = ['# Learning resources', ''];
  for (const r of model.resources) {
    lines.push(`## ${r.title}`, '');
    for (const e of r.entries) lines.push(`- ${mdLink(e.name, e.url)}${e.description ? ` ${e.separator ? '– ' : ''}${inlineToText(e.description)}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function sitemap(paths, lastmod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `<url><loc>${abs(p)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

export function robotsTxt() {
  return `# ${SITE.name}: crawlers and AI agents are welcome. See /llms.txt and /ai/.
User-agent: *
Allow: /
Disallow: /search/

Sitemap: ${SITE.url}/sitemap.xml
`;
}

const xml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function atomFeed(model) {
  const recent = model.tools.filter((t) => t.addedAt).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 40);
  const updated = recent[0]?.addedAt ? new Date(recent[0].addedAt).toISOString() : model.builtAt;
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${xml(SITE.name)}: recently added tools</title>
<subtitle>${xml(SITE.tagline)}</subtitle>
<link href="${SITE.url}/feed.xml" rel="self"/>
<link href="${SITE.url}/"/>
<id>${SITE.url}/</id>
<updated>${updated}</updated>
${recent
  .map(
    (t) => `<entry>
<title>${xml(t.name)}</title>
<link href="${abs(url.tool(t))}"/>
<id>${abs(url.tool(t))}</id>
<updated>${new Date(t.addedAt).toISOString()}</updated>
<category term="${xml(t.primaryCategory.slug)}" label="${xml(t.primaryCategory.title)}"/>
<summary>${xml(`${t.description}${t.stars != null ? ` (${formatCompact(t.stars)} GitHub stars)` : ''}`)}</summary>
</entry>`
  )
  .join('\n')}
</feed>
`;
}

export function openSearch() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
<ShortName>${SITE.name}</ShortName>
<Description>Search data visualization tools and libraries</Description>
<InputEncoding>UTF-8</InputEncoding>
<Image width="32" height="32" type="image/png">${SITE.url}/favicon-32.png</Image>
<Url type="text/html" template="${SITE.url}/search/?q={searchTerms}"/>
<Url type="application/json" template="${SITE.url}/api/search?q={searchTerms}"/>
</OpenSearchDescription>
`;
}
