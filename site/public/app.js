// Progressive enhancement for awesomedataviz.com. Every page works without
// this script; it adds search-as-you-type, sortable and filterable tables,
// chart tooltips, copy buttons and the theme toggle.

const SEARCH_MODULE = '__SEARCH_MODULE__';
const BUILD_ID = '__BUILD_ID__';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
};

/* Theme: system by default; the toggle stores an explicit choice. */
function initTheme() {
  const button = $('.theme-toggle');
  if (!button) return;
  const current = () =>
    document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const label = () => button.setAttribute('aria-label', current() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  label();
  button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    label();
  });
}

/* Search */
let searchState;
async function loadSearch() {
  if (!searchState) {
    searchState = (async () => {
      const [mod, data] = await Promise.all([import(SEARCH_MODULE), fetch(`/search-index.json?v=${BUILD_ID}`).then((r) => r.json())]);
      return { search: mod.search, index: mod.buildIndex(data.records) };
    })();
  }
  return searchState;
}

function resultItem(r, query) {
  const avatar = r.avatar
    ? el('img', { class: 'avatar', src: r.avatar, alt: '', width: '24', height: '24' })
    : el('span', { class: 'avatar avatar-letter', 'aria-hidden': 'true', style: '--size:24px', text: (r.name.match(/[A-Za-z0-9]/)?.[0] ?? '?').toUpperCase() });
  const text = el('span', { class: 'r-text' }, el('span', { class: 'r-name', text: r.name }), el('span', { class: 'r-desc', text: r.description }));
  const meta = el('span', { class: 'r-meta', text: r.stars != null ? `${fmt.format(r.stars)} ★` : r.category });
  const link = el('a', { href: `/tools/${r.slug}/`, tabindex: '-1' }, avatar, text, meta);
  return el('li', { role: 'option', id: `opt-${r.slug}`, 'aria-selected': 'false' }, link);
}

function initSearchBox(input) {
  const list = document.getElementById(input.getAttribute('aria-controls'));
  if (!list) return;
  let active = -1;
  let items = [];
  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const highlight = (i) => {
    items.forEach((li, j) => li.setAttribute('aria-selected', String(i === j)));
    active = i;
    if (items[i]) {
      input.setAttribute('aria-activedescendant', items[i].id);
      items[i].scrollIntoView({ block: 'nearest' });
    }
  };
  const update = async () => {
    const q = input.value.trim();
    if (!q) return close();
    const { search, index } = await loadSearch();
    if (input.value.trim() !== q) return;
    const results = search(index, q, { limit: 8 });
    list.replaceChildren();
    items = results.map(({ record }) => resultItem(record, q));
    if (items.length) list.append(...items);
    else list.append(el('li', { class: 'r-empty', text: `No tools match “${q}”.` }));
    const all = el('li', { class: 'r-all', role: 'option', id: `opt-all-${input.id}`, 'aria-selected': 'false' }, el('a', { href: `/search/?q=${encodeURIComponent(q)}`, tabindex: '-1', text: `See all results for “${q}”` }));
    list.append(all);
    items.push(all);
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    highlight(results.length ? 0 : -1);
  };
  input.addEventListener('focus', () => loadSearch(), { once: true });
  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlight(Math.min(items.length - 1, active + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight(Math.max(0, active - 1));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      location.href = $('a', items[active]).href;
    } else if (e.key === 'Escape') {
      close();
    }
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
}

function initSearch() {
  $$('input[aria-controls$="results"]').forEach(initSearchBox);
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
      e.preventDefault();
      ($('#hero-q') || $('#q'))?.focus();
    }
  });
  const page = $('#search-page-results');
  if (page) renderSearchPage(page);
}

async function renderSearchPage(container) {
  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  const input = $('#page-q');
  if (input) input.value = q;
  if (!q.trim()) {
    container.replaceChildren(el('p', { class: 'muted', text: 'Type what you need, for example “react charts”, “python 3d” or “maps”.' }));
    return;
  }
  const { search, index } = await loadSearch();
  const results = search(index, q, { limit: 60 });
  document.title = `${q} – Search | Awesome Dataviz`;
  const heading = el('p', { class: 'lead', text: `${results.length} ${results.length === 1 ? 'tool' : 'tools'} for “${q}”` });
  const list = el('ul', { class: 'card-grid' });
  for (const { record: r } of results) {
    const meta = el('p', { class: 'meta' });
    if (r.stars != null) meta.append(el('span', { text: `${fmt.format(r.stars)} stars` }));
    meta.append(el('span', { text: r.category }));
    if (r.license) meta.append(el('span', { text: r.license }));
    list.append(
      el(
        'li',
        { class: 'tool-card' },
        el('a', { class: 'tool-link', href: `/tools/${r.slug}/` }, el('span', { class: 'tool-name', text: r.name })),
        el('p', { text: r.description }),
        meta
      )
    );
  }
  container.replaceChildren(heading, results.length ? list : el('p', { text: 'Nothing matched. Try fewer or broader words, or browse all categories.' }));
}

