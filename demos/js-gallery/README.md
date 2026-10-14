# JavaScript gallery

One static page per library, each with the shared Gapminder views, served by nginx.
Everything is drawn in the browser; `common.js` loads the CSV and GeoJSON
and wires the form controls, so each page's script is only charting code.

| Page | Scatter by year | One country | World map |
|---|---|---|---|
| `echarts.html`, [Apache ECharts](https://echarts.apache.org) 6.1.0 | `timeline` component with its own play button | `line` series | `registerMap` + `map` series, matched on `nameProperty: 'iso_alpha'`; `visualMap` has no log scale, so GDP and population are colored by log10 |
| `chartjs.html`, [Chart.js](https://www.chartjs.org) 4.5.1 | `bubble` chart; no built-in timeline, so a range input and a play button step it | `line` chart | **Not in core Chart.js.** Drawn with the [chartjs-chart-geo](https://github.com/sgratzl/chartjs-chart-geo) 4.3.6 plugin (`choropleth`, `colorLogarithmic` scale) |
| `plotly.html`, [Plotly.js](https://plotly.com/javascript/) 4.1.2 (`plotly.js-dist-min`) | animation `frames` with a `sliders` + `updatemenus` play button | `scatter` lines | `choropleth` with `geojson` + `featureidkey`; a gray trace underneath shows countries without data |

Versions are pinned in `package.json`/`package-lock.json`; the Dockerfile
installs them in a build stage and copies only the browser bundles into the
nginx image. Plotly's geo subplots always load a base-map topology even when it
is hidden, so the Dockerfile also downloads Plotly's `world_110m.json`
(checked against a SHA-256) and the page points `topojsonURL` at it; nothing
is loaded from a CDN at runtime.

`nginx.conf.template` is run through envsubst by the nginx image at startup,
which is how it listens on `$PORT`.

```sh
node demos/deploy.mjs --local js-gallery   # docker build + run on http://localhost:8080
```

Image: about 70 MB. Memory: about 13 MB. Wakes fastest of the four.
