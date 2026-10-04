// Package registry facts: which package a repository publishes, its latest
// version and recent downloads. A package is only attached to a tool when
// the registry metadata links back to the same repository (or the name was
// curated in data/overrides.mjs), so a name collision can't put the wrong
// install command on a page.

import { Cache, DAY, HOUR, limiter, request, sleep } from './http.mjs';

export const REGISTRIES = {
  npm: { label: 'npm', install: (n) => `npm install ${n}`, url: (n) => `https://www.npmjs.com/package/${n}`, period: 'week' },
  pypi: { label: 'PyPI', install: (n) => `pip install ${n}`, url: (n) => `https://pypi.org/project/${n}/`, period: 'week' },
  cran: { label: 'CRAN', install: (n) => `install.packages("${n}")`, url: (n) => `https://cran.r-project.org/package=${n}`, period: 'week' },
  crates: { label: 'crates.io', install: (n) => `cargo add ${n}`, url: (n) => `https://crates.io/crates/${n}`, period: '90 days' },
  go: { label: 'Go', install: (n) => `go get ${n}`, url: (n) => `https://pkg.go.dev/${n}`, period: null },
  gem: { label: 'RubyGems', install: (n) => `gem install ${n}`, url: (n) => `https://rubygems.org/gems/${n}`, period: null },
  nuget: { label: 'NuGet', install: (n) => `dotnet add package ${n}`, url: (n) => `https://www.nuget.org/packages/${n}`, period: 'all time' },
  pub: { label: 'pub.dev', install: (n) => `flutter pub add ${n}`, url: (n) => `https://pub.dev/packages/${n}`, period: '30 days' },
  julia: { label: 'Julia', install: (n) => `julia -e 'using Pkg; Pkg.add("${n}")'`, url: (n) => `https://juliahub.com/ui/Packages/General/${n}`, period: null },
  maven: { label: 'Maven Central', install: (n, v) => `implementation("${n}:${v}")`, url: (n) => `https://central.sonatype.com/artifact/${n.replace(':', '/')}`, period: null },
};

export function downloadsLabel(registry) {
  const r = REGISTRIES[registry];
  if (!r.period) return null;
  return r.period === 'all time' ? `${r.label} downloads, all time` : `${r.label} downloads / ${r.period}`;
}

// Candidate package names from a repository's own manifests.
export function manifestCandidates(manifests = {}) {
  const out = [];
  if (manifests.packageJson) {
    let pkg;
    try {
      pkg = JSON.parse(manifests.packageJson);
    } catch {
      // Cached manifests are capped, so a large package.json may be cut off.
      pkg = { name: /"name"\s*:\s*"([^"]+)"/.exec(manifests.packageJson)?.[1], private: /"private"\s*:\s*true/.test(manifests.packageJson) };
    }
    if (pkg.name && !pkg.private) out.push({ registry: 'npm', name: pkg.name });
  }
  const tomlName = (text, table) => {
    const start = text.search(new RegExp(`^\\[${table.replace('.', '\\.')}\\]\\s*$`, 'm'));
    if (start < 0) return null;
    const body = text.slice(start).split(/\n(?=\[)/)[0];
    return /^name\s*=\s*["']([^"']+)["']/m.exec(body)?.[1] ?? null;
  };
  if (manifests.pyproject) {
    const name = tomlName(manifests.pyproject, 'project') || tomlName(manifests.pyproject, 'tool.poetry');
    if (name) out.push({ registry: 'pypi', name });
  }
  if (manifests.setupCfg) {
    const name = tomlName(manifests.setupCfg, 'metadata') || /^\[metadata\][\s\S]*?^name\s*=\s*(\S+)/m.exec(manifests.setupCfg)?.[1];
    if (name) out.push({ registry: 'pypi', name });
  }
  if (manifests.setupPy) {
    const name = /\bname\s*=\s*["']([\w.-]+)["']/.exec(manifests.setupPy)?.[1];
    if (name) out.push({ registry: 'pypi', name });
  }
  if (manifests.rDescription) {
    const name = /^Package:\s*([\w.]+)/m.exec(manifests.rDescription)?.[1];
    if (name) out.push({ registry: 'cran', name });
  }
  if (manifests.cargo) {
    const name = tomlName(manifests.cargo, 'package');
    if (name) out.push({ registry: 'crates', name });
  }
  if (manifests.goMod) {
    const name = /^module\s+(\S+)/m.exec(manifests.goMod)?.[1];
    if (name) out.push({ registry: 'go', name });
  }
  if (manifests.pubspec) {
    const name = /^name:\s*([\w-]+)/m.exec(manifests.pubspec)?.[1];
    if (name) out.push({ registry: 'pub', name });
  }
  if (manifests.juliaProject) {
    const name = /^name\s*=\s*"([^"]+)"/m.exec(manifests.juliaProject)?.[1];
    if (name) out.push({ registry: 'julia', name });
  }
  return out;
}

