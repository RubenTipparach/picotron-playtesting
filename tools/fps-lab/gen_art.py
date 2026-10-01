#!/usr/bin/env python3
"""
gen_art.py - procedural art for the FPS Render Lab cart, in TWO palettes.

    python3 tools/fps-lab/gen_art.py [--sheet out.png]

Every texture/sprite is designed once in a "virtual palette": the 16 PICO-8
colours plus any in-between colour a smooth ramp or shading needs (colour
ramps interpolate instead of snapping, ellipses/cylinders shade smoothly).
The design is then quantised (ordered dither on the in-between colours) into
two art sets for palette experiments (G in game switches):

  sprites/<category>/NNN_name.png           Picotron's default 32 colours
  sprites/pal64/<category>/NNN+64_name.png  the custom 64-colour palette
                                            (sprites/pal64/palette.hex)

The leading NNN is the sprite index (tools/picotron/png2gfx.lua bakes them
into gfx/0.gfx at build time, fitting each folder to its palette.hex). World
textures of the default set are also copied to
tools/fps-lab/trenchbroom/textures/fpslab/ so TrenchBroom shows them.

Seeded, deterministic. Once a PNG has been hand-edited treat the PNG as the
source of truth and don't re-run this over it.

Shading is NOT baked into these: at runtime the cart builds shaded copies
(index + 64*k) and colour tables mapping each colour to its nearest darker
palette colour. Black (colour 0) is transparent for sprites; textures never
use it.
"""
from bisect import bisect_right
import math
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
CART = os.path.join(ROOT, "carts", "fps-render-lab.p64")
TB_TEX = os.path.join(HERE, "trenchbroom", "textures", "fpslab")

PAL = [(0, 0, 0), (29, 43, 83), (126, 37, 83), (0, 135, 81), (171, 82, 54), (95, 87, 79),
       (194, 195, 199), (255, 241, 232), (255, 0, 77), (255, 163, 0), (255, 236, 39),
       (0, 228, 54), (41, 173, 255), (131, 118, 156), (255, 119, 168), (255, 204, 170)]
RAMP = [1.0, 0.66, 0.42, 0.22]          # must match SHADE in gfx.lua


def _hexpal(v):
    return [((c >> 16) & 255, (c >> 8) & 255, c & 255) for c in v]


# Picotron's default display palette (colours 0..31)
PAL32 = _hexpal([0x000000, 0x1d2b53, 0x7e2553, 0x008751, 0xab5236, 0x5f574f, 0xc2c3c7, 0xfff1e8,
                 0xff004d, 0xffa300, 0xffec27, 0x00e436, 0x29adff, 0x83769c, 0xff77a8, 0xffccaa,
                 0x2463b0, 0x00a5a1, 0x654688, 0x125359, 0x703233, 0x432932, 0xa28879, 0xffacc5,
                 0xb9003e, 0xe26b13, 0x95f04b, 0x00b251, 0x64dff6, 0xbd9adf, 0xe40dab, 0xf49671])
# the custom 64-colour palette (keep in sync with PALETTES in gfx.lua)
PAL64 = _hexpal([0x000000, 0x12173d, 0x293268, 0x464b8c, 0x6b74b2, 0x909edd, 0xc1d9f2, 0xffffff,
                 0xa293c4, 0x7b6aa5, 0x53427f, 0x3c2c68, 0x431e66, 0x5d2f8c, 0x854cbf, 0xb483ef,
                 0x8cff9b, 0x42bc7f, 0x22896e, 0x14665b, 0x0f4a4c, 0x0a2a33, 0x1d1a59, 0x322d89,
                 0x354ab2, 0x3e83d1, 0x50b9eb, 0x8cdaff, 0x53a1ad, 0x3b768f, 0x21526b, 0x163755,
                 0x008782, 0x00aaa5, 0x27d3cb, 0x78fae6, 0xcdc599, 0x988f64, 0x5c5d41, 0x353f23,
                 0x919b45, 0xafd370, 0xffe091, 0xffaa6e, 0xff695a, 0xb23c40, 0xff6675, 0xdd3745,
                 0xa52639, 0x721c2f, 0xb22e69, 0xe54286, 0xff6eaf, 0xffa5d5, 0xffd3ad, 0xcc817a,
                 0x895654, 0x61393b, 0x3f1f3c, 0x723352, 0x994c69, 0xc37289, 0xf29faa, 0xffccd0])
SETS = [("", 0, PAL32), ("pal64", 64, PAL64)]   # (sub folder, sprite index offset, palette)

