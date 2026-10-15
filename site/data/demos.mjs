// Live demos (../demos/ in this repository): the same Gapminder dataset in
// the same three views, one small app per library, hosted on Cloudish. Each
// folder under demos/ with a demo.json is one demo (see demos/manifest.mjs
// for its fields), so a merged demo shows up here with no change to the site.
// Keys are the exact URL an entry links to in the README, as in overrides.mjs.
//
// The tool page, its Markdown twin, the /demos/ page and the JSON API read
// these through demoFor(), which resolves the URL.

import { loadDemos, screenshotKey, VIEWS } from '../../demos/manifest.mjs';

// demos/deploy.mjs gives each demo the subdomain label awesomedataviz-<folder>
// on the Cloudish account that serves them. {demo} is the folder name.
export const DEMO_URL_TEMPLATE = process.env.DEMOS_URL_TEMPLATE || 'https://awesomedataviz-{demo}.on.do.cloudish.ai/';

export { VIEWS };

const DEMOS = Object.fromEntries(
  loadDemos().flatMap((d) => d.libraries.map(({ tool, ...lib }) => [tool, { demo: d.name, runs: d.runs, views: d.views, ...lib }]))
);

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
    key: screenshotKey(d.demo, d.page),
    url: demoUrl(d.demo, d.page, template),
    sourceUrl: `${repo}/${/\.[a-z]+$/.test(d.source) ? 'blob' : 'tree'}/main/${d.source}`,
    views: d.views.filter((v) => VIEWS[v]),
  };
}
