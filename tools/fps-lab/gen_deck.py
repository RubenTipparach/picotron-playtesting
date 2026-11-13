#!/usr/bin/env python3
"""
gen_deck.py - SEED the FPS Render Lab's second level, a starship deck, as a
TrenchBroom .map file (carts/fps-render-lab-deck.map, Valve220 texturing).

Like gen_level.py this is a one-time seed: once the .map exists, edit it in
TrenchBroom; re-running this OVERWRITES it.

    python3 tools/fps-lab/gen_deck.py
    python3 tools/fps-lab/map2bsp.py carts/fps-render-lab-deck.map carts/fps-render-lab.p64/deck.lua LEVEL_DECK

An original layout built for mood. The heart is a ROUND reactor hall (a
12-sided room carved out of the square grid by wedge brushes): a stepped pit
behind a curved see-through railing round a caged column of churning plasma,
curved console banks, a glowing cove ring, blinking emergency blips and a
tiered ceiling (ribbed soffit with lamp panels, coffered ring, coffered dome
with a glowing collar). Low ambient light; lamps bake pools of light onto
the walkway and sconces wash the padded amber walls. Off the hall: a lounge
with a long window onto a drifting starfield, and engineering and a cargo
bay behind sliding doors.

Same conventions as gen_level.py: 64u cells, Z up, 1 texel = 2 units, the
world is carved (floor/ceiling slabs per region + full-height wall cells).
Faces are written in Valve220 so angled walls carry their texture along the
wall (no projection stretch) and console banks/railings line up.
"""
import math
import os

CELL, BOTTOM, TOP = 64, -96, 384
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "carts", "fps-render-lab-deck.map")

# region -> floor z, ceiling z, floor/ceiling/wall textures, r = exposed slab side (risers)
# "round": the reactor hall builds its own floor (rings round the pit) and walls
REGIONS = {
    "R":  dict(floor=0,   ceil=288, f="deck_floor",  c="deck_coffer", w="deck_bulkhead", r="deck_panel", round=True),
    "O":  dict(floor=0,   ceil=192, f="deck_floor",  c="deck_ceil",   w="deck_bulkhead", r="deck_panel"),  # observation lounge
    "C":  dict(floor=0,   ceil=144, f="deck_floor",  c="deck_ceil",   w="deck_panel",    r="deck_panel"),  # corridor
    "E":  dict(floor=0,   ceil=192, f="floor_metal", c="deck_ceil",   w="deck_panel",    r="glow_strip"),  # engineering
    "F":  dict(floor=12,  ceil=192, f="floor_metal", c="deck_ceil",   w="deck_panel",    r="glow_strip"),  # its step
    "G":  dict(floor=24,  ceil=192, f="deck_floor",  c="deck_ceil",   w="deck_panel",    r="glow_strip"),  # its raised deck
    "B":  dict(floor=0,   ceil=224, f="floor_metal", c="ceil_panel",  w="metal",         r="metal"),       # cargo bay
    "L":  dict(floor=0,   ceil=128, f="step",        c="deck_ceil",   w="deck_panel",    r="deck_panel"),  # door tunnels
    "D":  dict(floor=0,   ceil=128, f="step",        c="deck_trim",   w="deck_panel",    r="deck_panel"),  # door cells
}

GW, GH = 35, 23
grid = [[None] * GW for _ in range(GH)]      # [row][col], row 0 = north


