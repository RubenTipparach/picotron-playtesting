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