# ------------------------------------------------------- virtual palette ----
# design images hold indices into VP: 0..15 are the PICO-8 colours (flat
# design colours), everything after is an in-between colour made by ramps
# and shading. 0 stays "transparent black".
VP = [tuple(c) for c in PAL]
VP_IDX = {c: i for i, c in enumerate(VP)}


def vp(rgb):
    rgb = tuple(int(round(min(255, max(0, v)))) for v in rgb)
    if rgb == (0, 0, 0):
        rgb = (1, 1, 1)                   # never alias transparent black
    i = VP_IDX.get(rgb)
    if i is None:
        i = VP_IDX[rgb] = len(VP)
        VP.append(rgb)
    return i


def vp_mix(a, b, t):
    if t <= 0 or a == b:
        return a
    if t >= 1:
        return b
    ca, cb = VP[a], VP[b]
    return vp([ca[k] + (cb[k] - ca[k]) * t for k in range(3)])


def vp_scale(a, f):
    return a if a == 0 else vp([v * f for v in VP[a]])


IMG = np.uint16                           # design image dtype (VP indices)

# keep this order in sync with TEXTURES in map2bsp.py
# (list index == sprite index; "_" entries are slots other sprites use)
TEXTURES = ["stone", "brick", "metal", "wood_wall", "stone_moss", "floor_stone",
            "floor_tile", "floor_metal", "cobble", "floor_wood", "ceil_wood",
            "ceil_panel", "sky", "slime", "trim", "step", "pillar",
            "_crate_face", "_barrel_side", "_barrel_top", "door", "hazard"]

rng = np.random.default_rng(1337)


def noise(w, h, scale=4, octaves=3, seed=0):
    """Tileable value noise in 0..1."""
    r = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = scale * (2 ** o)
        g = r.random((s, s))
        ys = np.arange(h) * s / h
        xs = np.arange(w) * s / w
        y0 = np.floor(ys).astype(int); x0 = np.floor(xs).astype(int)
        fy = (ys - y0)[:, None]; fx = (xs - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        a = g[y0 % s][:, x0 % s]; b = g[y0 % s][:, (x0 + 1) % s]
        c = g[(y0 + 1) % s][:, x0 % s]; d = g[(y0 + 1) % s][:, (x0 + 1) % s]
        out += amp * ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy)
        tot += amp; amp *= 0.5
    return out / tot


def ramp(values, cols, cuts):
    """values 0..1 -> colour along the ramp cols (len(cuts) == len(cols)-1).
    Each colour owns the band between its cuts; values between two band
    centres blend smoothly (8 steps), so the quantiser can use every palette
    colour in between."""
    e = [cuts[0] - 0.12] + list(cuts) + [cuts[-1] + 0.12]
    cen = [(e[i] + e[i + 1]) / 2 for i in range(len(cols))]
    v = np.asarray(values, float)
    out = np.empty(v.shape, IMG)
    o, flat = out.reshape(-1), v.reshape(-1)
    for k, x in enumerate(flat):
        if x <= cen[0]:
            o[k] = cols[0]
        elif x >= cen[-1]:
            o[k] = cols[-1]
        else:
            i = bisect_right(cen, x) - 1
            t = round((x - cen[i]) / (cen[i + 1] - cen[i]) * 8) / 8
            o[k] = vp_mix(cols[i], cols[i + 1], t)
    return out


