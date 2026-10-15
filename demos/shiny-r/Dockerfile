# Shiny for R + ggplot2. rocker/r-ver installs binary packages from the
# Posit Package Manager; the dated snapshot below pins every package version.
FROM rocker/r-ver:4.6.1

ENV CRAN=https://p3m.dev/cran/__linux__/noble/2026-10-01
# libuv: a system library the fs package (used by bslib) links against.
RUN apt-get update && apt-get install -y --no-install-recommends libuv1t64 && rm -rf /var/lib/apt/lists/*
RUN install2.r --error --skipinstalled --ncpus -1 -r "$CRAN" shiny bslib ggplot2 scales \
 && rm -rf /tmp/downloaded_packages \
 && Rscript -e 'for (p in c("shiny", "bslib", "ggplot2", "scales")) cat(p, as.character(packageVersion(p)), "\n")'

WORKDIR /app
COPY app.R ./
COPY data/gapminder.csv data/world.geojson ./data/
RUN useradd --create-home shiny && chown -R shiny /app
USER shiny

ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "exec Rscript -e \"shiny::runApp('/app', host = '0.0.0.0', port = as.integer(Sys.getenv('PORT', '8080')), launch.browser = FALSE)\""]
