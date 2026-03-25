#!/usr/bin/env bash
set -euo pipefail

BASE_VERSION=$(npm pkg get version | tr -d '"')
SHORT_SHA=$(git rev-parse --short HEAD)
PRE_VERSION="${BASE_VERSION}-alpha.${SHORT_SHA}.${GITHUB_RUN_NUMBER}"

echo "Setting version to ${PRE_VERSION}"
yarn version "${PRE_VERSION}"
