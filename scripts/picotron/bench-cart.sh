#!/usr/bin/env bash
#
# bench-cart.sh - run a cart benchmark script inside real headless Picotron
# and print the results as a markdown table (also appended to the GitHub
# Actions job summary when available).
#
#   bash scripts/picotron/bench-cart.sh carts/fps-render-lab.p64 tools/fps-lab/picotron_bench.lua
#
# The bench script reports through marker dirs under /out named
#   bench.<detail>.<renderer>.<pose>.cpu_<permille>.fps_<fps>.dt_<ms>
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CART_DIR="${1:?usage: bench-cart.sh <cart.p64> <bench.lua>}"
BENCH="${2:?usage: bench-cart.sh <cart.p64> <bench.lua>}"
NAME="$(basename "$CART_DIR" .p64)"
log() { printf '\033[1;36m[bench:%s]\033[0m %s\n' "$NAME" "$*"; }
die() { printf '\033[1;31m[bench:%s] ERROR:\033[0m %s\n' "$NAME" "$*" >&2; exit 1; }

PICO="${PICOTRON_BIN:-}"
[[ -n "$PICO" && -x "$PICO" ]] || PICO="$(find "$ROOT/picotron_dist" -type f -name picotron 2>/dev/null | head -n1 || true)"
[[ -n "$PICO" ]] || die "picotron not found (run scripts/picotron/fetch-picotron.sh)"

HOME_DIR="$ROOT/.pico_home/bench-$NAME"
rm -rf "$HOME_DIR"; mkdir -p "$HOME_DIR/drive/out" "$HOME_DIR/desktop"
echo "mount / $HOME_DIR/drive" > "$HOME_DIR/picotron_config.txt"
cp -r "$CART_DIR" "$HOME_DIR/drive/game.p64"

RUNNER=()
command -v xvfb-run >/dev/null 2>&1 && RUNNER=(xvfb-run -a --server-args="-screen 0 640x480x24")

if [[ -d "$CART_DIR/sprites" ]]; then
  log "baking sprites"
  timeout 120 "${RUNNER[@]}" "$PICO" -home "$HOME_DIR" -x "$ROOT/tools/picotron/png2gfx.lua" >/dev/null 2>&1 || true
  rm -rf "$HOME_DIR/drive/out"; mkdir -p "$HOME_DIR/drive/out"
fi

log "running $BENCH"
set +e
timeout 600 "${RUNNER[@]}" "$PICO" -home "$HOME_DIR" -x "$ROOT/$BENCH" >"$HOME_DIR/bench.log" 2>&1
status=$?
set -e

MARKS="$(ls -1A "$HOME_DIR/drive/out" 2>/dev/null | sort || true)"
TABLE="$(printf '%s\n' "$MARKS" | awk -F. '
  /^bench\./ {
    cpu=$5; sub("cpu_","",cpu); fps=$6; sub("fps_","",fps); dt=$7; sub("dt_","",dt)
    printf("| %s | %s | %s | %.2f | %s | %s |\n", $2, $3, $4, cpu/1000, fps, dt)
  }')"
{
  echo "### Picotron benchmark: $NAME"
  echo
  echo "40 measured frames per row. cpu = mean stat(1) (1.0 = a full 60fps frame); fps = stat(7); ms = time() elapsed over those 40 frames."
  echo
  echo "| detail | renderer | pose | cpu | fps | ms / 40 frames |"
  echo "| --- | --- | --- | --- | --- | --- |"
  printf '%s\n' "$TABLE"
  echo
  echo "<details><summary>markers</summary>"
  echo
  printf '%s\n' "$MARKS" | sed 's/^/    /'
  echo "</details>"
} | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"

grep -q '^RESULT.OK$' <<<"$MARKS" || { cat "$HOME_DIR/bench.log" 2>/dev/null | tail -40; die "benchmark did not finish (exit $status)"; }
