--[[pod_format="raw"]]
--[[
	gfx.lua - shared rendering setup for both renderers.

	Light model: a texel is colour + 64 * light level (k=0 full .. 3 darkest);
	the level bits select one of Picotron's 4 colour tables, each mapping a
	colour to its darker neighbour in the active palette (see "palettes"
	below). Shading is therefore just "add 64*k" to a pixel, which lets us:

	  * pre-shade sprites/textures once (VAR_BASE + i*4 + k) for things that
	    must shade per draw inside ONE batch call (raycaster columns, rows)
	  * bake Quake-style lightmaps into cached surface textures at load
	    (SURF_BASE + surface id) with a handful of userdata:add() calls
	  * darken whole polygons for distance fog by swapping the 4 colour
	    tables (one 16k poke) instead of calling pal() per colour

	The rasteriser (fill_poly) grew out of the batched-scanline textri of
	RubenTipparach/ld58-pictoron-3d-engine: instead of fanning polygons into
	triangles it walks the convex polygon's two edge chains, builds each
	span's scanlines with a start row + slope expanded in C (copy + prefix
	sum add), and draws the whole polygon with ONE tline3d(userdata) call.
]]

SW, SH = 480, 270
CX, CY = 240, 135
FOCAL = 240                          -- 90 degree horizontal fov
VAR_BASE = 256                       -- shaded sprite variants: VAR_BASE + i*4 + k
SURF_BASE = 1024                     -- cached world surfaces: SURF_BASE + surface id
SHADE = {1, 0.66, 0.42, 0.22}        -- brightness per light level (gen_art.py's sheet previews it)

fog_tables = {}                      -- [0..3] all 4 colour tables per fog level (u8 64x256)
SPR_OX, SPR_OY = {}, {}              -- art offset inside padded billboard sprites

local function pow2(n) local p = 1 while p < n do p = p * 2 end return p end
function pad_pow2(s, i)
	local w, h = s:width(), s:height()
	local pw, ph = pow2(w), pow2(h)
	SPR_OX[i], SPR_OY[i] = 0, 0
	if pw == w and ph == h then return s end
	local ox, oy = flr((pw - w) / 2), ph - h      -- centred, standing on the bottom
	local p = userdata("u8", pw, ph)
	blit(s, p, 0, 0, ox, oy, w, h)
	SPR_OX[i], SPR_OY[i] = ox, oy
	return p
end
local cur_fog = -1

function fsin(a) return -sin(a) end  -- Picotron's sin() is inverted (PICO-8 style)

-- ------------------------------------------------------------ palettes ---
-- Two art sets for palette experiments (G switches): Picotron's default 32
-- colours, and a custom 64-colour palette. Each set has its own sprites:
-- set 1 at sprite index i, set 2 at i + 64 (sprites/pal64/).
PALETTES = {
	{name = "default 32", n = 32, off = 0, rgb = {
		0x000000, 0x1d2b53, 0x7e2553, 0x008751, 0xab5236, 0x5f574f, 0xc2c3c7, 0xfff1e8,
		0xff004d, 0xffa300, 0xffec27, 0x00e436, 0x29adff, 0x83769c, 0xff77a8, 0xffccaa,
		0x2463b0, 0x00a5a1, 0x654688, 0x125359, 0x703233, 0x432932, 0xa28879, 0xffacc5,
		0xb9003e, 0xe26b13, 0x95f04b, 0x00b251, 0x64dff6, 0xbd9adf, 0xe40dab, 0xf49671}},
	{name = "custom 64", n = 64, off = 64, rgb = {
		0x000000, 0x12173d, 0x293268, 0x464b8c, 0x6b74b2, 0x909edd, 0xc1d9f2, 0xffffff,
		0xa293c4, 0x7b6aa5, 0x53427f, 0x3c2c68, 0x431e66, 0x5d2f8c, 0x854cbf, 0xb483ef,
		0x8cff9b, 0x42bc7f, 0x22896e, 0x14665b, 0x0f4a4c, 0x0a2a33, 0x1d1a59, 0x322d89,
		0x354ab2, 0x3e83d1, 0x50b9eb, 0x8cdaff, 0x53a1ad, 0x3b768f, 0x21526b, 0x163755,
		0x008782, 0x00aaa5, 0x27d3cb, 0x78fae6, 0xcdc599, 0x988f64, 0x5c5d41, 0x353f23,
		0x919b45, 0xafd370, 0xffe091, 0xffaa6e, 0xff695a, 0xb23c40, 0xff6675, 0xdd3745,
		0xa52639, 0x721c2f, 0xb22e69, 0xe54286, 0xff6eaf, 0xffa5d5, 0xffd3ad, 0xcc817a,
		0x895654, 0x61393b, 0x3f1f3c, 0x723352, 0x994c69, 0xc37289, 0xf29faa, 0xffccd0}},
}
pal_set = 1
function art_off() return PALETTES[pal_set].off end

-- Light model: every texel is  colour (low 6 bits) + 64 * light level (0..3).
-- With the read mask at 0xff the level bits pick one of Picotron's 4 colour
-- tables, and table k maps each colour to the palette colour nearest to it
-- at SHADE[k] brightness. So shading works for ANY palette and still costs
-- nothing per pixel:
--   * sprites/textures are pre-shaded once (VAR_BASE + i*4 + k = s + 64k)
--   * lightmaps are baked into cached surfaces with userdata:add(64*level)
--   * distance fog swaps all 4 tables for ones shifted f levels darker by
--     memmap()ing a prebuilt 16k userdata at 0x8000: a remap, not a copy
shade_map = {}                       -- [k][c] -> palette colour
local base_ct                        -- Picotron's own colour table 0 (4k)

local function nearest(r, g, b, rgb, n)
	local best, bi = 1e9, 0
	for i = 0, n - 1 do
		local v = rgb[i + 1]
		local dr, dg, db = ((v >> 16) & 0xff) - r, ((v >> 8) & 0xff) - g, (v & 0xff) - b
		local rm = (((v >> 16) & 0xff) + r) / 2
		local d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db
		if d < best then best, bi = d, i end
	end
	return bi
end

function gfx_palette()
	local P = PALETTES[pal_set]
	for c = 0, 63 do pal(c, P.rgb[c + 1] or 0, 2) end
end

-- HUD/menu colours are written as PICO-8 numbers: UI[c] is the closest
-- colour to PICO-8 colour c in the active palette
UI = {}
local function build_ui()
	local P, D = PALETTES[pal_set], PALETTES[1].rgb
	for c = 0, 15 do
		local v = D[c + 1]
		UI[c] = c == 0 and 0 or nearest((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff, P.rgb, P.n)
	end
end

local function build_shades()
	local P = PALETTES[pal_set]
	build_ui()
	for k = 0, 3 do
		local m = {}
		local f = SHADE[k + 1]
		for c = 0, 63 do
			if k == 0 or c == 0 or c >= P.n then
				m[c] = c
			else
				local v = P.rgb[c + 1]
				m[c] = nearest(flr(((v >> 16) & 0xff) * f), flr(((v >> 8) & 0xff) * f),
					min(255, flr((v & 0xff) * f + 6 * k)), P.rgb, P.n)
			end
		end
		shade_map[k] = m
	end
end

-- fog level f: 4 tables (one per light level), table k = light min(3, k + f).
-- Colour-0 rows (transparency) pass through; every other entry keeps the
-- 0xc0 bits Picotron 0.3 stores in it and only its colour moves.
local function build_fog_tables()
	for f = 0, 3 do
		if fog_tables[f] and unmap then unmap(fog_tables[f]) end   -- release the old mapping
	end
	for f = 0, 3 do
		local t = userdata("u8", 64, 256)
		for k = 0, 3 do
			local m = shade_map[min(3, k + f)]
			local o = k * 4096
			for i = 0, 4095 do
				local v = base_ct[i]
				t[o + i] = i < 64 and v or ((v & 0xc0) | m[v & 0x3f])
			end
		end
		fog_tables[f] = t
	end
	cur_fog = -1
	set_fog(0)
end

-- shaded copies of every sprite 0..63 of the active art set (textures,
-- billboards, weapon). Billboards (32..47, 50) are padded into power-of-two
-- canvases first: Picotron 0.3's tline3d loops non-power-of-two sprites (a
-- 32x40 grunt came out with its head repeated). SPR_OX/OY: art offset.
local function build_variants()
	local off = art_off()
	for i = 0, 63 do
		local s = get_spr(i + off) or get_spr(i)
		if s and s:width() > 1 and ((i >= 32 and i <= 47) or i == 50) then
			s = pad_pow2(s, i)
		end
		if s and s:width() > 1 then
			set_spr(VAR_BASE + i * 4, s)
			local mask = s:min(1)                    -- 1 where opaque, 0 where transparent
			for k = 1, 3 do
				set_spr(VAR_BASE + i * 4 + k, s:add(mask:mul(64 * k)))
			end
		end
	end
end

function gfx_init()
	if not base_ct then
		base_ct = userdata("u8", 64, 64)
		base_ct:peek(0x8000)
	end
	poke(0x5508, 0xff)                           -- read mask: texel bits 0xc0 pick the light table
	gfx_palette()
	build_shades()
	build_fog_tables()
	build_variants()
	anim_init()
end

-- switch art set + palette (G). The caller rebuilds the surface cache.
function gfx_set_palette(n)
	pal_set = n
	gfx_palette()
	build_shades()
	build_fog_tables()
	build_variants()
	anim_init()
end

-- a switch maps the level's 4 tables (one 16k userdata) over 0x8000..0xbfff:
-- no copy, so polygons and objects can each use their exact fog level
function set_fog(k)
	if k ~= cur_fog then
		memmap(fog_tables[k], 0x8000)
		cur_fog = k
	end
end

-- ----------------------------------------------------- scrolling textures ---
-- sky and acid (slime) are unlit "turbulent" textures: their pixels are
-- scrolled in place every frame (4 blits per shade variant), so the
-- raycaster's floor/ceiling maps and the BSP's wrapped liquid polygons both
-- pick the motion up for free
local anims = {}
local ANIM = {{tex = 12, sx = 1 / 3, sy = 1 / 7}, {tex = 13, sx = 1 / 4, sy = -1 / 11}}   -- sky, slime
function anim_init()
	anims = {}
	for a in all(ANIM) do
		for k = 0, 3 do
			local dst = get_spr(VAR_BASE + a.tex * 4 + k)
			if dst then
				local src = userdata("u8", 32, 32)
				blit(dst, src, 0, 0, 0, 0, 32, 32)
				add(anims, {idx = VAR_BASE + a.tex * 4 + k, src = src, dst = dst, sx = a.sx, sy = a.sy, ox = -1, oy = -1})
			end
		end
	end
end

local function wrap_blit(src, dst, ox, oy)
	local w1, h1 = 32 - ox, 32 - oy
	blit(src, dst, 0, 0, ox, oy, w1, h1)
	if ox > 0 then blit(src, dst, w1, 0, 0, oy, ox, h1) end
	if oy > 0 then blit(src, dst, 0, h1, ox, 0, w1, oy) end
	if ox > 0 and oy > 0 then blit(src, dst, w1, h1, 0, 0, ox, oy) end
end

function anim_update(frame)
	for a in all(anims) do
		local ox, oy = flr(frame * a.sx) % 32, flr(frame * a.sy) % 32
		if ox ~= a.ox or oy ~= a.oy then
			wrap_blit(a.src, a.dst, ox, oy)
			set_spr(a.idx, a.dst)
			a.ox, a.oy = ox, oy
		end
	end
end

-- Quake surface cache: tile the base texture over each surface's texel
-- rectangle, then darken it by the baked lightmap: samples every LUXEL
-- texels (in 1/lsub shade steps) are lerped into a smooth field and dithered
-- down to the 4 palette ramps, so light pools fade instead of stepping.
function build_surfaces()
	local L = LEVEL.luxel
	-- dither thresholds (b + 0.5) / 16, 4 rows as wide as the widest surface
	DITHER_W = 1
	for _, s in ipairs(LEVEL.surfs) do DITHER_W = max(DITHER_W, s[4]) end
	DITHER = userdata("f64", DITHER_W, 4)
	local bayer = {0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5}
	for y = 0, 3 do
		for x = 0, DITHER_W - 1 do DITHER:set(x, y, (bayer[y * 4 + x % 4 + 1] + 0.5) / 16) end
	end
	local texels = 0
	for id, s in ipairs(LEVEL.surfs) do
		local tex, uo, vo, w, h, lw, lh, lm = s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8]
		if s[9] == 1 then goto next_surf end        -- sky/slime: drawn from the scrolling texture
		local ud = userdata("u8", w, h)
		local src = get_spr(VAR_BASE + tex * 4)
		-- tile (clipped blits; the texel origin starts uo,vo into the texture)
		local ty = -vo
		while ty < h do
			local tx = -uo
			while tx < w do
				local sx, sy, dx, dy = 0, 0, tx, ty
				if dx < 0 then sx = -dx; dx = 0 end
				if dy < 0 then sy = -dy; dy = 0 end
				local bw, bh = min(32 - sx, w - dx), min(32 - sy, h - dy)
				if bw > 0 and bh > 0 then blit(src, ud, sx, sy, dx, dy, bw, bh) end
				tx = tx + 32
			end
			ty = ty + 32
		end
		-- light: bilinear between the baked samples + ordered dither, all in C
		if #lm > 0 then
			local F = userdata("f64", w, h)
			local seg, rem = flr((w - 1) / L), (w - 1) % L
			for j = 0, lh - 1 do
				local y = min(j * L, h - 1)
				for i = 0, lw - 1 do
					F:set(min(i * L, w - 1), y, (ord(lm, j * lw + i + 1) - 48) / LEVEL.lsub)
				end
				if seg > 0 then F:lerp(y * w, L, 1, seg, L) end
				if rem > 0 then F:lerp(y * w + seg * L, rem) end
			end
			for j = 0, lh - 2 do
				local y0, y1 = j * L, min((j + 1) * L, h - 1)
				if y1 - y0 > 1 then F:lerp(y0 * w, y1 - y0, w, w, 1) end
			end
			-- + a 4x4 Bayer threshold, then floor: the fraction becomes dither
			for r = 0, min(3, h - 1) do
				F:add(DITHER, true, r * DITHER_W, r * w, w, 0, 4 * w, flr((h - 1 - r) / 4) + 1)
			end
			ud:add(F:convert("u8"):mul(64, true), true)
		end
		set_spr(SURF_BASE + id, ud)
		texels = texels + w * h
		::next_surf::
	end
	return texels
