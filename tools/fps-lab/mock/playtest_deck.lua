--[[
	playtest_deck.lua - autopilot playtest of the starship deck under picomock.

	  python3 tools/fps-lab/screenshots.py <dir>      # writes <dir>/sprites.lua
	  lua5.4 tools/fps-lab/mock/playtest_deck.lua carts/fps-render-lab.p64 <dir>/sprites.lua <outdir> <mode>

	mode 1 = raycaster, 2 = true 3D (240x135). Picks the deck from the menu,
	fights from the south walkway (aims at the nearest grunt in sight), then
	walks a route: round the walkway, down into the pit and out, through both
	sliding doors (engineering, cargo bay), up the corridor into the lounge.
	One frame per waypoint goes to <outdir>/m<mode>_NN.ppm. Exits non-zero
	if the player gets stuck or never lands a kill. Health is held >= 60 so
	the route completes; the lowest value still shows that fireballs land.
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
poke(0x550e, 32) poke(0x550f, 32)
include("main.lua")
_init()
local OUT, MODE = arg[3], tonumber(arg[4])
local function step(keys) INPUT.prev = INPUT.keys; INPUT.keys = keys or {}; _update() end
step({right = true}); _draw(); step(); _draw(); step()
assert(level_cur == 2)
step({z = true}); step()
mode = MODE
set_detail(true)
local HX, HY = 1056, 544
local R = {
	{"walkway S", HX, HY - 360}, {"walkway SW", HX - 255, HY - 255}, {"walkway W", HX - 360, HY},
	{"walkway NW", HX - 255, HY + 255}, {"walkway N", HX, HY + 360}, {"walkway NE", HX + 255, HY + 255},
	{"walkway E", HX + 360, HY}, {"walkway SE", HX + 255, HY - 255}, {"walkway S2", HX, HY - 340},
	{"pit gap S", HX, HY - 230}, {"pit floor", HX, HY - 130}, {"pit W", HX - 150, HY - 30},
	{"pit floor2", HX, HY - 150}, {"out of pit", HX, HY - 300}, {"walkway S3", HX, HY - 360},
	{"walkway SW2", HX - 255, HY - 255}, {"to W door", HX - 360, HY}, {"W tunnel", 560, HY}, {"W door", 480, HY}, {"engineering", 300, HY},
	{"eng deck", 300, 780}, {"eng back", 380, HY}, {"W tunnel back", 560, HY}, {"hall W", HX - 360, HY},
	{"hall N", HX, HY + 360}, {"corridor", HX, 1100}, {"lounge", HX, 1300}, {"lounge W", 760, 1300},
	{"lounge back", HX, 1300}, {"corridor back", HX, 1060}, {"hall NE", HX + 255, HY + 255},
	{"to E door", HX + 360, HY}, {"E tunnel", 1560, HY}, {"E door", 1630, HY}, {"cargo", 1800, HY},
	{"cargo S", 1900, 200}, {"cargo N", 1900, 820},
}
local frame, stuck, log = 0, {}, {}
-- combat: stand on the south walkway, aim at the nearest grunt in sight, fire
local shots, k0 = 0, player.kills
player.x, player.y = HX, HY - 380
player.ammo = 60
for f = 1, 1500 do
	player.hp = math.max(player.hp, 60)
	local best, bt = 1e9, nil
	for t in all(things) do
		if t.cls == "monster_grunt" and t.hp > 0 then
			local dx, dy = t.x - player.x, t.y - player.y
			local d = math.sqrt(dx * dx + dy * dy)
			if d < best and grid_los(player.x, player.y, t.x, t.y) then best, bt = d, t end
		end
	end
	local keys = {}
	if bt then
		player.yaw = math.atan(bt.y - player.y, bt.x - player.x) / (2 * math.pi)
		local tz = (mode == 2 and bt.z or 0) + bt.h * 0.5
		local ez = (mode == 2 and player.z or 0) + 46
		player.pitch = math.atan(tz - ez, best) / (2 * math.pi)
		keys.z = (f % 2 == 0)
	end
	local a0 = player.ammo
	step(keys); frame = frame + 1
	if player.ammo < a0 then shots = shots + 1 end
end
io.write(string.format("combat: %d shots, %d kills\n", shots, player.kills - k0))
player.x, player.y, player.ammo = HX, HY - 400, 30
local hp_min = 100
for wi, w in ipairs(R) do
	local name, tx, ty = w[1], w[2], w[3]
	local best, since = 1e9, 0
	local reached = false
	for f = 1, 900 do
		player.hp = math.max(player.hp, 60)          -- keep the run going; damage is still logged
		local dx, dy = tx - player.x, ty - player.y
		local d = math.sqrt(dx * dx + dy * dy)
		if d < 24 then reached = true break end
		player.yaw = math.atan(dy, dx) / (2 * math.pi)
		player.pitch = 0
		step({w = true, z = (frame % 2 == 0)})
		frame = frame + 1
		hp_min = math.min(hp_min, player.hp)
		if d < best - 1 then best, since = d, 0 else since = since + 1 end
		if since > 150 then break end
	end
	_draw()
	mock_save_ppm(string.format("%s/m%d_%02d.ppm", OUT, MODE, wi))
	local line = string.format("%-14s %s  at %5.0f,%5.0f z=%5.1f  frames=%d", name, reached and "ok   " or "STUCK", player.x, player.y, player.z, frame)
	log[#log + 1] = line
	if not reached then stuck[#stuck + 1] = name end
end
for _, l in ipairs(log) do io.write(l, "\n") end
io.write(string.format("mode %d: stuck at %d waypoints %s\n", MODE, #stuck, table.concat(stuck, ", ")))
io.write(string.format("kills %d/%d  min hp %d  shells left %d\n", player.kills, count_monsters(), hp_min, player.ammo))
if #stuck > 0 or player.kills == 0 then os.exit(1) end
