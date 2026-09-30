#!/usr/bin/env python3
"""
gen_art.py - procedural art for the FPS Render Lab cart.

    python3 tools/fps-lab/gen_art.py [--sheet out.png]

Writes indexed-colour PNGs (PICO-8 palette, colours 0..15; black = transparent
for sprites) into carts/fps-render-lab.p64/sprites/<category>/NNN_name.png.
The leading NNN is the sprite index (tools/picotron/png2gfx.lua bakes them
into gfx/0.gfx at build time). World textures are also copied to
tools/fps-lab/trenchbroom/textures/fpslab/ so TrenchBroom shows the same
materials.

Seeded, deterministic. Once a PNG has been hand-edited treat the PNG as the
source of truth and don't re-run this over it.

Shading is NOT baked into these: at runtime the cart redefines colours
16..63 as 3 darker ramps of 0..15 and builds shaded copies (index + 16*k).
Textures never use colour 0 (it is transparent to tline3d).
"""
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
RAMP = [1.0, 0.66, 0.42, 0.22]          # must match SHADE in main.lua

# keep this order in sync with TEXTURES in map2bsp.py
TEXTURES = ["stone", "brick", "metal", "wood_wall", "stone_moss", "floor_stone",
            "floor_tile", "floor_metal", "cobble", "floor_wood", "ceil_wood",
            "ceil_panel", "sky", "slime", "trim", "step", "pillar"]

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
    """values 0..1 -> palette index via thresholds (len(cuts) == len(cols)-1)."""
    out = np.full(values.shape, cols[-1], dtype=np.uint8)
    for i in range(len(cuts) - 1, -1, -1):
        out[values < cuts[i]] = cols[i]
    return out


def dither(v, levels):
    b = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5
    h, w = v.shape
    t = np.tile(b, (h // 4 + 1, w // 4 + 1))[:h, :w]
    return np.clip(v + t / levels, 0, 1)


# ------------------------------------------------------------ textures ----
def blocks(w, h, rows, offset, mortar, face_cols, cuts, seed, bevel=True):
    img = np.zeros((h, w), np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
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
    img = np.full((32, 32), 5, np.uint8)
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
    img = np.full((32, 32), 1, np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
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
    n = noise(32, 32, 2, 4, 12)
    v = np.clip(n * 0.9 + np.linspace(0.25, -0.05, 32)[:, None], 0, 1)
    return ramp(dither(v, 5), [1, 2, 13, 14, 15], [0.35, 0.5, 0.62, 0.72])


def tex_slime():
    n = noise(32, 32, 4, 3, 13)
    v = np.abs(np.sin(n * 9.0))
    return ramp(dither(v, 4), [3, 3, 11, 10], [0.3, 0.7, 0.93])


def tex_trim():
    img = np.zeros((32, 32), np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
    n = noise(32, 32, 4, 2, 15)
    for x in range(32):
        f = math.cos((x % 8) / 8 * 2 * math.pi)
        for y in range(32):
            v = 0.5 + 0.35 * f + (n[y, x] - 0.5) * 0.4
            img[y, x] = ramp(np.array([v]), [5, 13, 6, 7], [0.3, 0.55, 0.88])[0]
    return img


def tex_crate():
    img = np.zeros((32, 32), np.uint8)
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
    img = np.zeros((32, 32), np.uint8)
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
    img = np.full((32, 32), 5, np.uint8)
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
          tex_ceil_panel, tex_sky, tex_slime, tex_trim, tex_step, tex_pillar]


# ----------------------------------------------------------- billboards ----
class Canvas:
    def __init__(self, w, h):
        self.a = np.zeros((h, w), np.uint8)
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
                        lit = -dx * 0.6 - dy * 0.8        # light from upper-left
                        col = shade[0] if lit > 0.35 else shade[2] if lit < -0.45 else c
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
    cv.a[:, 24:] = np.where(cv.a[:, 24:] == 9, 4, np.where(cv.a[:, 24:] == 4, 2, cv.a[:, 24:]))
    return cv.a


def bb_barrel():
    cv = Canvas(24, 32)
    side = tex_barrel_side()
    for x in range(24):
        f = math.cos((x - 11.5) / 12 * math.pi / 2)
        sx = int(np.clip(16 + math.asin(np.clip((x - 11.5) / 12, -1, 1)) / (math.pi / 2) * 14, 0, 31))
        for y in range(3, 32):
            c = side[y, sx]
            if f < 0.55:
                c = {11: 3, 3: 1, 10: 9, 9: 4, 6: 5, 5: 1}.get(c, c)
            elif x < 8 and f > 0.8:
                c = {3: 11, 5: 6}.get(c, c)
            cv.a[y, x] = c
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


def to_rgb(a):
    return np.array(PAL, np.uint8)[a]


def save(a, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(to_rgb(a), "RGB").save(path)


def main():
    out = {}
    for i, (name, gen) in enumerate(zip(TEXTURES, TEXGEN)):
        a = gen()
        assert a.shape == (32, 32) and a.min() > 0, f"texture {name} must be 32x32 without colour 0"
        out[i] = ("textures", name, a)
    for i, (cat, name, gen) in SPRITES.items():
        out[i] = (cat, name, gen())
    for i, (cat, name, a) in out.items():
        save(a, os.path.join(CART, "sprites", cat, f"{i:03d}_{name}.png"))
        if cat == "textures":
            # same material for TrenchBroom (the .map uses face scale 2)
            save(a, os.path.join(TB_TEX, f"{name}.png"))
    print(f"wrote {len(out)} sprites")
    if "--sheet" in sys.argv:
        sheet(out, sys.argv[sys.argv.index("--sheet") + 1])


def sheet(out, path, z=4):
    """Contact sheet: textures (with their 4 runtime light levels) + sprites."""
    from PIL import ImageDraw
    cells = sorted(out.items())
    W = 8 * (32 * z + 12) + 12
    rows = []
    y = 12
    img = Image.new("RGB", (W, 2400), (24, 22, 28))
    dr = ImageDraw.Draw(img)
    x = 12
    rowh = 0
    for i, (cat, name, a) in cells:
        rgb = to_rgb(a).astype(float)
        if cat == "textures":
            # show all 4 shade levels as a strip
            strip = np.concatenate([rgb * RAMP[k] for k in range(4)], axis=1).astype(np.uint8)
            im = Image.fromarray(strip).resize((a.shape[1] * z, a.shape[0] * z // 4 * 1), Image.NEAREST)
            im = Image.fromarray(rgb.astype(np.uint8)).resize((a.shape[1] * z, a.shape[0] * z), Image.NEAREST)
        else:
            im = Image.fromarray(rgb.astype(np.uint8)).resize((a.shape[1] * z, a.shape[0] * z), Image.NEAREST)
        if x + im.width > W - 12:
            x = 12; y += rowh + 26; rowh = 0
        img.paste(im, (x, y))
        dr.text((x, y + im.height + 4), f"{i} {name}", fill=(220, 220, 220))
        x += im.width + 12
        rowh = max(rowh, im.height)
    img = img.crop((0, 0, W, y + rowh + 30))
    img.save(path)
    print(f"contact sheet -> {path}")


if __name__ == "__main__":
    main()
