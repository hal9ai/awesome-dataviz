# Live demos

Small apps that draw the same dataset in the same three views with different
libraries, so readers of [awesomedataviz.com](https://awesomedataviz.com/demos/) can
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

One Cloudish project per demo, named `<prefix>-<demo>`. The script uploads
the context, waits for the server-side image build, asks for the subdomain
label `<prefix>-<demo>` (keeping the random URL if the label is taken), waits
until the app answers and prints the URLs.

The prefix defaults to `<your key's alias>-demo`, so a test deploy never takes
the labels the site links to. Only the account that serves the demos for
awesomedataviz.com (key alias `awesome-dataviz-demos`) uses
`DEMOS_PREFIX=awesomedataviz` and `DEMOS_LABEL_PREFIX=awesomedataviz-demo`,
which gives the `https://awesomedataviz-demo-<demo>.on.do.cloudish.ai/` URLs
in `site/data/demos.mjs` (`DEMOS_URL_TEMPLATE` overrides them for a site
build). With `DEMOS_REQUIRE_LABEL=1`, as in CI, a taken label fails the deploy
instead of leaving the site linking to the wrong place.

[`.github/workflows/demos.yaml`](../.github/workflows/demos.yaml) does this
on every merge to `main` that changes a demo (all of them when `data/`
or the scripts here change), with the `CLOUDISH_DEMOS_API_KEY` repository secret, then rebuilds
the site, which takes fresh screenshots (`site/scripts/screenshots.mjs`). It
can also be run by hand from the Actions tab for any list of demos.

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

Any library listed in the [README](../README.md) can have a demo. It is one
folder here; when its pull request is merged, CI deploys it, screenshots it
and shows it on [awesomedataviz.com/demos](https://awesomedataviz.com/demos/)
and on the library's page. Nothing outside the folder needs to change.

With a coding agent (Claude Code, Codex, Cursor...), this is enough:

> Add a live demo of LIBRARY to Awesome Dataviz: follow
> https://github.com/hal9ai/awesome-dataviz/blob/main/demos/README.md to build
> the Gapminder demo in a new demos/ folder, deploy it to cloudish.ai to test
> it, and open a pull request to hal9ai/awesome-dataviz with the live URL.

### 1. The app

Make `demos/<folder>/`, where `<folder>` is lowercase letters, digits and
dashes (it becomes the demo's URL, `awesomedataviz-demo-<folder>`), usually the
library's name. Start from the closest demo: [`matplotlib/`](matplotlib/) for
a server-side library, a page of [`js-gallery/`](js-gallery/) for a
JavaScript one (a new JavaScript library gets its own folder, not a page in
`js-gallery/`).

- **Data**: read `data/gapminder.csv` and `data/world.geojson`; the build
  context puts them at `data/` next to your files (see
  [`data/README.md`](data/README.md) for the columns). Don't fetch data.
- **The three views**, in this order:
  1. GDP per capita (log x) vs life expectancy, bubble area = population,
     colored by continent, with a year control (a play button if the library
     has one).
  2. Life expectancy over time for one country, chosen from a list (Japan
     first).
  3. A world map of one metric (life expectancy, GDP per capita or
     population) for one year, joined on `iso_alpha`.
- **Colors and scales** like the others, so the differences are the
  library's: continents Africa `#eda100`, Americas `#e34948`, Asia `#2a78d6`,
  Europe `#1baf7a`, Oceania `#008300`; the map ramps through `#cde2fb`,
  `#6da7ec`, `#256abf`, `#0d366b`, with `#e4e3df` for no data, log scales for
  GDP and population and one domain for all years.
- **Idiomatic and short**: the code is a reference for the library, so use
  its own components (its slider, its tooltips) over custom code, and say in
  the README where it needed a plugin or a workaround.
- **Pinned and self-contained**: exact versions, nothing loaded from a CDN or
  any other site at runtime.
- **The attribution footer** from [`data/README.md`](data/README.md).
- **A `Dockerfile`** that serves the app on `0.0.0.0:$PORT` (8080 by default)
  and an endpoint that answers 200 once it's up.
- **A short `README.md`**: what draws each view, the pinned versions, how to
  run it.

### 2. `demo.json`

```json
{
  "runs": "server",
  "health": "/healthz",
  "libraries": [
    { "tool": "https://github.com/owner/library", "note": "One short caveat, if any." }
  ]
}
```

| Field | |
|---|---|
| `runs` | `"browser"` when the library draws in the browser, `"server"` when the server renders |
| `health` | path that answers 200 once the app is up (default `/`) |
| `size` | Cloudish sizes, default `{ "cpuCores": "0.1", "memoryGb": "0.2", "buildCpuCores": "1", "buildMemoryGb": "2" }`; apps with a session per visitor (Streamlit, Shiny) need `"cpuCores": "0.5", "memoryGb": "1"` |
| `views` | the views it has, default all of `scatter`, `line`, `map` |
| `libraries[].tool` | **the exact URL the library's README entry links to**; the library must be listed first |
| `libraries[].label` | a longer name to show, like "Shiny for R" |
| `libraries[].page` | path within the app, when one app serves several libraries |
| `libraries[].source` | file or folder to link as the source, relative to the folder (default the folder) |
| `libraries[].note` | one short caveat, shown on the site |
| `libraries[].ready` | CSS selector that appears once the charts are drawn, so the screenshot waits for it |

`cd site && npm test` checks every `demo.json`.

### 3. Try it

- With Docker: `node demos/deploy.mjs --check <folder>` builds the image,
  runs it, waits for `health` and saves a screenshot of each page to
  `demos/.screenshots/`, the way the site will. `--local` runs it on
  http://localhost:8080 to click around.
- Without Docker, or to share a link: deploy it to your own Cloudish key.
  Cloudish builds the image on its servers and needs no sign-up; a new key
  comes with a little credit, enough for a test:

  ```sh
  curl -s -X POST https://cloudish.ai/api/v1/keys -H 'content-type: application/json' -d '{"agent":"claude-code"}'
  # -> { "key": "cld_...", ... }: keep it out of git
  CLOUDISH_API_KEY=cld_... DEMOS_IDLE_TIMEOUT=300 node demos/deploy.mjs <folder>
  ```

  It prints the URL, `https://<alias>-demo-<folder>.<domain>/`.

### 4. The pull request

Say which library it is and include the test URL. The checks build the demo,
run it and attach its screenshots to the workflow run, and the site tests
check `demo.json`. After the merge, the demo is deployed at
`https://awesomedataviz-demo-<folder>.on.do.cloudish.ai/` and appears on the site
with the next build. You can delete your test project then.
