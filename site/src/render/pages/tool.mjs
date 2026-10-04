// One page per tool: what it is, live facts, install commands, activity,
// how it ranks against alternatives, and an FAQ answered from the data.

import { html, raw, url, abs, avatar, num, date, ago, statusBadge, breadcrumbs, copyCommand, icon, readmeLineUrl, SITE } from '../html.mjs';
import { descriptionHtml, statTiles, faq, chips, toolCard, isOpenSource, spdxUrl } from '../components.mjs';
import { monthlyColumns, emphasisBars, tableTwin, monthLabel } from '../charts.mjs';
import { formatCompact, formatDate, formatNumber, joinList, perPeriod, plural, timeAgo } from '../../util.mjs';
import { byPopularity } from '../../model.mjs';

const an = (word) => (/^(?:[aeio]|R |ML |iOS|open|8|11|18|F2)/i.test(word) ? 'an' : 'a');

export function alternativesFor(tool, model, limit = 6) {
  const pool = new Set();
  for (const c of tool.categories) for (const t of c.tools) if (t !== tool) pool.add(t);
  if (pool.size < 3) for (const topic of tool.topics) for (const t of topic.tools) if (t !== tool) pool.add(t);
  if (pool.size < 3) for (const c of model.categories) if (c.group === tool.primaryCategory.group) for (const t of c.tools) if (t !== tool) pool.add(t);
  return [...pool].sort(byPopularity).slice(0, limit);
}

function statusSentence(t) {
  if (!t.status) return '';
  const commits = t.commitsLastYear != null ? ` with ${plural(t.commitsLastYear, 'commit')} in the last 12 months` : '';
  switch (t.status.key) {
    case 'active':
      return `It is actively developed${commits}.`;
    case 'maintained':
      return `It is maintained${commits}; the most recent commit was on ${formatDate(t.lastCommitAt)}.`;
    case 'inactive':
      return `It has not had a commit since ${formatDate(t.lastCommitAt)}.`;
    case 'archived':
      return `Its repository is archived on ${t.facts.host === 'gitlab' ? 'GitLab' : 'GitHub'} and no longer receives updates.`;
    default:
      return '';
  }
}

// A factual summary paragraph, written to be quotable on its own.
export function toolSummary(t) {
  const cat = t.primaryCategory;
  const parts = [];
  const kind = `${isOpenSource(t) ? 'open-source ' : ''}${cat.noun}`;
  let first = `${t.name} is ${an(kind)} ${kind}`;
  if (t.license) first += isOpenSource(t) ? ` released under the ${t.license} license` : '';
  parts.push(`${first}.`);
  if (t.stars != null) {
    const host = t.facts.host === 'gitlab' ? 'GitLab' : 'GitHub';
    const counts = [plural(t.stars, 'star'), t.facts.forks != null ? plural(t.facts.forks, 'fork') : null, t.contributors ? plural(t.contributors, 'contributor') : null].filter(Boolean);
    parts.push(`Its ${host} repository has ${joinList(counts)}.`);
  }
  const status = statusSentence(t);
  if (status) parts.push(status);
  if (t.facts?.latestRelease?.publishedAt) {
    parts.push(`The latest release, ${t.facts.latestRelease.tag}, was published on ${formatDate(t.facts.latestRelease.publishedAt)}.`);
  }
  if (t.downloads) {
    parts.push(
      t.downloads.period === 'all time'
        ? `It has been downloaded about ${formatCompact(t.downloads.downloads)} times from ${t.downloads.label}.`
        : `On ${t.downloads.label} it is downloaded about ${formatCompact(t.downloads.downloads)} times ${perPeriod(t.downloads.period)}.`
    );
  }
  return parts.join(' ');
}

