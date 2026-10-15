// Rebuilds gapminder.csv and world.geojson from pinned upstream commits.
// The outputs are committed, so the demos never fetch anything at runtime;
// run this only to change the data.
//
//   node demos/data/prepare.mjs

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const GAPMINDER = 'https://raw.githubusercontent.com/jennybc/gapminder/391b5a40d3574c3b89d889dd7d72f7f3fdb4a70c/inst/extdata';
const NATURAL_EARTH = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_110m_admin_0_countries.geojson';

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}
const tsv = (text) => {
  const [head, ...rows] = text.trim().split('\n').map((l) => l.split('\t'));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
};

const rows = tsv(await get(`${GAPMINDER}/gapminder.tsv`));
const iso = new Map(tsv(await get(`${GAPMINDER}/country-codes.tsv`)).map((r) => [r.country, r.iso_alpha]));
const missing = [...new Set(rows.map((r) => r.country))].filter((c) => !iso.has(c));
if (missing.length) throw new Error(`No ISO code for: ${missing.join(', ')}`);

// RFC 4180: quote fields that contain a comma or a quote ("Korea, Rep.").
const field = (v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const columns = ['country', 'continent', 'year', 'lifeExp', 'pop', 'gdpPercap', 'iso_alpha'];
const csv = [columns.join(','), ...rows.map((r) => columns.map((c) => field(c === 'iso_alpha' ? iso.get(r.country) : r[c])).join(','))].join('\n') + '\n';
writeFileSync(join(OUT, 'gapminder.csv'), csv);

// Natural Earth 1:110m countries, reduced to an ISO code and a name, with
// coordinates rounded to 0.01 degrees (~1 km, far below the 1:110m detail).
// ISO_A3 is "-99" for a few countries (France, Norway); ISO_A3_EH fills those.
const world = JSON.parse(await get(NATURAL_EARTH));
const round = (c) => (typeof c[0] === 'number' ? [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100] : c.map(round));
const features = world.features
  .filter((f) => f.properties.ADMIN !== 'Antarctica')
  .map((f) => {
    const p = f.properties;
    const code = [p.ISO_A3, p.ISO_A3_EH, p.ADM0_A3].find((c) => c && c !== '-99');
    return { type: 'Feature', properties: { iso_alpha: code, name: p.NAME }, geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) } };
  });
writeFileSync(join(OUT, 'world.geojson'), JSON.stringify({ type: 'FeatureCollection', features }) + '\n');

const countries = new Set(rows.map((r) => iso.get(r.country)));
const mapped = features.filter((f) => countries.has(f.properties.iso_alpha)).length;
console.log(`gapminder.csv: ${rows.length} rows, ${countries.size} countries; world.geojson: ${features.length} shapes, ${mapped} with data.`);
console.log(`Not on the 1:110m map: ${[...countries].filter((c) => !features.some((f) => f.properties.iso_alpha === c)).join(', ')}`);