def room(reg, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            grid[y][x] = reg


room("O", 11, 1, 21, 3)      # observation lounge (window on the north wall)
room("C", 15, 4, 17, 6)      # lounge -> reactor hall
room("R", 9, 7, 23, 21)      # reactor hall: 15 x 15 cells, the round room is cut from it
room("E", 1, 9, 6, 20)       # engineering
room("F", 1, 11, 6, 11)      # ... a step up to
room("G", 1, 9, 6, 10)       # ... its raised control deck
room("B", 26, 8, 33, 21)     # cargo bay
DOORS = [((7, 14), 90), ((25, 14), 90)]      # (door cell, slide angle): both tunnels run east-west
for c in (7, 8):
    grid[14][c] = "L"
for c in (24, 25):
    grid[14][c] = "L"
DOOR_CELLS = {}
for (c, r), ang in DOORS:
    grid[r][c] = "D"
    DOOR_CELLS[(c, r)] = ang


def wx(col):   # cell column -> world x of its west edge
    return col * CELL


def wy(row):   # cell row -> world y of its SOUTH edge (row 0 is north)
    return (GH - 1 - row) * CELL


def cell_center(col, row):
    return wx(col) + CELL // 2, wy(row) + CELL // 2


# ---------------------------------------------------------------- brushes --
brushes = []   # list of faces: (p0, p1, p2, tex, (ua, uo, va, vo))
TSCALE = 2     # world units per texel


def _axes(n, a=None, vo=0.0):
    """Valve220 texture axes for a face with outward normal n. Horizontal
    faces: world x / -y. Vertical faces: u runs along the face, v down;
    axial ones are anchored to the world (so coplanar neighbours merge),
    angled ones at point a (so a wall segment starts on a texel edge)."""
    if abs(n[2]) > 0.5:
        return (1, 0, 0), 0.0, (0, -1, 0), vo
    ux, uy = -n[1], n[0]
    L = math.hypot(ux, uy)
    ux, uy = ux / L, uy / L
    uo = 0.0
    if a is not None and abs(ux) > 1e-6 and abs(uy) > 1e-6:
        uo = -(a[0] * ux + a[1] * uy) / TSCALE
    return (ux, uy, 0), uo, (0, 0, -1), vo


def prism(poly, z0, z1, side, top=None, bottom=None, vo=0.0):
    """Convex vertical prism over the 2D polygon poly (integer x, y, any
    winding). side: one texture, or a list with one texture per edge
    (edge i runs poly[i] -> poly[i+1] in the order given)."""
    pts = [(int(round(x)), int(round(y))) for x, y in poly]
    sides = list(side) if isinstance(side, (list, tuple)) else [side] * len(pts)
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    if area < 0:                                   # make it CCW seen from above
        pts = pts[::-1]
        sides = [sides[(len(pts) - 2 - i) % len(pts)] for i in range(len(pts))]
    t_top, t_bot = top or sides[0], bottom or sides[0]
    b = []
    x, y = pts[0]
    b.append(((x, y, z1), (x, y + 1, z1), (x + 1, y, z1), t_top, _axes((0, 0, 1), vo=vo)))
    b.append(((x, y, z0), (x + 1, y, z0), (x, y + 1, z0), t_bot, _axes((0, 0, -1), vo=vo)))
    for i in range(len(pts)):
        a, c = pts[i], pts[(i + 1) % len(pts)]
        if a == c:
            continue
        dx, dy = c[0] - a[0], c[1] - a[1]
        L = math.hypot(dx, dy)
        n = (dy / L, -dx / L, 0)                   # outward for a CCW polygon
        b.append(((a[0], a[1], z0), (a[0], a[1], z1), (c[0], c[1], z0), sides[i], _axes(n, a, vo)))
    brushes.append(b)


def box(x0, y0, z0, x1, y1, z1, tex, top=None, bottom=None, side=None):
    """Axis aligned brush. side may be a dict {'e','w','n','s'} -> tex."""
    sd = side if isinstance(side, dict) else {}
    ds = side if isinstance(side, str) else tex
    # CCW from the south-west corner: south, east, north, west edges
    prism([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1,
          [sd.get("s", ds), sd.get("e", ds), sd.get("n", ds), sd.get("w", ds)],
          top=top or tex, bottom=bottom or tex)


def is_room(c, r):
    return 0 <= c < GW and 0 <= r < GH and grid[r][c] is not None


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


ents = []


def ent_xy(cls, x, y, z=0, **kv):
    e = {"classname": cls, "origin": f"{int(round(x))} {int(round(y))} {int(round(z))}"}
    e.update({k: str(v) for k, v in kv.items()})
    ents.append(e)


# 1) floor + ceiling slabs per region (slab sides = risers between floor heights)
for reg, p in REGIONS.items():
    for (c, r, w, h) in rects(reg):
        x0, x1 = wx(c), wx(c + w)
        y0, y1 = wy(r + h - 1), wy(r) + CELL
        if p.get("round"):
            continue                 # the round hall builds its own floor and ceiling rings
        box(x0, y0, BOTTOM, x1, y1, p["floor"], p["r"], top=p["f"])
        box(x0, y0, p["ceil"], x1, y1, TOP, p["w"], bottom=p["c"])

NEIGH = {"n": (0, -1), "s": (0, 1), "e": (1, 0), "w": (-1, 0)}
OPP = {"n": "s", "s": "n", "e": "w", "w": "e"}
# per region: (fascia bottom, console every n cells along a wall (0 = none))
DRESS = {"O": (144, 0), "E": (128, 3), "F": (128, 0), "G": (128, 3)}
CONSOLE_Z = {"E": 64, "G": 64, "R": 64}       # consoles fill z..z+64 (one texture tile)


def console_at(c, r, d):
    """does room cell (c, r) get a flush console on its wall in direction
    OPP[d]? (d = direction from the wall cell to the room cell)"""
    if not is_room(c, r) or grid[r][c] not in CONSOLE_Z:
        return False
    if grid[r][c] == "R":
        return (c, r, d) == (16, 21, "n")       # the hall's south wall, facing the core
    every = DRESS[grid[r][c]][1]
    k = c if d in "ns" else r
    return every > 0 and k % every == every // 2


# 2) wall cells: every empty cell touching a room (8-neighbourhood)
WINDOW_ROW = 0           # the lounge's north wall is a window onto the stars
for r in range(GH):
    for c in range(GW):
        if grid[r][c] is not None:
            continue
        near = [(c + dc, r + dr) for dc in (-1, 0, 1) for dr in (-1, 0, 1) if (dc or dr)]
        if not any(is_room(cc, rr) for cc, rr in near):
            continue

        def face_tex(cc, rr):
            if (cc, rr) in DOOR_CELLS:
                return "deck_trim"           # door frame
            if not is_room(cc, rr):
                return "deck_panel"
            if r == WINDOW_ROW and grid[rr][cc] == "O" and rr == r + 1:
                return "stars"
            return REGIONS[grid[rr][cc]]["w"]
        side = {"e": face_tex(c + 1, r), "w": face_tex(c - 1, r),
                "n": face_tex(c, r - 1), "s": face_tex(c, r + 1)}
        con = {d: CONSOLE_Z[grid[r + dr][c + dc]] for d, (dc, dr) in NEIGH.items()
               if console_at(c + dc, r + dr, d)}
        if not con:
            box(wx(c), wy(r), BOTTOM, wx(c) + CELL, wy(r) + CELL, TOP, "deck_panel", side=side)
            continue
        # a console is a 64x64 band of the wall's own face (flush, no extra
        # polygons): the wall cell is stacked from three brushes
        z0 = list(con.values())[0]
        lit = dict(side)
        for d in con:
            lit[d] = "glow_console"
        box(wx(c), wy(r), BOTTOM, wx(c) + CELL, wy(r) + CELL, z0, "deck_panel", side=side)
        box(wx(c), wy(r), z0, wx(c) + CELL, wy(r) + CELL, z0 + CELL, "deck_panel", side=lit)
        box(wx(c), wy(r), z0 + CELL, wx(c) + CELL, wy(r) + CELL, TOP, "deck_panel", side=side)


# 3) wall dressing in the square rooms: per room cell, on each side facing a wall
def on_wall(c, r, d, a0, a1, depth, z0, z1, tex, front=None, top=None, bottom=None):
    """A box against the wall on side d of cell (c, r): a0..a1 along the wall
    (0..64 within the cell, west->east or south->north), depth out from it."""
    side = {OPP[d]: front} if front else None
    if d == "n":
        f = wy(r) + CELL
        box(wx(c) + a0, f - depth, z0, wx(c) + a1, f, z1, tex, top=top, bottom=bottom, side=side)
    elif d == "s":
        f = wy(r)
        box(wx(c) + a0, f, z0, wx(c) + a1, f + depth, z1, tex, top=top, bottom=bottom, side=side)
    elif d == "e":
        f = wx(c) + CELL
        box(f - depth, wy(r) + a0, z0, f, wy(r) + a1, z1, tex, top=top, bottom=bottom, side=side)
    else:
        f = wx(c)
        box(f, wy(r) + a0, z0, f + depth, wy(r) + a1, z1, tex, top=top, bottom=bottom, side=side)


def wall_light(c, r, d, z, lv, out=28):
    x, y = cell_center(c, r)
    dx, dy = {"n": (0, 32 - out), "s": (0, out - 32), "e": (32 - out, 0), "w": (out - 32, 0)}[d]
    ent_xy("light", x + dx, y + dy, z, light=lv)


def blip(c, r, d, z, a=24):
    """an emergency blip: a 16x16 red lamp (blinks in the cart) on the wall"""
    on_wall(c, r, d, a, a + 16, 4, z, z + 16, "glow_alert")


for r in range(GH):
    for c in range(GW):
        reg = grid[r][c]
        if reg not in DRESS:
            continue
        fz, every_con = DRESS[reg]
        ceil = REGIONS[reg]["ceil"]
        fl = REGIONS[reg]["floor"]
        for d, (dc, dr) in NEIGH.items():
            if is_room(c + dc, r + dr):
                continue
            if reg == "O" and d == "n":
                continue                      # the window wall is dressed below
            k = c if d in "ns" else r
            # dark fascia over the wall; its underside is a glowing cove
            on_wall(c, r, d, 0, 64, 16, fz, ceil, "deck_panel", bottom="glow_strip")
            # skirting with a light strip in its face
            on_wall(c, r, d, 0, 64, 8, fl, fl + 12, "deck_panel", front="glow_strip")
            if console_at(c, r, OPP[d]):
                wall_light(c, r, d, CONSOLE_Z[reg] + 32, 70, out=24)   # the screen's spill
            elif k % 3 == 1:
                wall_light(c, r, d, fz - 8, 200, out=40)  # sconce: washes the wall, fades down
            elif reg == "E" and (c, r, d) in ((6, 13, "e"), (6, 18, "e")):
                blip(c, r, d, fz - 40)

# 4) the round reactor hall ------------------------------------------------
HX, HY = wx(16) + 32, wy(14) + 32          # centre: cell (16, 14)
NSEG = 12                # sides of the round hall (each side costs ~15 polygons)
STEP = 2 * math.pi / NSEG


def ring_pt(apothem, k, n=NSEG):
    """vertex k of an n-gon with the given apothem whose flat sides face the
    axes (vertex k sits between side k-1 and side k)."""
    a = (k - 0.5) * 2 * math.pi / n
    rad = apothem / math.cos(math.pi / n)
    return HX + rad * math.cos(a), HY + rad * math.sin(a)


def seg_quad(a0, a1, k, n=NSEG):
    """side k of the ring between apothems a0 < a1 (a trapezoid)"""
    return [ring_pt(a0, k, n), ring_pt(a0, k + 1, n), ring_pt(a1, k + 1, n), ring_pt(a1, k, n)]


def ngon(apothem, n):
    return [ring_pt(apothem, k, n) for k in range(n)]


def push_out(p, cheb=544):
    """p radially out from the centre to the square of half-size cheb"""
    dx, dy = p[0] - HX, p[1] - HY
    s = cheb / max(abs(dx), abs(dy))
    return HX + dx * s, HY + dy * s


WALL_A = 480             # the round wall's apothem: its four axis sides ARE the square's walls
FZ = 160                 # bottom of the fascia / cove ring
CONSOLE_SEGS = {1, 5, 7, 11}                # console banks either side of the north and south axis
CARDINAL = {0, 3, 6, 9}                     # these sides are the square's own (grid) walls
# wall wedges: the corners between the round wall and the square, stacked in
# bands so the wall face changes material with height (no extra polygons)
for k in range(NSEG):
    if k in CARDINAL:
        continue
    va, vb = ring_pt(WALL_A, k), ring_pt(WALL_A, k + 1)
    fa, fb = push_out(va), push_out(vb)
    outer = [fb]
    ang_a, ang_b = math.atan2(va[1] - HY, va[0] - HX), math.atan2(vb[1] - HY, vb[0] - HX)
    for cx, cy in ((1, 1), (-1, 1), (-1, -1), (1, -1)):        # square corner inside this side?
        ca = math.atan2(cy, cx)
        da, db = (ca - ang_a) % (2 * math.pi), (ang_b - ang_a) % (2 * math.pi)
        if 0 < da < db:
            outer.append((HX + 544 * cx, HY + 544 * cy))
    outer.append(fa)
    poly = [va, vb] + outer
    bands = [(BOTTOM, 12, "glow_strip")]
    if k in CONSOLE_SEGS:
        bands += [(12, 64, "deck_bulkhead"), (64, 128, "glow_console"), (128, FZ, "deck_bulkhead")]
    else:
        bands += [(12, FZ, "deck_bulkhead")]
    bands += [(FZ, TOP, "deck_panel")]
    for z0, z1, t in bands:
        prism(poly, z0, z1, [t] + ["deck_panel"] * (len(poly) - 1))
    # light: sconces wash the bulkhead, consoles spill a little glow
    mid = ((va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2)
    ix, iy = HX - mid[0], HY - mid[1]
    L = math.hypot(ix, iy)
    ix, iy = ix / L, iy / L
    if k in CONSOLE_SEGS:
        ent_xy("light", mid[0] + ix * 28, mid[1] + iy * 28, 96, light=90)
    else:
        ent_xy("light", mid[0] + ix * 40, mid[1] + iy * 40, FZ - 8, light=200)
        # emergency blips under the cove on four of the plain sides
        if k in (2, 4, 8, 10):
            tx, ty = -iy, ix
            p0 = (mid[0] - tx * 8, mid[1] - ty * 8)
            p1 = (mid[0] + tx * 8, mid[1] + ty * 8)
            prism([p0, p1, (p1[0] + ix * 4, p1[1] + iy * 4), (p0[0] + ix * 4, p0[1] + iy * 4)],
                  FZ - 32, FZ - 16, "glow_alert")
# Ring apothems stay multiples of 16 (the compiler samples solids at 16u
# voxel centres, 8 mod 16: a seam there reads as a leak). Everything below is rings of trapezoid prisms that only ever meet face to
# face: nothing overlaps another brush's face, so CSG never chops a face into
# fragments (angled faces can't be re-merged into rectangles afterwards).
#
# ceiling (outside in): cove fascia (160), ribbed soffit (224) with a flush
# lamp panel in every other side, a brass step up to the coffered crown
# (272), and a brass collar (240) round the top of the core
CEIL = [(WALL_A - 16, WALL_A, 160, "deck_panel", "glow_strip"),
        (320, WALL_A - 16, 224, "deck_trim", "deck_ceil"),
        (96, 320, 272, "deck_trim", "deck_coffer")]
LAMP = [(384, WALL_A - 16, 224, "deck_trim", "deck_ceil"),
        (352, 384, 224, "deck_trim", "glow_lamp"),
        (320, 352, 224, "deck_trim", "deck_ceil")]
for k in range(NSEG):
    for a0, a1, z, inner, bot in (LAMP + CEIL[2:] + CEIL[:1] if k % 2 == 1 else CEIL):
        prism(seg_quad(a0, a1, k), z, TOP, [inner, "deck_panel", "deck_panel", "deck_panel"], bottom=bot)
    if k % 2 == 1:                   # each lamp bakes its own pool of light on the walkway
        a = k * STEP
        ent_xy("light", HX + 368 * math.cos(a), HY + 368 * math.sin(a), 120, light=250)
prism(ngon(96, NSEG), 240, TOP, "deck_trim", bottom="deck_trim")           # collar
# floor (inside out): plinth (8), pit floor (-16), railing base
# + railing (0..40, see-through), walkway (0)
PIT_A = 224                          # the pit: one 16u step down (STEP is 20)
FLOOR = [(32, 64, 8, "deck_trim", "deck_trim"),
         (64, PIT_A, -16, "deck_trim", "deck_floor"),
         (PIT_A, PIT_A + 16, 0, "glow_strip", "deck_trim"),
         (PIT_A + 16, WALL_A, 0, "deck_trim", "deck_floor")]
for k in range(NSEG):
    for a0, a1, z, inner, top in FLOOR:
        prism(seg_quad(a0, a1, k), BOTTOM, z, [inner, "deck_panel", "deck_panel", "deck_panel"], top=top)
    if k not in (3, 9):              # the railing, open north and south
        prism(seg_quad(PIT_A, PIT_A + 16, k), 0, 40, ["deck_rail", "deck_trim", "deck_rail", "deck_trim"],
              top="deck_trim", vo=20)                     # vo: texture row 0 at the rail top
# the core: a column of churning plasma from the plinth up into the collar
prism(ngon(32, NSEG), BOTTOM, 240, "plasma")
for j in range(4):
    a = j * math.pi / 2 + math.pi / 4
    ent_xy("light", HX + 100 * math.cos(a), HY + 100 * math.sin(a), 20, light=190)    # the core lights the pit
    ent_xy("light", HX + 100 * math.cos(a), HY + 100 * math.sin(a), 160, light=180)   # ... and the collar
for j in range(6):                                # a soft ring of light on the coffered crown
    a = (j + 0.5) * math.pi / 3
    ent_xy("light", HX + 210 * math.cos(a), HY + 210 * math.sin(a), 236, light=150)

# 5) observation lounge: sill, header and mullions frame the starfield window
oy = wy(1) + CELL                                  # the window plane (north wall face)
box(wx(11), oy - 16, 0, wx(22), oy, 40, "deck_panel", top="deck_trim")
box(wx(11), oy - 16, 152, wx(22), oy, 192, "deck_panel", bottom="glow_strip")
for c in (13, 15, 18, 20):                         # panes 2-2-3-2-2 cells wide
    box(wx(c) - 8, oy - 16, 40, wx(c) + 8, oy, 152, "deck_trim")
for c in (12, 19):                                 # benches facing the window
    box(wx(c), wy(3) + 16, 0, wx(c) + 128, wy(3) + 48, 20, "deck_panel", top="deck_floor")
for (c, r) in ((13, 2), (16, 2), (19, 2)):
    x, y = cell_center(c, r)
    box(x - 16, y - 16, 184, x + 16, y + 16, 192, "deck_panel", bottom="glow_lamp")
    ent_xy("light", x, y, 150, light=230)
x, y = cell_center(16, 5)                          # corridor lamp
box(x - 16, y - 16, 136, x + 16, y + 16, 144, "deck_panel", bottom="glow_lamp")
ent_xy("light", x, y, 110, light=200)
blip(15, 5, "w", 96)
blip(17, 5, "e", 96)

# 6) engineering: plasma conduits up the west wall, a lit console table
for r in (13, 17):
    y = wy(r) + 16
    box(wx(1), y, 0, wx(1) + 24, y + 32, 192, "plasma")
    for z in (0, 120):
        box(wx(1), y - 8, z, wx(1) + 32, y + 40, z + 16, "deck_trim")
    ent_xy("light", wx(1) + 48, y + 16, 64, light=170)
box(wx(3) + 16, wy(15) + 16, 0, wx(5) - 16, wy(13) + 48, 36, "deck_panel", top="glow_console")
ent_xy("light", wx(4), wy(14) + 32, 80, light=140)
for (c, r) in ((3, 10), (3, 18)):
    x, y = cell_center(c, r)
    box(x + 16, y - 16, 184, x + 48, y + 16, 192, "deck_panel", bottom="glow_lamp")
    ent_xy("light", x + 32, y, 150, light=260)

# 7) cargo bay: a catwalk along the east wall, hazard-striped crate pads
box(wx(31), wy(20), 112, wx(34), wy(9) + CELL, 128, "deck_trim", top="floor_metal")
for r in (10, 15, 20):
    box(wx(31) + 8, wy(r) + 24, 0, wx(31) + 24, wy(r) + 40, 112, "deck_panel")
for (c, r) in ((27, 9), (27, 18)):
    box(wx(c), wy(r + 1), 0, wx(c + 2), wy(r) + CELL, 4, "metal", top="hazard")
for (c, r) in ((28, 10), (28, 15), (28, 19), (32, 12), (32, 17)):
    x, y = cell_center(c, r)
    box(x - 16, y - 16, 216, x + 16, y + 16, 224, "metal", bottom="glow_lamp")
    ent_xy("light", x, y, 180, light=280 if c == 28 else 200)
blip(26, 12, "w", 140)
blip(26, 17, "w", 140)
ent_xy("light", wx(25) + 32, wy(14) + 32, 100, light=130)     # tunnels
ent_xy("light", wx(7) + 32, wy(14) + 32, 100, light=130)
blip(24, 14, "n", 96)
blip(8, 14, "s", 96)

# ---------------------------------------------------------------- entities --
ent_xy("info_player_start", HX, HY - 400, 24, angle=90)


def ent(cls, col, row, z=0, angle=0):
    x, y = cell_center(col, row)
    ent_xy(cls, x, y, z, angle=angle)


for (x, y) in [(-300, 250), (300, 250), (-330, -150), (340, -120), (0, 300)]:     # hall walkway
    ent_xy("monster_grunt", HX + x, HY + y, 0, angle=270)
for (c, r) in [(12, 2), (20, 2), (2, 10), (5, 17), (2, 20), (29, 9), (32, 14), (27, 20), (30, 17)]:
    ent("monster_grunt", c, r, 0, angle=270)
for (c, r) in [(27, 9), (28, 9), (27, 10), (27, 18), (27, 19), (28, 18), (33, 21), (32, 8)]:
    ent("prop_crate", c, r)
for (c, r) in [(33, 8), (26, 21), (29, 21), (6, 20), (1, 20)]:
    ent("prop_barrel", c, r)
for (x, y) in [(-380, -60), (380, 60)]:
    ent_xy("item_health", HX + x, HY + y, 0)
for (x, y) in [(60, -380), (-60, 380)]:
    ent_xy("item_ammo", HX + x, HY + y, 0)
for (c, r) in [(6, 12), (33, 19), (11, 1)]:
    ent("item_health", c, r)
for (c, r) in [(1, 15), (26, 8), (21, 1)]:
    ent("item_ammo", c, r)

# sliding doors across the middle of each door cell, sliding north
door_ents = []
for (c, r), ang in DOORS:
    x0, y0 = wx(c), wy(r)
    door_ents.append(({"classname": "func_door", "angle": str(ang)}, (x0 + 24, y0, 0, x0 + 40, y0 + CELL, 128)))

# ---------------------------------------------------------------- write ---
lines = ["// Game: Picotron FPS Lab", "// Format: Valve",
         "// seeded by tools/fps-lab/gen_deck.py - now edit in TrenchBroom"]
lines += ["// entity 0", "{", '"mapversion" "220"', '"classname" "worldspawn"', '"_ambient" "6"', '"_fog" "420"',
          '"_angled" "1"']           # map2bsp: exact rules for the round hall's angled brushes


def g(v):
    return ("%.6f" % v).rstrip("0").rstrip(".") if v != int(v) else str(int(v))


def brush_lines(b):
    out = ["{"]
    for (p0, p1, p2, tex, (ua, uo, va, vo)) in b:
        pts = " ".join("( %s )" % " ".join(str(int(v)) for v in p) for p in (p0, p1, p2))
        out.append(f"{pts} fpslab/{tex} [ {g(ua[0])} {g(ua[1])} {g(ua[2])} {g(uo)} ] "
                   f"[ {g(va[0])} {g(va[1])} {g(va[2])} {g(vo)} ] 0 {TSCALE} {TSCALE}")
    out.append("}")
    return out


for i, b in enumerate(brushes):
    lines.append(f"// brush {i}")
    lines += brush_lines(b)
lines.append("}")
for i, e in enumerate(ents, start=1):
    lines.append(f"// entity {i}")
    lines.append("{")
    for k, v in e.items():
        lines.append(f'"{k}" "{v}"')
    lines.append("}")
n_world = len(brushes)
for i, (props, (x0, y0, z0, x1, y1, z1)) in enumerate(door_ents, start=len(ents) + 1):
    lines.append(f"// entity {i}")
    lines.append("{")
    for k, v in props.items():
        lines.append(f'"{k}" "{v}"')
    brushes.clear()
    box(x0, y0, z0, x1, y1, z1, "door")
    lines.append("// brush 0")
    lines += brush_lines(brushes[0])
    lines.append("}")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    f.write("\n".join(lines) + "\n")

for r in range(GH):
    print("".join((grid[r][c] or ("#" if any(is_room(c + dc, r + dr) for dc in (-1, 0, 1) for dr in (-1, 0, 1)) else " ")) for c in range(GW)))
print(f"wrote {os.path.relpath(OUT)}: {n_world} brushes, {len(ents)} entities, {len(door_ents)} doors")
