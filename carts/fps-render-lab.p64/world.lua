--[[pod_format="raw"]]
--[[
	world.lua - level queries shared by gameplay and both renderers.

	Two physics models, one per renderer, because that IS the comparison:
	  * grid  (raycaster): 64u cells, solid or not, floor is always z=0
	  * boxes (true 3D):   every brush's bounds; stairs, platforms, bridges
	                       and ceilings all matter (step up to STEP units)

	Doors (func_door in the .map) are shared by both: a moving collision box
	for the 3D model, a grid cell that is solid until the door is mostly open
	for the raycaster's. Each grid cell also knows its sector (see bsp.lua).
]]

CELL = 64
STEP = 20            -- max step-up height (3D)
BODY_H = 56          -- player/monster height (3D)

local G, BX = nil, nil
local bucket = {}
local BK = 128       -- collision bucket size
DOORS, DOOR_AT = {}, {}          -- all doors; grid cell index -> door
DOOR_OPEN_WALK = 0.7             -- raycaster: a door cell is passable from here

local function bucket_add(box, x0, y0, x1, y1)
	for by = flr(y0 / BK), flr(y1 / BK) do
		for bx = flr(x0 / BK), flr(x1 / BK) do
			local k = by * 4096 + bx
			bucket[k] = bucket[k] or {}
			add(bucket[k], box)
		end
	end
end

function world_init()
	G = LEVEL.grid
	BX = {}
	local b = LEVEL.boxes
	for i = 1, #b, 6 do
		local box = {b[i], b[i + 1], b[i + 2], b[i + 3], b[i + 4], b[i + 5]}
		add(BX, box)
		bucket_add(box, box[1], box[2], box[4], box[5])
	end
	DOORS, DOOR_AT = {}, {}
	for r in all(LEVEL.doors or {}) do
		local d = {x0 = r[1], y0 = r[2], z0 = r[3], x1 = r[4], y1 = r[5], z1 = r[6],
			sx = r[7], sy = r[8], travel = r[9], tex = r[10], sa = r[11], sb = r[12], cell = r[13],
			open = 0, hold = 0}
		d.cx, d.cy = (d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2
		-- sector bits (0 = unknown -> treated as "everything")
		d.ba = d.sa > 0 and (1 << (d.sa - 1)) or -1
		d.bb = d.sb > 0 and (1 << (d.sb - 1)) or -1
		d.box = {d.x0, d.y0, d.z0, d.x1, d.y1, d.z1}
		-- the moving box lives in every bucket it can slide through
		local tx, ty = d.sx * d.travel, d.sy * d.travel
		bucket_add(d.box, min(d.x0, d.x0 + tx), min(d.y0, d.y0 + ty), max(d.x1, d.x1 + tx), max(d.y1, d.y1 + ty))
		add(DOORS, d)
		DOOR_AT[d.cell] = d
	end
end

-- ---------------------------------------------------------------- doors ---
-- a door opens when the player (or a hunting monster) comes near, stays open
-- while anyone is near or standing in the doorway, then slides shut
local function in_doorway(d, x, y, r)
	return x > d.x0 - r and x < d.x1 + r and y > d.y0 - r and y < d.y1 + r
end

function doors_update(player, things, frame, on_move)
	for d in all(DOORS) do
		local dx, dy = player.x - d.cx, player.y - d.cy
		local near = dx * dx + dy * dy < 130 * 130
		if not near and (frame + d.cell) % 4 == 0 then
			local m = false
			for t in all(things) do
				if t.cls == "monster_grunt" and t.hp > 0 and t.st == "chase" then
					local mx, my = t.x - d.cx, t.y - d.cy
					if mx * mx + my * my < 90 * 90 then m = true break end
				end
			end
			d.mon = m
		end
		if near or d.mon then d.hold = 45 elseif d.hold > 0 then d.hold = d.hold - 1 end
		if d.hold == 0 and d.open > 0 and in_doorway(d, player.x, player.y, 16) then d.hold = 10 end
		local o0 = d.open
		if d.hold > 0 then d.open = min(1, d.open + 1 / 30) else d.open = max(0, d.open - 1 / 30) end
		if on_move and ((o0 == 0 and d.open > 0) or (o0 == 1 and d.open < 1)) then on_move(d) end
		local o = d.open * d.travel
		local b = d.box
		b[1], b[2], b[4], b[5] = d.x0 + d.sx * o, d.y0 + d.sy * o, d.x1 + d.sx * o, d.y1 + d.sy * o
	end
end

-- 1-based grid cell index (0 = outside the grid)
function grid_cell_index(x, y)
	local gx, gy = flr((x - G.x0) / CELL), flr((y - G.y0) / CELL)
	if gx < 0 or gy < 0 or gx >= G.w or gy >= G.h then return 0 end
	return gy * G.w + gx + 1
end

function grid_sector(x, y)
	local gx, gy = flr((x - G.x0) / CELL), flr((y - G.y0) / CELL)
	if gx < 0 or gy < 0 or gx >= G.w or gy >= G.h then return 0 end
	return G.sec[gy * G.w + gx + 1] or 0
end

-- ---------------------------------------------------------------- grid ---
function grid_cell(gx, gy)
	if gx < 0 or gy < 0 or gx >= G.w or gy >= G.h then return 1 end
	return G.cells[gy * G.w + gx + 1]
end

function grid_solid(x, y)
	local gx, gy = flr((x - G.x0) / CELL), flr((y - G.y0) / CELL)
	if gx < 0 or gy < 0 or gx >= G.w or gy >= G.h then return true end
	local i = gy * G.w + gx + 1
	local c = G.cells[i]
	if c == 2 then return DOOR_AT[i].open < DOOR_OPEN_WALK end
	return c ~= 0
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
