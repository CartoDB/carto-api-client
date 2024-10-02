import {execSync} from 'node:child_process';
import assert from 'node:assert/strict';

/**
 * Utility for committing and tagging a release commit in
 * git, called as part of the `yarn postversion` script.
 */

const version = process.env.VERSION;

assert.match(
  version,
  /^v\d+\.\d+\.\d+[a-zA-Z0-9\._-]*$/,
  'Missing or invalid process.env.VERSION'
);

const currentBranch = execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim();

if (currentBranch === 'main') {
  execSync(`git checkout -b 'release/${version}'`);
}

execSync('git add -u');
execSync(`git commit -m 'chore(release): ${version}'`);
execSync(`git tag -a ${version} -m ${version}`);
