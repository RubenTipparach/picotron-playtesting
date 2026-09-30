#!/usr/bin/env python3
"""
gen_level.py - SEED the FPS Render Lab level as a TrenchBroom .map file.

This was run once to produce carts/fps-render-lab.map. From then on the .map
is the source of truth: open it in TrenchBroom (see tools/fps-lab/trenchbroom)
and edit away. Re-running this OVERWRITES the .map, so only do it if you want
to start over from the room layout below.

    python3 tools/fps-lab/gen_level.py            # writes carts/fps-render-lab.map

Units are Quake units: 64 per grid cell, 1 texel = 2 units (32px textures
tile every 64 units, TrenchBroom face scale 2). Z is up.

Everything is built "carved" style so the world is sealed: each room region
gets a floor slab (BOTTOM..floor) and a ceiling slab (ceil..TOP), and every
wall cell next to a room is a full-height brush. map2bsp.py CSGs away the
faces hidden between touching brushes.
"""
import os

CELL, BOTTOM, TOP = 64, -64, 288
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "carts", "fps-render-lab.map")

# region -> floor z, ceiling z, textures
REGIONS = {
    "H":  dict(floor=0,   ceil=192, f="floor_stone", c="ceil_wood",  w="stone"),       # great hall
    "A":  dict(floor=0,   ceil=224, f="floor_tile",  c="ceil_panel", w="brick"),       # arena
    "Y":  dict(floor=0,   ceil=TOP - 32, f="cobble", c="sky",        w="stone_moss"),  # open courtyard
    "P":  dict(floor=-16, ceil=TOP - 32, f="slime",  c="sky",        w="stone_moss"),  # sunken pool
    "S":  dict(floor=0,   ceil=160, f="floor_wood",  c="ceil_panel", w="wood_wall"),   # storage
    "C":  dict(floor=0,   ceil=128, f="floor_metal", c="ceil_panel", w="metal"),       # corridors
}

GW, GH = 30, 26
grid = [[None] * GW for _ in range(GH)]      # [row][col], row 0 = north


def room(reg, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            grid[y][x] = reg


room("H", 1, 1, 12, 10)      # great hall
room("C", 6, 11, 7, 13)      # hall -> arena
room("A", 1, 14, 12, 24)     # arena
room("C", 13, 5, 17, 6)      # hall -> courtyard
room("Y", 18, 1, 28, 12)     # courtyard
room("P", 21, 4, 25, 8)      # pool inside courtyard
room("C", 22, 13, 23, 15)    # courtyard -> storage
room("S", 18, 16, 28, 24)    # storage
room("C", 13, 19, 17, 20)    # arena -> storage


def wx(col):   # cell column -> world x of its west edge
    return col * CELL


def wy(row):   # cell row -> world y of its SOUTH edge (row 0 is north)
    return (GH - 1 - row) * CELL


def cell_center(col, row):
    return wx(col) + CELL // 2, wy(row) + CELL // 2


# ---------------------------------------------------------------- brushes --
brushes = []   # list of list of (p0,p1,p2,tex)


def box(x0, y0, z0, x1, y1, z1, tex, top=None, bottom=None, side=None):
    """Axis aligned brush. tex = default, top/bottom/side override faces.
    side may be a dict {'e','w','n','s'} -> tex."""
    t_top, t_bot = top or tex, bottom or tex
    sd = side if isinstance(side, dict) else {}
    ds = side if isinstance(side, str) else tex
    # TrenchBroom point ordering: normal = (p2-p0) x (p1-p0)
    b = [
        ((x0, y0, z0), (x0, y0 + 1, z0), (x0, y0, z0 + 1), sd.get("w", ds)),   # -X
        ((x0, y0, z0), (x0, y0, z0 + 1), (x0 + 1, y0, z0), sd.get("s", ds)),   # -Y
        ((x0, y0, z0), (x0 + 1, y0, z0), (x0, y0 + 1, z0), t_bot),              # -Z
        ((x1, y1, z1), (x1, y1 + 1, z1), (x1 + 1, y1, z1), t_top),              # +Z
        ((x1, y1, z1), (x1 + 1, y1, z1), (x1, y1, z1 + 1), sd.get("n", ds)),   # +Y
        ((x1, y1, z1), (x1, y1, z1 + 1), (x1, y1 + 1, z1), sd.get("e", ds)),   # +X
    ]
    brushes.append(b)


def poly_brush(faces, tex):
    """Convex brush from face vertex lists (any winding - fixed up to face
    outward, away from the brush centre)."""
    allp = [v for f in faces for v in f]
    cx, cy, cz = (sum(v[k] for v in allp) / len(allp) for k in range(3))
    b = []
    for f in faces:
        a, bb, c = f[0], f[1], f[2]
        u = [bb[k] - a[k] for k in range(3)]
        w = [c[k] - a[k] for k in range(3)]
        n = (u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0])
        if n[0] * (a[0] - cx) + n[1] * (a[1] - cy) + n[2] * (a[2] - cz) < 0:
            bb, c = c, bb                       # make (a,bb,c) CCW seen from outside
        b.append((a, c, bb, tex))               # TrenchBroom order: (p2-p0)x(p1-p0) = outward
    brushes.append(b)


