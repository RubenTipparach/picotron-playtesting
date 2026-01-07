--[[pod_format="raw",created="2025-01-01",modified="2025-01-01"]]

-- GFX to PNG Spritesheet Exporter
-- Drop a .gfx file to export as a PNG spritesheet

local gfx_data = nil
local gfx_path = nil
local status = "Drop a .gfx file here"
local export_status = nil
local export_timer = 0

function _init()
	window{
		width = 280,
		height = 160,
		title = "GFX to PNG Exporter",
		resizeable = false,
	}

	-- handle file drops
	on_event("drop_items", function(msg)
		local dropped_item = msg.items[1]
		if dropped_item and dropped_item.fullpath then
			local path = dropped_item.fullpath
			local ftype = fstat(path)
			if ftype == "folder" then
				import_folder(path)
			elseif path:ext() == "gfx" then
				load_gfx(path)
			else
				status = "Not a .gfx file or folder!"
				export_status = nil
			end
		end
	end)

	-- check if a file was passed as argument on launch
	local args = env().argv
	if args and #args > 0 then
		local path = args[1]
		if path:sub(-4) == ".gfx" then
			load_gfx(path)
		end
	end
end

function import_folder(folder_path)
	status = "Importing PNGs..."

	-- list all png files in folder
	local files = ls(folder_path)
	local pngs = {}

	for _, fname in pairs(files) do
		if fname:ext() == "png" then
			add(pngs, fname)
		end
	end

	if #pngs == 0 then
		export_status = "No PNG files found in folder"
		export_timer = 180
		return
	end

	-- sort by filename (numeric order if possible)
	table.sort(pngs, function(a, b)
		local na = tonumber(get_basename(a))
		local nb = tonumber(get_basename(b))
		if na and nb then
			return na < nb
		end
		return a < b
	end)

	-- create gfx data table
	local gfx = {}
	local count = 0

	for i, fname in ipairs(pngs) do
		local img = fetch(folder_path.."/"..fname)
		if img and type(img) == "userdata" then
			-- sprite index is 0-based
			local idx = i - 1
			gfx[idx] = {
				bmp = img,
				flags = 0,
				pan_x = 0,
				pan_y = 0,
				zoom = 8
			}
			count += 1
		end
	end

	if count == 0 then
		export_status = "Failed to load any PNGs"
		export_timer = 180
		return
	end

	-- generate output filename with datetime
	local folder_name = get_filename(folder_path)
	local timestamp = date("%Y%m%d-%H%M%S")
	local out_path = folder_path.."/"..folder_name.."-"..timestamp..".gfx"

	-- store the gfx file
	store(out_path, gfx)

	export_status = "Created: "..folder_name.."-"..timestamp..".gfx"
	export_timer = 180
	status = "Imported "..count.." sprites"
end

function load_gfx(path)
	gfx_path = path
	gfx_data = fetch(path)

	if gfx_data then
		status = "Loaded: "..get_filename(path)
		export_to_png(path)
	else
		status = "Failed to load: "..get_filename(path)
		gfx_data = nil
		gfx_path = nil
	end
end

function get_filename(path)
	-- extract filename from path
	local name = path:match("([^/\\]+)$") or path
	return name
end

function get_basename(path)
	-- get filename without extension
	local name = get_filename(path)
	return name:match("(.+)%..+$") or name
end

function get_dir(path)
	-- get directory from path
	return path:match("(.+)[/\\]") or ""
end

function export_to_png(gfx_path)
	if not gfx_data then
		export_status = "No GFX loaded"
		export_timer = 180
		return
	end

	-- gfx_data is a table with 256 sprites indexed 0-255
	-- each sprite is a u8 userdata with its own dimensions
	local sprites = {}
	local max_w, max_h = 0, 0

	-- read all sprites and find max dimensions
	-- gfx file structure: gfx_data[i] = {bmp=userdata, flags=num, ...}
	-- try all keys in the table
	for k, entry in pairs(gfx_data) do
		local s = nil
		-- entry could be the sprite data directly or a table with .bmp
		if type(entry) == "userdata" then
			s = entry
		elseif type(entry) == "table" and entry.bmp then
			s = entry.bmp
		end

		if s and type(s) == "userdata" then
			local w = s:width()
			local h = s:height() or w
			if w > 0 and h > 0 then
				local idx = tonumber(k) or #sprites
				sprites[idx] = s
				if w > max_w then max_w = w end
				if h > max_h then max_h = h end
			end
		end
	end

	if max_w == 0 then
		export_status = "No sprites found"
		export_timer = 180
		return
	end

	-- generate output folder
	local dir = get_dir(gfx_path)
	local basename = get_basename(gfx_path)
	local out_dir
	if #dir > 0 then
		out_dir = dir.."/"..basename
	else
		out_dir = basename
	end

	-- create output folder
	mkdir(out_dir)

	-- export each sprite as individual PNG
	local count = 0
	for idx, s in pairs(sprites) do
		local out_path = out_dir.."/"..tostring(idx)..".png"
		store(out_path, s)
		count += 1
	end

	export_status = "Exported "..count.." sprites to "..basename.."/"
	export_timer = 180
end

function _update()
	-- countdown export status display
	if export_timer > 0 then
		export_timer -= 1
	end
end

function _draw()
	cls(1)

	local w, h = get_display():width(), get_display():height()
	local cx, cy = w/2, h/2

	-- draw drop zone
	rect(10, 10, w-10, h-30, 6)

	-- draw icon/preview area
	rectfill(cx-30, cy-30, cx+30, cy+10, 5)

	-- draw grid pattern to represent sprites
	for i = 0, 3 do
		for j = 0, 2 do
			local x = cx - 24 + i * 12
			local y = cy - 24 + j * 12
			rectfill(x, y, x+10, y+10, 6 + (i+j) % 2)
		end
	end

	-- main status text
	local tw = print(status, 0, -20)
	print(status, cx - tw/2, cy + 20, 7)

	-- export status
	if export_timer > 0 and export_status then
		local col = 11 -- green
		if export_status:sub(1,6) == "Failed" or export_status:sub(1,2) == "No" then
			col = 8 -- red
		end
		local tw2 = print(export_status, 0, -20)
		print(export_status, cx - tw2/2, h - 20, col)
	else
		local hint = "Drag & drop .gfx file"
		local tw2 = print(hint, 0, -20)
		print(hint, cx - tw2/2, h - 20, 6)
	end
end
