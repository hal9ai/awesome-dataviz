# matplotlib demo

The shared Gapminder views drawn with [matplotlib](https://matplotlib.org) by
a small [Flask](https://flask.palletsprojects.com) app. This is what a static
image gallery can't show: the server re-renders an SVG each time you change the
year, the country or the metric.

| Endpoint | Draws |
|---|---|
| `/scatter.svg?year=1977` | `ax.scatter` with marker area proportional to population, log x axis |
| `/line.svg?country=Japan` | `ax.plot` of one country |
| `/map.svg?metric=lifeExp&year=2007` | a `PatchCollection` of the Natural Earth polygons (no cartopy or geopandas) |
| `/` | the page with the controls; a few lines of JavaScript swap the image `src`, and the forms still work without it |

Renders are cached per argument set (`functools.lru_cache`) in each of the two
gunicorn workers; a cold render takes about 0.1–0.2 s.

Pinned: Python 3.13, flask 3.1.3, gunicorn 26.2.0, matplotlib 3.11.2, numpy 2.5.4 (`requirements.txt`).

```sh
node demos/deploy.mjs --local matplotlib   # docker build + run on http://localhost:8080
# or without Docker
cd matplotlib && ln -s ../data data && pip install -r requirements.txt && python app.py
```

Image: about 290 MB. Memory: about 150 MB for two workers.
