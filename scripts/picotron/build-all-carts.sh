#!/usr/bin/env bash
#
# build-all-carts.sh — export every carts/<name>.p64 to carts-dist/<name>/.
# scripts/process-games.ts then copies carts-dist/* into dist/ next to the
# hand-committed public/ games, so they show up in the gallery.
#
# With no Picotron available (PICOTRON_ZIP secret unset) this exits 0 after a
# warning so the rest of the site still builds and deploys.
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

log() { printf '\033[1;36m[build-all-carts]\033[0m %s\n' "$*"; }

shopt -s nullglob
carts=(carts/*.p64)
if [[ ${#carts[@]} -eq 0 ]]; then log "no carts/*.p64 found"; exit 0; fi

rm -rf carts-dist; mkdir -p carts-dist
failed=0
for cart in "${carts[@]}"; do
  name="$(basename "$cart" .p64)"
  # pretty title: fps-render-lab -> Fps Render Lab (matches the gallery)
  title="$(echo "$name" | sed -E 's/(^|-)([a-z])/ \U\2/g; s/^ //')"
  if ! GAME_TITLE="$title" bash scripts/picotron/build-cart.sh "$cart" "carts-dist/$name"; then
    log "FAILED: $cart"; failed=1
  fi
done
exit $failed
