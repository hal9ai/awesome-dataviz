# Shiny for R demo

The shared Gapminder views in [Shiny](https://shiny.posit.co) for R, drawn with
[ggplot2](https://ggplot2.tidyverse.org) via `renderPlot()`, the most common
way Shiny apps chart. Every chart is rendered in R on the server and sent as an
image; changing an input re-runs only the render function that depends on it.

| View | How |
|---|---|
| Scatter by year | `sliderInput(animate = ...)` gives the play button; `geom_point()` with `scale_size_area()`; `plotOutput(hover = ...)` + `nearPoints()` name the bubble under the pointer, a round trip to R |
| One country | `selectInput()`, `geom_line()` + `geom_point()` |
| World map | `geom_polygon()` on the Natural Earth GeoJSON, parsed with jsonlite (a Shiny dependency), so the image needs no GDAL/sf stack |

Layout uses [bslib](https://rstudio.github.io/bslib/) (`page_navbar`, `layout_sidebar`), which ships with Shiny.

Pinned: `rocker/r-ver:4.6.1` and a dated [Posit Package Manager](https://p3m.dev)
snapshot (`2026-10-01`) of Ubuntu 24.04 binaries, which fixes every package
version: shiny 1.14.0, bslib 0.12.0, ggplot2 4.0.3, scales 1.4.0. Binaries
install in seconds instead of compiling; the one system library they need
beyond the base image is `libuv1t64` (for fs).

```sh
node demos/deploy.mjs --local shiny-r   # docker build + run on http://localhost:8080
# or with R installed
cd shiny-r && ln -s ../data data && Rscript -e 'shiny::runApp(port = 8080)'
```

Image: about 1 GB (most of it is R itself), so it is the slowest demo to
wake on Cloudish. Memory: about 200 MB.
