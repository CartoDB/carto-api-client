import {expect, test} from 'vitest';
import {readFile} from 'node:fs/promises';
import resolvePackagePath from 'resolve-package-path';

test('dependencies support esm', async () => {
  // Avoid CJS-only dependencies, which cause issues for downstream users.
  // TODO: After Node.js v22 is the lowest version used in CI, replace the
  // `new URL(...)` and `resolve-package-path` lookups with the built-in
  // `module.findPackageJsonPath` in Node.js v22+.
  const pkgQueue = [new URL('../package.json', import.meta.url).pathname];
  const pkgVisited = new Set<string>();

  for (const path of pkgQueue) {
    const pkg = JSON.parse(await readFile(path, 'utf8'));

    expect(
      pkg.type === 'module' ||
        pkg.exports !== undefined ||
        pkg.module !== undefined,
      `${pkg.name} must be esm`
    ).toBeTruthy();

    pkgVisited.add(pkg.name);

    const dependencies = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
    const peerDependencies = pkg.peerDependencies
      ? Object.keys(pkg.peerDependencies)
      : [];
    for (const dep of [...dependencies, ...peerDependencies]) {
      if (!pkgVisited.has(dep) && !dep.startsWith('@types/')) {
        pkgQueue.push(resolvePackagePath(dep, path));
      }
    }
  }
});
