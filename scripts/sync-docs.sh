#!/bin/sh
# Copy the app (src/index.html, js/, css/) into docs/ for GitHub Pages.
# Usage: scripts/sync-docs.sh          # sync
#        scripts/sync-docs.sh --check  # exit 1 if docs/ is out of sync
set -e
cd "$(dirname "$0")/.."

if [ "$1" = "--check" ]; then
    status=0
    diff -r js docs/js >/dev/null || { echo "docs/js differs from js/"; status=1; }
    diff -r css docs/css >/dev/null || { echo "docs/css differs from css/"; status=1; }
    sed 's#\.\./#./#g' src/index.html | diff - docs/index.html >/dev/null || { echo "docs/index.html differs from src/index.html"; status=1; }
    [ $status -eq 0 ] && echo "docs/ is in sync"
    exit $status
fi

rm -rf docs/js docs/css
cp -R js docs/js
cp -R css docs/css
sed 's#\.\./#./#g' src/index.html > docs/index.html
echo "docs/ synced"
