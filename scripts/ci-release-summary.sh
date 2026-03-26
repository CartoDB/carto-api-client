#!/usr/bin/env bash
set -euo pipefail

PKG_NAME="@carto/api-client"
VERSION="${PKG_VERSION#v}"

echo "## Release Summary"
echo ""

if [ "${DRY_RUN}" = "true" ]; then
  echo "> **Dry run** — package was not published."
  echo ""
fi

echo "| | |"
echo "|---|---|"
echo "| **Package** | \`${PKG_NAME}@${VERSION}\` |"
echo "| **Dist tag** | \`${DIST_TAG}\` |"
echo "| **Commit** | \`${GITHUB_SHA::7}\` |"
echo ""
echo "### Links"
echo ""
echo "- [npm](https://www.npmjs.com/package/${PKG_NAME}/v/${VERSION})"
echo "- [unpkg](https://unpkg.com/browse/${PKG_NAME}@${VERSION}/)"
echo ""
echo "### Install"
echo ""
echo "\`\`\`bash"
echo "npm install ${PKG_NAME}@${VERSION}"
echo "\`\`\`"
