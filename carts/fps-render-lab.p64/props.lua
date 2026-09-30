--[[pod_format="raw"]]
--[[
	props.lua - low-poly prop meshes for the TRUE 3D renderer.
	(The raycaster shows the same props as billboards: sprites 40..43.)

	verts: flat x,y,z list (z up, origin = centre of the base)
	faces: {sprite, nverts, v1,u1,v1, v2,u2,v2, ...}, CCW seen from outside.
	All props are convex, so backface culling alone sorts their faces.
]]

MESHES = {}

local function quad(f, spr, a, b, c, d, u0, v0, u1, v1)
	add(f, {spr, 4, a, u0, v1, b, u1, v1, c, u1, v0, d, u0, v0})
end

-- crate: 32u cube, crate texture on every visible side
do
	local s, h = 16, 32
	local v = {-s, -s, 0, s, -s, 0, s, s, 0, -s, s, 0,
	           -s, -s, h, s, -s, h, s, s, h, -s, s, h}
	local f = {}
	quad(f, 17, 1, 2, 6, 5, 0, 0, 32, 32)    -- south (-y)
	quad(f, 17, 2, 3, 7, 6, 0, 0, 32, 32)    -- east
	quad(f, 17, 3, 4, 8, 7, 0, 0, 32, 32)    -- north
	quad(f, 17, 4, 1, 5, 8, 0, 0, 32, 32)    -- west
	add(f, {17, 4, 5, 0, 32, 6, 32, 32, 7, 32, 0, 8, 0, 0})   -- top
	MESHES.crate = {verts = v, faces = f}
end

-- barrel: 8-sided prism, label texture wrapped once around the sides
do
	local r, h, n = 12, 36, 8
	local v, f = {}, {}
	for i = 0, n - 1 do
		local a = (i + 0.5) / n
		add(v, cos(a) * r); add(v, fsin(a) * r); add(v, 0)
	end
	for i = 0, n - 1 do
		local a = (i + 0.5) / n
		add(v, cos(a) * r); add(v, fsin(a) * r); add(v, h)
	end
	for i = 0, n - 1 do
		local j = (i + 1) % n
		quad(f, 18, i + 1, j + 1, n + j + 1, n + i + 1, i * 4, 0, i * 4 + 4, 32)
	end
	local top = {19, n}
	for i = 0, n - 1 do
		local a = (i + 0.5) / n
		add(top, n + i + 1); add(top, 16 + cos(a) * 15.5); add(top, 16 - fsin(a) * 15.5)
	end
	add(f, top)
	MESHES.barrel = {verts = v, faces = f}
end

-- torch stand: slim post + bracket (the flame is a fullbright billboard)
do
	local s, h = 3, 48
	local v = {-s, -s, 0, s, -s, 0, s, s, 0, -s, s, 0,
	           -s, -s, h, s, -s, h, s, s, h, -s, s, h}
	local f = {}
	quad(f, 14, 1, 2, 6, 5, 0, 0, 6, 32)
	quad(f, 14, 2, 3, 7, 6, 6, 0, 12, 32)
	quad(f, 14, 3, 4, 8, 7, 12, 0, 18, 32)
	quad(f, 14, 4, 1, 5, 8, 18, 0, 24, 32)
	add(f, {14, 4, 5, 0, 6, 6, 6, 6, 7, 6, 0, 8, 0, 0})
	MESHES.torch = {verts = v, faces = f}
end
