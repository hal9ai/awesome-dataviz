# Live demos: the same Gapminder charts in Streamlit, Shiny, matplotlib, ECharts, Chart.js and Plotly.js

## What this adds

- `demos/`: four small Docker apps that draw the same dataset (Gapminder,
  142 countries, 1952–2007) in the same three views: GDP vs life expectancy
  by year, one country over time, and a world map.
  - `streamlit/`: Streamlit + Altair
  - `shiny-r/`: Shiny for R + ggplot2, with hover and an animated year slider
  - `matplotlib/`: Flask redraws an SVG with matplotlib on every input change
  - `js-gallery/`: one static page each for ECharts, Chart.js (map through the
    chartjs-chart-geo plugin) and Plotly.js, served by nginx
- `demos/data/`: the gapminder package excerpt (CC0; Gapminder's data is CC BY
  4.0, credited in every demo) and Natural Earth 1:110m countries (public domain).
- `demos/deploy.mjs`: deploys one or all demos to Cloudish (one project each),
  or builds and runs one locally with `--local`.
- The site: a "Try it live" section on the six tool pages that have a demo,
  with a button to the demo, its source on GitHub and links to the other
  libraries' demos. It is also in the tool's Markdown twin and in
  `/api/tools/{slug}.json` as `demo`. Configured in `site/data/demos.mjs`,
  keyed by README URL like `overrides.mjs`. Tests in `site/test/demos.test.mjs`.

## Why

- **A uniform comparison.** JS libraries have good official demos, but each
  uses its own data and chart types. Here the data, views, colors and scales are
  the same, so the differences you see are the library's.
- **Live server-side demos.** Python and R libraries mostly show static image
  galleries. A running Streamlit, Shiny or matplotlib app that you can change
  shows what they do, including the server round trip.
- **A showcase for Cloudish**, which already hosts awesomedataviz.com: any
  Dockerfile, an HTTPS URL, and apps that sleep when idle so a demo nobody uses
  costs nothing.

Each demo is short and pinned, so it also works as a reference for the library.

## Verified

All four images build and run with Docker; each was checked with curl, with
headless Chromium screenshots of every view, and with scripted interactions
(select a country, change the metric, play, hover in Shiny) without console
errors or requests to other hosts. `npm test` passes and a tool page renders
the section. Nothing is deployed: the site links use a placeholder URL
template (`DEMOS_URL_TEMPLATE`).

## To decide

1. **Which Cloudish key pays for the demos.** The idle timeout is per key, and
   the site's key is always-on, so the demos should get their own key with an
   idle timeout (for example 900 s). `deploy.mjs` refuses an always-on key unless
   told otherwise. Sleeping demos cost nothing; a wake costs under a cent; all
   four always on would be about $59/month. See `demos/README.md`.
2. **Deploy and wire the URLs**: run `demos/deploy.mjs all` once with that key,
   then set the printed URLs (or `DEMOS_URL_TEMPLATE`) for the site build.
   Until then, this should not merge with the placeholder links live.
3. **Whether to add more**, and which: candidates are Bokeh, Dash, Shiny for
   Python, Vega-Lite, D3, Observable Plot, Highcharts. Each is one folder plus
   one line in `site/data/demos.mjs`.
4. **Cold starts**: the R image is about 1 GB and wakes slowest. If that is too
   slow for visitors, Shiny could run on a longer idle timeout than the rest
   (a separate key), or stay always-on (about $22/month).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