def dither(v, levels):
    b = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5
    h, w = v.shape
    t = np.tile(b, (h // 4 + 1, w // 4 + 1))[:h, :w]
    return np.clip(v + t / levels, 0, 1)


# ------------------------------------------------------------ textures ----
def blocks(w, h, rows, offset, mortar, face_cols, cuts, seed, bevel=True):
    img = np.zeros((h, w), IMG)
    n = noise(w, h, 4, 3, seed)
    rh = h // rows
    for r in range(rows):
        cols_in_row = 2
        bw = w // cols_in_row
        off = (r % 2) * offset
        for c in range(cols_in_row + 1):
            x0 = c * bw - off
            shade = rng.random() * 0.25 - 0.12
            for y in range(r * rh, (r + 1) * rh):
                for x in range(x0, x0 + bw):
                    xx = x % w
                    v = n[y, xx] + shade
                    edge_top = y == r * rh
                    edge_left = x == x0
                    if edge_top or edge_left:
                        img[y, xx] = mortar
                        continue
                    if bevel and (y == r * rh + 1 or x == x0 + 1):
                        v += 0.25
                    if bevel and (y == (r + 1) * rh - 1 or x == x0 + bw - 1):
                        v -= 0.2
                    img[y, xx] = ramp(np.array([v]), face_cols, cuts)[0]
    return img


def tex_stone():
    return blocks(32, 32, 4, 8, 1, [1, 5, 13, 6], [0.3, 0.52, 0.72], 1)


def tex_brick():
    img = np.zeros((32, 32), IMG)
    n = dither(noise(32, 32, 8, 2, 2), 3)
    for y in range(32):
        row = y // 8
        for x in range(32):
            xo = (x + (row % 2) * 8) % 16
            if y % 8 == 0 or xo == 0:
                img[y, x] = 5
            else:
                v = n[y, x] + (0.2 if y % 8 == 1 else 0) - (0.2 if y % 8 == 7 else 0)
                img[y, x] = ramp(np.array([v]), [2, 4, 4, 9], [0.28, 0.6, 0.86])[0]
    return img


def tex_metal():
    n = dither(noise(32, 32, 2, 3, 3), 4)
    img = ramp(n, [1, 5, 13, 6], [0.25, 0.55, 0.8])
    img[:, 0] = 1; img[0, :] = 1; img[:, 15] = 5; img[15, :] = 5
    img[1, :] = 6; img[:, 1] = 6; img[16, :] = 13; img[:, 16] = 13
    for (x, y) in [(3, 3), (12, 3), (3, 12), (12, 12), (19, 3), (28, 3), (19, 12), (28, 12),
                   (3, 19), (12, 19), (3, 28), (12, 28), (19, 19), (28, 19), (19, 28), (28, 28)]:
        img[y, x] = 7; img[y + 1, x] = 1
    return img


def tex_wood_wall():
    img = np.zeros((32, 32), IMG)
    grain = noise(32, 32, 2, 3, 4)
    for x in range(32):
        plank = x // 8
        for y in range(32):
            v = grain[y, (x * 3) % 32] * 0.6 + 0.4 * ((math.sin(y * 0.9 + plank * 2 + x * 0.3) + 1) / 2)
            v += [0.05, -0.08, 0.1, -0.02][plank]
            img[y, x] = ramp(np.array([v]), [2, 4, 4, 9], [0.3, 0.55, 0.85])[0]
        if x % 8 == 0:
            img[:, x] = 2
    for plank in range(4):
        y = (plank * 11 + 5) % 32
        img[y, plank * 8 + 3] = 1; img[y, plank * 8 + 4] = 5
    return img


def tex_stone_moss():
    img = tex_stone()
    m = noise(32, 32, 4, 3, 5)
    grad = np.linspace(0.35, -0.15, 32)[:, None]
    mask = (m + grad) > 0.62
    img[mask & (img != 1)] = 3
    img[((m + grad) > 0.75) & (img != 1)] = 11
    return img


def tex_floor_stone():
    return blocks(32, 32, 2, 16, 1, [5, 5, 13, 6], [0.3, 0.6, 0.85], 6)


def tex_floor_tile():
    img = np.zeros((32, 32), IMG)
    n = dither(noise(32, 32, 4, 2, 7), 4)
    for y in range(32):
        for x in range(32):
            chk = ((x // 16) + (y // 16)) % 2
            if x % 16 == 0 or y % 16 == 0:
                img[y, x] = 1
            elif chk:
                img[y, x] = ramp(np.array([n[y, x]]), [2, 2, 8], [0.3, 0.8])[0]
            else:
                img[y, x] = ramp(np.array([n[y, x]]), [5, 13, 6], [0.4, 0.85])[0]
    return img


def tex_floor_metal():
    img = np.full((32, 32), 5, IMG)
    for y in range(32):
        for x in range(32):
            a = (x + y) % 8; b = (x - y) % 8
            if (a == 0 and (y // 4) % 2 == 0) or (b == 0 and (y // 4) % 2 == 1):
                img[y, x] = 6
            elif a == 1 or b == 1:
                img[y, x] = 13
    img[0, :] = 1; img[:, 0] = 1; img[31, :] = 13; img[:, 31] = 13
    return img


def tex_cobble():
    img = np.full((32, 32), 1, IMG)
    pts = [(4, 4), (13, 3), (23, 5), (29, 13), (8, 12), (18, 13), (4, 21), (13, 22), (23, 21), (29, 28), (8, 29), (19, 29)]
    for y in range(32):
        for x in range(32):
            ds = sorted(((min(abs(x - px), 32 - abs(x - px))) ** 2 + (min(abs(y - py), 32 - abs(y - py))) ** 2, i)
                        for i, (px, py) in enumerate(pts))
            (d0, i0), (d1, _) = ds[0], ds[1]
            edge = math.sqrt(d1) - math.sqrt(d0)
            if edge < 1.2:
                img[y, x] = 1
            else:
                px, py = pts[i0]
                light = ((px - x) + (py - y)) * 0.06 + (i0 % 3) * 0.1
                img[y, x] = ramp(np.array([0.5 + light]), [5, 13, 4, 6], [0.4, 0.62, 0.8])[0]
    return img


def tex_floor_wood():
    img = np.zeros((32, 32), IMG)
    grain = noise(32, 32, 2, 3, 9)
    for y in range(32):
        plank = y // 8
        for x in range(32):
            v = 0.55 * grain[(y * 3) % 32, x] + 0.45 * ((math.sin(x * 0.7 + plank * 1.7) + 1) / 2)
            img[y, x] = ramp(np.array([v]), [2, 4, 9], [0.33, 0.78])[0]
        if y % 8 == 0:
            img[y, :] = 2
    for plank in range(4):
        x = (plank * 13 + 6) % 32
        img[plank * 8 + 1:plank * 8 + 8, x] = 2
    return img


def tex_ceil_wood():
    """Dark planks with a heavy cross beam every 32 texels."""
    img = np.zeros((32, 32), IMG)
    grain = noise(32, 32, 2, 3, 10)
    for y in range(32):
        for x in range(32):
            v = 0.5 * grain[(y * 3) % 32, x] + 0.25 * ((math.sin(x * 0.8 + (y // 8) * 2.1) + 1) / 2)
            img[y, x] = ramp(np.array([v]), [1, 2, 4], [0.3, 0.62])[0]
        if y % 8 == 0:
            img[y, :] = 1
    img[:, 12:20] = np.where(grain[:, 12:20] > 0.5, 4, 2)   # beam
    img[:, 12] = 9; img[:, 19] = 1
    return img


def tex_ceil_panel():
    n = dither(noise(32, 32, 2, 2, 11), 4)
    img = ramp(n, [1, 5, 13], [0.35, 0.8])
    img[0, :] = 1; img[:, 0] = 1
    img[1, 1:] = 13; img[1:, 1] = 13
    img[12:20, 10:22] = 6
    img[13:19, 11:21] = 7
    img[12, 10:22] = 5; img[19, 10:22] = 5
    return img


def tex_sky():
    """tileable clouds: it scrolls, so no gradient that would show a seam"""
    n = noise(32, 32, 2, 4, 12)
    v = np.clip((n - 0.5) * 1.6 + 0.5, 0, 1)
    return ramp(dither(v, 6), [1, 12, 12, 6, 7], [0.3, 0.5, 0.66, 0.8])


def tex_slime():
    n = noise(32, 32, 4, 3, 13)
    v = np.abs(np.sin(n * 9.0))
    return ramp(dither(v, 4), [3, 3, 11, 10], [0.3, 0.7, 0.93])


def tex_trim():
    img = np.zeros((32, 32), IMG)
    n = noise(32, 32, 2, 3, 14)
    for y in range(32):
        for x in range(32):
            v = 0.6 * n[y, (x * 2) % 32] + 0.4 * ((math.sin(x * 0.5) + 1) / 2)
            img[y, x] = ramp(np.array([v]), [2, 4, 4], [0.35, 0.7])[0]
    img[0, :] = 9; img[1, :] = 4; img[31, :] = 1; img[30, :] = 2
    img[:, 0] = 1
    return img


def tex_step():
    img = tex_floor_metal()
    for y in range(0, 6):
        for x in range(32):
            img[y, x] = 10 if ((x + y) // 4) % 2 == 0 else 1
    return img


def tex_pillar():
    img = np.zeros((32, 32), IMG)
    n = noise(32, 32, 4, 2, 15)
    for x in range(32):
        f = math.cos((x % 8) / 8 * 2 * math.pi)
        for y in range(32):
            v = 0.5 + 0.35 * f + (n[y, x] - 0.5) * 0.4
            img[y, x] = ramp(np.array([v]), [5, 13, 6, 7], [0.3, 0.55, 0.88])[0]
    return img


def tex_door():
    """Sliding airlock panel: riveted plates, a lit window strip, hazard foot."""
    n = noise(32, 32, 4, 2, 21)
    img = ramp(n * 0.5 + 0.35, [5, 13, 6], [0.45, 0.72])
    img[:, 0] = 1; img[:, 31] = 5; img[:, 15] = 1; img[:, 16] = 6
    for y in (0, 10, 21):
        img[y, :] = 1
        img[y + 1, :] = 6
    for y in (3, 13, 24):
        for x in (3, 12, 19, 28):
            img[y, x] = 7
            img[y + 1, x] = 1
    img[5:9, 5:27] = 1
    img[6:8, 6:26] = 12
    img[6, 6:26] = 7
    img[28:32, :] = np.where((np.arange(32)[None, :] + np.arange(4)[:, None]) // 4 % 2 == 0, 10, 1)
    return img


def tex_hazard():
    """Door frame / airlock trim: diagonal yellow-black stripes, bevelled."""
    img = np.zeros((32, 32), IMG)
    for y in range(32):
        for x in range(32):
            img[y, x] = 10 if ((x + y) // 8) % 2 == 0 else 5
    img[0, :] = 6; img[1, :] = 9
    img[31, :] = 1; img[30, :] = 4
    return img


def tex_crate():
    img = np.zeros((32, 32), IMG)
    n = noise(32, 32, 2, 3, 16)
    for y in range(32):
        for x in range(32):
            v = 0.5 * n[y, x] + 0.5 * ((math.sin(y * 0.6) + 1) / 2)
            img[y, x] = ramp(np.array([v]), [4, 4, 9], [0.4, 0.8])[0]
    img[0:3, :] = 2; img[29:32, :] = 2; img[:, 0:3] = 2; img[:, 29:32] = 2
    img[1, :] = 9; img[:, 1] = 9
    for k in range(32):
        for d in (-1, 0, 1):
            x = k + d
            if 2 < k < 29 and 0 <= x < 32:
                img[k, x] = 2 if d else 9
    for (x, y) in [(1, 1), (30, 1), (1, 30), (30, 30)]:
        img[y, x] = 6
    return img


def tex_barrel_side():
    img = np.zeros((32, 32), IMG)
    n = noise(32, 32, 2, 2, 17)
    for y in range(32):
        for x in range(32):
            v = 0.3 + 0.4 * n[y, x]
            img[y, x] = ramp(np.array([v]), [1, 3, 3, 11], [0.3, 0.45, 0.62])[0]
    for y in (3, 4, 27, 28):
        img[y, :] = 5
    img[3, :] = 6; img[27, :] = 6
    img[12:20, 6:26] = 10
    img[13:19, 8:24] = 9
    img[15:17, 10:22] = 1
    return img


def tex_barrel_top():
    img = np.full((32, 32), 5, IMG)
    for y in range(32):
        for x in range(32):
            r = math.hypot(x - 15.5, y - 15.5)
            if r > 14:
                img[y, x] = 6
            elif r > 12:
                img[y, x] = 13
            elif math.hypot(x - 21, y - 10) < 3:
                img[y, x] = 1
    return img


TEXGEN = [tex_stone, tex_brick, tex_metal, tex_wood_wall, tex_stone_moss, tex_floor_stone,
          tex_floor_tile, tex_floor_metal, tex_cobble, tex_floor_wood, tex_ceil_wood,
          tex_ceil_panel, tex_sky, tex_slime, tex_trim, tex_step, tex_pillar,
          None, None, None, tex_door, tex_hazard]


# ----------------------------------------------------------- billboards ----
class Canvas:
    def __init__(self, w, h):
        self.a = np.zeros((h, w), IMG)
        self.w, self.h = w, h

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.a[y, x] = c

    def ellipse(self, cx, cy, rx, ry, c, shade=None):
        for y in range(self.h):
            for x in range(self.w):
                dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                d = dx * dx + dy * dy
                if d <= 1:
                    col = c
                    if shade:
                        # light from upper-left, blended dark -> base -> light
                        lit = -dx * 0.6 - dy * 0.8
                        if lit >= 0:
                            col = vp_mix(c, shade[0], round(min(1, lit / 0.7) * 6) / 6)
                        else:
                            col = vp_mix(c, shade[2], round(min(1, -lit / 0.8) * 6) / 6)
                    self.a[y, x] = col

    def rect(self, x0, y0, x1, y1, c):
        self.a[max(0, y0):min(self.h, y1 + 1), max(0, x0):min(self.w, x1 + 1)] = c

    def line(self, x0, y0, x1, y1, c, t=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n; y = y0 + (y1 - y0) * i / n
            for ox in range(t):
                for oy in range(t):
                    self.px(x + ox - t // 2, y + oy - t // 2, c)

    def outline(self, c=1):
        m = self.a > 0
        o = np.zeros_like(m)
        o[1:, :] |= m[:-1, :]; o[:-1, :] |= m[1:, :]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
        self.a[o & ~m] = c


def grunt(frame):
    """Horned brute, 32x40. frame: walk0 walk1 attack pain dead0 dead1"""
    cv = Canvas(32, 40)
    skin, dark, light = 8, 2, 14
    if frame in ("dead0", "dead1"):
        if frame == "dead0":
            cv.ellipse(16, 30, 11, 7, skin, (light, skin, dark))
            cv.ellipse(12, 22, 6, 5, skin, (light, skin, dark))
            cv.line(6, 18, 3, 13, 15, 2); cv.line(17, 18, 21, 14, 15, 2)
            cv.px(10, 22, 10); cv.px(14, 22, 10)
        else:
            cv.ellipse(16, 35, 14, 4, 2)
            cv.ellipse(12, 33, 8, 4, skin, (light, skin, dark))
            cv.ellipse(24, 34, 5, 3, skin, (light, skin, dark))
            cv.px(5, 31, 15); cv.px(6, 30, 15)
            for (x, y) in [(18, 36), (22, 37), (27, 36), (9, 37)]:
                cv.px(x, y, 8)
        cv.outline(1)
        return cv.a
    step = {"walk0": -1, "walk1": 1}.get(frame, 0)
    # legs
    cv.rect(10, 28, 13, 38 + (step < 0), dark if step > 0 else skin)
    cv.rect(18, 28, 21, 38 + (step > 0), skin if step > 0 else dark)
    cv.rect(9, 37 + (step < 0), 14, 39, 4); cv.rect(17, 37 + (step > 0), 22, 39, 4)
    # torso + belly
    cv.ellipse(16, 21, 10, 10, skin, (light, skin, dark))
    cv.ellipse(16, 25, 6, 4, 4, (9, 4, 2))
    # belt
    cv.rect(7, 27, 25, 28, 5); cv.px(16, 27, 10); cv.px(16, 28, 10)
    # arms
    if frame == "attack":
        cv.line(7, 16, 3, 5, skin, 4); cv.line(25, 16, 29, 5, skin, 4)
        cv.ellipse(3, 4, 3, 3, 10, (7, 10, 9)); cv.ellipse(29, 4, 3, 3, 10, (7, 10, 9))
    else:
        sw = 2 * step
        cv.line(7, 16, 4, 26 + sw, skin, 4); cv.line(25, 16, 28, 26 - sw, skin, 4)
        cv.ellipse(4, 27 + sw, 2.5, 2.5, dark); cv.ellipse(28, 27 - sw, 2.5, 2.5, dark)
    # head + horns
    cv.ellipse(16, 10, 6.5, 6, skin, (light, skin, dark))
    cv.line(11, 6, 7, 1, 15, 2); cv.line(21, 6, 25, 1, 15, 2)
    cv.px(6, 0, 7); cv.px(26, 0, 7)
    eye = 7 if frame == "pain" else 10
    cv.rect(12, 9, 14, 10, eye); cv.rect(18, 9, 20, 10, eye)
    cv.rect(13, 13, 19, 14, 1)
    cv.px(14, 13, 7); cv.px(18, 13, 7)
    if frame == "pain":
        for (x, y) in [(14, 20), (15, 21), (19, 18), (13, 24)]:
            cv.px(x, y, 7)
    cv.outline(1)
    return cv.a


def fireball(k):
    cv = Canvas(16, 16)
    r = 6.5 if k == 0 else 7.2
    cv.ellipse(8, 8, r, r, 8)
    cv.ellipse(8, 8, r - 2, r - 2, 9)
    cv.ellipse(7.5, 7.5, r - 4, r - 4, 10)
    cv.ellipse(7, 7, 1.5, 1.5, 7)
    if k:
        for (x, y) in [(1, 8), (14, 5), (8, 1), (4, 13)]:
            cv.px(x, y, 9)
    return cv.a


def bb_crate():
    t = tex_crate()
    cv = Canvas(32, 32)
    cv.a[:, :] = t
    for y in range(32):                       # the right quarter is the crate's shaded side
        for x in range(24, 32):
            cv.a[y, x] = vp_scale(cv.a[y, x], 0.62)
    return cv.a


def bb_barrel():
    cv = Canvas(24, 32)
    side = tex_barrel_side()
    for x in range(24):
        f = math.cos((x - 11.5) / 12 * math.pi / 2)
        sx = int(np.clip(16 + math.asin(np.clip((x - 11.5) / 12, -1, 1)) / (math.pi / 2) * 14, 0, 31))
        # cylinder shading: brighter on the lit (left) side, dark at the rims
        lit = 0.45 + 0.55 * f + (0.18 if x < 9 else 0)
        for y in range(3, 32):
            cv.a[y, x] = vp_scale(side[y, sx], round(min(1.25, lit) * 8) / 8)
    cv.ellipse(12, 3, 11.5, 3, 5)
    cv.ellipse(12, 3, 9, 2, 13)
    return cv.a


def flame(k):
    cv = Canvas(16, 24)
    sway = 1 if k else -1
    cv.ellipse(8 + sway * 0.5, 15, 5, 8, 8)
    cv.ellipse(8, 16, 3.5, 6, 9)
    cv.ellipse(8 - sway * 0.5, 18, 2, 4, 10)
    cv.ellipse(8, 19, 1, 2, 7)
    cv.px(8 + sway * 2, 5, 9); cv.px(8 - sway, 3, 8)
    return cv.a


def bb_torch(k):
    cv = Canvas(16, 48)
    cv.rect(6, 24, 9, 47, 4); cv.rect(6, 24, 6, 47, 9); cv.rect(9, 24, 9, 47, 2)
    cv.rect(3, 22, 12, 25, 5); cv.rect(3, 22, 12, 22, 6)
    cv.rect(4, 44, 11, 47, 5)
    f = flame(k)
    m = f > 0
    cv.a[0:24, 0:16][m] = f[m]
    return cv.a


def item_health():
    cv = Canvas(20, 16)
    cv.rect(1, 3, 18, 15, 6); cv.rect(1, 3, 18, 4, 7); cv.rect(1, 14, 18, 15, 13)
    cv.rect(7, 0, 12, 3, 5)
    cv.rect(8, 6, 11, 13, 8); cv.rect(5, 8, 14, 11, 8)
    cv.outline(1)
    return cv.a


def item_ammo():
    cv = Canvas(20, 16)
    cv.rect(1, 6, 18, 15, 4); cv.rect(1, 6, 18, 7, 9); cv.rect(1, 14, 18, 15, 2)
    for i in range(4):
        x = 3 + i * 4
        cv.rect(x, 1, x + 2, 6, 8); cv.rect(x, 5, x + 2, 6, 10); cv.px(x, 1, 14)
    cv.rect(6, 9, 13, 11, 10)
    cv.outline(1)
    return cv.a


def shotgun(fire):
    """First-person double barrel, 96x64."""
    cv = Canvas(96, 64)
    lift = -4 if fire else 0
    # barrels (perspective: converge up towards screen centre)
    for side in (-1, 1):
        cx0, cx1 = 48 + side * 10, 48 + side * 6
        for y in range(14 + lift, 50):
            t = (y - 14 - lift) / 36.0
            cx = cx0 * t + cx1 * (1 - t)
            hw = 3.5 + t * 4
            for x in range(int(cx - hw), int(cx + hw) + 1):
                d = (x - cx) / hw
                cv.px(x, y, 6 if d < -0.4 else 5 if d < 0.5 else 1)
        cv.ellipse(cx1, 14 + lift, 3.4, 1.6, 1)
    # wooden fore-end + receiver
    for y in range(34 + lift, 64):
        t = (y - 34 - lift) / 30
        hw = 16 + t * 14
        for x in range(int(48 - hw), int(48 + hw) + 1):
            d = (x - 48) / hw
            c = 9 if d < -0.55 else 4 if d < 0.45 else 2
            if (y + x // 5) % 9 == 0:
                c = 2
            cv.px(x, y, c)
    cv.rect(32, 44 + lift, 63, 46 + lift, 5); cv.rect(32, 44 + lift, 63, 44 + lift, 6)
    cv.outline(1)
    if fire:
        f = Canvas(96, 64)
        f.ellipse(48, 7, 20, 8, 9); f.ellipse(48, 8, 13, 6, 10); f.ellipse(48, 9, 7, 3, 7)
        for (x, y) in [(26, 2), (70, 3), (35, 0), (61, 0)]:
            f.px(x, y, 9)
        m = (f.a > 0) & (cv.a == 0)
        cv.a[m] = f.a[m]
    return cv.a


def puff():
    cv = Canvas(8, 8)
    cv.ellipse(4, 4, 3.5, 3.5, 6); cv.ellipse(3.5, 3.5, 2, 2, 7)
    return cv.a


SPRITES = {  # index: (category, name, generator)
    17: ("props", "crate_face", tex_crate),
    18: ("props", "barrel_side", tex_barrel_side),
    19: ("props", "barrel_top", tex_barrel_top),
    32: ("monsters", "grunt_walk0", lambda: grunt("walk0")),
    33: ("monsters", "grunt_walk1", lambda: grunt("walk1")),
    34: ("monsters", "grunt_attack", lambda: grunt("attack")),
    35: ("monsters", "grunt_pain", lambda: grunt("pain")),
    36: ("monsters", "grunt_dead0", lambda: grunt("dead0")),
    37: ("monsters", "grunt_dead1", lambda: grunt("dead1")),
    38: ("fx", "fireball0", lambda: fireball(0)),
    39: ("fx", "fireball1", lambda: fireball(1)),
    40: ("props", "crate_billboard", bb_crate),
    41: ("props", "barrel_billboard", bb_barrel),
    42: ("props", "torch_billboard0", lambda: bb_torch(0)),
    43: ("props", "torch_billboard1", lambda: bb_torch(1)),
    44: ("fx", "flame0", lambda: flame(0)),
    45: ("fx", "flame1", lambda: flame(1)),
    46: ("items", "health", item_health),
    47: ("items", "ammo", item_ammo),
    48: ("weapon", "shotgun_idle", lambda: shotgun(False)),
    49: ("weapon", "shotgun_fire", lambda: shotgun(True)),
    50: ("fx", "puff", puff),
}


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 15 / 32


def quantise(a, pal, amp=22.0):
    """design image (VP indices) -> palette indices. The 16 flat design
    colours map to their nearest palette colour; in-between colours get a
    4x4 ordered dither first so gradients use every colour on the way.
    Colour 0 stays transparent and nothing else may become it."""
    h, w = a.shape
    rgb = np.array(VP, float)[a]
    t = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w, None] * amp
    rgb = np.where((a >= 16)[..., None], rgb + t, rgb)
    P = np.array(pal[1:], float)
    rm = (rgb[..., None, 0] + P[None, None, :, 0]) / 2
    d = rgb[..., None, :] - P[None, None, :, :]
    dist = (2 + rm / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - rm) / 256) * d[..., 2] ** 2
    out = (np.argmin(dist, axis=2) + 1).astype(np.uint8)
    out[a == 0] = 0
    return out


def to_rgb(q, pal):
    return np.array(pal, np.uint8)[q]


def save(q, pal, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(to_rgb(q, pal), "RGB").save(path)


def main():
    design = {}
    for i, (name, gen) in enumerate(zip(TEXTURES, TEXGEN)):
        if gen is None:
            continue
        a = gen()
        assert a.shape == (32, 32) and a.min() > 0, f"texture {name} must be 32x32 without colour 0"
        design[i] = ("textures", name, a)
    for i, (cat, name, gen) in SPRITES.items():
        design[i] = (cat, name, gen())
    sets = {}
    for sub, off, pal in SETS:
        base = os.path.join(CART, "sprites", sub) if sub else os.path.join(CART, "sprites")
        if sub:
            os.makedirs(base, exist_ok=True)
            with open(os.path.join(base, "palette.hex"), "w") as f:
                f.write("\n".join("%02x%02x%02x" % c for c in pal) + "\n")
        sets[sub] = {}
        for i, (cat, name, a) in design.items():
            q = quantise(a, pal)
            if cat == "textures":
                assert q.min() > 0, f"{name}: a texture pixel quantised to transparent"
            sets[sub][i] = (cat, name, q, pal)
            save(q, pal, os.path.join(base, cat, f"{i + off:03d}_{name}.png"))
            if cat == "textures" and not sub:
                # same material for TrenchBroom (the .map uses face scale 2)
                save(q, pal, os.path.join(TB_TEX, f"{name}.png"))
    print(f"wrote {len(design)} sprites x {len(SETS)} palettes ({len(VP)} design colours)")
    if "--sheet" in sys.argv:
        sheet(sets, sys.argv[sys.argv.index("--sheet") + 1])


def sheet(sets, path, z=3):
    """Contact sheet: every sprite in both art sets, side by side per set."""
    from PIL import ImageDraw
    W = 10 * (32 * z + 10) + 20
    parts = []
    for sub, _, _ in SETS:
        img = Image.new("RGB", (W, 2000), (24, 22, 28))
        dr = ImageDraw.Draw(img)
        dr.text((10, 6), "default 32" if not sub else "custom 64 (" + sub + ")", fill=(255, 255, 255))
        x, y, rowh = 10, 24, 0
        for i, (cat, name, q, pal) in sorted(sets[sub].items()):
            im = Image.fromarray(to_rgb(q, pal)).resize((q.shape[1] * z, q.shape[0] * z), Image.NEAREST)
            if x + im.width > W - 10:
                x = 10; y += rowh + 22; rowh = 0
            img.paste(im, (x, y))
            dr.text((x, y + im.height + 3), f"{i} {name}", fill=(210, 210, 210))
            x += im.width + 10
            rowh = max(rowh, im.height)
        parts.append(img.crop((0, 0, W, y + rowh + 26)))
    out = Image.new("RGB", (W, sum(p.height for p in parts)), (24, 22, 28))
    yy = 0
    for p_ in parts:
        out.paste(p_, (0, yy)); yy += p_.height
    out.save(path)
    print(f"contact sheet -> {path}")


if __name__ == "__main__":
    main()
