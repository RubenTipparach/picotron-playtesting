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
	  doors          Wolfenstein-style: a door cell stops the DDA, the ray is
	                 tested against the panel half a cell further in and
	                 passes the part that has slid into the wall
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
sky_cells = {}              -- centres of open-sky ceiling cells
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
				-- sky cells are holes in the ceiling: the far sky pass shows through
				if ct >= 0 then cm:set(gx, my, ct == 12 and SKY_HOLE or (VAR_BASE + ct * 4 + k)) end
				if ct == 12 and k == 0 then add(sky_cells, {(gx + 0.5) * CELL + G.x0, (gy + 0.5) * CELL + G.y0}) end
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
	-- the sky pass (rows above the horizon, a cloud plane SKY_H above the eye,
	-- centred on it) only runs when an open-sky cell is near enough to show
	local sky = false
	for c in all(sky_cells) do
		local dx, dy = c[1] - px, c[2] - py
		if dx * dx + dy * dy < 1800 * 1800 then sky = true break end
	end
	local sky_spr = VAR_BASE + SKY_SPR * 4
	for y = 0, SH - 1 do
		local dyp = y + 0.5 - hy
		local d, maps
		if sky and dyp < 0 then
			-- the loop mask wraps the 32px sky; map mode must not see it
			local ds = SKY_H * FOCAL / -dyp / SKY_TEXEL
			poke2(0x5534, 128, 128)
			tline3d(sky_spr, 0, y, SW - 1, y, lx * ds, -ly * ds, rxx * ds, -ryy * ds)
			poke2(0x5534, 0, 0)
		end
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
	local cells, gw, gtex, glight, doors = rcells, G.w, G.tex, G.light, DOOR_AT
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
		local perp, prev, t, u
		while true do
			repeat
				if sdx < sdy then sdx = sdx + ddx; i = i + sx; side = 0
				else sdy = sdy + ddy; i = i + syw; side = 1 end
			until cells[i] ~= 0
			if cells[i] ~= 2 then break end
			-- door cell: the panel sits mid-cell; entering along the tunnel the
			-- ray meets it half a step on (unless it leaves the cell first)
			local d = doors[i]
			local pd, f
			if side == 0 and d.sy ~= 0 then
				pd = sdx - ddx * 0.5
				if pd <= sdy then f = posy + pd * dy end
			elseif side == 1 and d.sx ~= 0 then
				pd = sdy - ddy * 0.5
				if pd <= sdx then f = posx + pd * dx end
			end
			if f then
				f = f - flr(f)
				local o = d.open
				local sd = d.sx + d.sy
				if (sd > 0 and f >= o) or (sd < 0 and f <= 1 - o) then
					perp, prev, t = pd, i, d.tex
					u = (sd > 0 and (f - o) or (1 - o - f)) * 32
					break
				end
			end
		end
		if not t then
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
	local xs = CX / FOCAL                  -- half screen width per unit depth
	for th in all(things) do
		local ddx, ddy = th.x - px, th.y - py
		local cz = ddx * fx + ddy * fy
		local cx = ddx * rx + ddy * ry
		-- only on-screen sprites that some wall column doesn't hide get
		-- sorted (the bigger level has ~90 things, many behind closed doors)
		local vis = cz > 8 and cz < 2400 and abs(cx) < cz * xs + th.w
		if vis then
			local sxc, hw = CX + cx * FOCAL / cz, th.w * 0.5 * FOCAL / cz
			local xa, xb = max(0, flr(sxc - hw)), min(SW - 1, flr(sxc + hw))
			local xm = flr((xa + xb) / 2)
			vis = xa <= xb and (cz < zbuf[xa] or cz < zbuf[xm] or cz < zbuf[xb])
		end
		if vis then
			th._cz = cz
			th._cx = cx
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
		local ox, oy = SPR_OX[th.spr] or 0, SPR_OY[th.spr] or 0
		local va, vb = 0, th.sh
		if ya < 0 then va = (0 - ya) / (yb - ya) * th.sh; ya = 0 end
		if yb > SH then vb = va + (SH - ya) / (yb - ya) * (th.sh - va); yb = SH end
		va, vb = va + oy, vb + oy
		if yb > ya then
			for x = max(0, flr(xl)), min(SW - 1, flr(xr)) do
				if cz < zbuf[x] and m < 4096 then
					local u = (x + 0.5 - xl) / (xr - xl) * th.sw
					if th.flip then u = th.sw - u end
					u = u + ox
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
