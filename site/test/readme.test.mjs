import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseReadme, detectRepo, parseRepoUrl } from '../src/readme.mjs';
import { inlineToHtml, inlineToText, readLink } from '../src/markdown.mjs';
import { README } from '../src/data.mjs';
import { categoryMeta } from '../src/content/categories.mjs';
import overrides from '../data/overrides.mjs';

const FIXTURE = `# Awesome Dataviz
## Contents
- [JavaScript tools](#javascript-tools)

## JavaScript tools

### Charting libraries
- [Chart.js](https://www.chartjs.org/) - Charts with the canvas tag.
- [ParaView](https://www.paraview.org) - Analysis app. (C++, [GitHub](https://github.com/Kitware/ParaView))

### d3
- [D3.js](https://github.com/d3/d3) - Data-driven documents.
- See [Awesome D3](https://github.com/wbkd/awesome-d3)

## Python tools
- [plotly](https://github.com/plotly/plotly.py) - Built on [plotly.js](https://github.com/plotly/plotly.js)

# Resources
## Catalogs
- [Data Viz Project](https://datavizproject.com)
- Wikipedia
  - [Types of plots](https://en.wikipedia.org/wiki/Plot_(graphics)#Types_of_plots)

# Contributing
- [Not a tool](https://example.com) - Ignored.
`;

test('parses sections, entries and notes', () => {
  const { sections } = parseReadme(FIXTURE);
  assert.deepEqual(
    sections.map((s) => [s.kind, s.parent, s.title, s.entries.length]),
    [
      ['tools', 'JavaScript tools', 'Charting libraries', 2],
      ['tools', 'JavaScript tools', 'd3', 1],
      ['tools', null, 'Python tools', 1],
      ['resources', null, 'Catalogs', 2],
    ]
  );
  const d3 = sections[1];
  assert.equal(d3.notes.length, 1);
  assert.match(d3.notes[0].markdown, /Awesome D3/);
  const chart = sections[0].entries[0];
  assert.equal(chart.name, 'Chart.js');
  assert.equal(chart.description, 'Charts with the canvas tag.');
});

test('keeps nested resource groups and URLs with parentheses', () => {
  const catalogs = parseReadme(FIXTURE).sections.at(-1);
  const nested = catalogs.entries[1];
  assert.equal(nested.group, 'Wikipedia');
  assert.equal(nested.url, 'https://en.wikipedia.org/wiki/Plot_(graphics)#Types_of_plots');
});

test('detects repositories from links and inline GitHub links', () => {
  const [charting, , python] = parseReadme(FIXTURE).sections;
  assert.equal(detectRepo(charting.entries[0]), null);
  assert.deepEqual(detectRepo(charting.entries[1]), { host: 'github', owner: 'Kitware', name: 'ParaView' });
  assert.deepEqual(detectRepo(python.entries[0]), { host: 'github', owner: 'plotly', name: 'plotly.py' });
  assert.deepEqual(parseRepoUrl('https://github.com/mui/mui-x/tree/master/packages/x-charts'), { host: 'github', owner: 'mui', name: 'mui-x' });
  assert.deepEqual(parseRepoUrl('https://gitlab.com/graphviz/graphviz'), { host: 'gitlab', owner: 'graphviz', name: 'graphviz' });
  assert.equal(parseRepoUrl('https://github.com/topics/charts'), null);
});

test('inline Markdown is escaped and links are kept', () => {
  assert.equal(inlineToText('Built on [plotly.js](https://x.y) **fast**'), 'Built on plotly.js fast');
  assert.equal(
    inlineToHtml('A <script>alert(1)</script> [link](https://a.b/"x)'),
    'A &lt;script&gt;alert(1)&lt;/script&gt; <a href="https://a.b/&quot;x" rel="noopener">link</a>'
  );
  assert.deepEqual(readLink('[a (b)](https://w/x_(y))', 0), { text: 'a (b)', url: 'https://w/x_(y)', end: 24 });
});

// Guards for contributions: these run on every pull request.
test('README entries are well formed', () => {
  const { sections } = parseReadme(readFileSync(README, 'utf8'));
  const tools = sections.filter((s) => s.kind === 'tools');
  assert.ok(tools.length >= 15, 'expected the tool sections to parse');
  const seen = new Map();
  for (const section of tools) {
    for (const e of section.entries) {
      const where = `${section.title}: "${e.raw}" (README line ${e.line})`;
      assert.match(e.url, /^https?:\/\//, `link must be absolute: ${where}`);
      assert.ok(e.description.length >= 8, `missing description, use "- [Name](url) - Description.": ${where}`);
      const key = e.url.replace(/\/+$/, '').toLowerCase();
      if (seen.has(key) && seen.get(key).section !== section.title) continue; // the same tool may sit in two sections
      assert.ok(!seen.has(key), `duplicate entry: ${where} (also on line ${seen.get(key)?.line})`);
      seen.set(key, { line: e.line, section: section.title });
    }
  }
});

test('every README section has editorial metadata', () => {
  const { sections } = parseReadme(readFileSync(README, 'utf8'));
  for (const s of sections.filter((s) => s.kind === 'tools')) {
    const meta = categoryMeta(s);
    if (meta.missingMeta) console.warn(`  note: add metadata for "${s.title}" in src/content/categories.mjs`);
    assert.ok(meta.slug && meta.title);
  }
});

test('overrides point at README entries that exist', () => {
  const readme = readFileSync(README, 'utf8');
  for (const key of Object.keys(overrides)) {
    if (/^https?:/.test(key)) assert.ok(readme.includes(`](${key})`), `override key not found in README: ${key}`);
  }
});
