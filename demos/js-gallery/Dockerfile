# Static pages for ECharts, Chart.js and Plotly.js, served by nginx.
# The libraries come from npm at the versions pinned in package-lock.json.
FROM node:22-alpine AS vendor
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
# Plotly's geo subplots always load a base-map topology, even when it is
# hidden; serve it locally (checksum-pinned) instead of from cdn.plot.ly.
RUN wget -q -O world_110m.json https://cdn.plot.ly/un/world_110m.json \
 && echo "e1bf51740ad28396265e52123ea7315d692f112664ab2cb0f1ea76a96fe1bb0a  world_110m.json" | sha256sum -c -

FROM nginx:1.30.5-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY site/ /usr/share/nginx/html/
COPY data/gapminder.csv data/world.geojson /usr/share/nginx/html/data/
COPY --from=vendor /build/node_modules/echarts/dist/echarts.min.js \
     /build/node_modules/chart.js/dist/chart.umd.min.js \
     /build/node_modules/chartjs-chart-geo/build/index.umd.min.js \
     /build/node_modules/plotly.js-dist-min/plotly.min.js \
     /usr/share/nginx/html/vendor/
RUN mv /usr/share/nginx/html/vendor/index.umd.min.js /usr/share/nginx/html/vendor/chartjs-chart-geo.umd.min.js
COPY --from=vendor /build/world_110m.json /usr/share/nginx/html/vendor/topojson/

ENV PORT=8080
EXPOSE 8080
