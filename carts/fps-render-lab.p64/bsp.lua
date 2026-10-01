--[[pod_format="raw"]]
--[[
	bsp.lua - the TRUE 3D renderer (Quake school).

	The level is the polygon soup map2bsp.py compiled from the TrenchBroom
	.map: CSG'd brush faces, merged into big rectangles, lit by a baked
	lightmap living inside each polygon's cached surface texture, and stored
	in a polygon BSP tree.

	Per frame:
	  1. ONE matmul3d() call moves every level vertex into camera space
	     (C speed; Lua never touches a vertex it won't draw)
	  2. walk the BSP back-to-front from the eye (painter's algorithm that is
	     always correct -> no z-buffer, no sorting), skipping subtrees whose
	     bounding box is outside the view frustum
	  3. each visible polygon: backface test for free (which side of its node
	     the eye is on), near-plane clip, project, fog level -> colour table,
	     fill_poly(): one batched tline3d per polygon
	  4. monsters/props/items are dropped into the BSP leaf they stand in and
	     drawn when the walk reaches that leaf, so they sort against walls
	     correctly too. Props are real meshes here (billboards in the
	     raycaster); monsters/items stay billboards (sspr) in both.

	Sectors: map2bsp.py splits the level into sectors at its doors. Each frame
	the visible set floods out from the player's sector through doors that are
	open AND on screen; every BSP node carries the bitmask of sectors below it,
	so a subtree lying wholly behind closed doors is skipped in one test. Doors
	themselves are sliding boxes drawn like objects, clipped to the doorway.
]]

NEAR = 4
BSP_FOG = 360               -- world units per extra shade level
MESH_LOD = 560              -- props further than this draw as their billboard

local nodes, polys
local Vud, Cud, Sud, Wud, ONES     -- verts, camera space, screen space (sx,sy,w), 1/z
local M = userdata("f64", 3, 4)
local ex, ey, ez                       -- eye
local rx, ry, rz, ux, uy, uz, fx, fy, fz
local planes = {}                      -- frustum (inward normals through the eye)
local slots, sub = {}, {}              -- objects per leaf slot / per subtree
bsp_stats = {nodes = 0, polys = 0, tris = 0, culled = 0, objs = 0, sectors = 0, nsec = 0}
local vis = -1                         -- visible sectors (bitmask) this frame
local surf_bit, turb_spr = {}, {}      -- per surface: sector bit; scrolling texture sprite
local SKY_TEX = 12

-- scratch polygon buffers
local qx, qy, qz, qu, qv = {}, {}, {}, {}, {}
local ox, oy, oz, ou, ov = {}, {}, {}, {}, {}
local px, py, pw, pu, pv = {}, {}, {}, {}, {}

function bsp_init()
	nodes, polys = LEVEL.nodes, LEVEL.polys
	local vs = LEVEL.verts
	local nv = #vs / 3
	Vud = userdata("f64", 3, nv)
	Cud = userdata("f64", 3, nv)
	Sud = userdata("f64", 3, nv)
	Wud = userdata("f64", nv)
	ONES = userdata("f64", nv)
	for i = 0, nv - 1 do ONES[i] = 1 end
	for i = 0, #vs - 1 do Vud[i] = vs[i + 1] end
	for _, m in pairs(MESHES) do mesh_prepare(m) end
	for id, sf in ipairs(LEVEL.surfs) do
		local sec = sf[10] or 0
		surf_bit[id] = sec > 0 and (1 << (sec - 1)) or -1
		if sf[9] == 1 then turb_spr[id] = VAR_BASE + sf[1] * 4 end
	end
	bsp_stats.nsec = LEVEL.sectors or 0
	-- bounding sphere per node (centre, radius) for the frustum test
	for n in all(nodes) do
		local hx, hy, hz = (n[11] - n[8]) / 2, (n[12] - n[9]) / 2, (n[13] - n[10]) / 2
		n[15], n[16], n[17] = n[8] + hx, n[9] + hy, n[10] + hz
		n[18] = sqrt(hx * hx + hy * hy + hz * hz)
	end
end

local function clip_near(n)
	local m = 0
	for i = 1, n do
		local j = i % n + 1
		local zi, zj = qz[i], qz[j]
		if zi >= NEAR then
			m = m + 1
			ox[m], oy[m], oz[m], ou[m], ov[m] = qx[i], qy[i], zi, qu[i], qv[i]
		end
		if (zi >= NEAR) ~= (zj >= NEAR) then
			local t = (NEAR - zi) / (zj - zi)
			m = m + 1
			ox[m] = qx[i] + (qx[j] - qx[i]) * t
			oy[m] = qy[i] + (qy[j] - qy[i]) * t
			oz[m] = NEAR
			ou[m] = qu[i] + (qu[j] - qu[i]) * t
			ov[m] = qv[i] + (qv[j] - qv[i]) * t
		end
	end
	for i = 1, m do qx[i], qy[i], qz[i], qu[i], qv[i] = ox[i], oy[i], oz[i], ou[i], ov[i] end
	return m
end

-- q* (camera space, n verts) -> clipped, projected, filled. returns tris
local function draw_q(spr, n)
	local clip = false
	for i = 1, n do if qz[i] < NEAR then clip = true break end end
	if clip then
		n = clip_near(n)
		if n < 3 then return 0 end
	end
	local minx, maxx, miny, maxy = 1e9, -1e9, 1e9, -1e9
	for i = 1, n do
		local w = 1 / qz[i]
		local sx, sy = CX + qx[i] * FOCAL * w, CY - qy[i] * FOCAL * w
		px[i], py[i], pw[i], pu[i], pv[i] = sx, sy, w, qu[i], qv[i]
		if sx < minx then minx = sx end
		if sx > maxx then maxx = sx end
		if sy < miny then miny = sy end
		if sy > maxy then maxy = sy end
	end
	if maxx < 0 or minx >= SW or maxy < 0 or miny >= SH then return 0 end
	return fill_poly(spr, n, px, py, pw, pu, pv)
end

local INV_NEAR = 1 / NEAR
local function draw_level_poly(p)
	local n = flr((#p - 5) / 3)
	local dx, dy, dz = p[3] - ex, p[4] - ey, p[5] - ez
	local fog = fog_for(sqrt(dx * dx + dy * dy + dz * dz) / BSP_FOG)
	-- sky / slime: the scrolling 32x32 texture, wrapped (tline3d loop mask),
	-- uvs are absolute texels; the sky ignores fog
	local spr = turb_spr[p[1]]
	if spr then
		if spr == VAR_BASE + SKY_TEX * 4 then fog = 0 end
		poke2(0x5534, 32, 32)
	else
		spr = SURF_BASE + p[1]
	end
	local t
	-- common path: screen coords were batch-projected in C (Sud); w = 1/z
	-- doubles as the near-plane test (z < NEAR <=> w outside (0, 1/NEAR])
	local minx, maxx, miny, maxy = 1e9, -1e9, 1e9, -1e9
	local clip = false
	for k = 1, n do
		local b = 3 + k * 3
		local sx, sy, w = Sud:get(0, p[b] - 1, 3)
		if not (w > 0 and w <= INV_NEAR) then clip = true break end
		px[k], py[k], pw[k], pu[k], pv[k] = sx, sy, w, p[b + 1], p[b + 2]
		if sx < minx then minx = sx end
		if sx > maxx then maxx = sx end
		if sy < miny then miny = sy end
		if sy > maxy then maxy = sy end
	end
	if clip then
		-- rare path: camera-space verts through the near-plane clipper
		local front = false
		for k = 1, n do
			local b = 3 + k * 3
			local z
			qx[k], qy[k], z = Cud:get(0, p[b] - 1, 3)
			qz[k], qu[k], qv[k] = z, p[b + 1], p[b + 2]
			if z >= NEAR then front = true end
		end
		if front then
			set_fog(fog)
			t = draw_q(spr, n)
		else
			t = 0                                   -- wholly behind the eye
		end
	elseif maxx < 0 or minx >= SW or maxy < 0 or miny >= SH then
		t = 0
	else
		set_fog(fog)
		t = fill_poly(spr, n, px, py, pw, pu, pv)
	end
	if spr < SURF_BASE then poke2(0x5534, 0, 0) end
	if t > 0 then
		bsp_stats.polys = bsp_stats.polys + 1
		bsp_stats.tris = bsp_stats.tris + t
	end
end

-- ------------------------------------------------------------- objects ---
function mesh_prepare(m)
	m.fn = {}
	local v = m.verts
	for fi, f in ipairs(m.faces) do
		local a, b, c = f[3], f[6], f[9]
		local ax, ay, az = v[a * 3 - 2], v[a * 3 - 1], v[a * 3]
		local bx, by, bz = v[b * 3 - 2] - ax, v[b * 3 - 1] - ay, v[b * 3] - az
		local cx, cy, cz = v[c * 3 - 2] - ax, v[c * 3 - 1] - ay, v[c * 3] - az
		m.fn[fi] = {by * cz - bz * cy, bz * cx - bx * cz, bx * cy - by * cx}
	end
end

local wv = {}
local function draw_mesh(m, x, y, z, yaw, lvl)
	local c, s = cos(yaw), fsin(yaw)
	local v = m.verts
	for i = 1, #v, 3 do
		local lx, ly = v[i], v[i + 1]
		local wx, wy, wz = x + lx * c - ly * s, y + lx * s + ly * c, z + v[i + 2]
		local dx, dy, dz = wx - ex, wy - ey, wz - ez
		wv[i], wv[i + 1], wv[i + 2] = dx * rx + dy * ry + dz * rz, dx * ux + dy * uy + dz * uz, dx * fx + dy * fy + dz * fz
	end
	local tris = 0
	for fi, f in ipairs(m.faces) do
		local nn = m.fn[fi]
		local nx, ny = nn[1] * c - nn[2] * s, nn[1] * s + nn[2] * c
		local a = f[3]
		-- backface: eye relative to the face's first vertex (camera space dot)
		local ax, ay, az = v[a * 3 - 2], v[a * 3 - 1], v[a * 3]
		local wx, wy, wz = x + ax * c - ay * s, y + ax * s + ay * c, z + az
		if nx * (ex - wx) + ny * (ey - wy) + nn[3] * (ez - wz) > 0 then
			local n = f[2]
			for k = 1, n do
				local vi = f[k * 3] * 3 - 2
				qx[k], qy[k], qz[k], qu[k], qv[k] = wv[vi], wv[vi + 1], wv[vi + 2], f[k * 3 + 1], f[k * 3 + 2]
			end
			tris = tris + draw_q(VAR_BASE + f[1] * 4 + lvl, n)
		end
	end
	return tris
end

local function sphere_visible(x, y, z, r)
	for i = 1, 4 do
		local p = planes[i]
		if p[1] * (x - ex) + p[2] * (y - ey) + p[3] * (z - ez) < -r * p[4] then return false end
	end
	return true
end

-- camera-facing billboard: a constant-depth quad == one scaled sspr
local function billboard(o, spr, w, h, sw, sh, zoff, lvl)
	local dx, dy, dz = o.x - ex, o.y - ey, (o.z or 0) + zoff + h / 2 - ez
	local cz = dx * fx + dy * fy + dz * fz
	if cz < NEAR then return end
	local cx = dx * rx + dy * ry + dz * rz
	local cy = dx * ux + dy * uy + dz * uz
	local s = FOCAL / cz
	local ww, hh = w * s, h * s
	local sx, sy = CX + cx * s - ww / 2, CY - cy * s - hh / 2
	if sx + ww < 0 or sx >= SW or sy + hh < 0 or sy >= SH then return end
	sspr(VAR_BASE + spr * 4 + lvl, SPR_OX[spr] or 0, SPR_OY[spr] or 0, sw, sh, sx, sy, ww, hh, o.flip)
end

-- door panel: the part of the closed box still in the doorway (the rest has
-- slid into the wall). 4 vertical faces, texture moves with the panel.
local dxs, dys, dus = {}, {}, {}
local function door_face(spr, x0, y0, x1, y1, z0, z1, u0, u1)
	local nx, ny = y1 - y0, x0 - x1               -- outward for the winding below
	if nx * (ex - x0) + ny * (ey - y0) <= 0 then return 0 end
	dxs[1], dys[1], dus[1] = x0, y0, u0
	dxs[2], dys[2], dus[2] = x1, y1, u1
	for k = 1, 4 do
		local j = (k == 1 or k == 4) and 1 or 2
		local z = (k <= 2) and z1 or z0
		local ddx, ddy, ddz = dxs[j] - ex, dys[j] - ey, z - ez
		qx[k], qy[k], qz[k] = ddx * rx + ddy * ry + ddz * rz, ddx * ux + ddy * uy + ddz * uz, ddx * fx + ddy * fy + ddz * fz
		qu[k], qv[k] = dus[j], (k <= 2) and 0 or (z1 - z0) / 2
	end
	return draw_q(spr, 4)
end

local function draw_door(d, lvl)
	local o = d.open * d.travel
	local x0, y0, x1, y1 = d.x0, d.y0, d.x1, d.y1
	if d.sx > 0 then x0 = x0 + o elseif d.sx < 0 then x1 = x1 - o end
	if d.sy > 0 then y0 = y0 + o elseif d.sy < 0 then y1 = y1 - o end
	if x1 - x0 < 0.5 or y1 - y0 < 0.5 then return 0 end
	local spr, z0, z1 = VAR_BASE + d.tex * 4 + lvl, d.z0, d.z1
	-- u in texels from the panel's leading edge (so the texture slides with it)
	local ax0, ax1, bx0, bx1 = 0, (x1 - x0) / 2, 0, (y1 - y0) / 2
	if d.sx < 0 then ax0, ax1 = (x1 - x0) / 2, 0 end
	if d.sy < 0 then bx0, bx1 = (y1 - y0) / 2, 0 end
	poke2(0x5534, 32, 32)                      -- 128u tall panel: v wraps the 32px texture
	local t = door_face(spr, x0, y0, x1, y0, z0, z1, ax0, ax1)       -- south (-y)
		+ door_face(spr, x1, y1, x0, y1, z0, z1, ax1, ax0)           -- north (+y)
		+ door_face(spr, x0, y1, x0, y0, z0, z1, bx1, bx0)           -- west  (-x)
		+ door_face(spr, x1, y0, x1, y1, z0, z1, bx0, bx1)           -- east  (+x)
	poke2(0x5534, 0, 0)
	return t
end

local function draw_object(o)
	-- off-screen objects cost nothing (objects under culled subtrees land here too)
	if not sphere_visible(o.x, o.y, (o.z or 0) + (o.h or 16) * 0.5, o.rad or 40) then return end
	local dist = sqrt(o._d)
	-- draw under the current fog tables (table k shows shade k + fog) rather
	-- than paying a 16k table switch per object; fullbright things need 0
	local lvl
	if o.fullbright then
		set_fog(0)
		lvl = 0
	else
		lvl = min(3, grid_light(o.x, o.y) + flr(dist / BSP_FOG)) - fog_cur
		if lvl < 0 then lvl = 0 end
	end
	bsp_stats.objs = bsp_stats.objs + 1
	if o.door then
		bsp_stats.tris = bsp_stats.tris + draw_door(o.door, lvl)
		return
	end
	if o.mesh then
		if dist > MESH_LOD and o.lod_spr then
			-- LOD: far props are just their (raycaster) billboard
			billboard(o, o.lod_spr, o.lod_w, o.lod_h, o.lod_sw, o.lod_sh, 0, lvl)
			return
		end
		bsp_stats.tris = bsp_stats.tris + draw_mesh(o.mesh, o.x, o.y, o.z, o.yaw or 0, lvl)
	end
	if o.spr then billboard(o, o.spr, o.w, o.h, o.sw, o.sh, o.bb_z or 0, lvl) end
end

local function draw_objs(list)
	if not list then return end
	if #list > 1 then
		-- far to near inside one leaf
		for i = 2, #list do
			local v, j = list[i], i - 1
			while j >= 1 and list[j]._d < v._d do list[j + 1] = list[j]; j = j - 1 end
			list[j + 1] = v
		end
	end
	for o in all(list) do draw_object(o) end
end

-- ------------------------------------------------------------ traversal ---
-- frustum test: nil when the node's box is outside, else the bitmask of
-- planes it still straddles (children of a node fully inside a plane skip
-- that plane). The bounding sphere settles most planes in a few ops; only a
-- plane the sphere straddles pays for the exact box (p-vertex) test.
local p1a, p1b, p1c, p2a, p2b, p2c, p3a, p3b, p3c, p4a, p4b, p4c
local function box_plane(n, a, b, c)
	-- farthest corner along the normal outside -> box outside (nil);
	-- nearest corner inside -> box inside (false); else straddles (true)
	local x = a > 0 and n[11] or n[8]
	local y = b > 0 and n[12] or n[9]
	local z = c > 0 and n[13] or n[10]
	if a * (x - ex) + b * (y - ey) + c * (z - ez) < 0 then return nil end
	x = a > 0 and n[8] or n[11]
	y = b > 0 and n[9] or n[12]
	z = c > 0 and n[10] or n[13]
	return a * (x - ex) + b * (y - ey) + c * (z - ez) < 0
end
local function node_test(n, mask)
	local cx, cy, cz, r = n[15] - ex, n[16] - ey, n[17] - ez, n[18]
	local out, d, s = 0
	if mask & 1 ~= 0 then
		d = p1a * cx + p1b * cy + p1c * cz
		if d < -r then return nil end
		if d < r then
			s = box_plane(n, p1a, p1b, p1c)
			if s == nil then return nil elseif s then out = 1 end
		end
	end
	if mask & 2 ~= 0 then
		d = p2a * cx + p2b * cy + p2c * cz
		if d < -r then return nil end
		if d < r then
			s = box_plane(n, p2a, p2b, p2c)
			if s == nil then return nil elseif s then out = out | 2 end
		end
	end
	if mask & 4 ~= 0 then
		d = p3a * cx + p3b * cy + p3c * cz
		if d < -r then return nil end
		if d < r then
			s = box_plane(n, p3a, p3b, p3c)
			if s == nil then return nil elseif s then out = out | 4 end
		end
	end
	if mask & 8 ~= 0 then
		d = p4a * cx + p4b * cy + p4c * cz
		if d < -r then return nil end
		if d < r then
			s = box_plane(n, p4a, p4b, p4c)
			if s == nil then return nil elseif s then out = out | 8 end
		end
	end
	return out
end

local function walk(i, mask)
	local n = nodes[i]
	if n[14] & vis == 0 then
		-- every polygon below is in a sector hidden behind closed doors
		bsp_stats.culled = bsp_stats.culled + 1
		draw_objs(sub[i])
		return
	end
	if mask ~= 0 then
		mask = node_test(n, mask)
		if not mask then
			bsp_stats.culled = bsp_stats.culled + 1
			draw_objs(sub[i])             -- objects under a culled subtree still sort here
			return
		end
	end
	bsp_stats.nodes = bsp_stats.nodes + 1
	local front = n[1] * ex + n[2] * ey + n[3] * ez - n[4] >= 0
	local near_c, far_c = n[5], n[6]
	local near_s, far_s = 1, 0
	if not front then near_c, far_c, near_s, far_s = n[6], n[5], 0, 1 end
	if far_c > 0 then walk(far_c, mask) else draw_objs(slots[i * 2 + far_s]) end
	local want = front and 1 or 0
	for pi in all(n[7]) do
		local p = polys[pi]
		if p[2] == want and surf_bit[p[1]] & vis ~= 0 then draw_level_poly(p) end
	end
	if near_c > 0 then walk(near_c, mask) else draw_objs(slots[i * 2 + near_s]) end
end

-- cam: {x,y,eye,yaw,pitch}; objs: things with x,y,z (+ mesh or spr)
function bsp_draw(cam, objs)
	ex, ey, ez = cam.x, cam.y, cam.eye
	local cy_, sy_ = cos(cam.yaw), fsin(cam.yaw)
	local cp, sp = cos(cam.pitch), fsin(cam.pitch)
	fx, fy, fz = cp * cy_, cp * sy_, sp
	ux, uy, uz = -sp * cy_, -sp * sy_, cp
	rx, ry, rz = sy_, -cy_, 0
	-- camera matrix for matmul3d: column j = output axis, row 3 = translation
	M:set(0, 0, rx, ux, fx)
	M:set(0, 1, ry, uy, fy)
	M:set(0, 2, rz, uz, fz)
	M:set(0, 3, -(rx * ex + ry * ey + rz * ez), -(ux * ex + uy * ey + uz * ez), -(fx * ex + fy * ey + fz * ez))
	Vud:matmul3d(M, Cud, 1)
	-- project every vertex in C: w = 1/z, sx = CX + x*F*w, sy = CY - y*F*w
	-- (strided userdata ops, ~9 calls per frame instead of Lua per vertex)
	local nv = Wud:width()
	ONES:div(Cud, Wud, 2, 0, 1, 3, 1, nv)
	Sud:copy(Cud, true)
	Sud:mul(Wud, true, 0, 0, 1, 1, 3, nv)
	Sud:mul(Wud, true, 0, 1, 1, 1, 3, nv)
	Sud:mul(FOCAL, true, 0, 0, 1, 0, 3, nv)
	Sud:mul(-FOCAL, true, 0, 1, 1, 0, 3, nv)
	Sud:add(CX, true, 0, 0, 1, 0, 3, nv)
	Sud:add(CY, true, 0, 1, 1, 0, 3, nv)
	Sud:copy(Wud, true, 0, 2, 1, 1, 3, nv)
	-- frustum planes (inward): left/right/top/bottom screen edges
	local ax, ay = CX / FOCAL, CY / FOCAL
	local lx, ly = sqrt(1 + ax * ax), sqrt(1 + ay * ay)      -- plane normal lengths
	planes[1] = {rx + fx * ax, ry + fy * ax, rz + fz * ax, lx}
	planes[2] = {-rx + fx * ax, -ry + fy * ax, -rz + fz * ax, lx}
	planes[3] = {-ux + fx * ay, -uy + fy * ay, -uz + fz * ay, ly}
	planes[4] = {ux + fx * ay, uy + fy * ay, uz + fz * ay, ly}
	p1a, p1b, p1c = planes[1][1] / lx, planes[1][2] / lx, planes[1][3] / lx
	p2a, p2b, p2c = planes[2][1] / lx, planes[2][2] / lx, planes[2][3] / lx
	p3a, p3b, p3c = planes[3][1] / ly, planes[3][2] / ly, planes[3][3] / ly
	p4a, p4b, p4c = planes[4][1] / ly, planes[4][2] / ly, planes[4][3] / ly
	-- visible sectors: flood from the player's sector through doors that are
	-- open and inside the view frustum
	local ps = grid_sector(ex, ey)
	vis = ps > 0 and (1 << (ps - 1)) or -1
	if vis ~= -1 then
		local grow = true
		while grow do
			grow = false
			for d in all(DOORS) do
				if d.open > 0.01 and ((vis & d.ba ~= 0) ~= (vis & d.bb ~= 0))
					and sphere_visible(d.cx, d.cy, (d.z0 + d.z1) / 2, 72) then
					vis = vis | d.ba | d.bb
					grow = true
				end
			end
		end
	end
	local nv_ = 0
	for k = 0, bsp_stats.nsec - 1 do if vis & (1 << k) ~= 0 then nv_ = nv_ + 1 end end
	bsp_stats.sectors = nv_
	-- doors on the edge of what's visible draw like objects
	for d in all(DOORS) do
		if d.open < 0.999 and (vis & (d.ba | d.bb)) ~= 0 then
			add(objs, {x = d.cx, y = d.cy, z = d.z0, h = d.z1 - d.z0, rad = 72, door = d})
		end
	end
	-- drop objects into BSP leaves (skipping those in hidden sectors)
	slots, sub = {}, {}
	for o in all(objs) do
		-- sector: cached for things that never move (props, items)
		local os = o.door and 0 or o.sec or grid_sector(o.x, o.y)
		if os > 0 and (1 << (os - 1)) & vis == 0 then goto skip_obj end
		local dx, dy = o.x - ex, o.y - ey
		o._d = dx * dx + dy * dy
		local oz = (o.z or 0) + (o.h or 16) * 0.5
		local i = sphere_visible(o.x, o.y, oz, o.rad or 40) and 1 or 0
		while i > 0 do
			local n = nodes[i]
			sub[i] = sub[i] or {}
			add(sub[i], o)
			local f = n[1] * o.x + n[2] * o.y + n[3] * oz - n[4] >= 0
			local nxt = f and n[5] or n[6]
			if nxt == 0 then
				local k = i * 2 + (f and 1 or 0)
				slots[k] = slots[k] or {}
				add(slots[k], o)
				break
			end
			i = nxt
		end
		::skip_obj::
	end
	bsp_stats.nodes, bsp_stats.polys, bsp_stats.tris, bsp_stats.culled, bsp_stats.objs = 0, 0, 0, 0, 0
	walk(1, 15)
	set_fog(0)
end
