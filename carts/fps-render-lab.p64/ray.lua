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
ray_stats = {cols = 0, rows = 0, sprites = 0, steps = 0}

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
			tline3d(maps[fogk(d)], 0, y, SW - 1, y,
				(ax - x0w) / CELL, (ytop - ay) / CELL,
				(bx - x0w) / CELL, (ytop - by) / CELL)
			rows = rows + 1
		end
	end

	-- 2. walls: DDA per column into one batch
	local posx, posy = (px - x0w) / CELL, (py - y0w) / CELL
	local n, steps = 0, 0
	local cells, gw, gh, gtex, glight = G.cells, G.w, G.h, G.tex, G.light
	local inv_fog = 1 / RAY_FOG
	for x = 0, SW - 1 do
		local k = (x + 0.5 - CX) / FOCAL
		local dx, dy = fx + rx * k, fy + ry * k
		local mx, my = flr(posx), flr(posy)
		local ddx = dx == 0 and 1e30 or abs(1 / dx)
		local ddy = dy == 0 and 1e30 or abs(1 / dy)
		local sx, sy, sdx, sdy
		if dx < 0 then sx = -1; sdx = (posx - mx) * ddx else sx = 1; sdx = (mx + 1 - posx) * ddx end
		if dy < 0 then sy = -1; sdy = (posy - my) * ddy else sy = 1; sdy = (my + 1 - posy) * ddy end
		local side, lastlight = 0, 0
		local prev = my * gw + mx + 1
		for _ = 1, 64 do
			if sdx < sdy then sdx = sdx + ddx; mx = mx + sx; side = 0
			else sdy = sdy + ddy; my = my + sy; side = 1 end
			steps = steps + 1
			if mx < 0 or my < 0 or mx >= gw or my >= gh then break end
			local i = my * gw + mx + 1
			if cells[i] ~= 0 then break end
			prev = i
		end
		local perp = side == 0 and (sdx - ddx) or (sdy - ddy)
		local dist = perp * CELL
		if dist < 1 then dist = 1 end
		zbuf[x] = dist
		-- texture + u in world-aligned texels (matches the Quake uv of the 3D mode)
		local t, u
		local ci = my * gw + mx + 1
		local tx = gtex[ci]
		if side == 0 then
			local wy = py + perp * dy * CELL
			u = (wy / 2) % 32
			t = tx and (sx > 0 and tx[2] or tx[1]) or 0
		else
			local wx = px + perp * dx * CELL
			u = (wx / 2) % 32
			t = tx and (sy > 0 and tx[4] or tx[3]) or 0
		end
		local lvl = (glight[prev] or 2) + flr(dist * inv_fog)
		if lvl > 3 then lvl = 3 end
		local sprn = VAR_BASE + t * 4 + lvl
		local s = FOCAL / dist
		-- two 64u segments (z 128..64 and 64..0), each v 0..32: no wrapping needed
		for seg = 0, 1 do
			local za = WALL_H - seg * 64
			local ya, yb = hy - (za - eye) * s, hy - (za - 64 - eye) * s
			local va, vb = 0, 32
			if ya < 0 then va = (0 - ya) / (yb - ya) * 32; ya = 0 end
			if yb > SH then vb = va + (SH - ya) / (yb - ya) * (32 - va); yb = SH end
			if yb > ya then
				local o = n * 11
				wall_rows[o], wall_rows[o + 1], wall_rows[o + 2], wall_rows[o + 3], wall_rows[o + 4] = sprn, x, ya, x, yb
				wall_rows[o + 5], wall_rows[o + 6], wall_rows[o + 7], wall_rows[o + 8] = u, va, u, vb
				wall_rows[o + 9], wall_rows[o + 10] = 1, 1
				n = n + 1
			end
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
					local o = m * 11
					spr_rows[o], spr_rows[o + 1], spr_rows[o + 2], spr_rows[o + 3], spr_rows[o + 4] = sprn, x, ya, x, yb
					spr_rows[o + 5], spr_rows[o + 6], spr_rows[o + 7], spr_rows[o + 8] = u, va, u, vb
					spr_rows[o + 9], spr_rows[o + 10] = 1, 1
					m = m + 1
				end
			end
		end
	end
	if m > 0 then tline3d(spr_rows, 0, m) end
	ray_stats.cols, ray_stats.rows, ray_stats.sprites, ray_stats.steps = n, rows, #list, steps
	ray_stats.lines = n + m + rows
end
