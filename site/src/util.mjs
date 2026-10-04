// Small helpers shared across the build.

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+\+/g, 'pp')
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en');

// 1284 -> "1.3K"; small numbers stay exact.
export const formatCompact = (n) => (n == null ? '–' : n < 1000 ? String(n) : compact.format(n));
export const formatNumber = (n) => (n == null ? '–' : full.format(n));

const dateFmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', timeZone: 'UTC' });
export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '–');
export const formatMonth = (iso) => (iso ? monthFmt.format(new Date(iso)) : '–');

// "3 days ago", "5 months ago", "2 years ago" relative to `now`.
export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '–';
  const days = Math.max(0, Math.round((now - Date.parse(iso)) / 86400000));
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 31) return `${days} days ago`;
  const months = Math.round(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round((days / 365.25) * 10) / 10;
  const y = years >= 2 ? Math.round(years) : years;
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

// "per week", "per 90 days", "in total" for a package's download period.
export const perPeriod = (period) => (period === 'all time' ? 'in total' : `per ${period}`);

export const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;

export function joinList(items, conjunction = 'and') {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items.at(-1)}`;
}
