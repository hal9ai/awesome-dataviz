# awesomedataviz.com

The website for this list: a searchable directory built from the repository
[README](../README.md), enriched with live data and deployed to
[Cloudish](https://cloudish.ai). Nothing here needs to change to add a tool;
a one-line pull request to the README is enough.

## What gets built

- A page per tool, category, topic and "A vs B" comparison, with GitHub stars,
  commits per month, contributors, license, maintenance status, verified install
  commands and downloads from npm, PyPI, CRAN, crates.io, NuGet, pub.dev, Julia,
  Go and Maven Central.
- A Markdown twin of every page (`/tools/chart-js.md`, or any page with
  `Accept: text/markdown`), `llms.txt`, `llms-full.txt`, a JSON API under `/api/`,
  `sitemap.xml`, an Atom feed of new tools and schema.org metadata.
- An MCP server at `/mcp` and a search API at `/api/search`, served by
  `server/server.mjs` alongside the static files.

Charts are SVG rendered at build time. Every chart has a hover/focus layer and a
table view, and the palette was checked for color-vision deficiencies in
both themes.

## Layout

| Path | Purpose |
|---|---|
| `src/readme.mjs` | Parses the README into sections and entries |
| `src/enrich/` | GitHub, GitLab and package registry data, cached in `.cache/` |
| `src/model.mjs` | Merges entries by repository; categories, topics, status |
| `src/content/` | Editorial copy: category guides and cross-cutting topics |
| `data/overrides.mjs` | Curated facts: repositories for homepage links, package names, slugs |
| `src/render/` | HTML templates, SVG charts and machine-readable feeds |
| `server/` | Static server, search API and MCP endpoint (no dependencies) |
| `scripts/deploy.mjs` | Uploads the build to Cloudish and checks it is live |

## Develop

Node 20 or later; there are no npm dependencies.

```sh
cd site
npm run build      # fetches data (uses GITHUB_TOKEN, or `gh auth token`)
npm start          # http://localhost:8080
npm test
```

`npm run build:offline` rebuilds from cached data only, which is fast.

## Deploy

`.github/workflows/site.yaml` tests and builds every pull request that touches
the README or the site, and deploys `main` on every change and daily to refresh
the data. The deploy needs the `CLOUDISH_API_KEY` repository secret.

To deploy by hand: `CLOUDISH_API_KEY=... npm run deploy` after a build.

## Fixing data

- **Wrong or missing repository, package or slug**: add an entry to
  `data/overrides.mjs`, keyed by the URL the README links to.
- **A new README section**: it gets a page automatically. Add a guide for it
  to `src/content/categories.mjs`.
- **A tool in the wrong topic**: adjust `include`/`exclude` in `src/content/topics.mjs`.
