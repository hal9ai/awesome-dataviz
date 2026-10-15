import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseReadme } from '../src/readme.mjs';
import { README, REPO_DIR } from '../src/data.mjs';
import { buildModel } from '../src/model.mjs';
import { renderTool } from '../src/render/pages/tool.mjs';
import { apiTool, toolMarkdown } from '../src/render/feeds.mjs';
import DEMOS, { VIEWS, demoFor, demoUrl } from '../data/demos.mjs';

const FIXTURE = `# Awesome Dataviz
## Contents
- [JavaScript tools](#javascript-tools)

## JavaScript tools

### Charting libraries
- [Chart.js](https://www.chartjs.org/) - Charts with the canvas tag.
- [Plotly.js](https://github.com/plotly/plotly.js/) - Declarative charts.
- [D3.js](https://github.com/d3/d3) - Data-driven documents.
`;

const TEMPLATE = 'https://demo-{demo}.example.test';
const resolved = (urls) => Object.fromEntries(urls.map((u) => [u, demoFor(u, { template: TEMPLATE })]));

test('demos point at README entries, existing folders and known views', () => {
  const readme = readFileSync(README, 'utf8');
  for (const [key, d] of Object.entries(DEMOS)) {
    assert.ok(readme.includes(`](${key})`), `demo key not found in README: ${key}`);
    assert.ok(existsSync(join(REPO_DIR, 'demos', d.demo, 'Dockerfile')), `no Dockerfile for demo ${d.demo}`);
    assert.ok(existsSync(join(REPO_DIR, 'demos', d.demo, 'README.md')), `no README for demo ${d.demo}`);
    assert.ok(existsSync(join(REPO_DIR, d.source)), `demo source not found: ${d.source}`);
    if (d.page) assert.ok(existsSync(join(REPO_DIR, 'demos', d.demo, 'site', d.page)), `no page ${d.page} in demo ${d.demo}`);
    assert.ok(d.views.length && d.views.every((v) => VIEWS[v]), `unknown views for ${key}`);
  }
});

test('demo URLs come from the template; sources link to GitHub', () => {
  assert.equal(demoUrl('streamlit', '', TEMPLATE), 'https://demo-streamlit.example.test/');
  assert.equal(demoUrl('js-gallery', 'plotly.html', 'https://x.test/{demo}/'), 'https://x.test/js-gallery/plotly.html');
  const chartjs = demoFor('https://www.chartjs.org/', { template: TEMPLATE });
  assert.equal(chartjs.url, 'https://demo-js-gallery.example.test/chartjs.html');
  assert.equal(chartjs.sourceUrl, 'https://github.com/hal9ai/awesome-dataviz/blob/main/demos/js-gallery/site/chartjs.html');
  assert.equal(demoFor('https://matplotlib.org/').sourceUrl, 'https://github.com/hal9ai/awesome-dataviz/tree/main/demos/matplotlib');
  assert.equal(demoFor('https://example.com/no-demo'), null);
});

test('tools with a demo get a "Try it live" section linking the other demos', () => {
  const { sections } = parseReadme(FIXTURE);
  const model = buildModel({ sections, demos: resolved(['https://www.chartjs.org/', 'https://github.com/plotly/plotly.js/']), now: Date.parse('2026-10-14T00:00:00Z') });
  const chartjs = model.toolBySlug.get('chart-js');
  const plotly = model.tools.find((t) => t.name === 'Plotly.js');
  const d3 = model.tools.find((t) => t.name === 'D3.js');
  assert.deepEqual(chartjs.demo.others, [plotly]);
  assert.equal(d3.demo, null);

  const page = String(renderTool(chartjs, { model, now: Date.parse(model.builtAt) }).body);
  assert.match(page, /<h2 id="live-demo">Try it live<\/h2>/);
  assert.match(page, /<a class="button primary" href="https:\/\/demo-js-gallery\.example\.test\/chartjs\.html" rel="noopener">Open the live demo/);
  assert.match(page, /href="https:\/\/github\.com\/hal9ai\/awesome-dataviz\/blob\/main\/demos\/js-gallery\/site\/chartjs\.html"/);
  assert.match(page, /may take a few seconds to wake up/);
  assert.match(page, /chartjs-chart-geo plugin/);
  assert.match(page, /other libraries: <a href="https:\/\/demo-js-gallery\.example\.test\/plotly\.html" rel="noopener">Plotly\.js<\/a>/);
  assert.doesNotMatch(String(renderTool(d3, { model, now: Date.parse(model.builtAt) }).body), /Try it live/);

  const md = toolMarkdown(chartjs, model);
  assert.match(md, /## Try it live\n\n\[Live demo\]\(https:\/\/demo-js-gallery\.example\.test\/chartjs\.html\)/);
  assert.match(md, /- Other libraries: \[Plotly\.js\]\(https:\/\/demo-js-gallery\.example\.test\/plotly\.html\)/);
  assert.doesNotMatch(toolMarkdown(d3, model), /Try it live/);

  const api = apiTool(chartjs, model);
  assert.deepEqual(api.demo, {
    url: 'https://demo-js-gallery.example.test/chartjs.html',
    source: 'https://github.com/hal9ai/awesome-dataviz/blob/main/demos/js-gallery/site/chartjs.html',
    views: ['scatter', 'line', 'map'],
    note: 'Core Chart.js has no maps; the map uses the chartjs-chart-geo plugin.',
    others: [plotly.slug],
  });
  assert.equal(apiTool(d3, model).demo, null);
});
