--[[
	run.lua - run the FPS Render Lab cart under picomock and capture frames.
	Driven by tools/fps-lab/screenshots.py (which writes the sprite dump and
	the shot list); usage:  lua5.4 run.lua <cart_dir> <sprites.lua> <shots.lua> <out_dir>
]]
local here = arg[0]:match("(.*/)") or "./"
CART_DIR = arg[1]
dofile(here .. "picomock.lua")
local sprites = dofile(arg[2])
for i, s in pairs(sprites) do
	local u = userdata("u8", s.w, s.h)
	for k = 0, s.w * s.h - 1 do u[k] = s.d:byte(k + 1) end
	set_spr(i, u)
end
poke(0x550e, 32) poke(0x550f, 32)     -- Picotron initialises tile size from sprite 0
include("main.lua")
local t0 = os.clock()
_init()
io.stderr:write(string.format("init: %.2fs\n", os.clock() - t0))
local shots = dofile(arg[3])
local report = {}
for _, sh in ipairs(shots) do
	if sh.setup then sh.setup() end
	for f = 1, sh.frames or 1 do
		INPUT.prev = INPUT.keys
		INPUT.keys = (sh.keys and sh.keys(f)) or {}
		_update()
	end
	for k in pairs(STATS) do STATS[k] = 0 end
	-- sample every 100 VM instructions; attribute to the cart unless the
	-- sample lands inside picomock itself (whose pixel loops stand in for C)
	local instr = 0
	debug.sethook(function()
		local info = debug.getinfo(2, "S")
		if info and not info.source:find("picomock", 1, true) then instr = instr + 100 end
	end, "", 100)
	_draw()
	debug.sethook()
	mock_save_ppm(arg[4] .. "/" .. sh.name .. ".ppm")
	report[#report + 1] = string.format("%s\tmode=%s\tlua_instr=%d\ttline3d_calls=%d\tlines=%d\ttl_px=%d\tspr_px=%d",
		sh.name, mode == 1 and "ray" or "bsp", instr, STATS.tl_calls, STATS.tl_lines, STATS.tl_px, STATS.spr_px)
	io.stderr:write(report[#report] .. "\n")
end
local f = io.open(arg[4] .. "/report.tsv", "w"); f:write(table.concat(report, "\n") .. "\n"); f:close()
