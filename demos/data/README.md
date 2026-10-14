# Demo data

Every demo reads the same two files, copied into its image at build time.

| File | What | Source | License |
|---|---|---|---|
| `gapminder.csv` | 1,704 rows: 142 countries every five years, 1952–2007, with `country`, `continent`, `year`, `lifeExp`, `pop`, `gdpPercap` and an `iso_alpha` (ISO 3166-1 alpha-3) code for the map | The [gapminder R package](https://github.com/jennybc/gapminder) by Jennifer Bryan, `inst/extdata/gapminder.tsv` and `country-codes.tsv` at commit [`391b5a4`](https://github.com/jennybc/gapminder/tree/391b5a40d3574c3b89d889dd7d72f7f3fdb4a70c) | Package: [CC0](https://github.com/jennybc/gapminder/blob/main/DESCRIPTION). Underlying data: Gapminder Foundation, [CC BY 4.0](https://www.gapminder.org/free-material/) |
| `world.geojson` | 176 country outlines (Antarctica dropped), properties `iso_alpha` and `name`, coordinates rounded to 0.01° | [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 – Countries, via [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) at commit `ca96624` (v5.2.0-pre) | Public domain |

`prepare.mjs` rebuilds both from those pinned commits (`node demos/data/prepare.mjs`).
The outputs are committed, so builds and demos never fetch data.

## Attribution

The gapminder package is CC0, but it is an excerpt of Gapminder's data, which
Gapminder publishes under CC BY 4.0 and asks to be credited as "free material
from GAPMINDER.ORG, CC-BY". Every demo carries this footer, and new demos should too:

> Data: [gapminder](https://github.com/jennybc/gapminder) (CC0), based on free
> material from [GAPMINDER.ORG](https://www.gapminder.org/data/), CC-BY license.
> Map: [Natural Earth](https://www.naturalearthdata.com/).

Gapminder also asks that "Gapminder" not be used in a product or service name;
the demos only use it to describe the dataset.

## Known gaps

- The 1:110m map has no shapes for seven small countries in the data: Bahrain,
  Comoros, Hong Kong, Mauritius, Reunion, Sao Tome and Principe, Singapore.
  They appear in the scatter and line views but not on the map.
- The gapminder excerpt has no rows for some large countries (for example
  Russia, which Gapminder's older series split around 1991), so they are gray on
  the map.
- `gdpPercap` is "GDP per capita (US$, inflation-adjusted)", as the package
  documents it.
