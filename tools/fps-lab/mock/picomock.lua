--[[
	picomock.lua - a small software mock of the Picotron APIs the FPS Render
	Lab cart uses, so the REAL cart code can run under stock Lua 5.4 on a
	machine without Picotron (e.g. CI or a cloud container):

	    lua5.4 tools/fps-lab/mock/run.lua   (see run.lua / screenshots.py)

	It is not Picotron. It exists to catch runtime errors, render reference
	screenshots and count work (tline3d pixels / calls, Lua VM instructions)
	for both renderers. Semantics follow docs/picotron_manual.txt:
	  * userdata ops with offsets/strides/spans evaluate left to right,
	    LHS read at the destination index (so prefix-sum tricks work)
	  * tline3d: u,v,w interpolate linearly, texel = (u/w, v/w) (callers pass
	    u*w, v*w - the convention textri relies on); sprite sources wrap;
	    i16 map sources sample tile sprites of 0x550e x 0x550f pixels
	  * colour table 0 lives at 0x8000 (layout here: [src*64+dst])
]]

local floor, sqrtf, absf = math.floor, math.sqrt, math.abs

-- ----------------------------------------------------------- userdata ---
local UD = {}
local mt = {}
local function is_ud(v) return type(v) == "table" and getmetatable(v) == mt end

local function conv(t, v)
	if t == "f64" then return v end
	v = floor(v)
	if t == "u8" then return v & 0xff end
	if t == "i16" then v = v & 0xffff; if v >= 0x8000 then v = v - 0x10000 end return v end
	if t == "i32" then v = v & 0xffffffff; if v >= 0x80000000 then v = v - 0x100000000 end return v end
	return v
end

function userdata(typ, w, h, init)
	local u = {typ = typ, w = w, h = h or 1, dims = h and 2 or 1, d = {}}
	for i = 0, u.w * u.h - 1 do u.d[i] = 0 end
	return setmetatable(u, mt)
end

