--[[pod_format="raw"]]
--[[
	picotron_bench.lua - benchmark the FPS Render Lab inside REAL (headless)
	Picotron. Run by scripts/picotron/bench-cart.sh as:

		picotron -home <HOME> -x tools/fps-lab/picotron_bench.lua

	(no trailing arg: a positional cart makes picotron boot it instead of -x)

	For every detail level x renderer x pose it runs warm-up frames, then
	measures N frames of _update() + _draw() + flip(), recording the average
	stat(1) (cpu: fraction of a 60fps frame budget), stat(7) (the fps Picotron
	says it is operating at) and time() elapsed. Headless picotron swallows
	print(), so results are marker directories under /out, which the shell
	script turns into a table.
]]

local OUT = "/out"
local function mark(s) pcall(mkdir, OUT .. "/" .. (tostring(s):gsub("[^%w%.%-]", "_"))) end
pcall(mkdir, OUT)
mark("bench_started")

cd("/game.p64")
-- a -x script is not a running cart: load the baked sprite sheet by hand
local g = fetch("/game.p64/gfx/0.gfx")
if type(g) == "table" then
	for i, e in pairs(g) do
		if type(e) == "table" and e.bmp then set_spr(i, e.bmp) end
	end
	mark("gfx_loaded")
else
	mark("FAIL.no_gfx")
end
pcall(window, {width = 480, height = 270})

local ok, err = pcall(include, "main.lua")
if not ok then mark("FAIL.include." .. tostring(err):sub(1, 120)) exit(1) end
ok, err = pcall(_init)
if not ok then mark("FAIL.init." .. tostring(err):sub(1, 120)) exit(1) end
mark("init_ok")

local GH = 26
local function cell(c, r) return c * 64 + 32, (GH - 1 - r) * 64 + 32 end
local POSES = {  -- same as tools/fps-lab/screenshots.py
	{"hall", 6, 9.4, 0.25, 0.0},
	{"hall_up", 6, 9.4, 0.25, 0.1},
	{"courtyard", 18.6, 11.4, 0.13, 0.02},
	{"corridor", 12.5, 5.5, 0.0, 0.0},
	{"arena", 6.5, 15.2, 0.75, 0.03},
	{"storage", 18.8, 20.5, 0.04, 0.0},
}
local WARM, N = 10, 40

for _, half in ipairs({false, true}) do
	detail_auto = false
	set_detail(half)
	for _, m in ipairs({1, 2}) do
		for _, p in ipairs(POSES) do
			reset_game()
			in_menu, show_stats = false, true
			mode = m
			local x, y = cell(p[2], p[3])
			local function pose()
				player.x, player.y, player.yaw, player.pitch = x, y, p[4], p[5]
				player.z = (m == 2) and max(0, floor_at(x, y, 12, 72)) or 0
				player.hp = 100
			end
			local okr, e = pcall(function()
				for _ = 1, WARM do pose(); _update(); _draw(); flip() end
				local cpu, t0 = 0, time()
				for _ = 1, N do
					pose(); _update(); _draw(); flip()
					cpu = cpu + stat(1)
				end
				local dt = time() - t0
				mark(string.format("bench.%s.%s.%s.cpu_%d.fps_%d.dt_%d",
					half and "240x135" or "480x270", m == 1 and "ray" or "bsp", p[1],
					flr(cpu / N * 1000), stat(7), flr(dt * 1000)))
			end)
			if not okr then mark("FAIL.run." .. p[1] .. "." .. tostring(e):sub(1, 100)) end
		end
	end
end
mark("RESULT.OK")
exit(0)
