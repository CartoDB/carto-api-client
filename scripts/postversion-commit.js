import {execSync} from 'node:child_process';
import {valid} from 'semver';

/**
 * Utility for committing and tagging a release commit in
 * git, called as part of the `yarn postversion` script.
 */

const {version} = await import('../package.json', {assert: {type: 'json'}});
if (!valid(version)) {
  throw new Error(`Invalid version, "${version}"`);
}

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
if (branch === 'main') {
  execSync(`git checkout -b 'release/${version}'`);
}

execSync('git add -u');
execSync(`git commit -m 'chore(release): ${version}'`);
execSync(`git tag -a ${version} -m ${version}`);
