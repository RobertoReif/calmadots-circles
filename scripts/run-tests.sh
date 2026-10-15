#!/bin/sh
# Run test/app.test.js against src/index.html in headless Chrome.
# Needs Google Chrome and network access (pdf-lib loads from a CDN).
# Exits 1 if any check fails.
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Point the page at the repo's files and append the test script
sed -e "s#\.\./js/#file://$ROOT/js/#g" \
    -e "s#\.\./css/#file://$ROOT/css/#g" \
    -e "s#</body>#<script src=\"file://$ROOT/test/app.test.js\"></script></body>#" \
    src/index.html > "$TMP/index.html"

"$CHROME" --headless=new --allow-file-access-from-files --disable-gpu \
    --virtual-time-budget=60000 --dump-dom "file://$TMP/index.html" 2>/dev/null \
    | sed -n '/<pre id="results">/,/<\/pre>/p' | sed -e 's#<pre id="results">##' -e 's#</pre>.*##' > "$TMP/results.txt"

cat "$TMP/results.txt"
if [ ! -s "$TMP/results.txt" ] || grep -q "^FAIL\|^ERROR" "$TMP/results.txt"; then
    echo "Tests failed"
    exit 1
fi
echo "All tests passed"
