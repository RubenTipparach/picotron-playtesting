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
PAL = [(0, 0, 0), (29, 43, 83), (126, 37, 83), (0, 135, 81), (171, 82, 54), (95, 87, 79),
       (194, 195, 199), (255, 241, 232), (255, 0, 77), (255, 163, 0), (255, 236, 39),
       (0, 228, 54), (41, 173, 255), (131, 118, 156), (255, 119, 168), (255, 204, 170)]
GH = 26   # grid rows in gen_level.py (row 0 = north)


def cell(col, row):
    return col * 64 + 32, (GH - 1 - row) * 64 + 32


POSES = [  # name, (col,row), yaw (turns, 0=east .25=north), pitch
    ("hall", cell(6, 9.4), 0.25, 0.0),
    ("hall_up", cell(6, 9.4), 0.25, 0.1),
    ("courtyard", cell(18.6, 11.4), 0.13, 0.02),
    ("corridor", cell(12.5, 5.5), 0.0, 0.0),
    ("arena", cell(6.5, 15.2), 0.75, 0.03),
    ("storage", cell(18.8, 20.5), 0.04, 0.0),
    ("hall_240x135", cell(6, 9.4), 0.25, 0.0, True),     # HALF detail (vid(3))
]


def dump_sprites(path):
    idx = {c: i for i, c in enumerate(PAL)}
    lines = ["return {"]
    for dp, _, files in os.walk(os.path.join(CART, "sprites")):
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
    for name, (x, y), yaw, pitch, *half in POSES:
        for m, tag in ((1, "ray"), (2, "bsp")):
            shots.append("""{name="%s_%s", frames=1, setup=function()
  set_detail(%s)
  mode=%d; player.x=%g; player.y=%g; player.yaw=%g; player.pitch=%g
  player.z = (mode==2) and math.max(0, floor_at(player.x, player.y, 12, 72)) or 0
end},""" % (name, tag, "true" if half else "false", m, x, y, yaw, pitch))
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