def is_room(c, r):
    return 0 <= c < GW and 0 <= r < GH and grid[r][c] is not None


# 1) floors & ceilings per region, greedy rectangles
def rects(reg):
    used = [[False] * GW for _ in range(GH)]
    out = []
    for r in range(GH):
        for c in range(GW):
            if grid[r][c] != reg or used[r][c]:
                continue
            w = 1
            while c + w < GW and grid[r][c + w] == reg and not used[r][c + w]:
                w += 1
            h = 1
            while r + h < GH and all(grid[r + h][c + i] == reg and not used[r + h][c + i] for i in range(w)):
                h += 1
            for rr in range(r, r + h):
                for cc in range(c, c + w):
                    used[rr][cc] = True
            out.append((c, r, w, h))
    return out


for reg, p in REGIONS.items():
    for (c, r, w, h) in rects(reg):
        x0, x1 = wx(c), wx(c + w)
        y0, y1 = wy(r + h - 1), wy(r) + CELL
        box(x0, y0, BOTTOM, x1, y1, p["floor"], p["w"], top=p["f"])
        if p["c"] == "sky":
            box(x0, y0, p["ceil"], x1, y1, TOP, "sky")
        else:
            box(x0, y0, p["ceil"], x1, y1, TOP, p["w"], bottom=p["c"])

# 2) wall cells: every empty cell touching a room (8-neighbourhood)
for r in range(GH):
    for c in range(GW):
        if grid[r][c] is not None:
            continue
        near = [(c + dc, r + dr) for dc in (-1, 0, 1) for dr in (-1, 0, 1) if (dc or dr)]
        if not any(is_room(cc, rr) for cc, rr in near):
            continue

        def face_tex(cc, rr):
            return REGIONS[grid[rr][cc]]["w"] if is_room(cc, rr) else "stone"
        side = {"e": face_tex(c + 1, r), "w": face_tex(c - 1, r),
                "n": face_tex(c, r - 1), "s": face_tex(c, r + 1)}
        box(wx(c), wy(r), BOTTOM, wx(c) + CELL, wy(r) + CELL, TOP, "stone", side=side)

# 3) detail brushes (3D-only features the raycaster flattens away)
# great hall dais: 2 cells deep at 32, one step at 16
box(wx(4), wy(2), 0, wx(10), wy(1) + CELL, 32, "trim", top="step")
box(wx(4), wy(3), 0, wx(10), wy(3) + CELL, 16, "trim", top="step")
# great hall pillars (32 wide, full height) - the raycaster shows whole blocks
for (c, r) in [(3, 4), (3, 8), (10, 4), (10, 8)]:
    x, y = wx(c) + 16, wy(r) + 16
    box(x, y, 0, x + 32, y + 32, 192, "pillar")
    box(x - 8, y - 8, 0, x + 40, y + 40, 16, "trim")          # plinth
    box(x - 8, y - 8, 176, x + 40, y + 40, 192, "trim")       # capital
# great hall roof beams across the hall + angled braces at the walls
for r in (4, 8):
    y = wy(r) + 24
    box(wx(1), y, 160, wx(13), y + 16, 176, "trim")
for r in (4, 8):
    y = wy(r) + 24
    # braces hanging off the west/east walls, sloped (non axis-aligned planes)
    for (xa, xb, sgn) in ((wx(1), wx(1) + 48, 1), (wx(13) - 48, wx(13), -1)):
        # triangle in XZ against the wall at xa (sgn=1) or xb (sgn=-1)
        xw = xa if sgn > 0 else xb
        xo = xb if sgn > 0 else xa
        A0, B0, C0 = (xw, y, 160), (xo, y, 160), (xw, y, 112)
        A1, B1, C1 = (xw, y + 16, 160), (xo, y + 16, 160), (xw, y + 16, 112)
        if sgn > 0:
            faces = [[A0, B0, C0], [A1, C1, B1], [A0, A1, B1, B0], [A0, C0, C1, A1], [B0, B1, C1, C0]]
        else:
            faces = [[A0, C0, B0], [A1, B1, C1], [A0, B0, B1, A1], [A0, A1, C1, C0], [B0, C0, C1, B1]]
        poly_brush(faces, "trim")
# arena: stairs up to a raised platform along the south wall
box(wx(3), wy(18), 0, wx(11), wy(18) + CELL, 16, "trim", top="step")
box(wx(3), wy(19), 0, wx(11), wy(19) + CELL, 32, "trim", top="step")
box(wx(3), wy(24), 0, wx(11), wy(20) + CELL, 48, "brick", top="floor_metal")
for (c, r) in [(3, 20), (10, 20)]:                               # platform pillars
    x, y = wx(c) + 20, wy(r) + 20
    box(x, y, 48, x + 24, y + 24, 224, "pillar")
