import {expect, test} from 'vitest';
import {readFile} from 'node:fs/promises';

// Confirm bundle size is non-trivial (not a barrel file), but also not larger
// than the allocated bundle size budget. The budget includes the vendored fill-pattern
// atlas tiles, inlined as data URLs (SVGO-minified) since they must ship without a
// dynamic import.
const BUNDLE_SIZE_MIN = 10_000;
const BUNDLE_SIZE_MAX = 450_000;

test('bundle size', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const entryPath = pkg.exports['.']['default']['default'];
  const entry = await readFile(entryPath, 'utf8');

  expect(entry.length).toBeGreaterThan(BUNDLE_SIZE_MIN);
  expect(entry.length).toBeLessThan(BUNDLE_SIZE_MAX);
});
