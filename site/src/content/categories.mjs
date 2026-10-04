// Editorial metadata for each README section: URL slug, page titles and a
// short guide. `[[slug]]` / `[[slug|text]]` in intros become links to tool
// pages when the tool is listed (plain text otherwise), so guides stay valid
// as the list changes. Keys are "Parent > Section" or "Section".

import { slugify } from '../util.mjs';

export const GROUPS = [
  { key: 'javascript', title: 'JavaScript & web' },
  { key: 'python', title: 'Python' },
  { key: 'r', title: 'R' },
  { key: 'native', title: 'Systems & compiled languages' },
  { key: 'mobile', title: 'Mobile' },
  { key: 'apps', title: 'Apps, dashboards & diagrams' },
];

const META = {
  'JavaScript tools > Charting libraries': {
    label: 'JS charting',
    slug: 'javascript-charting-libraries',
    short: 'js',
    group: 'javascript',
    language: 'JavaScript',
    title: 'JavaScript charting libraries',
    noun: 'JavaScript charting library',
    summary: 'Libraries for line, bar, area, pie, scatter and other standard charts in the browser.',
    intro: [
      'Libraries for drawing standard charts (line, bar, area, pie, scatter and more) in the browser. They differ mostly in rendering technology, in how charts are configured, and in licensing. SVG output is easy to style, inspect and make accessible; Canvas and WebGL renderers scale to far more data points.',
      'Start with data size and interactivity: SVG libraries are comfortable up to a few thousand marks, while Canvas-based libraries such as [[chart-js]] and [[echarts]] handle much larger series. Then compare configuration style (declarative options objects versus code), framework wrappers, accessibility support and whether the license fits your product.',
    ],
  },
  'JavaScript tools > Charting libraries for graphs': {
    label: 'JS graphs & networks',
    slug: 'javascript-graph-visualization',
    short: 'graph',
    group: 'javascript',
    language: 'JavaScript',
    title: 'JavaScript graph & network visualization libraries',
    noun: 'JavaScript graph visualization library',
    summary: 'Node-link diagrams for networks, dependency graphs and knowledge graphs.',
    intro: [
      'Libraries for drawing node-link diagrams: social networks, dependency graphs, knowledge graphs, flowcharts and other relational data. Most pair a renderer with layout algorithms (force-directed, hierarchical, circular) and interactions such as dragging, zooming and selecting nodes.',
      'Graph size decides a lot: [[sigma-js]] renders with WebGL to keep large graphs interactive, [[cytoscape-js]] combines visualization with graph analysis, and diagramming libraries focus on editing and constraint-based layout. For the graph data model and algorithms on their own, see [[graphology]].',
    ],
  },
  'JavaScript tools > Maps': {
    label: 'JS maps',
    slug: 'javascript-maps',
    short: 'maps',
    group: 'javascript',
    language: 'JavaScript',
    title: 'JavaScript map & geospatial visualization libraries',
    noun: 'JavaScript mapping library',
    summary: 'Interactive web maps, globes and GPU-rendered geospatial layers.',
    intro: [
      'Libraries for interactive web maps and geospatial visualization, from tiled slippy maps with markers to GPU-rendered layers with millions of points, 3D globes and choropleths.',
      '[[leaflet]] is the lightweight standard for 2D tiled maps. [[deck-gl]] and [[l7]] render large geospatial datasets with WebGL, and [[cesium]] focuses on 3D globes and terrain. For a choropleth of countries or regions, an SVG map such as [[datamaps]] may be all you need.',
    ],
  },
  'JavaScript tools > d3': {
    label: 'D3',
    slug: 'd3',
    short: 'd3',
    group: 'javascript',
    language: 'JavaScript',
    title: 'D3.js',
    noun: 'JavaScript visualization library',
    summary: 'The low-level toolkit behind many web visualizations.',
    intro: [
      'D3 (Data-Driven Documents) is the low-level JavaScript toolkit behind many of the libraries in this directory. Instead of chart types it provides modules for scales, shapes, layouts, transitions and data joins, so any visualization can be built from primitives.',
      'D3 has an ecosystem of its own: for plugins, examples and learning material, see the dedicated <a href="https://github.com/wbkd/awesome-d3" rel="noopener">Awesome D3</a> list.',
    ],
  },
  'JavaScript tools > React': {
    label: 'React',
    slug: 'react',
    short: 'react',
    group: 'javascript',
    language: 'JavaScript',
    title: 'React chart & visualization libraries',
    noun: 'React chart library',
    summary: 'Chart components that compose with React state and props.',
    intro: [
      'Chart and visualization components built for React. Charts are components configured with props, so they compose with application state and re-render predictably; under the hood most build on D3, SVG or Canvas.',
      'Compare the API level first: high-level chart components such as [[recharts]] and [[nivo]] get a dashboard running quickly, while lower-level primitives give full control over the design. Then check server-side rendering support, bundle size and TypeScript types.',
    ],
  },
  'JavaScript tools > React Native': {
    label: 'React Native',
    slug: 'react-native',
    short: 'rn',
    group: 'mobile',
    language: 'JavaScript',
    title: 'React Native chart libraries',
    noun: 'React Native chart library',
    summary: 'Charts for React Native apps on iOS and Android.',
    intro: [
      'Chart libraries for React Native apps on iOS and Android. React Native renders native views rather than browser DOM, so most web chart libraries do not work directly; these libraries draw with SVG, Canvas or native graphics instead.',
    ],
  },
  'JavaScript tools > Misc': {
    label: 'More JavaScript',
    slug: 'javascript-visualization-tools',
    short: 'misc',
    group: 'javascript',
    language: 'JavaScript',
    title: 'More JavaScript visualization libraries',
    noun: 'JavaScript visualization library',
    summary: 'Visualization grammars, timelines, textures and other web tools.',
    intro: [
      'Visualization grammars, timeline and pattern libraries, and other JavaScript tools that do not fit a single chart category. [[vega]] and [[vega-lite]] describe charts as JSON specifications that can be rendered, saved and shared; [[timeline-js]] and [[vis-js]] cover timelines and networks; [[textures-js]] adds SVG patterns to any chart.',
    ],
  },
  'Android tools': {
    label: 'Android',
    slug: 'android',
    group: 'mobile',
    language: 'Java',
    title: 'Android chart libraries',
    noun: 'Android chart library',
    summary: 'Native chart views for Android apps in Java and Kotlin.',
    intro: [
      'Native chart libraries for Android apps, written in Java or Kotlin. They draw with Android graphics APIs, support touch gestures such as pinch-zoom and dragging, and are added to a project as Gradle dependencies.',
    ],
  },
  'C++ tools': {
    label: 'C++',
    slug: 'cpp',
    group: 'native',
    language: 'C++',
    title: 'C++ visualization libraries & applications',
    noun: 'C++ visualization tool',
    summary: 'Scientific, 3D and high-performance visualization.',
    intro: [
      'Libraries and applications for scientific, 3D and high-performance visualization in C++. Many build on [[vtk]], the Visualization Toolkit, which also powers [[paraview]]. Most of these projects ship Python bindings, so they are often used from Python too.',
    ],
  },
  'Golang tools': {
    label: 'Go',
    slug: 'go',
    group: 'native',
    language: 'Go',
    title: 'Go charting & plotting libraries',
    noun: 'Go plotting library',
    summary: 'Charts, plots and SVG from Go programs.',
    intro: [
      'Libraries for producing charts from Go programs: static plots for analysis with [[plot]], low-level SVG generation with [[svgo]], and interactive HTML charts based on Apache ECharts with [[go-echarts]].',
    ],
  },
  'iOS tools': {
    label: 'iOS',
    slug: 'ios',
    group: 'mobile',
    language: 'Swift',
    title: 'iOS & Swift chart libraries',
    noun: 'iOS chart library',
    summary: 'Native charts for iOS and macOS apps.',
    intro: [
      'Native chart libraries for iOS (and often macOS) apps in Swift and Objective-C. Since iOS 16, Apple ships Swift Charts with the SDK, so third-party libraries are mostly chosen for chart types, customization or support for older OS versions.',
    ],
  },
  'Machine Learning tools': {
    label: 'Machine learning',
    slug: 'machine-learning',
    group: 'apps',
    language: 'Python',
    title: 'Machine learning visualization tools',
    noun: 'ML visualization tool',
    summary: 'Training metrics, experiment tracking, embeddings and LLM traces.',
    intro: [
      'Tools for visualizing machine learning work: training metrics and experiment tracking, model debugging, embeddings, and traces of LLM applications. Most are Python packages that log from training or inference code to a local or hosted dashboard.',
    ],
  },
  'Python tools': {
    label: 'Python',
    slug: 'python',
    group: 'python',
    language: 'Python',
    title: 'Python data visualization libraries',
    noun: 'Python visualization library',
    summary: 'From Matplotlib and Seaborn to interactive and 3D plotting.',
    intro: [
      'Python has one of the richest data visualization ecosystems of any language. [[matplotlib]] is the foundation for static plots and [[seaborn]] builds statistical graphics on top of it. [[plotly-python]], [[bokeh]] and [[holoviews]] produce interactive charts for notebooks and the web, and [[altair]] offers a declarative grammar based on Vega-Lite.',
      'For 3D and GPU-accelerated scientific visualization, look at [[vispy]], [[pyvista]] and [[mayavi]]. For quick looks at a whole dataset, profiling tools such as [[ydata-profiling]] generate exploratory reports in one call.',
    ],
  },
  'R tools': {
    label: 'R',
    slug: 'r',
    group: 'r',
    language: 'R',
    title: 'R data visualization packages',
    noun: 'R visualization package',
    summary: 'ggplot2, interactive graphics and Shiny apps.',
    intro: [
      "R's visualization ecosystem centers on [[ggplot2]], an implementation of the grammar of graphics that most R users learn first. Interactive alternatives include [[plotly-r]] and [[visnetwork]], [[rgl]] covers 3D graphics, and [[shiny]] turns analyses into interactive web applications.",
    ],
  },
  'Ruby tools': {
    label: 'Ruby',
    slug: 'ruby',
    group: 'native',
    language: 'Ruby',
    title: 'Ruby charting libraries',
    noun: 'Ruby charting library',
    summary: 'Charts for Ruby and Rails applications.',
    intro: [
      'Ruby libraries for adding charts to applications, typically Rails apps that render a JavaScript chart library from server-side data.',
    ],
  },
  'Rust tools': {
    label: 'Rust',
    slug: 'rust',
    group: 'native',
    language: 'Rust',
    title: 'Rust plotting & visualization libraries',
    noun: 'Rust visualization library',
    summary: 'Plotting crates, terminal charts and data viewers.',
    intro: [
      'Rust crates for plotting and visualization, from charts in the terminal to SDKs and viewers for multimodal and robotics data. They are added with `cargo add`, and many compile to WebAssembly for use in the browser.',
    ],
  },
  'Markup-based tools': {
    label: 'Diagrams as code',
    slug: 'diagrams-as-code',
    group: 'apps',
    language: null,
    title: 'Diagrams as code',
    noun: 'diagram-as-code tool',
    summary: 'Diagrams and charts generated from plain-text descriptions.',
    intro: [
      'Tools that turn plain-text descriptions into diagrams, so diagrams live in version control next to the code and documentation they describe. [[mermaid]] renders flowcharts, sequence diagrams and more from Markdown-like text and is supported in GitHub Markdown; [[wavedrom]] draws digital timing diagrams.',
    ],
  },
  'Other tools': {
    label: 'Apps & tools',
    slug: 'apps',
    group: 'apps',
    language: null,
    title: 'Data visualization apps & tools',
    noun: 'data visualization app',
    summary: 'Standalone apps and language-agnostic tools.',
    intro: [
      'Standalone applications and language-agnostic tools: desktop apps for exploring large graphs such as [[gephi]], web apps that turn spreadsheets into charts such as [[rawgraphs]], geospatial explorers such as [[kepler-gl]], and command-line tools such as [[graphviz]].',
    ],
  },
  'Julia tools': {
    label: 'Julia',
    slug: 'julia',
    group: 'native',
    language: 'Julia',
    title: 'Julia plotting packages',
    noun: 'Julia plotting package',
    summary: 'Plotting for scientific computing in Julia.',
    intro: [
      'Plotting packages for Julia, a language for scientific computing and data analysis. [[makie]] offers GPU-powered interactive and publication-quality plots, and [[plots-jl]] provides one API over multiple plotting backends.',
    ],
  },
  'JVM tools': {
    label: 'JVM',
    slug: 'jvm',
    group: 'native',
    language: 'Java',
    title: 'Java, Kotlin & Scala visualization libraries',
    noun: 'JVM charting library',
    summary: 'Charts for desktop apps, servers and notebooks on the JVM.',
    intro: [
      'Charting and visualization libraries for Java, Kotlin and Scala, used in desktop applications, server-side chart generation and data science notebooks.',
    ],
  },
  '.NET tools': {
    label: '.NET',
    slug: 'dotnet',
    group: 'native',
    language: 'C#',
    title: 'C# & .NET charting libraries',
    noun: '.NET charting library',
    summary: 'Charts for WinForms, WPF, MAUI, Avalonia and Blazor.',
    intro: [
      'Charting libraries for C# and .NET, covering desktop and mobile UI frameworks such as WinForms, WPF, MAUI and Avalonia, web UIs with Blazor, and server-side image generation. Most install as NuGet packages.',
    ],
  },
  'Flutter tools': {
    label: 'Flutter',
    slug: 'flutter',
    group: 'mobile',
    language: 'Dart',
    title: 'Flutter chart libraries',
    noun: 'Flutter chart library',
    summary: 'Charts for Flutter apps on mobile, web and desktop.',
    intro: [
      'Chart libraries for Flutter apps written in Dart. Because Flutter draws its own widgets, the same chart renders consistently on iOS, Android, the web and desktop.',
    ],
  },
  'Dashboards and BI': {
    label: 'Dashboards & BI',
    slug: 'dashboards-and-bi',
    group: 'apps',
    language: null,
    title: 'Open-source dashboards & BI tools',
    noun: 'dashboard and BI tool',
    summary: 'Self-hosted business intelligence, monitoring and dashboards.',
    intro: [
      'Open-source business intelligence and dashboard applications. They connect to databases and data warehouses, let teams explore data with SQL or visual query builders, and publish dashboards that refresh on a schedule, an alternative to commercial BI suites that you can self-host.',
      'Monitoring-oriented tools such as [[grafana]] focus on time series from metrics and logs, while BI tools such as [[superset]] and [[metabase]] focus on querying business data.',
    ],
  },
};

export function categoryMeta(section) {
  const meta = META[section.parent ? `${section.parent} > ${section.title}` : section.title] ?? META[section.title];
  if (meta) return { ...meta };
  // A new README section without editorial metadata still gets a page.
  const title = section.parent ? `${section.parent.replace(/ tools$/i, '')} ${section.title.toLowerCase()}` : section.title;
  return {
    slug: slugify(title.replace(/ tools$/i, '')),
    group: 'apps',
    language: null,
    title,
    label: title,
    noun: 'tool',
    summary: '',
    intro: [],
    missingMeta: true,
  };
}
