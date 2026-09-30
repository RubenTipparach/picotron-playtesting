#!/usr/bin/env bash
#
# butler-deploy.sh — push exported carts to itch.io with itch's butler CLI.
# Ported from RubenTipparach/picotron-build-demo, generalised to many carts.
#
# Reads carts/itch-targets.txt, one "<cart-name> <itch-user>/<game>:<channel>"
# per line ('#' comments allowed), and pushes carts-dist/<cart-name>/ to each.
# Needs BUTLER_API_KEY (itch.io API key) and carts-dist/ already built.
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

log() { printf '\033[1;36m[butler-deploy]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[butler-deploy] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -n "${BUTLER_API_KEY:-}" ]] || die "BUTLER_API_KEY is not set"
TARGETS="carts/itch-targets.txt"
[[ -f "$TARGETS" ]] || { log "no $TARGETS - nothing to push"; exit 0; }

BUTLER_DIR="$ROOT/.butler"
if [[ ! -x "$BUTLER_DIR/butler" ]]; then
  log "downloading butler"
  mkdir -p "$BUTLER_DIR"
  curl -sSL -o "$BUTLER_DIR/butler.zip" "https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default"
  unzip -o -q "$BUTLER_DIR/butler.zip" -d "$BUTLER_DIR"
  chmod +x "$BUTLER_DIR/butler"
fi

VERSION="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
export BUTLER_API_KEY
while read -r name target _; do
  [[ -z "${name:-}" || "$name" == \#* ]] && continue
  [[ -f "carts-dist/$name/index.html" ]] || { log "skip $name (not built)"; continue; }
  log "pushing carts-dist/$name -> $target (userversion $VERSION)"
  "$BUTLER_DIR/butler" push "carts-dist/$name" "$target" --userversion "$VERSION"
done < "$TARGETS"
log "done"
