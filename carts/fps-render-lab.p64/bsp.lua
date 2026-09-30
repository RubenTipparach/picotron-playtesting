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
	     fan into textri() batched scanlines
	  4. monsters/props/items are dropped into the BSP leaf they stand in and
	     drawn when the walk reaches that leaf, so they sort against walls
	     correctly too. Props are real meshes here (billboards in the
	     raycaster); monsters/items stay billboards (sspr) in both.
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
bsp_stats = {nodes = 0, polys = 0, tris = 0, culled = 0, objs = 0}

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

local function draw_level_poly(p)
	local n = (#p - 5) / 3
	local clip = false
	for k = 1, n do
		local vi = (p[3 + k * 3] - 1) * 3
		if Cud[vi + 2] < NEAR then clip = true break end
	end
	local dx, dy, dz = p[3] - ex, p[4] - ey, p[5] - ez
	local t
	if clip then
		-- rare path: camera-space verts through the near-plane clipper
		for k = 1, n do
			local b = 3 + k * 3
			local vi = (p[b] - 1) * 3
			qx[k], qy[k], qz[k], qu[k], qv[k] = Cud[vi], Cud[vi + 1], Cud[vi + 2], p[b + 1], p[b + 2]
		end
		set_fog(min(3, flr(sqrt(dx * dx + dy * dy + dz * dz) / BSP_FOG)))
		t = draw_q(SURF_BASE + p[1], n)
	else
		-- common path: screen coords were batch-projected in C (Sud)
		local minx, maxx, miny, maxy = 1e9, -1e9, 1e9, -1e9
		for k = 1, n do
			local b = 3 + k * 3
			local vi = (p[b] - 1) * 3
			local sx, sy = Sud[vi], Sud[vi + 1]
			px[k], py[k], pw[k], pu[k], pv[k] = sx, sy, Sud[vi + 2], p[b + 1], p[b + 2]
			if sx < minx then minx = sx end
			if sx > maxx then maxx = sx end
			if sy < miny then miny = sy end
			if sy > maxy then maxy = sy end
		end
		if maxx < 0 or minx >= SW or maxy < 0 or miny >= SH then return end
		set_fog(min(3, flr(sqrt(dx * dx + dy * dy + dz * dz) / BSP_FOG)))
		t = fill_poly(SURF_BASE + p[1], n, px, py, pw, pu, pv)
	end
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
	sspr(VAR_BASE + spr * 4 + lvl, 0, 0, sw, sh, sx, sy, ww, hh, o.flip)
end

local function draw_object(o)
	-- off-screen objects cost nothing (objects under culled subtrees land here too)
	if not sphere_visible(o.x, o.y, (o.z or 0) + (o.h or 16) * 0.5, o.rad or 40) then return end
	set_fog(0)
	local dist = sqrt(o._d)
	local lvl = o.fullbright and 0 or min(3, grid_light(o.x, o.y) + flr(dist / BSP_FOG))
	bsp_stats.objs = bsp_stats.objs + 1
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
local function box_visible(n)
	for i = 1, 4 do
		local p = planes[i]
		local a, b, c = p[1], p[2], p[3]
		local x = a > 0 and n[11] or n[8]
		local y = b > 0 and n[12] or n[9]
		local z = c > 0 and n[13] or n[10]
		if a * (x - ex) + b * (y - ey) + c * (z - ez) < 0 then return false end
	end
	return true
end

local function walk(i)
	local n = nodes[i]
	if not box_visible(n) then
		bsp_stats.culled = bsp_stats.culled + 1
		draw_objs(sub[i])             -- objects under a culled subtree still sort here
		return
	end
	bsp_stats.nodes = bsp_stats.nodes + 1
	local front = n[1] * ex + n[2] * ey + n[3] * ez - n[4] >= 0
	local near_c, far_c = n[5], n[6]
	local near_s, far_s = 1, 0
	if not front then near_c, far_c, near_s, far_s = n[6], n[5], 0, 1 end
	if far_c > 0 then walk(far_c) else draw_objs(slots[i * 2 + far_s]) end
	local want = front and 1 or 0
	for pi in all(n[7]) do
		local p = polys[pi]
		if p[2] == want then draw_level_poly(p) end
	end
	if near_c > 0 then walk(near_c) else draw_objs(slots[i * 2 + near_s]) end
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
	-- drop objects into BSP leaves
	slots, sub = {}, {}
	for o in all(objs) do
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
	end
	bsp_stats.nodes, bsp_stats.polys, bsp_stats.tris, bsp_stats.culled, bsp_stats.objs = 0, 0, 0, 0, 0
	walk(1)
	set_fog(0)
end
