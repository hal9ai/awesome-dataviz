// Shared by the three library pages: loads the dataset and fills the
// controls, so each page's script is only the charting code.

// The same continent colors in every demo of this gallery.
export const CONTINENT_COLORS = { Africa: '#eda100', Americas: '#e34948', Asia: '#2a78d6', Europe: '#1baf7a', Oceania: '#008300' };
export const CONTINENTS = Object.keys(CONTINENT_COLORS);
export const METRICS = {
  lifeExp: 'Life expectancy (years)',
  gdpPercap: 'GDP per capita (US$, inflation-adjusted)',
  pop: 'Population',
};
export const BLUES = ['#cde2fb', '#6da7ec', '#256abf', '#0d366b'];
export const NO_DATA = '#e4e3df';
// Log scales for the skewed metrics; one domain for all years, so years compare.
export const LOG_METRICS = new Set(['gdpPercap', 'pop']);

// A minimal CSV parser: enough for quoted fields such as "Korea, Rep.".
function parseCsv(text) {
  const rows = text.trim().split('\n').map((line) => [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"')));
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

export async function loadData() {
  const [csv, world] = await Promise.all([fetch('data/gapminder.csv').then((r) => r.text()), fetch('data/world.geojson').then((r) => r.json())]);
  const rows = parseCsv(csv).map((r) => ({ ...r, year: +r.year, lifeExp: +r.lifeExp, pop: +r.pop, gdpPercap: +r.gdpPercap }));
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const countries = [...new Set(rows.map((r) => r.country))].sort();
  const extent = (key) => [Math.min(...rows.map((r) => r[key])), Math.max(...rows.map((r) => r[key]))];
  return { rows, years, countries, world, extent };
}

// Fills <select name=country> and <select name=metric>, sets the year ranges,
// and calls onChange(form) whenever a control in that form changes.
export function wireControls(data, handlers) {
  for (const form of document.querySelectorAll('form[data-view]')) {
    const country = form.elements.country;
    if (country) {
      for (const c of data.countries) country.add(new Option(c, c, false, c === 'Japan'));
    }
    const metric = form.elements.metric;
    if (metric) for (const [k, v] of Object.entries(METRICS)) metric.add(new Option(v, k));
    for (const range of form.querySelectorAll('input[type=range]')) {
      Object.assign(range, { min: data.years[0], max: data.years.at(-1), step: 5 });
      range.value = range.dataset.start === 'last' ? data.years.at(-1) : data.years[0];
    }
    const update = () => {
      for (const range of form.querySelectorAll('input[type=range]')) range.nextElementSibling.value = range.value;
      handlers[form.dataset.view](Object.fromEntries(new FormData(form)));
    };
    form.addEventListener('input', update);
    form.addEventListener('submit', (e) => e.preventDefault());
    const play = form.querySelector('[data-play]');
    if (play) {
      let timer = null;
      play.addEventListener('click', () => {
        if (timer) return (clearInterval(timer), (timer = null), (play.textContent = 'Play'));
        play.textContent = 'Pause';
        const range = form.querySelector('input[type=range]');
        timer = setInterval(() => {
          range.value = +range.value >= +range.max ? range.min : +range.value + 5;
          update();
        }, 900);
      });
    }
    update();
  }
}

export const formatDollars = (v) => `$${Math.round(v).toLocaleString('en-US')}`;
export const formatCompact = (v) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
export const formatMetric = (metric, v) => (v == null || Number.isNaN(v) ? 'no data' : metric === 'gdpPercap' ? formatDollars(v) : metric === 'pop' ? formatCompact(v) : v.toFixed(1));

// A color on the BLUES ramp for t in [0, 1], interpolated in RGB.
export function blueAt(t) {
  const stops = BLUES.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(Math.floor(x), stops.length - 2);
  return `rgb(${stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * (x - i))).join(',')})`;
}
