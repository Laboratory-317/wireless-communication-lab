'use strict';
// Validate the drawn geometry against independent mathematical references.
const assert = require('node:assert/strict');
const { renderDiagram } = require('../scientific-site/diagrams.cjs');
const groups = ['desktop', 'mobile'];
function group(svg, name) {
  const token = '<g class="sc-' + name + '">';
  const start = svg.indexOf(token);
  assert(start >= 0);
  const end = name === 'desktop'
    ? svg.indexOf('<g class="sc-mobile">', start)
    : svg.lastIndexOf('</svg>');
  return svg.slice(start + token.length, end);
}
const attr = (tag, name) => Number(tag.match(new RegExp('\\b' + name + '="([^"]+)"'))[1]);
function kron(a, b) {
  return Array.from({ length: a.length * b.length }, (_, i) =>
    Array.from({ length: a[0].length * b[0].length }, (_, j) =>
      a[Math.floor(i / b.length)][Math.floor(j / b[0].length)]
      * b[i % b.length][j % b[0].length]));
}
const f = [[1, 0], [1, 1]], matrix = kron(kron(f, f), f);
for (const layout of groups) {
  const svg = group(renderDiagram('polar', 'ru', 'expanded', 'polar-check'), layout);
  const [x0, dx, y0, dy, span] = layout === 'desktop'
    ? [228, 171, 98, 36, 44] : [230, 190, 111, 39, 80];
  const pairs = [...svg.matchAll(/<line\b[^>]*\/>/g)].map(m => {
    const tag = m[0];
    return ['x1', 'y1', 'x2', 'y2'].map(name => attr(tag, name));
  }).filter(([x1, y1, x2, y2]) => x2 - x1 === span && y2 < y1)
    .map(([, y1, x2, y2]) => [(x2 - x0) / dx, (y2 - y0) / dy, (y1 - y0) / dy])
    .sort((a, b) => a[0] - b[0]);
  assert.equal(pairs.length, 12, layout + ': XOR count');
  assert(pairs.flat().every(Number.isInteger));
  for (let word = 0; word < 256; word++) {
    const u = Array.from({ length: 8 }, (_, i) => (word >> i) & 1);
    const expected = matrix[0].map((_, j) =>
      u.reduce((sum, bit, i) => sum ^ (bit & matrix[i][j]), 0));
    const actual = [...u];
    for (const [, i, j] of pairs) actual[i] ^= actual[j];
    assert.deepEqual(actual, expected, layout + ': polar input ' + word);
  }
  const qam = group(renderDiagram('dsp', 'en', 'expanded', 'qam-check'), layout);
  const points = [...qam.matchAll(/<circle\b[^>]*class="sc-dot"[^>]*\/>/g)]
    .map(m => [attr(m[0], 'cx'), attr(m[0], 'cy')]);
  assert.equal(points.length, 32);
  const [beforeX, afterX, cy, scale] = layout === 'desktop'
    ? [188, 560, 223, 26] : [190, 570, 242, 22];
  const phi = Math.PI / 9, levels = [-3, -1, 1, 3];
  points.slice(0, 16).forEach(([x, y], i) => {
    const re = x - beforeX, im = cy - y;
    const [targetX, targetY] = points[i + 16];
    assert(Math.abs(re * Math.cos(phi) + im * Math.sin(phi) - (targetX - afterX)) < 0.001);
    assert(Math.abs(-re * Math.sin(phi) + im * Math.cos(phi) - (cy - targetY)) < 0.001);
    assert(levels.includes((targetX - afterX) / scale));
    assert(levels.includes((cy - targetY) / scale));
  });
}
console.log('SVG mathematics: desktop/mobile, 512 polar vectors and 32 QAM rotations passed.');
