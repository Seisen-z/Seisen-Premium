import assert from 'node:assert/strict';
import { test } from 'node:test';
import { niceMax, smooth } from './trackstat-chart.ts';

const numbers = (path: string) => path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);

test('the axis ends on a round number just above the data', () => {
  assert.equal(niceMax(1), 1);
  assert.equal(niceMax(7), 10);
  assert.equal(niceMax(12), 20);
  assert.equal(niceMax(20000), 20000);
  assert.equal(niceMax(24500), 50000);
  assert.equal(niceMax(33800), 50000);
  assert.equal(niceMax(0.3), 0.5);
});

test('a single point makes a path that is just a start', () => {
  assert.equal(smooth([5], [9]), 'M5,9');
});

test('the curve passes through every point', () => {
  const xs = [0, 100, 200, 300], ys = [180, 40, 120, 60];
  const path = smooth(xs, ys);
  assert.ok(path.startsWith('M0,180'));
  for (let i = 1; i < xs.length; i++) assert.ok(path.includes(` ${xs[i]},${ys[i]}`), `point ${i} is on the path`);
});

test('the curve never bulges past the points next to it', () => {
  // a sharp peak and a flat stretch are where a plain smooth curve overshoots
  const xs = [0, 100, 200, 300, 400, 500], ys = [200, 200, 40, 200, 200, 200];
  const values = numbers(smooth(xs, ys));
  const vertical = values.filter((_, i) => i % 2 === 1);
  assert.ok(Math.min(...vertical) >= 40 - 1e-9, 'never above the peak');
  assert.ok(Math.max(...vertical) <= 200 + 1e-9, 'never below the floor');
});

test('a rising line stays rising between its points', () => {
  const path = smooth([0, 100, 200, 300], [200, 150, 90, 20]);
  const v = numbers(path).filter((_, i) => i % 2 === 1);
  assert.deepEqual([...v].sort((a, b) => b - a), v, 'heights only go up the page');
});
