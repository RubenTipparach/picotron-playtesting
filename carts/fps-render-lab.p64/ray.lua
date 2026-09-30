--[[pod_format="raw"]]
--[[
	ray.lua - the RAYCASTER renderer (Wolfenstein / early-Doom school).

	The world is the 64u grid map2bsp.py sliced out of the brushes at eye
	height: one floor height (0), one ceiling height (128), walls are whole
	cells. Everything costs O(screen width), never O(level size):

	  floor/ceiling  one tline3d per screen row in MAP mode: each row is a
	                 line of constant depth, so its uv is affine; the i16 map
	                 holds a (pre-shaded) texture per cell, so every cell can
	                 have its own floor/ceiling texture and the map wraps for
	                 free
	  walls          DDA per column; each column = 2 textured segments (one
	                 per 64u texture repeat) pushed into ONE batched tline3d
	                 call for the whole screen (~960 lines, 1 Lua->C call)
	  sprites        billboards clipped per column against a 1D z-buffer,
	                 also batched into one tline3d call
	Looking up/down is faked by y-shearing (moving the horizon).
]]

WALL_H = 128
RAY_FOG = 360               -- world units per extra shade level

local G
local wall_rows = userdata("f64", 11, 1024)
local spr_rows = userdata("f64", 11, 4096)
local zbuf = {}
local floor_maps, ceil_maps = {}, {}
local rcells                -- grid cells with a forced solid border (DDA needs no bounds checks)
ray_stats = {cols = 0, rows = 0, sprites = 0, lines = 0}

function ray_init()
	G = LEVEL.grid
	-- 32x32 i16 maps (power of 2 so tline3d wraps them), one per shade level
	for k = 0, 3 do
		local fm, cm = userdata("i16", 32, 32), userdata("i16", 32, 32)
		for gy = 0, G.h - 1 do
			for gx = 0, G.w - 1 do
				local i = gy * G.w + gx + 1
				local my = G.h - 1 - gy           -- map rows run south, like Quake's v
				local ft, ct = G.floor[i], G.ceil[i]
				if ft >= 0 then fm:set(gx, my, VAR_BASE + ft * 4 + k) end
				if ct >= 0 then cm:set(gx, my, VAR_BASE + ct * 4 + (ct == 12 and 0 or k)) end
			end
		end
		floor_maps[k], ceil_maps[k] = fm, cm
	end
	poke(0x550e, 32) poke(0x550f, 32)         -- map tile size = 32px
	rcells = {}
	for gy = 0, G.h - 1 do
		for gx = 0, G.w - 1 do
			local i = gy * G.w + gx + 1
			local edge = gx == 0 or gy == 0 or gx == G.w - 1 or gy == G.h - 1
			rcells[i] = edge and 1 or G.cells[i]
		end
	end
end

local function fogk(d) return min(3, flr(d / RAY_FOG)) end

