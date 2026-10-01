#!/usr/bin/env python3
"""
map2bsp.py - a tiny Quake-style map compiler for Picotron.

    python3 tools/fps-lab/map2bsp.py [carts/fps-render-lab.map] [carts/fps-render-lab.p64/level.lua]

Reads a TrenchBroom .map (Standard or Valve220 format) and writes a Lua data
file both of the cart's renderers consume, so the SAME level feeds:

  * the TRUE-3D renderer  -> polygons + a polygon BSP tree (drawn strictly
                             back-to-front, so no z-buffer/sort is needed)
  * the RAYCASTER         -> a 64-unit grid sliced out of the brushes at eye
                             height (everything else is flattened away)

Pipeline (the same stages as id's qbsp/light, scaled down):
  1. parse brushes/entities; each brush = intersection of half-spaces
  2. brush faces -> convex polygons (clip a huge quad by the other planes)
  3. CSG: chop every face against every other brush, drop the parts buried
     inside solid (touching faces vanish, overlapping coplanar faces dedupe)
  4. "outside fill": voxelise solid space, flood from info_player_start, drop
     faces that look into the void (qbsp does the same with portals)
  5. light: cut faces on a 64u grid, bake a light level per tile from
     `light` entities (+shadow rays through the voxel grid), then greedily
     re-merge equal-level tiles into big rectangles
  6. build a polygon BSP (splitter = fewest cuts, balanced, axial preferred)
  7. raycaster grid (solid if brushes cover the eye band), per-side wall
     textures, per-cell light; collision boxes; entities
  9. PVS (Quake's potentially visible set): for every 64u grid cell, the
     BSP nodes, polygons and cells that can be seen from anywhere inside it
     (2D ray fans over a 16u map of floor-to-ceiling occluders; doors count
     as open). The cart's BSP walk only touches what the PVS allows.
  8. sectors: func_door brushes are moving doors, not world. Flood the open
     space with the doors shut -> connected areas = sectors; every polygon,
     BSP node (subtree bitmask) and grid cell is tagged, and every door knows
     the two sectors it joins, so the cart can skip whole sectors that are
     behind closed doors
"""
import math
import os
import re
import sys
from collections import deque

import numpy as np

EPS = 0.01
TILE = 64                  # lighting tile size (world units)
TEX_PX = 32                # texture size in texels
EYE_BAND = (30, 62)        # raycaster: cell is a wall if brushes cover this z band
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
NODRAW = {"skip", "clip", "nodraw", "trigger", "hint"}
FULLBRIGHT = ("sky", "slime", "lava")
TURB = ("sky", "slime")    # drawn from the animated (scrolling) texture, not the surface cache

# Texture names -> index into the cart's texture table. Keep in sync with
# TEXTURES in tools/fps-lab/gen_art.py (the art generator writes the sprites).
# (list index == sprite index; "_" entries are slots other sprites use)
TEXTURES = ["stone", "brick", "metal", "wood_wall", "stone_moss", "floor_stone",
            "floor_tile", "floor_metal", "cobble", "floor_wood", "ceil_wood",
            "ceil_panel", "sky", "slime", "trim", "step", "pillar",
            "_crate_face", "_barrel_side", "_barrel_top", "door", "hazard"]


# ------------------------------------------------------------------ parse --
def tokenize(text):
    text = re.sub(r"//[^\n]*", "", text)
    return re.findall(r'"[^"]*"|[{}()\[\]]|[^\s{}()\[\]"]+', text)


def parse_map(path):
    toks = tokenize(open(path).read())
    i, ents = 0, []

    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v
    while i < len(toks):
        assert toks[i] == "{", f"expected entity, got {toks[i]}"
        i += 1
        ent = {"props": {}, "brushes": []}
        while toks[i] != "}":
            if toks[i].startswith('"'):
                k, v = toks[i][1:-1], toks[i + 1][1:-1]
                ent["props"][k] = v
                i += 2
            elif toks[i] == "{":
                i += 1
                faces = []
                while toks[i] != "}":
                    pts = []
                    for _ in range(3):
                        assert toks[i] == "("; i += 1
                        pts.append(np.array([num(), num(), num()]))
                        assert toks[i] == ")"; i += 1
                    tex = toks[i]; i += 1
                    if toks[i] == "[":                       # Valve 220
                        i += 1; ua = np.array([num(), num(), num()]); uo = num(); i += 1
                        i += 1; va = np.array([num(), num(), num()]); vo = num(); i += 1
                        rot, sx, sy = num(), num(), num()
                        ti = ("valve", ua, uo, va, vo, sx, sy)
                    else:                                    # Standard
                        xo, yo, rot, sx, sy = num(), num(), num(), num(), num()
                        ti = ("std", xo, yo, rot, sx, sy)
                    # optional Quake2/3 surface flags
                    while i < len(toks) and toks[i] not in ("(", "}"):
                        i += 1
                    faces.append((pts, tex, ti))
                i += 1
                ent["brushes"].append(faces)
            else:
                raise ValueError(f"unexpected token {toks[i]}")
        i += 1
        ents.append(ent)
    return ents


# --------------------------------------------------------------- geometry --
def plane_from_points(p0, p1, p2):
    n = np.cross(p2 - p0, p1 - p0)           # TrenchBroom/Quake winding
    n = n / np.linalg.norm(n)
    return n, float(np.dot(n, p0))


def base_winding(n, d, size=1e5):
    ax = int(np.argmax(np.abs(n)))
    up = np.array([0.0, 0.0, 1.0]) if ax != 2 else np.array([1.0, 0.0, 0.0])
    up = up - n * np.dot(up, n); up /= np.linalg.norm(up)
    right = np.cross(up, n)
    org = n * d
    up *= size; right *= size
    w = [org - right + up, org + right + up, org + right - up, org - right - up]
    return orient(w, n)


