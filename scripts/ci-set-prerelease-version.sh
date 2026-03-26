#!/usr/bin/env bash
set -euo pipefail

#
# we bump patch version add -alpha-{sha}-{pipeline-id} suffix
# example: 0.5.25 is on main, we make 0.5.26-alpha.a1b2c3d.42
#
npm version patch --no-git-tag-version --ignore-scripts > /dev/null
NEXT_VERSION=$(npm pkg get version | tr -d '"')
SHORT_SHA=$(git rev-parse --short HEAD)
PRE_VERSION="${NEXT_VERSION}-alpha.${SHORT_SHA}.${GITHUB_RUN_NUMBER}"

echo "set-prerelease-version: setting version to ${PRE_VERSION}" 2>&1
npm version "${PRE_VERSION}" --no-git-tag-version --ignore-scripts