-- cam: {x,y,eye,yaw,pitch}; things: list of billboards {x,y,z,spr,w,h,sw,sh}
function ray_draw(cam, things)
	local px, py, eye = cam.x, cam.y, cam.eye
	local fx, fy = cos(cam.yaw), fsin(cam.yaw)
	local rx, ry = fsin(cam.yaw), -cos(cam.yaw)
	local hy = CY + fsin(cam.pitch) / cos(cam.pitch) * FOCAL   -- y-shear horizon
	local x0w, y0w = G.x0, G.y0
	local ytop = G.y0 + G.h * CELL
	local rows = 0
	local inv_fog = 1 / RAY_FOG

	-- 1. floor + ceiling rows (map mode, per-cell textures)
	local kl, kr = (0.5 - CX) / FOCAL, (SW - 0.5 - CX) / FOCAL
	local lx, ly = fx + rx * kl, fy + ry * kl
	local rxx, ryy = fx + rx * kr, fy + ry * kr
	for y = 0, SH - 1 do
		local dyp = y + 0.5 - hy
		local d, maps
		if dyp > 0 then
			d = eye * FOCAL / dyp
			maps = floor_maps
		elseif dyp < 0 then
			d = (WALL_H - eye) * FOCAL / -dyp
			maps = ceil_maps
		end
		if d then
			local ax, ay = px + lx * d, py + ly * d
			local bx, by = px + rxx * d, py + ryy * d
			local fk = flr(d * inv_fog)
			tline3d(maps[fk > 3 and 3 or fk], 0, y, SW - 1, y,
				(ax - x0w) / CELL, (ytop - ay) / CELL,
				(bx - x0w) / CELL, (ytop - by) / CELL)
			rows = rows + 1
		end
	end

	-- 2. walls: DDA per column into one batch. rcells has a solid border, so
	-- the inner loop needs no bounds checks and walks a flat cell index.
	local posx, posy = (px - x0w) / CELL, (py - y0w) / CELL
	local n = 0
	local cells, gw, gtex, glight = rcells, G.w, G.tex, G.light
	local pmx, pmy = flr(posx), flr(posy)
	local start = pmy * gw + pmx + 1
	local seg_top, seg_mid = WALL_H - eye, WALL_H - 64 - eye
	for x = 0, SW - 1 do
		local k = (x + 0.5 - CX) / FOCAL
		local dx, dy = fx + rx * k, fy + ry * k
		local ddx = dx == 0 and 1e30 or abs(1 / dx)
		local ddy = dy == 0 and 1e30 or abs(1 / dy)
		local sx, syw, sdx, sdy
		if dx < 0 then sx = -1; sdx = (posx - pmx) * ddx else sx = 1; sdx = (pmx + 1 - posx) * ddx end
		if dy < 0 then syw = -gw; sdy = (posy - pmy) * ddy else syw = gw; sdy = (pmy + 1 - posy) * ddy end
		local i, side = start, 0
		repeat
			if sdx < sdy then sdx = sdx + ddx; i = i + sx; side = 0
			else sdy = sdy + ddy; i = i + syw; side = 1 end
		until cells[i] ~= 0
		local perp, prev, t, u
		local tx = gtex[i]
		if side == 0 then
			perp = sdx - ddx
			prev = i - sx
			u = ((py + perp * dy * CELL) / 2) % 32
			t = tx and (sx > 0 and tx[2] or tx[1]) or 0
		else
			perp = sdy - ddy
			prev = i - syw
			u = ((px + perp * dx * CELL) / 2) % 32
			t = tx and (syw > 0 and tx[4] or tx[3]) or 0
		end
		local dist = perp * CELL
		if dist < 1 then dist = 1 end
		zbuf[x] = dist
		local lvl = (glight[prev] or 2) + flr(dist * inv_fog)
		if lvl > 3 then lvl = 3 end
		local sprn = VAR_BASE + t * 4 + lvl
		local s = FOCAL / dist
		-- two 64u segments (z 128..64 and 64..0), each v 0..32: no wrapping needed
		local ya, ym, yb = hy - seg_top * s, hy - seg_mid * s, hy + eye * s
		if ym > 0 and ya < SH then
			local va, y0, y1, vb = 0, ya, ym, 32
			if y0 < 0 then va = -y0 / (ym - ya) * 32; y0 = 0 end
			if y1 > SH then vb = (SH - ya) / (ym - ya) * 32; y1 = SH end
			wall_rows:set(0, n, sprn, x, y0, x, y1, u, va, u, vb, 1, 1)
			n = n + 1
		end
		if yb > 0 and ym < SH then
			local va, y0, y1, vb = 0, ym, yb, 32
			if y0 < 0 then va = -y0 / (yb - ym) * 32; y0 = 0 end
			if y1 > SH then vb = (SH - ym) / (yb - ym) * 32; y1 = SH end
			wall_rows:set(0, n, sprn, x, y0, x, y1, u, va, u, vb, 1, 1)
			n = n + 1
		end
	end
	if n > 0 then tline3d(wall_rows, 0, n) end

	-- 3. billboards, far to near, clipped per column by the z-buffer
	local list = {}
	for th in all(things) do
		local ddx, ddy = th.x - px, th.y - py
		local cz = ddx * fx + ddy * fy
		if cz > 8 then
			th._cz = cz
			th._cx = ddx * rx + ddy * ry
			-- insertion sort, farthest first (Picotron has no table.sort)
			local j = #list
			add(list, th)
			while j >= 1 and list[j]._cz < cz do list[j + 1] = list[j]; j = j - 1 end
			list[j + 1] = th
		end
	end
	local m = 0
	for th in all(list) do
		local cz = th._cz
		local s = FOCAL / cz
		local sxc = CX + th._cx * s
		local hw = th.w * 0.5 * s
		local xl, xr = sxc - hw, sxc + hw
		local zb = th.z or 0
		local ya = hy - (zb + th.h - eye) * s
		local yb = hy - (zb - eye) * s
		local lvl = min(3, (th.fullbright and 0 or grid_light(th.x, th.y)) + (th.fullbright and 0 or fogk(cz)))
		local sprn = VAR_BASE + th.spr * 4 + lvl
		local va, vb = 0, th.sh
		if ya < 0 then va = (0 - ya) / (yb - ya) * th.sh; ya = 0 end
		if yb > SH then vb = va + (SH - ya) / (yb - ya) * (th.sh - va); yb = SH end
		if yb > ya then
			for x = max(0, flr(xl)), min(SW - 1, flr(xr)) do
				if cz < zbuf[x] and m < 4096 then
					local u = (x + 0.5 - xl) / (xr - xl) * th.sw
					if th.flip then u = th.sw - u end
					spr_rows:set(0, m, sprn, x, ya, x, yb, u, va, u, vb, 1, 1)
					m = m + 1
				end
			end
		end
	end
	if m > 0 then tline3d(spr_rows, 0, m) end
	ray_stats.cols, ray_stats.rows, ray_stats.sprites = n, rows, #list
	ray_stats.lines = n + m + rows
end
