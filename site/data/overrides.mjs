// Curated facts the README can't express on one line. Keys are the exact URL
// an entry links to in the README (or its name, when unique).
//
//   repo      source repository ("owner/name" on GitHub, "gitlab:group/name")
//             when the README links to a homepage instead
//   name      display name, when the README uses a package-style spelling
//   slug      stable URL slug; set it before renaming anything that ships
//   npm, pypi, cran, crates, go, gem, nuget, pub, julia, maven (group:artifact)
//             package names, when they can't be read from the repository's
//             own manifest (monorepos, bindings published from elsewhere)
//   aliases   extra search terms
//   history   URL fragments the entry used before (e.g. a renamed repo), so
//             its "added on" date survives the rename
//   license   SPDX id, when neither GitHub nor the registry can tell
//   language  primary language, when GitHub's guess is misleading
//
// Package names found here or in a manifest are only used once the registry
// confirms the package points back at the same repository.

export default {
  // JavaScript: charting
  'https://apexcharts.com/': { repo: 'apexcharts/apexcharts.js', npm: 'apexcharts' },
  'https://www.chartjs.org/': { repo: 'chartjs/Chart.js', aliases: ['chartjs'] },
  'https://gionkunz.github.io/chartist-js/': { repo: 'chartist-js/chartist', npm: 'chartist' },
  'https://dygraphs.com/': { repo: 'danvk/dygraphs', npm: 'dygraphs' },
  'http://www.graphicsjs.org': { repo: 'AnyChart/GraphicsJS', npm: 'graphicsjs' },
  'https://metricsgraphicsjs.org/': { repo: 'metricsgraphics/metrics-graphics', npm: 'metrics-graphics' },
  'https://techanjs.org/': { repo: 'andredumas/techan.js', npm: 'techan' },
  'https://github.com/apache/echarts': { slug: 'echarts', aliases: ['echarts', 'baidu echarts'], history: ['ecomfe/echarts'] },
  'https://github.com/antvis/G2': { history: ['g2plot.antv.vision'] },
  'https://github.com/plotly/plotly.js/': { aliases: ['plotlyjs'] },
  'https://github.com/vizzuhq/vizzu-lib': { npm: 'vizzu' },
  // The d3/d3 repository is a thin bundle of d3-* modules, so GitHub reports Shell.
  'https://github.com/d3/d3': { slug: 'd3', language: 'JavaScript', aliases: ['d3js', 'd3.js', 'data-driven documents'] },
  'https://github.com/f5/unovis': { npm: '@unovis/ts' },
  'https://github.com/tradingview/lightweight-charts': { npm: 'lightweight-charts', aliases: ['tradingview'] },
  'https://github.com/nhn/tui.chart': { npm: '@toast-ui/chart', history: ['nhnent/tui.chart'] },

  // JavaScript: graphs and networks
  'https://marvl.infotech.monash.edu/webcola/': { repo: 'tgdwyer/WebCola', npm: 'webcola', aliases: ['webcola'] },
  'https://js.cytoscape.org/': { repo: 'cytoscape/cytoscape.js', npm: 'cytoscape' },
  'https://sigmajs.org/': { repo: 'jacomyal/sigma.js', npm: 'sigma' },
  'https://github.com/antvis/g6': { npm: '@antv/g6' },
  'https://github.com/graphology/graphology': { npm: 'graphology' },
  'https://github.com/clientIO/joint': { npm: '@joint/core' },
  'https://github.com/bcakmakoglu/vue-flow': { npm: '@vue-flow/core' },
  'https://github.com/xyflow/xyflow': { slug: 'xyflow', npm: '@xyflow/react', aliases: ['react flow', 'reactflow', 'svelte flow'] },

  // JavaScript: maps
  'https://deck.gl/': { repo: 'visgl/deck.gl', npm: 'deck.gl', aliases: ['deckgl'] },
  'https://leafletjs.com': { repo: 'Leaflet/Leaflet', npm: 'leaflet', aliases: ['leafletjs'] },
  'https://vectoratlas.menelabs.com/': { repo: 'melenaos/Menelabs.VectorAtlas' },
  'https://github.com/antvis/L7': { npm: '@antv/l7' },
  'https://github.com/visgl/react-map-gl': { npm: 'react-map-gl' },
  'https://github.com/maplibre/maplibre-gl-js': { aliases: ['maplibre', 'mapbox gl'] },
  'https://github.com/openlayers/openlayers': { npm: 'ol' },
  'https://github.com/maptalks/maptalks.js': { npm: 'maptalks' },
  'https://github.com/antvis/L7Plot': { npm: '@antv/l7plot' },
  'https://github.com/antvis/dipper': { npm: '@antv/dipper' },
  'https://github.com/CesiumGS/cesium': { npm: 'cesium', aliases: ['cesiumjs'], history: ['AnalyticalGraphicsInc/cesium'] },

  // JavaScript: React and misc
  'https://formidable.com/open-source/victory/': { repo: 'FormidableLabs/victory', npm: 'victory' },
  'https://devexpress.github.io/devextreme-reactive/react/chart/': { repo: 'DevExpress/devextreme-reactive', npm: '@devexpress/dx-react-chart' },
  'https://github.com/plouc/nivo': { npm: '@nivo/core' },
  'https://github.com/mui/mui-x/tree/master/packages/x-charts': { npm: '@mui/x-charts', aliases: ['mui charts'] },
  'https://github.com/airbnb/visx': { npm: '@visx/visx' },
  'https://github.com/tremorlabs/tremor-npm': { npm: '@tremor/react' },
  'https://github.com/FormidableLabs/victory-native-xl': { npm: 'victory-native' },
  'https://github.com/margelo/react-native-graph': { npm: 'react-native-graph' },
  'https://github.com/nteract/semiotic': { npm: 'semiotic' },
  'https://github.com/uwdata/mosaic': { npm: '@uwdata/vgplot' },
  'https://github.com/swimlane/ngx-charts': { npm: '@swimlane/ngx-charts' },
  'https://github.com/Kitware/vtk-js': { npm: '@kitware/vtk.js' },
  'https://github.com/perspective-dev/perspective': { npm: '@finos/perspective' },
  'https://github.com/observablehq/framework': { npm: '@observablehq/framework' },
  'https://github.com/uber/react-vis': { npm: 'react-vis' },
  'https://github.com/antvis/Graphin': { npm: '@antv/graphin' },
  'https://github.com/antvis/F2': { npm: '@antv/f2' },
  'https://github.com/Kanaries/graphic-walker': { npm: '@kanaries/graphic-walker' },
  'https://riccardoscalco.github.io/textures/': { repo: 'riccardoscalco/textures', npm: 'textures' },
  'https://timeline.knightlab.com/': { repo: 'NUKnightLab/TimelineJS3', npm: '@knight-lab/timelinejs', aliases: ['timelinejs'] },
  'https://visjs.org/': { repo: 'visjs/vis-network', npm: 'vis-network', aliases: ['visjs', 'vis-network'] },
  'https://vega.github.io/vega/': { repo: 'vega/vega', npm: 'vega' },
  'https://vega.github.io/vega-lite/': { repo: 'vega/vega-lite', npm: 'vega-lite' },
  'https://github.com/observablehq/plot': { npm: '@observablehq/plot' },

  // Python
  'https://altair-viz.github.io/': { repo: 'vega/altair', name: 'Vega-Altair', slug: 'altair', pypi: 'altair' },
  'https://bokeh.org/': { repo: 'bokeh/bokeh', name: 'Bokeh', pypi: 'bokeh', history: ['bokeh.pydata.org'] },
  'https://holoviews.org/': { repo: 'holoviz/holoviews', name: 'HoloViews', pypi: 'holoviews' },
  'https://docs.enthought.com/mayavi/mayavi/': { repo: 'enthought/mayavi', name: 'Mayavi', pypi: 'mayavi' },
  'https://matplotlib.org/': { repo: 'matplotlib/matplotlib', name: 'Matplotlib', pypi: 'matplotlib' },
  'https://plotly.com/python/': { repo: 'plotly/plotly.py', name: 'Plotly (Python)', slug: 'plotly-python', pypi: 'plotly', aliases: ['plotly.py', 'plotly express'], history: ['plot.ly/python'] },
  'https://www.pyqtgraph.org/': { repo: 'pyqtgraph/pyqtgraph', pypi: 'pyqtgraph' },
  'https://seaborn.pydata.org/': { repo: 'mwaskom/seaborn', name: 'Seaborn', pypi: 'seaborn' },
  'https://toyplot.readthedocs.io/en/stable/': { repo: 'sandialabs/toyplot', name: 'Toyplot', pypi: 'toyplot' },
  'https://veusz.github.io/': { repo: 'veusz/veusz', name: 'Veusz', pypi: 'veusz' },
  'https://vispy.org/': { repo: 'vispy/vispy', pypi: 'vispy' },
  'https://www.vtk.org/': { repo: 'Kitware/VTK', pypi: 'vtk' },
  'https://github.com/Kitware/VTK': { name: 'VTK', slug: 'vtk', pypi: 'vtk', aliases: ['visualization toolkit'] },
  'https://github.com/yhat/ggpy': { name: 'ggpy', slug: 'ggpy', pypi: 'ggplot' },
  'https://github.com/rerun-io/rerun': { pypi: 'rerun-sdk', crates: 'rerun' },
  'https://github.com/JetBrains/lets-plot': { pypi: 'lets-plot' },
  'https://github.com/streamlit/streamlit': { pypi: 'streamlit' },
  'https://github.com/matplotlib/mplfinance': { pypi: 'mplfinance' },
  'https://github.com/plotters-rs/plotters': { crates: 'plotters' },
  'https://github.com/yuankunzhang/charming': { crates: 'charming' },
  'https://github.com/plotly/plotly.rs': { crates: 'plotly' },
  'https://github.com/apache/superset': { slug: 'superset', pypi: 'apache-superset', aliases: ['superset'] },
  'https://github.com/spotify/chartify': { pypi: 'chartify' },
  'https://github.com/nmwsharp/polyscope': { pypi: 'polyscope' },
  'https://github.com/heremaps/pptk': { pypi: 'pptk' },
  'https://github.com/Technion-Kishony-lab/quibbler': { pypi: 'pyquibbler' },
  'https://github.com/comet-ml/comet-examples': { pypi: 'comet-ml' },
  'https://github.com/mermaid-js/mermaid': { npm: 'mermaid', history: ['knsv/mermaid', 'mermaidjs.github.io'] },
  'https://github.com/Data-Centric-AI-Community/fg-data-profiling': { pypi: 'ydata-profiling', aliases: ['pandas-profiling', 'pandas profiling'], history: ['pandas-profiling/pandas-profiling'] },
  'https://github.com/comet-ml/opik': { pypi: 'opik', history: ['comet-ml/comet-llm'] },

  // R
  'https://ggplot2.tidyverse.org/': { repo: 'tidyverse/ggplot2', cran: 'ggplot2' },
  'https://ggvis.rstudio.com/': { repo: 'rstudio/ggvis', cran: 'ggvis' },
  'https://lattice.r-forge.r-project.org': { repo: 'deepayan/lattice', cran: 'lattice' },
  'https://cran.r-project.org/web/packages/rgl/index.html': { repo: 'dmurdoch/rgl', cran: 'rgl' },
  'https://shiny.rstudio.com': { repo: 'rstudio/shiny', name: 'Shiny', cran: 'shiny' },
  'https://github.com/plotly/plotly.R': { name: 'plotly (R)', slug: 'plotly-r', cran: 'plotly', history: ['ropensci/plotly'] },
  'https://hafen.github.io/rbokeh/': { repo: 'bokeh/rbokeh', cran: 'rbokeh' },
  'https://datastorm-open.github.io/visNetwork/': { repo: 'datastorm-open/visNetwork', cran: 'visNetwork' },

  // Julia, JVM and .NET (registries without a manifest the build can read)
  'https://github.com/MakieOrg/Makie.jl': { julia: 'Makie' },
  'https://github.com/JuliaPlots/Plots.jl': { julia: 'Plots' },
  'https://github.com/JuliaPlots/UnicodePlots.jl': { julia: 'UnicodePlots' },
  'https://github.com/GiovineItalia/Gadfly.jl': { julia: 'Gadfly' },
  'https://github.com/jfree/jfreechart': { maven: 'org.jfree:jfreechart' },
  'https://github.com/knowm/XChart': { maven: 'org.knowm.xchart:xchart' },
  'https://github.com/JetBrains/lets-plot-kotlin': { maven: 'org.jetbrains.lets-plot:lets-plot-kotlin-jvm' },
  'https://github.com/ScottPlot/ScottPlot': { nuget: 'ScottPlot' },
  'https://github.com/oxyplot/oxyplot': { nuget: 'OxyPlot.Core' },
  'https://github.com/Live-Charts/LiveCharts2': { nuget: 'LiveChartsCore.SkiaSharpView' },
  'https://github.com/microcharts-dotnet/Microcharts': { nuget: 'Microcharts' },
  'https://github.com/Mapsui/Mapsui': { nuget: 'Mapsui' },
  'https://github.com/microsoft/automatic-graph-layout': { nuget: 'Microsoft.Msagl' },

  'https://github.com/patrykandpatrick/vico': { maven: 'com.patrykandpatrick.vico:compose' },
  'https://github.com/plantuml/plantuml': { maven: 'net.sourceforge.plantuml:plantuml' },

  // Ruby, markup and apps
  'https://github.com/red-data-tools/YouPlot': { gem: 'youplot' },
  'https://github.com/ankane/blazer': { gem: 'blazer' },
  'https://github.com/topfunky/gruff': { gem: 'gruff' },
  'https://github.com/markmap/markmap': { npm: 'markmap-lib' },
  'https://github.com/penrose/penrose': { npm: '@penrose/core' },
  'https://github.com/likec4/likec4': { npm: 'likec4' },
  'https://github.com/ankane/chartkick': { gem: 'chartkick' },
  'https://wavedrom.com/': { repo: 'wavedrom/wavedrom', npm: 'wavedrom', history: ['[wavedrom.com]('] },
  'https://kepler.gl/': { repo: 'keplergl/kepler.gl', npm: '@kepler.gl/components', aliases: ['keplergl'] },
  'https://rawgraphs.io': { repo: 'rawgraphs/rawgraphs-app', name: 'RAWGraphs', slug: 'rawgraphs', aliases: ['raw'] },
  'https://github.com/antvis/X6': { npm: '@antv/x6', history: ['x6.antv.vision'] },
  'https://graphviz.org/': { repo: 'gitlab:graphviz/graphviz', aliases: ['dot'] },
  'https://squey.org': { repo: 'gitlab:squey/squey' },
};
