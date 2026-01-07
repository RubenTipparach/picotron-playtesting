--[[pod_format="raw",created="2025-10-01 13:12:23",modified="2025-10-09 16:13:21",revision=506,xstickers={}]]
-----------------------------------------------
-- Gif'd
--
-- A simple(?) gif reading library for Picotron
-- And an small gif-viewer to show how it works
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

-- v1.0.1
-----------------------------------------------
include "gifd.lua"

-- If a gif is dropped on it, start a coroutine to load it
on_event("drop_items", function(msg)
	local dropped_item = msg.items[1]
	if not dropped_item.fullpath or dropped_item.fullpath:ext() != "gif" then
		return
	end
	gif_bytes = fetch(dropped_item.fullpath)
	decoding_gif = cocreate(gifd.decode)
	percent_prog=0
	output_gif = nil
	window{
		title = dropped_item.filename,
		width = 84,
		height = 64
	}
	start_time = t()
end)

function _init()
	window{
		title = "Gif'd",
		width = 84,
		height = 64
	}
	
	sparkles = {}
end

function _update()
	-- If a gif is loading, keep that going
	if decoding_gif and costatus(decoding_gif) != "dead" then
		while stat(1) < 2 and costatus(decoding_gif) != "dead" do
			local success, response = coresume(decoding_gif, gif_bytes, 100, 400, 225)
			
			assert(success,response)
			if success and response then
				-- Yield gives an estimate of percentage progress
				percent_prog = response.progress
				-- Other returning the actual gif data
				output_gif = response.gif
				if output_gif then
					window{
						width = output_gif.width,
						height = output_gif.height
					}
					loaded_time = t()
				end
			end
		end
	-- Otherwise, update the sparkles
	else
		local ang = rnd()
		add(
			sparkles,
			{
				pos=vec(42,32),
				c=rnd({7,8,9,10,11,12}),
				v=vec(sin(ang),cos(ang)-0.5)*0.8,
				a=vec(0,0.02)
			}
		)
		if #sparkles > 64 then
			deli(sparkles,1)
		end
		for _,s in pairs(sparkles) do
			s.pos += s.v
			s.v+=s.a
		end
	end
end

function _draw()
	cls(1)
	
	-- if a gif has loaded, draw that
	if output_gif then
		gifd.draw(output_gif,0,0,t()-loaded_time)
	-- if it's loading, draw a loading bar
	elseif decoding_gif and costatus(decoding_gif) != "dead" then
		print("Loading...",10,17,7)
		rrect(2,27,80,10,2,7)
		rrectfill(4,29,76*percent_prog,6,1,7)
		pset(4,29,1)
		pset(4,34,1)
		print(flr(stat(7)).."fps",2,44,6)
		print("~"..flr(100*stat(1)/0.9).."%",2,54,6)
		local mem = flr(stat(0)/(1024*1024)).."mb"
		print(mem, 82-5*#mem, 54, 6)
	-- otherwise, show sparkles and instructions
	else
		print("Drag & drop",15,2,7)
		print("a gif",30,12,7)
		spr(1,30,40)
		print("here",50,50,7)
		circfill(42,32,2*(sin(t()*2)+1)+1.5,7)
		for _,s in pairs(sparkles) do
			pset(s.pos.x,s.pos.y,s.c)
		end
	end
end
