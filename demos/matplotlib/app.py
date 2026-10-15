"""Gapminder with matplotlib, rendered on the server by a small Flask app.

Each chart is an SVG drawn by matplotlib on request: /scatter.svg?year=1977,
/line.svg?country=Japan, /map.svg?metric=lifeExp&year=2007. The page swaps the
image source when an input changes, so every interaction is server-side
compute. Results are cached per argument set, so a replay is instant.
"""

import csv
import io
import json
import os
from functools import lru_cache
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # no display on a server

import matplotlib.pyplot as plt
from matplotlib.collections import PatchCollection
from matplotlib.colors import LinearSegmentedColormap, LogNorm, Normalize
from matplotlib.patches import Polygon
from matplotlib.ticker import FuncFormatter
from flask import Flask, Response, abort, render_template, request

DATA = Path(__file__).parent / "data"

with open(DATA / "gapminder.csv", newline="") as f:
    ROWS = [
        {**r, "year": int(r["year"]), "lifeExp": float(r["lifeExp"]), "pop": int(r["pop"]), "gdpPercap": float(r["gdpPercap"])}
        for r in csv.DictReader(f)
    ]
YEARS = sorted({r["year"] for r in ROWS})
COUNTRIES = sorted({r["country"] for r in ROWS})
WORLD = json.loads((DATA / "world.geojson").read_text())["features"]

# The same continent colors in every demo of this gallery.
CONTINENT_COLORS = {"Africa": "#eda100", "Americas": "#e34948", "Asia": "#2a78d6", "Europe": "#1baf7a", "Oceania": "#008300"}
METRICS = {
    "lifeExp": "Life expectancy (years)",
    "gdpPercap": "GDP per capita (US$, inflation-adjusted)",
    "pop": "Population",
}
BLUES = LinearSegmentedColormap.from_list("blues", ["#cde2fb", "#6da7ec", "#256abf", "#0d366b"])
NO_DATA = "#e4e3df"

plt.rcParams.update({
    "font.size": 11, "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.color": "#e8e8e6", "axes.edgecolor": "#9a9893",
    "svg.fonttype": "none",  # keep text as text in the SVG
})

dollars = FuncFormatter(lambda v, _: f"${v:,.0f}")


def svg(fig):
    buf = io.StringIO()
    fig.savefig(buf, format="svg", bbox_inches="tight")
    plt.close(fig)
    return buf.getvalue()


@lru_cache(maxsize=64)
def scatter(year):
    rows = sorted((r for r in ROWS if r["year"] == year), key=lambda r: -r["pop"])  # small bubbles on top
    max_pop = max(r["pop"] for r in ROWS)
    fig, ax = plt.subplots(figsize=(9, 5.6))
    ax.text(0.5, 0.45, str(year), transform=ax.transAxes, ha="center", va="center", fontsize=110, color="#efefed", weight="bold", zorder=0)
    ax.scatter(
        [r["gdpPercap"] for r in rows], [r["lifeExp"] for r in rows],
        s=[3000 * r["pop"] / max_pop for r in rows],  # marker area is proportional to population
        c=[CONTINENT_COLORS[r["continent"]] for r in rows],
        edgecolors="white", linewidths=0.8, alpha=0.9, zorder=2,
    )
    ax.set_xscale("log")
    ax.xaxis.set_major_formatter(dollars)
    ax.set_xlim(200, 150_000)
    ax.set_ylim(20, 85)
    ax.set_xlabel("GDP per capita (log scale)")
    ax.set_ylabel("Life expectancy (years)")
    ax.set_title("GDP per capita vs life expectancy; bubble area is population", loc="left")
    for name, color in CONTINENT_COLORS.items():
        ax.scatter([], [], s=60, c=color, label=name)
    ax.legend(loc="lower right", frameon=False)
    return svg(fig)


@lru_cache(maxsize=256)
def line(country):
    rows = [r for r in ROWS if r["country"] == country]
    color = CONTINENT_COLORS[rows[0]["continent"]]
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.plot([r["year"] for r in rows], [r["lifeExp"] for r in rows], color=color, linewidth=2, marker="o", markersize=5)
    ax.set_xticks(YEARS)
    ax.set_ylim(20, 85)  # the same range for every country, so they compare
    ax.set_ylabel("Life expectancy (years)")
    ax.set_title(f"Life expectancy in {country} ({rows[0]['continent']})", loc="left")
    return svg(fig)


@lru_cache(maxsize=64)
def world_map(metric, year):
    values = {r["iso_alpha"]: r[metric] for r in ROWS if r["year"] == year}
    everything = [r[metric] for r in ROWS]  # one scale for all years, so years compare
    norm = Normalize(min(everything), max(everything)) if metric == "lifeExp" else LogNorm(min(everything), max(everything))
    fig, ax = plt.subplots(figsize=(10, 5.4))
    patches, colors = [], []
    for feature in WORLD:
        geometry = feature["geometry"]
        polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
        value = values.get(feature["properties"]["iso_alpha"])
        for rings in polygons:
            patches.append(Polygon(rings[0], closed=True))  # outer ring; the 1:110m holes are negligible
            colors.append(BLUES(norm(value)) if value is not None else NO_DATA)
    ax.add_collection(PatchCollection(patches, facecolors=colors, edgecolors="white", linewidths=0.3))
    ax.set_xlim(-180, 180)
    ax.set_ylim(-56, 84)
    ax.set_aspect(1.25)
    ax.axis("off")
    ax.set_title(f"{METRICS[metric]} in {year} (gray: no data)", loc="left")
    bar = fig.colorbar(plt.cm.ScalarMappable(norm=norm, cmap=BLUES), ax=ax, orientation="horizontal", fraction=0.04, pad=0.02, aspect=50)
    if metric == "gdpPercap":
        bar.ax.xaxis.set_major_formatter(dollars)
    return svg(fig)


app = Flask(__name__)


def svg_response(body):
    return Response(body, mimetype="image/svg+xml", headers={"Cache-Control": "public, max-age=3600"})


def year_arg():
    year = request.args.get("year", type=int, default=YEARS[0])
    if year not in YEARS:
        abort(400, f"year must be one of {YEARS}")
    return year


@app.get("/")
def index():
    return render_template("index.html", years=YEARS, countries=COUNTRIES, metrics=METRICS)


@app.get("/scatter.svg")
def scatter_svg():
    return svg_response(scatter(year_arg()))


@app.get("/line.svg")
def line_svg():
    country = request.args.get("country", "Japan")
    if country not in COUNTRIES:
        abort(400, "unknown country")
    return svg_response(line(country))


@app.get("/map.svg")
def map_svg():
    metric = request.args.get("metric", "lifeExp")
    if metric not in METRICS:
        abort(400, f"metric must be one of {list(METRICS)}")
    return svg_response(world_map(metric, year_arg()))


@app.get("/healthz")
def healthz():
    return {"ok": True}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
