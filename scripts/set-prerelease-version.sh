#!/usr/bin/env bash
set -euo pipefail

npm version patch --no-git-tag-version --ignore-scripts > /dev/null
NEXT_VERSION=$(npm pkg get version | tr -d '"')
SHORT_SHA=$(git rev-parse --short HEAD)
PRE_VERSION="${NEXT_VERSION}-alpha.${SHORT_SHA}.${GITHUB_RUN_NUMBER}"

echo "Setting version to ${PRE_VERSION}"
npm version "${PRE_VERSION}" --no-git-tag-version --ignore-scripts
