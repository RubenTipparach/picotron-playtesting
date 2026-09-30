#!/usr/bin/env bash
#
# browser-smoke.sh - open every exported cart (carts-dist/<name>/index.html)
# in headless Chromium, click to start, screenshot, and fail if a cart's
# screen stays blank. Screenshots land in carts-dist/<name>/smoke.png.
#
# Needs node + Playwright's Chromium. In CI this installs playwright into
# .smoke/ (gitignored); locally set PLAYWRIGHT_MODULE to an installed copy.
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
log() { printf '\033[1;36m[browser-smoke]\033[0m %s\n' "$*"; }

shopt -s nullglob
pages=(carts-dist/*/index.html)
[[ ${#pages[@]} -gt 0 ]] || { log "no exported carts"; exit 0; }

if [[ -z "${PLAYWRIGHT_MODULE:-}" ]]; then
  mkdir -p .smoke
  ( cd .smoke && [[ -d node_modules/playwright ]] || npm install --no-save --silent playwright@1.56.1 >/dev/null )
  npx --prefix .smoke playwright install --with-deps chromium >/dev/null
  export PLAYWRIGHT_MODULE="$ROOT/.smoke/node_modules/playwright"
fi

PORT="${SMOKE_PORT:-8799}"
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory carts-dist >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1

failed=0
for p in "${pages[@]}"; do
  name="$(basename "$(dirname "$p")")"
  log "$name"
  rc=0
  node tools/picotron/browser_smoke.mjs "http://127.0.0.1:$PORT/$name/index.html" "carts-dist/$name/smoke" || rc=$?
  [[ $rc == 0 ]] || failed=1
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "- browser smoke \`$name\`: $([[ $rc == 0 ]] && echo pass || echo FAIL)" >> "$GITHUB_STEP_SUMMARY"
  fi
done
exit $failed
