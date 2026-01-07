--[[pod_format="raw",created="2025-10-07 11:28:16",modified="2025-10-09 16:13:06",revision=13,xstickers={}]]
-----------------------------------------------
-- Gif'd
--
-- A simple(?) gif reading library for Picotron
-- Author: Matt Sutton / xietanu

-- Put together using mostly info from:
--	  https://giflib.sourceforge.net/whatsinagif/index.html

-- Want to help make it better? Please do!

-- Gif'd (c) 2025 by Matt Sutton is licensed under
-- CC BY-NC-SA 4.0. To view a copy of this license, visit
-- https://creativecommons.org/licenses/by-nc-sa/4.0/

-- The means you can share/use/adapt/build upon it,
-- as long as you give attribution and it's for
-- non-commercial purposes.
-----------------------------------------------

--[[ Functions:

gifd.decode(bytes, yield_lmt, max_w, max_h)
  Decodes a gif into a form usable (and storable) by Picotron
  Arguments:
	  bytes: the encoded gif bytes in string form
	     (i.e. what you get from fetch("example.gif"))
	  yield_lmt: if running as a coroutine, sets a limit for how
	     often it should yield. Lower numbers mean less CPU use.
	     Experiment to find what works for your case, 100-1000 is
	     probably a reasonable range?
	  max_w, max_h: the maximum width and height of returned gifs
	     Reduses memory usage, which can get very high with larger
	     gifs.

function gifd.get_frame_s(gif,s)
  Get the frame of a gif in the form of a sprite, s seconds
  into the animation.

function gifd.get_frame(gif,n)
  Get the nth frame of a gif in the form of a sprite.

function gifd.draw(gif,x,y,s)
  Draw the gif at a position x,y, s seconds into the animation.

]]--

--[[ Format:
Table with the following keys & values
- header: GIF header, includes GIF version (could matter?), string
- width: pixel width of the gif
- height: pixel height of the gif
- has_global_col: has a global colour table, bool
- n_cols: number of colours in the global table
- bg_col_idx: index (in the global colour space) of the background
    colour
- cols: list of colours in the global colour table, list of tables
    cols[i].idx gives the colour index usable by Picotron, matching
    the currently loaded palette as closely as possible.
--TODO: Make this be able to set the palette instead of match
- frames: list of tables containing the frame image in compressed
-   form and information needed for animation (how long to display,
-   how to dispose of the frame)
]]--

do

-- Convert a hex representation of a colour to something more
-- useful for working with
local function create_colour_from_hex(hex_value, transparent)
	local col = {
		red = (hex_value&0xff0000)>>16,
		green = (hex_value&0xff00)>>8,
		blue = (hex_value&0xff),
	}
		
	col.red_norm = col.red/255
	col.green_norm = col.green/255
	col.blue_norm = col.blue/255
	
	col.vector = vec(col.red_norm,col.green_norm,col.blue_norm)
	
	col.transparent = transparent
	
	return col
end

-- Convert rgb values (with max 255) to a more useful colour
-- representation
local function create_colour_from_rgb(red, green, blue, transparent)
	local col = {
		red = red,
		green = green,
		blue = blue,
	}
		
	col.red_norm = col.red/255
	col.green_norm = col.green/255
	col.blue_norm = col.blue/255
	
	col.vector = vec(col.red_norm,col.green_norm,col.blue_norm)
	
	col.transparent = transparent
	
	return col
end

-- Find the closest match for a set of colours in the current
-- palette
-- Takes s simple approach - could probably be improved
-- Finds closest colour in RGB space
local function match_pal(colours)
	-- Get the colours in the current palette
	local pl = userdata("i32",64):peek(0x5000,0,64)
	local pl_colours = {}
	-- Reserve col 63 for transparency
	for i = 1,63 do
		pl_colours[i]=create_colour_from_hex(pl:get(i))
	end
	
	-- Find the best match for each of the supplied colours
	for _,c in pairs(colours) do
		if c.transparent then
			c.idx = 0
		else
			local best_col
			local best_dist
			for i = 1,63 do 
				local dist = c.vector:distance(pl_colours[i].vector)
				if not best_dist or best_dist > dist then
					best_col = i
					best_dist = dist
				end
			end
			-- And set it in the colour itself
			c.idx = best_col
		end
	end
