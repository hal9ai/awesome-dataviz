// Live demos (../demos/ in this repository): the same Gapminder dataset in
// the same three views, one small app per library, hosted on Cloudish. Keys
// are the exact URL an entry links to in the README, as in overrides.mjs.
//
//   demo    folder under demos/ (one Cloudish project per folder)
//   page    path within the demo, when one app serves several libraries
//   source  file or folder to link as "the demo's source", relative to the repo
//   views   which of VIEWS the demo has
//   note    one short caveat, shown next to the views
//   runs    'browser' or 'server'; the links to the other demos list browser ones first
//   label   the name to show for the demo when the tool's name is too short
//
// The tool page, its Markdown twin and the JSON API read these through
// demoFor(), which resolves the URL.

// PLACEHOLDER: nothing is deployed yet. demos/deploy.mjs prints the real
// URLs; set DEMOS_URL_TEMPLATE for the build (or change this constant) once
// they exist. {demo} is replaced by the folder name.
export const DEMO_URL_TEMPLATE = process.env.DEMOS_URL_TEMPLATE || 'https://awesomedataviz-{demo}.on.do.cloudish.ai/';

export const VIEWS = {
  scatter: 'GDP per capita vs life expectancy by year',
  line: 'life expectancy over time for one country',
  map: 'a world map of one metric for one year',
};
const ALL = Object.keys(VIEWS);

const DEMOS = {
  'https://github.com/streamlit/streamlit': { demo: 'streamlit', runs: 'server', source: 'demos/streamlit', views: ALL, note: 'Charts drawn with Altair, which Streamlit ships with.' },
  'https://shiny.rstudio.com': { demo: 'shiny-r', runs: 'server', label: 'Shiny for R', source: 'demos/shiny-r', views: ALL, note: 'Charts drawn with ggplot2 and rendered in R on the server.' },
  'https://matplotlib.org/': { demo: 'matplotlib', runs: 'server', source: 'demos/matplotlib', views: ALL, note: 'A Flask server redraws each chart as SVG when an input changes.' },
  'https://github.com/apache/echarts': { demo: 'js-gallery', runs: 'browser', page: 'echarts.html', source: 'demos/js-gallery/site/echarts.html', views: ALL },
  'https://www.chartjs.org/': { demo: 'js-gallery', runs: 'browser', page: 'chartjs.html', source: 'demos/js-gallery/site/chartjs.html', views: ALL, note: 'Core Chart.js has no maps; the map uses the chartjs-chart-geo plugin.' },
  'https://github.com/plotly/plotly.js/': { demo: 'js-gallery', runs: 'browser', page: 'plotly.html', source: 'demos/js-gallery/site/plotly.html', views: ALL },
};

export default DEMOS;

export function demoUrl(demo, page = '', template = DEMO_URL_TEMPLATE) {
  return template.replace('{demo}', demo).replace(/\/?$/, '/') + page;
}

// The resolved demo for a README entry URL, or null.
export function demoFor(entryUrl, { demos = DEMOS, template = DEMO_URL_TEMPLATE, repo = 'https://github.com/hal9ai/awesome-dataviz' } = {}) {
  const d = demos[entryUrl];
  if (!d) return null;
  return {
    ...d,
    url: demoUrl(d.demo, d.page, template),
    sourceUrl: `${repo}/${/\.[a-z]+$/.test(d.source) ? 'blob' : 'tree'}/main/${d.source}`,
    views: d.views.filter((v) => VIEWS[v]),
  };
}
