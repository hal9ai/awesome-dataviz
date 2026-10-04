// Category and topic pages: a guide, a ranked table, comparisons and FAQ.

import { html, raw, url, abs, breadcrumbs, SITE } from '../html.mjs';
import { richText, plainText, toolTable, faq, chips, isOpenSource } from '../components.mjs';
import { breadcrumbLd } from './tool.mjs';
import { formatCompact, formatDate, joinList, plural } from '../../util.mjs';

const year = (iso) => new Date(iso).getUTCFullYear();

function atAGlance(tools, noun, now) {
  const ranked = tools.filter((t) => t.stars != null);
  const parts = [];
  if (ranked.length >= 2) {
    const top = ranked.slice(0, 3).map((t) => `<a href="${url.tool(t)}">${esc(t.name)}</a> (${formatCompact(t.stars)} stars)`);
    parts.push(`By GitHub stars, the most popular ${pluralNoun(noun)} here are ${joinList(top)}.`);
  }
  const active = tools.filter((t) => t.status?.key === 'active').length;
  if (ranked.length) parts.push(`${active} of ${tools.length} had commits in the last 90 days.`);
  return raw(parts.join(' '));
}

export function pluralNoun(noun) {
  if (/library$/.test(noun)) return noun.replace(/library$/, 'libraries');
  if (/s$/.test(noun)) return noun;
  return `${noun}s`;
}

export function renderCollection(item, ctx, { kind }) {
  const { model, now, pairs } = ctx;
  const tools = item.tools;
  const isCategory = kind === 'category';
  const path = isCategory ? url.category(item) : url.topic(item);
  const intro = isCategory ? item.intro : [item.intro];
  const noun = item.noun;

  const comparisons = pairs.filter((p) => tools.includes(p.a) && tools.includes(p.b));
  const relatedTopics = isCategory
    ? model.topics
        .map((tp) => ({ tp, n: tp.tools.filter((t) => tools.includes(t)).length }))
        .filter((x) => x.n >= 2)
        .sort((a, b) => b.n - a.n)
        .map((x) => x.tp)
    : [];
  const relatedCategories = isCategory
    ? model.categories.filter((c) => c !== item && c.group === item.group)
    : [...new Set(tools.map((t) => t.primaryCategory))].sort((a, b) => b.tools.length - a.tools.length);

  const ranked = tools.filter((t) => t.stars != null);
  const maintained = tools.filter((t) => t.status && ['active', 'maintained'].includes(t.status.key));
  const open = tools.filter(isOpenSource);
  const faqBlock = faq([
    ranked.length && {
      q: `What is the most popular ${noun}?`,
      a: raw(
        `By GitHub stars, <a href="${url.tool(ranked[0])}">${esc(ranked[0].name)}</a> is the most popular, with ${formatCompact(ranked[0].stars)} stars${
          ranked[1] ? `, followed by <a href="${url.tool(ranked[1])}">${esc(ranked[1].name)}</a> (${formatCompact(ranked[1].stars)})` : ''
        }${ranked[2] ? ` and <a href="${url.tool(ranked[2])}">${esc(ranked[2].name)}</a> (${formatCompact(ranked[2].stars)})` : ''}.`
      ),
    },
    maintained.length && {
      q: `Which ${pluralNoun(noun)} are actively maintained?`,
      a: raw(
        `${maintained.length} of the ${tools.length} tools listed had commits in the last 12 months, including ${joinList(
          maintained.slice(0, 5).map((t) => `<a href="${url.tool(t)}">${esc(t.name)}</a>`)
        )}. Each tool page shows monthly commit activity.`
      ),
    },
    open.length && {
      q: `Are these ${pluralNoun(noun)} free and open source?`,
      a: raw(
        `${open.length} of the ${tools.length} tools listed use an OSI-approved open-source license${
          open.length < tools.length ? '; the others are source-available, free to use, or use a custom license, so check each tool page' : ''
        }. The most common license here is ${mostCommon(tools.map((t) => t.license).filter(Boolean))}.`
      ),
    },
  ]);

  const titleYear = year(model.builtAt);
  const heading = item.title;
  const body = html`<div class="wrap collection-page">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: isCategory ? 'Categories' : 'Topics', href: isCategory ? '/categories/' : '/topics/' }, { name: heading }])}
<header class="page-header">
  <h1>${heading}</h1>
  <p class="lead">${item.summary} ${plural(tools.length, 'tool')}, ranked by GitHub stars and updated <time datetime="${model.builtAt}">${formatDate(model.builtAt)}</time>.</p>
</header>
<div class="prose intro">
  ${intro.map((p) => html`<p>${richText(p, model)}</p>`)}
  <p>${atAGlance(tools, noun, now)}</p>
</div>
${toolTable(tools, { model, now, showCategory: !isCategory, caption: `${heading}, ranked by GitHub stars` })}
${comparisons.length ? html`<section aria-labelledby="comparisons"><h2 id="comparisons">Head-to-head comparisons</h2>
<ul class="link-list columns">${comparisons.map((p) => html`<li><a href="${url.compare(p)}">${p.a.name} vs ${p.b.name}</a></li>`)}</ul></section>` : ''}
${relatedTopics.length ? html`<section aria-labelledby="topics"><h2 id="topics">Related topics</h2>${chips(relatedTopics, (x) => url.topic(x), 'Related topics')}</section>` : ''}
${relatedCategories.length ? html`<section aria-labelledby="categories"><h2 id="categories">${isCategory ? 'Related categories' : 'Categories in this topic'}</h2>${chips(relatedCategories, (x) => url.category(x), 'Categories')}</section>` : ''}
${faqBlock.html}
<p class="sources">Missing a tool? <a href="/submit/">Add it</a> with a one-line pull request to the <a href="${SITE.repo}" rel="noopener">README</a>.</p>
</div>`;

  const jsonld = [
    breadcrumbLd([
      ['Home', '/'],
      [isCategory ? 'Categories' : 'Topics', isCategory ? '/categories/' : '/topics/'],
      [heading, path],
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      description: plainText(intro[0] ?? item.summary, model),
      url: abs(path),
      dateModified: model.builtAt.slice(0, 10),
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: tools.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(url.tool(t)), name: t.name })),
      },
    },
    faqBlock.jsonld,
  ];

  return {
    path,
    title: `${heading} (${titleYear}): ${tools.length} tools ranked`,
    description: `${plainText(item.summary, model)} Compare ${tools.length} ${pluralNoun(noun)} by GitHub stars, recent activity, license and downloads${
      ranked.length >= 2 ? `, including ${ranked.slice(0, 3).map((t) => t.name).join(', ')}` : ''
    }.`,
    body,
    jsonld,
    markdown: `${path.replace(/\/$/, '')}.md`,
  };
}

function mostCommon(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'not available';
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
