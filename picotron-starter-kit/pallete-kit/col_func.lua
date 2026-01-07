--[[pod_format="raw",created="2025-11-11 11:59:53",modified="2025-12-24 09:36:24",revision=6]]
--[[pod_format="raw",created="2025-04-17 21:36:13",modified="2025-04-18 04:36:07",revision=8]]
local t = 0.9

return {
	func = function(draw_col,target_col)
		return (draw_col-target_col)*t+target_col
	end,
	space = "linear",
}