const mentionsRepo = (values, fullName) => {
  const needle = `github.com/${fullName}`.toLowerCase();
  return values
    .filter(Boolean)
    .map((v) => String(typeof v === 'object' ? v.url ?? '' : v).toLowerCase().replace(/\.git$/, ''))
    .some((v) => v.includes(needle) && !v.slice(v.indexOf(needle) + needle.length).match(/^[\w.-]/));
};

const goEscape = (path) => path.replace(/[A-Z]/g, (c) => `!${c.toLowerCase()}`);

// Looks a package up in its registry. Returns { version, linked } or null.
async function lookup(registry, name, fullName) {
  switch (registry) {
    case 'npm': {
      const res = await request(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`);
      if (!res.ok || !res.body?.version) return null;
      const b = res.body;
      return { version: b.version, linked: mentionsRepo([b.repository, b.homepage, b.bugs], fullName), license: typeof b.license === 'string' ? b.license : null };
    }
    case 'pypi': {
      const res = await request(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
      if (!res.ok || !res.body?.info) return null;
      const info = res.body.info;
      const urls = [info.home_page, info.download_url, ...Object.values(info.project_urls || {})];
      const classifier = (info.classifiers || []).find((c) => c.startsWith('License :: OSI Approved :: '));
      const license =
        info.license_expression ||
        (info.license && info.license.length <= 40 && !/\n/.test(info.license) ? info.license : null) ||
        (classifier ? classifier.split(' :: ').at(-1).replace(/ License$/, '') : null);
      return { version: info.version, linked: mentionsRepo(urls, fullName), name: info.name, license };
    }
    case 'cran': {
      const res = await request(`https://crandb.r-pkg.org/${encodeURIComponent(name)}`);
      if (!res.ok || !res.body?.Version) return null;
      const urls = String(res.body.URL || '').split(/[,\s]+/).concat(res.body.BugReports || []);
      return { version: res.body.Version, linked: mentionsRepo(urls, fullName), license: res.body.License || null };
    }
    case 'crates': {
      const res = await request(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`);
      if (!res.ok || !res.body?.crate) return null;
      const c = res.body.crate;
      return {
        version: c.max_stable_version || c.newest_version,
        linked: mentionsRepo([c.repository, c.homepage], fullName),
        downloads: c.recent_downloads ?? null,
        license: res.body.versions?.[0]?.license ?? null,
      };
    }
    case 'go': {
      const res = await request(`https://proxy.golang.org/${goEscape(name)}/@latest`);
      if (!res.ok || !res.body?.Version) return null;
      // A go.mod module path is canonical by definition.
      return { version: res.body.Version, linked: true };
    }
    case 'gem': {
      const res = await request(`https://rubygems.org/api/v1/gems/${encodeURIComponent(name)}.json`);
      if (!res.ok || !res.body?.version) return null;
      const b = res.body;
      return { version: b.version, linked: mentionsRepo([b.source_code_uri, b.homepage_uri, b.bug_tracker_uri], fullName), license: b.licenses?.[0] ?? null };
    }
    case 'nuget': {
      const res = await request(`https://azuresearch-usnc.nuget.org/query?q=packageid:${encodeURIComponent(name)}&take=1&prerelease=false`);
      const hit = res.body?.data?.find((d) => d.id.toLowerCase() === name.toLowerCase());
      if (!res.ok || !hit) return null;
      return { version: hit.version, linked: mentionsRepo([hit.projectUrl], fullName), downloads: hit.totalDownloads ?? null, name: hit.id };
    }
    case 'pub': {
      const res = await request(`https://pub.dev/api/packages/${encodeURIComponent(name)}`);
      if (!res.ok || !res.body?.latest) return null;
      const spec = res.body.latest.pubspec || {};
      const score = await request(`https://pub.dev/api/packages/${encodeURIComponent(name)}/score`);
      return { version: res.body.latest.version, linked: mentionsRepo([spec.repository, spec.homepage, spec.issue_tracker], fullName), downloads: score.body?.downloadCount30Days ?? null };
    }
    case 'julia': {
      const base = `https://raw.githubusercontent.com/JuliaRegistries/General/master/${name[0].toUpperCase()}/${name}`;
      const pkg = await request(`${base}/Package.toml`, { as: 'text' });
      if (!pkg.ok) return null;
      const repo = /^repo\s*=\s*"([^"]+)"/m.exec(pkg.body)?.[1];
      const versions = await request(`${base}/Versions.toml`, { as: 'text' });
      const all = [...String(versions.body ?? '').matchAll(/^\["([0-9][^"]*)"\]/gm)].map((m) => m[1]).filter((v) => /^\d+\.\d+\.\d+$/.test(v));
      all.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      return { version: all.at(-1) ?? null, linked: mentionsRepo([repo], fullName) };
    }
    case 'maven': {
      const [g, a] = name.split(':');
      const res = await request(`https://search.maven.org/solrsearch/select?q=g:%22${encodeURIComponent(g)}%22+AND+a:%22${encodeURIComponent(a)}%22&core=gav&rows=30&wt=json`, { timeout: 45000 });
      const stable = res.body?.response?.docs?.map((d) => d.v).find((v) => /^\d+(\.\d+)+$/.test(v));
      if (!res.ok || !stable) return null;
      return { version: stable, linked: false }; // coordinates are always curated
    }
    default:
      return null;
  }
}

async function weeklyDownloads(packages, log) {
  const out = new Map();
  const npm = packages.filter((p) => p.registry === 'npm');
  const unscoped = npm.filter((p) => !p.name.startsWith('@'));
  for (let i = 0; i < unscoped.length; i += 100) {
    const names = unscoped.slice(i, i + 100).map((p) => p.name);
    const res = await request(`https://api.npmjs.org/downloads/point/last-week/${names.join(',')}`);
    if (res.ok && res.body) {
      for (const name of names) {
        const hit = names.length === 1 ? res.body : res.body[name];
        if (hit?.downloads != null) out.set(`npm:${name}`, hit.downloads);
      }
    }
  }
  const run = limiter(4);
  await Promise.all(
    npm
      .filter((p) => p.name.startsWith('@'))
      .map((p) =>
        run(async () => {
          const res = await request(`https://api.npmjs.org/downloads/point/last-week/${p.name}`);
          if (res.ok && res.body?.downloads != null) out.set(`npm:${p.name}`, res.body.downloads);
        })
      )
  );
  const cran = packages.filter((p) => p.registry === 'cran').map((p) => p.name);
  if (cran.length) {
    const res = await request(`https://cranlogs.r-pkg.org/downloads/total/last-week/${cran.join(',')}`);
    if (res.ok && Array.isArray(res.body)) for (const row of res.body) out.set(`cran:${row.package}`, row.downloads);
  }
  // pypistats asks for gentle use: one request at a time.
  for (const p of packages.filter((p) => p.registry === 'pypi')) {
    const res = await request(`https://pypistats.org/api/packages/${p.name.toLowerCase()}/recent`, { retries: 4 });
    if (res.ok && res.body?.data?.last_week != null) out.set(`pypi:${p.name}`, res.body.data.last_week);
    else if (res.status === 429) {
      log('  pypistats rate limit reached; keeping cached PyPI downloads for the rest.');
      break;
    }
    await sleep(1500);
  }
  return out;
}

// tools: [{ slug, repoFacts, overrides }] -> Map(slug -> [{registry, name, version, downloads}])
export async function enrichPackages(tools, { cacheDir, offline, log = console.log }) {
  const registryCache = new Cache(cacheDir, 'registry');
  const downloadsCache = new Cache(cacheDir, 'downloads');
  const run = limiter(6);
  const resolved = new Map();

  await Promise.all(
    tools.map((tool) =>
      run(async () => {
        const curated = Object.keys(REGISTRIES)
          .filter((r) => tool.overrides?.[r])
          .map((r) => ({ registry: r, name: tool.overrides[r], curated: true }));
        const detected = tool.repoFacts ? manifestCandidates(tool.repoFacts.manifests) : [];
        const seen = new Set();
        const candidates = [...curated, ...detected].filter((c) => {
          const k = `${c.registry}:${c.name.toLowerCase()}`;
          if (seen.has(k) || (curated.some((x) => x.registry === c.registry) && !c.curated)) return false;
          seen.add(k);
          return true;
        });
        const accepted = [];
        for (const c of candidates) {
          const cacheKey = `${c.registry}:${c.name}:${tool.repoFacts?.fullName ?? ''}`;
          let info = registryCache.get(cacheKey, 6 * DAY);
          if (info === undefined && !offline) {
            info = await lookup(c.registry, c.name, tool.repoFacts?.fullName ?? '');
            if (info !== null || !registryCache.stale(cacheKey)) registryCache.set(cacheKey, info);
            else info = registryCache.stale(cacheKey);
          }
          if (info === undefined) info = registryCache.stale(cacheKey);
          if (info && (info.linked || c.curated)) {
            accepted.push({ registry: c.registry, name: info.name || c.name, version: info.version, downloads: info.downloads ?? null, license: info.license ?? null });
          }
        }
        resolved.set(tool.slug, accepted);
      })
    )
  );
  registryCache.save();

  const all = [...resolved.values()].flat();
  const needDownloads = all.filter((p) => ['npm', 'pypi', 'cran'].includes(p.registry) && downloadsCache.get(`${p.registry}:${p.name}`, 20 * HOUR) === undefined);
  if (!offline && needDownloads.length) {
    log(`  Fetching downloads for ${needDownloads.length} packages...`);
    for (const [k, v] of await weeklyDownloads(needDownloads, log)) downloadsCache.set(k, v);
    downloadsCache.save();
  }
  for (const p of all) {
    if (['crates', 'nuget', 'pub'].includes(p.registry)) continue; // downloads came with the lookup
    p.downloads = downloadsCache.stale(`${p.registry}:${p.name}`) ?? null;
  }
  return resolved;
}