/* Sortable tables */
function initTables() {
  for (const table of $$('table.sortable')) {
    const tbody = table.tBodies[0];
    const headers = $$('th[data-sort]', table);
    headers.forEach((th) => {
      const button = $('button', th);
      button?.addEventListener('click', () => {
        const key = th.dataset.sort;
        const numeric = ['rank', 'stars', 'commits', 'updated'].includes(key);
        const current = th.getAttribute('aria-sort');
        const dir = current === 'descending' ? 'ascending' : current === 'ascending' ? 'descending' : numeric && key !== 'rank' ? 'descending' : 'ascending';
        headers.forEach((h) => h.removeAttribute('aria-sort'));
        th.setAttribute('aria-sort', dir);
        const rows = [...tbody.rows];
        const value = (r) => (numeric ? Number(r.dataset[key]) : r.dataset[key] || '');
        rows.sort((a, b) => {
          const va = value(a), vb = value(b);
          const c = numeric ? va - vb : String(va).localeCompare(String(vb));
          return dir === 'ascending' ? c : -c;
        });
        tbody.append(...rows);
      });
    });
  }
}

/* Filters for the all-tools table, mirrored in the URL. */
function initFilters() {
  const form = $('form[data-filter-table]');
  if (!form) return;
  const table = document.getElementById(form.dataset.filterTable);
  const output = $('.filter-count', form);
  const params = new URLSearchParams(location.search);
  for (const field of form.elements) if (field.name && params.has(field.name)) field.value = params.get(field.name);
  const apply = () => {
    const f = Object.fromEntries(new FormData(form));
    const text = (f.text || '').trim().toLowerCase();
    let shown = 0;
    for (const row of table.tBodies[0].rows) {
      const ok =
        (!f.category || row.dataset.category === f.category) &&
        (!f.language || row.dataset.language === f.language) &&
        (!f.license || row.dataset.license === f.license) &&
        (!f.status || row.dataset.status === f.status) &&
        (!text || row.textContent.toLowerCase().includes(text));
      row.hidden = !ok;
      if (ok) shown++;
    }
    output.textContent = `${shown} ${shown === 1 ? 'tool' : 'tools'}`;
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) next.set(k, v);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
  };
  form.addEventListener('input', apply);
  form.addEventListener('submit', (e) => e.preventDefault());
  apply();
}

/* Chart tooltips: [data-tip] = JSON [title, [label, value, seriesClass?]...] */
function initTooltips() {
  const tip = $('.tooltip');
  if (!tip) return;
  let owner = null;
  const show = (node, x, y) => {
    let data;
    try {
      data = JSON.parse(node.dataset.tip);
    } catch {
      return;
    }
    const [title, ...rows] = data;
    tip.replaceChildren(el('div', { class: 'tt-title', text: title }));
    for (const [label, value, series] of rows) {
      tip.append(el('div', { class: 'tt-row' }, series ? el('span', { class: `tt-key ${series}` }) : null, el('span', { class: 'tt-value', text: value }), el('span', { class: 'tt-label', text: label })));
    }
    tip.hidden = false;
    const pad = 14;
    const { width, height } = tip.getBoundingClientRect();
    let left = x + pad;
    let top = y + pad;
    if (left + width > innerWidth - 8) left = x - width - pad;
    if (top + height > innerHeight - 8) top = y - height - pad;
    tip.style.left = `${Math.max(8, left)}px`;
    tip.style.top = `${Math.max(8, top)}px`;
    owner = node;
  };
  const hide = () => {
    tip.hidden = true;
    owner?.classList.remove('is-hot');
    owner = null;
  };
  document.addEventListener('pointermove', (e) => {
    const swarm = e.target.closest?.('svg.swarm');
    if (swarm) return nearestDot(swarm, e, show, hide);
    const node = e.target.closest?.('[data-tip]');
    if (node) show(node, e.clientX, e.clientY);
    else if (owner) hide();
  });
  document.addEventListener('focusin', (e) => {
    const node = e.target.closest?.('[data-tip]');
    if (!node) return;
    const r = node.getBoundingClientRect();
    show(node, r.left + r.width / 2, r.top);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('scroll', hide, { passive: true });

  // Landscape: the pointer only needs to be closest to a dot (within 24px).
  function nearestDot(svg, e, onShow, onHide) {
    const dots = svg._dots || (svg._dots = $$('a.dot-link', svg).map((a) => ({ a, c: $('circle', a) })));
    let best = null;
    let bestD = 24 * 24;
    for (const d of dots) {
      const r = d.c.getBoundingClientRect();
      const dx = r.left + r.width / 2 - e.clientX;
      const dy = r.top + r.height / 2 - e.clientY;
      const dist = dx * dx + dy * dy;
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    if (!best) {
      svg.style.cursor = '';
      return onHide();
    }
    if (owner !== best.a) owner?.classList.remove('is-hot');
    best.a.classList.add('is-hot');
    svg.style.cursor = 'pointer';
    svg._hot = best.a;
    onShow(best.a, e.clientX, e.clientY);
  }
  document.addEventListener('click', (e) => {
    const svg = e.target.closest?.('svg.swarm');
    if (svg?._hot && !e.target.closest('a')) location.href = svg._hot.getAttribute('href');
  });
}

/* Copy buttons */
function initCopy() {
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-copy]');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'Copied';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('copied');
      }, 1600);
    } catch {
      button.textContent = 'Press ⌘C';
    }
  });
}

initTheme();
initSearch();
initTables();
initFilters();
initTooltips();
initCopy();
