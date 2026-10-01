--[[pod_format="raw",created="2026-09-30 12:00:00",modified="2026-09-30 12:00:00",revision=1]]
--[[
	FPS Render Lab - one level, two engines.

	The same TrenchBroom map (carts/fps-render-lab.map, compiled by
	tools/fps-lab/map2bsp.py) is rendered two ways; TAB flips between them
	live so you can compare look, features and cost:

	  RAYCASTER  (ray.lua)  grid slice of the map at eye height; per-column
	                        DDA; flat floor/ceiling; y-shear look up/down
	  TRUE 3D    (bsp.lua)  CSG'd brush polygons in a BSP tree, baked
	                        lightmaps in a surface cache, real pitch, stairs,
	                        platforms, bridges, sloped braces, 3D props

	A menu picks the renderer at start (up/down + Z, or click); M returns to it.
	Controls: WASD move, mouse (click to lock) or arrows look, click / Z /
	space to fire, TAB switch renderer, V detail (480x270 / 240x135),
	H show/hide the renderer stats, G switch palette + art set (default 32
	colours / custom 64), 1-9 warp to the comparison viewpoints, R restart.
]]

include("level.lua")
include("gfx.lua")
include("world.lua")
include("props.lua")
include("ray.lua")
include("bsp.lua")

MODE_RAY, MODE_BSP = 1, 2
mode = MODE_BSP
local EYE, RADIUS = 46, 14
local fx_list, msg, msg_t
local solids = {}
things, player = nil, nil        -- globals so tools/fps-lab/mock can pose the camera
local frame, fire_cd, flash, bob, locked = 0, 0, 0, 0, false
local cpu_hist = {0, 0}
local surf_texels = 0

-- ------------------------------------------------------------ sound -----
-- short note() blips on the bundled instrument bank (sfx/0.sfx)
local snd_q = {}
local SND = {
	shot   = {{0, 10, 36, 5, 64}, {0, 6, 60, 4, 48}},
	enemy  = {{0, 8, 48, 4, 40}},
	fire   = {{0, 12, 30, 2, 44}},
	hurt   = {{0, 8, 40, 2, 56}},
	pickup = {{0, 4, 72, 6, 40}, {4, 6, 79, 6, 40}},
	die    = {{0, 14, 34, 5, 56}},
	door   = {{0, 22, 26, 3, 40}, {8, 10, 31, 3, 28}},
}
local snd_ch = 8
function snd(name)
	local def = SND[name]
	if not def or not note then return end
	snd_ch = 8 + (snd_ch - 7) % 4
	for n in all(def) do
		add(snd_q, {t = frame + n[1], p = n[3], i = n[4], v = n[5], ch = snd_ch})
		add(snd_q, {t = frame + n[1] + n[2], off = true, ch = snd_ch})
	end
end
local function snd_update()
	for i = #snd_q, 1, -1 do
		local e = snd_q[i]
		if e.t <= frame then
			if e.off then note(0xff, 0xff, 0, 0xff, 0xff, e.ch)
			else note(e.p, e.i, e.v, 0, 0, e.ch) end
			deli(snd_q, i)
		end
	end
end

-- ------------------------------------------------------------- things ---
local KIND = {
	monster_grunt = {spr = 32, w = 40, h = 56, sw = 32, sh = 40, r = 14, hp = 40},
	prop_crate    = {mesh = "crate", spr = 40, w = 32, h = 32, sw = 32, sh = 32, r = 18, solid = true},
	prop_barrel   = {mesh = "barrel", spr = 41, w = 24, h = 36, sw = 24, sh = 32, r = 13, solid = true},
	prop_torch    = {mesh = "torch", spr = 42, w = 16, h = 72, sw = 16, sh = 48, r = 6, solid = true, fullbright = true},
	item_health   = {spr = 46, w = 20, h = 16, sw = 20, sh = 16, r = 16, pickup = "health"},
	item_ammo     = {spr = 47, w = 20, h = 16, sw = 20, sh = 16, r = 16, pickup = "ammo"},
}