end


local function gif_return(gif, progress, err)
	return {gif=gif, progress=progress, err=err}
end

-- Convert n bytes in little endian to a value
-- s is the string rep of the bytes
-- st, nd are the start and end indices
local function little_endian(s,st,nd)
	st = st or 1
	nd = nd or #s
	local out = 0
	local mul = 1
	for i = st,nd do
		out += ord(s[i])*mul
		mul*=256
	end
	return out
end

-- Decode the GIF header and return next position to read
local function decode_gif_header(gif,bytes)
	gif.header = sub(bytes,1,6)
	
	if sub(gif.header,1,3):lower() != "gif" then
		return nil, "Does not have gif header."
	end
	
	return 7
end

-- Decode general info about how to display the gif
local function decode_screen_desc(gif,bytes,idx,w,h)
	local screen_desc = sub(bytes,idx,idx+6)
	
	gif.width = little_endian(screen_desc,1,2)
	gif.height = little_endian(screen_desc,3,4)
	
	if (w) gif.width = min(gif.width,w)
	if (h) gif.height = min(gif.height,h)
	
	local packet_field=ord(screen_desc[5])
	gif.has_global_col = packet_field & 0b10000000 == 0b10000000
	gif.col_res = (packet_field & 0b01110000 ) >> 4
	gif.sort_flag = packet_field & 0b00001000 == 0b00001000
	gif.n_cols = 1 << ((packet_field & 0b111) + 1)
	gif.bg_col_idx = ord(screen_desc[6])
	
	return idx + #screen_desc
end

-- Extract the colours in the global colour table
-- These are stored as 3 bytes, r, g, b
local function extract_col_table(bytes, idx, n_cols)
	local col_table_s = sub(bytes,idx,idx-1+3*n_cols)
	
	local cols = {}
	
	for i = 0,n_cols-1 do
		cols[i] = create_colour_from_rgb(
			ord(col_table_s[i*3+1]),
			ord(col_table_s[i*3+2]),
			ord(col_table_s[i*3+3])
		)
	end
	
	return cols, idx+#col_table_s
end

local function decode_ext_block(gif,bytes,idx)
	-- Get the size of the block
	-- +3 because the header is 3 bytes long
	local size = bytes[idx+2]:byte()+3
	-- Additional image/animation data
	if bytes[idx+1]:byte() == 0xf9 then
		local block = {}
		-- delay is measured in 1/100s
		block.delay = little_endian(bytes,idx+4,idx+5)
		if bytes[idx+3]:byte() & 0b1 == 0b1 then
			block.trans_col = ord(bytes[idx+6])
		end
		block.disposal = (bytes[idx+3]:byte() & 0b11100) >> 2
		idx += size + 1
		
		return idx, block
	-- Application specific data.
	-- Don't care about this, just skip it
	elseif ord(bytes[idx+1]) == 0xff then
		idx += size
		while ord(bytes[idx]) > 0 do
			idx += ord(bytes[idx]) + 1
		end
		idx += 1
	-- TODO: Implement handling for other blocks
	-- They are rare but are part of the standard
	else
		return nil, "Unknown extension block: "..ord(bytes[idx+1])
	end
	
	return idx
end

