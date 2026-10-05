# Awesome Dataviz
[![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome) ![Test](https://github.com/hal9ai/awesome-dataviz/actions/workflows/main.yaml/badge.svg)


A curated list of awesome **open-source** data visualizations frameworks, libraries and software. Inspired by [awesome-python](https://github.com/vinta/awesome-python) and originally created by [fasouto](https://github.com/fasouto).

Browse it at **[awesomedataviz.com](https://awesomedataviz.com)**: search, rankings, live GitHub stats, comparisons and an MCP server for AI assistants, all generated from this README.

## Contents
- [Awesome dataviz](#awesome-dataviz)
	- [JavaScript tools](#javascript-tools)
		- [Charting libraries](#charting-libraries)
		- [Charting libraries for graphs](#charting-libraries-for-graphs)
		- [Financial charts](#financial-charts)
		- [Maps](#maps)
		- [d3](#d3)
		- [React](#react)
		- [React Native](#react-native)
		- [Misc](#misc)
	- [Android tools](#android-tools)
	- [C++ tools](#c-tools)
	- [Dashboards and BI](#dashboards-and-bi)
	- [Flutter tools](#flutter-tools)
	- [Golang tools](#golang-tools)
	- [iOS tools](#ios-tools)
	- [Julia tools](#julia-tools)
	- [JVM tools](#jvm-tools)
	- [Machine Learning tools](#machine-learning-tools)
	- [.NET tools](#net-tools)
	- [Python tools](#python-tools)
	- [R tools](#r-tools)
	- [Ruby tools](#ruby-tools)
	- [Rust tools](#rust-tools)
	- [Markup-based tools](#markup-based-tools)
	- [Other tools](#other-tools)
- [Resources](#resources)
	- [Books](#books)
	- [Catalogs](#catalogs)
	- [Podcasts](#podcasts)
	- [Twitter accounts](#twitter-accounts)
	- [Websites](#websites)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)

## JavaScript tools

### Charting libraries
- [Apache ECharts](https://github.com/apache/echarts) - Highly customizable and interactive charts ready for big datasets.
- [ApexCharts](https://apexcharts.com/) - Modern & Interactive SVG Charts.
- [billboard.js](https://github.com/naver/billboard.js) - Reusable D3.js-based chart library with SVG and Canvas rendering, maintained by NAVER.
- [C3.js](https://github.com/c3js/c3) - D3-based reusable chart library.
- [Cal-Heatmap](https://github.com/wa0x6e/cal-heatmap) - Time-series calendar heatmaps, similar to GitHub's contribution graph, built on D3.
- [Carbon Charts](https://github.com/carbon-design-system/carbon-charts) - Chart library from IBM's Carbon Design System, built on D3, with React, Angular, Vue and Svelte wrappers.
- [Chart.js](https://www.chartjs.org/) - Charts with the canvas tag.
- [chart.xkcd](https://github.com/timqian/chart.xkcd) - Chart library that renders line, bar, pie and other charts in a hand-drawn xkcd style.
- [ChartGPU](https://github.com/ChartGPU/ChartGPU) - WebGPU charting library for large datasets, real-time streaming and multi-chart dashboards.
- [Chartist.js](https://gionkunz.github.io/chartist-js/) - Responsive charts with great browser compatibility.
- [Charts.css](https://github.com/ChartsCSS/charts.css) - CSS framework that styles HTML tables as charts.
- [dc.js](https://github.com/dc-js/dc.js) - Multi-dimensional charting built to work natively with crossfilter.
- [DHTMLX Gantt](https://github.com/DHTMLX/gantt) - Gantt chart component for project schedules, with task dependencies and drag-and-drop editing.
- [Dygraphs](https://dygraphs.com/) - Interactive line charts library that works with huge datasets.
- [ECharts GL](https://github.com/ecomfe/echarts-gl) - Extension for Apache ECharts that adds 3D plots, globe visualizations and WebGL-accelerated series.
- [Epoch](https://github.com/epochjs/epoch) - Perfect to create real-time charts.
- [Flot](https://github.com/flot/flot) - jQuery plotting library for line, bar and pie charts with zooming and other interactive features.
- [Frappe Charts](https://github.com/frappe/charts) - Simple, responsive SVG charts with zero dependencies.
- [Frappe Gantt](https://github.com/frappe/gantt) - Simple, interactive SVG Gantt chart library.
- [G2](https://github.com/antvis/G2) - An interactive and responsive charting library based on the grammar of graphics, maintained by Alibaba.
- [Glyph](https://github.com/seanhanca/glyph) - Deterministic chart library that renders the same JSON spec to identical SVG on every platform, with DuckDB inside and an MCP server for AI agents.
- [Google Charts](https://developers.google.com/chart) - Interactive charts for browsers and mobile devices.
- [GraphicsJS](http://www.graphicsjs.org) - Lightweight JS graphics library with intuitive API, based on SVG/VML.
- [heatmap.js](https://github.com/pa7/heatmap.js) - Canvas-based library for rendering heatmaps, with plugins for Leaflet and Google Maps.
- [lit-line](https://github.com/apinet/lit-line) - SVG Line Chart Web Component - light, fast, interactive & fully responsive.
- [MetricsGraphics.js](https://metricsgraphicsjs.org/) - Optimized for time-series data.
- [NVD3](https://github.com/novus/nvd3) - A reusable charting library written in d3.js.
- [Observable Plot](https://github.com/observablehq/plot) - A JavaScript library for exploratory data visualization.
- [Plotly.js](https://github.com/plotly/plotly.js/) - Powerful declarative library with support for 20 chart types.
- [roughViz](https://github.com/jwilber/roughViz) - Sketchy, hand-drawn style charts for the browser, based on Rough.js.
- [TOAST UI Chart](https://github.com/nhn/tui.chart) - Complete library with support for legacy browsers.
- [Unovis](https://github.com/f5/unovis) - Modular data visualization framework for React, Angular, Svelte, Vue and vanilla TypeScript, by F5.
- [uPlot](https://github.com/leeoniya/uPlot) - Small, fast canvas-based charts for time series, lines, areas, OHLC and bars.
- [VChart](https://github.com/VisActor/VChart) - Cross-platform charting library with animation and storytelling features, from ByteDance's VisActor.
- [Vizzu](https://github.com/vizzuhq/vizzu-lib) - Library for animated data visualizations and data stories.

### Charting libraries for graphs
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph) - 3D force-directed graph component using Three.js/WebGL.
- [Cola.js](https://marvl.infotech.monash.edu/webcola/) - A tool to create diagrams using constraint-based optimization techniques. Works with d3 and svg.js.
- [cosmos.gl](https://github.com/cosmosgl/graph) - GPU-accelerated force graph layout and rendering engine that runs entirely in WebGL shaders.
- [Cytoscape.js](https://js.cytoscape.org/) - JavaScript library for graph drawing maintained by [Cytoscape](https://www.cytoscape.org) core developers.
- [dagre](https://github.com/dagrejs/dagre) - Directed graph layout library for JavaScript.
- [diagram.js](https://github.com/bpmn-io/diagram-js) - Javascript diagram library serving as the basis for camunda's online BPMN modeler.
- [elkjs](https://github.com/kieler/elkjs) - Eclipse Layout Kernel (ELK) graph layout algorithms for JavaScript.
- [force-graph](https://github.com/vasturiano/force-graph) - Force-directed graph component rendered on HTML5 canvas.
- [G6](https://github.com/antvis/g6) - Graph visualization library powered by Javascript & Typescript, maintained by Alibaba
- [JointJS](https://github.com/clientIO/joint) - SVG-based JavaScript diagramming library for interactive diagrams and graph editors.
- [Sigma.js](https://sigmajs.org/) - JavaScript library dedicated to graph drawing.
- [Uber React Digraph](https://github.com/uber/react-digraph) - React.js based directed graph library maintained by UBER.
- [VivaGraph](https://github.com/anvaka/VivaGraphJS) - Graph drawing library for JavaScript.
- [Viz.js](https://github.com/mdaines/viz-js) - Graphviz compiled to WebAssembly for rendering DOT graphs in the browser and Node.js.
- [Vizdom](https://github.com/vizdom-dev/vizdom) - A declarative graph layout and rendering engine for Javascript/Typescript powered by Rust/WebAssembly.
- [Vue Flow](https://github.com/bcakmakoglu/vue-flow) - Flowchart and node-based graph component for Vue 3.
- [X6](https://github.com/antvis/X6) - Diagramming library for DAGs, ER diagrams, flowcharts and other graph editors, maintained by Alibaba.
- [xyflow](https://github.com/xyflow/xyflow) - React Flow and Svelte Flow: libraries for building node-based editors, flow charts and interactive diagrams.

### Financial charts
- [chartjs-chart-financial](https://github.com/chartjs/chartjs-chart-financial) - Chart.js module that adds candlestick and OHLC chart types.
- [dxcharts-lite](https://github.com/devexperts/dxcharts-lite) - Flexible financial charting library based on HTML5 canvas.
- [HQChart](https://github.com/jones2000/HQChart) - K-line and stock charts with a technical indicator scripting engine, for web pages and WeChat mini programs.
- [KLineChart](https://github.com/klinecharts/KLineChart) - Lightweight, highly customizable candlestick (k-line) chart with zero dependencies and mobile support.
- [Lightweight Charts](https://github.com/tradingview/lightweight-charts) - Performant HTML5 canvas financial charts, from TradingView.
- [React Financial Charts](https://github.com/react-financial/react-financial-charts) - React components for financial charts: candlesticks, technical indicators, overlays and drawing tools.
- [TechanJS](https://techanjs.org/) - Stock and financial charts.
- [TradeCanvas](https://github.com/bonguynvan/tradecanvas) - Financial charts with indicators, drawing tools and live feeds, drawn with Canvas 2D or WebGL.
- [Vela](https://github.com/LuxAlgo/Vela) - Financial charting library with a headless core, native WebGL2 renderer and plugin SDK, from LuxAlgo.

### Maps
- [CanvasGlobe](https://github.com/Shree-hari/canvas-globe) - Interactive Canvas 2D globes and flat world maps for JavaScript and React.
- [Cesium](https://github.com/CesiumGS/cesium) - WebGL 3D globes and maps.
- [COBE](https://github.com/shuding/cobe) - Lightweight WebGL globe library of about 5 kB, with configurable markers.
- [DataMaps](https://github.com/markmarkoh/datamaps) - Interactive SVG maps using D3.js.
- [Deck.gl](https://deck.gl/) - WebGL framework for visual exploratory data analysis of large datasets.
- [Dipper](https://github.com/antvis/dipper) - Map application development framework powered by L7, maintained by Alibaba.
- [globe.gl](https://github.com/vasturiano/globe.gl) - UI component for globe data visualization using Three.js/WebGL.
- [Globedots](https://github.com/swamoth/globedots) - Dot-matrix WebGL2 globe in 17 kB with markers, arcs, labels, heat maps, and a day-night line.
- [L7](https://github.com/antvis/L7) - Large-scale WebGL-powered Geospatial Data Visualization analysis framework, maintained by Alibaba
- [L7 Plot](https://github.com/antvis/L7Plot) - Geospatial Visualization Chart Library, maintained by Alibaba
- [Leaflet](https://leafletjs.com) - JavaScript library for mobile-friendly interactive maps.
- [Mapael](https://github.com/neveldo/jQuery-Mapael) - jQuery plugin based on raphael.js to display vector maps.
- [mapcn](https://github.com/AnmolSaini16/mapcn) - Map components for React built on MapLibre GL, styled with Tailwind and compatible with shadcn/ui.
- [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) - WebGL-based interactive vector tile maps in the browser; community fork of Mapbox GL JS.
- [maptalks.js](https://github.com/maptalks/maptalks.js) - Pluggable JavaScript library for integrated 2D/3D maps.
- [OpenLayers](https://github.com/openlayers/openlayers) - Library for interactive web maps with support for many data sources, formats and projections.
- [Pharos AI](https://conflicts.app) - Open-source OSINT conflict-tracking dashboard with geospatial visualization using Deck.gl, MapLibre, and React. ([Source Code](https://github.com/Juliusolsson05/pharos-ai))
- [Potree](https://github.com/potree/potree) - WebGL point cloud viewer for large datasets such as LiDAR scans.
- [React Simple Maps](https://github.com/zcreativelabs/react-simple-maps) - Composable SVG map charts for React, based on d3-geo and TopoJSON.
- [react-map-gl](https://github.com/visgl/react-map-gl) - React components for MapLibre GL JS and Mapbox GL JS, maintained by vis.gl.
- [TerriaJS](https://github.com/TerriaJS/terriajs) - Library for building web-based 2D and 3D geospatial data explorers with catalogs of map layers.
- [VectorAtlas](https://vectoratlas.menelabs.com/) - Free, 80KB SVG world map with one path per country, id-keyed by ISO 3166-1 alpha-2 code, ready for choropleths.

### d3
- [D3.js](https://github.com/d3/d3) - JavaScript library for producing dynamic, data-driven visualizations with SVG, Canvas and HTML.
- See [Awesome D3](https://github.com/wbkd/awesome-d3) for D3 plugins, examples and tutorials.

### React
- [Ant Design Charts](https://github.com/ant-design/ant-design-charts) - React chart library based on AntV, with statistical charts, graphs and maps.
- [BizCharts](https://github.com/alibaba/BizCharts) - Data visualization library based on G2 and React.
- [DevExtreme React Chart](https://devexpress.github.io/devextreme-reactive/react/chart/) - High-performance plugin-based React chart for Bootstrap and Material Design.
- [echarts-for-react](https://github.com/hustcc/echarts-for-react) - React wrapper for Apache ECharts.
- [Graphic Walker](https://github.com/Kanaries/graphic-walker) - An embeddable React component that functions as an open source alternative to Tableau, which allows data scientists to analyze data and visualize patterns with simple drag-and-drop operations.
- [Graphin](https://github.com/antvis/Graphin) - Graph visualization library powered by React & Typescript (built on top of G6), maintained by Alibaba.
- [MUI X Charts](https://github.com/mui/mui-x/tree/master/packages/x-charts) - React chart components from MUI; the community package is MIT-licensed.
- [nivo](https://github.com/plouc/nivo) - Supercharged dataviz components for React with isomorphic ability, [demo](https://nivo.rocks).
- [React Svg Textures](https://github.com/finnfiddle/react-svg-textures) - Textures.js ported to React. Fully isomorphic.
- [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2) - React components for Chart.js.
- [react-force-graph](https://github.com/vasturiano/react-force-graph) - React components for 2D, 3D, VR and AR force-directed graphs.
- [react-plotly.js](https://github.com/plotly/react-plotly.js) - React component for Plotly.js charts, maintained by Plotly.
- [React-vis](https://github.com/uber/react-vis) - React components to build data visualizations.
- [Recharts](https://github.com/recharts/recharts) - Declarative react components to render D3 charts.
- [Semiotic](https://github.com/nteract/semiotic) - React data visualization library for charts, network graphs and streaming data.
- [Tremor](https://github.com/tremorlabs/tremor-npm) - React components for building charts and dashboards, based on Recharts and Tailwind CSS.
- [Victory](https://formidable.com/open-source/victory/) - Composable components for building interactive data visualizations
- [visx](https://github.com/airbnb/visx) - Low-level visualization components that combine D3 with React, by Airbnb.

### React Native
- [F2](https://github.com/antvis/F2) - An elegant, interactive and flexible charting library for mobile, maintained by Alibaba
- [React Native Chart Kit](https://github.com/chart-kit/react-native-chart-kit) - Line, bar, pie, progress and contribution graph charts for React Native.
- [react-native-charts-wrapper](https://github.com/wuxudong/react-native-charts-wrapper) - React Native wrapper for MPAndroidChart and DGCharts on Android and iOS.
- [react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts) - Bar, line, area, pie, radar, bubble and candlestick charts for React Native, with animations.
- [react-native-graph](https://github.com/margelo/react-native-graph) - Animated, high-performance line graphs for React Native, built with Skia.
- [react-native-maps](https://github.com/react-native-maps/react-native-maps) - Map view component for iOS and Android in React Native.
- [Victory Native](https://github.com/FormidableLabs/victory-native-xl) - High-performance charting library for React Native, built on React Native Skia.

### Misc
- [asciichart](https://github.com/kroitor/asciichart) - ASCII line charts for the console in Node.js and browsers, with ports to other languages.
- [blessed-contrib](https://github.com/yaronn/blessed-contrib) - Terminal dashboards with charts, maps, gauges and tables, built with Node.js and ASCII/ANSI art.
- [Flint](https://github.com/microsoft/flint-chart) - Chart specification language from Microsoft that compiles to Vega-Lite, ECharts, Chart.js or Plotly.
- [gp-treemap](https://github.com/imbue-ai/gp-treemap) - Open source HTML canvas treemap component supporting millions of nodes, and some functional resource usage tools, like disk and S3 usage visualization ([GrandPerspective](https://grandperspectiv.sourceforge.net/)-style)
- [Graphology](https://github.com/graphology/graphology) - A robust & multipurpose Graph object for javascript & TypeScript; Serves as a base library to power other graph visualization libraries.
- [Layer Cake](https://github.com/mhkeller/layercake) - Graphics framework for building reusable charts with Svelte.
- [LayerChart](https://github.com/techniq/layerchart) - Composable Svelte chart components for cartesian, radial, hierarchical, graph and geo charts.
- [Mosaic](https://github.com/uwdata/mosaic) - Framework for linking databases such as DuckDB with interactive views to visualize large datasets.
- [ng2-charts](https://github.com/valor-software/ng2-charts) - Angular directives for Chart.js charts.
- [ngx-charts](https://github.com/swimlane/ngx-charts) - Declarative charting framework for Angular, using D3 for math and Angular for rendering.
- [ODataMap](https://github.com/CherishChenCherish/odatamap) - Interactive scientific research data map. Visualizes 250M+ papers across 7 knowledge continents using D3.js. [Demo](https://odatamap.cherishchen2510.workers.dev)
- [Perspective](https://github.com/perspective-dev/perspective) - Interactive analytics and visualization component for large and streaming datasets, built on WebAssembly.
- [Piecon](https://github.com/lipka/piecon) - Pie charts in your favicon.
- [Textures.js](https://riccardoscalco.github.io/textures/) - A library to create SVG patterns.
- [Timeline.js](https://timeline.knightlab.com/) -  Create interactive timelines.
- [Vega](https://vega.github.io/vega/) - Vega is a visualization grammar, a declarative format for creating, saving, and sharing interactive visualization designs.
- [Vega-Lite](https://vega.github.io/vega-lite/) - is a high-level grammar of interactive graphics. It provides a concise JSON syntax for rapidly generating visualizations to support analysis.
- [vis-timeline](https://github.com/visjs/vis-timeline) - Interactive timelines and 2D graphs with items and ranges, from the vis.js project.
- [Vis.js](https://visjs.org/) - A dynamic visualization library including timeline, networks and graphs (2D and 3D).
- [vtk.js](https://github.com/Kitware/vtk-js) - JavaScript implementation of the Visualization Toolkit (VTK) for scientific visualization on the web.
- [Vue Data UI](https://github.com/graphieros/vue-data-ui) - Vue 3 component library of charts, gauges, tables and other data visualizations.
- [vue-chartjs](https://github.com/apertureless/vue-chartjs) - Vue.js wrapper for Chart.js.
- [vue-echarts](https://github.com/ecomfe/vue-echarts) - Vue.js component for Apache ECharts.

## Android tools
- [DecoView](https://github.com/bmarrdev/android-DecoView-charting) - Animated circular wheel chart library.
- [HelloCharts](https://github.com/lecho/hellocharts-android) - Android chart library with line, column, pie, bubble and combo charts, plus zoom and scroll.
- [MPAndroidChart](https://github.com/PhilJay/MPAndroidChart) - A powerful & easy to use chart library.
- [Vico](https://github.com/patrykandpatrick/vico) - Extensible chart library for Jetpack Compose and Compose Multiplatform.
- [WilliamChart](https://github.com/diogobernardino/WilliamChart) - Simple chart library.

## C++ tools
- [F3D](https://github.com/f3d-app/f3d) - Cross-platform, fast, and minimalist 3D viewer with scientific visualization tools.
- [ImPlot](https://github.com/epezent/implot) - Immediate-mode plotting library for Dear ImGui.
- [ImPlot3D](https://github.com/brenocq/implot3d) - Immediate-mode 3D plotting extension for Dear ImGui, inspired by ImPlot.
- [LargeVis](https://github.com/lferry007/LargeVis) - implementation of the [LargeVis paper](https://arxiv.org/abs/1602.00370), used to visualize large-scale and high-dimensional data.
- [MapLibre Native](https://github.com/maplibre/maplibre-native) - Interactive vector tile map rendering for iOS, Android and other native platforms.
- [Mapnik](https://github.com/mapnik/mapnik) - Toolkit for rendering maps, widely used to render OpenStreetMap tiles.
- [Matplot++](https://github.com/alandefreitas/matplotplusplus) - C++ graphics library for data visualization with a MATLAB-like API.
- [OpenSpace](https://github.com/OpenSpace/OpenSpace) - Interactive software for visualizing the known universe, from astronomy catalogs to space missions.
- [ParaView](https://github.com/Kitware/ParaView) - Multi-platform data analysis and visualization application based on VTK.
- [PlotJuggler](https://github.com/PlotJuggler/PlotJuggler) - open-source Qt5 application to plot charts (based on Qwt).
- [Polyscope](https://github.com/nmwsharp/polyscope) - Viewer and user interface for 3D geometry processing.
- [QCustomPlot](https://www.qcustomplot.com/) - Qt C++ widget for plotting and data visualization.
- [ROOT](https://github.com/root-project/root) - CERN framework for analyzing, storing and visualizing large scientific datasets.
- [Serial Studio](https://github.com/Serial-Studio/Serial-Studio) - Real-time telemetry dashboard for data from serial ports, Bluetooth LE, network sockets and other sources.
- [TTK](https://github.com/topology-tool-kit/ttk) - Topological data analysis and visualization.
- [VisIt](https://github.com/visit-dav/visit) - Visualization and analysis tool for large mesh-based scientific data, developed at LLNL.
- [Visualization Toolkit (VTK)](https://github.com/Kitware/VTK) - open-source library for 3d Graphics, image processing and visualization.

## Dashboards and BI
- [Apache Superset](https://github.com/apache/superset) - Data exploration and visualization platform with a no-code chart builder, SQL IDE and dashboards.
- [DataLens](https://github.com/datalens-tech/datalens) - Business intelligence and data visualization system, originally developed at Yandex.
- [datart](https://github.com/running-elephant/datart) - Data visualization platform for building reports, dashboards and data stories.
- [Evidence](https://github.com/evidence-dev/evidence) - Business intelligence as code: build reports and dashboards with SQL and Markdown.
- [Grafana](https://github.com/grafana/grafana) - Observability and data visualization platform for metrics, logs and traces from many data sources.
- [Kibana](https://github.com/elastic/kibana) - Visualization and dashboard UI for data stored in Elasticsearch.
- [Lightdash](https://github.com/lightdash/lightdash) - BI tool that turns dbt projects into metrics, charts and dashboards.
- [Metabase](https://github.com/metabase/metabase) - Business intelligence tool for querying data and building dashboards, with embedded analytics.
- [Observable Framework](https://github.com/observablehq/framework) - Static site generator for data apps, dashboards and reports using JavaScript, SQL and Markdown.
- [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards) - Visualization and dashboard UI for OpenSearch; Apache-2.0 fork of Kibana 7.10.
- [Perses](https://github.com/perses/perses) - CNCF dashboard tool and open dashboard specification for observability data such as Prometheus metrics.
- [Redash](https://github.com/getredash/redash) - Query data sources with SQL, then visualize the results and build dashboards.
- [Rill](https://github.com/rilldata/rill) - BI tool for fast, metrics-first dashboards powered by OLAP engines such as DuckDB and ClickHouse.

## Flutter tools
- [fl_chart](https://github.com/imaNNeo/fl_chart) - Customizable Flutter chart library with line, bar, pie, scatter and radar charts.
- [flutter_map](https://github.com/fleaflet/flutter_map) - Vendor-free, customizable interactive map package for Flutter.
- [Graphic](https://github.com/entronad/graphic) - Grammar of graphics data visualization and charting library for Flutter.

## Golang tools
- [asciigraph](https://github.com/guptarohit/asciigraph) - Lightweight ASCII line graphs for command-line apps.
- [go-diagrams](https://github.com/blushft/go-diagrams) - Diagram-as-code library for system architecture diagrams in Go, rendered with Graphviz.
- [go-echarts](https://github.com/go-echarts/go-echarts) - Simple yet powerful data visualizing library for Go.
- [plot](https://github.com/gonum/plot) - API for building and drawing plots in Go.
- [svgo](https://github.com/ajstarks/svgo) - Go Language Library for SVG generation.
- [termdash](https://github.com/mum4k/termdash) - Terminal-based dashboard library with line charts, bar charts, gauges and donuts.
- [termui](https://github.com/gizak/termui) - Terminal dashboard and widget library with charts, gauges, sparklines and more.

## iOS tools
- [BEMSimpleLineGraph](https://github.com/Boris-Em/BEMSimpleLineGraph) - Highly customizable and interactive line graphs.
- [Charts](https://github.com/ChartsOrg/Charts) -  iOS port of MPAndroidChart. You can create charts for both platforms with very similar code.
- [ChartView](https://github.com/AppPear/ChartView) - Line, bar and pie chart views built with SwiftUI.
- [Core Plot](https://github.com/core-plot/core-plot) - 2D plotting framework for macOS, iOS and tvOS.
- [JBChartView](https://github.com/Jawbone/JBChartView) - Charting library for both line and bar graphs.
- [PNChart](https://github.com/kevinzhow/PNChart) - A simple and beautiful chart lib used in Piner and CoinsMan.
- [SwiftCharts](https://github.com/ivnsch/SwiftCharts) - Customizable charts library for iOS.

## Julia tools
- [AlgebraOfGraphics.jl](https://github.com/MakieOrg/AlgebraOfGraphics.jl) - Algebraic grammar-of-graphics visualization for Julia, built on Makie.
- [Gadfly.jl](https://github.com/GiovineItalia/Gadfly.jl) - Statistical graphics for Julia based on the grammar of graphics.
- [Makie](https://github.com/MakieOrg/Makie.jl) - Interactive, high-performance plotting ecosystem for Julia with OpenGL, WebGL and Cairo backends.
- [Plots.jl](https://github.com/JuliaPlots/Plots.jl) - Plotting meta-package for Julia with a single API over multiple backends.
- [UnicodePlots.jl](https://github.com/JuliaPlots/UnicodePlots.jl) - Unicode-based scientific plotting in the terminal for Julia.

## JVM tools
- [JFreeChart](https://github.com/jfree/jfreechart) - 2D chart library for Java applications using Swing, JavaFX or server-side rendering.
- [Kandy](https://github.com/Kotlin/kandy) - Kotlin plotting library with a typed DSL, developed by JetBrains.
- [Lets-Plot for Kotlin](https://github.com/JetBrains/lets-plot-kotlin) - Grammar of graphics plotting API for Kotlin, built on Lets-Plot.
- [XChart](https://github.com/knowm/XChart) - Lightweight Java library for plotting data.

## Machine Learning tools
- [Aim](https://github.com/aimhubio/aim) - Experiment tracker with a UI to explore and compare ML runs and metrics.
- [BertViz](https://github.com/jessevig/bertviz) - Visualize attention in Transformer language models such as BERT and GPT-2.
- [Comet](https://github.com/comet-ml/comet-examples) - An MLOps platform for tracking, visualizing, and debugging your machine learning workflows from training straight through to production.
- [dtreeviz](https://github.com/parrt/dtreeviz) - Decision tree visualization and model interpretation library for Python.
- [Embedding Atlas](https://github.com/apple/embedding-atlas) - Interactive visualization of large embeddings with search, filtering and density views, by Apple.
- [FiftyOne](https://github.com/voxel51/fiftyone) - Tool for visualizing, curating and evaluating computer vision datasets and models.
- [LIT](https://github.com/PAIR-code/lit) - Learning Interpretability Tool: interactive visual analysis of ML model behavior, by Google PAIR.
- [Model Explorer](https://github.com/google-ai-edge/model-explorer) - Hierarchical graph visualizer and debugger for ML models, from Google.
- [Netron](https://github.com/lutzroeder/netron) - Viewer for neural network, deep learning and machine learning models.
- [NN-SVG](https://github.com/alexlenail/NN-SVG) - Web tool for drawing publication-ready neural network architecture diagrams and exporting them to SVG.
- [Opik](https://github.com/comet-ml/opik) - Formerly CometLLM. Debug, evaluate, and monitor LLM applications with tracing and dashboards.
- [Phoenix](https://github.com/Arize-ai/phoenix) - ML observability in a notebook with UMAP visualizations
- [PlotNeuralNet](https://github.com/HarisIqbal88/PlotNeuralNet) - LaTeX code for drawing neural network architecture diagrams.
- [TensorBoard](https://github.com/tensorflow/tensorboard) - TensorFlow's visualization toolkit for metrics, model graphs, embeddings and more.
- [TensorWatch](https://github.com/microsoft/tensorwatch) - Debugging and visualization tool for data science and machine learning
- [Visdom](https://github.com/fossasia/visdom) - Tool for real-time visualization and monitoring of live data such as ML experiments.
- [VisualDL](https://github.com/PaddlePaddle/VisualDL) - Deep learning visualization toolkit for metrics, graphs, embeddings and more, from PaddlePaddle.
- [Yellowbrick](https://github.com/DistrictDataLabs/yellowbrick) - Visual analysis and diagnostic tools for machine learning model selection with scikit-learn.

## .NET tools
- [LiveCharts2](https://github.com/Live-Charts/LiveCharts2) - Animated, interactive charts, maps and gauges for .NET UI frameworks.
- [Mapsui](https://github.com/Mapsui/Mapsui) - .NET map component for MAUI, Avalonia, Uno Platform, Blazor, WPF and WinUI.
- [Microcharts](https://github.com/microcharts-dotnet/Microcharts) - Simple cross-platform charts for .NET, drawn with SkiaSharp.
- [MSAGL](https://github.com/microsoft/automatic-graph-layout) - Microsoft Automatic Graph Layout: tools for graph layout and viewing in .NET.
- [OxyPlot](https://github.com/oxyplot/oxyplot) - Cross-platform plotting library for .NET.
- [Plotly.NET](https://github.com/plotly/Plotly.NET) - Interactive charts for F# and C#, based on Plotly.js.
- [ScottPlot](https://github.com/ScottPlot/ScottPlot) - Interactive plotting library for .NET with WinForms, WPF, Avalonia, Blazor and other controls.
- [XCharts](https://github.com/XCharts-Team/XCharts) - Charting and data visualization library for Unity, built on UGUI.

## Python tools
- [altair](https://altair-viz.github.io/) - Declarative statistical visualizations, based on Vega-Lite.
- [bokeh](https://bokeh.org/) - Interactive Web Plotting for Python.
- [bqplot](https://github.com/bqplot/bqplot) - Plotting library for IPython/Jupyter notebooks.
- [Cartopy](https://github.com/SciTools/cartopy) - Cartographic projections and geospatial data plotting with matplotlib.
- [Chartify](https://github.com/spotify/chartify) - Bokeh wrapper that makes it easy for data scientists to create charts.
- [D-Tale](https://github.com/man-group/dtale) - Web-based visual explorer for pandas DataFrames with charts, summaries and correlations.
- [Dash](https://github.com/plotly/dash) - Framework for building data apps and dashboards in Python, built on Plotly.js and React.
- [Datashader](https://github.com/holoviz/datashader) - Renders very large datasets into accurate images by rasterizing them.
- [diagram](https://github.com/tehmaze/diagram) - Text mode diagrams using UTF-8 characters
- [fastplotlib](https://github.com/fastplotlib/fastplotlib) - GPU-accelerated plotting library built on WGPU and pygfx for fast interactive visualization.
- [folium](https://github.com/python-visualization/folium) - Builds interactive Leaflet.js maps from Python data.
- [ggplot](https://github.com/yhat/ggpy) - plotting system based on [R's](#r-tools) ggplot2.
- [glumpy](https://github.com/glumpy/glumpy) - OpenGL scientific visualizations library.
- [holoviews](https://holoviews.org/) - Complex and declarative visualizations from annotated data.
- [hvPlot](https://github.com/holoviz/hvplot) - High-level plotting API for pandas, xarray, Dask, NetworkX and other data structures, built on HoloViews.
- [ipychart](https://github.com/nicohlr/ipychart) - The power of Chart.js in Jupyter Notebook.
- [ipyleaflet](https://github.com/jupyter-widgets/ipyleaflet) - Interactive Leaflet maps in Jupyter notebooks, built on ipywidgets.
- [leafmap](https://github.com/opengeos/leafmap) - Interactive mapping and geospatial analysis in Jupyter with multiple mapping backends.
- [Lets-Plot](https://github.com/JetBrains/lets-plot) - Grammar of graphics plotting library for Python and Kotlin, by JetBrains.
- [LIDA](https://github.com/microsoft/lida) - Generates visualizations and infographics from data with large language models, from Microsoft.
- [lightweight-charts-python](https://github.com/louisnw01/lightweight-charts-python) - Python interface to TradingView's Lightweight Charts for financial charts.
- [Lonboard](https://github.com/developmentseed/lonboard) - Fast, interactive geospatial data visualization in Jupyter, built on deck.gl and GeoArrow.
- [matplotlib](https://matplotlib.org/) - 2D plotting library.
- [mayavi](https://docs.enthought.com/mayavi/mayavi/) - interactive scientific data visualization and 3D plotting in Python.
- [missingno](https://github.com/ResidentMario/missingno) - provides flexible toolset of data-visualization utilities that allows quick visual summary of the completeness of your dataset, based on matplotlib.
- [mpld3](https://github.com/mpld3/mpld3) - Renders matplotlib figures as interactive D3.js graphics in the browser.
- [mplfinance](https://github.com/matplotlib/mplfinance) - Financial market data visualization (candlestick, OHLC, volume) using matplotlib.
- [napari](https://github.com/napari/napari) - Fast, interactive viewer for multi-dimensional images in Python.
- [Panel](https://github.com/holoviz/panel) - Data exploration and web app framework for Python that works with many plotting libraries.
- [Plotext](https://github.com/piccolomo/plotext) - Plots data directly in the terminal with a matplotlib-like syntax.
- [plotly](https://plotly.com/python/) - Interactive web based visualization built on top of [plotly.js](https://github.com/plotly/plotly.js)
- [plotnine](https://github.com/has2k1/plotnine) - Grammar of graphics for Python, based on R's ggplot2.
- [pptk](https://github.com/heremaps/pptk) - Visualize and work with 2D/3D pointclouds
- [prettymaps](https://github.com/marceloprates/prettymaps) - Draws stylized maps from OpenStreetMap data, using osmnx and matplotlib.
- [pyecharts](https://github.com/pyecharts/pyecharts) - Python binding for Echarts library.
- [pygal](https://github.com/Kozea/pygal) - SVG charting library for Python with many chart types and interactive output.
- [PyGMT](https://github.com/GenericMappingTools/pygmt) - Python interface to the Generic Mapping Tools (GMT) for maps and figures in the geosciences.
- [PyGWalker](https://github.com/Kanaries/pygwalker) - Turns dataframes into a drag-and-drop visual analysis UI in Jupyter, based on Graphic Walker.
- [PyQtGraph](https://www.pyqtgraph.org/) - Interactive and realtime 2D/3D/Image plotting and science/engineering widgets.
- [PyVista](https://github.com/pyvista/pyvista) – 3D plotting and mesh analysis through a streamlined interface for the Visualization Toolkit (VTK)
- [Quibbler](https://github.com/Technion-Kishony-lab/quibbler) - Your data and anything you plot is effortlessly live and interactive.
- [Rerun](https://github.com/rerun-io/rerun) - An SDK for logging computer vision and robotics data paired with a visualizer for exploring that data over time.
- [scattertext](https://github.com/JasonKessler/scattertext) - Interactive scatterplot visualizations of how language differs between groups of documents.
- [SciencePlots](https://github.com/garrettj403/SciencePlots) - Matplotlib styles for scientific figures and journal publications.
- [seaborn](https://seaborn.pydata.org/) - A library for making attractive and informative statistical graphics.
- [Shiny for Python](https://github.com/posit-dev/py-shiny) - Python version of the Shiny reactive framework for interactive data apps.
- [Streamlit](https://github.com/streamlit/streamlit) - Framework for turning Python scripts into interactive data apps.
- [Sweetviz](https://github.com/fbdesignpro/sweetviz) - Generates self-contained HTML reports that visualize and compare datasets for exploratory analysis.
- [syd](https://github.com/landoskape/syd) - A package for making GUIs around matplotlib figures easy, fast, and streamlined.
- [Taipy](https://github.com/Avaiga/taipy) - Python framework for building data and AI web applications with interactive charts and dashboards.
- [termgraph](https://github.com/mkaz/termgraph) - Draws bar charts, histograms and other basic graphs in the terminal, as a CLI or Python library.
- [three.py](https://github.com/stemkoski/three.py/) - Easy to use 3D library based on PyOpenGL. Inspired by Three.js.
- [toyplot](https://toyplot.readthedocs.io/en/stable/) - The kid-sized plotting toolkit for Python with grownup-sized goals.
- [uniplot](https://github.com/olavolav/uniplot) - Lightweight plotting to the terminal. 4x resolution via Unicode.
- [vedo](https://github.com/marcomusy/vedo) - Library for scientific analysis and visualization of 3D objects based on VTK.
- [veusz](https://veusz.github.io/) - Python multiplatform GUI plotting tool and graphing library
- [viser](https://github.com/viser-project/viser) - Web-based 3D visualization library for computer vision and robotics, with GUI building blocks.
- [VisPy](https://vispy.org/) - High-performance scientific visualization based on OpenGL.
- [Vizro](https://github.com/mckinsey/vizro) - Low-code toolkit from McKinsey for building data visualization apps and dashboards, built on Dash.
- [Voilà](https://github.com/voila-dashboards/voila) - Turns Jupyter notebooks into standalone interactive web applications.
- [vtk](https://www.vtk.org/) - 3D computer graphics, image processing, and visualization that includes a Python interface.
- [WordCloud](https://github.com/amueller/word_cloud) - Word cloud generator for Python.
- [ydata-profiling](https://github.com/Data-Centric-AI-Community/fg-data-profiling) - Generates statistical analytic reports with visualization for quick data analysis (formerly pandas-profiling).
- [yt](https://github.com/yt-project/yt) - Toolkit for analysis and visualization of volumetric data.

## R tools
- [circlize](https://github.com/jokergoo/circlize) - Circular visualization in R, such as chord diagrams and Circos-style genomic plots.
- [ComplexHeatmap](https://github.com/jokergoo/ComplexHeatmap) - Highly customizable heatmaps for genomic and other matrix data (Bioconductor).
- [DiagrammeR](https://github.com/rich-iannone/DiagrammeR) - Graph and network diagrams in R, rendered with Graphviz and mermaid.
- [esquisse](https://github.com/dreamRs/esquisse) - Drag-and-drop interface for building ggplot2 charts in RStudio or Shiny.
- [gganimate](https://github.com/thomasp85/gganimate) - Grammar of animated graphics that extends ggplot2.
- [ggiraph](https://github.com/davidgohel/ggiraph) - Makes ggplot2 graphics interactive, with tooltips, hover effects and selections.
- [ggplot2](https://ggplot2.tidyverse.org/) - A plotting system based on the grammar of graphics.
- [ggpubr](https://github.com/kassambara/ggpubr) - ggplot2-based functions for publication-ready plots with statistical annotations.
- [ggraph](https://github.com/thomasp85/ggraph) - Grammar of graphics for graphs and networks, extending ggplot2.
- [ggrepel](https://github.com/slowkow/ggrepel) - Repels overlapping text labels away from each other in ggplot2 plots.
- [ggstatsplot](https://github.com/IndrajeetPatil/ggstatsplot) - ggplot2-based plots with statistical test details included in the graphic.
- [ggvis](https://ggvis.rstudio.com/) - A data visualization package with a syntax similar to ggplot2 which allows you to create rich interactive graphics.
- [gt](https://github.com/rstudio/gt) - Builds publication-quality display tables in R.
- [htmlwidgets](https://github.com/ramnathv/htmlwidgets) - Framework for binding JavaScript visualization libraries to R, for use in R Markdown and Shiny.
- [lattice](https://lattice.r-forge.r-project.org) - trellis graphics for R
- [Leaflet for R](https://github.com/rstudio/leaflet) - R interface to the Leaflet JavaScript library for interactive maps.
- [patchwork](https://github.com/thomasp85/patchwork) - Composes multiple ggplot2 plots into a single figure.
- [plotly](https://github.com/plotly/plotly.R) - Interactive charts (including adding interactivity to ggplot2 output), cartograms and simple network diagrams
- [rayshader](https://github.com/tylermorganwall/rayshader) - 2D and 3D mapping and data visualization in R, including 3D renders of ggplot2 plots.
- [rbokeh](https://hafen.github.io/rbokeh/) - R Interface to Bokeh.
- [rgl](https://cran.r-project.org/web/packages/rgl/index.html) - 3D Visualization Using OpenGL
- [shiny](https://shiny.rstudio.com) - Framework for creating interactive applications/visualisations
- [tmap](https://github.com/r-tmap/tmap) - Thematic maps in R, with a ggplot2-like layered syntax and static or interactive output.
- [visNetwork](https://datastorm-open.github.io/visNetwork/) - Interactive network visualisations

## Ruby tools
- [Blazer](https://github.com/ankane/blazer) - Business intelligence tool for Rails apps: explore data with SQL and build charts and dashboards.
- [Chartkick](https://github.com/ankane/chartkick) - Create charts with one line of Ruby.
- [Gruff](https://github.com/topfunky/gruff) - Graphing library for Ruby that renders charts as images using RMagick.
- [YouPlot](https://github.com/red-data-tools/YouPlot) - Command-line tool that draws plots in the terminal from piped data.

## Rust tools
- [Charming](https://github.com/yuankunzhang/charming) - Chart rendering library for Rust powered by Apache ECharts.
- [malevich](https://github.com/shergin/malevich) - Terminal plotting: line, scatter, bar, histogram, heatmap, box plot, violin and more, with automatic axes.
- [Plotly.rs](https://github.com/plotly/plotly.rs) - Plotly.js-based interactive plotting library for Rust.
- [Plotters](https://github.com/plotters-rs/plotters) - Drawing library for data plotting in Rust, with bitmap, SVG, WebAssembly and GUI backends.

## Markup-based tools
- [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) - PlantUML macros and styles for drawing software architecture diagrams with the C4 model.
- [CeTZ](https://github.com/cetz-package/cetz) - Drawing library for Typst with a TikZ-inspired API, for diagrams and plots.
- [D2](https://github.com/d2lang/d2) - Declarative diagram scripting language that turns text into diagrams.
- [Diagrams](https://github.com/mingrammer/diagrams) - Diagram as code in Python for prototyping cloud system architectures.
- [Flowchart Fun](https://github.com/tone-row/flowchart-fun) - Web app that generates flowcharts and diagrams from indented text.
- [flowchart.js](https://github.com/adrai/flowchart.js) - Draws SVG flowcharts from a textual description.
- [Kroki](https://github.com/yuzutech/kroki) - Unified API that renders diagrams from many text formats, including PlantUML, Mermaid, Graphviz and D2.
- [LikeC4](https://github.com/likec4/likec4) - Architecture-as-code language and tools that generate live, interactive diagrams.
- [Markmap](https://github.com/markmap/markmap) - Builds interactive mind maps from Markdown.
- [Mermaid](https://github.com/mermaid-js/mermaid) - Generate diagrams and flowcharts from markdown-like text definitions, with a [live editor](https://mermaid.live).
- [nomnoml](https://github.com/skanaar/nomnoml) - Draws UML diagrams from a simple text syntax.
- [Penrose](https://github.com/penrose/penrose) - Creates diagrams from mathematical notation in plain text, from Carnegie Mellon University.
- [PGF/TikZ](https://github.com/pgf-tikz/pgf) - TeX packages for programmatically drawing vector graphics and diagrams in LaTeX.
- [PGFPlots](https://github.com/pgf-tikz/pgfplots) - TeX package for drawing 2D and 3D plots directly in LaTeX documents.
- [PlantUML](https://github.com/plantuml/plantuml) - Generates UML, Gantt, mind map and other diagrams from plain text.
- [Svgbob](https://github.com/ivanceras/svgbob) - Converts ASCII art diagrams into SVG.
- [WaveDrom](https://wavedrom.com/) - Draws timing diagrams and waveforms from simple textual descriptions.

## Other tools
Tools that are not tied to a particular platform or language.
- [Charted](https://github.com/mikesall/charted) - A charting tool that produces automatic, shareable charts from any data file.
- [csvtodashboard](https://csvtodashboard.com) - Turn a CSV or Excel file into an auto-built dashboard in the browser - client-side, no upload.
- [Cytoscape](https://github.com/cytoscape/cytoscape) - Desktop platform for network analysis and visualization, widely used in bioinformatics.
- [DAC](https://github.com/bruin-data/dac) - Dashboard-as-code tool that builds interactive dashboards from YAML and TSX definitions
- [Data Formulator](https://github.com/microsoft/data-formulator) - AI-assisted tool for transforming data and creating visualizations, from Microsoft Research.
- [FlameGraph](https://github.com/brendangregg/FlameGraph) - Stack trace visualizer that generates interactive SVG flame graphs from profiling data.
- [GeoLibre](https://github.com/opengeos/GeoLibre) - Cloud-native GIS app for visualizing and analyzing geospatial data on the web, desktop and mobile.
- [Gephi](https://github.com/gephi/gephi) - An open-source platform for visualizing and manipulating large graphs
- [GMT](https://github.com/GenericMappingTools/gmt) - Command-line tools for processing geographic data and making publication-quality maps and plots.
- [gnuplot](http://www.gnuplot.info/) - Command-line driven program for 2D and 3D plots, with many output formats.
- [Gource](https://github.com/acaudwell/Gource) - Animated visualization of software version control history.
- [Graphviz](https://graphviz.org/) - Open source graph visualization command line tool and library. From input text to SVG,PDF,interactive web graph browser.
- [ink-uplot](https://github.com/planadecu/ink-uplot) - Render uPlot charts in the terminal (React Ink) with truecolor Unicode and kitty/sixel/iTerm2 graphics.
- [JSON Crack](https://github.com/AykutSarac/jsoncrack.com) - Visualizes JSON, YAML, XML and CSV data as interactive graphs.
- [Kepler.gl](https://kepler.gl/) - Geospatial analysis tool for large-scale data sets.
- [LabPlot](https://github.com/KDE/labplot) - KDE application for interactive scientific plotting, data analysis and visualization.
- [mcp-server-chart](https://github.com/antvis/mcp-server-chart) - MCP server from AntV that lets AI agents generate more than 25 chart types.
- [Orange](https://github.com/biolab/orange3) - Visual programming tool for data mining, machine learning and interactive data visualization.
- [Plotivy](https://plotivy.app/) - Scientific data visualization tool, with AI-generated reproducible Python code, and research-oriented design best practices built in.
- [QGIS](https://github.com/qgis/QGIS) - Desktop geographic information system for viewing, editing, analyzing and mapping geospatial data.
- [RATH](https://github.com/Kanaries/Rath) - Automatic Exploratory Data Analysis & Data Visualization tool which is powered by an AI-assisted Augmented Analytics engine.
- [RAW](https://rawgraphs.io) - Create web visualizations from CSV or Excel files.
- [Resseract Lite](https://github.com/abistarun/resseract-lite) - A Data Analytics and Visualization Tool with flexible architecture to visualize and analyse data
- [Sampler](https://github.com/sqshq/sampler) - Terminal dashboard that runs shell commands and visualizes their output, configured with YAML.
- [SandDance](https://github.com/microsoft/SandDance) - Visual data exploration and presentation with animated unit visualizations, from Microsoft Research.
- [sankeydiagram.net](https://sankeydiagram.net/) - Web app for creating and sharing Sankey diagrams of flows and budgets without code.
- [SankeyMATIC](https://github.com/nowthis/sankeymatic) - Web tool for building Sankey diagrams from a plain-text description of flows.
- [Spark](https://github.com/holman/spark) - Sparklines for the shell. It has several [implementations in different languages](https://github.com/holman/spark/wiki/Alternative-Implementations).
- [sqliteviz](https://github.com/lana-k/sqliteviz) - Browser app that loads CSV, JSON or SQLite files, runs SQL and charts the results offline.
- [Squey](https://squey.org) - Visualization software for exploring and understanding large amounts of tabular data (using parallel coordinates, timeseries and scatter plots).
- [ttyplot](https://github.com/tenox7/ttyplot) - Real-time terminal plotting utility that reads data from standard input.
- [uMap](https://github.com/umap-project/umap) - Web app for creating maps with OpenStreetMap layers and embedding them in websites.
- [VisiData](https://github.com/saulpw/visidata) - Terminal spreadsheet multitool for exploring and arranging tabular data, with basic plotting.

# Resources

## Books
- [Design for Information](https://www.amazon.com/Design-Information-Introduction-Histories-Visualizations/dp/1592538061) by Isabel Meirelles.
- [The Best American Infographics 2014](https://www.amazon.com/Best-American-Infographics-2014/dp/0547974515) by Gareth Cook.
- [The Grammar of Graphics](https://www.amazon.com/Grammar-Graphics-Statistics-Computing/dp/0387245448/) by Leland Wilkinson. Basic visualization theory.
- [The Visual Display of Quantitative Information](https://www.amazon.com/Visual-Display-Quantitative-Information/dp/0961392142) by Edward Tufte.
- [The Wall Street Journal Guide to Information Graphics](https://www.amazon.com/Street-Journal-Guide-Information-Graphics/dp/0393347281) by Dona M. Wong
- [Visualization Analysis and Design](https://www.amazon.com/Visualization-Analysis-Design-AK-Peters/dp/1466508914) by Tamara Munzner.
- [R in Action, Third Edition](https://www.manning.com/books/r-in-action-third-edition) by Robert I. Kabacoff. A complete learning resource for R and tidyverse.
- [Everyday Data Visualization](https://www.manning.com/books/everyday-data-visualization) by Desireé Abbott. A field guide for design techniques that will improve the charts, reports, and data dashboards you build every day.
- [Interactive Data Visualization for the Web](https://chimera.labs.oreilly.com/books/1230000000345) by Scott Murray. Available to read online. Focused on D3.
- [Data Visualisation: A Handbook for Data Driven Design](https://www.amazon.com/Data-Visualisation-Handbook-Driven-Design/dp/1526468921/) by Andy Kirk

## Catalogs
- [The Data Visualization Catalogue](https://www.datavizcatalogue.com) - A collection of data visualization methods, with pros and cons.
- [Data Viz Project](https://datavizproject.com)
- [The R Graph Gallery](https://www.r-graph-gallery.com)
- [From data to Viz](https://www.data-to-viz.com)
- [Chartopedia](https://www.anychart.com/chartopedia)
- [Interactive Chart Chooser](https://depictdatastudio.com/charts/) by Depict Data Studio
- Wikipedia
  - [Data visualization techniques](https://en.wikipedia.org/wiki/Data_visualization#Techniques)
  - [List of graphical methods](https://en.wikipedia.org/wiki/List_of_graphical_methods)
  - [Types of diagrams](https://en.wikipedia.org/wiki/Diagram#Gallery_of_diagram_types)
  - [Types of plots](https://en.wikipedia.org/wiki/Plot_(graphics)#Types_of_plots)
  - [Types of charts](https://en.wikipedia.org/wiki/Chart#Types)

## Podcasts
- [Data Stories](https://datastori.es/)
- [DataFramed](https://www.datacamp.com/community/podcast)
- [Data Viz Today](https://dataviztoday.com/)

## Twitter accounts
- [Alberto Cairo](https://twitter.com/albertocairo)
- [Andrei Kashcha](https://twitter.com/anvaka)
- [Benjamin Wiederkehr](https://twitter.com/datavis)
- [Jan Žák](https://twitter.com/zakjan)
- [Mara Averick](https://twitter.com/dataandme)
- [Martin Wattenberg](https://twitter.com/wattenberg)
- [Mike Bostock](https://twitter.com/mbostock)
- [Nadieh Bremer](https://twitter.com/NadiehBremer)
- [NYT Graphics](https://twitter.com/nytgraphics)
- [Visualizing](https://twitter.com/VisualizingOrg)

## Websites
- [Ann K. Emery](https://annkemery.com/)'s blog
- [Data Visualization Society](https://www.datavisualizationsociety.com/) - The Data Visualization Society is an organization dedicated to fostering community for data visualization professionals.
- [eagereyes](https://eagereyes.org/)
- [EvergreenData](https://stephanieevergreen.com/)
- [Global Data Tracker](https://globaldatatracker.com/) - Interactive country-statistics explorer with historical charts and globe views.
- [FlowingData](https://flowingdata.com/)
- [Information is Beautiful](https://www.informationisbeautiful.net/)
- [Junk Charts](https://junkcharts.typepad.com/) - Kaiser Fung takes apart why certain datavizes work/don't work
- [Lisa Rost thinks and discusses about why we dataviz](https://lisacharlotterost.github.io/)
- [Makeover Monday](https://www.makeovermonday.co.uk/) blog - [#MakeoverMonday](https://twitter.com/search?q=%23makeovermonday) on twitter
- [Plottie](https://plottie.art) - Open-access library of scientific plots for inspiration and AI visualization tool.
- [The Open News](https://source.opennews.org/articles/) blog -  Open news has some good dataviz related articles from time to time
- [The Planet Thinks](https://theplanetthinks.com/) - Real-time visualization of Wikipedia edits on a 3D globe
- [The Pudding](https://pudding.cool/)
- [Truth & Beauty Operations](https://truth-and-beauty.net/)
- [University of Washington Interactive Data Lab Papers](https://idl.cs.washington.edu/papers)
- [vis4.net](https://www.vis4.net/blog/) - Random thoughts on visualization and data journalism by Gregor Aisch
- [VivaMap](https://vivamap.ch) - Interactive quality-of-life map of Swiss and Dutch municipalities, scored on an H3 hexagon grid.
- [Marble Taxonomy Explorer](https://ashutoshsinghpr7.github.io/marble-taxonomy-explorer/) - Interactive knowledge graph visualization of 1,590 learning topics using Cytoscape.js with force-directed, concentric, and BFS layouts. [Source](https://github.com/ashutoshsinghpr7/marble-taxonomy-explorer)

# Contributing

- Please check for duplicates first.
- Use the format `- [Name](https://github.com/owner/repo) - Short description.` and link to the source repository when there is one.
- Keep descriptions short, simple and unbiased.
- Please make an individual commit for each suggestion
- Add a new category if needed.
- The website is rebuilt from this file automatically; see [site/](site/) for how it works.

Thanks for your suggestions!

# Contributors

- Fabio Souto originally createad this repo, connect with Fabio at [fabiosouto.me](https://fabiosouto.me/).
- [Javier Luraschi](https://github.com/javierluraschi) is the current maintainer.
- [Hal9](https://hal9.com) is the corporate sponsor.

# License

Released under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](LICENSE).


- - -

If you have any question about this opinionated list, do not hesitate to contact me [@javierluraschi](https://twitter.com/javierluraschi) on Twitter or [open a GitHub issue](https://github.com/hal9ai/awesome-dataviz/issues/new).
