import {expect, test} from 'vitest';
import {readFile} from 'node:fs/promises';

// Confirm bundle size is non-trivial (not a barrel file), but also not larger
// than the allocated bundle size budget.
const BUNDLE_SIZE_MIN = 10_000;
const BUNDLE_SIZE_MAX = 400_000;

test('bundle size', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const entryPath = pkg.exports['.']['default']['default'];
  const entry = await readFile(entryPath, 'utf8');

  expect(entry.length).toBeGreaterThan(BUNDLE_SIZE_MIN);
  expect(entry.length).toBeLessThan(BUNDLE_SIZE_MAX);
});
