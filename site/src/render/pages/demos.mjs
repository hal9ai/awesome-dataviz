// Live demos: every demo (../demos/ in the repository) with its screenshot,
// grouped by where the library draws, and how to add a demo for another one.

import { html, url, breadcrumbs, icon, SITE } from '../html.mjs';
import { breadcrumbLd } from './tool.mjs';
import { VIEWS } from '../../../data/demos.mjs';
import { joinList, plural } from '../../util.mjs';

const GUIDE = `${SITE.repo}/blob/main/demos/README.md`;

// What to paste into Claude Code, Codex, Cursor or any other coding agent.
export const DEMO_PROMPT = `Add a live demo of LIBRARY to Awesome Dataviz: follow ${GUIDE} to build the Gapminder demo in a new demos/ folder, deploy it to cloudish.ai to test it, and open a pull request to hal9ai/awesome-dataviz with the live URL.`;

function demoCard(t) {
  const d = t.demo;
  const name = d.label ?? t.name;
  return html`<li class="demo-card">
<a class="demo-shot" href="${d.url}" rel="noopener" tabindex="-1" aria-hidden="true">${
    d.screenshot
      ? html`<img src="${d.screenshot}" alt="" width="1280" height="800" loading="lazy" decoding="async">`
      : html`<span class="demo-shot-empty">${name}</span>`
  }</a>
<div class="demo-body">
<h3><a href="${url.tool(t)}">${name}</a></h3>
${d.note ? html`<p>${d.note}</p>` : ''}
<p class="demo-actions"><a class="button primary" href="${d.url}" rel="noopener">Open the demo ${icon('external')}</a><a class="button" href="${d.sourceUrl}" rel="noopener">${icon('github')} Source</a></p>
</div>
</li>`;
}

export function renderDemos(ctx) {
  const { model } = ctx;
  const demos = model.demos;
  const browser = demos.filter((t) => t.demo.runs === 'browser');
  const server = demos.filter((t) => t.demo.runs === 'server');
  const body = html`<div class="wrap">
${breadcrumbs([{ name: 'Home', href: '/' }, { name: 'Live demos' }])}
<header class="page-header"><h1>Live demos</h1><p class="lead">The same data and the same three charts, built with ${plural(demos.length, 'library', 'libraries')}. Open any of them, change the year or the country, and read the code: since the data, views and colors are shared, the differences you see come from the library.</p></header>
<p class="section-note">Every demo draws the <a href="${SITE.repo}/tree/main/demos/data" rel="noopener">Gapminder dataset</a> (life expectancy, GDP per capita and population for 142 countries, 1952–2007) as ${joinList(Object.values(VIEWS))}. They run on <a href="https://cloudish.ai" rel="noopener">Cloudish</a> and sleep when nobody is using them, so the first visit may take a few seconds to wake one up.</p>
${browser.length ? html`<section aria-labelledby="browser"><h2 id="browser">Drawn in your browser</h2>
<p class="section-note">JavaScript libraries: the server only sends files, and every change happens on your machine.</p>
<ul class="demo-grid">${browser.map(demoCard)}</ul></section>` : ''}
${server.length ? html`<section aria-labelledby="server"><h2 id="server">Rendered on a server</h2>
<p class="section-note">Python and R libraries: each input goes to a running app, which draws the chart and sends it back.</p>
<ul class="demo-grid">${server.map(demoCard)}</ul></section>` : ''}
<section class="add-demo" aria-labelledby="add"><h2 id="add">Add a demo for your library</h2>
<div class="prose">
<p>Any library in the directory can have a demo here. A demo is one folder in <a href="${SITE.repo}/tree/main/demos" rel="noopener"><code>demos/</code></a>: a small app with a <code>Dockerfile</code> and a <code>demo.json</code> that names the library. Once its pull request is merged, it is deployed to Cloudish, screenshotted and added to this page and to the library's page, with nothing else to edit.</p>
<h3>With a coding agent</h3>
<p>Paste this into Claude Code, Codex, Cursor or any other coding agent, with your library's name in place of LIBRARY:</p>
<div class="prompt"><p>${DEMO_PROMPT}</p><button type="button" class="copy" data-copy="${DEMO_PROMPT}" aria-label="Copy the prompt">Copy</button></div>
<h3>By hand</h3>
<ol class="steps">
<li><strong>Start from the closest demo.</strong> Copy <a href="${SITE.repo}/tree/main/demos/matplotlib" rel="noopener"><code>matplotlib/</code></a> for a server-side library or a page of <a href="${SITE.repo}/tree/main/demos/js-gallery" rel="noopener"><code>js-gallery/</code></a> for a JavaScript one into <code>demos/your-library/</code>, and redraw the three views with your library.</li>
<li><strong>Describe it in <code>demo.json</code></strong>: whether it runs in the browser or on a server, and the URL your library's entry links to in the README.</li>
<li><strong>Try it</strong> with <code>node demos/deploy.mjs --check your-library</code> (Docker) or deploy it to your own Cloudish key with <code>node demos/deploy.mjs your-library</code>; no sign-up is needed.</li>
<li><strong>Open a pull request.</strong> Its checks build the demo and attach a screenshot.</li>
</ol>
<p>The <a href="${GUIDE}" rel="noopener">demo guide</a> has the details: the data, the views and colors to match, and what a good demo looks like (short, idiomatic, versions pinned, nothing loaded from other sites).</p>
</div>
</section>
</div>`;
  return {
    path: '/demos/',
    title: 'Live demos: the same charts in every library',
    description: `The same Gapminder charts built with ${demos.map((t) => t.demo.label ?? t.name).join(', ')}: live demos to compare data visualization libraries side by side, and how to add one for yours.`,
    body,
    jsonld: [breadcrumbLd([['Home', '/'], ['Live demos', '/demos/']])],
    markdown: '/demos.md',
  };
}
