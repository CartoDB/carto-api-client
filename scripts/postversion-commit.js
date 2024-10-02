import {execSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {valid} from 'semver';

/**
 * Utility for committing and tagging a release commit in
 * git, called as part of the `yarn postversion` script.
 */

// Read and validate pkg.version.
const pkgJSON = await readFile(resolve('./package.json'), 'utf-8');
const version = 'v' + JSON.parse(pkgJSON).version;
if (!valid(version)) {
  throw new Error(`Invalid version, "${version}"`);
}

// Check out a branch if cutting a version from 'main'.
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
if (branch === 'main') {
  execSync(`git checkout -b 'release/${version}'`);
}

// Commit and tag.
execSync('git add -u');
execSync(`git commit -m 'chore(release): ${version}'`);
execSync(`git tag -a ${version} -m ${version}`);
