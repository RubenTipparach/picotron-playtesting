#!/usr/bin/env bash
#
# build-cart.sh — export ONE Picotron cartridge folder to a standalone web
# page, headlessly. Ported from RubenTipparach/picotron-build-demo
# (scripts/build.sh), generalised so this repo can host many carts.
#
#   bash scripts/picotron/build-cart.sh carts/fps-render-lab.p64 carts-dist/fps-render-lab
#
# It prepares an isolated Picotron "home", mounts the cart at /game.p64,
# bakes sprites/**/*.png -> gfx/0.gfx (tools/picotron/png2gfx.lua) when the
# cart has a sprites/ folder, then runs tools/picotron/build.lua which drives
# Picotron's own html exporter. The page lands in <out_dir>/index.html.
#
# Environment:
#   PICOTRON_BIN   path to the picotron executable (else auto-discovered under
#                  ./picotron_dist, set by scripts/picotron/fetch-picotron.sh)
#   GAME_TITLE     <title> to stamp into the html (default: cart folder name)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CART_DIR="${1:?usage: build-cart.sh <cart.p64 folder> <out dir>}"
OUT_DIR="${2:?usage: build-cart.sh <cart.p64 folder> <out dir>}"
CART_NAME="$(basename "$CART_DIR" .p64)"
GAME_TITLE="${GAME_TITLE:-$CART_NAME}"

log() { printf '\033[1;36m[build-cart:%s]\033[0m %s\n' "$CART_NAME" "$*"; }
die() { printf '\033[1;31m[build-cart:%s] ERROR:\033[0m %s\n' "$CART_NAME" "$*" >&2; exit 1; }

# --- locate the picotron binary -------------------------------------------
discover_bin() {
  if [[ -n "${PICOTRON_BIN:-}" && -x "${PICOTRON_BIN}" ]]; then
    echo "${PICOTRON_BIN}"; return 0
  fi
  for base in "${PICOTRON_DIR:-}" "$ROOT/picotron_dist" "$ROOT/picotron"; do
    [[ -n "$base" && -d "$base" ]] || continue
    local found
    found="$(find "$base" -type f -name picotron 2>/dev/null | head -n1 || true)"
    if [[ -n "$found" ]]; then echo "$found"; return 0; fi
  done
  return 1
}

PICO="$(discover_bin || true)"
[[ -n "$PICO" ]] || die "could not find the picotron executable (run scripts/picotron/fetch-picotron.sh or set PICOTRON_BIN)"
chmod +x "$PICO" 2>/dev/null || true
[[ -d "$CART_DIR" ]] || die "cartridge folder '$CART_DIR' not found"
[[ -f "$CART_DIR/main.lua" ]] || die "'$CART_DIR' has no main.lua"

# --- isolated picotron home (one per cart so builds never collide) --------
HOME_DIR="$ROOT/.pico_home/$CART_NAME"
rm -rf "$HOME_DIR"
mkdir -p "$HOME_DIR/drive" "$HOME_DIR/desktop"
cat > "$HOME_DIR/picotron_config.txt" <<EOF
mount / $HOME_DIR/drive
EOF
cp -r "$CART_DIR" "$HOME_DIR/drive/game.p64"
mkdir -p "$HOME_DIR/drive/out"

RUNNER=()
if command -v xvfb-run >/dev/null 2>&1; then
  RUNNER=(xvfb-run -a --server-args="-screen 0 640x480x24")
fi

# --- bake sprites -> gfx/0.gfx ---------------------------------------------
if [[ -d "$CART_DIR/sprites" ]]; then
  log "baking sprites -> gfx/0.gfx"
  set +e
  timeout 120 "${RUNNER[@]}" "$PICO" -home "$HOME_DIR" -x "$ROOT/tools/picotron/png2gfx.lua" \
    >"$HOME_DIR/png2gfx.log" 2>&1
  set -e
  GFX="$HOME_DIR/drive/game.p64/gfx/0.gfx"
  if [[ -s "$GFX" ]]; then
    log "baked $(wc -c < "$GFX" | tr -d ' ') byte gfx/0.gfx"
  else
    echo "----- png2gfx markers -----"; ls -1A "$HOME_DIR/drive/out" 2>/dev/null | sort || true
    die "png2gfx produced no gfx/0.gfx"
  fi
  # png2gfx leaves marker dirs in /out; clear them so they don't confuse the export
  rm -rf "$HOME_DIR/drive/out"; mkdir -p "$HOME_DIR/drive/out"
fi

# --- headless html export ---------------------------------------------------
log "exporting html"
set +e
timeout 180 "${RUNNER[@]}" "$PICO" -home "$HOME_DIR" -x "$ROOT/tools/picotron/build.lua" \
  >"$HOME_DIR/build.log" 2>&1
status=$?
set -e

RESULT="$HOME_DIR/drive/out/index.html"
if [[ ! -s "$RESULT" ]]; then
  # headless picotron swallows stdout; build.lua reports via /out marker dirs
  echo "----- picotron output -----"; cat "$HOME_DIR/build.log" 2>/dev/null || true
  echo "----- /out markers -----"; ls -1A "$HOME_DIR/drive/out" 2>/dev/null | sort || true
  echo "----- drive tree -----"
  find "$HOME_DIR/drive" -maxdepth 3 2>/dev/null | sed "s#$HOME_DIR/drive#DRIVE#" | sort | head -120
  die "picotron export produced no html (exit $status)"
fi

mkdir -p "$OUT_DIR"
cp "$RESULT" "$OUT_DIR/index.html"
SIZE="$(wc -c < "$OUT_DIR/index.html" | tr -d ' ')"
[[ "$SIZE" -gt 1000 ]] || die "exported html is suspiciously small ($SIZE bytes)"

if grep -q "<title>" "$OUT_DIR/index.html"; then
  sed -i "s#<title>[^<]*</title>#<title>${GAME_TITLE}</title>#" "$OUT_DIR/index.html" || true
fi
# optional gallery thumbnail: carts/<name>.png next to the cart folder
PREVIEW="$(dirname "$CART_DIR")/$CART_NAME.png"
if [[ -f "$PREVIEW" ]]; then cp "$PREVIEW" "$OUT_DIR/preview.png"; fi

log "wrote $OUT_DIR/index.html ($SIZE bytes)"
