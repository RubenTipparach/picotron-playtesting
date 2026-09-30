--[[pod_format="raw"]]
--[[
	png2gfx — convert a folder of PNGs into a Picotron .gfx sheet.

	The reverse of the starter kit's "GFX to PNG" exporter
	(picotron-starter-kit/export-spr.p64): that cart reads a .gfx and writes
	one PNG per sprite; this reads PNGs and writes a .gfx.

	A .gfx is a POD table of sprite entries:
		gfx[index] = { bmp = <u8 userdata>, flags = 0,
		               pan_x = 0, pan_y = 0, zoom = 8 }
	`bmp` is exactly what fetch()ing a .png returns (the image as indexed
	userdata, matched to the current palette). store()ing the table to a
	"*.gfx" path writes a sheet Picotron can draw with spr().

	Headless usage (scripts/build.sh runs this before the export):
		picotron -home <HOME> -x tools/png2gfx.lua
	Reads /game.p64/sprites/*.png, writes /game.p64/gfx/0.gfx. (No CLI args:
	a trailing arg after `-x file` makes picotron boot it as a cart instead.)
	Headless picotron swallows print/printh, so progress is reported as marker
	directories under /out (= <HOME>/drive/out), which build.sh dumps.

	Sprite indices come from filenames: the LEADING integer of the stem is the
	index, so both "6.png" and "units_human/006_worker_walk0.png" map to 6.
	The sprites dir is organised into named category folders (tiles/, units_*/,
	buildings_*/, vehicles/, aircraft/, fx/, ui/) so the art is hand-editable;
	this script recurses into them. Files without a leading integer get the
	next free index. If two files claim the same index, the later one wins.
]]

local IN_DIR  = (env().argv and env().argv[1]) or "/game.p64/sprites"
local OUT_GFX = (env().argv and env().argv[2]) or "/game.p64/gfx/0.gfx"
local MARK    = "/out"

local function mark(s) pcall(mkdir, MARK .. "/" .. (tostring(s):gsub("[^%w%.%-]", "_"))) end
local function ftype(p) local ok, t = pcall(fstat, p); if ok then return t end end
local function sls(p) local ok, r = pcall(ls, p); if ok and r then return r end return {} end

local function stem(path)
	local name = path:match("([^/\\]+)$") or path
	return (name:match("(.+)%..+$")) or name
end

pcall(mkdir, MARK)
mark("png2gfx_ran")
mark("indir." .. tostring(ftype(IN_DIR)))

-- collect PNG paths, recursing into the named category folders
local pngs = {}
local function scan(dir)
	for _, f in ipairs(sls(dir)) do
		local p = dir .. "/" .. f
		if ftype(p) == "folder" then scan(p)
		elseif f:sub(-4):lower() == ".png" then add(pngs, p) end
	end
end
scan(IN_DIR)
mark("png_count." .. #pngs)
if #pngs == 0 then mark("FAIL.no_pngs") exit(1) end

-- order by sprite index (leading integer of the stem; indexless files last),
-- insertion-sorted by hand (Picotron's table lib has no sort())
local function idx_of(path) return tonumber(stem(path):match("^(%d+)") or "") end
local function before(a, b)
	local na, nb = idx_of(a), idx_of(b)
	if na and nb then return na < nb end
	if na then return true end
	if nb then return false end
	return a < b
end
for i = 2, #pngs do
	local v, j = pngs[i], i - 1
	while j >= 1 and before(v, pngs[j]) do pngs[j+1] = pngs[j]; j -= 1 end
	pngs[j+1] = v
end

local gfx, next_free, count = {}, 0, 0
for _, path in ipairs(pngs) do
	local img = fetch(path)
	if type(img) == "userdata" then
		local idx = idx_of(path) or next_free
		gfx[idx] = { bmp = img, flags = 0, pan_x = 0, pan_y = 0, zoom = 8 }
		next_free = max(next_free, idx + 1)
		count += 1
		mark("spr." .. idx .. "." .. img:width() .. "x" .. (img:height() or 0))
	else
		mark("skip." .. stem(path))
	end
end
if count == 0 then mark("FAIL.no_images_decoded") exit(1) end

-- Fill any holes in the index range. Sprite filenames can be sparse (e.g. the
-- cart bakes 127,128 then skips to 130), but Picotron's .gfx decoder walks the
-- sheet by index when the cart fetch()es it: a nil hole makes it crash on load
-- ("/system/lib/resources.lua: attempt to index a nil value (field '?')"). A
-- 1x1 transparent placeholder at each gap keeps the stored sheet contiguous.
local maxidx = -1
for k in pairs(gfx) do if k > maxidx then maxidx = k end end
local placeholder = userdata("u8", 1, 1)
for i = 0, maxidx do
	if not gfx[i] then
		gfx[i] = { bmp = placeholder, flags = 0, pan_x = 0, pan_y = 0, zoom = 8 }
		mark("fill." .. i)
	end
end

local dir = OUT_GFX:match("(.+)/[^/]+$")
if dir then pcall(mkdir, dir) end
pcall(store, OUT_GFX, gfx)
mark((ftype(OUT_GFX) == "file") and "RESULT.OK" or "RESULT.store_failed")
exit(0)
