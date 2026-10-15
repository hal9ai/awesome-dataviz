# Streamlit demo

The shared Gapminder views as a [Streamlit](https://streamlit.io) app, charted
with [Altair](https://altair-viz.github.io), the library Streamlit itself
depends on for its built-in charts (`st.line_chart` and friends), passed to
`st.altair_chart`. Streamlit reruns `app.py` top to bottom on every widget
change; `st.cache_data` keeps the data loaded once.

| View | How |
|---|---|
| Scatter by year | `st.slider` for the year (Streamlit has no play button), Altair `mark_circle`, log x axis, tooltips |
| One country | `st.selectbox`, Altair `mark_line(point=True)` |
| World map | Altair `mark_geoshape` with a `transform_lookup` from the GeoJSON's `iso_alpha` to the year's rows, Equal Earth projection |

Pinned: Python 3.13, streamlit 1.65.0, altair 6.3.0, pandas 3.0.6 (`requirements.txt`).

```sh
node demos/deploy.mjs --local streamlit       # docker build + run on http://localhost:8080
# or without Docker
cd streamlit && ln -s ../data data && pip install -r requirements.txt && streamlit run app.py
```

Image: about 550 MB. Memory: about 140 MB idle, more per session.
