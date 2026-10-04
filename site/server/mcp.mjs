// Remote MCP server (Streamable HTTP transport, stateless, JSON responses).
// Exposes the directory to AI assistants through four read-only tools.
// Spec: https://modelcontextprotocol.io/specification

import { search } from './search.mjs';

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER_INFO = { name: 'awesome-dataviz', title: 'Awesome Dataviz', version: '1.0.0', websiteUrl: 'https://awesomedataviz.com' };
const MAX_BODY = 1024 * 1024;

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function toolDefinitions(site) {
  const n = site.tools.size;
  return [
    {
      name: 'search_dataviz_tools',
      title: 'Search data visualization tools',
      description: `Search a curated directory of ${n} data visualization tools: charting libraries, maps, graph and network visualization, 3D, dashboards, diagrams as code and more, for JavaScript, Python, R, Rust, C++, mobile and other platforms. Results are ranked by relevance and popularity and include GitHub stars, license, maintenance status and install commands. Use it to recommend tools, for example "React chart library", "Python 3D plotting" or "terminal charts".`,
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What is needed, in a few words, e.g. "react charts", "network graph", "maps webgl".' },
          category: { type: 'string', description: 'Optional category slug, e.g. "python", "react", "javascript-maps". Use list_dataviz_categories to see them.' },
          topic: { type: 'string', description: 'Optional topic slug, e.g. "maps", "3d-and-scientific", "terminal", "financial-charts".' },
          language: { type: 'string', description: 'Optional primary programming language, e.g. "Python", "TypeScript", "Rust".' },
          maintained_only: { type: 'boolean', description: 'Only return tools with commits in the last 12 months.' },
          limit: { type: 'integer', minimum: 1, maximum: 25, description: 'Maximum results (default 8).' },
        },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { title: 'Search data visualization tools', ...READ_ONLY },
    },
    {
      name: 'get_dataviz_tool',
      title: 'Get a data visualization tool',
      description: 'Get everything known about one tool: description, category, website and repository, license, maintenance status, GitHub stars, contributors, commits per month for the last year, latest release, verified install commands with weekly downloads, and alternatives.',
      inputSchema: {
        type: 'object',
        properties: { tool: { type: 'string', description: 'Tool slug or name, e.g. "chart-js", "Chart.js", "matplotlib".' } },
        required: ['tool'],
        additionalProperties: false,
      },
      annotations: { title: 'Get a data visualization tool', ...READ_ONLY },
    },
    {
      name: 'compare_dataviz_tools',
      title: 'Compare data visualization tools',
      description: 'Compare two to five tools side by side: GitHub stars, commits in the last 12 months, contributors, downloads, license, language, maintenance status, latest release and install commands.',
      inputSchema: {
        type: 'object',
        properties: { tools: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5, description: 'Tool slugs or names, e.g. ["chart-js", "echarts"].' } },
        required: ['tools'],
        additionalProperties: false,
      },
      annotations: { title: 'Compare data visualization tools', ...READ_ONLY },
    },
    {
      name: 'list_dataviz_categories',
      title: 'List categories and topics',
      description: 'List the directory categories (by language and platform) and cross-cutting topics (maps, 3D, terminal, financial...), with slugs, tool counts and top tools. Use the slugs to filter search_dataviz_tools.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { title: 'List categories and topics', ...READ_ONLY },
    },
  ];
}

class ToolError extends Error {}

