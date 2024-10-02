import {execSync} from 'node:child_process';
import pkg from '../package.json' assert {type: 'json'};

/**
 * Utility for committing and tagging a release commit in
 * git, called as part of the `yarn postversion` script.
 */

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

if (currentBranch === 'main') {
  execSync(`git checkout -b 'release/${pkg.version}'`);
}

execSync('git add -u');
execSync(`git commit -m 'chore(release): ${pkg.version}'`);
execSync(`git tag -a ${pkg.version} -m ${pkg.version}`);
