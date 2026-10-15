# Live demos

Small apps that draw the same dataset in the same three views with different
libraries, so readers of [awesomedataviz.com](https://awesomedataviz.com) can
compare them side by side, and try the server-side libraries (Python, R) live
instead of through a static image gallery. Each one is meant to be read as a
reference: short, idiomatic for its library, versions pinned.

The dataset is the Gapminder excerpt (142 countries, 1952–2007); see
[`data/README.md`](data/README.md) for its source, license and attribution.

| Demo | Library | Runs on | Scatter by year | One country | World map |
|---|---|---|---|---|---|
| [`streamlit/`](streamlit/) | Streamlit + Altair | server (Python) | slider | select | yes |
| [`shiny-r/`](shiny-r/) | Shiny for R + ggplot2 | server (R) | animated slider, hover | select | yes |
| [`matplotlib/`](matplotlib/) | matplotlib in Flask | server (Python), SVG per request | slider + play | select | yes |
| [`js-gallery/`](js-gallery/) | Apache ECharts, Chart.js, Plotly.js | browser; nginx serves files | timeline / slider + play / frames | select | yes; Chart.js only through the chartjs-chart-geo plugin |

All four use the same continent colors and the same blue ramp for the map,
with one color scale across all years so years compare.

## Run one locally

Each demo is a Docker image that listens on `$PORT` (default 8080) on 0.0.0.0.
Its build context is the demo's folder plus `data/`, which `deploy.mjs`
assembles:

```sh
node demos/deploy.mjs --local streamlit   # build and run on http://localhost:8080
PORT=9000 node demos/deploy.mjs --local shiny-r
node demos/deploy.mjs --dry-run all       # just build the contexts and list them
```

Each demo's README also says how to run it without Docker.

## Deploy to Cloudish

```sh
CLOUDISH_API_KEY=... node demos/deploy.mjs all
CLOUDISH_API_KEY=... node demos/deploy.mjs matplotlib
```

One Cloudish project per demo, named `awesomedataviz-<demo>`
(`DEMOS_PREFIX` changes the prefix). The script uploads the context, waits for
the server-side image build, asks for the subdomain label
`awesomedataviz-<demo>` (keeping the random URL if the label is taken), waits
until the app answers and prints the URLs to put in `site/data/demos.mjs`
(or set `DEMOS_URL_TEMPLATE` for the site build, see below).

Nothing deploys these automatically yet; there is no workflow for them.

### Which key

Cloudish's idle timeout is a setting of the API key, not of the project. The
site's deploy (`site/scripts/deploy.mjs`) sets its key to always-on so
awesomedataviz.com never cold-starts; demos on that key would also run around
the clock. So `deploy.mjs` refuses to deploy with an always-on key unless
`DEMOS_ALLOW_ALWAYS_ON=1` is set. The intended setup is a separate key for the
demos, with `DEMOS_IDLE_TIMEOUT=900` (or 300) on the first deploy to set it.

### Cost

From [cloudish.ai/instances.md](https://cloudish.ai/instances.md) (one credit
is one US dollar), billed per second only while a container runs:

| Demo | Size | Per running hour | Always on, per month |
|---|---|---|---|
| js-gallery, matplotlib | `shared` (0.1 CPU / 0.2 GB, bursts to 1 / 1) | $0.0107 | $7.84 |
| streamlit, shiny-r | `small` (0.5 CPU / 1 GB) | $0.0297 | $21.66 |

- With an idle timeout the demos cost nothing while nobody uses them. A visit
  keeps the app up for the idle timeout after the last request: with 900 s,
  each wake costs at least about $0.003 (`shared`) or $0.007 (`small`).
- All four always on would be about $59 a month. Don't.
- Image builds are billed while they run at the build size: 2 CPU / 4 GB is
  about $0.10 an hour, so a 2–4 minute build is well under a cent. Every
  `deploy.mjs` run rebuilds.
- No custom domains are used, so no domain fees.

### Cold starts

A sleeping demo starts on the first request, and the visitor waits. Locally,
with the image already on the machine, each demo answers 0.3–1.4 s after
`docker run` (measured). On Cloudish, waking also means scheduling the
container and, on a node that doesn't have the image yet, pulling it, which
grows with image size (not measured on Cloudish yet):

| Demo | Image | Expect |
|---|---|---|
| js-gallery | ~70 MB | fastest |
| matplotlib | ~290 MB | fast; the first render of each view takes 0.1–0.2 s |
| streamlit | ~550 MB | slower; the page also opens a websocket after loading |
| shiny-r | ~1 GB (R itself) | slowest |

The site's "Try it live" section says a demo may take a few seconds to wake.
`shared` apps also start slower when their machine is busy, which is why the
two session-based servers use `small`.

## Add a demo

1. A folder with a `Dockerfile` that listens on `$PORT`, the three views, the
   data attribution footer and a short README.
2. An entry in `DEMOS` in `deploy.mjs` (sizes and a health path).
3. An entry in `site/data/demos.mjs`, keyed by the tool's URL in the README.