function findTool(site, ref) {
  if (typeof ref !== 'string' || !ref.trim()) throw new ToolError('Provide a tool slug or name.');
  const key = ref.trim().toLowerCase();
  if (site.tools.has(key)) return site.tools.get(key);
  for (const t of site.tools.values()) if (t.name.toLowerCase() === key) return t;
  const [best] = search(site.index, ref, { limit: 1 });
  if (best) return site.tools.get(best.record.slug);
  throw new ToolError(`No tool matches "${ref}". Try search_dataviz_tools.`);
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const n = (v) => (v == null ? 'n/a' : v < 1000 ? String(v) : compact.format(v));

function summaryLine(t) {
  const bits = [t.stars != null ? `${n(t.stars)} GitHub stars` : null, t.license, t.status, t.packages[0] ? `\`${t.packages[0].install}\`` : null].filter(Boolean);
  return `**${t.name}** (${t.category.title}): ${t.description}${bits.length ? ` ${bits.join(' · ')}` : ''}\n   ${t.url}`;
}

function compactTool(t) {
  return {
    slug: t.slug,
    name: t.name,
    url: t.url,
    description: t.description,
    category: t.category.slug,
    homepage: t.homepage,
    repository: t.repository,
    language: t.language,
    license: t.license,
    status: t.status,
    stars: t.stars,
    commitsLast12Months: t.commitsLast12Months,
    install: t.packages.map((p) => p.install),
  };
}

function callTool(site, name, args = {}) {
  const updated = site.build.builtAt.slice(0, 10);
  switch (name) {
    case 'search_dataviz_tools': {
      if (typeof args.query !== 'string') throw new ToolError('"query" is required.');
      const limit = Math.min(25, Math.max(1, Number(args.limit) || 8));
      const results = search(site.index, args.query, {
        limit,
        category: args.category || undefined,
        topic: args.topic || undefined,
        language: args.language || undefined,
        status: args.maintained_only ? 'maintained' : undefined,
      }).map(({ record }) => site.tools.get(record.slug));
      const text = results.length
        ? `${results.length} tools for "${args.query}" (data updated ${updated}):\n\n${results.map((t, i) => `${i + 1}. ${summaryLine(t)}`).join('\n')}\n\nAll tools: https://awesomedataviz.com/tools/`
        : `No tools matched "${args.query}". Try broader words, or call list_dataviz_categories.`;
      return { text, structured: { query: args.query, updated, results: results.map(compactTool) } };
    }
    case 'get_dataviz_tool': {
      const t = findTool(site, args.tool);
      const lines = [
        `# ${t.name}`,
        '',
        t.description,
        '',
        `- Page: ${t.url}`,
        t.homepage && `- Website: ${t.homepage}`,
        t.repository && `- Repository: ${t.repository}`,
        `- Category: ${t.category.title}`,
        t.license && `- License: ${t.license}`,
        t.language && `- Language: ${t.language}`,
        t.status && `- Status: ${t.status}${t.lastCommitAt ? ` (last commit ${t.lastCommitAt.slice(0, 10)})` : ''}`,
        t.stars != null && `- GitHub stars: ${t.stars.toLocaleString('en')}`,
        t.contributors != null && `- Contributors: ${t.contributors.toLocaleString('en')}`,
        t.commitsLast12Months != null && `- Commits in the last 12 months: ${t.commitsLast12Months.toLocaleString('en')}`,
        t.latestRelease && `- Latest release: ${t.latestRelease.tag} (${t.latestRelease.publishedAt?.slice(0, 10)})`,
        ...t.packages.map((p) => `- Install (${p.registry}): \`${p.install}\`${p.downloads != null ? `, ${n(p.downloads)} downloads ${p.downloadsPeriod === 'all time' ? 'in total' : `per ${p.downloadsPeriod}`}` : ''}`),
        t.alternatives.length && `- Alternatives: ${t.alternatives.map((s) => site.tools.get(s)?.name ?? s).join(', ')}`,
        '',
        `Data updated ${updated}.`,
      ].filter(Boolean);
      return { text: lines.join('\n'), structured: t };
    }
    case 'compare_dataviz_tools': {
      if (!Array.isArray(args.tools) || args.tools.length < 2) throw new ToolError('Provide at least two tools.');
      const tools = [...new Set(args.tools.slice(0, 5).map((ref) => findTool(site, ref)))];
      if (tools.length < 2) throw new ToolError('Provide at least two different tools.');
      const row = (label, fn) => `| ${label} | ${tools.map((t) => String(fn(t) ?? 'n/a').replace(/\|/g, '\\|')).join(' | ')} |`;
      const text = [
        `| | ${tools.map((t) => t.name).join(' | ')} |`,
        `|---|${tools.map(() => '---').join('|')}|`,
        row('Category', (t) => t.category.title),
        row('GitHub stars', (t) => (t.stars != null ? t.stars.toLocaleString('en') : null)),
        row('Commits (12 months)', (t) => t.commitsLast12Months?.toLocaleString('en')),
        row('Contributors', (t) => t.contributors?.toLocaleString('en')),
        row('License', (t) => t.license),
        row('Language', (t) => t.language),
        row('Status', (t) => t.status),
        row('Latest release', (t) => (t.latestRelease ? `${t.latestRelease.tag} (${t.latestRelease.publishedAt?.slice(0, 10)})` : null)),
        row('Install', (t) => t.packages.map((p) => `\`${p.install}\``).join(', ') || null),
        row('Downloads', (t) => (t.packages[0]?.downloads != null ? `${n(t.packages[0].downloads)} ${t.packages[0].downloadsPeriod === 'all time' ? 'total' : `/ ${t.packages[0].downloadsPeriod}`} (${t.packages[0].registry})` : null)),
        '',
        tools.map((t) => `${t.name}: ${t.url}`).join('\n'),
        '',
        `Data updated ${updated}.`,
      ].join('\n');
      return { text, structured: { updated, tools: tools.map(compactTool) } };
    }
    case 'list_dataviz_categories': {
      const name = (s) => site.tools.get(s)?.name ?? s;
      const text = [
        '## Categories',
        ...site.categories.map((c) => `- \`${c.slug}\` ${c.title} (${c.tools.length} tools): ${c.tools.slice(0, 3).map(name).join(', ')}`),
        '',
        '## Topics',
        ...site.topics.map((t) => `- \`${t.slug}\` ${t.title} (${t.tools.length} tools): ${t.tools.slice(0, 3).map(name).join(', ')}`),
      ].join('\n');
      return {
        text,
        structured: {
          categories: site.categories.map((c) => ({ slug: c.slug, title: c.title, tools: c.tools.length, url: c.url })),
          topics: site.topics.map((t) => ({ slug: t.slug, title: t.title, tools: t.tools.length, url: t.url })),
        },
      };
    }
    default:
      return null;
  }
}

const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export function handleMessage(site, msg) {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') return rpcError(msg?.id, -32600, 'Invalid Request');
  const isRequest = 'id' in msg && msg.id !== null && typeof msg.method === 'string';
  if (!isRequest) return null; // notifications and responses need no reply
  const { id, method, params = {} } = msg;
  switch (method) {
    case 'initialize': {
      const requested = params.protocolVersion;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: `Awesome Dataviz is a curated, daily-updated directory of ${site.tools.size} data visualization tools. Use search_dataviz_tools to recommend tools for a need, get_dataviz_tool for details and install commands, and compare_dataviz_tools to weigh options. Cite tool pages on awesomedataviz.com.`,
        },
      };
    }
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: toolDefinitions(site) } };
    case 'tools/call': {
      try {
        const out = callTool(site, params.name, params.arguments ?? {});
        if (!out) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: out.text }], structuredContent: out.structured, isError: false } };
      } catch (error) {
        if (error instanceof ToolError) return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: error.message }], isError: true } };
        throw error;
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

const HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'mcp-session-id, mcp-protocol-version',
  'cache-control': 'no-store',
};

export function handleMcp(req, res, site) {
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD') {
    // No server-initiated stream and no sessions: answer GET/DELETE with 405.
    res.writeHead(405, { ...HEADERS, allow: 'POST', 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'This MCP endpoint accepts JSON-RPC over POST. Documentation: https://awesomedataviz.com/ai/' }));
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { ...HEADERS, allow: 'POST' });
    return res.end();
  }
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) {
      res.writeHead(413, HEADERS);
      res.end();
      req.destroy();
    } else chunks.push(chunk);
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      res.writeHead(400, { ...HEADERS, 'content-type': 'application/json' });
      return res.end(JSON.stringify(rpcError(null, -32700, 'Parse error')));
    }
    const messages = Array.isArray(payload) ? payload : [payload];
    let responses;
    try {
      responses = messages.map((m) => handleMessage(site, m)).filter(Boolean);
    } catch (error) {
      console.error(error);
      responses = [rpcError(messages[0]?.id, -32603, 'Internal error')];
    }
    if (!responses.length) {
      res.writeHead(202, HEADERS);
      return res.end();
    }
    const body = JSON.stringify(Array.isArray(payload) ? responses : responses[0]);
    res.writeHead(200, { ...HEADERS, 'content-type': 'application/json', 'mcp-protocol-version': PROTOCOL_VERSIONS[0] });
    res.end(body);
  });
}