function vec(...)
	local a = {...}
	local u = userdata("f64", #a)
	for i = 1, #a do u.d[i - 1] = a[i] end
	return u
end

mt.__index = function(u, k)
	if type(k) == "number" then return u.d[k] end
	if k == "x" then return u.d[0] elseif k == "y" then return u.d[1] elseif k == "z" then return u.d[2] end
	return UD[k]
end
mt.__newindex = function(u, k, v)
	if type(k) == "number" then
		if k >= 0 and k < u.w * u.h then u.d[k] = conv(u.typ, v) end
	else rawset(u, k, v) end
end
mt.__len = function(u) return u.w * u.h end

local function clone(u)
	local c = userdata(u.typ, u.w, u.dims == 2 and u.h or nil)
	for i = 0, u.w * u.h - 1 do c.d[i] = u.d[i] end
	return c
end

local OPS = {
	add = function(a, b) return a + b end, sub = function(a, b) return a - b end,
	mul = function(a, b) return a * b end, div = function(a, b) return a / b end,
	min = function(a, b) return math.min(a, b) end, max = function(a, b) return math.max(a, b) end,
	copy = function(a, b) return b end,
}
for name, f in pairs(OPS) do
	UD[name] = function(self, src, dest, soff, doff, len, sstride, dstride, spans)
		local out
		if dest == true then out = self elseif is_ud(dest) then out = dest else out = clone(self) end
		local n = self.w * self.h
		soff, doff = soff or 0, doff or 0
		len = len or (n - doff)
		sstride, dstride, spans = sstride or len, dstride or len, spans or 1
		local sud = is_ud(src)
		local sd = sud and src.d
		local sn = sud and src.w * src.h or 0
		local od, sdd, t = out.d, self.d, out.typ
		for s = 0, spans - 1 do
			for k = 0, len - 1 do
				local di = doff + s * dstride + k
				if di >= 0 and di < n then
					local sv
					if sud then
						local si = soff + s * sstride + k
						if si < 0 or si >= sn then goto continue end
						sv = sd[si]
					else sv = src or 0 end
					od[di] = conv(t, f(sdd[di], sv))
				end
				::continue::
			end
		end
		return out
	end
end

local function binop(a, b, f)
	local base = is_ud(a) and a or b
	local o = clone(base)
	local n = base.w * base.h
	for i = 0, n - 1 do
		local x = is_ud(a) and a.d[i] or a
		local y = is_ud(b) and b.d[i] or b
		o.d[i] = conv(o.typ, f(x, y))
	end
	return o
end
mt.__add = function(a, b) return binop(a, b, OPS.add) end
mt.__sub = function(a, b) return binop(a, b, OPS.sub) end
mt.__mul = function(a, b) return binop(a, b, OPS.mul) end
mt.__div = function(a, b) return binop(a, b, OPS.div) end

function UD.width(u) return u.w end
function UD.height(u) return u.h end
function UD.get(u, x, y, n)
	if u.dims == 1 then
		local c = y or 1
		local r = {}
		for i = 0, c - 1 do r[#r + 1] = u.d[x + i] end
		return table.unpack(r)
	end
	local i0 = x + (y or 0) * u.w
	local r = {}
	for i = 0, (n or 1) - 1 do r[#r + 1] = u.d[i0 + i] end
	return table.unpack(r)
end
function UD.set(u, x, y, ...)
	local vals, i0
	if u.dims == 1 then vals = {y, ...}; i0 = x
	else vals = {...}; i0 = x + y * u.w end
	for i, v in ipairs(vals) do u[i0 + i - 1] = v end
	return u
end
function UD.sort(u, col, desc)
	local rows = {}
	for r = 0, u.h - 1 do
		local row = {}
		for c = 0, u.w - 1 do row[c] = u.d[r * u.w + c] end
		rows[#rows + 1] = row
	end
	for i = 2, #rows do
		local v, j = rows[i], i - 1
		while j >= 1 and ((not desc and rows[j][col] > v[col]) or (desc and rows[j][col] < v[col])) do
			rows[j + 1] = rows[j]; j = j - 1
		end
		rows[j + 1] = v
	end
	for r = 0, u.h - 1 do for c = 0, u.w - 1 do u.d[r * u.w + c] = rows[r + 1][c] end end
	return u
end
function UD.matmul3d(u, m, out, batch)
	out = (out == true) and u or out or clone(u)
	local md, mw = m.d, m.w
	local a00, a10, a20, a30 = md[0], md[mw], md[2 * mw], md[3 * mw]
	local a01, a11, a21, a31 = md[1], md[mw + 1], md[2 * mw + 1], md[3 * mw + 1]
	local a02, a12, a22, a32 = md[2], md[mw + 2], md[2 * mw + 2], md[3 * mw + 2]
	local w = u.w
	for r = 0, u.h - 1 do
		local b = r * w
		local x, y, z = u.d[b], u.d[b + 1], u.d[b + 2]
		out.d[b] = x * a00 + y * a10 + z * a20 + a30
		out.d[b + 1] = x * a01 + y * a11 + z * a21 + a31
		out.d[b + 2] = x * a02 + y * a12 + z * a22 + a32
	end
	return out
end

-- ------------------------------------------------------------ memory ----
RAM = {}
function peek(a) return RAM[a] or 0 end
function poke(a, ...) for i, v in ipairs({...}) do RAM[a + i - 1] = v & 0xff end end
function UD.peek(u, addr, off, n)
	off = off or 0; n = n or (u.w * u.h - off)
	for i = 0, n - 1 do u.d[off + i] = RAM[addr + i] or 0 end
	return u
end
function UD.poke(u, addr, off, n)
	off = off or 0; n = n or (u.w * u.h - off)
	for i = 0, n - 1 do RAM[addr + i] = u.d[off + i] & 0xff end
	return u
end

-- ------------------------------------------------------------- display --
local SW, SH = 480, 270          -- display size (the cart has its own SW/SH globals)
local FB = {}
for i = 0, SW * SH - 1 do FB[i] = 0 end
function vid(m)
	if m == 3 then SW, SH = 240, 135 elseif m == 4 then SW, SH = 160, 90 else SW, SH = 480, 270 end
	for i = 0, SW * SH - 1 do FB[i] = 0 end
	clip()
end
function mock_display_size() return SW, SH end
RGB = {}
local P16 = {0x000000, 0x1d2b53, 0x7e2553, 0x008751, 0xab5236, 0x5f574f, 0xc2c3c7, 0xfff1e8,
	0xff004d, 0xffa300, 0xffec27, 0x00e436, 0x29adff, 0x83769c, 0xff77a8, 0xffccaa}
for i = 0, 63 do RGB[i] = P16[i % 16 + 1] end
local transp = {}
local drawpal = {}
local function reset_ct()
	for c = 0, 63 do
		transp[c] = (c == 0); drawpal[c] = c
		-- like Picotron 0.3: opaque entries carry the table-select bits 0xc0
		for d = 0, 63 do RAM[0x8000 + c * 64 + d] = transp[c] and d or (c | 0xc0) end
	end
end
reset_ct()
local function ct_row(c)
	for d = 0, 63 do RAM[0x8000 + c * 64 + d] = transp[c] and d or (drawpal[c] | 0xc0) end
end
function pal(c0, c1, p)
	if c0 == nil then for c = 0, 63 do drawpal[c] = c end; for c = 0, 63 do ct_row(c) end return end
	p = p or 0
	if p == 2 then RGB[c0] = c1 return end
	if p == 0 then drawpal[c0] = c1; ct_row(c0) end
end
function palt(c, t)
	if c == nil then for i = 0, 63 do transp[i] = (i == 0); ct_row(i) end return end
	transp[c] = t; ct_row(c)
end

local clipx0, clipy0, clipx1, clipy1 = 0, 0, 480, 270
function clip(x, y, w, h)
	if not x then clipx0, clipy0, clipx1, clipy1 = 0, 0, SW, SH return end
	clipx0, clipy0, clipx1, clipy1 = math.max(0, x), math.max(0, y), math.min(SW, x + w), math.min(SH, y + h)
end
function camera() end
function fillp() end
function color() end
function window() end
function cursor() end

STATS = {tl_calls = 0, tl_lines = 0, tl_px = 0, spr_px = 0, shape_px = 0}

local function put_shape(x, y, c)
	if x >= clipx0 and x < clipx1 and y >= clipy0 and y < clipy1 then
		FB[y * SW + x] = RAM[0x8000 + (c & 63) * 64] & 0x3f     -- write mask
		STATS.shape_px = STATS.shape_px + 1
	end
end
local function put_spr(x, y, c)
	local i = y * SW + x
	FB[i] = RAM[0x8000 + (c & 63) * 64 + FB[i]] & 0x3f
end

function cls(c)
	c = c or 0
	for i = 0, SW * SH - 1 do FB[i] = c end
end
function pset(x, y, c) put_shape(floor(x), floor(y), c or 7) end
function pget(x, y) return FB[floor(y) * SW + floor(x)] or 0 end
function rectfill(x0, y0, x1, y1, c)
	x0, x1 = math.min(x0, x1), math.max(x0, x1); y0, y1 = math.min(y0, y1), math.max(y0, y1)
	for y = math.max(floor(y0), clipy0), math.min(floor(y1), clipy1 - 1) do
		for x = math.max(floor(x0), clipx0), math.min(floor(x1), clipx1 - 1) do put_shape(x, y, c or 7) end
	end
end
function rect(x0, y0, x1, y1, c)
	for x = floor(x0), floor(x1) do put_shape(x, floor(y0), c); put_shape(x, floor(y1), c) end
	for y = floor(y0), floor(y1) do put_shape(floor(x0), y, c); put_shape(floor(x1), y, c) end
end
function line(x0, y0, x1, y1, c)
	local n = math.max(absf(x1 - x0), absf(y1 - y0))
	for i = 0, n do
		local t = n == 0 and 0 or i / n
		put_shape(floor(x0 + (x1 - x0) * t + 0.5), floor(y0 + (y1 - y0) * t + 0.5), c or 7)
	end
end
function circfill(x, y, r, c)
	for yy = -r, r do for xx = -r, r do
		if xx * xx + yy * yy <= r * r + r then put_shape(floor(x + xx), floor(y + yy), c or 7) end
	end end
end

-- sprites
SPR = {}
function get_spr(i) return SPR[i] end
function set_spr(i, u) SPR[i] = u end

local function src_ud(s) if is_ud(s) then return s end return SPR[s] end

function sspr(s, sx, sy, sw, sh, dx, dy, dw, dh, fx, fy)
	local u = src_ud(s); if not u then return end
	dw, dh = dw or sw, dh or sh
	if dw <= 0 or dh <= 0 then return end
	local x0, x1 = math.max(clipx0, floor(dx)), math.min(clipx1 - 1, floor(dx + dw - 1e-9))
	local y0, y1 = math.max(clipy0, floor(dy)), math.min(clipy1 - 1, floor(dy + dh - 1e-9))
	for y = y0, y1 do
		local ty = floor((y + 0.5 - dy) / dh * sh)
		if fy then ty = sh - 1 - ty end
		ty = sy + math.max(0, math.min(sh - 1, ty))
		for x = x0, x1 do
			local tx = floor((x + 0.5 - dx) / dw * sw)
			if fx then tx = sw - 1 - tx end
			tx = sx + math.max(0, math.min(sw - 1, tx))
			put_spr(x, y, u.d[ty * u.w + tx] or 0)
			STATS.spr_px = STATS.spr_px + 1
		end
	end
end
function spr(s, x, y, fx, fy)
	local u = src_ud(s); if not u then return end
	sspr(s, 0, 0, u.w, u.h, floor(x), floor(y), u.w, u.h, fx, fy)
end
function blit(src, dest, sx, sy, dx, dy, w, h)
	w, h = w or src.w, h or src.h
	for y = 0, h - 1 do for x = 0, w - 1 do
		local tx, ty = dx + x, dy + y
		if tx >= 0 and ty >= 0 and tx < dest.w and ty < dest.h then
			dest.d[ty * dest.w + tx] = src.d[(sy + y) * src.w + sx + x] or 0
		end
	end end
end
UD.blit = function(src, dest, ...) return blit(src, dest, ...) end

-- tline3d ----------------------------------------------------------------
local function sample(src, u, v)
	if src.typ == "i16" then
		local tw, th = (RAM[0x550e] or 0), (RAM[0x550f] or 0)
		if tw == 0 then tw = 256 end
		if th == 0 then th = 256 end
		local fu, fv = floor(u), floor(v)
		local tile = src.d[(fv % src.h) * src.w + (fu % src.w)]
		local sp = SPR[tile]
		if not sp then return 0 end
		local px = floor((u - fu) * tw * sp.w / tw)
		local py = floor((v - fv) * th * sp.h / th)
		return sp.d[py * sp.w + px] or 0
	end
	local x, y = floor(u) % src.w, floor(v) % src.h
	return src.d[y * src.w + x]
end

local function tl_one(s, x0, y0, x1, y1, u0, v0, u1, v1, w0, w1, flags)
	local src = src_ud(s)
	if not src then return end
	w0, w1 = w0 or 1, w1 or 1
	u0, v0, u1, v1 = u0 or 0, v0 or 0, u1 or 0, v1 or 0
	STATS.tl_lines = STATS.tl_lines + 1
	local dx, dy = x1 - x0, y1 - y0
	local skip_last = flags and (flags & 0x100) ~= 0
	if absf(dx) >= absf(dy) then
		local a, b = floor(x0), floor(x1)
		local st = a <= b and 1 or -1
		if skip_last then b = b - st end
		for px = a, b, st do
			if px >= clipx0 and px < clipx1 then
				local t = dx == 0 and 0 or (px + 0.5 - x0) / dx
				if t < 0 then t = 0 elseif t > 1 then t = 1 end
				local py = floor(y0 + dy * t)
				if py >= clipy0 and py < clipy1 then
					local w = w0 + (w1 - w0) * t
					put_spr(px, py, sample(src, (u0 + (u1 - u0) * t) / w, (v0 + (v1 - v0) * t) / w))
					STATS.tl_px = STATS.tl_px + 1
				end
			end
		end
	else
		local a, b = floor(y0), floor(y1)
		local st = a <= b and 1 or -1
		if skip_last then b = b - st end
		for py = a, b, st do
			if py >= clipy0 and py < clipy1 then
				local t = (py + 0.5 - y0) / dy
				if t < 0 then t = 0 elseif t > 1 then t = 1 end
				local px = floor(x0 + dx * t)
				if px >= clipx0 and px < clipx1 then
					local w = w0 + (w1 - w0) * t
					put_spr(px, py, sample(src, (u0 + (u1 - u0) * t) / w, (v0 + (v1 - v0) * t) / w))
					STATS.tl_px = STATS.tl_px + 1
				end
			end
		end
	end
end

function tline3d(a, ...)
	STATS.tl_calls = STATS.tl_calls + 1
	if is_ud(a) and a.typ == "f64" then
		local off, num, np, stride = ...
		off = off or 0; np = np or a.w; stride = stride or a.w; num = num or a.h
		local d = a.d
		for r = 0, num - 1 do
			local b = off + r * stride
			tl_one(d[b], d[b + 1], d[b + 2], d[b + 3], d[b + 4], d[b + 5], d[b + 6], d[b + 7], d[b + 8],
				np > 9 and d[b + 9] or nil, np > 10 and d[b + 10] or nil, np > 11 and d[b + 11] or nil)
		end
		return
	end
	tl_one(a, ...)
end

-- text: tiny 3x5 font --------------------------------------------------------
local FONT = {}
do
	local g = {
		["0"] = "111101101101111", ["1"] = "010110010010111", ["2"] = "111001111100111", ["3"] = "111001011001111",
		["4"] = "101101111001001", ["5"] = "111100111001111", ["6"] = "100100111101111", ["7"] = "111001001001001",
		["8"] = "111101111101111", ["9"] = "111101111001001", A = "010101111101101", B = "110101110101110",
		C = "011100100100011", D = "110101101101110", E = "111100110100111", F = "111100110100100",
		G = "011100101101011", H = "101101111101101", I = "111010010010111", J = "001001001101010",
		K = "101101110101101", L = "100100100100111", M = "101111111101101", N = "110101101101101",
		O = "010101101101010", P = "110101110100100", Q = "010101101110011", R = "110101110101101",
		S = "011100010001110", T = "111010010010010", U = "101101101101011", V = "101101101010010",
		W = "101101111111101", X = "101101010101101", Y = "101101010010010", Z = "111001010100111",
		[" "] = "000000000000000", ["."] = "000000000000010", [":"] = "000010000010000", ["/"] = "001001010100100",
		["-"] = "000000111000000", ["+"] = "000010111010000", ["%"] = "101001010100101", ["!"] = "010010010000010",
		["("] = "001010010010001", [")"] = "100010010010100", ["_"] = "000000000000111", [","] = "000000000010100",
	}
	for k, v in pairs(g) do FONT[k] = v end
end
function print(s, x, y, c)
	s = tostring(s)
	x, y = floor(x or 0), floor(y or 0)
	for i = 1, #s do
		local ch = s:sub(i, i):upper()
		local gl = FONT[ch] or "111101101101111"
		for yy = 0, 4 do for xx = 0, 2 do
			if gl:sub(yy * 3 + xx + 1, yy * 3 + xx + 1) == "1" then put_shape(x + xx, y + yy, c or 7) end
		end end
		x = x + 5
	end
	return x
end
printh = function(...) io.stderr:write(table.concat({...}, " "), "\n") end

-- math / tables --------------------------------------------------------------
flr = math.floor
ceil = math.ceil
sqrt = function(x) return x >= 0 and sqrtf(x) or 0 end
abs = math.abs
min = function(a, b) return math.min(a, b or 0) end
max = function(a, b) return math.max(a, b or 0) end
function mid(a, b, c) if a > b then a, b = b, a end if b > c then b = c end if a > b then b = a end return b end
function sgn(x) return x < 0 and -1 or 1 end
function sin(a) return -math.sin(a * 2 * math.pi) end
function cos(a) return math.cos(a * 2 * math.pi) end
function atan2(dx, dy) return (math.atan(-dy, dx) / (2 * math.pi)) % 1 end
local seed = 12345
function srand(s) seed = s end
function rnd(n)
	seed = (seed * 1103515245 + 12345) % 2147483648
	local f = seed / 2147483648
	if type(n) == "table" then return n[floor(f * #n) + 1] end
	return f * (n or 1)
end
function add(t, v) t[#t + 1] = v return v end
function del(t, v) for i = 1, #t do if t[i] == v then table.remove(t, i) return v end end end
function deli(t, i) return table.remove(t, i or #t) end
function count(t) return #t end
function all(t)
	if not t then return function() end end
	local i, n = 0, #t
	return function()
		i = i + 1
		while i <= n and t[i] == nil do i = i + 1 end
		if i <= n then return t[i] end
	end
end
function foreach(t, f) for v in all(t) do f(v) end end
function ord(s, i) return string.byte(s, i or 1) end
function chr(...) return string.char(...) end
tostr = tostring
function stat(n) if n == 7 then return 60 end return 0 end
function note() end
function sfx() end
function music() end
function exit() end

-- input ------------------------------------------------------------------------
INPUT = {keys = {}, prev = {}, mx = 240, my = 135, mb = 0, mdx = 0, mdy = 0}
function key(k) return INPUT.keys[k] == true end
function keyp(k) return INPUT.keys[k] == true and not INPUT.prev[k] end
local BTN = {[0] = "left", "right", "up", "down", "z", "x"}
function btn(b) return INPUT.keys[BTN[b]] == true end
function btnp(b) return keyp(BTN[b]) end
function mouse() return INPUT.mx, INPUT.my, INPUT.mb, 0, 0 end
function mouselock() return INPUT.mdx, INPUT.mdy end

-- carts ----------------------------------------------------------------------
CART_DIR = CART_DIR or "."
function include(f)
	local chunk, err = loadfile(CART_DIR .. "/" .. f)
	if not chunk then error(err) end
	return chunk()
end

-- framebuffer out --------------------------------------------------------------
function mock_save_ppm(path)
	local f = assert(io.open(path, "wb"))
	f:write(string.format("P6\n%d %d\n255\n", SW, SH))
	local parts = {}
	for i = 0, SW * SH - 1 do
		local c = RGB[FB[i] & 63]
		parts[#parts + 1] = string.char((c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff)
		if #parts >= 4096 then f:write(table.concat(parts)); parts = {} end
	end
	f:write(table.concat(parts))
	f:close()
end
