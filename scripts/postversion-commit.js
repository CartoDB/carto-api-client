import {execSync} from 'node:child_process';
import {version} from '../package.json';

/**
 * Utility for committing and tagging a release commit in
 * git, called as part of the `yarn postversion` script.
 */

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

if (currentBranch === 'main') {
  execSync(`git checkout -b 'release/${version}'`);
}

execSync('git add -u');
execSync(`git commit -m 'chore(release): ${version}'`);
execSync(`git tag -a ${version} -m ${version}`);
