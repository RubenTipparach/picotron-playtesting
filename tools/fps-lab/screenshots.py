#!/usr/bin/env python3
"""
screenshots.py - render reference frames of the FPS Render Lab cart WITHOUT
Picotron, by running the real cart Lua under tools/fps-lab/mock/picomock.lua
(needs lua5.4 + Pillow). Every pose is shot in both renderers and paired up
in a comparison sheet, plus a work report (tline3d calls/pixels, Lua VM
instructions per frame) per shot.

    python3 tools/fps-lab/screenshots.py [out_dir]

The mock is not Picotron - pixel details (edge rules, colour tables) and
absolute speed differ - but it runs the same code paths, so it catches
runtime errors and shows what each renderer draws.
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CART = os.path.join(ROOT, "carts", "fps-render-lab.p64")
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, "carts-dist", "screenshots")
# the two art sets' palettes (sprites/ = default 32, sprites/pal64/ = custom 64)
PAL32 = [0x000000, 0x1d2b53, 0x7e2553, 0x008751, 0xab5236, 0x5f574f, 0xc2c3c7, 0xfff1e8,
         0xff004d, 0xffa300, 0xffec27, 0x00e436, 0x29adff, 0x83769c, 0xff77a8, 0xffccaa,
         0x2463b0, 0x00a5a1, 0x654688, 0x125359, 0x703233, 0x432932, 0xa28879, 0xffacc5,
         0xb9003e, 0xe26b13, 0x95f04b, 0x00b251, 0x64dff6, 0xbd9adf, 0xe40dab, 0xf49671]
PAL64 = [0x000000, 0x12173d, 0x293268, 0x464b8c, 0x6b74b2, 0x909edd, 0xc1d9f2, 0xffffff,
         0xa293c4, 0x7b6aa5, 0x53427f, 0x3c2c68, 0x431e66, 0x5d2f8c, 0x854cbf, 0xb483ef,
         0x8cff9b, 0x42bc7f, 0x22896e, 0x14665b, 0x0f4a4c, 0x0a2a33, 0x1d1a59, 0x322d89,
         0x354ab2, 0x3e83d1, 0x50b9eb, 0x8cdaff, 0x53a1ad, 0x3b768f, 0x21526b, 0x163755,
         0x008782, 0x00aaa5, 0x27d3cb, 0x78fae6, 0xcdc599, 0x988f64, 0x5c5d41, 0x353f23,
         0x919b45, 0xafd370, 0xffe091, 0xffaa6e, 0xff695a, 0xb23c40, 0xff6675, 0xdd3745,
         0xa52639, 0x721c2f, 0xb22e69, 0xe54286, 0xff6eaf, 0xffa5d5, 0xffd3ad, 0xcc817a,
         0x895654, 0x61393b, 0x3f1f3c, 0x723352, 0x994c69, 0xc37289, 0xf29faa, 0xffccd0]
GH = 33   # grid rows in gen_level.py (row 0 = north)


def cell(col, row):
    return col * 64 + 32, (GH - 1 - row) * 64 + 32


# name, (x,y), yaw (turns, 0=east .25=north), pitch, options:
#   half = 240x135 detail, frames = updates before the shot, pal = art set
POSES = [
    ("hall", cell(6, 9.4), 0.25, 0.0, {}),
    ("hall_up", cell(6, 9.4), 0.25, 0.1, {}),
    ("courtyard", cell(18.6, 11.4), 0.13, 0.02, {}),
    ("corridor", cell(12.5, 5.5), 0.0, 0.0, {}),
    ("arena", cell(6.5, 15.2), 0.75, 0.03, {}),
    ("storage", cell(18.8, 20.5), 0.04, 0.0, {}),
    ("airlock", cell(26.5, 20), 0.0, 0.0, {}),                       # both doors shut
    ("airlock_open", cell(31.6, 20), 0.0, 0.0, {"frames": 45}),      # inside, far door opening
    ("acid", cell(37.2, 21.6), 0.07, -0.03, {}),
    ("atrium", cell(43, 6.4), 0.25, 0.12, {}),
    ("hall_240x135", cell(6, 9.4), 0.25, 0.0, {"half": True}),     # HALF detail (vid(3))
    ("acid_pal64", cell(37.2, 21.6), 0.07, -0.03, {"pal": 2}),
    ("hall_pal64", cell(6, 9.4), 0.25, 0.0, {"pal": 2}),
]


def dump_sprites(path):
    """every sprite PNG -> palette indices of its art set (like png2gfx.lua)"""
    lines = ["return {"]
    for dp, _, files in os.walk(os.path.join(CART, "sprites")):
        pal = PAL64 if "pal64" in os.path.relpath(dp, CART).split(os.sep) else PAL32
        idx = {((c >> 16) & 255, (c >> 8) & 255, c & 255): i for i, c in reversed(list(enumerate(pal)))}
        for f in sorted(files):
            if not f.endswith(".png") or not f[:3].isdigit():
                continue
            im = Image.open(os.path.join(dp, f)).convert("RGB")
            data = bytes(idx.get(p, 0) for p in im.getdata())
            esc = "".join("\\%d" % b for b in data)
            lines.append('[%d]={w=%d,h=%d,d="%s"},' % (int(f[:3]), im.width, im.height, esc))
    lines.append("}")
    open(path, "w").write("\n".join(lines))


def main():
    os.makedirs(OUT, exist_ok=True)
    sp = os.path.join(OUT, "sprites.lua")
    dump_sprites(sp)
    shots = ["return {"]
    for name, (x, y), yaw, pitch, opt in POSES:
        for m, tag in ((1, "ray"), (2, "bsp")):
            shots.append("""{name="%s_%s", frames=%d, setup=function()
  in_menu=false; show_stats=true; reset_game()
  if pal_set ~= %d then gfx_set_palette(%d); build_surfaces() end
  set_detail(%s)
  mode=%d; player.x=%g; player.y=%g; player.yaw=%g; player.pitch=%g
  player.z = (mode==2) and math.max(0, floor_at(player.x, player.y, 12, 72)) or 0
end},""" % (name, tag, opt.get("frames", 1), opt.get("pal", 1), opt.get("pal", 1),
            "true" if opt.get("half") else "false", m, x, y, yaw, pitch))
    shots.append("}")
    sh = os.path.join(OUT, "shots.lua")
    open(sh, "w").write("\n".join(shots))
    r = subprocess.run(["lua5.4", os.path.join(HERE, "mock", "run.lua"), CART, sp, sh, OUT])
    if r.returncode:
        sys.exit(r.returncode)
    for name, *_ in POSES:
        for tag in ("ray", "bsp"):
            p = os.path.join(OUT, f"{name}_{tag}.ppm")
            im = Image.open(p)
            if im.size != (480, 270):
                im = im.resize((480, 270), Image.NEAREST)     # vid(3): the display doubles it
            im.save(p[:-4] + ".png")
            os.remove(p)
    # comparison sheet: raycaster | true 3D per pose
    W, H = 480, 270
    sheet = Image.new("RGB", (W * 2 + 30, (H + 24) * len(POSES) + 34), (20, 20, 26))
    d = ImageDraw.Draw(sheet)
    d.text((10, 8), "RAYCASTER (grid slice)", fill=(120, 190, 255))
    d.text((W + 20, 8), "TRUE 3D (BSP + surface cache)", fill=(120, 255, 140))
    for i, (name, *_) in enumerate(POSES):
        y = 30 + i * (H + 24)
        for j, tag in enumerate(("ray", "bsp")):
            sheet.paste(Image.open(os.path.join(OUT, f"{name}_{tag}.png")), (10 + j * (W + 10), y))
        d.text((10, y + H + 4), name, fill=(200, 200, 200))
    sheet.save(os.path.join(OUT, "compare.png"))
    print("wrote", os.path.join(OUT, "compare.png"))


if __name__ == "__main__":
    main()
