// "A vs B": small multiples for each metric (two charts never share an axis
// unless they share a unit), a two-series activity line, a facts table and
// data-backed differences.

import { html, raw, url, abs, avatar, breadcrumbs, statusBadge, copyCommand, date, ago } from '../html.mjs';
import { descriptionHtml, toolCard } from '../components.mjs';
import { pairBars, pairLines, tableTwin, monthLabel } from '../charts.mjs';
import { keyDifferences } from '../../compare.mjs';
import { breadcrumbLd } from './tool.mjs';
import { formatCompact, formatNumber, joinList } from '../../util.mjs';

export function renderCompare(pair, ctx) {
  const { model, now, pairs } = ctx;
  const { a, b } = pair;
  const path = url.compare(pair);
  const title = `${a.name} vs ${b.name}`;
  const differences = keyDifferences(a, b, now);

  const metrics = [
    { label: 'GitHub stars', get: (t) => t.stars },
    { label: 'Commits, last 12 months', get: (t) => t.commitsLastYear },
    { label: 'Contributors', get: (t) => t.contributors },
    { label: 'Forks', get: (t) => t.facts?.forks ?? null },
  ];
  if (a.downloads && b.downloads && a.downloads.registry === b.downloads.registry) {
    metrics.splice(1, 0, { label: a.downloads.downloadsLabel, get: (t) => t.downloads.downloads });
  }
  const shown = metrics.filter((m) => m.get(a) != null || m.get(b) != null);

  const legend = html`<ul class="legend" aria-label="Legend"><li><span class="key s1" aria-hidden="true"></span>${a.name}</li><li><span class="key s2" aria-hidden="true"></span>${b.name}</li></ul>`;

  const multiples = html`<section aria-labelledby="numbers"><h2 id="numbers">By the numbers</h2>
${legend}
<div class="multiples">${shown.map(
    (m) => html`<figure class="multiple"><figcaption>${m.label}</figcaption>${raw(
      pairBars({ name: a.name, value: m.get(a) }, { name: b.name, value: m.get(b) }, { width: 300, label: m.label })
    )}</figure>`
  )}</div>
${tableTwin(`${title} by the numbers`, ['Metric', a.name, b.name], shown.map((m) => [m.label, fmt(m.get(a)), fmt(m.get(b))]))}
</section>`;

  const activity =
    a.monthlyCommits && b.monthlyCommits && a.monthlyCommits.length === b.monthlyCommits.length
      ? html`<section aria-labelledby="activity"><h2 id="activity">Development activity</h2>
<p class="section-note">Commits per month to each default branch, last 12 complete months.</p>
${legend}
<figure class="chart-figure">
  <div class="chart-wide">${raw(pairLines({ name: a.name, months: a.monthlyCommits }, { name: b.name, months: b.monthlyCommits }, { width: 680, height: 220, label: `${title}: commits per month` }))}</div>
  <div class="chart-narrow">${raw(pairLines({ name: a.name, months: a.monthlyCommits }, { name: b.name, months: b.monthlyCommits }, { width: 340, height: 200, label: `${title}: commits per month` }))}</div>
  ${tableTwin(`${title}: commits per month`, ['Month', a.name, b.name], a.monthlyCommits.map(([m, v], i) => [monthLabel(m, true), formatNumber(v), formatNumber(b.monthlyCommits[i][1])]))}
</figure></section>`
      : '';

  const row = (label, fn) => html`<tr><th scope="row">${label}</th><td>${fn(a)}</td><td>${fn(b)}</td></tr>`;
  const factsTable = html`<section aria-labelledby="facts"><h2 id="facts">Side by side</h2>
<div class="table-wrap"><table class="facts-table">
<thead><tr><th scope="col"><span class="visually-hidden">Attribute</span></th><th scope="col"><a href="${url.tool(a)}">${a.name}</a></th><th scope="col"><a href="${url.tool(b)}">${b.name}</a></th></tr></thead>
<tbody>
${row('Description', (t) => descriptionHtml(t.descriptionMd, model))}
${row('Category', (t) => html`<a href="${url.category(t.primaryCategory)}">${t.primaryCategory.title}</a>`)}
${row('License', (t) => t.license ?? '–')}
${row('Language', (t) => t.language ?? '–')}
${row('Status', (t) => (t.status ? statusBadge(t.status) : '–'))}
${row('Latest release', (t) => (t.facts?.latestRelease?.publishedAt ? html`${t.facts.latestRelease.tag} <span class="muted">(${date(t.facts.latestRelease.publishedAt)})</span>` : '–'))}
${row('Last commit', (t) => ago(t.lastCommitAt, now))}
${row('Repository created', (t) => date(t.facts?.createdAt))}
${row('Open issues', (t) => fmt(t.facts?.openIssues))}
${row('Install', (t) => (t.packages.length ? t.packages.slice(0, 2).map((p) => copyCommand(p.install)) : '–'))}
</tbody></table></div></section>`;

  const others = pairs.filter((p) => p !== pair && (p.a === a || p.b === a || p.a === b || p.b === b)).slice(0, 12);

  const body = html`<div class="wrap compare-page">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Compare', href: '/compare/' }, { name: title }])}
<header class="page-header compare-header">
  <h1>${a.name} <span class="vs">vs</span> ${b.name}</h1>
  <p class="lead">A data-driven comparison of two ${pair.context ? pair.context.title.replace(/^More /, '') : 'data visualization tools'}: popularity, development activity, licensing and installation. Updated ${date(model.builtAt)}.</p>
  <div class="versus">
    ${[a, b].map(
      (t, i) => html`<div class="versus-card s${i + 1}"><a class="tool-link" href="${url.tool(t)}">${avatar(t, 40)}<span class="tool-name">${t.name}</span></a><p>${descriptionHtml(t.descriptionMd, model)}</p></div>`
    )}
  </div>
</header>
${differences.length ? html`<section aria-labelledby="differences"><h2 id="differences">Key differences</h2><ul class="differences">${differences.map((d) => html`<li>${d}</li>`)}</ul></section>` : ''}
${multiples}
${activity}
${factsTable}
<section aria-labelledby="verdict"><h2 id="verdict">Which should you choose?</h2>
<div class="prose"><p>Popularity and activity are only part of the story. Consider which ecosystem you work in, the chart types and interactions you need, how much data you render, and whether the license fits your project. Both tool pages list alternatives if neither is quite right.</p></div>
<ul class="card-grid two">${toolCard(a, { model })}${toolCard(b, { model })}</ul>
</section>
${others.length ? html`<section aria-labelledby="more"><h2 id="more">More comparisons</h2><ul class="link-list columns">${others.map((p) => html`<li><a href="${url.compare(p)}">${p.a.name} vs ${p.b.name}</a></li>`)}</ul></section>` : ''}
</div>`;

  const description = `${title}: compare GitHub stars (${formatCompact(a.stars)} vs ${formatCompact(b.stars)}), commits, contributors, downloads, license and install commands side by side.`;
  const jsonld = [
    breadcrumbLd([
      ['Home', '/'],
      ['Compare', '/compare/'],
      [title, path],
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: abs(path),
      dateModified: model.builtAt.slice(0, 10),
      about: [a, b].map((t) => ({ '@type': 'SoftwareSourceCode', name: t.name, url: abs(url.tool(t)), ...(t.repoUrl ? { codeRepository: t.repoUrl } : {}) })),
    },
  ];

  return { path, title: `${title}: which to choose in ${new Date(model.builtAt).getUTCFullYear()}?`, description, body, jsonld, markdown: `/compare/${pair.slug}.md` };
}

const fmt = (n) => (n == null ? '–' : formatNumber(n));

export { joinList };