def poly_normal(poly):
    nx = ny = nz = 0.0
    for a, b in zip(poly, poly[1:] + poly[:1]):
        nx += (a[1] - b[1]) * (a[2] + b[2])
        ny += (a[2] - b[2]) * (a[0] + b[0])
        nz += (a[0] - b[0]) * (a[1] + b[1])
    return np.array([nx, ny, nz])


def orient(poly, n):
    return poly if np.dot(poly_normal(poly), n) >= 0 else poly[::-1]


def split(poly, n, d):
    """-> (front, back); None for an empty side. Coplanar -> ('on', poly)."""
    ds = [float(np.dot(n, p)) - d for p in poly]
    if all(abs(x) <= EPS for x in ds):
        return "on", poly
    if all(x >= -EPS for x in ds):
        return poly, None
    if all(x <= EPS for x in ds):
        return None, poly
    front, back = [], []
    for k in range(len(poly)):
        a, b = poly[k], poly[(k + 1) % len(poly)]
        da, db = ds[k], ds[(k + 1) % len(poly)]
        if da >= -EPS:
            front.append(a)
        if da <= EPS:
            back.append(a)
        if (da > EPS and db < -EPS) or (da < -EPS and db > EPS):
            t = da / (da - db)
            m = a + (b - a) * t
            front.append(m); back.append(m)
    return (front if len(front) >= 3 else None), (back if len(back) >= 3 else None)


def poly_area(poly):
    return np.linalg.norm(poly_normal(poly)) * 0.5


def centroid(poly):
    return sum(poly) / len(poly)


# ----------------------------------------------------------------- uv ----
BASEAXIS = [
    ((0, 0, 1), (1, 0, 0), (0, -1, 0)), ((0, 0, -1), (1, 0, 0), (0, -1, 0)),
    ((1, 0, 0), (0, 1, 0), (0, 0, -1)), ((-1, 0, 0), (0, 1, 0), (0, 0, -1)),
    ((0, 1, 0), (1, 0, 0), (0, 0, -1)), ((0, -1, 0), (1, 0, 0), (0, 0, -1)),
]


def tex_axes(n, ti):
    """-> (s_vec, s_off, t_vec, t_off) with u = p.s + s_off (texels)."""
    if ti[0] == "valve":
        _, ua, uo, va, vo, sx, sy = ti
        return ua / (sx or 1), uo, va / (sy or 1), vo
    _, xo, yo, rot, sx, sy = ti
    best, bi = -1, 0
    for k, (bn, _, _) in enumerate(BASEAXIS):
        dp = np.dot(n, bn)
        if dp > best + 1e-6:
            best, bi = dp, k
    s = np.array(BASEAXIS[bi][1], float); t = np.array(BASEAXIS[bi][2], float)
    if rot:
        a = math.radians(rot); sn, cs = math.sin(a), math.cos(a)
        sv = int(np.argmax(np.abs(s))); tv = int(np.argmax(np.abs(t)))
        for vec in (s, t):
            ns = cs * vec[sv] - sn * vec[tv]
            nt = sn * vec[sv] + cs * vec[tv]
            vec[sv], vec[tv] = ns, nt
    return s / (sx or 1), xo, t / (sy or 1), yo


# ---------------------------------------------------------------- brushes --
class Brush:
    def __init__(self, faces, idx):
        self.idx = idx
        self.planes = []
        for pts, tex, ti in faces:
            n, d = plane_from_points(*pts)
            name = tex.split("/")[-1].lower()
            self.planes.append((n, d, name, ti))
        self.polys = []
        for k, (n, d, name, ti) in enumerate(self.planes):
            w = base_winding(n, d)
            for j, (n2, d2, _, _) in enumerate(self.planes):
                if j == k or w is None:
                    continue
                r = split(w, n2, d2)
                if r[0] == "on":
                    continue
                w = r[1]
            if w is not None and poly_area(w) > 0.01:
                self.polys.append((k, w))
        pts = [p for _, w in self.polys for p in w]
        if not pts:
            raise ValueError(f"brush {idx} is degenerate")
        self.mins = np.min(pts, axis=0); self.maxs = np.max(pts, axis=0)
        self.textures = {name for _, _, name, _ in self.planes}

    def contains(self, p, eps=EPS):
        return all(np.dot(n, p) - d < -eps for n, d, _, _ in self.planes)


def overlap(a, b, pad=EPS):
    return np.all(a.mins <= b.maxs + pad) and np.all(b.mins <= a.maxs + pad)


def csg(brushes):
    faces = []   # (poly, n, d, tex, ti)
    for bi in brushes:
        others = [bj for bj in brushes if bj is not bi and overlap(bi, bj)]
        for k, poly in bi.polys:
            n, d, name, ti = bi.planes[k]
            if name in NODRAW:
                continue
            pieces = [poly]
            for bj in others:
                nxt = []
                for pc in pieces:
                    nxt += clip_outside(pc, n, d, bi, bj)
                pieces = nxt
                if not pieces:
                    break
            for pc in pieces:
                if poly_area(pc) > 0.5:
                    faces.append((pc, n, d, name, ti))
    return faces


def clip_outside(poly, fn, fd, bi, bj):
    kept, rest = [], poly
    for n, d, _, _ in bj.planes:
        if np.allclose(n, fn, atol=1e-5) and abs(d - fd) < EPS:
            if bj.idx < bi.idx:
                continue            # same-facing coplanar: lower index wins
            return kept + [rest]
        if np.allclose(n, -fn, atol=1e-5) and abs(d + fd) < EPS:
            continue                # touching faces: this one is buried
        r = split(rest, n, d)
        if r[0] == "on":
            return kept + [rest]
        f, b = r
        if f is not None:
            kept.append(f)
        if b is None:
            return kept
        rest = b
    return kept                     # the remainder is inside bj


