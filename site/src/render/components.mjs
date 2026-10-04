// Page fragments shared by several templates.

import { html, raw, url, avatar, num, ago, statusBadge } from './html.mjs';
import { escapeHtml, inlineToHtml } from '../markdown.mjs';
import { sparkColumns } from './charts.mjs';
import { formatNumber } from '../util.mjs';

// Editorial text (trusted, authored in src/content) with [[slug]] links and
// `code` spans. Unknown slugs fall back to plain text.
export function richText(text, model) {
  const withLinks = text.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, slug, label) => {
    const tool = model.toolBySlug.get(slug);
    const name = escapeHtml(label ?? tool?.name ?? slug);
    return tool ? `<a href="${url.tool(tool)}">${name}</a>` : name;
  });
  return raw(withLinks.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`));
}

export const plainText = (text, model) =>
  text
    .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, slug, label) => label ?? model.toolBySlug.get(slug)?.name ?? slug)
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]+)`/g, '$1');

// README descriptions: inline Markdown, with README anchors (#r-tools)
// pointing at the matching category page.
export function descriptionHtml(markdown, model) {
  return raw(
    inlineToHtml(markdown, {
      resolveUrl: (u) => {
        if (!u.startsWith('#')) return u;
        const category = model.categoryByAnchor.get(u.slice(1));
        return category ? url.category(category) : '/categories/';
      },
    })
  );
}

// The main tools table. Rows carry data-* sort keys for the client script.
export function toolTable(tools, { model, now, rank = true, showCategory = false, id = null, caption = null } = {}) {
  const maxStars = Math.max(1, ...tools.map((t) => t.stars ?? 0));
  return html`<div class="table-wrap"><table class="tools sortable"${id ? raw(` id="${id}"`) : ''}>
${caption ? html`<caption class="visually-hidden">${caption}</caption>` : ''}
<thead><tr>
${rank ? html`<th scope="col" class="n rank" data-sort="rank" aria-sort="ascending"><button type="button">#</button></th>` : ''}
<th scope="col" data-sort="name"><button type="button">Tool</button></th>
${showCategory ? html`<th scope="col" class="hide-sm" data-sort="category"><button type="button">Category</button></th>` : ''}
<th scope="col" class="n" data-sort="stars"${rank ? '' : raw(' aria-sort="descending"')}><button type="button">GitHub stars</button></th>
<th scope="col" class="n hide-sm" data-sort="commits"><button type="button">Commits <span class="th-sub">12 mo</span></button></th>
<th scope="col" class="hide-md" data-sort="updated"><button type="button">Last commit</button></th>
<th scope="col" class="hide-md" data-sort="license"><button type="button">License</button></th>
</tr></thead>
<tbody>
${tools.map((t, i) => toolRow(t, { i, maxStars, rank, showCategory, model, now }))}
</tbody></table></div>`;
}

function toolRow(t, { i, maxStars, rank, showCategory, model, now }) {
  const pct = t.stars ? Math.max(1.5, (t.stars / maxStars) * 100) : 0;
  const cat = t.primaryCategory;
  return html`<tr data-rank="${i + 1}" data-name="${t.name.toLowerCase()}" data-stars="${t.stars ?? -1}" data-commits="${t.commitsLastYear ?? -1}" data-updated="${t.lastCommitAt ? Date.parse(t.lastCommitAt) : 0}" data-license="${t.license ?? '~'}" data-category="${cat.slug}" data-language="${t.language ?? ''}" data-status="${t.status?.key ?? 'unknown'}" data-topics="${t.topics.map((x) => x.slug).join(' ')}">
${rank ? html`<td class="n rank">${i + 1}</td>` : ''}
<td class="tool-cell">
  <a class="tool-link" href="${url.tool(t)}">${avatar(t, 20)}<span class="tool-name">${t.name}</span></a>
  ${t.status && (t.status.key === 'inactive' || t.status.key === 'archived') ? statusBadge(t.status) : ''}
  <p class="tool-desc">${descriptionHtml(t.descriptionMd, model)}</p>
</td>
${showCategory ? html`<td class="hide-sm nowrap"><a class="quiet" href="${url.category(cat)}" title="${cat.title}">${cat.label ?? cat.title}</a></td>` : ''}
<td class="n stars-cell">${t.stars != null ? html`${num(t.stars)}<span class="inline-bar" aria-hidden="true"><span style="width:${pct.toFixed(1)}%"></span></span>` : html`<span class="muted">–</span>`}</td>
<td class="n hide-sm activity-cell">${t.monthlyCommits ? html`${raw(sparkColumns(t.monthlyCommits))}<span>${formatNumber(t.commitsLastYear)}</span>` : html`<span class="muted">–</span>`}</td>
<td class="hide-md nowrap">${ago(t.lastCommitAt, now)}</td>
<td class="hide-md nowrap">${t.license ?? html`<span class="muted">–</span>`}</td>
</tr>`;
}

export function toolCard(t, { model, extra = '' } = {}) {
  return html`<li class="tool-card">
  <a class="tool-link" href="${url.tool(t)}">${avatar(t, 24)}<span class="tool-name">${t.name}</span></a>
  <p>${descriptionHtml(t.descriptionMd, model)}</p>
  <p class="meta">${t.stars != null ? html`<span>${num(t.stars)} stars</span>` : ''}${t.language ? html`<span>${t.language}</span>` : ''}${t.license ? html`<span>${t.license}</span>` : ''}${extra}</p>
</li>`;
}

export function statTiles(items) {
  return html`<dl class="stat-tiles">${items
    .filter(Boolean)
    .map((s) => html`<div class="stat"><dt>${s.label}</dt><dd><span class="stat-value">${s.value}</span>${s.sub ? html`<span class="stat-sub">${s.sub}</span>` : ''}</dd></div>`)}</dl>`;
}

// FAQ block plus its schema.org FAQPage twin.
export function faq(items, { heading = 'Frequently asked questions', id = 'faq' } = {}) {
  const list = items.filter(Boolean);
  if (!list.length) return { html: '', jsonld: null };
  return {
    html: html`<section class="faq" aria-labelledby="${id}"><h2 id="${id}">${heading}</h2>
${list.map((q) => html`<details><summary><h3>${q.q}</h3></summary><div class="answer">${q.a}</div></details>`)}</section>`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: list.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: String(q.a).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() },
      })),
    },
  };
}

export function chips(items, hrefFor, label) {
  if (!items.length) return '';
  return html`<ul class="chips" aria-label="${label}">${items.map((x) => html`<li><a href="${hrefFor(x)}">${x.title}</a></li>`)}</ul>`;
}

export const OSI = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD', 'GPL-2.0', 'GPL-3.0', 'GPL-2.0-or-later', 'GPL-3.0-or-later',
  'LGPL-2.1', 'LGPL-3.0', 'AGPL-3.0', 'MPL-2.0', 'ISC', 'EPL-2.0', 'EPL-1.0', 'PSF-2.0', 'Zlib', 'Unlicense', '0BSD',
  'Artistic-2.0', 'BSL-1.0', 'CDDL-1.0', 'MS-PL', 'EUPL-1.2', 'BlueOak-1.0.0', 'Python-2.0', 'NCSA', 'UPL-1.0',
]);

export const isOpenSource = (t) => OSI.has(t.license);

export function spdxUrl(license) {
  return license && /^[A-Za-z0-9.+-]+$/.test(license) && license !== 'Other' && license !== 'BSD' ? `https://spdx.org/licenses/${license}.html` : null;
}
