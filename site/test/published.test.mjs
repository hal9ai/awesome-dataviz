import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugRedirects, redirectMap, keptPairs } from '../src/published.mjs';

const tool = (slug, repoUrl, homepage = null) => ({ slug, repoUrl, homepage });
const model = {
  tools: [tool('react-flow', 'https://github.com/xyflow/xyflow'), tool('chart-js', 'https://github.com/chartjs/Chart.js', 'https://www.chartjs.org/')],
};
model.toolBySlug = new Map(model.tools.map((t) => [t.slug, t]));

test('renamed tools redirect by repository or homepage', () => {
  const published = {
    tools: [
      { slug: 'xyflow', repository: 'https://github.com/xyflow/xyflow', homepage: null },
      { slug: 'chartjs', repository: null, homepage: 'https://www.chartjs.org' },
      { slug: 'gone', repository: 'https://github.com/a/b', homepage: null },
      { slug: 'chart-js', repository: 'https://github.com/chartjs/Chart.js', homepage: null },
    ],
    comparisons: ['chartjs-vs-xyflow', 'chart-js-vs-react-flow'],
  };
  const moved = slugRedirects(model, published);
  assert.deepEqual(moved, { xyflow: 'react-flow', chartjs: 'chart-js' });
  assert.deepEqual(keptPairs(published, moved), [['chart-js', 'react-flow'], ['chart-js', 'react-flow']]);
  const map = redirectMap(moved, published, [{ slug: 'chart-js-vs-react-flow' }]);
  assert.equal(map['/tools/xyflow/'], '/tools/react-flow/');
  assert.equal(map['/api/tools/chartjs.json'], '/api/tools/chart-js.json');
  assert.equal(map['/compare/chartjs-vs-xyflow/'], '/compare/chart-js-vs-react-flow/');
  assert.equal(map['/tools/gone/'], undefined);
});
