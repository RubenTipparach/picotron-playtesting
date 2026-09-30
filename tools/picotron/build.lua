--[[pod_format="raw"]]
--[[
	Headless Picotron HTML build.

	Invoked by scripts/build.sh as:
		picotron -home <HOME> -x tools/build.lua

	(No trailing cart argument — a positional cart makes picotron boot that
	cart in desktop mode instead of honouring -x.)

	Steps, mirroring what the `export foo.html` terminal command does:
	  1. copy our cart into /ram/cart  (the exporter reads from there)
	  2. open a display so flip() advances frames / schedules child processes
	  3. run the system exporter /system/util/export.lua as its OWN process
	     (include()ing it would hit its exit() and kill us); it builds the rom
	     via cp(/ram/cart -> /ram/expcart.p64.rom) and fills in the html shell
	  4. pump flip() until /out/index.html appears, then exit

	Headless picotron swallows print()/printh(), so the only failure signal is
	a marker dir under /out (= <HOME>/drive/out), which scripts/build.sh dumps.
]]

local OUT      = "/out"
local CART     = "/ram/cart"
local SRC      = (env().argv and env().argv[1]) or "/game.p64"
local OUT_HTML = OUT .. "/index.html"
local EXPORTER = "/system/util/export.lua"

local function ftype(p) local ok, t = pcall(fstat, p); if ok then return t end end
local function mark(s) pcall(mkdir, OUT .. "/" .. (tostring(s):gsub("[^%w%.%-]", "_"))) end

pcall(mkdir, OUT)

-- 1. load our cart so the exporter (which reads /ram/cart) sees it
pcall(rm, CART)
pcall(cp, SRC, CART)
if ftype(CART .. "/main.lua") ~= "file" then
	mark("FAIL.could_not_load_cart")
	exit(1)
end

-- 2. a display so flip() advances frames (and lets the child run)
pcall(window, { width = 480, height = 270 })

-- 3. run the real html exporter as its own process
pcall(create_process, EXPORTER, { argv = { OUT_HTML }, pwd = "/", path = "/" })

-- 4. pump frames until the page is written (~60s ceiling at 60fps)
for _ = 1, 3600 do
	if ftype(OUT_HTML) == "file" then break end
	if not pcall(flip) then
		pcall(function() if yield then yield() end end)
	end
end

if ftype(OUT_HTML) == "file" then
	mark("RESULT.OK")
	exit(0)
end
mark("RESULT.no_html")
exit(1)
