# FPS Render Lab - raycaster vs. true 3D in Picotron

`carts/fps-render-lab.p64` is a small shooter with **two renderers for one
level**. Press **TAB** in game to flip between them live:

| | RAYCASTER (`ray.lua`) | TRUE 3D (`bsp.lua`) |
| --- | --- | --- |
| school | Wolfenstein 3D / early Doom | Quake |
| world | 64u grid sliced out of the map at eye height | CSG'd brush polygons in a BSP tree |
| floors / ceilings | one height each (0 / 128), per-cell textures | anything: stairs, dais, platform, pool, bridge over the arena |
| walls | whole grid cells (a 32u pillar becomes a 64u block) | exact brushes, incl. sloped braces |
| look up/down | y-shear (horizon moves; verticals stay vertical) | real pitch |
| lighting | per-cell light on walls + distance fog | baked lightmaps (16u luxels) in a surface cache + fog |
| props | billboards | real meshes (crate, 8-sided barrel, torch stand) |
| occlusion | 1D z-buffer per column | BSP back-to-front (painter's that is always right) |
| cost scales with | screen width (480 DDA rays) | visible polygons |
| collision | grid cells, z = 0 | brush boxes, step-up 20u, gravity |

Controls: WASD move, click to lock the mouse (or arrows) to look, click / Z /
space to fire, TAB switch renderer, V detail (480x270 / 240x135), R restart. 13 grunts, shotgun hitscan,
health/shell pickups.

![raycaster vs true 3D](images/fps-render-lab-compare.png)

*Frames rendered by `tools/fps-lab/screenshots.py`, i.e. the real cart Lua
running in the software mock (see "Verification" below), not captured from
Picotron itself.*

## Level pipeline: TrenchBroom -> BSP

```
tools/fps-lab/gen_level.py   (one-time seed)  -> carts/fps-render-lab.map
TrenchBroom (edit)                              carts/fps-render-lab.map
tools/fps-lab/map2bsp.py                      -> carts/fps-render-lab.p64/level.lua
```

`map2bsp.py` is a pocket version of id's qbsp + light:

1. parse Standard or Valve220 `.map`, planes from the 3-point form
2. brush faces -> convex polygons
3. **CSG**: chop every face against every other brush, drop what is buried
4. **outside fill**: voxelise, flood from `info_player_start`, drop faces
   that look into the void (and stop with `LEAK` if the map isn't sealed)
5. coplanar faces with the same material are re-merged into big rectangles
   (2316 -> 372 polygons for this map); each becomes a **surface** whose
   lightmap is baked from `light` entities with voxel shadow rays
6. polygon **BSP** (fewest splits, balanced, axial preferred): 445 polys,
   246 nodes, depth 12
7. the raycaster's grid: a cell is a wall if brushes cover the z 30..62 band
   at its centre; per-side wall textures, per-cell floor/ceiling textures and
   light; plus collision boxes and entities

Run it after editing the map (≈15 s):

```sh
python3 tools/fps-lab/map2bsp.py
```

### Editing in TrenchBroom

1. Copy `tools/fps-lab/trenchbroom/` into TrenchBroom's `games/` folder as
   `FPSLab/` (Linux `~/.TrenchBroom/games`, Windows
   `%AppData%\TrenchBroom\games`, macOS
   `~/Library/Application Support/TrenchBroom/games`). The config is game
   config **version 9** (TrenchBroom 2024.1+).
2. Preferences -> Picotron FPS Lab -> Game path = that same folder (it holds
   `textures/fpslab/*.png`).
3. Open `carts/fps-render-lab.map`. Entities: `info_player_start`, `light`,
   `monster_grunt`, `prop_crate`, `prop_barrel`, `prop_torch`,
   `item_health`, `item_ammo` (see `fpslab.fgd`).

Keep brushes on the 16u grid where you can: that is what lets the compiler
merge faces into big rectangles. Collision uses brush **bounding boxes**, so
keep anything the player can touch axis-aligned (sloped detail up high, like
the hall's braces, is fine).

## Picotron techniques used (the "maximum optimisation" list)

- **Batched `tline3d`**: a userdata of args, one Lua->C call. The raycaster
  draws every wall column (≈960 textured lines) in *one* call, and every
  billboard column in one more. The polygon filler (`textri`, from
  ld58-pictoron-3d-engine) builds each triangle half's scanlines with 3
  userdata ops and one batched `tline3d`.
- **`matmul3d` batch transform**: every level vertex goes to camera space in
  one call per frame; Lua only reads the vertices of polygons it draws.
- **Surface cache** (Quake's trick): lightmaps are baked into per-surface
  textures at load, built with `blit` + run-length `userdata:add(16*level,
  ...)` (~1.8M texels). Lighting then costs *nothing* per frame and
  doesn't split geometry.
- **Palette light ramps**: colours 16..63 are 3 darker copies of 0..15, so
  "darker by k" is just `+16*k`. Distance fog on world polygons swaps a
  pre-built colour table 0 (one 4 KB `poke`) instead of 48 `pal()` calls;
  sprites use pre-shaded copies so shading can vary *inside* a batch call.
- **Map-mode `tline3d` for raycaster floors/ceilings**: each screen row is a
  line of constant depth, drawn from an i16 map of pre-shaded tiles, so
  every cell gets its own floor texture and wrapping is free.
- **BSP back-to-front + frustum-culled node boxes**: no z-buffer, no sort;
  monsters/props are dropped into the BSP leaf they stand in so they sort
  against walls correctly.
- No `table.sort` in Picotron - small insertion sorts only where needed.

## Frame-rate targets (30-60 fps)

`_draw()` runs at 60 fps, or drops to 30/20/15 when a frame blows the budget
(`stat(7)`); `stat(1)` is the share of a 60 fps frame used. Levers, in order
of impact:

- **Detail mode** (`V`, or AUTO): `vid(3)` renders at 240x135 and the display
  doubles it - 1/4 of the fill, half the raycaster columns and BSP
  scanlines. AUTO starts at 480x270 and drops to 240x135 if Picotron runs
  `_draw` below 60 fps for ~2 s. The weapon/HUD rescale.
- **Object frustum culling + mesh LOD**: props, monsters and items outside
  the view cost nothing; props past 560u draw as their billboard (one
  `sspr`) instead of a mesh.
- **Batched projection**: after the one `matmul3d`, 9 strided userdata ops
  compute `1/z` and screen x/y for every vertex in C; Lua only touches
  vertices when a polygon crosses the near plane.
- Raycaster: per-frame locals, inlined fog, one batch for all walls.

### Real Picotron numbers

CI runs `tools/fps-lab/picotron_bench.lua` inside headless Picotron (step
"Benchmark FPS Render Lab" -> job summary): every renderer x pose x detail
level, 40 frames each, reporting mean `stat(1)` and `stat(7)`. Treat CI
runner numbers as relative; the in-game readout (cpu %, fps, 480/240) is the
truth on your machine.

### Mock profile (cart-side Lua VM instructions per frame)

| pose | ray 480 | bsp 480 (before opt) | bsp 480 (now) | ray 240 | bsp 240 |
| --- | --- | --- | --- | --- | --- |
| hall | 232k | 226k | 132k | 116k | 129k |
| hall, looking up | 216k | 192k | 98k | | |
| courtyard | 270k | 151k | 62k | | |
| corridor | 209k | 195k | 117k | | |
| arena | 253k | 141k | 60k | | |
| storage | 259k | 157k | 73k | | |

Pixel fill (`tline3d` px) is ~135-220k per frame at 480x270 and ~40k at
240x135 for both renderers.

- The raycaster's cost is **flat** (480 rays + 270 rows at full detail) and
  the Lua DDA dominates; half detail halves it.
- The true-3D renderer's cost follows **visible polygons**; after CSG +
  merging + surface caching + object culling it is 30-75% cheaper than the
  raycaster in Lua at full detail while showing stairs, platforms, the
  bridge, pitch, real props and per-texel lighting. Its Lua cost is per
  polygon, so half detail mainly saves fill.
- Take away: in Picotron a Quake-style pipeline, with the heavy lifting done
  offline and per-frame work pushed into batched userdata calls, is the
  better deal. The raycaster's remaining advantage is simplicity.

## Verification without Picotron

`tools/fps-lab/mock/picomock.lua` implements (in plain Lua 5.4) the Picotron
APIs the cart uses - userdata ops with offsets/strides/spans, `matmul3d`,
`sort`, `peek`/`poke`, `blit`, batched and map-mode `tline3d`, `sspr`,
colour table 0 - and `mock/run.lua` runs the unmodified cart through it.

```sh
sudo apt-get install lua5.4 && pip install pillow numpy
python3 tools/fps-lab/screenshots.py /tmp/shots   # compare.png + report.tsv
```

Things the mock cannot prove and the first real run should confirm:
`tline3d` edge rules / sub-pixel seams, the colour-table layout assumption
(the fog tables only remap *values*, so any layout works), and real speed.

## Files

```
carts/fps-render-lab.map            level source (TrenchBroom)
carts/fps-render-lab.png            gallery thumbnail
carts/fps-render-lab.p64/
  main.lua    game: player, monsters, shotgun, pickups, HUD, TAB switch
  gfx.lua     palette ramps, shaded sprites, surface cache, fog tables, textri
  ray.lua     raycaster
  bsp.lua     BSP renderer + mesh/billboard objects
  world.lua   collision (grid + boxes), line of sight
  props.lua   crate / barrel / torch meshes
  level.lua   GENERATED by map2bsp.py
  sprites/    GENERATED by gen_art.py (hand-editable, index = filename)
tools/fps-lab/
  gen_level.py  seed .map (already run - edit the .map now)
  map2bsp.py    compiler
  gen_art.py    textures, monsters, props, weapon (+ --sheet contact sheet)
  screenshots.py, mock/   headless verification
  trenchbroom/  TrenchBroom game config, FGD, materials
```

![art](images/fps-render-lab-art.png)