# ------------------------------------------------------------ voxel world --
class Voxels:
    def __init__(self, brushes, res=16):
        self.res = res
        mins = np.min([b.mins for b in brushes], axis=0) - res
        maxs = np.max([b.maxs for b in brushes], axis=0) + res
        self.org = np.floor(mins / res) * res
        self.dim = (np.ceil((maxs - self.org) / res)).astype(int)
        self.solid = np.zeros(self.dim, bool)
        for b in brushes:
            if b.textures <= {"trigger", "hint"}:
                continue
            lo = np.clip(((b.mins - self.org) / res).astype(int), 0, self.dim - 1)
            hi = np.clip(((b.maxs - self.org) / res).astype(int) + 1, 0, self.dim)
            xs = self.org[0] + (np.arange(lo[0], hi[0]) + 0.5) * res
            ys = self.org[1] + (np.arange(lo[1], hi[1]) + 0.5) * res
            zs = self.org[2] + (np.arange(lo[2], hi[2]) + 0.5) * res
            X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
            inside = np.ones(X.shape, bool)
            for n, d, _, _ in b.planes:
                inside &= (n[0] * X + n[1] * Y + n[2] * Z - d) < 0
            self.solid[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]] |= inside
        self.reach = None

    def idx(self, p):
        return tuple(((np.asarray(p) - self.org) // self.res).astype(int))

    def ok(self, i):
        return all(0 <= i[k] < self.dim[k] for k in range(3))

    def flood(self, start):
        s = self.idx(start)
        if not self.ok(s) or self.solid[s]:
            raise SystemExit(f"flood start {start} is outside the map or in solid")
        reach = np.zeros(self.dim, bool)
        reach[s] = True
        q = deque([s])
        while q:
            x, y, z = q.popleft()
            for dx, dy, dz in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
                n = (x + dx, y + dy, z + dz)
                if not self.ok(n):
                    raise SystemExit(f"LEAK: the playable space reaches the map bounds near {self.org + np.array(n) * self.res}")
                if not reach[n] and not self.solid[n]:
                    reach[n] = True
                    q.append(n)
        self.reach = reach

    def label_sectors(self, door_brushes):
        """Connected open space with the doors closed. -> number of sectors;
        self.sec[x,y,z] = sector id (1-based) or 0 (solid / door / void)."""
        shut = np.zeros(self.dim, bool)
        for b in door_brushes:
            lo = np.clip(((b.mins - self.org) / self.res).astype(int), 0, self.dim - 1)
            hi = np.clip(np.ceil((b.maxs - self.org) / self.res).astype(int), 0, self.dim)
            shut[lo[0]:hi[0], lo[1]:hi[1], lo[2]:hi[2]] = True
        free = self.reach & ~shut
        sec = np.zeros(self.dim, np.int16)
        n = 0
        for s in map(tuple, np.argwhere(free)):
            if sec[s]:
                continue
            n += 1
            sec[s] = n
            q = deque([s])
            while q:
                x, y, z = q.popleft()
                for dx, dy, dz in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
                    m = (x + dx, y + dy, z + dz)
                    if free[m] and not sec[m]:
                        sec[m] = n
                        q.append(m)
        self.sec = sec
        return n

    def sector_at(self, p, n=None):
        """sector at a point; nudged along n (or around) if it lands in solid"""
        tries = [np.zeros(3)] + ([n * k for k in (4, 10, 18)] if n is not None else []) + \
            [np.array(v, float) for v in ((8, 0, 0), (-8, 0, 0), (0, 8, 0), (0, -8, 0), (0, 0, 8), (0, 0, -8))]
        for d in tries:
            i = self.idx(np.asarray(p) + d)
            if self.ok(i) and self.sec[i]:
                return int(self.sec[i])
        return 0

    def is_open(self, p):
        i = self.idx(p)
        return self.ok(i) and bool(self.reach[i])

    def blocked(self, a, b, step=6.0):
        v = b - a
        L = float(np.linalg.norm(v))
        if L < 1:
            return False
        n = int(L / step)
        for k in range(1, n):
            p = a + v * (k / n)
            i = self.idx(p)
            if self.ok(i) and self.solid[i]:
                return True
        return False


# ---------------------------------------------------------------- lighting --
LUXEL = 8                  # lightmap sample spacing in texels (16 units)
LIGHT_SUB = 8              # light samples are stored in 1/8ths of a shade level
LIGHT_HI, LIGHT_LO = 120.0, 44.0   # brightness -> level 0 (full) .. 3 (darkest)


def light_value(p, n, lights, ambient, vox):
    """Brightness at one point (used for the raycaster's per-cell light)."""
    return float(light_points(np.array([p]), n, lights, ambient, vox)[0])


def light_points(P, n, lights, ambient, vox):
    """Vectorised Quake-ish point lighting with voxel shadow rays.
    P: (N,3) sample points; n: surface normal or None (omni)."""
    b = np.full(len(P), float(ambient))
    for lp, lv in lights:
        dv = lp[None, :] - P
        dist = np.linalg.norm(dv, axis=1)
        ndl = np.full(len(P), 0.75) if n is None else (dv @ n) / np.maximum(dist, 1e-3)
        m = (dist < lv) & (dist > 1e-3) & (ndl > 0)
        if not m.any():
            continue
        idx = np.nonzero(m)[0]
        K = max(2, int(dist[idx].max() / 6.0))
        t = (np.arange(1, K) / K)[None, :, None]
        pts = P[idx][:, None, :] + dv[idx][:, None, :] * t          # (M,K-1,3)
        vi = ((pts - vox.org) // vox.res).astype(int)
        inb = np.all((vi >= 0) & (vi < vox.dim), axis=2)
        vi = np.clip(vi, 0, vox.dim - 1)
        hit = vox.solid[vi[..., 0], vi[..., 1], vi[..., 2]] & inb
        clear = ~hit.any(axis=1)
        add = (lv - dist[idx]) * (0.5 + 0.5 * ndl[idx])
        b[idx[clear]] += add[clear]
    return b


def to_levelf(b):
    return np.clip((LIGHT_HI - b) / (LIGHT_HI - LIGHT_LO) * 3.0, 0.0, 3.0)


def to_level(b):
    return int(round(float(to_levelf(np.array([b]))[0])))


def tile_axes(n):
    ax = int(np.argmax(np.abs(n)))
    return [k for k in range(3) if k != ax], ax


def rect_merge(group, maxlen=512):
    """Coplanar faces with the same texture/alignment -> as few convex polys as
    possible: rasterise their union on a 16u grid and greedily cover it with
    rectangles (axis-aligned planes whose outlines sit on that grid); any other
    face is returned as-is. Rectangles are capped at maxcells*16 units."""
    poly0, n, d, name, ti = group[0]
    (a1, a2), ax = tile_axes(n)
    pieces = [f[0] for f in group]
    if abs(n[ax]) < 0.999:
        return pieces
    P = np.array([p for pc in pieces for p in pc])
    coords = P[:, [a1, a2]]
    for grid in (16, 8, 4, 2):          # coarsest grid every outline sits on
        if not np.any(np.abs(coords / grid - np.round(coords / grid)) > 1e-4):
            break
    else:
        return pieces
    maxcells = maxlen // grid
    lo = coords.min(axis=0); hi = coords.max(axis=0)
    W, H = int(round((hi[0] - lo[0]) / grid)), int(round((hi[1] - lo[1]) / grid))
    cu = lo[0] + (np.arange(W) + 0.5) * grid
    cv = lo[1] + (np.arange(H) + 0.5) * grid
    U, V = np.meshgrid(cu, cv, indexing="ij")
    occ = np.zeros((W, H), bool)
    for pc in pieces:
        q = np.array(pc)[:, [a1, a2]]
        area2 = np.sum(q[:, 0] * np.roll(q[:, 1], -1) - np.roll(q[:, 0], -1) * q[:, 1])
        sgn = 1 if area2 > 0 else -1
        inside = np.ones(U.shape, bool)
        for k in range(len(q)):
            x0, y0 = q[k]; x1, y1 = q[(k + 1) % len(q)]
            inside &= ((x1 - x0) * (V - y0) - (y1 - y0) * (U - x0)) * sgn > 0
        occ |= inside
    out = []
    const = d / n[ax]
    for i in range(W):
        for j in range(H):
            if not occ[i, j]:
                continue
            w = 1
            while i + w < W and occ[i + w, j] and w < maxcells:
                w += 1
            h = 1
            while j + h < H and h < maxcells and occ[i:i + w, j + h].all():
                h += 1
            occ[i:i + w, j:j + h] = False
            q = []
            for (u, v) in ((i, j), (i + w, j), (i + w, j + h), (i, j + h)):
                p = np.zeros(3)
                p[a1], p[a2], p[ax] = lo[0] + u * grid, lo[1] + v * grid, const
                q.append(p)
            out.append(orient(q, n))
    return out


class Surface:
    """One cached surface: base texture tiled over the poly's texel bbox with
    a lightmap baked in (Quake's surface cache, built by the cart at load)."""

    def __init__(self, poly, n, d, name, ti, lights, ambient, vox):
        s, so, t, to = tex_axes(n, ti)
        uv = np.array([(float(np.dot(q, s)) + so, float(np.dot(q, t)) + to) for q in poly])
        self.u0 = int(math.floor(uv[:, 0].min() + 1e-6))
        self.v0 = int(math.floor(uv[:, 1].min() + 1e-6))
        self.w = max(1, int(math.ceil(uv[:, 0].max() - 1e-6)) - self.u0)
        self.h = max(1, int(math.ceil(uv[:, 1].max() - 1e-6)) - self.v0)
        self.name, self.s, self.so, self.t, self.to = name, s, so, t, to
        self.turb = name in TURB
        self.sector = 0
        # light samples on a LUXEL grid of texel positions (clamped to the
        # last texel); the cart lerps between them and dithers the fraction
        xs = list(range(0, self.w - 1, LUXEL)) + [self.w - 1]
        ys = list(range(0, self.h - 1, LUXEL)) + [self.h - 1]
        self.lw, self.lh = len(xs), len(ys)
        if name.startswith(FULLBRIGHT) or self.turb:
            self.lights = ""
            return
        LU, LV = np.meshgrid(self.u0 + np.array(xs) + 0.5, self.v0 + np.array(ys) + 0.5)
        M = np.array([s, t, n])
        rhs = np.stack([LU.ravel() - so, LV.ravel() - to, np.full(LU.size, d)], axis=1)
        P = np.linalg.solve(M, rhs.T).T + n * 2
        lvl = to_levelf(light_points(P, n, lights, ambient, vox))
        self.lights = "".join(chr(48 + int(round(x * LIGHT_SUB))) for x in lvl)

    def uv(self, q):
        return float(np.dot(q, self.s)) + self.so - self.u0, float(np.dot(q, self.t)) + self.to - self.v0


# --------------------------------------------------------------------- bsp --
class Poly:
    __slots__ = ("pts", "n", "d", "tex", "surf", "sec")

    def __init__(self, pts, n, d, tex, surf, sec=0):
        self.pts, self.n, self.d, self.tex, self.surf, self.sec = pts, n, d, tex, surf, sec


def classify(poly, n, d):
    ds = [float(np.dot(n, p)) - d for p in poly.pts]
    lo, hi = min(ds), max(ds)
    if lo >= -EPS and hi <= EPS:
        return 0
    if lo >= -EPS:
        return 1
    if hi <= EPS:
        return -1
    return 2


class Node:
    __slots__ = ("n", "d", "polys", "front", "back")


def build_bsp(polys, depth=0):
    if not polys:
        return None
    planes, seen = [], set()
    for p in polys:
        key = (round(p.n[0], 4), round(p.n[1], 4), round(p.n[2], 4), round(p.d, 2))
        if key not in seen:
            seen.add(key); planes.append((p.n, p.d))
    if len(planes) > 48:
        step = len(planes) / 48.0
        planes = [planes[int(k * step)] for k in range(48)]
    # sectors first: while a node still mixes sectors, strongly prefer planes
    # that put different sectors on different sides, so each sector ends up
    # in its own subtree (whose node mask then culls it in one test)
    mixed = len({p.sec for p in polys}) > 1
    best, bestscore = None, None
    for n, d in planes:
        f = b = s = 0
        fs, bs = set(), set()
        for p in polys:
            c = classify(p, n, d)
            if c == 1: f += 1; fs.add(p.sec)
            elif c == -1: b += 1; bs.add(p.sec)
            elif c == 2: s += 1; fs.add(p.sec); bs.add(p.sec)
            else: fs.add(p.sec)
        axial = 1 if np.max(np.abs(n)) > 0.999 else 0
        score = s * 14 + abs(f - b) - axial * 2
        if mixed:
            score += 60 * len(fs & bs) - (200 if fs and bs and not (fs & bs) else 0)
        if bestscore is None or score < bestscore:
            best, bestscore = (n, d), score
    n, d = best
    node = Node(); node.n, node.d = n, d
    node.polys, fl, bl = [], [], []
    for p in polys:
        c = classify(p, n, d)
        if c == 0:
            node.polys.append(p)
        elif c == 1:
            fl.append(p)
        elif c == -1:
            bl.append(p)
        else:
            f, b = split(p.pts, n, d)
            if f is not None and poly_area(f) > 0.05:
                fl.append(Poly(f, p.n, p.d, p.tex, p.surf, p.sec))
            if b is not None and poly_area(b) > 0.05:
                bl.append(Poly(b, p.n, p.d, p.tex, p.surf, p.sec))
    node.front = build_bsp(fl, depth + 1)
    node.back = build_bsp(bl, depth + 1)
    return node


# --------------------------------------------------------------------- pvs --
def compute_pvs(vox, out_pbox, out_nodes, gx0, gy0, GW, GH, rays=2048, step=5.0, margin=16):
    """-> {grid cell index (1-based): (node bits, poly bits, cell bits)} as
    little-endian bit strings. A cell sees a polygon if a 2D ray from one of
    its sample points reaches a 16u column next to the polygon; occluders
    are columns solid from z 8 to 184 (walls, full-height pillars)."""
    res, org = vox.res, vox.org
    iz0 = int((8 - org[2]) // res)
    iz1 = int((184 - org[2]) // res)
    occ = vox.solid[:, :, iz0:iz1 + 1].all(axis=2)
    opn = vox.reach[:, :, iz0:iz1 + 1].any(axis=2) & ~occ
    W, H = occ.shape
    blocked = occ | ~(opn | occ)            # void counts as blocking too
    # polygon footprints: columns within `margin` of the polygon's xy bbox
    f_idx, f_start = [], []
    for lo, hi in out_pbox:
        x0 = max(0, int((lo[0] - margin - org[0]) // res)); x1 = min(W - 1, int((hi[0] + margin - org[0]) // res))
        y0 = max(0, int((lo[1] - margin - org[1]) // res)); y1 = min(H - 1, int((hi[1] + margin - org[1]) // res))
        f_start.append(len(f_idx))
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1), indexing="ij")
        f_idx.extend((xs * H + ys).ravel().tolist())
    f_idx = np.array(f_idx, np.int64); f_start = np.array(f_start, np.int64)
    p0 = np.array([r["p0"] for r in out_nodes]); p1 = np.array([r["p1"] for r in out_nodes])
    # grid cell of every column
    cx = ((org[0] + (np.arange(W) + 0.5) * res) // 64).astype(int) - gx0
    cy = ((org[1] + (np.arange(H) + 0.5) * res) // 64).astype(int) - gy0
    CX, CY = np.meshgrid(cx, cy, indexing="ij")
    col_cell = np.where((CX >= 0) & (CX < GW) & (CY >= 0) & (CY < GH), CY * GW + CX, -1)
    ang = np.arange(rays) * (2 * math.pi / rays)
    dxs, dys = np.cos(ang) * step, np.sin(ang) * step
    nsteps = int(max(W, H) * res * 1.5 / step)

    def fan(px, py, reached):
        x = np.full(rays, px); y = np.full(rays, py)
        dx, dy = dxs.copy(), dys.copy()
        for _ in range(nsteps):
            x += dx; y += dy
            ix = ((x - org[0]) // res).astype(int); iy = ((y - org[1]) // res).astype(int)
            inb = (ix >= 0) & (ix < W) & (iy >= 0) & (iy < H)
            ix, iy = np.where(inb, ix, 0), np.where(inb, iy, 0)
            keep = inb & ~blocked[ix, iy]
            reached[ix[keep], iy[keep]] = True
            if not keep.all():
                if not keep.any():
                    return
                x, y, dx, dy = x[keep], y[keep], dx[keep], dy[keep]

    pvs = {}
    for gy in range(GH):
        for gx in range(GW):
            ci = gy * GW + gx
            cols = np.argwhere(opn & (col_cell == ci))
            if len(cols) == 0:
                continue
            # sample points: the open columns nearest the cell's corners, edge
            # midpoints and centre
            wx = org[0] + (cols[:, 0] + 0.5) * res; wy = org[1] + (cols[:, 1] + 0.5) * res
            bx, by = (gx0 + gx) * 64, (gy0 + gy) * 64
            pts = set()
            for tx, ty in ((bx, by), (bx + 64, by), (bx, by + 64), (bx + 64, by + 64), (bx + 32, by + 32),
                           (bx + 32, by), (bx + 32, by + 64), (bx, by + 32), (bx + 64, by + 32)):
                k = int(np.argmin((wx - tx) ** 2 + (wy - ty) ** 2))
                pts.add((float(wx[k]), float(wy[k])))
            reached = np.zeros((W, H), bool)
            reached[cols[:, 0], cols[:, 1]] = True
            for px_, py_ in pts:
                fan(px_, py_, reached)
            flat = reached.ravel()
            pvis = np.logical_or.reduceat(flat[f_idx], f_start)
            cs = np.concatenate([[0], np.cumsum(pvis)])
            nvis = (cs[p1] - cs[p0]) > 0
            cvis = np.zeros(GW * GH, bool)
            cc = col_cell[reached]
            cvis[cc[cc >= 0]] = True
            pvs[ci + 1] = (nvis, pvis, cvis)
    # conservative: a cell's set also holds its 8 neighbours' sets, so an eye
    # anywhere in the cell (between sample points, grazing past a corner)
    # never loses a sliver
    out = {}
    for c1, v in pvs.items():
        gx, gy = (c1 - 1) % GW, (c1 - 1) // GW
        acc = [a.copy() for a in v]
        for oy in (-1, 0, 1):
            for ox in (-1, 0, 1):
                nb = pvs.get((gy + oy) * GW + gx + ox + 1) if 0 <= gx + ox < GW and 0 <= gy + oy < GH else None
                if nb and (ox or oy):
                    for k in range(3):
                        acc[k] |= nb[k]
        out[c1] = tuple(np.packbits(b.astype(np.uint8), bitorder="little").tobytes() for b in acc)
    return out


# ------------------------------------------------------------------ output --
def fmt(v):
    r = round(v * 8) / 8
    return str(int(r)) if r == int(r) else ("%g" % r)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "carts", "fps-render-lab.map")
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "carts", "fps-render-lab.p64", "level.lua")
    ents = parse_map(src)
    world = ents[0]
    brushes, door_ents = [], []
    for e in ents:
        if e["props"].get("classname") == "func_door":
            for bf in e["brushes"]:
                door_ents.append((e["props"], Brush(bf, -1)))
            continue
        for bf in e["brushes"]:
            brushes.append(Brush(bf, len(brushes)))
    ambient = float(world["props"].get("_ambient", 20))
    fog = float(world["props"].get("_fog", 400))
    print(f"parsed {len(brushes)} brushes, {len(ents) - 1} entities")

    faces = csg(brushes)
    print(f"csg: {len(faces)} faces")

    vox = Voxels(brushes)
    things = []
    lights = []
    start = None
    for e in ents[1:]:
        pr = e["props"]
        if "origin" not in pr:
            continue
        o = np.array([float(v) for v in pr["origin"].split()])
        cls = pr.get("classname", "")
        if cls == "info_player_start":
            start = o
        if cls == "light":
            lights.append((o, float(pr.get("light", 300))))
            continue
        if cls == "prop_torch":
            lights.append((o + np.array([0, 0, 56]), float(pr.get("light", 220))))
        things.append((cls, o, float(pr.get("angle", 0))))
    if start is None:
        raise SystemExit("no info_player_start")
    vox.flood(start + np.array([0, 0, 8]))
    faces = [f for f in faces if vox.is_open(centroid(f[0]) + f[1] * 6)]
    print(f"outside fill: {len(faces)} faces face the playable space")
    nsec = vox.label_sectors([b for _, b in door_ents])
    if nsec > 62:
        raise SystemExit(f"{nsec} sectors: the cart's sector bitmasks hold at most 62")
    print(f"sectors: {nsec} (with {len(door_ents)} doors shut)")

    groups = {}
    for f in faces:
        poly, n, d, name, ti = f
        key = (tuple(np.round(n, 4)), round(d, 2), name,
               tuple(np.round(np.asarray(x, float), 4).tolist() if isinstance(x, np.ndarray) else x for x in ti))
        groups.setdefault(key, []).append(f)
    polys, surfs = [], []
    for g in groups.values():
        poly, n, d, name, ti = g[0]
        for pc in rect_merge(g):
            sf = Surface(pc, n, d, name, ti, lights, ambient, vox)
            sf.sector = vox.sector_at(centroid(pc) + n * 2, n)
            surfs.append(sf)
            polys.append(Poly(pc, n, d, name, len(surfs) - 1, sf.sector))
    texels = sum(sf.w * sf.h for sf in surfs)
    print(f"surfaces: {len(polys)} merged polygons, {texels} cached texels, {sum(sf.lw * sf.lh for sf in surfs)} luxels")

    root = build_bsp(polys)

    # ---- flatten the tree + dedupe vertices
    verts, vmap = [], {}

    def vid(p):
        key = (round(p[0] * 16), round(p[1] * 16), round(p[2] * 16))
        if key not in vmap:
            vmap[key] = len(verts)
            verts.append(p)
        return vmap[key] + 1

    out_polys, out_nodes, out_pbox = [], [], []
    tex_ids = {t: i for i, t in enumerate(TEXTURES)}
    missing = set()

    def emit(node):
        if node is None:
            return 0
        me = len(out_nodes) + 1
        rec = {"poly": [], "p0": len(out_polys)}
        out_nodes.append(rec)
        mins, maxs = np.full(3, 1e9), np.full(3, -1e9)
        mask = 0
        # the cart's batch prepass assumes quads: pad triangles (repeat the
        # last vertex), fan bigger convex polygons into quads
        pieces = []
        for p in node.polys:
            n = len(p.pts)
            if n <= 4:
                pieces.append((p, p.pts + [p.pts[-1]] * (4 - n)))
            else:
                k = 1
                while k < n - 1:
                    q = [p.pts[0]] + p.pts[k:k + 3]
                    pieces.append((p, q + [q[-1]] * (4 - len(q))))
                    k += 2
        for p, pts in pieces:
            sf = surfs[p.surf]
            if p.tex not in tex_ids:
                missing.add(p.tex)
            c = centroid(pts)
            same = 1 if np.dot(p.n, node.n) > 0 else 0
            rec["poly"].append(len(out_polys) + 1)
            vs = []
            for q in pts:
                u, v = sf.uv(q)
                if sf.turb:          # absolute texel coords: the cart wraps the 32x32 texture
                    vs.append((vid(q), u + sf.u0 % TEX_PX, v + sf.v0 % TEX_PX))
                else:
                    vs.append((vid(q), min(max(u, 0.02), sf.w - 0.02), min(max(v, 0.02), sf.h - 0.02)))
            # sector 0 (e.g. a door frame face looking into the door slot): always drawn
            mask |= (1 << (sf.sector - 1)) if sf.sector else -1
            out_polys.append((p.surf + 1, same, c, vs))
            P = np.array(pts)
            out_pbox.append((P.min(axis=0), P.max(axis=0)))
            mins = np.minimum(mins, P.min(axis=0)); maxs = np.maximum(maxs, P.max(axis=0))
        rec["n"], rec["d"] = node.n, node.d
        rec["front"] = emit(node.front)
        rec["back"] = emit(node.back)
        for ch in (rec["front"], rec["back"]):
            if ch:
                cm, cx = out_nodes[ch - 1]["mins"], out_nodes[ch - 1]["maxs"]
                mins = np.minimum(mins, cm); maxs = np.maximum(maxs, cx)
                mask |= out_nodes[ch - 1]["mask"]
        rec["mins"], rec["maxs"], rec["mask"] = mins, maxs, mask
        rec["p1"] = len(out_polys)          # subtree polys = out_polys[p0:p1] (pre-order)
        return me
    emit(root)
    if missing:
        print(f"WARNING: unknown textures (drawn as '{TEXTURES[0]}'): {sorted(missing)}")

    # ---- raycaster grid from the brushes, sliced at eye height
    open_pts = np.argwhere(vox.reach)
    wmin = vox.org + open_pts.min(axis=0) * vox.res
    wmax = vox.org + (open_pts.max(axis=0) + 1) * vox.res
    gx0, gy0 = int(math.floor(wmin[0] / 64) - 1), int(math.floor(wmin[1] / 64) - 1)
    gx1, gy1 = int(math.ceil(wmax[0] / 64) + 1), int(math.ceil(wmax[1] / 64) + 1)
    GW, GH = gx1 - gx0, gy1 - gy0
    band = np.arange(EYE_BAND[0], EYE_BAND[1] + 1, 8, dtype=float)

    def solid_at(x, y, z):
        p = np.array([x, y, z])
        for b in brushes:
            if b.textures <= {"trigger", "hint", "sky"}:
                continue
            if np.all(b.mins - 1 <= p) and np.all(p <= b.maxs + 1) and b.contains(p, eps=0):
                return b
        return None

    def side_tex(x, y, want):
        b = solid_at(x, y, 46)
        if b is None:
            return tex_ids["stone"]
        best, bt = -2, "stone"
        for n, d, name, _ in b.planes:
            dp = float(np.dot(n, want))
            if dp > best:
                best, bt = dp, name
        return tex_ids.get(bt, 0)

    def face_tex_z(x, y, z0, dz, want):
        """march from z0 in steps of dz until inside a brush; its face nearest `want`"""
        z = z0
        for _ in range(40):
            b = solid_at(x, y, z)
            if b is not None:
                best, bt = -2, "stone"
                for n, d, name, _ in b.planes:
                    dp = float(np.dot(n, want))
                    if dp > best:
                        best, bt = dp, name
                return tex_ids.get(bt, 0)
            z += dz
        return tex_ids["sky"] if dz > 0 else tex_ids["stone"]

    # ---- doors: closed panel box, slide direction/travel, the sectors it joins
    doors, door_cell = [], {}
    for props, b in door_ents:
        ang = math.radians(float(props.get("angle", 0)))
        sd = np.array([round(math.cos(ang)), round(math.sin(ang)), 0.0])
        size = b.maxs - b.mins
        travel = float(abs(np.dot(size, sd)))
        ax = np.array([abs(sd[1]), abs(sd[0]), 0.0])          # tunnel axis (through the panel)
        c = (b.mins + b.maxs) / 2
        mid = np.array([c[0], c[1], b.mins[2] + 40])
        sa = vox.sector_at(mid - ax * (size @ ax / 2 + 12))
        sb = vox.sector_at(mid + ax * (size @ ax / 2 + 12))
        if not sa or not sb or sa == sb:
            print(f"WARNING: door at {c} joins sectors {sa} and {sb}")
        gxc, gyc = int(math.floor(c[0] / 64)) - gx0, int(math.floor(c[1] / 64)) - gy0
        tex = min(b.textures, key=lambda t: t != "door")
        doors.append((b.mins, b.maxs, sd, travel, tex_ids.get(tex, 0), sa, sb, gyc * GW + gxc + 1))
        door_cell[(gxc, gyc)] = len(doors)

    cells, cell_tex, cell_light, floor_tex, ceil_tex, cell_sec = [], [], [], [], [], []
    for gy in range(GH):
        for gx in range(GW):
            cx, cy = (gx0 + gx) * 64 + 32, (gy0 + gy) * 64 + 32
            solid = all(solid_at(cx, cy, z) is not None for z in band)
            cells.append(1 if solid else (2 if (gx, gy) in door_cell else 0))
            cell_sec.append(0 if solid else vox.sector_at(np.array([cx, cy, 48.0])))
            if solid:
                cell_tex.append([side_tex(cx + 30, cy, np.array([1, 0, 0])), side_tex(cx - 30, cy, np.array([-1, 0, 0])),
                                 side_tex(cx, cy + 30, np.array([0, 1, 0])), side_tex(cx, cy - 30, np.array([0, -1, 0]))])
                cell_light.append(3)
                floor_tex.append(-1); ceil_tex.append(-1)
            else:
                cell_tex.append(None)
                floor_tex.append(face_tex_z(cx, cy, -1, -8, np.array([0, 0, 1])))
                ceil_tex.append(face_tex_z(cx, cy, 129, 8, np.array([0, 0, -1])))
                b = light_value(np.array([cx, cy, 48.0]), None, lights, ambient, vox)
                cell_light.append(to_level(b))

    # ---- collision boxes: brushes that touch the playable space
    rmin, rmax = wmin - 64, wmax + 64
    boxes = []
    for b in brushes:
        if b.textures <= {"trigger", "hint"}:
            continue
        if np.all(b.mins <= rmax) and np.all(b.maxs >= rmin):
            lo, hi = np.maximum(b.mins, rmin - 64), np.minimum(b.maxs, rmax + 64)
            boxes.append((lo, hi))

    # ---- potentially visible sets
    import time
    t0 = time.time()
    pvs = compute_pvs(vox, out_pbox, out_nodes, gx0, gy0, GW, GH)
    npv = [sum(bin(b).count("1") for b in v[1]) for v in pvs.values()]
    print(f"pvs: {len(pvs)} cells, avg {sum(npv) / max(1, len(npv)):.0f} / {len(out_polys)} polys visible per cell "
          f"({time.time() - t0:.0f}s)")

    # ---- write lua
    L = []
    L.append("--[[pod_format=\"raw\"]]")
    L.append("-- GENERATED by tools/fps-lab/map2bsp.py from carts/fps-render-lab.map - do not edit.")
    L.append("LEVEL={")
    L.append("textures={%s}," % ",".join('"%s"' % t for t in TEXTURES))
    L.append("fog=%s," % fmt(fog))
    L.append("verts={%s}," % ",".join("%s,%s,%s" % (fmt(v[0]), fmt(v[1]), fmt(v[2])) for v in verts))
    pl = []
    for sid, same, c, vs in out_polys:
        flat = ",".join("%d,%s,%s" % (i, fmt(u), fmt(v)) for i, u, v in vs)
        pl.append("{%d,%d,%s,%s,%s,%s}" % (sid, same, fmt(c[0]), fmt(c[1]), fmt(c[2]), flat))
    L.append("polys={\n%s}," % ",\n".join(pl))
    # surfaces: texture, texel origin (for tiling phase), size, lightmap
    sl = []
    for sf in surfs:
        sl.append('{%d,%d,%d,%d,%d,%d,%d,"%s",%d,%d}' % (tex_ids.get(sf.name, 0), sf.u0 % TEX_PX, sf.v0 % TEX_PX,
                                                         sf.w, sf.h, sf.lw, sf.lh, sf.lights,
                                                         1 if sf.turb else 0, sf.sector))
    L.append("luxel=%d,lsub=%d," % (LUXEL, LIGHT_SUB))
    L.append("surfs={\n%s}," % ",\n".join(sl))
    nl = []
    for r in out_nodes:
        n = r["n"]
        nl.append("{%s,%s,%s,%s,%d,%d,{%s},%s,%s,%s,%s,%s,%s,%d}" % (
            fmt(round(n[0], 6)) if abs(n[0]) in (0, 1) else "%.6f" % n[0],
            fmt(round(n[1], 6)) if abs(n[1]) in (0, 1) else "%.6f" % n[1],
            fmt(round(n[2], 6)) if abs(n[2]) in (0, 1) else "%.6f" % n[2],
            "%.3f" % r["d"], r["front"], r["back"], ",".join(str(i) for i in r["poly"]),
            fmt(r["mins"][0]), fmt(r["mins"][1]), fmt(r["mins"][2]),
            fmt(r["maxs"][0]), fmt(r["maxs"][1]), fmt(r["maxs"][2]), r["mask"]))
    L.append("nodes={\n%s}," % ",\n".join(nl))
    L.append("grid={w=%d,h=%d,x0=%d,y0=%d,cells={%s},tex={%s},light={%s},floor={%s},ceil={%s},sec={%s}}," % (
        GW, GH, gx0 * 64, gy0 * 64, ",".join(map(str, cells)),
        ",".join("{%d,%d,%d,%d}" % tuple(t) if t else "false" for t in cell_tex),
        ",".join(map(str, cell_light)), ",".join(map(str, floor_tex)), ",".join(map(str, ceil_tex)),
        ",".join(map(str, cell_sec))))
    # doors: closed box, slide dir x/y, travel, texture, sectors a/b, grid cell index
    L.append("sectors=%d," % nsec)
    L.append("doors={%s}," % ",".join("{%s,%s,%s,%s,%s,%s,%d,%d,%s,%d,%d,%d,%d}" % (
        fmt(lo[0]), fmt(lo[1]), fmt(lo[2]), fmt(hi[0]), fmt(hi[1]), fmt(hi[2]), int(sd[0]), int(sd[1]),
        fmt(tr), tx, sa, sb, ci) for lo, hi, sd, tr, tx, sa, sb, ci in doors))
    L.append("boxes={%s}," % ",".join("%s,%s,%s,%s,%s,%s" % (fmt(lo[0]), fmt(lo[1]), fmt(lo[2]), fmt(hi[0]), fmt(hi[1]), fmt(hi[2])) for lo, hi in boxes))
    tl = []
    for cls, o, ang in things:
        tl.append('{"%s",%s,%s,%s,%s}' % (cls, fmt(o[0]), fmt(o[1]), fmt(o[2]), fmt(ang)))
    L.append("things={%s}," % ",".join(tl))
    # pvs[cell] = {node bits, poly bits, cell bits} as hex (little-endian bits)
    L.append("pvs={\n%s}," % ",\n".join('[%d]={"%s","%s","%s"}' % (ci, a.hex(), b.hex(), c.hex())
                                          for ci, (a, b, c) in sorted(pvs.items())))
    L.append("}")
    with open(dst, "w") as f:
        f.write("\n".join(L) + "\n")

    depth = [0]

    def dep(nd, k=1):
        if nd is None:
            return
        depth[0] = max(depth[0], k); dep(nd.front, k + 1); dep(nd.back, k + 1)
    dep(root)
    walls = sum(cells)
    print(f"bsp: {len(out_nodes)} nodes, {len(out_polys)} polys, {len(verts)} verts, depth {depth[0]}")
    print(f"raycast grid: {GW}x{GH} ({walls} wall cells), {len(boxes)} collision boxes, {len(things)} things, {len(lights)} lights")
    print(f"wrote {os.path.relpath(dst)} ({os.path.getsize(dst)} bytes)")


if __name__ == "__main__":
    main()
