// Turns parsed README sections + curated overrides + enrichment into the
// site's data model: tools (deduplicated by repository), categories, topics
// and resources.

import { inlineToText, githubAnchor } from './markdown.mjs';
import { detectRepo, parseRepoRef } from './readme.mjs';
import { repoKey } from './enrich/github.mjs';
import { REGISTRIES, downloadsLabel } from './enrich/packages.mjs';
import { firstAdded } from './enrich/history.mjs';
import { categoryMeta } from './content/categories.mjs';
import { TOPICS } from './content/topics.mjs';
import { slugify } from './util.mjs';

export { slugify };

const DAY = 24 * 3600 * 1000;


const normalizeUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/[/#?]+$/, '').toLowerCase();

export function maintenance(facts, now) {
  if (!facts) return null;
  if (facts.archived) return { key: 'archived', label: 'Archived', detail: 'The repository is archived and read-only.' };
  const last = Date.parse(facts.lastCommitAt || facts.pushedAt);
  if (!last) return null;
  const days = (now - last) / DAY;
  if (days <= 90) return { key: 'active', label: 'Active', detail: 'Commits in the last 90 days.' };
  if (days <= 365) return { key: 'maintained', label: 'Maintained', detail: 'Commits in the last 12 months.' };
  return { key: 'inactive', label: 'Inactive', detail: 'No commits in over a year.' };
}

// Registry license strings -> SPDX-style labels ("GPL-2" -> "GPL-2.0").
export function normalizeLicense(value) {
  const v = String(value).replace(/\s*[|+]\s*file LICEN[CS]E$/i, '').trim();
  if (/^SEE LICEN[CS]E/i.test(v) || /^UNLICENSED$/i.test(v)) return 'Other';
  const known = {
    'GPL-2': 'GPL-2.0',
    'GPL-3': 'GPL-3.0',
    'GPL (>= 2)': 'GPL-2.0-or-later',
    'GPL (>= 3)': 'GPL-3.0-or-later',
    'LGPL-2.1': 'LGPL-2.1',
    'Python Software Foundation': 'PSF-2.0',
    'BSD': 'BSD',
    'MIT License': 'MIT',
    'Apache Software License': 'Apache-2.0',
    'Apache License 2.0': 'Apache-2.0',
    'BSD License': 'BSD',
  };
  return known[v] ?? v;
}

// GitHub's detected SPDX id, else the license the package registry declares
// (GitHub reports NOASSERTION for e.g. "MIT + file LICENSE"), else "Other".
function licenseLabel(tool, facts) {
  if (tool.overrides.license) return { label: tool.overrides.license, source: 'curated' };
  const spdx = facts?.license?.spdx;
  if (spdx && spdx !== 'NOASSERTION') return { label: spdx, source: facts.host };
  const declared = tool.packages.find((p) => p.license);
  if (declared) return { label: normalizeLicense(declared.license), source: declared.registry };
  if (facts?.license) return { label: 'Other', source: facts.host };
  return null;
}

export function buildModel({ sections, overrides = {}, repoFacts = new Map(), packages = new Map(), additions = null, now = Date.now() }) {
  const byName = new Map();
  for (const [k, v] of Object.entries(overrides)) if (!/^https?:/.test(k)) byName.set(k.toLowerCase(), v);
  const overrideFor = (entry) => overrides[entry.url] ?? byName.get(entry.name.toLowerCase()) ?? {};

  const categories = [];
  const categoryByAnchor = new Map();
  const tools = new Map(); // key -> tool
  const resources = [];

  for (const section of sections) {
    if (section.kind === 'resources') {
      resources.push({
        title: section.title,
        slug: slugify(section.title),
        anchor: section.anchor,
        notes: section.notes,
        entries: section.entries,
      });
      continue;
    }
    const meta = categoryMeta(section);
    const category = { ...meta, readmeTitle: section.title, readmeParent: section.parent, anchor: section.anchor, notes: section.notes, tools: [] };
    categories.push(category);
    categoryByAnchor.set(section.anchor, category);
    if (section.parent) categoryByAnchor.set(githubAnchor(section.parent), categoryByAnchor.get(githubAnchor(section.parent)) ?? category);

    for (const entry of section.entries) {
      const ov = overrideFor(entry);
      const repo = ov.repo ? parseRepoRef(ov.repo) : detectRepo(entry);
      const key = repo ? repoKey(repo) : `url:${normalizeUrl(entry.url)}`;
      let tool = tools.get(key);
      if (!tool) {
        tool = {
          key,
          name: ov.name ?? entry.name,
          slug: ov.slug ?? slugify(ov.name ?? entry.name),
          url: entry.url,
          descriptionMd: capitalize(entry.description),
          description: capitalize(inlineToText(entry.description)),
          repo,
          overrides: ov,
          aliases: [...(ov.aliases ?? [])],
          categories: [],
          entries: [],
        };
        tools.set(key, tool);
      } else if (ov.name || ov.slug) {
        // A curated entry wins as the canonical name and description.
        Object.assign(tool, {
          name: ov.name ?? tool.name,
          slug: ov.slug ?? tool.slug,
          overrides: { ...tool.overrides, ...ov },
          aliases: [...new Set([...tool.aliases, ...(ov.aliases ?? [])])],
        });
      }
      if (entry.name.toLowerCase() !== tool.name.toLowerCase()) tool.aliases.push(entry.name);
      if (!tool.descriptionMd && entry.description) {
        tool.descriptionMd = entry.description;
        tool.description = inlineToText(entry.description);
      }
      tool.entries.push(entry);
      if (!tool.categories.includes(category)) tool.categories.push(category);
      category.tools.push(tool);
    }
  }

  // Unique slugs: qualify collisions with the category, and say so loudly
  // because slugs are URLs and must stay stable once published.
  const seen = new Map();
  const warnings = [];
  for (const tool of tools.values()) {
    if (seen.has(tool.slug)) {
      const qualified = `${tool.slug}-${tool.categories[0].short ?? tool.categories[0].slug}`;
      warnings.push(`Slug "${tool.slug}" is used twice; "${tool.name}" became "${qualified}". Pin a slug in data/overrides.mjs.`);
      tool.slug = qualified;
    }
    seen.set(tool.slug, tool);
  }

  for (const tool of tools.values()) {
    const facts = tool.repo ? repoFacts.get(repoKey(tool.repo)) ?? null : null;
    tool.facts = facts;
    tool.stars = facts?.stars ?? null;
    tool.repoUrl = facts?.url ?? (tool.repo ? repoUrlFor(tool.repo) : null);
    const ownUrlIsRepo = tool.repo && normalizeUrl(tool.url).startsWith(normalizeUrl(repoUrlFor(tool.repo)));
    tool.homepage = !ownUrlIsRepo ? tool.url : facts?.homepage || null;
    tool.language = tool.overrides.language ?? facts?.language ?? tool.categories[0].language ?? null;
    tool.status = maintenance(facts, now);
    tool.lastCommitAt = facts?.lastCommitAt ?? facts?.pushedAt ?? null;
    tool.commitsLastYear = facts?.commitsLastYear ?? null;
    tool.contributors = facts?.contributors ?? null;
    tool.monthlyCommits = facts?.monthlyCommits?.length ? facts.monthlyCommits : null;
    tool.githubTopics = facts?.topics ?? [];
    tool.packages = (packages.get(tool.slug) ?? []).map((p) => ({
      ...p,
      label: REGISTRIES[p.registry].label,
      install: REGISTRIES[p.registry].install(p.name, p.version),
      registryUrl: REGISTRIES[p.registry].url(p.name),
      downloadsLabel: downloadsLabel(p.registry),
      period: REGISTRIES[p.registry].period,
    }));
    tool.downloads = tool.packages.find((p) => p.downloads != null) ?? null;
    const license = licenseLabel(tool, facts);
    tool.license = license?.label ?? null;
    tool.licenseSource = license?.source ?? null;
    tool.addedAt =
      tool.entries
        .map((e) => firstAdded(additions, [e.url, `[${e.name}](`, ...(tool.overrides.history ?? [])]))
        .filter(Boolean)
        .sort()[0] ?? null;
    tool.primaryCategory = tool.categories[0];
  }

  const list = [...tools.values()];
  for (const category of categories) {
    category.tools.sort(byPopularity);
    category.stars = category.tools.reduce((sum, t) => sum + (t.stars ?? 0), 0);
  }
  list.sort(byPopularity);
  list.forEach((t, i) => (t.rank = i + 1));

  // Cross-cutting topics (maps, 3D, terminal, ...) across every ecosystem.
  const topics = TOPICS.map((topic) => ({
    ...topic,
    tools: list.filter((t) => topicMatches(topic, t)).sort(byPopularity),
  })).filter((t) => t.tools.length >= 3);
  for (const tool of list) tool.topics = topics.filter((t) => t.tools.includes(tool));

  for (const resource of resources) {
    for (const entry of resource.entries) {
      entry.descriptionText = inlineToText(entry.description);
      entry.addedAt = firstAdded(additions, [entry.url]);
    }
  }

  return {
    tools: list,
    toolBySlug: new Map(list.map((t) => [t.slug, t])),
    categories: categories.filter((c) => c.tools.length || c.notes.length),
    categoryByAnchor,
    topics,
    resources,
    warnings,
    builtAt: new Date(now).toISOString(),
  };
}

// "provides flexible..." -> "Provides flexible..." (not "[link](...)" or `code`).
function capitalize(text) {
  return /^[a-z]/.test(text) ? text[0].toUpperCase() + text.slice(1) : text;
}

export function byPopularity(a, b) {
  return (b.stars ?? -1) - (a.stars ?? -1) || a.name.localeCompare(b.name);
}

function repoUrlFor(repo) {
  return repo.host === 'gitlab' ? `https://gitlab.com/${repo.owner}/${repo.name}` : `https://github.com/${repo.owner}/${repo.name}`;
}

function topicMatches(topic, tool) {
  if (topic.exclude?.includes(tool.slug)) return false;
  if (topic.include?.includes(tool.slug)) return true;
  if (topic.categories?.some((slug) => tool.categories.some((c) => c.slug === slug))) return true;
  if (topic.githubTopics?.some((t) => tool.githubTopics.includes(t))) return true;
  const text = `${tool.name} ${tool.description} ${tool.facts?.description ?? ''}`;
  return Boolean(topic.keywords?.some((re) => re.test(text)));
}
