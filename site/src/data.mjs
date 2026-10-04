// Loads the catalog: README -> sections -> enriched model.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReadme, detectRepo, parseRepoRef } from './readme.mjs';
import { enrichRepositories, repoKey } from './enrich/github.mjs';
import { enrichPackages } from './enrich/packages.mjs';
import { readmeHistory } from './enrich/history.mjs';
import { buildModel, slugify } from './model.mjs';
import overrides from '../data/overrides.mjs';

export const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_DIR = resolve(SITE_DIR, '..');
export const README = join(REPO_DIR, 'README.md');

export async function loadCatalog({ offline = false, cacheDir = join(SITE_DIR, '.cache'), log = console.log, now = Date.now() } = {}) {
  const markdown = readFileSync(README, 'utf8');
  const { sections } = parseReadme(markdown);

  const repos = [];
  for (const section of sections) {
    if (section.kind !== 'tools') continue;
    for (const entry of section.entries) {
      const ov = overrides[entry.url] ?? {};
      const repo = ov.repo ? parseRepoRef(ov.repo) : detectRepo(entry);
      if (repo) repos.push(repo);
    }
  }
  log(`README: ${sections.length} sections, ${repos.length} entries with a repository.`);

  const repoFacts = await enrichRepositories(repos, { cacheDir, offline, log });
  log(`Repositories: ${repoFacts.size} with data.`);

  // Packages are resolved per tool, so build a preliminary model for slugs.
  const draft = buildModel({ sections, overrides, repoFacts, now });
  const packages = await enrichPackages(
    draft.tools.map((t) => ({ slug: t.slug, repoFacts: t.facts, overrides: t.overrides })),
    { cacheDir, offline, log }
  );
  log(`Packages: ${[...packages.values()].flat().length} verified.`);

  const additions = readmeHistory('README.md', REPO_DIR);
  const model = buildModel({ sections, overrides, repoFacts, packages, additions, now });
  for (const w of model.warnings) log(`  warning: ${w}`);
  for (const c of model.categories.filter((c) => c.missingMeta)) log(`  warning: no editorial metadata for README section "${c.readmeTitle}" (src/content/categories.mjs).`);
  return model;
}

export { slugify, repoKey };
