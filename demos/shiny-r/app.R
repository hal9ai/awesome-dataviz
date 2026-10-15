# Gapminder in Shiny for R, drawn with ggplot2.
#
# Every chart is rendered on the server: changing an input re-runs the
# matching render function in R and sends back a new image. Shiny's
# sliderInput(animate = ...) adds the play button; plotOutput(hover = ...)
# sends the pointer position back to R, which finds the nearest bubble.

library(shiny)
library(bslib)
library(ggplot2)

gap <- read.csv("data/gapminder.csv")
years <- sort(unique(gap$year))

# The same continent colors in every demo of this gallery.
continent_colors <- c(
  Africa = "#eda100", Americas = "#e34948", Asia = "#2a78d6",
  Europe = "#1baf7a", Oceania = "#008300"
)

metrics <- c(
  "Life expectancy (years)" = "lifeExp",
  "GDP per capita (US$, inflation-adjusted)" = "gdpPercap",
  "Population" = "pop"
)

# Natural Earth GeoJSON -> one row per vertex, for geom_polygon(). jsonlite
# ships with Shiny, so the map needs no GDAL/sf stack in the image.
world <- jsonlite::fromJSON("data/world.geojson", simplifyVector = FALSE)
world_df <- do.call(rbind, lapply(seq_along(world$features), function(i) {
  f <- world$features[[i]]
  polygons <- if (f$geometry$type == "Polygon") list(f$geometry$coordinates) else f$geometry$coordinates
  do.call(rbind, lapply(seq_along(polygons), function(p) {
    do.call(rbind, lapply(seq_along(polygons[[p]]), function(r) {
      xy <- matrix(unlist(polygons[[p]][[r]]), ncol = 2, byrow = TRUE)
      data.frame(iso_alpha = f$properties$iso_alpha, piece = paste(i, p), ring = r, long = xy[, 1], lat = xy[, 2])
    }))
  }))
}))

theme_demo <- theme_minimal(base_size = 15) +
  theme(panel.grid.minor = element_blank(), legend.position = "top", plot.title.position = "plot")

year_slider <- function(id) {
  sliderInput(id, "Year", min = min(years), max = max(years), value = min(years), step = 5, sep = "",
              animate = animationOptions(interval = 900, loop = TRUE))
}

ui <- page_navbar(
  title = "Gapminder in Shiny + ggplot2",
  nav_panel(
    "Wealth and health",
    layout_sidebar(
      sidebar = sidebar(year_slider("year"), uiOutput("hovered")),
      plotOutput("scatter", height = "560px", hover = hoverOpts("scatter_hover", delay = 80))
    )
  ),
  nav_panel(
    "One country",
    layout_sidebar(
      sidebar = sidebar(selectInput("country", "Country", choices = sort(unique(gap$country)), selected = "Japan")),
      plotOutput("line", height = "560px")
    )
  ),
  nav_panel(
    "World map",
    layout_sidebar(
      sidebar = sidebar(selectInput("metric", "Metric", choices = metrics), year_slider("map_year")),
      plotOutput("map", height = "560px")
    )
  ),
  nav_spacer(),
  nav_item(tags$a("Source", href = "https://github.com/hal9ai/awesome-dataviz/tree/main/demos/shiny-r")),
  footer = tags$p(class = "text-muted small px-3",
    HTML('Data: <a href="https://github.com/jennybc/gapminder">gapminder</a> (CC0), based on free material from <a href="https://www.gapminder.org/data/">GAPMINDER.ORG</a>, CC-BY license. Map: Natural Earth.'))
)

server <- function(input, output, session) {
  in_year <- reactive(gap[gap$year == input$year, ][order(-gap$pop[gap$year == input$year]), ])

  output$scatter <- renderPlot({
    ggplot(in_year(), aes(gdpPercap, lifeExp, size = pop, fill = continent)) +
      annotate("text", x = 3000, y = 50, label = input$year, size = 40, colour = "grey92", fontface = "bold") +
      geom_point(shape = 21, colour = "white", stroke = 0.6, alpha = 0.9) +
      scale_x_log10(labels = scales::label_dollar(), limits = range(gap$gdpPercap)) +
      scale_y_continuous(limits = c(20, 85)) +
      scale_size_area(max_size = 26, limits = range(gap$pop), guide = "none") +
      scale_fill_manual(values = continent_colors) +
      guides(fill = guide_legend(override.aes = list(size = 5))) +
      labs(x = "GDP per capita (log scale)", y = "Life expectancy (years)", fill = NULL,
           title = "GDP per capita vs life expectancy", subtitle = "Bubble area is population") +
      theme_demo
  }, res = 96)

  output$hovered <- renderUI({
    point <- nearPoints(in_year(), input$scatter_hover, xvar = "gdpPercap", yvar = "lifeExp", threshold = 20, maxpoints = 1)
    if (nrow(point) == 0) return(helpText("Point at a bubble to name it."))
    tags$p(tags$strong(point$country), tags$br(),
           sprintf("Life expectancy %.1f years", point$lifeExp), tags$br(),
           sprintf("GDP per capita $%s", format(round(point$gdpPercap), big.mark = ",")), tags$br(),
           sprintf("Population %s", format(point$pop, big.mark = ",")))
  })

  output$line <- renderPlot({
    one <- gap[gap$country == input$country, ]
    ggplot(one, aes(year, lifeExp)) +
      geom_line(colour = continent_colors[[one$continent[1]]], linewidth = 1) +
      geom_point(colour = continent_colors[[one$continent[1]]], size = 2.5) +
      scale_x_continuous(breaks = years) +
      scale_y_continuous(limits = c(20, 85)) +
      labs(x = NULL, y = "Life expectancy (years)", title = paste("Life expectancy in", input$country),
           subtitle = one$continent[1]) +
      theme_demo
  }, res = 96)

  output$map <- renderPlot({
    metric <- input$metric
    in_year <- gap[gap$year == input$map_year, ]
    shapes <- world_df  # match() keeps the vertex order that geom_polygon() needs
    shapes$value <- in_year[[metric]][match(shapes$iso_alpha, in_year$iso_alpha)]
    log_scale <- metric != "lifeExp"
    ggplot(shapes, aes(long, lat, group = piece, subgroup = ring, fill = value)) +
      geom_polygon(colour = "white", linewidth = 0.15) +
      scale_fill_gradient(
        low = "#cde2fb", high = "#0d366b", na.value = "#e4e3df", limits = range(gap[[metric]]),
        transform = if (log_scale) "log10" else "identity",
        labels = if (metric == "gdpPercap") scales::label_dollar() else if (metric == "pop") scales::label_number(scale_cut = scales::cut_short_scale()) else waiver()
      ) +
      coord_quickmap(ylim = c(-56, 84), expand = FALSE) +
      labs(x = NULL, y = NULL, fill = NULL, title = paste(names(metrics)[metrics == metric], "in", input$map_year),
           subtitle = "Gray: no data") +
      theme_demo +
      theme(axis.text = element_blank(), panel.grid = element_blank(), legend.key.width = unit(3, "lines"))
  }, res = 96)
}

shinyApp(ui, server)
