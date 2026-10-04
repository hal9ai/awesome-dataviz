// Minimal inline Markdown support for README list items: links, bold,
// emphasis and code spans. The README only uses these, so a full parser
// would be dead weight.

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Reads a `[text](url)` link starting at `start` (which must point at `[`).
// URLs may contain balanced parentheses, e.g. Wikipedia's `Plot_(graphics)`.
export function readLink(source, start) {
  if (source[start] !== '[') return null;
  let depth = 0;
  let i = start;
  for (; i < source.length; i++) {
    if (source[i] === '[') depth++;
    else if (source[i] === ']' && --depth === 0) break;
  }
  if (i >= source.length || source[i + 1] !== '(') return null;
  const text = source.slice(start + 1, i);
  let parens = 0;
  let j = i + 1;
  for (; j < source.length; j++) {
    if (source[j] === '(') parens++;
    else if (source[j] === ')' && --parens === 0) break;
  }
  if (j >= source.length) return null;
  const url = source.slice(i + 2, j).trim();
  return { text, url, end: j + 1 };
}

// Splits inline Markdown into tokens: { type: 'text' | 'link' | 'code' | 'strong' | 'em' }.
export function tokenize(source) {
  const tokens = [];
  let text = '';
  const flush = () => {
    if (text) tokens.push({ type: 'text', value: text });
    text = '';
  };
  for (let i = 0; i < source.length; ) {
    const ch = source[i];
    if (ch === '[') {
      const link = readLink(source, i);
      if (link) {
        flush();
        tokens.push({ type: 'link', text: link.text, url: link.url });
        i = link.end;
        continue;
      }
    }
    if (ch === '`') {
      const end = source.indexOf('`', i + 1);
      if (end > i) {
        flush();
        tokens.push({ type: 'code', value: source.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (ch === '*' && source[i + 1] === '*') {
      const end = source.indexOf('**', i + 2);
      if (end > i + 2) {
        flush();
        tokens.push({ type: 'strong', value: source.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if ((ch === '*' || ch === '_') && /\S/.test(source[i + 1] || '') && !/\w/.test(source[i - 1] || '')) {
      const end = source.indexOf(ch, i + 1);
      if (end > i + 1 && !/\w/.test(source[end + 1] || '')) {
        flush();
        tokens.push({ type: 'em', value: source.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    text += ch;
    i++;
  }
  flush();
  return tokens;
}

export function inlineToText(source) {
  return tokenize(source)
    .map((t) => (t.type === 'link' ? inlineToText(t.text) : t.value))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

// Renders inline Markdown to HTML. `resolveUrl` lets the caller rewrite README
// anchors (#r-tools) to site pages; external links get rel=noopener.
export function inlineToHtml(source, { resolveUrl = (u) => u } = {}) {
  return tokenize(source)
    .map((t) => {
      switch (t.type) {
        case 'link': {
          const href = resolveUrl(t.url);
          const external = /^https?:\/\//.test(href);
          const rel = external ? ' rel="noopener"' : '';
          return `<a href="${escapeHtml(href)}"${rel}>${inlineToHtml(t.text, { resolveUrl })}</a>`;
        }
        case 'code':
          return `<code>${escapeHtml(t.value)}</code>`;
        case 'strong':
          return `<strong>${escapeHtml(t.value)}</strong>`;
        case 'em':
          return `<em>${escapeHtml(t.value)}</em>`;
        default:
          return escapeHtml(t.value);
      }
    })
    .join('');
}

// GitHub's heading anchor algorithm, so README anchors can be mapped to pages.
export function githubAnchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}
