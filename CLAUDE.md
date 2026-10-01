# CLAUDE.md - picotron-playtesting

Gallery site (Vite) hosting web games. `public/<game>/index.html` games are
committed; Picotron carts in `carts/<name>.p64/` are exported in CI.

- Build pipeline + secrets: `docs/picotron-build.md`. Never commit the
  Picotron binary, `picotron.zip`, `picotron_dist/`, `.pico_home/`,
  `carts-dist/`.
- Full Picotron manual: `docs/picotron_manual.txt` - grep it.
- Headless Picotron: `picotron -x script.lua` with NO trailing arg; it
  swallows print/printh, so report via marker dirs under `/out`.
- FPS Render Lab: `docs/fps-render-lab.md`. The level source is
  `carts/fps-render-lab.map` (TrenchBroom); after editing it run
  `python3 tools/fps-lab/map2bsp.py` to regenerate `level.lua`. Never
  hand-edit `level.lua`. `gen_level.py` only seeds the .map (overwrites it).
- No Picotron in the cloud container: verify cart changes with
  `python3 tools/fps-lab/screenshots.py <dir>` (runs the real cart Lua
  under `tools/fps-lab/mock/picomock.lua`, needs lua5.4 + Pillow). Keep cart
  code plain Lua 5.4 compatible (no `+=`, `!=`, `\`) so the mock can run it.
- Picotron Lua has no `table.sort`.
- The mock is not Picotron. CI's `browser-smoke.sh` opens the real exported
  page in headless Chromium and fails on a blank screen; for a fast local
  loop with the real runtime: fetch Picotron into a scratch dir
  (`PICOTRON_DIR=<scratch> PICOTRON_ZIP=<url> scripts/picotron/fetch-picotron.sh`),
  `PICOTRON_BIN=<bin> scripts/picotron/build-cart.sh <cart> carts-dist/<name>`,
  then `PLAYWRIGHT_MODULE=$(npm root -g)/playwright scripts/picotron/browser-smoke.sh`
  (printh() output shows up as `[pid] ...` console lines).
- Picotron 0.3 gotchas (docs/picotron_manual.txt is the 0.3.0d manual):
  colour-table entries carry the 0xc0 table-select bits (remap
  only the low 6 bits, keep `v & 0xc0`); tline3d loops/garbles
  non-power-of-two sprites (pad billboards to 2^n); sprite wrapping is an
  explicit mask at 0x5534/0x5536.
- FPS lab shading is palette-agnostic: texel = colour + 64*light level, read
  mask 0x5508=0xff picks one of 4 colour tables (layout
  0x8000 + t*0x1000 + draw*64 + target). Art comes in two sets (default 32
  in `sprites/`, custom 64 in `sprites/pal64/` at index +64); regenerate both
  with `python3 tools/fps-lab/gen_art.py`. png2gfx fits a folder's PNGs to
  its `palette.hex`. A fog-table switch copies 16k: avoid per-object switches.
