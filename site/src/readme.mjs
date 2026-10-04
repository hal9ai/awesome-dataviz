// Parses the repository README into sections and entries. The README stays
// the single source of truth: every tool page on the site starts life as one
// list item there, so contributors keep sending one-line pull requests.

import { githubAnchor, inlineToText, readLink, tokenize } from './markdown.mjs';

// Top-level (#) headings that hold content, and what kind of content.
const GROUPS = { resources: 'resources' };
const IGNORED = new Set(['contents', 'contributing', 'contributors', 'license']);

export function parseReadme(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  const anchors = new Map(); // README anchor -> section
  let kind = 'tools'; // everything before "# Resources" is tools
  let parent = null; // current "##" heading when it has "###" children
  let section = null;
  let ignoringGroup = false; // inside an ignored "#" heading (Contributing, License, ...)
  let ignoringSection = false; // inside an ignored "##" heading (Contents)
  let lastEntry = null;

  const open = (title, level) => {
    section = {
      title,
      level,
      parent: level === 3 ? parent?.title ?? null : null,
      kind,
      anchor: githubAnchor(title),
      notes: [],
      entries: [],
    };
    sections.push(section);
    anchors.set(section.anchor, section);
    lastEntry = null;
  };

  lines.forEach((line, index) => {
    const heading = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      const key = title.toLowerCase();
      if (level === 1) {
        section = null;
        parent = null;
        lastEntry = null;
        ignoringSection = false;
        if (index === 0 || /^awesome/i.test(title)) {
          ignoringGroup = false;
          kind = 'tools';
        } else if (GROUPS[key]) {
          ignoringGroup = false;
          kind = GROUPS[key];
        } else {
          ignoringGroup = true;
        }
        return;
      }
      if (ignoringGroup) return;
      if (level === 2) {
        ignoringSection = IGNORED.has(key);
        section = null;
        if (ignoringSection) return;
        parent = { title };
        open(title, 2);
        return;
      }
      if (ignoringSection) return;
      open(title, 3);
      return;
    }
    if (ignoringGroup || ignoringSection || !section) return;

    const item = /^(\s*)[-*+]\s+(.*)$/.exec(line);
    if (!item) return;
    const indent = item[1].replace(/\t/g, '  ').length;
    const body = item[2].trim();
    const link = body.startsWith('[') ? readLink(body, 0) : null;
    if (!link || link.url.startsWith('#')) {
      // e.g. "- See [Awesome D3](...)" or a nested group label like "- Wikipedia"
      if (indent === 0) section.notes.push({ markdown: body, line: index + 1 });
      lastEntry = { label: inlineToText(body), children: true };
      return;
    }
    const rest = body.slice(link.end).trim();
    const description = rest.replace(/^[-–—:]\s*/, '').trim();
    const entry = {
      name: inlineToText(link.text),
      url: link.url,
      description, // inline Markdown
      separator: rest.slice(0, rest.length - description.length).trim(),
      raw: body,
      line: index + 1,
      group: indent > 0 && lastEntry?.children ? lastEntry.label : null,
      links: tokenize(description).filter((t) => t.type === 'link'),
    };
    section.entries.push(entry);
    if (indent === 0) lastEntry = entry;
  });

  // Drop structural parents that only exist to hold subsections (e.g. "JavaScript tools").
  const result = sections.filter((s) => s.entries.length || s.notes.length);
  for (const s of result) s.hasChildren = sections.some((c) => c.parent === s.title && c !== s);
  return { sections: result, anchors };
}

// Repository detection: the entry's own link, else a `[GitHub](...)` or
// `[Source](...)` link in its description. GitHub Pages URLs are deliberately
// not mapped to owner/repo; that guess is often a stale fork, so homepage-only
// entries get their repository from data/overrides.mjs instead.
export function detectRepo(entry) {
  const own = parseRepoUrl(entry.url);
  if (own) return own;
  for (const link of entry.links) {
    if (/github|gitlab|source|code|repo/i.test(inlineToText(link.text))) {
      const repo = parseRepoUrl(link.url);
      if (repo) return repo;
    }
  }
  return null;
}

// "owner/name" or "gitlab:group/name" from data/overrides.mjs.
export function parseRepoRef(ref) {
  const gitlab = /^gitlab:(.+)\/([^/]+)$/.exec(ref);
  if (gitlab) return { host: 'gitlab', owner: gitlab[1], name: gitlab[2] };
  const [owner, name] = ref.split('/');
  return { host: 'github', owner, name };
}

export function parseRepoUrl(url) {
  const gh = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/i.exec(url);
  if (gh && !['orgs', 'topics', 'features', 'sponsors', 'marketplace'].includes(gh[1].toLowerCase())) {
    return { host: 'github', owner: gh[1], name: gh[2] };
  }
  const gl = /^https?:\/\/(?:www\.)?gitlab\.(?:com|kitware\.com)\/((?:[\w.-]+\/)+[\w.-]+?)(?:\.git)?(?:\/-\/.*)?\/?$/i.exec(url);
  if (gl && /gitlab\.com/i.test(url)) {
    const parts = gl[1].split('/');
    return { host: 'gitlab', owner: parts.slice(0, -1).join('/'), name: parts.at(-1) };
  }
  return null;
}
