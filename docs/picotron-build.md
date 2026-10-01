# Building Picotron carts in CI

This repo can export **Picotron** cartridges to web pages headlessly and host
them in the gallery next to the hand-committed games in `public/`. The
pipeline is ported from
[RubenTipparach/picotron-build-demo](https://github.com/RubenTipparach/picotron-build-demo).

```
carts/<name>.p64/        a cart = a folder (main.lua + gfx/ map/ sfx/)
  sprites/**/NNN_*.png   optional: baked into gfx/0.gfx at build time
carts/<name>.png         optional: gallery thumbnail
```

On every push/PR, `.github/workflows/static.yml`:

1. `scripts/picotron/fetch-picotron.sh` turns the `PICOTRON_ZIP` secret into
   an unzipped Linux Picotron (the binary is never committed).
2. `scripts/picotron/build-all-carts.sh` runs, for each `carts/*.p64`,
   `scripts/picotron/build-cart.sh`, which:
   - makes an isolated Picotron home and mounts the cart at `/game.p64`
   - runs `tools/picotron/png2gfx.lua` (sprites/ PNGs -> `gfx/0.gfx`;
     a folder holding a `palette.hex` - one `rrggbb` per line - is read with
     the display palette switched to it, so art drawn in a custom palette
     lands on that palette's indices)
   - runs `tools/picotron/build.lua`, which drives Picotron's own
     `export foo.html` exporter under `xvfb`
   - writes `carts-dist/<name>/index.html` (+ `preview.png`)
   - `scripts/picotron/browser-smoke.sh` then opens every exported page in
     headless Chromium, clicks to start, screenshots it
     (`carts-dist/<name>/smoke.png`) and **fails the build if the screen is
     blank** (headless `-x` runs can't see what the web player draws)
3. `npm run build` - `scripts/process-games.ts` treats `carts-dist/` exactly
   like `public/` (mobile/touch fixes for Picotron exports), then the gallery
   is rebuilt.
4. On `main` only: deploy to GitHub Pages.

Branches and PRs build and export everything as a check but never deploy.

## Secrets

Add under **Settings -> Secrets and variables -> Actions -> New repository
secret**:

| Secret | Required | What it is |
| --- | --- | --- |
| `PICOTRON_ZIP` | **yes** (to build carts) | A private **direct-download URL** to the Linux Picotron zip (release asset, signed bucket URL, or a Google Drive "anyone with the link" share - Drive links are handled specially). Base64 of the zip also works but an Actions secret is capped at ~48 KB, so a URL is the realistic option. The zip must contain the executable at `.../picotron/picotron`. Same value as in picotron-build-demo. |

Also make sure **Settings -> Pages -> Build and deployment -> Source** is
**GitHub Actions** (it already is if the gallery deploys today).

Without `PICOTRON_ZIP` the workflow prints a warning, skips the carts, and
still builds/deploys the rest of the site.

## Headless gotchas (verified in picotron-build-demo's CI)

- `picotron -x script.lua` takes **no trailing cart argument** - a positional
  cart makes it boot that cart in desktop mode and ignore `-x`.
- Headless Picotron swallows `print()`/`printh()`. The tools report by
  creating **marker directories** under `/out`; the build script dumps them
  on failure.
- `-home <dir>` maps `<dir>/drive` to `/`, which is how the cart gets in and
  the html gets out.

## Local build

```sh
PICOTRON_ZIP=<url> bash scripts/picotron/fetch-picotron.sh
bash scripts/picotron/build-all-carts.sh      # -> carts-dist/<name>/index.html
npm run build                                   # gallery incl. the carts
```
