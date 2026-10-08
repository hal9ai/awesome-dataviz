// Repository facts from GitHub (GraphQL, batched) and GitLab, plus
// contributor counts from GitHub's REST API.

import { execSync } from 'node:child_process';
import { Cache, DAY, HOUR, limiter, request } from './http.mjs';

const MANIFESTS = {
  packageJson: 'package.json',
  pyproject: 'pyproject.toml',
  setupCfg: 'setup.cfg',
  setupPy: 'setup.py',
  rDescription: 'DESCRIPTION',
  cargo: 'Cargo.toml',
  goMod: 'go.mod',
  pubspec: 'pubspec.yaml',
  juliaProject: 'Project.toml',
};

// Commit counts for the last 12 complete calendar months come from GraphQL
// history counts; the REST stats endpoints answer 202 while GitHub computes
// them lazily, which makes them unreliable for scheduled builds.
const MONTHS = Array.from({ length: 12 });

export function monthBoundaries(now = Date.now()) {
  const d = new Date(now);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); // start of current month
  return Array.from({ length: 13 }, (_, i) => {
    const t = new Date(end);
    t.setUTCMonth(t.getUTCMonth() - 12 + i);
    return t.toISOString();
  });
}

const FRAGMENT = `
fragment Repo on Repository {
  nameWithOwner url description homepageUrl stargazerCount forkCount
  isArchived isFork createdAt pushedAt
  licenseInfo { spdxId name }
  primaryLanguage { name }
  repositoryTopics(first: 15) { nodes { topic { name } } }
  latestRelease { tagName name publishedAt url }
  issues(states: OPEN) { totalCount }
  owner { login avatarUrl }
  defaultBranchRef { name target { ... on Commit { committedDate ${MONTHS.map((_, i) => `m${i}: history(since: $m${i}, until: $m${i + 1}) { totalCount }`).join(' ')} } } }
  ${Object.entries(MANIFESTS)
    .map(([key, file]) => `${key}: object(expression: "HEAD:${file}") { ... on Blob { text } }`)
    .join('\n  ')}
}`;

export function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch {
    return null;
  }
}

const restHeaders = (token) => ({
  authorization: `bearer ${token}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
});

const key = (repo) => `${repo.host}:${repo.owner}/${repo.name}`.toLowerCase();

function normalizeGraphql(node, months) {
  const manifests = {};
  for (const name of Object.keys(MANIFESTS)) {
    // Huge setup.py/package.json blobs are rare; cap what we keep in the cache.
    if (node[name]?.text) manifests[name] = node[name].text.slice(0, 60000);
  }
  const commit = node.defaultBranchRef?.target;
  return {
    host: 'github',
    fullName: node.nameWithOwner,
    url: node.url,
    description: node.description,
    homepage: node.homepageUrl || null,
    stars: node.stargazerCount,
    forks: node.forkCount,
    archived: node.isArchived,
    fork: node.isFork,
    createdAt: node.createdAt,
    pushedAt: node.pushedAt,
    lastCommitAt: commit?.committedDate ?? null,
    monthlyCommits: commit ? MONTHS.map((_, i) => [months[i].slice(0, 7), commit[`m${i}`]?.totalCount ?? 0]) : null,
    commitsLastYear: commit ? MONTHS.reduce((sum, _, i) => sum + (commit[`m${i}`]?.totalCount ?? 0), 0) : null,
    defaultBranch: node.defaultBranchRef?.name ?? null,
    license: node.licenseInfo ? { spdx: node.licenseInfo.spdxId, name: node.licenseInfo.name } : null,
    language: node.primaryLanguage?.name ?? null,
    topics: node.repositoryTopics.nodes.map((n) => n.topic.name),
    latestRelease: node.latestRelease
      ? { tag: node.latestRelease.tagName, name: node.latestRelease.name, publishedAt: node.latestRelease.publishedAt, url: node.latestRelease.url }
      : null,
    openIssues: node.issues.totalCount,
    owner: { login: node.owner.login, avatarUrl: node.owner.avatarUrl },
    manifests,
  };
}

async function graphql(token, query, variables) {
  const res = await request('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    timeout: 60000,
  });
  // A 200 can still carry an empty or non-JSON body (e.g. a GitHub timeout page).
  if (!res.body?.data) throw new Error(`GraphQL ${res.status}: ${res.error ?? JSON.stringify(res.body)?.slice(0, 300)}`);
  return res.body;
}

// Fetches GitHub repositories in batches; renamed repositories are resolved
// through the REST API (which follows redirects) and queried again.
async function fetchGithub(repos, token, log) {
  const months = monthBoundaries();
  const variables = Object.fromEntries(months.map((m, i) => [`m${i}`, m]));
  const declare = months.map((_, i) => `$m${i}: GitTimestamp!`).join(', ');
  const results = new Map();
  const missing = [];
  const BATCH = 15;
  for (let i = 0; i < repos.length; i += BATCH) {
    const batch = repos.slice(i, i + BATCH);
    const fields = batch
      .map((r, j) => `r${j}: repository(owner: ${JSON.stringify(r.owner)}, name: ${JSON.stringify(r.name)}) { ...Repo }`)
      .join('\n');
    const query = `query(${declare}) {\n${fields}\n}\n${FRAGMENT}`;
    let body;
    try {
      body = await graphql(token, query, variables);
    } catch (error) {
      log(`  GitHub batch ${i / BATCH + 1} failed: ${error.message}`);
      continue;
    }
    batch.forEach((r, j) => {
      const node = body.data?.[`r${j}`];
      if (node) results.set(key(r), normalizeGraphql(node, months));
      else missing.push(r);
    });
  }
  for (const r of missing) {
    const res = await request(`https://api.github.com/repos/${r.owner}/${r.name}`, {
      headers: restHeaders(token),
    });
    if (!res.ok || !res.body?.full_name) {
      log(`  GitHub: ${r.owner}/${r.name} not found (${res.status})`);
      continue;
    }
    const [owner, name] = res.body.full_name.split('/');
    const query = `query(${declare}) { r0: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ...Repo } }\n${FRAGMENT}`;
    try {
      const body = await graphql(token, query, variables);
      if (body.data?.r0) results.set(key(r), normalizeGraphql(body.data.r0, months));
    } catch (error) {
      log(`  GitHub: ${r.owner}/${r.name} failed after rename lookup: ${error.message}`);
    }
  }
  return results;
}

