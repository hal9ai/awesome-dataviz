// Build-time SVG charts. Specs follow the site's dataviz rules: thin marks
// with 4px rounded data-ends square at the baseline, 2px surface gaps and
// rings, hairline solid grids, one hue per single-series chart, text in ink
// tokens (never the series color), a hover/focus layer for every mark and a
// table twin for every chart. Colors are CSS variables so light and dark
// themes each use their own validated steps.

import { html, raw } from './html.mjs';
import { escapeHtml } from '../markdown.mjs';
import { formatCompact, formatNumber } from '../util.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Nice" axis ticks: 0..max in 1/2/5 x 10^n steps.
export function niceTicks(max, count = 4) {
  if (!max || max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks = [];
  for (let v = 0; v <= max + step * 0.0001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  if (ticks.at(-1) < max) ticks.push(ticks.at(-1) + step);
  return ticks;
}

// Path for a bar whose data-end is rounded (radius r) and whose baseline end
// is square. `dir` is the direction the bar grows: 'up' or 'right'.
function barPath(x, y, w, h, dir) {
  if (w <= 0 || h <= 0) return '';
  if (dir === 'up') {
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  const r = Math.min(4, h / 2, w);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}

const f = (n) => Math.round(n * 10) / 10;

// Tooltip payload: rows of [label, value]; the first row is the title.
const tip = (title, rows) => escapeHtml(JSON.stringify([title, ...rows]));

// Label every month when there's room, else every 2nd or 3rd.
const labelStep = (slot) => (slot >= 40 ? 1 : slot >= 26 ? 2 : 3);
// A thinned-out label carries the year when the year changed since the previous label.
const yearChanged = (months, i, step) => i >= step && months[i][0].slice(0, 4) !== months[i - step][0].slice(0, 4);

function monthLabel(ym, withYear) {
  const [y, m] = ym.split('-').map(Number);
  return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
}

// Column chart of monthly commits (single series: one hue, no legend).
export function monthlyColumns(months, { width = 640, height = 200, label = 'Commits per month' } = {}) {
  const padL = 36, padR = 8, padT = 12, padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const max = Math.max(...months.map(([, v]) => v), 0);
  const ticks = niceTicks(max, 3);
  const top = ticks.at(-1);
  const slot = plotW / months.length;
  const barW = Math.min(24, slot - 2);
  const y = (v) => padT + plotH - (v / top) * plotH;
  const step = labelStep(slot);
  const grid = ticks
    .map((t) => `<line class="grid" x1="${padL}" x2="${width - padR}" y1="${f(y(t))}" y2="${f(y(t))}"/><text class="tick" x="${padL - 6}" y="${f(y(t)) + 4}" text-anchor="end">${formatCompact(t)}</text>`)
    .join('');
  const bars = months
    .map(([ym, v], i) => {
      const x = padL + i * slot + (slot - barW) / 2;
      const h = (v / top) * plotH;
      const xLabel = i % step === 0 ? monthLabel(ym, i === 0 || ym.endsWith('-01') || yearChanged(months, i, step)) : '';
      return `<g class="hit" tabindex="0" role="listitem" aria-label="${monthLabel(ym, true)}: ${formatNumber(v)} commits" data-tip="${tip(monthLabel(ym, true), [['Commits', formatNumber(v)]])}">
<rect class="hit-area" x="${f(padL + i * slot)}" y="${padT}" width="${f(slot)}" height="${plotH}"/>
<path class="mark" d="${barPath(f(x), f(y(v)), f(barW), f(h), 'up')}"/>
<text class="tick" x="${f(padL + i * slot + slot / 2)}" y="${height - 8}" text-anchor="middle">${xLabel}</text></g>`;
    })
    .join('');
  return `<svg class="chart columns" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="list" aria-label="${escapeHtml(label)}">${grid}<line class="baseline" x1="${padL}" x2="${width - padR}" y1="${padT + plotH}" y2="${padT + plotH}"/>${bars}</svg>`;
}

// Horizontal bars with emphasis: the highlighted row wears the accent, the
// rest are context gray; every bar is labeled at its tip (the relief channel
// that makes the low-contrast gray legal).
export function emphasisBars(rows, { width = 560, label = 'GitHub stars', valueFormat = formatCompact, unit = 'stars' } = {}) {
  const labelW = Math.min(170, Math.max(...rows.map((r) => r.label.length)) * 7.2 + 12);
  const valueW = 52;
  const barH = 16, gap = 10, padT = 4;
  const plotW = width - labelW - valueW;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const height = padT * 2 + rows.length * (barH + gap) - gap;
  const items = rows
    .map((r, i) => {
      const y = padT + i * (barH + gap);
      const w = Math.max(2, (r.value / max) * plotW);
      const name = r.label.length > 24 ? `${r.label.slice(0, 23)}…` : r.label;
      const body = `<rect class="hit-area" x="0" y="${y - gap / 2}" width="${width}" height="${barH + gap}"/>
<text class="label${r.highlight ? ' strong' : ''}" x="${labelW - 10}" y="${y + barH / 2 + 4}" text-anchor="end">${escapeHtml(name)}</text>
<path class="mark${r.highlight ? '' : ' context'}" d="${barPath(labelW, y, f(w), barH, 'right')}"/>
<text class="value" x="${f(labelW + w + 6)}" y="${y + barH / 2 + 4}">${valueFormat(r.value)}</text>`;
      const attrs = `class="hit" data-tip="${tip(r.label, [[label, formatNumber(r.value)]])}" aria-label="${escapeHtml(r.label)}: ${formatNumber(r.value)} ${unit}"`;
      return r.href ? `<a href="${r.href}" ${attrs}>${body}</a>` : `<g tabindex="0" ${attrs}>${body}</g>`;
    })
    .join('');
  return `<svg class="chart bars" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${escapeHtml(label)}">${items}</svg>`;
}

// Two-series bar for a comparison small multiple (slot 1 vs slot 2).
export function pairBars(a, b, { width = 300, label, valueFormat = formatCompact }) {
  const barH = 16, gap = 8, valueW = 56;
  const plotW = width - valueW;
  const max = Math.max(a.value ?? 0, b.value ?? 0, 1);
  const rows = [
    { ...a, cls: 's1', y: 0 },
    { ...b, cls: 's2', y: barH + gap },
  ];
  const height = barH * 2 + gap;
  const items = rows
    .map((r) => {
      const v = r.value ?? 0;
      const w = r.value == null ? 0 : Math.max(2, (v / max) * plotW);
      const text = r.value == null ? 'n/a' : valueFormat(v);
      return `<g class="hit" tabindex="0" aria-label="${escapeHtml(r.name)}: ${r.value == null ? 'not available' : formatNumber(v)}" data-tip="${tip(r.name, [[label, r.value == null ? 'n/a' : formatNumber(v)]])}">
<rect class="hit-area" x="0" y="${r.y - gap / 2}" width="${width}" height="${barH + gap}"/>
${w ? `<path class="mark ${r.cls}" d="${barPath(0, r.y, f(w), barH, 'right')}"/>` : ''}
<text class="value" x="${f(w + 6)}" y="${r.y + barH / 2 + 4}">${text}</text></g>`;
    })
    .join('');
  return `<svg class="chart pair" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${escapeHtml(label)}">${items}</svg>`;
}

// Two-series monthly line chart for comparisons: 2px lines, end dots with a
// surface ring, direct end labels plus the legend, and a per-month hover
// column showing both values (the crosshair finds the x).
export function pairLines(a, b, { width = 640, height = 220, label = 'Commits per month' } = {}) {
  const padL = 36, padR = 92, padT = 14, padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const months = a.months.map(([m]) => m);
  const max = Math.max(...a.months.map(([, v]) => v), ...b.months.map(([, v]) => v), 0);
  const ticks = niceTicks(max, 3);
  const top = ticks.at(-1);
  const x = (i) => padL + (months.length === 1 ? plotW / 2 : (i / (months.length - 1)) * plotW);
  const y = (v) => padT + plotH - (v / top) * plotH;
  const grid = ticks
    .map((t) => `<line class="grid" x1="${padL}" x2="${padL + plotW}" y1="${f(y(t))}" y2="${f(y(t))}"/><text class="tick" x="${padL - 6}" y="${f(y(t)) + 4}" text-anchor="end">${formatCompact(t)}</text>`)
    .join('');
  const line = (s, cls) => `<path class="line ${cls}" d="${s.months.map(([, v], i) => `${i ? 'L' : 'M'}${f(x(i))},${f(y(v))}`).join('')}"/>`;
  const last = months.length - 1;
  const ends = [
    { s: a, cls: 's1' },
    { s: b, cls: 's2' },
  ].map(({ s, cls }) => ({ cls, name: s.name, v: s.months[last][1], cy: y(s.months[last][1]) }));
  // Keep end labels apart; if they would collide, the legend carries identity.
  const collide = Math.abs(ends[0].cy - ends[1].cy) < 14;
  const endMarks = ends
    .map((e) => `<circle class="dot ${e.cls}" cx="${f(x(last))}" cy="${f(e.cy)}" r="4"/>${
      collide ? '' : `<text class="value" x="${f(x(last) + 10)}" y="${f(e.cy) + 4}">${escapeHtml(e.name.length > 12 ? `${e.name.slice(0, 11)}…` : e.name)}</text>`
    }`)
    .join('');
  const step = months.length > 1 ? plotW / (months.length - 1) : plotW;
  const every = labelStep(step);
  const series = months.map((m) => [m]);
  const columns = months
    .map((m, i) => {
      const xl = i % every === 0 ? monthLabel(m, i === 0 || m.endsWith('-01') || yearChanged(series, i, every)) : '';
      return `<g class="hit col" tabindex="0" aria-label="${monthLabel(m, true)}: ${escapeHtml(a.name)} ${a.months[i][1]}, ${escapeHtml(b.name)} ${b.months[i][1]} commits" data-tip="${tip(monthLabel(m, true), [[a.name, formatNumber(a.months[i][1]), 's1'], [b.name, formatNumber(b.months[i][1]), 's2']])}">
<rect class="hit-area" x="${f(x(i) - step / 2)}" y="${padT}" width="${f(step)}" height="${plotH}"/>
<line class="crosshair" x1="${f(x(i))}" x2="${f(x(i))}" y1="${padT}" y2="${padT + plotH}"/>
<text class="tick" x="${f(x(i))}" y="${height - 8}" text-anchor="middle">${xl}</text></g>`;
    })
    .join('');
  return `<svg class="chart lines" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${escapeHtml(label)}">${grid}<line class="baseline" x1="${padL}" x2="${padL + plotW}" y1="${padT + plotH}" y2="${padT + plotH}"/>${columns}${line(a, 's1')}${line(b, 's2')}${endMarks}</svg>`;
}

// Tiny 12-bar sparkline for table rows: shape only (the total sits beside
// it), context gray with the most recent month in the accent.
export function sparkColumns(months, { width = 60, height = 18 } = {}) {
  if (!months?.length) return '';
  const max = Math.max(...months.map(([, v]) => v), 1);
  const slot = width / months.length;
  const w = Math.max(1, slot - 1.5);
  const bars = months
    .map(([, v], i) => {
      const h = v ? Math.max(1.5, (v / max) * height) : 0;
      return h ? `<rect class="${i === months.length - 1 ? 'mark' : 'mark context'}" x="${f(i * slot)}" y="${f(height - h)}" width="${f(w)}" height="${f(h)}" rx="${Math.min(1, w / 2)}"/>` : '';
    })
    .join('');
  return `<svg class="spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true"><line class="baseline" x1="0" x2="${width}" y1="${height - 0.5}" y2="${height - 0.5}"/>${bars}</svg>`;
}

// The landscape: one row per category, each tool a dot on a log scale of
// GitHub stars. A single series (one hue, no legend); the top tool in each
// row is direct-labeled. Dots are packed with a deterministic beeswarm.
export function landscape(rows, { width = 1100, labelW = 230, dotR = 5, axisLabel = 'GitHub stars (log scale)', minStars = 10, maxStars, leaders = true } = {}) {
  // Leader labels sit right of each row's rightmost (most-starred) dot, in reserved space.
  const padR = leaders ? 112 : 14, padT = 8, axisH = 34;
  const max = maxStars ?? Math.max(...rows.flatMap((r) => r.tools.map((t) => t.stars)));
  // Domain from minStars (smaller values sit on that edge, labeled "≤") to the next decade.
  const lo = Math.log10(minStars), hi = Math.ceil(Math.log10(Math.max(max, minStars * 10)));
  const plotW = width - labelW - padR;
  const x = (stars) => labelW + ((Math.log10(Math.max(stars, minStars)) - lo) / (hi - lo)) * plotW;
  const D = dotR * 2 + 2; // diameter plus the 2px ring gap

  let yCursor = padT;
  const rendered = rows.map((row) => {
    // Beeswarm: biggest first, each dot takes the closest free offset to the row's axis.
    const placed = [];
    const dots = row.tools
      .filter((t) => t.stars != null)
      .sort((a, b) => b.stars - a.stars)
      .map((t) => {
        const cx = x(t.stars);
        let dy = 0;
        for (let k = 0; k < 40; k++) {
          dy = k === 0 ? 0 : Math.ceil(k / 2) * (k % 2 ? -1 : 1) * (D * 0.55);
          if (!placed.some((p) => (p.cx - cx) ** 2 + (p.dy - dy) ** 2 < D * D)) break;
        }
        const dot = { t, cx, dy };
        placed.push(dot);
        return dot;
      });
    const extent = Math.max(dotR + 2, ...dots.map((d) => Math.abs(d.dy) + dotR + 2));
    const rowH = Math.max(34, extent * 2 + 14);
    const cy = yCursor + rowH / 2;
    yCursor += rowH;
    return { row, dots, cy, rowH, top: cy - rowH / 2 };
  });
  const height = yCursor + axisH;

  const decades = [];
  for (let p = Math.ceil(lo); p <= Math.floor(hi); p++) decades.push(10 ** p);
  const axis = decades
    .map((v) => `<line class="grid" x1="${f(x(v))}" x2="${f(x(v))}" y1="${padT}" y2="${yCursor}"/><text class="tick" x="${f(x(v))}" y="${yCursor + 16}" text-anchor="middle">${v === minStars ? '≤' : ''}${formatCompact(v)}</text>`)
    .join('');

  const body = rendered
    .map(({ row, dots, cy, rowH, top }, i) => {
      const leader = dots[0];
      // Fit "Label 12" into the label column (~6.7px per character at 13px).
      const count = String(row.tools.length);
      const room = Math.floor((labelW - 14) / 6.7) - count.length - 1;
      const labelText = row.label.length > room ? `${row.label.slice(0, Math.max(3, room - 1))}…` : row.label;
      const rowLabel = `<a class="row-label" href="${row.href}"><text x="0" y="${f(cy + 4)}">${escapeHtml(labelText)}<tspan class="muted" dx="6">${count}</tspan></text></a>`;
      const band = i % 2 ? '' : `<rect class="band" x="0" y="${f(top)}" width="${width}" height="${f(rowH)}"/>`;
      const marks = dots
        .map(
          (d) => `<a href="/tools/${d.t.slug}/" tabindex="-1" class="dot-link" data-tip="${tip(d.t.name, [['GitHub stars', formatNumber(d.t.stars)], ['Category', row.label]])}" aria-label="${escapeHtml(d.t.name)}, ${formatNumber(d.t.stars)} stars"><circle class="dot s1" cx="${f(d.cx)}" cy="${f(cy + d.dy)}" r="${dotR}"/></a>`
        )
        .join('');
      const leaderLabel =
        leader && leaders
          ? `<text class="value lead" x="${f(leader.cx + dotR + 6)}" y="${f(cy + leader.dy + 4)}">${escapeHtml(leader.t.name.length > 16 ? `${leader.t.name.slice(0, 15)}…` : leader.t.name)}</text>`
          : '';
      return `${band}${rowLabel}<line class="baseline faint" x1="${labelW}" x2="${labelW + plotW}" y1="${f(cy)}" y2="${f(cy)}"/>${marks}${leaderLabel}`;
    })
    .join('');

  return `<svg class="chart swarm" viewBox="0 0 ${width} ${f(height)}" width="${width}" height="${f(height)}" role="img" aria-label="Every tool in the directory by GitHub stars, grouped by category">${body}${axis}<text class="tick axis-title" x="${labelW + plotW}" y="${f(height - 2)}" text-anchor="end">${escapeHtml(axisLabel)}</text></svg>`;
}

// Accessible table twin for a chart, collapsed by default.
export function tableTwin(caption, headers, rows) {
  return html`<details class="table-twin"><summary>Show data as a table</summary>
<table><caption class="visually-hidden">${caption}</caption><thead><tr>${headers.map((h, i) => html`<th scope="col"${i ? raw(' class="n"') : ''}>${h}</th>`)}</tr></thead>
<tbody>${rows.map((r) => html`<tr>${r.map((c, i) => (i ? html`<td class="n">${c}</td>` : html`<th scope="row">${c}</th>`))}</tr>`)}</tbody></table></details>`;
}

export { monthLabel };
