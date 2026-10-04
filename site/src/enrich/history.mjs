// When each entry first appeared in the README, from one pass over its git
// history (oldest commit first). Powers "added on" dates, the "recently
// added" list and the RSS feed.

import { execFileSync } from 'node:child_process';

export function readmeHistory(readmePath, cwd) {
  let log;
  try {
    log = execFileSync('git', ['log', '--reverse', '--no-merges', '-p', '--unified=0', '--format=@@commit %H %aI', '--', readmePath], {
      cwd,
      maxBuffer: 256 * 1024 * 1024,
    }).toString();
  } catch {
    return null; // not a git checkout
  }
  const additions = []; // [{ date, line }]
  let date = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('@@commit ')) date = line.split(' ')[2];
    else if (line.startsWith('+') && !line.startsWith('+++') && date) additions.push({ date, line });
  }
  return additions;
}

// First date any of `needles` (URL, "[Name](", former URLs) was added.
export function firstAdded(additions, needles) {
  if (!additions) return null;
  const wanted = needles.filter(Boolean);
  for (const { date, line } of additions) {
    if (wanted.some((n) => line.includes(n))) return date;
  }
  return null;
}