export function renderTool(t, ctx) {
  const { model, now } = ctx;
  const cat = t.primaryCategory;
  const facts = t.facts;
  const alternatives = alternativesFor(t, model);
  const path = url.tool(t);
  const host = facts?.host === 'gitlab' ? 'GitLab' : 'GitHub';

  const links = [
    t.homepage && html`<a class="button primary" href="${t.homepage}" rel="noopener">Website ${icon('external')}</a>`,
    t.repoUrl && html`<a class="button" href="${t.repoUrl}" rel="noopener">${icon('github')} ${host}</a>`,
    ...t.packages.slice(0, 2).map((p) => html`<a class="button" href="${p.registryUrl}" rel="noopener">${p.label}</a>`),
  ].filter(Boolean);

  const release = facts?.latestRelease;
  const tiles = statTiles([
    t.stars != null && { label: `${host} stars`, value: num(t.stars), sub: t.rank <= 100 ? `#${t.rank} in the directory` : null },
    t.downloads && { label: t.downloads.downloadsLabel, value: num(t.downloads.downloads) },
    t.commitsLastYear != null && { label: 'Commits, last 12 months', value: formatNumber(t.commitsLastYear) },
    t.contributors && { label: 'Contributors', value: num(t.contributors) },
    t.lastCommitAt && { label: 'Last commit', value: ago(t.lastCommitAt, now) },
    release?.publishedAt && { label: 'Latest release', value: html`<a href="${release.url}" rel="noopener">${release.tag.length > 14 ? `${release.tag.slice(0, 13)}…` : release.tag}</a>`, sub: formatDate(release.publishedAt) },
  ]);

  const activity = t.monthlyCommits
    ? html`<section aria-labelledby="activity"><h2 id="activity">Development activity</h2>
<p class="section-note">Commits per month to the default branch over the last 12 complete months.</p>
<figure class="chart-figure">
  <div class="chart-wide">${raw(monthlyColumns(t.monthlyCommits, { width: 680, height: 200, label: `${t.name} commits per month` }))}</div>
  <div class="chart-narrow">${raw(monthlyColumns(t.monthlyCommits, { width: 340, height: 180, label: `${t.name} commits per month` }))}</div>
  <figcaption>${plural(t.commitsLastYear, 'commit')} from ${monthLabel(t.monthlyCommits[0][0], true)} to ${monthLabel(t.monthlyCommits.at(-1)[0], true)}.</figcaption>
  ${tableTwin(`${t.name} commits per month`, ['Month', 'Commits'], t.monthlyCommits.map(([m, v]) => [monthLabel(m, true), formatNumber(v)]))}
</figure></section>`
    : '';

  // Emphasis chart: this tool in the accent, the most-starred alternatives in gray.
  const ranked = [t, ...alternatives].filter((x) => x.stars != null).sort(byPopularity).slice(0, 8);
  const popularity =
    t.stars != null && ranked.length >= 3
      ? html`<section aria-labelledby="popularity"><h2 id="popularity">Popularity among ${cat.tools.length >= 3 ? alternativesNoun(cat) : 'related tools'}</h2>
<figure class="chart-figure">
  <div class="chart-wide">${raw(emphasisBars(ranked.map((x) => ({ label: x.name, value: x.stars, highlight: x === t, href: x === t ? null : url.tool(x) })), { width: 640, label: 'GitHub stars' }))}</div>
  <div class="chart-narrow">${raw(emphasisBars(ranked.map((x) => ({ label: x.name, value: x.stars, highlight: x === t, href: x === t ? null : url.tool(x) })), { width: 340, label: 'GitHub stars' }))}</div>
  <figcaption>GitHub stars for ${t.name} and the most-starred alternatives.</figcaption>
  ${tableTwin('GitHub stars', ['Tool', 'Stars'], ranked.map((x) => [x.name, formatNumber(x.stars)]))}
</figure></section>`
      : '';

  const comparisons = t.comparisons ?? [];
  const altSection = alternatives.length
    ? html`<section aria-labelledby="alternatives"><h2 id="alternatives">Alternatives to ${t.name}</h2>
<ul class="card-grid">${alternatives.map((alt) => {
        const pair = comparisons.find((p) => p.a === alt || p.b === alt);
        return toolCard(alt, { model, extra: pair ? html`<a class="compare-link" href="${url.compare(pair)}">${t.name} vs ${alt.name}</a>` : '' });
      })}</ul>
${comparisons.length ? html`<p class="more">More comparisons: ${raw(comparisons.map((p) => html`<a href="${url.compare(p)}">${p.a.name} vs ${p.b.name}</a>`.value).join(' · '))}</p>` : ''}
</section>`
    : '';

  const install = t.packages.length
    ? html`<section aria-labelledby="install"><h2 id="install">Install</h2>
${t.packages.map((p) => html`<div class="install-row"><span class="registry">${p.label}</span>${copyCommand(p.install)}<a class="quiet" href="${p.registryUrl}" rel="noopener">v${p.version}</a></div>`)}
</section>`
    : '';

  const altNames = alternatives.slice(0, 3).map((x) => `<a href="${url.tool(x)}">${escapeText(x.name)}</a>`);
  const faqBlock = faq(
    [
      {
        q: `Is ${t.name} open source?`,
        a: raw(
          isOpenSource(t)
            ? `Yes. ${escapeText(t.name)} is released under the ${escapeText(t.license)} license, and its source code is on <a href="${t.repoUrl}" rel="noopener">${host}</a>.`
            : t.repoUrl
              ? `Its source code is public on <a href="${t.repoUrl}" rel="noopener">${host}</a>${t.license === 'Other' || !t.license ? ', but its license is not a standard open-source license that could be identified automatically. Check the license file before using it in a product' : ` under the ${escapeText(t.license)} license`}.`
              : `We could not find a public source repository for ${escapeText(t.name)}. See <a href="${t.homepage ?? t.url}" rel="noopener">its website</a> for licensing details.`
        ),
      },
      t.status && {
        q: `Is ${t.name} still maintained?`,
        a: raw(
          {
            active: `Yes. ${escapeText(t.name)} is actively developed, with ${plural(t.commitsLastYear ?? 0, 'commit')} in the last 12 months and the latest commit ${timeAgo(t.lastCommitAt, now)}.`,
            maintained: `Mostly. ${escapeText(t.name)} had ${plural(t.commitsLastYear ?? 0, 'commit')} in the last 12 months; the latest was on ${formatDate(t.lastCommitAt)}.`,
            inactive: `It appears inactive: the latest commit was on ${formatDate(t.lastCommitAt)}, over a year ago. It may still work well, but expect fewer fixes and updates.`,
            archived: `No. The repository is archived, which means it is read-only and no longer updated.`,
          }[t.status.key]
        ),
      },
      t.packages.length && {
        q: `How do I install ${t.name}?`,
        a: raw(
          t.packages
            .map((p) => `From ${p.label}: <code>${escapeText(p.install)}</code>`)
            .join('. ') + '.'
        ),
      },
      alternatives.length && {
        q: `What are the best alternatives to ${t.name}?`,
        a: raw(`The most popular alternatives listed in ${escapeText(cat.title)} are ${joinList(altNames)}. See the <a href="${url.category(cat)}">full ranking</a>.`),
      },
      t.language && {
        q: `What language is ${t.name} written in?`,
        a: raw(`${escapeText(t.name)} is primarily written in ${escapeText(t.language)}${facts?.host === 'github' ? ', according to GitHub' : ''}.`),
      },
    ],
    { heading: `${t.name} FAQ` }
  );

  const entry = t.entries[0];
  const body = html`<article class="wrap tool-page">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Categories', href: '/categories/' }, { name: cat.title, href: url.category(cat) }, { name: t.name }])}
<header class="page-header tool-header">
  <div class="tool-title">${avatar(t, 56)}<div><h1>${t.name}</h1><p class="lead">${descriptionHtml(t.descriptionMd, model)}</p></div></div>
  <ul class="badges">
    ${t.status ? html`<li>${statusBadge(t.status)}</li>` : ''}
    ${t.license ? html`<li class="badge">${spdxUrl(t.license) ? html`<a href="${spdxUrl(t.license)}" rel="noopener license">${t.license}</a>` : t.license}</li>` : ''}
    ${t.language ? html`<li class="badge">${t.language}</li>` : ''}
    ${t.categories.map((c) => html`<li class="badge"><a href="${url.category(c)}">${c.title}</a></li>`)}
  </ul>
  ${links.length ? html`<div class="actions">${links}</div>` : ''}
</header>
${t.stars != null || t.downloads ? tiles : ''}
<div class="tool-grid">
  <div class="tool-main">
    <section aria-labelledby="overview"><h2 id="overview">Overview</h2>
      <p>${toolSummary(t)}</p>
      ${cleanDescription(facts?.description) && normalize(cleanDescription(facts.description)) !== normalize(t.description) ? html`<p>Its ${host} description: <q>${cleanDescription(facts.description)}</q></p>` : ''}
      ${t.githubTopics.length ? html`<p class="topic-line"><span class="muted">${host} topics:</span> ${t.githubTopics.slice(0, 12).map((x) => html`<span class="tag">${x}</span>`)}</p>` : ''}
    </section>
    ${install}
    ${activity}
    ${popularity}
  </div>
  <aside class="tool-aside" aria-label="Details">
    <h2 class="visually-hidden">Details</h2>
    <dl class="facts">
      ${t.homepage ? html`<dt>Website</dt><dd><a href="${t.homepage}" rel="noopener">${prettyUrl(t.homepage)}</a></dd>` : ''}
      ${t.repoUrl ? html`<dt>Repository</dt><dd><a href="${t.repoUrl}" rel="noopener">${facts?.fullName ?? `${t.repo.owner}/${t.repo.name}`}</a></dd>` : ''}
      ${t.license ? html`<dt>License</dt><dd>${t.license}${t.licenseSource && !['github', 'gitlab', 'curated'].includes(t.licenseSource) ? html` <span class="muted">(declared on ${t.packages.find((p) => p.registry === t.licenseSource)?.label ?? t.licenseSource})</span>` : ''}</dd>` : ''}
      ${t.language ? html`<dt>Language</dt><dd>${t.language}</dd>` : ''}
      ${facts?.createdAt ? html`<dt>Created</dt><dd>${date(facts.createdAt)}</dd>` : ''}
      ${facts?.forks != null ? html`<dt>Forks</dt><dd>${formatNumber(facts.forks)}</dd>` : ''}
      ${facts?.openIssues != null ? html`<dt>Open issues</dt><dd>${formatNumber(facts.openIssues)}</dd>` : ''}
      ${t.addedAt ? html`<dt>Listed since</dt><dd>${date(t.addedAt)}</dd>` : ''}
    </dl>
    ${t.topics.length ? html`<h3>Topics</h3>${chips(t.topics, (x) => url.topic(x), 'Topics')}` : ''}
    <p class="edit"><a href="${readmeLineUrl(entry.line)}" rel="noopener">View this entry in the README</a> · <a href="${SITE.repo}/edit/main/README.md" rel="noopener">Suggest an edit</a></p>
  </aside>
</div>
${altSection}
${faqBlock.html}
<p class="sources">Data: ${facts ? `${host} API` : 'README'}${t.packages.length ? `, ${[...new Set(t.packages.map((p) => p.label))].join(', ')}` : ''}. Updated ${formatDate(model.builtAt)}.</p>
</article>`;

  const jsonld = [
    breadcrumbLd([
      ['Home', '/'],
      ['Categories', '/categories/'],
      [cat.title, url.category(cat)],
      [t.name, path],
    ]),
    {
      '@context': 'https://schema.org',
      '@type': t.repoUrl ? 'SoftwareSourceCode' : 'WebSite',
      '@id': `${abs(path)}#software`,
      name: t.name,
      description: t.description,
      url: t.homepage ?? t.repoUrl ?? t.url,
      ...(t.repoUrl ? { codeRepository: t.repoUrl } : {}),
      ...(t.language ? { programmingLanguage: t.language } : {}),
      ...(spdxUrl(t.license) ? { license: spdxUrl(t.license) } : {}),
      ...(facts?.createdAt ? { dateCreated: facts.createdAt.slice(0, 10) } : {}),
      ...(t.lastCommitAt ? { dateModified: t.lastCommitAt.slice(0, 10) } : {}),
      ...(t.githubTopics.length ? { keywords: t.githubTopics.join(', ') } : {}),
      ...(release ? { version: release.tag } : {}),
    },
    faqBlock.jsonld,
  ];

  return {
    path,
    title: `${t.name} – ${shortNoun(cat)}`,
    description: metaDescription(t),
    body,
    jsonld,
    markdown: `/tools/${t.slug}.md`,
  };
}

function alternativesNoun(cat) {
  return cat.title.replace(/^More /, '');
}

function shortNoun(cat) {
  return cat.noun.replace(/^./, (c) => c.toUpperCase());
}

export function metaDescription(t) {
  const bits = [t.description.replace(/\.$/, '')];
  const facts = [];
  if (t.stars != null) facts.push(`${formatCompact(t.stars)} GitHub stars`);
  if (t.license) facts.push(`${t.license} license`);
  if (t.status) facts.push(t.status.label.toLowerCase());
  let text = `${t.name}: ${bits[0]}.`;
  if (facts.length) text += ` ${facts.join(', ')}.`;
  text += ' Install, activity and alternatives.';
  return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  };
}

// GitHub descriptions may carry :emoji_shortcodes: and stray whitespace.
const cleanDescription = (s) => String(s ?? '').replace(/:[a-z0-9_+-]+:/gi, '').replace(/\s+/g, ' ').trim();
const normalize = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const prettyUrl = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