local function spawn(cls, x, y, z, ang)
	local k = KIND[cls]
	if not k then return end
	local t = {cls = cls, x = x, y = y, z = 0, yaw = ang / 360, hp = k.hp, st = "idle", tm = 0, slot = #things}
	for key, v in pairs(k) do t[key] = v end
	t.base_spr = k.spr
	if not k.hp then t.sec = grid_sector(x, y) end     -- static: sector never changes
	t.mesh_def = k.mesh and MESHES[k.mesh]
	t.z3 = floor_at(x, y, 4, z + 64)
	if t.z3 < -1000 then t.z3 = 0 end
	add(things, t)
	if k.solid then add(solids, t) end
	return t
end

function reset_game()
	things, fx_list, solids = {}, {}, {}
	player = {x = 0, y = 0, z = 0, vz = 0, yaw = 0.25, pitch = 0, hp = 100, ammo = 30, kills = 0}
	for th in all(LEVEL.things) do
		local cls, x, y, z, ang = th[1], th[2], th[3], th[4], th[5]
		if cls == "info_player_start" then
			player.x, player.y, player.yaw = x, y, ang / 360
			player.z = max(0, floor_at(x, y, 4, z + 64))
		else
			spawn(cls, x, y, z, ang)
		end
	end
	solids_index()
	msg, msg_t = "", 0
	won = false
	for d in all(DOORS) do d.open, d.hold, d.mon = 0, 0, false end
end

-- renderer/debug notices: only shown with the stats bar on (H)
function info(m, t)
	if show_stats then msg, msg_t = m, t end
end

-- ------------------------------------------------------------- detail ---
-- FULL renders at 480x270; HALF uses vid(3) (240x135, doubled by the
-- display) which quarters the fill and halves raycaster columns / BSP
-- scanlines. AUTO starts FULL and drops to HALF if Picotron has to run
-- _draw below 60fps for ~2 seconds on the menu (which renders the level
-- live); never mid-game, because vid() drops the key being pressed. V
-- toggles by hand (and ends AUTO).
detail_half, detail_auto = false, true
show_stats = false       -- H shows the renderer stats bar (off: gameplay HUD only)
in_menu, menu_sel = true, MODE_BSP
local slow_frames = 0
function set_detail(half)
	detail_half = half
	if vid then vid(half and 3 or 0) end
	SW, SH = half and 240 or 480, half and 135 or 270
	CX, CY, FOCAL = SW / 2, SH / 2, SW / 2
	gfx_palette()            -- in case the video mode reset the rgb palette
end

local function update_detail()
	if keyp("v") then
		detail_auto = false
		set_detail(not detail_half)
		info(detail_half and "detail: 240x135" or "detail: 480x270", 90)
		return
	end
	if detail_auto and in_menu and not detail_half and stat then
		if (stat(7) or 60) < 60 then slow_frames = slow_frames + 1 else slow_frames = 0 end
		if slow_frames > 120 then
			set_detail(true)
			info("auto detail: 240x135 (V to change)", 150)
		end
	end
end

function _init()
	gfx_init()
	world_init()
	ray_init()
	bsp_init()
	surf_texels = build_surfaces()
	reset_game()
end

-- ------------------------------------------------------------- physics ---
-- solid props never move, so they live in a 128u bucket grid (solid_bk)
local SBK = 128
local solid_bk = {}
function solids_index()
	solid_bk = {}
	for t in all(solids) do
		local k = flr(t.y / SBK) * 4096 + flr(t.x / SBK)
		solid_bk[k] = solid_bk[k] or {}
		add(solid_bk[k], t)
	end
end
local function prop_block(x, y, r, self)
	local rr0 = r + 18                         -- 18 = largest prop radius
	for by = flr((y - rr0) / SBK), flr((y + rr0) / SBK) do
		for bx = flr((x - rr0) / SBK), flr((x + rr0) / SBK) do
			local l = solid_bk[by * 4096 + bx]
			if l then
				for t in all(l) do
					if t.solid and t ~= self then
						local dx, dy = x - t.x, y - t.y
						local rr = r + t.r
						if dx * dx + dy * dy < rr * rr then return true end
					end
				end
			end
		end
	end
	return false
end

-- one body, two physics models
local function move_body(b, dx, dy, r)
	if mode == MODE_RAY then
		if grid_free(b.x + dx, b.y, r) and not prop_block(b.x + dx, b.y, r, b) then b.x = b.x + dx end
		if grid_free(b.x, b.y + dy, r) and not prop_block(b.x, b.y + dy, r, b) then b.y = b.y + dy end
		b.z, b.vz = 0, 0
	else
		local z = b.z
		if not box_blocked(b.x + dx, b.y, z, r, BODY_H) and not prop_block(b.x + dx, b.y, r, b) then b.x = b.x + dx end
		if not box_blocked(b.x, b.y + dy, z, r, BODY_H) and not prop_block(b.x, b.y + dy, r, b) then b.y = b.y + dy end
		local g = floor_at(b.x, b.y, r - 2, z + STEP)
		if g >= z then
			b.z, b.vz = g, 0                      -- step up (stairs) / stay on the floor
		else
			b.vz = (b.vz or 0) - 0.5
			b.z = max(g, z + b.vz)
			if b.z == g then b.vz = 0 end
		end
	end
end

-- when switching engines, make sure the player isn't embedded in a 3D brush
local function settle_player()
	if mode == MODE_BSP then
		local g = floor_at(player.x, player.y, RADIUS - 2, 72)
		player.z = max(g, 0)
	else
		player.z = 0
	end
end

-- ----------------------------------------------------------- shooting ----
local function eye_z() return (mode == MODE_BSP and player.z or 0) + EYE end

local function hitscan()
	-- 7 pellets; each hits the nearest monster whose disc its ray passes
	local ez = eye_z()
	local fx, fy = cos(player.yaw), fsin(player.yaw)
	local hits = 0
	for p = 1, 7 do
		local a = player.yaw + (rnd(1) - 0.5) * 0.03
		local pt = player.pitch + (rnd(1) - 0.5) * 0.02
		local dx, dy = cos(a), fsin(a)
		local dz = fsin(pt) / cos(pt)
		local best, bt = 1e9, nil
		for t in all(things) do
			if t.hp and t.hp > 0 then
				local ox, oy = t.x - player.x, t.y - player.y
				local along = ox * dx + oy * dy
				if along > 0 and along < best then
					local perp = abs(ox * dy - oy * dx)
					local tz = (mode == MODE_BSP and t.z or 0)
					local hz = ez + dz * along
					if perp < t.r + 4 and (mode == MODE_RAY or (hz > tz and hz < tz + t.h)) then
						if grid_los(player.x, player.y, t.x, t.y)
							and (mode == MODE_RAY or box_los(player.x, player.y, ez, t.x, t.y, tz + t.h * 0.6)) then
							best, bt = along, t
						end
					end
				end
			end
		end
		if bt then
			bt.hp = bt.hp - 8
			hits = hits + 1
			bt.st, bt.tm = (bt.hp > 0) and "pain" or "dead", 0
			if bt.hp <= 0 and not bt.counted then
				bt.counted = true; player.kills = player.kills + 1; bt.solid = false; snd("die")
			end
			add(fx_list, {x = bt.x - dx * 8, y = bt.y - dy * 8, z = (mode == MODE_BSP and bt.z or 0) + 30 + rnd(16), t = 10})
		end
	end
end

local function fire()
	if fire_cd > 0 then return end
	if player.ammo <= 0 then msg, msg_t = "no shells", 60 return end
	player.ammo = player.ammo - 1
	fire_cd, flash = 28, 6
	snd("shot")
	hitscan()
end

-- ------------------------------------------------------------ monsters ---
local function update_monster(t)
	t.tm = t.tm + 1
	if t.st == "dead" then
		t.spr = t.tm < 10 and 36 or 37
		return
	end
	local dx, dy = player.x - t.x, player.y - t.y
	local d = sqrt(dx * dx + dy * dy)
	-- line of sight is re-checked every 8 frames per monster, staggered
	if (frame + (t.slot or 0)) % 8 == 0 or t.sees == nil then
		t.sees = d < 1100 and grid_los(t.x, t.y, player.x, player.y)
	end
	local sees = t.sees
	if t.st == "idle" then
		t.spr = 32
		if sees or t.hp < KIND.monster_grunt.hp then t.st, t.tm = "chase", flr(rnd(40)) end
		return
	end
	if t.st == "pain" then
		t.spr = 35
		if t.tm > 10 then t.st, t.tm = "chase", 0 end
		return
	end
	if t.st == "attack" then
		t.spr = 34
		if t.tm == 14 then
			-- fireball aimed at the player's eye
			local sz = (mode == MODE_BSP and t.z or 0) + 40
			local tz = eye_z() - 8
			local ux, uy, uz = dx / d, dy / d, (tz - sz) / d
			add(things, {cls = "fireball", x = t.x + ux * 20, y = t.y + uy * 20, z = sz, vx = ux * 3.5, vy = uy * 3.5, vz = uz * 3.5,
				spr = 38, w = 16, h = 16, sw = 16, sh = 16, r = 6, fullbright = true, bb_z = -8, tm = 0})
			snd("enemy")
		end
		if t.tm > 30 then t.st, t.tm = "chase", 0 end
		return
	end
	-- chase
	t.spr = 32 + flr(t.tm / 12) % 2
	if sees and d < 700 and t.tm > 90 and rnd(1) < 0.015 then t.st, t.tm = "attack", 0 return end
	if d > 70 then
		local sp = 1.4
		local ox, oy = t.x, t.y
		move_body(t, dx / d * sp, dy / d * sp, t.r)
		if t.x == ox and t.y == oy then       -- stuck: sidestep
			local s = (flr(t.tm / 60) % 2 == 0) and 1 or -1
			move_body(t, -dy / d * sp * s, dx / d * sp * s, t.r)
		end
	end
end

local function update_fireball(t)
	t.tm = t.tm + 1
	t.x, t.y, t.z = t.x + t.vx, t.y + t.vy, t.z + t.vz
	t.spr = 38 + flr(t.tm / 4) % 2
	local dx, dy, dz = player.x - t.x, player.y - t.y, eye_z() - 16 - t.z
	if dx * dx + dy * dy < 22 * 22 and (mode == MODE_RAY or abs(dz) < 40) then
		player.hp = player.hp - 10
		snd("hurt")
		t.dead = true
		return
	end
	if grid_solid(t.x, t.y) or t.tm > 240 or (mode == MODE_BSP and point_solid(t.x, t.y, t.z)) then
		t.dead = true
		add(fx_list, {x = t.x - t.vx * 2, y = t.y - t.vy * 2, z = t.z, t = 12})
	end
end

-- 1-9: warp to the viewpoints tools/fps-lab (screenshots, bench) compare
local WARPS = {  -- grid col, row (row 0 = north), yaw, pitch
	{6, 9.4, 0.25, 0}, {18.6, 11.4, 0.13, 0.02}, {12.5, 5.5, 0, 0},
	{6.5, 15.2, 0.75, 0.03}, {18.8, 20.5, 0.04, 0}, {26.5, 20, 0, 0},
	{37.2, 21.6, 0.07, -0.03}, {43, 6.4, 0.25, 0.05}, {31.6, 4, 0.5, 0},
}
local function warp_keys()
	for i, w in ipairs(WARPS) do
		if keyp(tostring(i)) then
			player.x, player.y = w[1] * CELL + CELL / 2, (LEVEL.grid.h - 1 - w[2]) * CELL + CELL / 2 + LEVEL.grid.y0
			player.x = player.x + LEVEL.grid.x0
			player.yaw, player.pitch = w[3], w[4]
			settle_player()
		end
	end
end

-- G: swap palette + art set, then rebuild everything that bakes colours.
-- The rebuild (surface cache) takes a few seconds, so the request shows a
-- notice for a frame first and the work happens on the next update.
local pal_pending = false              -- false / "asked" / "shown"
function switch_palette()
	pal_pending = "asked"
end
local function do_switch_palette()
	gfx_set_palette(3 - pal_set)
	surf_texels = build_surfaces()
	msg, msg_t = "palette: " .. PALETTES[pal_set].name, 120
end

local function door_moved(d)
	local dx, dy = player.x - d.cx, player.y - d.cy
	if dx * dx + dy * dy < 500 * 500 then snd("door") end
end

-- ---------------------------------------------------------------- menu ---
-- pick the renderer; the level spins slowly behind, drawn by the one selected
local MENU_ITEMS = {
	{MODE_RAY, "RAYCASTER", "grid DDA, Wolfenstein style"},
	{MODE_BSP, "TRUE 3D", "BSP + lightmaps, Quake style"},
}
local function menu_box(i)
	local w, h = detail_half and 180 or 220, detail_half and 26 or 34
	local y = CY - h - 4 + (i - 1) * (h + 8)
	return CX - w / 2, y, w, h
end

local menu_mouse = 0
function update_menu()
	if keyp("up") or keyp("w") or btnp(2) then menu_sel = MODE_RAY end
	if keyp("down") or keyp("s") or btnp(3) then menu_sel = MODE_BSP end
	if keyp("h") then show_stats = not show_stats end
	if keyp("g") then switch_palette() end
	local start = keyp("z") or keyp("space") or keyp("enter") or btnp(4) or btnp(5)
	local mx, my, mb = mouse()
	for i, it in ipairs(MENU_ITEMS) do
		local x, y, w, h = menu_box(i)
		if mx >= x and mx < x + w and my >= y and my < y + h then   -- mouse() is in vid() pixels
			menu_sel = it[1]
			if mb & 1 == 1 and menu_mouse & 1 == 0 then start = true end
		end
	end
	menu_mouse = mb
	player.yaw = player.yaw + 0.0008
	if mode ~= menu_sel then mode = menu_sel; settle_player() end
	if start then
		in_menu = false
		fire_cd = 20          -- the click/Z that started the game doesn't fire
		locked = mb & 1 == 1
	end
end

local function draw_menu()
	for i, it in ipairs(MENU_ITEMS) do
		local x, y, w, h = menu_box(i)
		local on = menu_sel == it[1]
		rectfill(x, y, x + w - 1, y + h - 1, UI[on and 1 or 0])
		rect(x, y, x + w - 1, y + h - 1, UI[on and 10 or 5])
		print(it[2], x + 8, y + 5, UI[on and 7 or 6])
		print(it[3], x + 8, y + h - 12, UI[on and 12 or 5])
	end
	local _, y, _, h = menu_box(2)
	print("up/down + Z or click", CX - 50, y + h + 8, UI[6])
end

-- -------------------------------------------------------------- update ---
function _update()
	frame = frame + 1
	if pal_pending then
		if pal_pending == "shown" then pal_pending = false; do_switch_palette() end
		return
	end
	snd_update()
	anim_update(frame)
	if msg_t > 0 then msg_t = msg_t - 1 end
	update_detail()
	if in_menu then update_menu() return end
	if keyp("m") then
		in_menu, menu_sel, locked = true, mode, false
		if mouselock then mouselock(false) end
		return
	end
	if keyp("tab") then
		mode = (mode == MODE_BSP) and MODE_RAY or MODE_BSP
		settle_player()
		info((mode == MODE_BSP) and "TRUE 3D  (BSP + surface cache)" or "RAYCASTER  (grid slice at eye height)", 120)
	end
	if keyp("r") then reset_game() end
	if keyp("h") then show_stats = not show_stats end
	if keyp("g") then switch_palette() end
	warp_keys()
	if player.hp <= 0 then
		if btnp(4) or btnp(5) then reset_game() end
		return
	end

	-- look
	local mx, my, mb = mouse()
	if mb & 1 == 1 then locked = true end
	if keyp("escape") then locked = false end
	if locked then
		local dx, dy = mouselock(true, 0.5, 0)
		player.yaw = player.yaw - (dx or 0) * 0.0009
		player.pitch = player.pitch - (dy or 0) * 0.0009
	end
	if key("left") then player.yaw = player.yaw + 0.008 end
	if key("right") then player.yaw = player.yaw - 0.008 end
	if key("up") then player.pitch = player.pitch + 0.006 end
	if key("down") then player.pitch = player.pitch - 0.006 end
	player.pitch = mid(-0.14, player.pitch, 0.14)

	-- move
	local f, s = 0, 0
	if key("w") then f = f + 1 end
	if key("s") then f = f - 1 end
	if key("a") then s = s - 1 end
	if key("d") then s = s + 1 end
	local fx, fy = cos(player.yaw), fsin(player.yaw)
	local rx, ry = fsin(player.yaw), -cos(player.yaw)
	local sp = 3.2
	if f ~= 0 and s ~= 0 then sp = sp * 0.7071 end
	move_body(player, (fx * f + rx * s) * sp, (fy * f + ry * s) * sp, RADIUS)
	if f ~= 0 or s ~= 0 then bob = bob + 0.035 end

	doors_update(player, things, frame, door_moved)
	if (mb & 1 == 1 and locked) or key("z") or key("space") or btn(4) then fire() end
	if fire_cd > 0 then fire_cd = fire_cd - 1 end
	if flash > 0 then flash = flash - 1 end

	-- things
	for i = #things, 1, -1 do
		local t = things[i]
		if t.cls == "monster_grunt" then
			update_monster(t)
		elseif t.cls == "fireball" then
			update_fireball(t)
		elseif t.pickup then
			local dx, dy = player.x - t.x, player.y - t.y
			if dx * dx + dy * dy < 30 * 30 then
				if t.pickup == "health" and player.hp < 100 then
					player.hp = min(100, player.hp + 25); t.dead = true; snd("pickup"); msg, msg_t = "+25 health", 60
				elseif t.pickup == "ammo" then
					player.ammo = player.ammo + 10; t.dead = true; snd("pickup"); msg, msg_t = "+10 shells", 60
				end
			end
		end
		if t.dead then deli(things, i) end
		-- 3D mode: things sit on the brush floors; raycaster: everything on z=0
		if t.cls ~= "fireball" then
			if mode == MODE_BSP then
				if t.cls == "monster_grunt" and (t.x ~= t._fx or t.y ~= t._fy or t._fz ~= t.z3) then
					local g = floor_at(t.x, t.y, 6, t.z3 + 50)
					t.z3 = t.z3 + (g - t.z3) * 0.3
					if abs(g - t.z3) < 0.5 then t.z3 = g end
					t._fx, t._fy, t._fz = t.x, t.y, t.z3
				end
				t.z = t.z3
			else
				t.z = 0
			end
		end
	end
	for i = #fx_list, 1, -1 do
		local e = fx_list[i]
		e.t = e.t - 1
		if e.t <= 0 then deli(fx_list, i) end
	end
	if player.hp <= 0 then msg, msg_t = "you died - press Z", 9999 end
	if player.kills == count_monsters() and msg_t <= 0 and not won then
		won = true; msg, msg_t = "level clear!", 300
	end
end

function count_monsters()
	local n = 0
	for t in all(things) do if t.cls == "monster_grunt" then n = n + 1 end end
	return n
end

-- ---------------------------------------------------------------- draw ---
local function camera_state()
	local b = (mode == MODE_BSP and player.z or 0) + EYE + sin(bob) * 2
	return {x = player.x, y = player.y, eye = b, yaw = player.yaw, pitch = player.pitch}
end

local function draw_list()
	local l = {}
	for t in all(things) do
		if mode == MODE_BSP and t.mesh_def then
			local torch = t.cls == "prop_torch"
			local anim = flr(frame / 8 + t.x) % 2
			local o = t._dl
			if not o then
				o = {mesh = t.mesh_def, yaw = t.yaw, h = torch and 24 or t.h,
					w = 16, sw = 16, sh = 24, bb_z = 44, fullbright = t.fullbright,
					-- far away the mesh is swapped for the raycaster's billboard (LOD)
					lod_w = t.w, lod_h = t.h, lod_sw = t.sw, lod_sh = t.sh}
				o.sec = grid_sector(t.x, t.y)            -- props never move
				t._dl = o
			end
			o.x, o.y, o.z = t.x, t.y, t.z
			o.spr = torch and (44 + anim) or nil
			o.lod_spr = torch and (42 + anim) or t.base_spr
			add(l, o)
		else
			if t.cls == "prop_torch" then t.spr = 42 + flr(frame / 8 + t.x) % 2 end
			add(l, t)
		end
	end
	for e in all(fx_list) do
		add(l, {x = e.x, y = e.y, z = e.z - 4, spr = 50, w = 8, h = 8, sw = 8, sh = 8, fullbright = true})
	end
	return l
end

function _draw()
	if pal_pending then
		local t = "switching palette..."
		rectfill(CX - 50, CY - 8, CX + 50, CY + 8, UI[1])
		print(t, CX - #t * 2.5, CY - 3, UI[7])
		pal_pending = "shown"
		return
	end
	cls(0)
	local cam = camera_state()
	local list = draw_list()
	if in_menu then
		cam.pitch = 0
		if mode == MODE_BSP then bsp_draw(cam, list) else ray_draw(cam, list) end
		draw_menu()
		return
	end
	if mode == MODE_BSP then
		bsp_draw(cam, list)
	else
		ray_draw(cam, list)
	end

	-- weapon + crosshair
	local wb = flr(sin(bob * 0.5) * 3 + abs(cos(bob * 0.5)) * 2) + (fire_cd > 18 and 4 or 0)
	if detail_half then
		sspr(VAR_BASE + (flash > 0 and 49 or 48) * 4, 0, 0, 96, 64, CX - 24, SH - 32 + flr(wb / 2), 48, 32)
	else
		spr(VAR_BASE + (flash > 0 and 49 or 48) * 4, CX - 48, SH - 64 + wb)
	end
	pset(CX, CY, UI[7]); pset(CX - 3, CY, UI[6]); pset(CX + 3, CY, UI[6]); pset(CX, CY - 3, UI[6]); pset(CX, CY + 3, UI[6])
	if player.hp <= 0 then rectfill(0, 0, SW, SH, UI[8]) end

	-- HUD: game numbers + the renderer comparison readout
	rectfill(0, SH - 12, 64, SH, UI[1])
	print("hp " .. max(0, player.hp), 4, SH - 10, UI[player.hp > 30 and 7 or 8])
	rectfill(SW - 72, SH - 12, SW, SH, UI[1])
	print("shells " .. player.ammo, SW - 68, SH - 10, UI[9])
	local cpu = stat and stat(1) or 0
	cpu_hist[1] = cpu_hist[1] * 0.9 + cpu * 0.1
	if show_stats then
		rectfill(0, 0, detail_half and SW or 170, detail_half and 36 or 30, UI[1])
		if mode == MODE_BSP then
			print("TRUE 3D  bsp+surface cache", 3, 2, UI[11])
			print("nodes " .. bsp_stats.nodes .. "  polys " .. bsp_stats.polys .. "  tris " .. bsp_stats.tris, 3, 11, UI[6])
			print("objs " .. bsp_stats.objs .. "  culled " .. bsp_stats.culled .. "  sectors " .. bsp_stats.sectors .. "/" .. bsp_stats.nsec, 3, 20, UI[6])
		else
			print("RAYCASTER  grid slice", 3, 2, UI[12])
			print("cols " .. ray_stats.cols .. "  rows " .. ray_stats.rows, 3, 11, UI[6])
			print("sprites " .. ray_stats.sprites .. "  tline3d rows " .. ray_stats.lines, 3, 20, UI[6])
		end
		local fps = flr(stat and stat(7) or 60)
		print("cpu " .. flr(cpu_hist[1] * 100) .. "% " .. fps .. "fps " .. (detail_half and "240" or "480"),
			detail_half and 3 or 128, detail_half and 29 or 20, UI[fps >= 60 and 11 or fps >= 30 and 10 or 8])
	else
		rectfill(SW - 64, 0, SW, 11, UI[1])   -- keep the kill count readable
	end
	print("kills " .. player.kills .. "/" .. count_monsters(), SW - 60, 2, UI[7])
	if msg_t > 0 then
		local w = #msg * 5
		print(msg, CX - w / 2, 44, UI[10])
	end
end