-- Bytes are in blocks for some reason. Convert to continuous
-- stream, and convert to numbers (from string) while we're
-- at it
local function convert_frame_bytes(bytes,idx)
	local data = {}
	while bytes[idx]:byte() != 0 do
		local block_size = bytes[idx]:byte()
		for i = 1, block_size do
			data[#data+1] = bytes[idx+i]:byte()
		end
		idx+=block_size+1
	end
	return data, idx+1
end

local function gen_code_table(min_code_size,n_cols,colours)
	local code_table = {
		code_size = min_code_size+1,
		max_code_val = (1 << (min_code_size+1)) - 1,
		next_code = n_cols+2,
	}
	
	for i = 0, n_cols-1 do
		code_table[i] = userdata("u8",1)
		code_table[i]:set(0,colours[i].idx)
	end
	
	code_table[n_cols] = "cc"
	code_table[n_cols+1] = "eoi"
	
	return code_table
end

-- Extract the next code from the bytes
-- A single code can be up to 12 bits, so can span multiple bytes
-- Also, can start anywhere in a given byte
local function get_next_code(bytes,code_size,idx, first_bit)
	-- Combine several bytes into single stream as code can be up
	-- to 12 bits long
	local bits = bytes[idx] + 
		(bytes[idx+1] or 0) * (1<<8) +
		(bytes[idx+2] or 0) * (1<<16)
	
	-- Create the bit mask for the next code
--	local bit_mask = ((1 << code_size)-1) << first_bit
	local bit_mask = 1
	for i = 2,code_size do
		bit_mask = ((bit_mask << 1) + 1)
	end
	bit_mask = bit_mask << first_bit

	local code = (bits & bit_mask) >> first_bit
	
	-- Shift to the start of the next code
	first_bit+=code_size
		
	-- If it's gone past the end of the current byte, move the
	-- byte index and adjust the first bit position
	while first_bit > 8 do
		idx += 1
		first_bit -= 8
	end
	
	return code, idx, first_bit
end

-- Decode a single frame from gif data
local function decode_gif_frame(bytes,idx,gif,frame_ext,yield_lmt,max_w,max_h)
	local n_cols = gif.n_cols
	local colours = gif.cols
	local undo_trans
	
	local frame = {ext = frame_ext}

	-- All frames should start with 0x2c
	if ord(bytes[idx]) != 0x2c then
		return nil, "Not an image, "..ord(bytes[idx])
	end
	
	-- First data (that we care about) in the frame is x/y/width/height
	-- (used if multiple frames dislayed together - not really how
	-- gifs ended up being used)
	frame.x = little_endian(bytes,idx+1,idx+2)
	frame.y = little_endian(bytes,idx+3,idx+4)
	local width = little_endian(bytes,idx+5,idx+6)
	local height = little_endian(bytes,idx+7,idx+8)
	
	local has_loc_cols = 0b10000000 & bytes[idx+9]:byte() > 0
	
	idx+=10
	
	-- If there's a local colour table, use that instead
	if has_loc_cols then
		local err
		colours, idx, err = extract_col_table(bytes, idx, n_cols)
		match_pal(colours)
	end
	
	-- If there's a transparent colour this frame, remap it to
	-- idx 0.
	if frame_ext and frame_ext.trans_col != nil then
		undo_trans = colours[frame_ext.trans_col].idx
		colours[frame_ext.trans_col].idx = 0
	end
	
	frame.raw = userdata("u8",width,height)
	-- memmap allows us to poke values a bit quicker...
	memmap(frame.raw,0x080000)
	
	-- Minimum size of the LZW code used in the compression
	local min_code_size = bytes[idx]:byte()
	
	idx+=1
	
	-- Bytes are in blocks for some reason. Convert to continuous
	-- stream, and convert to numbers (from string) while we're
	-- at it
	local data
	local bef_data_idx = idx
	data, idx = convert_frame_bytes(bytes,idx)
	
	-- Initialise the code table for LZW decompression
	local code_table = gen_code_table(min_code_size,n_cols,colours)
	
	local data_idx = 1
	local first_bit = 0
	local prev_code = nil
	local ud_idx = 0
	local yield_idx = 0
	local test = 0
	while true do
		-- Get the next code
		local next_code
		next_code, data_idx, first_bit = get_next_code(
			data, code_table.code_size, data_idx, first_bit
		)
		
		-- If it has special values, we need to do something specific
		if code_table[next_code] == "cc" then
			-- Reset the code table
			-- Done to prevent the code size exceeding 12 bits
			code_table = gen_code_table(min_code_size,n_cols,colours)
			prev_code = nil
		elseif
			-- End of input. Marks the end of the frame data
			code_table[next_code] == "eoi" then
			break
		else
			local cur_token = code_table[next_code]
			
			-- If the code isn't in the code table yet, generate
			-- the token
			if cur_token == nil and prev_code then
				-- It should always be what the code table thinks the
				-- next code should be
				assert(next_code==code_table.next_code,next_code..","..code_table.next_code)
				local prev_token = code_table[prev_code]
				cur_token = userdata("u8",prev_token:width()+1)
				prev_token:blit(cur_token)
				cur_token:set(prev_token:width(),prev_token:get(0))
			elseif cur_token == nil then
				error("token not in dict: "..next_code)
			end

			-- Use the token to set the next pixels in the sprite userdata
			-- A token can contain colours for multiple pixels
			cur_token:poke(0x080000+ud_idx)
			ud_idx+=cur_token:width()
			yield_idx += 1

			-- Only generate a new code if there was a previous token
			-- Not the case at the start and when the code table resets
			if prev_code then
				local prev_token = code_table[prev_code]
				local new_token = userdata("u8",prev_token:width()+1)
				prev_token:blit(new_token)
				new_token:set(prev_token:width(),cur_token:get(0))
				
				code_table[code_table.next_code] = new_token
				code_table.next_code += 1
			end
			
			prev_code=next_code
		end
		
		-- If the code size has passed the maximum value for the current
		-- code size, we need to increase it
		-- e.g. code size = 2 and new code is 100, we need to increase
		-- the code size to 3.
		-- Never increase it past 12 bits
		if code_table.next_code > code_table.max_code_val and code_table.next_code <= 4095 then
			code_table.code_size += 1
			code_table.max_code_val = (1 << code_table.code_size) - 1
		end
		
		-- If there's a yield limit, yield if we hit it
		if yield_lmt and yield_idx > yield_lmt then
			yield_idx = 0
			yield(gif_return(nil,0.9*(bef_data_idx+data_idx)/#bytes))
		end
	end
	
	if frame_ext and frame_ext.trans_col != nil then
		colours[frame_ext.trans_col].idx = undo_trans
	end
	
	unmap(frame.raw)
	
	if max_w and max_h and (frame.raw:width() > max_w or frame.raw:height() > max_h) then
		local w, h = min(frame.raw:width(),max_w),min(frame.raw:height(),max_h)
		local img = userdata("u8",w,h)
		local pdt = get_draw_target()
		palt()
		set_draw_target(img)
		sspr(frame.raw,0,0,frame.raw:width(),frame.raw:height(),0,0,w,h)
		set_draw_target(pdt)
		frame.raw=img
		img=nil
	end
	
	frame.comp = pod(frame.raw,7)
	frame.raw = nil
--	log:write()

	
	return idx, frame
end

gifd = {}

-- Decodes a gif into a form usable (and storable) by Picotron
-- Arguments:
	-- bytes: the encoded gif bytes in string form
	--    (i.e. what you get from fetch("example.gif"))
	-- yield_lmt: if running as a coroutine, sets a limit for how
	--    often it should yield. Lower numbers mean less CPU use.
	--    Experiment to find what works for your case, 100-1000 is
	--    probably a reasonable range?
	-- max_w, max_h: the maximum width and height of returned gifs
	--    Resudes memory usage, which can get very high with larger
	--    gifs.
-- Returns (and yields): a table with the following keys:
	-- gif: decoded gif in format above (only if finished)
	-- progress: estimate of percent progress decoding
	--    (useful when using as coroutine)
	-- err: any error thrown
function gifd.decode(bytes, yield_lmt, max_w, max_h)
	local gif = {}
	
	-- Gifs start with a 6 char header: gif<version>
	-- e.g. gif89a
	local idx, err = decode_gif_header(gif, bytes)
	
	if (err) return gif_return(nil, 0, err)
	
	-- Followed by general info about about how to display them
	idx, err = decode_screen_desc(gif, bytes, idx, max_w, max_h)
	
	if (err) return gif_return(nil, 0, err)
	
	-- Next is the global colour table (if it exists)
	gif.cols, idx, err = extract_col_table(bytes, idx, gif.n_cols)

	if (err) return gif_return(nil, 0, err)
	
	-- Add a lookup for colours in our current palette
	-- TODO: Give a way to set the palette to match the gif
	match_pal(gif.cols)
	
	gif.frames = {}
	
	local frame_ext
	
	-- The remaining data varies, and will be either extension
	-- blocks (containing various additional data about the gif,
	-- like time between frames) or images, i.e. frames
	while ord(bytes[idx]) == 0x21 or ord(bytes[idx]) == 0x2c do
		-- 0x2c indicates a frame
		if ord(bytes[idx]) == 0x2c then
			local next_img
			idx, next_img, err = decode_gif_frame(
				bytes,idx,gif,frame_ext,yield_lmt,max_w,max_h
			)
			if (err) gif_return(nil, 0, err)
			add(gif.frames,next_img)
		-- 0x21 indicates an extension block
		else
			local block
			idx, block = decode_ext_block(gif, bytes, idx)
			frame_ext = block or frame_ext
		end
	end
	
	-- Useful to know total time of gif, so going to calc that
	gif.total_length = 0
	
	-- Now we have the raw frames, for efficiency we're going
	-- to render them now (as in some cases, you can see through
	-- a frame to the previous frame(s))
	local pdt = get_draw_target()
	local img = userdata("u8",gif.width,gif.height)
	set_draw_target(img)

	palt()
	for i = 1,#gif.frames do
		local frame = gif.frames[i]
		local uncomp = unpod(frame.comp)
		spr(uncomp,frame.x,frame.y)
		frame.comp = pod(img,7)

		-- If frame disposal is 2, need to clear the previous frames
		-- before rendering the next
		if frame.ext and frame.ext.disposal == 2 then
			img = userdata("u8",gif.width,gif.height)
			set_draw_target(img)
		end
		
		if frame.ext then
			gif.total_length += frame.ext.delay or 2
		else
			-- If not provided, treat it basically as 1 frame
			gif.total_length += 2
		end
		
		-- This process takes some time, so also yield here
		if yield_lmt then
			set_draw_target(pdt)
			yield(gif_return(nil, 0.9+0.1*i/#gif.frames))
			set_draw_target(img)
		end
	end
	set_draw_target(pdt)

	return gif_return(gif, 1)
end

-- Get the frame of a gif in the form of a sprite, s seconds
-- into the animation.
function gifd.get_frame_s(gif,s)
	s = ((s or t()) * 100) % gif.total_length
	
	local frame = gif.frames[1]
	local total_delay = 0
	
	for i = 1, #gif.frames do
		local f = gif.frames[i]
		local delay = 2
		if f.ext then
			delay = f.ext.delay or 2
		end
		if total_delay + delay >= s then
			frame = f
			break
		end
		total_delay += delay
	end
	
	return unpod(frame.comp)
end

-- Get the nth frame of a gif in the form of a sprite
function gifd.get_frame(gif,n)
	n = ((n-1) % #gif.frames) + 1
	return unpod(gif.frames[n])
end

-- Draw the gif at a position x,y, s seconds into the animation.
function gifd.draw(gif,x,y,s)
	local img, disp,trans_col = gifd.get_frame_s(gif,s)
	palt()
	spr(img,x,y)
end

return gifd

end
