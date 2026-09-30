--[[pod_format="raw"]]
--[[
	gfx.lua - shared rendering setup for both renderers.

	Light model: the 64-colour palette is rebuilt as 4 brightness ramps of the
	16 base (PICO-8) colours: colour c at level k = c + 16*k (k=0 full .. 3
	darkest). Shading is therefore just "add 16*k" to a pixel, which lets us:

	  * pre-shade sprites/textures once (VAR_BASE + i*4 + k) for things that
	    must shade per draw inside ONE batch call (raycaster columns, rows)
	  * bake Quake-style lightmaps into cached surface textures at load
	    (SURF_BASE + surface id) with a handful of userdata:add() calls
	  * darken whole polygons for distance fog by swapping colour table 0
	    (one 4k poke) instead of calling pal() 48 times

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
SHADE = {1, 0.66, 0.42, 0.22}        -- keep in sync with RAMP in gen_art.py

PAL16 = {0x000000, 0x1d2b53, 0x7e2553, 0x008751, 0xab5236, 0x5f574f, 0xc2c3c7, 0xfff1e8,
         0xff004d, 0xffa300, 0xffec27, 0x00e436, 0x29adff, 0x83769c, 0xff77a8, 0xffccaa}

fog_tables = {}                      -- [0..3] colour table 0 variants (u8 64x64)
local cur_fog = -1

function fsin(a) return -sin(a) end  -- Picotron's sin() is inverted (PICO-8 style)

-- rows 1..3 of the palette are darker copies of row 0, cooled a little
function gfx_palette()
	for k = 1, 3 do
		local f = SHADE[k + 1]
		for c = 0, 15 do
			local rgb = PAL16[c + 1]
			local r = flr(((rgb >> 16) & 0xff) * f)
			local g = flr(((rgb >> 8) & 0xff) * f)
			local b = min(255, flr((rgb & 0xff) * f + 6 * k))
			pal(16 * k + c, (r << 16) | (g << 8) | b, 2)
		end
	end
end

function gfx_init()
	gfx_palette()
	-- 2. shaded copies of every sprite 0..63 (textures, billboards)
	for i = 0, 63 do
		local s = get_spr(i)
		if s and s:width() > 1 then
			set_spr(VAR_BASE + i * 4, s)
			local mask = s:min(1)                    -- 1 where opaque, 0 where transparent
			for k = 1, 3 do
				set_spr(VAR_BASE + i * 4 + k, s:add(mask:mul(16 * k)))
			end
		end
	end
	-- 3. fog colour tables: remap the OUTPUT colour of table 0 k levels darker
	--    (layout agnostic: we only rewrite the values, never the indexing)
	local base = userdata("u8", 64, 64)
	base:peek(0x8000)
	local shift = {}
	for k = 0, 3 do
		local t = userdata("u8", 64, 64)
		for c = 0, 63 do
			local lvl = min(3, flr(c / 16) + k)
			shift[c] = (c == 0) and 0 or (c % 16 + 16 * lvl)
		end
		for i = 0, 4095 do t[i] = shift[base[i]] end
		fog_tables[k] = t
	end
	cur_fog = 0
end

function set_fog(k)
	if k ~= cur_fog then
		fog_tables[k]:poke(0x8000)
		cur_fog = k
	end
end

-- Quake surface cache: tile the base texture over each surface's texel
-- rectangle, then darken it luxel-run by luxel-run from the baked lightmap.
function build_surfaces()
	local L = LEVEL.luxel
	local texels = 0
	for id, s in ipairs(LEVEL.surfs) do
		local tex, uo, vo, w, h, lw, lh, lm = s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8]
		local ud = userdata("u8", w, h)
		local src = get_spr(tex)
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
		-- light: one add() per horizontal run of equal luxels
		for j = 0, lh - 1 do
			local y0 = j * L
			local rows = min(L, h - y0)
			local i = 0
			while i < lw do
				local c = ord(lm, j * lw + i + 1) - 48
				local i2 = i
				while i2 + 1 < lw and ord(lm, j * lw + i2 + 2) - 48 == c do i2 = i2 + 1 end
				if c > 0 then
					local x0 = i * L
					local len = min((i2 + 1) * L, w) - x0
					ud:add(16 * c, true, 0, y0 * w + x0, len, 0, w, rows)
				end
				i = i2 + 1
			end
		end
		set_spr(SURF_BASE + id, ud)
		texels = texels + w * h
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
			local ua0, ua1, va0, va1 = pu[a0] * wa0, pu[a1] * wa1, pv[a0] * wa0, pv[a1] * wa1
			local ub0, ub1, vb0, vb1 = pu[b0] * wb0, pu[b1] * wb1, pv[b0] * wb0, pv[b1] * wb1
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
	return n - 2
end
