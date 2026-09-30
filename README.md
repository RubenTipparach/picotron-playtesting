# picotron-playtesting
a quick and dirty delivery vehicle for hosting web games on github. One repo to rule them all...

## Picotron carts

Picotron cartridges in `carts/<name>.p64/` are exported to web pages in CI
(headless Picotron, pipeline ported from
[picotron-build-demo](https://github.com/RubenTipparach/picotron-build-demo))
and show up in the gallery next to the games in `public/`.

- How it works + the **required secret** (`PICOTRON_ZIP`):
  [docs/picotron-build.md](docs/picotron-build.md)
- **FPS Render Lab** - one TrenchBroom level rendered by a raycaster *and* a
  Quake-style BSP renderer, TAB to compare:
  [docs/fps-render-lab.md](docs/fps-render-lab.md)