end

-- scanline buffer for fill_poly (one row of tline3d args per screen row)
local scan = userdata("f64", 11, 270)

-- fill_poly: convex screen polygon (1-based arrays x,y,w,u,v; w = 1/z) in ONE
-- batched tline3d call. Walks the two monotone chains from the top vertex;
-- each y-span between vertices has both edges linear, so its scanlines are a
-- start row + per-row slope, expanded in C with copy() + a prefix-sum add().
-- Replaces a triangle fan through textri: a quad is 2-3 spans and one
-- tline3d instead of 4 half-triangles, 2 sorts and 4 tline3d calls.
local slope = userdata("f64", 11)
-- pu, pv are premultiplied by w (u*w, v*w): the BSP's batch prepass does
-- that for every level quad in C
function fill_poly(spr, n, px, py, pw, pu, pv)
	local top, bot = 1, 1
	for i = 2, n do
		if py[i] < py[top] then top = i end
		if py[i] > py[bot] then bot = i end
	end
	if py[bot] - py[top] < 0.01 then return 0 end
	local a0, b0 = top, top
	local a1, b1 = top % n + 1, (top - 2) % n + 1
	local ys, rows = py[top], 0
	local shm = SH - 1
	while a0 ~= bot and b0 ~= bot do
		local yA0, yA1, yB0, yB1 = py[a0], py[a1], py[b0], py[b1]
		local ye = yA1 < yB1 and yA1 or yB1
		local r0, r1 = flr(ys) + 1, flr(ye)
		if r0 < 0 then r0 = 0 end
		if r1 > shm then r1 = shm end
		if r1 >= r0 and yA1 > yA0 and yB1 > yB0 then
			local ia, ib = 1 / (yA1 - yA0), 1 / (yB1 - yB0)
			local ta, tb = (r0 - yA0) * ia, (r0 - yB0) * ib
			local wa0, wa1, wb0, wb1 = pw[a0], pw[a1], pw[b0], pw[b1]
			local ua0, ua1, va0, va1 = pu[a0], pu[a1], pv[a0], pv[a1]
			local ub0, ub1, vb0, vb1 = pu[b0], pu[b1], pv[b0], pv[b1]
			local dxa, dxb = (px[a1] - px[a0]) * ia, (px[b1] - px[b0]) * ib
			local dua, dva, dwa = (ua1 - ua0) * ia, (va1 - va0) * ia, (wa1 - wa0) * ia
			local dub, dvb, dwb = (ub1 - ub0) * ib, (vb1 - vb0) * ib, (wb1 - wb0) * ib
			scan:set(0, rows, spr,
				px[a0] + dxa * (r0 - yA0), r0, px[b0] + dxb * (r0 - yB0), r0,
				ua0 + dua * (r0 - yA0), va0 + dva * (r0 - yA0),
				ub0 + dub * (r0 - yB0), vb0 + dvb * (r0 - yB0),
				wa0 + dwa * (r0 - yA0), wb0 + dwb * (r0 - yB0))
			local cnt = r1 - r0 + 1
			if cnt > 1 then
				local o = rows * 11
				slope:set(0, 0, dxa, 1, dxb, 1, dua, dva, dub, dvb, dwa, dwb)   -- [0] = sprite: no slope
				scan:copy(slope, true, 0, o + 11, 11, 0, 11, cnt - 1)
				scan:add(scan, true, o, o + 11, 11, 11, 11, cnt - 1)
			end
			rows = rows + cnt
		end
		ys = ye
		if yA1 <= ye then a0 = a1; a1 = a0 % n + 1 end
		if yB1 <= ye then b0 = b1; b1 = (b0 - 2) % n + 1 end
	end
	if rows > 0 then tline3d(scan, 0, rows) end
	return flr(n) - 2
end
