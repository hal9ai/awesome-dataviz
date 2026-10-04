import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, search, tokenize } from '../server/search.mjs';

const records = [
  { slug: 'recharts', name: 'Recharts', description: 'Redefined chart library built with React and D3.', category: 'React', categorySlug: 'react', categories: ['React chart & visualization libraries'], language: 'TypeScript', stars: 27000, status: 'active', aliases: [], topics: [], githubTopics: ['react', 'charts'] },
  { slug: 'old-react-chart', name: 'Old React Chart', description: 'React chart components.', category: 'React', categorySlug: 'react', categories: ['React chart & visualization libraries'], language: 'JavaScript', stars: 900, status: 'archived', aliases: [], topics: [], githubTopics: [] },
  { slug: 'leaflet', name: 'Leaflet', description: 'JavaScript library for mobile-friendly interactive maps.', category: 'JS maps', categorySlug: 'javascript-maps', categories: ['JavaScript map & geospatial visualization libraries'], language: 'JavaScript', stars: 45000, status: 'active', aliases: ['leafletjs'], topics: ['Maps & geospatial visualization'], githubTopics: ['maps'] },
  { slug: 'chart-js', name: 'Chart.js', description: 'Charts with the canvas tag.', category: 'JS charting', categorySlug: 'javascript-charting-libraries', categories: ['JavaScript charting libraries'], language: 'JavaScript', stars: 67000, status: 'active', aliases: ['chartjs'], topics: [], githubTopics: ['chart'] },
  { slug: 'csvtodashboard', name: 'csvtodashboard', description: 'Auto-built dashboard in the browser - client-side, no upload.', category: 'Apps', categorySlug: 'apps', categories: ['Apps'], language: null, stars: null, status: null, aliases: [], topics: [], githubTopics: [] },
];
const index = buildIndex(records);
const names = (q, opts) => search(index, q, opts).map((r) => r.record.slug);

test('tokenizes C++, C# and .NET', () => {
  assert.deepEqual(tokenize('C++ and C# on .NET'), ['cpp', 'and', 'csharp', 'on', 'dotnet']);
});

test('navigational queries put the exact tool first', () => {
  assert.equal(names('chart.js')[0], 'chart-js');
  assert.equal(names('chartjs')[0], 'chart-js');
  assert.equal(names('leaf')[0], 'leaflet');
});

test('descriptive queries prefer popular, maintained tools', () => {
  const r = names('react charts');
  assert.ok(r.indexOf('recharts') < r.indexOf('old-react-chart'), r.join());
});

test('synonyms match whole words only', () => {
  // "terminal" expands to "cli", which must not prefix-match "client-side".
  assert.ok(!names('terminal').includes('csvtodashboard'));
  assert.equal(names('map')[0], 'leaflet');
});

test('filters narrow results', () => {
  assert.deepEqual(names('', { category: 'javascript-maps' }), ['leaflet']);
  assert.deepEqual(names('chart', { status: 'archived' }), ['old-react-chart']);
});
