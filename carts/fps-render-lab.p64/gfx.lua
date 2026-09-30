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

	The rasteriser (textri) is the batched-scanline tline3d triangle filler
	used in RubenTipparach/ld58-pictoron-3d-engine: per triangle half it
	builds every scanline's tline3d args with 3 userdata ops and draws them
	all with ONE tline3d(userdata) call.
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

function gfx_init()
	-- 1. palette: rows 1..3 are darker copies of row 0, cooled a little
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

-- textri: perspective-correct textured triangle via batched tline3d scanlines.
-- vd: 6x3 f64 userdata, rows = x,y,z,w,u,v (w = 1/z). Sorted in place by y.
local scan = userdata("f64", 11, 270)
function textri(spr, vd)
	vd:sort(1)
	local x1, y1, w1, y2, w2, x3, y3, w3 =
		vd[0], vd[1], vd[3], vd[7], vd[9], vd[12], vd[13], vd[15]
	local u1, v1, u3, v3 = vd[4] * w1, vd[5] * w1, vd[16] * w3, vd[17] * w3
	local t = (y2 - y1) / (y3 - y1)
	local ud, vvd = (u3 - u1) * t + u1, (v3 - v1) * t + v1
	local a = vec(spr, x1, y1, x1, y1, u1, v1, u1, v1, w1, w1)
	local b = vec(spr, vd[6], y2, (x3 - x1) * t + x1, y2,
		vd[10] * w2, vd[11] * w2, ud, vvd, w2, (w3 - w1) * t + w1)
	local start_y = y1 < -1 and -1 or flr(y1)
	local mid_y = y2 < -1 and -1 or y2 > SH - 1 and SH - 1 or flr(y2)
	local stop_y = y3 <= SH - 1 and flr(y3) or SH - 1
	local dy = mid_y - start_y
	if dy > 0 then
		local slope = (b - a):div(y2 - y1)
		scan:copy(slope * (start_y + 1 - y1) + a, true, 0, 0, 11)
			:copy(slope, true, 0, 11, 11, 0, 11, dy - 1)
		tline3d(scan:add(scan, true, 0, 11, 11, 11, 11, dy - 1), 0, dy)
	end
	dy = stop_y - mid_y
	if dy > 0 then
		local slope = (vec(spr, x3, y3, x3, y3, u3, v3, u3, v3, w3, w3) - b) / (y3 - y2)
		scan:copy(slope * (mid_y + 1 - y2) + b, true, 0, 0, 11)
			:copy(slope, true, 0, 11, 11, 0, 11, dy - 1)
		tline3d(scan:add(scan, true, 0, 11, 11, 11, 11, dy - 1), 0, dy)
	end
end

-- fill a convex screen polygon (arrays of x,y,w,u,v; 1-based) as a fan
local vd = userdata("f64", 6, 3)
function fill_poly(spr, n, px, py, pw, pu, pv)
	local tris = 0
	for i = 2, n - 1 do
		vd[0], vd[1], vd[3], vd[4], vd[5] = px[1], py[1], pw[1], pu[1], pv[1]
		vd[6], vd[7], vd[9], vd[10], vd[11] = px[i], py[i], pw[i], pu[i], pv[i]
		vd[12], vd[13], vd[15], vd[16], vd[17] = px[i + 1], py[i + 1], pw[i + 1], pu[i + 1], pv[i + 1]
		if vd[1] ~= vd[7] or vd[1] ~= vd[13] then
			textri(spr, vd)
			tris = tris + 1
		end
	end
	return tris
end
