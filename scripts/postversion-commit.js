import {execSync} from 'node:child_process';

/**
 * Utility for committing and tagging a release commit in
 * git, called as part of the `yarn postversion` script.
 */

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const {version} = require('../package.json');

if (branch === 'main') {
  execSync(`git checkout -b 'release/${version}'`);
}

execSync('git add -u');
execSync(`git commit -m 'chore(release): ${version}'`);
execSync(`git tag -a ${version} -m ${version}`);
