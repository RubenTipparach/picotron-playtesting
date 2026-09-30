--[[pod_format="raw"]]
--[[
	world.lua - level queries shared by gameplay and both renderers.

	Two physics models, one per renderer, because that IS the comparison:
	  * grid  (raycaster): 64u cells, solid or not, floor is always z=0
	  * boxes (true 3D):   every brush's bounds; stairs, platforms, bridges
	                       and ceilings all matter (step up to STEP units)
]]

CELL = 64
STEP = 20            -- max step-up height (3D)
BODY_H = 56          -- player/monster height (3D)

local G, BX = nil, nil
local bucket = {}
local BK = 128       -- collision bucket size

function world_init()
	G = LEVEL.grid
	BX = {}
	local b = LEVEL.boxes
	for i = 1, #b, 6 do
		local box = {b[i], b[i + 1], b[i + 2], b[i + 3], b[i + 4], b[i + 5]}
		add(BX, box)
		for by = flr(box[2] / BK), flr(box[5] / BK) do
			for bx = flr(box[1] / BK), flr(box[4] / BK) do
				local k = by * 4096 + bx
				bucket[k] = bucket[k] or {}
				add(bucket[k], box)
			end
		end
	end
end

-- ---------------------------------------------------------------- grid ---
function grid_cell(gx, gy)
	if gx < 0 or gy < 0 or gx >= G.w or gy >= G.h then return 1 end
	return G.cells[gy * G.w + gx + 1]
end

function grid_solid(x, y)
	return grid_cell(flr((x - G.x0) / CELL), flr((y - G.y0) / CELL)) ~= 0
end

function grid_light(x, y)
	local gx, gy = flr((x - G.x0) / CELL), flr((y - G.y0) / CELL)
	if gx < 0 or gy < 0 or gx >= G.w or gy >= G.h then return 3 end
	return G.light[gy * G.w + gx + 1]
end

-- is a circle of radius r at x,y clear of grid walls?
function grid_free(x, y, r)
	return not (grid_solid(x - r, y - r) or grid_solid(x + r, y - r)
		or grid_solid(x - r, y + r) or grid_solid(x + r, y + r))
end

-- line of sight through the grid (DDA), used by monsters + hitscan
function grid_los(x0, y0, x1, y1)
	local dx, dy = x1 - x0, y1 - y0
	local len = sqrt(dx * dx + dy * dy)
	local n = flr(len / 16) + 1
	for i = 1, n - 1 do
		local t = i / n
		if grid_solid(x0 + dx * t, y0 + dy * t) then return false end
	end
	return true
end

-- --------------------------------------------------------------- boxes ---
local function near_boxes(x0, y0, x1, y1, fn)
	local seen = {}
	for by = flr(y0 / BK), flr(y1 / BK) do
		for bx = flr(x0 / BK), flr(x1 / BK) do
			local l = bucket[by * 4096 + bx]
			if l then
				for b in all(l) do
					if not seen[b] then
						seen[b] = true
						if b[1] < x1 and b[4] > x0 and b[2] < y1 and b[5] > y0 then
							if fn(b) then return true end
						end
					end
				end
			end
		end
	end
	return false
end

-- highest floor under a footprint that is at most zmax
function floor_at(x, y, r, zmax)
	local best = -9999
	near_boxes(x - r, y - r, x + r, y + r, function(b)
		if b[6] <= zmax and b[6] > best then best = b[6] end
	end)
	return best
end

-- lowest ceiling above z
function ceil_at(x, y, r, z)
	local best = 9999
	near_boxes(x - r, y - r, x + r, y + r, function(b)
		if b[3] >= z and b[3] < best then best = b[3] end
	end)
	return best
end

-- would a body (feet at z) at x,y overlap a box it cannot step onto?
function box_blocked(x, y, z, r, h)
	return near_boxes(x - r, y - r, x + r, y + r, function(b)
		return b[6] > z + STEP and b[3] < z + h
	end)
end

-- a point inside solid? (fireballs, 3D hitscan)
function point_solid(x, y, z)
	return near_boxes(x - 0.5, y - 0.5, x + 0.5, y + 0.5, function(b)
		return z > b[3] and z < b[6]
	end)
end

-- 3D line of sight against brush boxes (sampled)
function box_los(x0, y0, z0, x1, y1, z1)
	local dx, dy, dz = x1 - x0, y1 - y0, z1 - z0
	local n = flr(sqrt(dx * dx + dy * dy + dz * dz) / 12) + 1
	for i = 1, n - 1 do
		local t = i / n
		if point_solid(x0 + dx * t, y0 + dy * t, z0 + dz * t) then return false end
	end
	return true
end