# arena: a floating walkway bridge above the arena floor (room-over-room!)
box(wx(1), wy(15), 112, wx(13), wy(15) + 48, 128, "trim", top="floor_metal")
# courtyard: a statue on a plinth in the middle of the pool
box(wx(23) + 8, wy(6) + 8, -16, wx(23) + 56, wy(6) + 56, 24, "stone_moss", top="trim")
box(wx(23) + 20, wy(6) + 20, 24, wx(23) + 44, wy(6) + 44, 120, "pillar")
# storage: a mezzanine shelf along the east wall
box(wx(26), wy(24), 64, wx(29), wy(16) + CELL, 80, "trim", top="floor_wood")

# ---------------------------------------------------------------- entities --
ents = []


def ent(cls, col, row, z=0, angle=0, **kv):
    x, y = cell_center(col, row)
    e = {"classname": cls, "origin": f"{x} {y} {z}", "angle": str(angle)}
    e.update({k: str(v) for k, v in kv.items()})
    ents.append(e)


def ent_xy(cls, x, y, z=0, **kv):
    e = {"classname": cls, "origin": f"{x} {y} {z}"}
    e.update({k: str(v) for k, v in kv.items()})
    ents.append(e)


ent("info_player_start", 6, 9, 24, angle=90)
# monsters
for (c, r) in [(5, 2), (8, 2), (20, 2), (27, 5), (19, 10), (27, 11),
               (20, 18), (25, 22), (28, 20), (4, 22), (9, 22), (6, 16), (2, 20)]:
    ent("monster_grunt", c, r, 0, angle=270)
# props
for (c, r) in [(19, 17), (19, 18), (20, 17), (24, 17), (27, 23), (27, 24), (22, 24), (19, 24), (28, 12), (18, 12)]:
    ent("prop_crate", c, r)
for (c, r) in [(18, 1), (28, 1), (1, 1), (12, 1), (11, 24), (1, 14), (12, 14), (27, 16), (16, 6)]:
    ent("prop_barrel", c, r)
for (c, r) in [(4, 1), (9, 1), (3, 21), (10, 21), (1, 5), (12, 5), (18, 20), (28, 18)]:
    ent("prop_torch", c, r)
# items
for (c, r) in [(1, 10), (28, 9), (18, 24), (1, 24), (15, 20)]:
    ent("item_health", c, r)
for (c, r) in [(12, 10), (18, 6), (28, 24), (12, 24), (22, 14)]:
    ent("item_ammo", c, r)
# lights (torches add their own light in map2bsp)
for (c, r, z, l) in [(6, 5, 150, 260), (6, 9, 120, 200), (3, 1, 120, 160), (10, 1, 120, 160),
                     (6, 12, 100, 170), (15, 5, 100, 170), (22, 14, 100, 170), (15, 19, 100, 170),
                     (6, 17, 180, 240), (6, 22, 150, 220),
                     (20, 19, 120, 220), (26, 21, 120, 220), (23, 17, 120, 180)]:
    ent("light", c, r, z, light=l)
for (c, r) in [(19, 3), (27, 3), (23, 6), (19, 10), (27, 10)]:          # sunlight
    ent("light", c, r, 250, light=340)
ents[-1]["_note"] = "courtyard sun"

# ---------------------------------------------------------------- write ---
lines = ["// Game: Picotron FPS Lab", "// Format: Standard",
         "// seeded by tools/fps-lab/gen_level.py - now edit in TrenchBroom"]
lines += ["// entity 0", "{", '"classname" "worldspawn"', '"_ambient" "24"', '"_fog" "420"']
for i, b in enumerate(brushes):
    lines.append(f"// brush {i}")
    lines.append("{")
    for (p0, p1, p2, tex) in b:
        pts = " ".join("( %s )" % " ".join(str(int(v)) for v in p) for p in (p0, p1, p2))
        lines.append(f"{pts} fpslab/{tex} 0 0 0 2 2")
    lines.append("}")
lines.append("}")
for i, e in enumerate(ents, start=1):
    lines.append(f"// entity {i}")
    lines.append("{")
    for k, v in e.items():
        lines.append(f'"{k}" "{v}"')
    lines.append("}")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    f.write("\n".join(lines) + "\n")

# ascii preview
for r in range(GH):
    print("".join((grid[r][c] or ("#" if any(is_room(c + dc, r + dr) for dc in (-1, 0, 1) for dr in (-1, 0, 1)) else " ")) for c in range(GW)))
print(f"wrote {os.path.relpath(OUT)}: {len(brushes)} brushes, {len(ents)} entities")