async function fetchGitlab(repo) {
  const id = encodeURIComponent(`${repo.owner}/${repo.name}`);
  const res = await request(`https://gitlab.com/api/v4/projects/${id}?license=true`);
  if (!res.ok) return null;
  const p = res.body;
  return {
    host: 'gitlab',
    fullName: p.path_with_namespace,
    url: p.web_url,
    description: p.description,
    homepage: null,
    stars: p.star_count,
    forks: p.forks_count,
    archived: p.archived,
    fork: Boolean(p.forked_from_project),
    createdAt: p.created_at,
    pushedAt: p.last_activity_at,
    lastCommitAt: p.last_activity_at,
    commitsLastYear: null,
    defaultBranch: p.default_branch,
    license: p.license ? { spdx: p.license.key?.toUpperCase() ?? null, name: p.license.name } : null,
    language: null,
    topics: p.topics ?? [],
    latestRelease: null,
    openIssues: p.open_issues_count ?? null,
    owner: { login: p.namespace?.path, avatarUrl: p.avatar_url || p.namespace?.avatar_url || null },
    manifests: {},
  };
}

async function fetchContributors(fullNames, token) {
  const out = new Map();
  const run = limiter(6);
  await Promise.all(
    fullNames.map((name) =>
      run(async () => {
        const res = await request(`https://api.github.com/repos/${name}/contributors?per_page=1`, {
          headers: restHeaders(token),
          retries: 1,
        });
        if (!res.ok) return;
        const last = /[?&]page=(\d+)>; rel="last"/.exec(res.headers.get('link') || '');
        out.set(name, last ? Number(last[1]) : Array.isArray(res.body) ? res.body.length : null);
      })
    )
  );
  return out;
}

// Returns Map(repoKey -> repository facts), merging fresh data with cache.
export async function enrichRepositories(repos, { cacheDir, offline, log = console.log }) {
  const cache = new Cache(cacheDir, 'repositories');
  const contributorsCache = new Cache(cacheDir, 'contributors');
  const unique = [...new Map(repos.map((r) => [key(r), r])).values()];
  const token = offline ? null : githubToken();
  if (!offline && !token) log('  No GitHub token (set GITHUB_TOKEN or run `gh auth login`); using cached repository data.');

  const stale = unique.filter((r) => cache.get(key(r), 20 * HOUR) === undefined);
  if (token && stale.length) {
    const github = stale.filter((r) => r.host === 'github');
    log(`  Fetching ${github.length} GitHub repositories...`);
    const fresh = await fetchGithub(github, token, log);
    for (const [k, v] of fresh) cache.set(k, v);
    for (const r of stale.filter((r) => r.host === 'gitlab')) {
      const v = await fetchGitlab(r);
      if (v) cache.set(key(r), v);
    }
    cache.save();
  }

  const result = new Map();
  for (const r of unique) {
    const value = cache.stale(key(r));
    if (value) result.set(key(r), { ...value });
  }

  const githubNames = [...result.values()].filter((v) => v.host === 'github').map((v) => v.fullName);
  if (token) {
    const needContributors = githubNames.filter((n) => contributorsCache.get(n, 6 * DAY) === undefined);
    if (needContributors.length) {
      log(`  Fetching contributor counts for ${needContributors.length} repositories...`);
      for (const [n, v] of await fetchContributors(needContributors, token)) contributorsCache.set(n, v);
      contributorsCache.save();
    }
  }
  for (const v of result.values()) {
    if (v.host !== 'github') continue;
    v.contributors = contributorsCache.stale(v.fullName) ?? null;
  }
  return result;
}

export { key as repoKey };
