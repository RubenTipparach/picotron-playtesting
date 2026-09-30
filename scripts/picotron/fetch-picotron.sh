#!/usr/bin/env bash
#
# fetch-picotron.sh — materialise the Picotron Linux build from the
# PICOTRON_ZIP secret so the exe never has to live in the public repo.
#
# The secret can be either of:
#   1. A direct-download URL to the zip   (recommended — see note below)
#        e.g. a private release asset, an S3/GCS signed URL, or a Google
#        Drive link. drive.google.com links are handled specially.
#   2. Base64-encoded bytes of the zip itself  (only works if the encoded
#        text fits in a single Actions secret, which is capped at ~48 KB,
#        so this is usually only viable for trimmed-down archives).
#
# After extraction the Picotron executable is expected at
#   <extract>/picotron/picotron        (the "picotron folder")
# and the resolved path is written to $GITHUB_ENV as PICOTRON_BIN (when run
# inside Actions) and echoed on stdout.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST="${PICOTRON_DIR:-$ROOT/picotron_dist}"
ZIP="$ROOT/picotron.zip"

log() { printf '\033[1;35m[fetch-picotron]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[fetch-picotron] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[[ -n "${PICOTRON_ZIP:-}" ]] || die "PICOTRON_ZIP secret is not set. Add it in the repo's Settings > Secrets and variables > Actions."

download_gdrive() {
  # $1 = file id, $2 = output path. Handles the large-file confirm token.
  local id="$1" out="$2"
  log "downloading Google Drive file id=$id"
  local cookie; cookie="$(mktemp)"
  curl -sL -c "$cookie" "https://drive.google.com/uc?export=download&id=${id}" -o "$out" || true
  # if we got an html interstitial, follow the confirm token
  if head -c 64 "$out" | grep -qi 'html'; then
    local token
    token="$(awk '/download_warning/ {print $NF}' "$cookie" | tail -n1)"
    [[ -z "$token" ]] && token="$(grep -o 'confirm=[0-9A-Za-z_-]*' "$out" | head -n1 | cut -d= -f2 || true)"
    [[ -n "$token" ]] || die "could not obtain Google Drive confirm token (is the file shared 'anyone with link'?)"
    curl -sL -b "$cookie" \
      "https://drive.google.com/uc?export=download&confirm=${token}&id=${id}" -o "$out"
  fi
  rm -f "$cookie"
}

secret="$PICOTRON_ZIP"
if [[ "$secret" =~ ^https?:// ]]; then
  if [[ "$secret" == *drive.google.com* ]]; then
    # accept .../file/d/<ID>/... or ...?id=<ID> or uc?id=<ID>
    id="$(printf '%s' "$secret" | grep -oE '/d/[^/]+' | head -n1 | cut -d/ -f3 || true)"
    [[ -z "$id" ]] && id="$(printf '%s' "$secret" | grep -oE 'id=[^&]+' | head -n1 | cut -d= -f2 || true)"
    [[ -n "$id" ]] || die "could not parse a file id out of the Google Drive URL"
    download_gdrive "$id" "$ZIP"
  else
    log "downloading from URL"
    curl -fsSL "$secret" -o "$ZIP" || die "download failed"
  fi
else
  log "decoding base64 secret"
  printf '%s' "$secret" | base64 -d > "$ZIP" 2>/dev/null || die "PICOTRON_ZIP is neither a URL nor valid base64"
fi

[[ -s "$ZIP" ]] || die "downloaded zip is empty"
# sanity check: is it actually a zip?
if ! head -c4 "$ZIP" | grep -q "PK"; then
  die "downloaded data is not a zip archive (got $(head -c 200 "$ZIP" | tr -d '\0' | head -c 80)...)"
fi
log "zip size: $(wc -c < "$ZIP" | tr -d ' ') bytes"

rm -rf "$DEST"; mkdir -p "$DEST"
unzip -q -o "$ZIP" -d "$DEST" || die "unzip failed"

# locate the linux executable inside the 'picotron' folder
BIN="$(find "$DEST" -type f -name picotron 2>/dev/null | head -n1 || true)"
[[ -n "$BIN" ]] || die "no 'picotron' executable found under $DEST after unzip"
chmod +x "$BIN" || true
log "picotron executable: $BIN"
# NB: don't probe the binary here (e.g. --version) — a bare launch may try to
# boot the GUI and hang in a display-less runner. The build step exercises it.

if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "PICOTRON_BIN=$BIN" >> "$GITHUB_ENV"
fi
echo "$BIN"
