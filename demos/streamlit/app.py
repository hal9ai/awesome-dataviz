"""Gapminder in Streamlit, charted with Altair.

Altair is Streamlit's own charting dependency (st.line_chart and friends are
built on it), so it needs no extra install. Streamlit reruns this script
from top to bottom on every widget change; st.cache_data keeps the data
loaded once.
"""

import json

import altair as alt
import pandas as pd
import streamlit as st

st.set_page_config(page_title="Gapminder in Streamlit", layout="wide")


@st.cache_data
def load():
    gap = pd.read_csv("data/gapminder.csv")
    with open("data/world.geojson") as f:
        world = json.load(f)
    return gap, world


gap, world = load()
years = sorted(gap["year"].unique().tolist())

# The same continent colors in every demo of this gallery.
CONTINENTS = alt.Scale(
    domain=["Africa", "Americas", "Asia", "Europe", "Oceania"],
    range=["#eda100", "#e34948", "#2a78d6", "#1baf7a", "#008300"],
)
METRICS = {
    "lifeExp": "Life expectancy (years)",
    "gdpPercap": "GDP per capita (US$, inflation-adjusted)",
    "pop": "Population",
}
BLUES = ["#cde2fb", "#6da7ec", "#256abf", "#0d366b"]
TOOLTIP = [
    alt.Tooltip("country:N", title="Country"),
    alt.Tooltip("lifeExp:Q", title="Life expectancy", format=".1f"),
    alt.Tooltip("gdpPercap:Q", title="GDP per capita", format="$,.0f"),
    alt.Tooltip("pop:Q", title="Population", format=","),
]

st.title("Gapminder in Streamlit + Altair")
scatter_tab, line_tab, map_tab = st.tabs(["Wealth and health", "One country", "World map"])

with scatter_tab:
    year = st.slider("Year", years[0], years[-1], years[0], step=5, key="scatter_year")
    in_year = gap[gap["year"] == year].sort_values("pop", ascending=False)  # small bubbles on top
    scatter = (
        alt.Chart(in_year, title=alt.Title("GDP per capita vs life expectancy", subtitle="Bubble area is population"))
        .mark_circle(opacity=0.9, stroke="white", strokeWidth=1)
        .encode(
            x=alt.X("gdpPercap:Q", title="GDP per capita (log scale)", scale=alt.Scale(type="log", domain=[200, 150_000]), axis=alt.Axis(format="$,.0f", values=[300, 1000, 3000, 10_000, 30_000, 100_000])),
            y=alt.Y("lifeExp:Q", title="Life expectancy (years)", scale=alt.Scale(domain=[20, 85])),
            size=alt.Size("pop:Q", scale=alt.Scale(domain=[0, int(gap["pop"].max())], range=[0, 4000]), legend=None),
            color=alt.Color("continent:N", scale=CONTINENTS, title=None, legend=alt.Legend(orient="top")),
            order=alt.Order("pop:Q", sort="descending"),
            tooltip=TOOLTIP,
        )
        .properties(height=520)
    )
    st.altair_chart(scatter, width="stretch")

with line_tab:
    countries = sorted(gap["country"].unique())
    country = st.selectbox("Country", countries, index=countries.index("Japan"))
    one = gap[gap["country"] == country]
    line = (
        alt.Chart(one, title=f"Life expectancy in {country} ({one['continent'].iloc[0]})")
        .mark_line(point=True, strokeWidth=2)
        .encode(
            x=alt.X("year:O", title=None, axis=alt.Axis(labelAngle=0)),
            y=alt.Y("lifeExp:Q", title="Life expectancy (years)", scale=alt.Scale(domain=[20, 85])),
            color=alt.Color("continent:N", scale=CONTINENTS, legend=None),
            tooltip=[alt.Tooltip("year:O", title="Year"), alt.Tooltip("lifeExp:Q", title="Life expectancy", format=".1f")],
        )
        .properties(height=460)
    )
    st.altair_chart(line, width="stretch")

with map_tab:
    left, right = st.columns(2)
    metric = left.selectbox("Metric", list(METRICS), format_func=METRICS.get)
    map_year = right.slider("Year", years[0], years[-1], years[-1], step=5, key="map_year")
    values = gap[gap["year"] == map_year]
    shapes = alt.Data(values=world["features"])
    base = alt.Chart(shapes).mark_geoshape(fill="#e4e3df", stroke="white", strokeWidth=0.5)
    colored = (
        alt.Chart(shapes)
        .mark_geoshape(stroke="white", strokeWidth=0.5)
        .transform_lookup(lookup="properties.iso_alpha", from_=alt.LookupData(values, "iso_alpha", ["country", "lifeExp", "gdpPercap", "pop"]))
        .encode(
            # One scale for all years, so years compare.
            color=alt.Color(
                f"{metric}:Q",
                title=METRICS[metric],
                scale=alt.Scale(type="linear" if metric == "lifeExp" else "log", domain=[float(gap[metric].min()), float(gap[metric].max())], range=BLUES),
                legend=alt.Legend(orient="bottom", gradientLength=360),
            ),
            tooltip=TOOLTIP,
        )
    )
    world_map = (base + colored).project("equalEarth").properties(height=520, title=f"{METRICS[metric]} in {map_year} (gray: no data)")
    st.altair_chart(world_map, width="stretch")

st.caption(
    "Data: [gapminder](https://github.com/jennybc/gapminder) (CC0), based on free material from "
    "[GAPMINDER.ORG](https://www.gapminder.org/data/), CC-BY license. Map: [Natural Earth](https://www.naturalearthdata.com/). "
    "[Source](https://github.com/hal9ai/awesome-dataviz/tree/main/demos/streamlit)."
)
