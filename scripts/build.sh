#!/usr/bin/env bash
# Copies app/ to dist/ and stamps the git sha into the meta tag and the footer (R6).
set -euo pipefail
cd "$(dirname "$0")/.."
SHA="$(git rev-parse --short=12 HEAD)"
if ! git diff --quiet HEAD -- app; then echo "app/ has uncommitted changes; commit first" >&2; exit 1; fi
rm -rf dist && cp -R app dist
sed -i.bak "s/__BUILD_SHA__/$SHA/g" dist/index.html && rm dist/index.html.bak
echo "built $SHA"
