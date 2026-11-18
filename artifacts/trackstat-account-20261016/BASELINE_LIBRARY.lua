-- Seisen UI: Roblox script UI library.
-- API: Lib:CreateWindow -> Window:Tab -> Tab:AddLeftGroupbox / AddRightGroupbox -> Groupbox:Toggle / Slider / ...

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local HttpService = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")
local GuiService = game:GetService("GuiService")
local MarketplaceService = game:GetService("MarketplaceService")
local LocalPlayer = Players.LocalPlayer

local Lib = { Flags = {}, Windows = {} }

local Theme = {
	Background = Color3.fromRGB(22, 22, 22),
	Surface = Color3.fromRGB(27, 27, 27),
	Surface2 = Color3.fromRGB(33, 33, 33),
	Surface3 = Color3.fromRGB(44, 44, 44),
	Stroke = Color3.fromRGB(53, 53, 53),
	StrokeHover = Color3.fromRGB(88, 88, 88),
	Accent = Color3.fromRGB(128, 160, 246),
	AccentDark = Color3.fromRGB(14, 18, 30),
	Text = Color3.fromRGB(238, 238, 238),
	Muted = Color3.fromRGB(160, 160, 160),
	Warning = Color3.fromRGB(240, 176, 108),
	Success = Color3.fromRGB(150, 220, 170),
	Error = Color3.fromRGB(240, 120, 120),
}
Lib.Theme = Theme
Lib.ThemeName = "Charcoal"
Lib.Supabase = { Url = "https://dgwrrtsqcdabsorcvbme.supabase.co", Key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnd3JydHNxY2RhYnNvcmN2Ym1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDk1MzAsImV4cCI6MjA4MzcyNTUzMH0.2WlsWVbkU5z3FTEGRcH34zFZpZHAj-r3SOHWy8ca9lQ" }

local function rgb(p, q, r)
	return Color3.fromRGB(p, q, r)
end
local function preset(q, r, s, t, u, v, w, x, y, z)
	return {
		Background = rgb(table.unpack(q)),
		Surface = rgb(table.unpack(r)),
		Surface2 = rgb(table.unpack(s)),
		Surface3 = rgb(table.unpack(t)),
		Stroke = rgb(table.unpack(u)),
		StrokeHover = rgb(table.unpack(v)),
		Accent = rgb(table.unpack(w)),
		AccentDark = rgb(table.unpack(x)),
		Text = rgb(table.unpack(y)),
		Muted = rgb(table.unpack(z)),
	}
end
Lib.ThemePresets = {
	Charcoal = preset(
		{ 22, 22, 22 },
		{ 27, 27, 27 },
		{ 33, 33, 33 },
		{ 44, 44, 44 },
		{ 53, 53, 53 },
		{ 88, 88, 88 },
		{ 128, 160, 246 },
		{ 14, 18, 30 },
		{ 238, 238, 238 },
		{ 160, 160, 160 }
	),
	Midnight = preset(
		{ 15, 18, 26 },
		{ 18, 22, 31 },
		{ 22, 26, 37 },
		{ 37, 44, 60 },
		{ 34, 40, 55 },
		{ 70, 84, 112 },
		{ 128, 160, 246 },
		{ 14, 18, 30 },
		{ 228, 232, 242 },
		{ 116, 126, 148 }
	),
	Ocean = preset(
		{ 12, 20, 24 },
		{ 15, 24, 29 },
		{ 18, 29, 35 },
		{ 31, 48, 56 },
		{ 29, 44, 52 },
		{ 58, 92, 104 },
		{ 110, 214, 222 },
		{ 10, 24, 28 },
		{ 226, 238, 240 },
		{ 108, 134, 140 }
	),
	Rose = preset(
		{ 22, 15, 18 },
		{ 27, 18, 22 },
		{ 32, 21, 26 },
		{ 48, 34, 40 },
		{ 45, 30, 37 },
		{ 98, 64, 78 },
		{ 246, 160, 186 },
		{ 30, 14, 20 },
		{ 240, 228, 232 },
		{ 138, 112, 120 }
	),
	Emerald = preset(
		{ 13, 20, 17 },
		{ 16, 24, 20 },
		{ 20, 29, 24 },
		{ 33, 47, 40 },
		{ 30, 44, 37 },
		{ 62, 96, 78 },
		{ 132, 226, 170 },
		{ 12, 26, 18 },
		{ 228, 240, 233 },
		{ 110, 136, 122 }
	),
	Amber = preset(
		{ 22, 18, 13 },
		{ 27, 22, 16 },
		{ 32, 26, 19 },
		{ 49, 41, 31 },
		{ 46, 38, 28 },
		{ 100, 82, 58 },
		{ 246, 196, 120 },
		{ 30, 22, 10 },
		{ 242, 236, 226 },
		{ 140, 126, 106 }
	),
	Mono = preset(
		{ 16, 16, 17 },
		{ 20, 20, 21 },
		{ 25, 25, 26 },
		{ 40, 40, 42 },
		{ 38, 38, 40 },
		{ 84, 84, 88 },
		{ 236, 236, 240 },
		{ 20, 20, 22 },
		{ 234, 234, 236 },
		{ 122, 122, 128 }
	),
	Nebula = preset(
		{ 14, 12, 28 },
		{ 18, 15, 35 },
		{ 23, 19, 43 },
		{ 39, 32, 68 },
		{ 35, 29, 62 },
		{ 84, 68, 140 },
		{ 199, 125, 255 },
		{ 22, 10, 40 },
		{ 236, 230, 252 },
		{ 124, 114, 160 }
	),
	Synthwave = preset(
		{ 20, 12, 30 },
		{ 25, 15, 37 },
		{ 31, 18, 45 },
		{ 52, 30, 72 },
		{ 47, 27, 66 },
		{ 110, 58, 150 },
		{ 255, 94, 198 },
		{ 38, 8, 30 },
		{ 250, 232, 246 },
		{ 150, 118, 160 }
	),
	Sakura = preset(
		{ 24, 14, 20 },
		{ 29, 17, 24 },
		{ 35, 20, 29 },
		{ 54, 32, 45 },
		{ 50, 29, 41 },
		{ 112, 66, 92 },
		{ 255, 158, 200 },
		{ 36, 12, 24 },
		{ 248, 232, 240 },
		{ 150, 112, 132 }
	),
	Velvet = preset(
		{ 20, 10, 16 },
		{ 25, 12, 20 },
		{ 31, 15, 25 },
		{ 50, 25, 40 },
		{ 46, 23, 37 },
		{ 104, 52, 82 },
		{ 222, 110, 170 },
		{ 30, 8, 20 },
		{ 244, 228, 238 },
		{ 142, 106, 126 }
	),
	Crimson = preset(
		{ 18, 10, 12 },
		{ 23, 12, 15 },
		{ 28, 14, 18 },
		{ 46, 24, 29 },
		{ 42, 22, 27 },
		{ 104, 46, 56 },
		{ 244, 74, 94 },
		{ 32, 8, 12 },
		{ 244, 230, 232 },
		{ 142, 106, 112 }
	),
	Sunset = preset(
		{ 22, 13, 14 },
		{ 27, 16, 17 },
		{ 33, 19, 21 },
		{ 52, 31, 32 },
		{ 48, 28, 30 },
		{ 112, 62, 58 },
		{ 255, 138, 92 },
		{ 34, 14, 8 },
		{ 248, 234, 228 },
		{ 150, 118, 110 }
	),
	Gold = preset(
		{ 14, 13, 11 },
		{ 18, 17, 14 },
		{ 23, 21, 17 },
		{ 38, 35, 28 },
		{ 35, 32, 26 },
		{ 92, 80, 54 },
		{ 232, 196, 122 },
		{ 30, 22, 8 },
		{ 240, 234, 222 },
		{ 136, 126, 106 }
	),
	Cyber = preset(
		{ 13, 13, 15 },
		{ 17, 17, 19 },
		{ 21, 21, 24 },
		{ 36, 36, 40 },
		{ 33, 33, 37 },
		{ 86, 84, 70 },
		{ 250, 226, 72 },
		{ 30, 26, 4 },
		{ 240, 240, 232 },
		{ 126, 124, 118 }
	),
	Toxic = preset(
		{ 11, 14, 11 },
		{ 14, 18, 14 },
		{ 18, 23, 18 },
		{ 31, 39, 30 },
		{ 28, 36, 28 },
		{ 74, 98, 60 },
		{ 184, 255, 74 },
		{ 18, 30, 6 },
		{ 232, 242, 228 },
		{ 116, 134, 110 }
	),
	Matcha = preset(
		{ 16, 19, 14 },
		{ 20, 23, 17 },
		{ 24, 28, 21 },
		{ 40, 46, 34 },
		{ 37, 42, 31 },
		{ 84, 98, 70 },
		{ 176, 214, 140 },
		{ 18, 26, 10 },
		{ 236, 240, 228 },
		{ 128, 136, 116 }
	),
	Aurora = preset(
		{ 10, 20, 22 },
		{ 12, 25, 27 },
		{ 15, 30, 33 },
		{ 26, 50, 53 },
		{ 24, 45, 48 },
		{ 50, 104, 104 },
		{ 94, 240, 180 },
		{ 6, 30, 22 },
		{ 224, 246, 240 },
		{ 102, 142, 134 }
	),
	Frost = preset(
		{ 13, 17, 23 },
		{ 16, 21, 28 },
		{ 20, 26, 34 },
		{ 34, 43, 56 },
		{ 31, 40, 52 },
		{ 72, 92, 118 },
		{ 164, 214, 255 },
		{ 12, 22, 34 },
		{ 230, 238, 246 },
		{ 114, 128, 146 }
	),
	Abyss = preset(
		{ 7, 11, 22 },
		{ 9, 14, 28 },
		{ 12, 18, 35 },
		{ 22, 31, 58 },
		{ 20, 28, 52 },
		{ 44, 64, 120 },
		{ 72, 148, 255 },
		{ 6, 14, 34 },
		{ 226, 234, 250 },
		{ 100, 116, 152 }
	),
	Halloween = preset(
		{ 18, 12, 20 },
		{ 23, 15, 25 },
		{ 28, 18, 30 },
		{ 46, 30, 48 },
		{ 43, 28, 44 },
		{ 104, 62, 40 },
		{ 255, 138, 36 },
		{ 36, 16, 4 },
		{ 246, 234, 224 },
		{ 146, 120, 128 }
	),
	Haunted = preset(
		{ 14, 12, 20 },
		{ 18, 15, 26 },
		{ 22, 18, 32 },
		{ 38, 31, 54 },
		{ 35, 29, 50 },
		{ 70, 96, 64 },
		{ 156, 255, 110 },
		{ 14, 30, 8 },
		{ 232, 240, 228 },
		{ 120, 116, 140 }
	),
	Christmas = preset(
		{ 12, 20, 15 },
		{ 15, 25, 19 },
		{ 19, 30, 23 },
		{ 32, 50, 38 },
		{ 30, 46, 35 },
		{ 100, 54, 56 },
		{ 236, 72, 80 },
		{ 34, 8, 10 },
		{ 240, 244, 236 },
		{ 120, 142, 128 }
	),
	Valentine = preset(
		{ 24, 12, 17 },
		{ 30, 14, 21 },
		{ 36, 17, 25 },
		{ 58, 27, 40 },
		{ 54, 25, 37 },
		{ 130, 56, 84 },
		{ 255, 92, 140 },
		{ 40, 8, 20 },
		{ 252, 232, 240 },
		{ 160, 112, 132 }
	),
	Lunar = preset(
		{ 22, 10, 10 },
		{ 28, 12, 12 },
		{ 34, 15, 14 },
		{ 54, 24, 22 },
		{ 50, 22, 20 },
		{ 130, 92, 40 },
		{ 246, 196, 84 },
		{ 38, 16, 6 },
		{ 250, 236, 222 },
		{ 160, 120, 108 }
	),
	Tropical = preset(
		{ 10, 22, 24 },
		{ 12, 27, 30 },
		{ 15, 33, 36 },
		{ 26, 54, 58 },
		{ 24, 50, 54 },
		{ 44, 110, 110 },
		{ 255, 170, 90 },
		{ 36, 18, 6 },
		{ 232, 246, 244 },
		{ 104, 144, 142 }
	),
	Dracula = preset(
		{ 24, 25, 33 },
		{ 29, 30, 40 },
		{ 34, 36, 47 },
		{ 52, 55, 70 },
		{ 48, 50, 64 },
		{ 98, 114, 164 },
		{ 189, 147, 249 },
		{ 26, 18, 44 },
		{ 246, 246, 238 },
		{ 126, 132, 168 }
	),
	Coffee = preset(
		{ 20, 16, 13 },
		{ 25, 20, 16 },
		{ 30, 24, 19 },
		{ 48, 39, 31 },
		{ 45, 36, 29 },
		{ 104, 82, 62 },
		{ 214, 170, 124 },
		{ 32, 22, 12 },
		{ 240, 230, 218 },
		{ 142, 124, 108 }
	),
}

local WHITE = Color3.fromRGB(244, 244, 246)
local Fonts = {
	Regular = Font.fromEnum(Enum.Font.Gotham),
	Medium = Font.fromEnum(Enum.Font.GothamMedium),
	Bold = Font.fromEnum(Enum.Font.GothamBold),
}

---------------------------------------------------------------- helpers
local function New(class, props)
	local obj = Instance.new(class)
	for k, v in pairs(props or {}) do
		if k ~= "Parent" then
			obj[k] = v
		end
	end
	obj.Parent = props and props.Parent
	return obj
end

local function Tween(obj, props, time, style, dir)
	local t = TweenService:Create(
		obj,
		TweenInfo.new(time or 0.2, style or Enum.EasingStyle.Quint, dir or Enum.EasingDirection.Out),
		props
	)
	t:Play()
	return t
end

local function Round(parent, radius)
	return New("UICorner", { CornerRadius = UDim.new(0, radius or 8), Parent = parent })
end

local function Stroke(parent, color, thickness, transparency)
	return New("UIStroke", {
		Color = color or Theme.Stroke,
		Thickness = thickness or 1,
		Transparency = transparency or 0,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
		Parent = parent,
	})
end

local function List(parent, padding, direction)
	return New("UIListLayout", {
		SortOrder = Enum.SortOrder.LayoutOrder,
		Padding = UDim.new(0, padding or 0),
		FillDirection = direction or Enum.FillDirection.Vertical,
		Parent = parent,
	})
end

local function Pad(parent, l, t, r, b)
	return New("UIPadding", {
		PaddingLeft = UDim.new(0, l or 0),
		PaddingTop = UDim.new(0, t or l or 0),
		PaddingRight = UDim.new(0, r or l or 0),
		PaddingBottom = UDim.new(0, b or t or l or 0),
		Parent = parent,
	})
end

local function Label(props)
	local p = {
		BackgroundTransparency = 1,
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Medium,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
		Text = "",
	}
	for k, v in pairs(props) do
		p[k] = v
	end
	return New("TextLabel", p)
end

local IconSet
local function Icon(image, name, color)
	if not IconSet then
		local ok, set = pcall(function()
			return loadstring(game:HttpGet("https://raw.githubusercontent.com/Footagesus/Icons/refs/heads/main/lucide/dist/Icons.lua"))()
		end)
		IconSet = ok and type(set) == "table" and set or {}
	end
	local src = IconSet[name] or name
	if type(src) == "string" and (src:find("^rbxasset") or src:find("^http")) then
		image.Image = src
	end
	if color then
		image.ImageColor3 = color
	end
end

local function IsAsset(name)
	return type(name) == "string" and (name:find("^rbxasset") ~= nil or name:find("^http") ~= nil)
end

local function NewIcon(parent, name, size, color, pos)
	local img = New("ImageLabel", {
		BackgroundTransparency = 1,
		Size = UDim2.fromOffset(size, size),
		Position = pos or UDim2.new(),
		ScaleType = Enum.ScaleType.Fit,
		ImageColor3 = color or Theme.Muted,
		Parent = parent,
	})
	Icon(img, name)
	if IsAsset(name) then
		img.ImageColor3 = Color3.new(1, 1, 1)
	end
	return img
end

local function Opts(o, aliases)
	local t = {}
	if type(o) == "string" then
		t.Name = o
	elseif type(o) == "table" then
		for k, v in pairs(o) do
			t[k] = v
		end
	end
	for from, to in pairs(aliases or {}) do
		if t[to] == nil and t[from] ~= nil then
			t[to] = t[from]
		end
	end
	return t
end

local ControlAliases = {
	Title = "Name",
	Description = "Desc",
	CurrentValue = "Default",
	Value = "Default",
	CurrentOption = "Default",
	MultipleOptions = "Multi",
	Values = "Options",
	Increment = "Step",
}

local function Safe(fn, ...)
	if type(fn) == "function" then
		local ok, err = pcall(fn, ...)
		if not ok then
			warn("[Seisen UI] callback error: " .. tostring(err))
		end
	end
end

local function HealthColor(value, good, warn_, inverted)
	if inverted then
		return value <= good and Theme.Success or (value <= warn_ and Theme.Warning or Theme.Error)
	end
	return value >= good and Theme.Success or (value >= warn_ and Theme.Warning or Theme.Error)
end

local function FormatCount(value)
	value = tonumber(value) or 0
	local magnitude = math.abs(value)
	local divisor, suffix = 1, ""
	if magnitude >= 1e21 then divisor, suffix = 1e21, "Sx"
	elseif magnitude >= 1e18 then divisor, suffix = 1e18, "Qi"
	elseif magnitude >= 1e15 then divisor, suffix = 1e15, "Qa"
	elseif magnitude >= 1e12 then divisor, suffix = 1e12, "T"
	elseif magnitude >= 1e9 then divisor, suffix = 1e9, "B"
	elseif magnitude >= 1e6 then divisor, suffix = 1e6, "M"
	elseif magnitude >= 1e3 then divisor, suffix = 1e3, "K" end
	if divisor == 1 then return tostring(value) end
	return (string.format("%.1f", value / divisor):gsub("%.0$", "")) .. suffix
end

local function FormatTime(s)
	s = math.floor(s)
	if s >= 3600 then
		return string.format("%dh %dm", s // 3600, (s % 3600) // 60)
	elseif s >= 60 then
		return string.format("%dm %ds", s // 60, s % 60)
	end
	return s .. "s"
end

local function MouseOver(gui, pos)
	local p, s = gui.AbsolutePosition, gui.AbsoluteSize
	return pos.X >= p.X and pos.X <= p.X + s.X and pos.Y >= p.Y and pos.Y <= p.Y + s.Y
end

local function IsPress(input)
	return input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch
end

-- GetMouseLocation includes the top-bar inset, AbsolutePosition of our gui does not
local function MousePos()
	return UserInputService:GetMouseLocation() - GuiService:GetGuiInset()
end

local function IsMove(input)
	return input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch
end

-- Same as the old library: CoreGui first (inside a pcall, since some mobile executors refuse it), then the player's own PlayerGui
local function ParentGui(gui, preferred)
	pcall(function() gui.Parent = preferred or game:GetService("CoreGui") end)
	if not gui.Parent then
		gui.Parent = LocalPlayer:WaitForChild("PlayerGui")
	end
end

local function ServerTeleport(lowest, options)
	local pool, cursor = {}, ""
	for page = 1, options and 3 or 1 do
		if options and not options.active() then return false end
		local url = "https://games.roblox.com/v1/games/" .. game.PlaceId .. "/servers/Public?sortOrder=" .. (lowest and "Asc" or "Desc") .. "&excludeFullGames=true&limit=100"
		if cursor ~= "" then url ..= "&cursor=" .. cursor end
		local ok, data = pcall(function()
			local req = request or http_request or syn and syn.request
			return HttpService:JSONDecode(req and (req({ Url = url, Method = "GET" }).Body) or game:HttpGet(url))
		end)
		if not ok or type(data) ~= "table" or type(data.data) ~= "table" then break end
		for _, server in ipairs(data.data) do
			if server.id ~= game.JobId and server.playing and server.maxPlayers and server.playing < server.maxPlayers then
				table.insert(pool, server)
			end
		end
		cursor = data.nextPageCursor or ""
		if cursor == "" then break end
	end
	if #pool == 0 then return false end
	if not options then
		local pick = lowest and pool[1] or pool[math.random(1, #pool)]
		return pcall(TeleportService.TeleportToPlaceInstance, TeleportService, game.PlaceId, pick.id, LocalPlayer)
	end
	table.sort(pool, function(a, b) return a.playing < b.playing end)
	local candidates = {}
	for _, server in ipairs(pool) do
		if server.playing + 1 <= options.max then table.insert(candidates, server) end
	end
	if #candidates == 0 then
		for _, server in ipairs(pool) do
			if server.playing == pool[1].playing then table.insert(candidates, server) end
		end
	end
	for attempt = 1, math.min(5, #candidates) do
		if not options.active() then return false end
		local server = table.remove(candidates, math.random(1, #candidates))
		options.failed = false
		if pcall(TeleportService.TeleportToPlaceInstance, TeleportService, game.PlaceId, server.id, LocalPlayer) then
			local started = os.clock()
			while options.active() and not options.failed and os.clock() - started < 6 do task.wait(0.25) end
			if not options.active() then return false end
			if not options.failed then return true end
		end
		task.wait(0.3)
	end
	return false
end

---------------------------------------------------------------- storage / theme / config
local ROOT_FOLDER = "Seisen"
local ThemeKeys = { "Background", "Surface", "Surface2", "Surface3", "Stroke", "StrokeHover", "Accent", "AccentDark", "Text", "Muted", "Warning", "Success", "Error" }
Lib.ThemeName = "Midnight"
Lib._themeListeners = {}

local function ValidName(name)
	return type(name) == "string" and name ~= "" and not name:find('[\\/:%*%?"<>|]')
end

local GameNameCache
local function GameName()
	if GameNameCache then
		return GameNameCache
	end
	local ok, info = pcall(MarketplaceService.GetProductInfo, MarketplaceService, game.PlaceId)
	local name = ok and info and info.Name or tostring(game.PlaceId)
	name = name:gsub('[\\/:%*%?"<>|]', ""):gsub("%s+", " "):match("^%s*(.-)%s*$")
	if name == "" then
		name = tostring(game.PlaceId)
	end
	GameNameCache = name
	return name
end
Lib.GameName = GameName

-- Seisen/<Saved|Theme>/<Game name>
local function Dir(kind)
	return ROOT_FOLDER .. "/" .. kind .. "/" .. (Lib.FolderName or GameName())
end

local function HasFiles()
	return type(writefile) == "function" and type(readfile) == "function" and type(isfolder) == "function" and type(makefolder) == "function"
end

local function EnsureDir(kind)
	local path = ROOT_FOLDER
	for _, part in ipairs({ "", kind, Lib.FolderName or GameName() }) do
		if part ~= "" then
			path ..= "/" .. part
		end
		if not isfolder(path) then
			makefolder(path)
		end
	end
	return Dir(kind)
end

local function ReadJson(path)
	if not (HasFiles() and type(isfile) == "function" and isfile(path)) then
		return nil
	end
	local ok, data = pcall(function()
		return HttpService:JSONDecode(readfile(path))
	end)
	return ok and type(data) == "table" and data or nil
end

local function WriteJson(kind, name, data)
	if not HasFiles() then
		return false, "executor has no file access"
	end
	local ok, err = pcall(function()
		writefile(EnsureDir(kind) .. "/" .. name .. ".json", HttpService:JSONEncode(data))
	end)
	return ok, err
end

local function ListNames(kind)
	local names = {}
	if not (HasFiles() and type(listfiles) == "function") then
		return names
	end
	local dir = Dir(kind)
	if not isfolder(dir) then
		return names
	end
	local ok, files = pcall(listfiles, dir)
	if ok then
		for _, path in ipairs(files) do
			local name = tostring(path):match("([^/\\]+)%.json$")
			if name and name:sub(1, 1) ~= "_" then
				table.insert(names, name)
			end
		end
	end
	table.sort(names, function(a, b)
		return a:lower() < b:lower()
	end)
	return names
end

local function Encode(v)
	local t = typeof(v)
	if t == "Color3" then
		return { __t = "Color3", r = v.R, g = v.G, b = v.B }
	elseif t == "EnumItem" then
		return { __t = "Enum", e = tostring(v.EnumType), n = v.Name }
	elseif t == "table" then
		local out = {}
		for i, x in pairs(v) do
			out[i] = Encode(x)
		end
		return out
	end
	return v
end

local function Decode(v)
	if type(v) ~= "table" then
		return v
	end
	if v.__t == "Color3" then
		return Color3.new(v.r, v.g, v.b)
	elseif v.__t == "Enum" then
		local ok, item = pcall(function()
			return Enum[v.e][v.n]
		end)
		return ok and item or nil
	end
	local out = {}
	for i, x in pairs(v) do
		out[i] = Decode(x)
	end
	return out
end

-- recolour every live window: any property that equals an old theme colour becomes the new one
local RecolorProps = {
	TextLabel = { "TextColor3" },
	TextButton = { "TextColor3" },
	TextBox = { "TextColor3", "PlaceholderColor3" },
	ImageLabel = { "ImageColor3" },
	ImageButton = { "ImageColor3" },
	ScrollingFrame = { "ScrollBarImageColor3" },
	UIStroke = { "Color" },
}
function Lib:SetTheme(source)
	local new = table.clone(Theme)
	if type(source) == "string" then
		local preset = Lib.ThemePresets[source]
		if not preset then
			return false, "unknown theme"
		end
		for k, v in pairs(preset) do
			new[k] = v
		end
		Lib.ThemeName = source
	elseif type(source) == "table" then
		for k, v in pairs(source) do
			if typeof(v) == "Color3" and Theme[k] ~= nil then
				new[k] = v
			end
		end
		Lib.ThemeName = nil
	else
		return false, "bad theme"
	end
	local map = {}
	for _, key in ipairs(ThemeKeys) do
		local old, now = Theme[key], new[key]
		if old and now and old ~= now then
			map[old:ToHex()] = now
		end
	end
	for _, win in ipairs(Lib.Windows) do
		for _, d in ipairs(win.Gui:GetDescendants()) do
			local goal
			local function check(prop)
				local ok, cur = pcall(function()
					return d[prop]
				end)
				local to = ok and typeof(cur) == "Color3" and map[cur:ToHex()]
				if to then
					goal = goal or {}
					goal[prop] = to
				end
			end
			if d:IsA("GuiObject") then
				check("BackgroundColor3")
			end
			for _, prop in ipairs(RecolorProps[d.ClassName] or {}) do
				check(prop)
			end
			if goal then
				Tween(d, goal, 0.25, Enum.EasingStyle.Quad)
			end
		end
	end
	for _, key in ipairs(ThemeKeys) do
		Theme[key] = new[key]
	end
	for _, fn in ipairs(Lib._themeListeners) do
		pcall(fn)
	end
	return true
end

function Lib:GetTheme()
	return table.clone(Theme)
end

---------------------------------------------------------------- controls
local ROW, ROW_DESC, CHIP, SLIDER_H = 32, 46, 24, 46
local ASSETS = { Shadow = "rbxassetid://6014261993", Glow = "rbxassetid://8992230677" }

local KeyNames = {
	[Enum.KeyCode.LeftControl] = "LCtrl",
	[Enum.KeyCode.RightControl] = "RCtrl",
	[Enum.KeyCode.LeftShift] = "LShift",
	[Enum.KeyCode.RightShift] = "RShift",
	[Enum.KeyCode.LeftAlt] = "LAlt",
	[Enum.KeyCode.RightAlt] = "RAlt",
	[Enum.KeyCode.Return] = "Enter",
	[Enum.KeyCode.Escape] = "Esc",
}
local function KeyName(key)
	if key == nil then
		return "None"
	end
	return KeyNames[key] or key.Name
end
Lib.KeyName = KeyName

local function Ripple(frame)
	local mouse = MousePos()
	local size = math.max(frame.AbsoluteSize.X, frame.AbsoluteSize.Y) * 2.2
	local r = New("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(mouse.X - frame.AbsolutePosition.X, mouse.Y - frame.AbsolutePosition.Y),
		Size = UDim2.new(),
		BackgroundColor3 = Theme.Accent,
		BackgroundTransparency = 0.82,
		BorderSizePixel = 0,
		ZIndex = frame.ZIndex + 1,
		Parent = frame,
	})
	Round(r, 1000)
	Tween(r, { Size = UDim2.fromOffset(size, size), BackgroundTransparency = 1 }, 0.55)
	task.delay(0.55, function()
		r:Destroy()
	end)
end

local function Chip(parent, height)
	local chip = New("Frame", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -14, 0.5, 0),
		Size = UDim2.fromOffset(60, height or CHIP),
		BackgroundColor3 = Theme.Surface,
		BorderSizePixel = 0,
		ClipsDescendants = true,
		Parent = parent,
	})
	Round(chip, 6)
	return chip, Stroke(chip)
end

local function ChipWidth(row)
	return math.clamp(math.floor(row.AbsoluteSize.X * 0.48), 90, 220)
end

local function Glow(parent, size, color, transparency)
	return New("ImageLabel", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = size,
		BackgroundTransparency = 1,
		Image = ASSETS.Glow,
		ImageColor3 = color or Theme.Accent,
		ImageTransparency = transparency or 1,
		ZIndex = 0,
		Parent = parent,
	})
end

-- a control hidden on purpose (SetVisible / DependencyBox) must stay hidden when the search box is cleared
local function SetUserVisible(row, visible)
	row:SetAttribute("UserVisible", visible)
	row.Visible = visible
end

local Container = {}
Container.__index = Container

function Container:_row(height, name, kind)
	local row = New("Frame", {
		Size = UDim2.new(1, 0, 0, height),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		LayoutOrder = #self.Items + 1,
		Parent = self.Body,
	})
	local entry = { Frame = row, Name = string.lower(name or ""), Title = name, Kind = kind, Group = self.Name, GroupObj = self._groupObj or self, Tab = self.Tab }
	table.insert(self.Items, entry)
	table.insert(self.Window.Controls, entry)
	return row, entry
end

local function Register(self, opts, handle, entry, row)
	handle.Frame = row
	entry.Handle = handle
	if handle.Get and handle.Set and entry.Kind ~= "Label" and entry.Kind ~= "Paragraph" then
		local default = handle:Get()
		if type(default) == "table" then default = table.clone(default) end
		function handle:Reset()
			local value = type(default) == "table" and table.clone(default) or default
			return (self.SetValue or self.Set)(self, value)
		end
	end
	function handle:SetVisible(v)
		SetUserVisible(row, v)
	end
	function handle:Destroy()
		row:Destroy()
		for i, c in ipairs(self.Window.Controls) do
			if c == entry then
				table.remove(self.Window.Controls, i)
				break
			end
		end
	end
	if opts.Flag then
		Lib.Flags[opts.Flag] = handle
		self.Window:_flagCreated(opts.Flag, handle)
	end
	return handle
end

-- title (+ optional description) on the left of a row
local function Title(row, name, desc, rightPad)
	local width = UDim2.new(1, -(14 + (rightPad or 0)), 0, 16)
	if desc and desc ~= "" then
		local y = math.floor((ROW_DESC - 32) / 2)
		local t = Label({ Position = UDim2.fromOffset(14, y), Size = width, Text = name or "", TextSize = 13, Parent = row })
		local d = Label({
			Position = UDim2.fromOffset(14, y + 17),
			Size = UDim2.new(1, -(14 + (rightPad or 0)), 0, 15),
			Text = desc,
			TextSize = 12,
			FontFace = Fonts.Regular,
			TextColor3 = Theme.Muted,
			Parent = row,
		})
		return t, d
	end
	local t = Label({ Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -(14 + (rightPad or 0)), 1, 0), Text = name or "", TextSize = 13, Parent = row })
	return t
end

local function Num(v)
	return tostring(tonumber(string.format("%.10g", v)))
end

local function Rows(o)
	return o.Desc and ROW_DESC or ROW
end

function Container:Section(o)
	o = Opts(o, { Title = "Name" })
	local row, entry = self:_row(32, o.Name, "Section")
	local marker = New("Frame", { Position = UDim2.fromOffset(14, 9), Size = UDim2.fromOffset(3, 12), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, Parent = row })
	Round(marker, 1)
	local lbl = Label({ Position = UDim2.fromOffset(25, 0), Size = UDim2.new(1, -39, 0, 28), Text = string.upper(o.Name or ""), TextSize = 10, FontFace = Fonts.Bold, TextColor3 = Theme.Text, Parent = row })
	New("Frame", { Position = UDim2.new(0, 14, 1, -2), Size = UDim2.new(1, -28, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = row })
	return Register(self, o, { Set = function(_, text) lbl.Text = string.upper(tostring(text)) end }, entry, row)
end

function Container:Divider(o)
	o = Opts(o, { Text = "Name" })
	local row, entry = self:_row(o.Name and 28 or 12, o.Name, "Divider")
	local line = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14, 0.5, 0), Size = UDim2.new(1, -28, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = row })
	local lbl
	if o.Name then
		lbl = Label({ Position = UDim2.fromOffset(14, 0), Size = UDim2.new(0.4, 0, 1, 0), Text = string.upper(o.Name), TextSize = 10, FontFace = Fonts.Bold, TextColor3 = Theme.Muted, Parent = row })
		line.Size = UDim2.new(0.6, -24, 0, 1)
	end
	return Register(self, o, { Set = function(_, text) if lbl then lbl.Text = string.upper(tostring(text)) end end }, entry, row)
end

function Container:Label(o)
	o = Opts(o, { Name = "Text", Title = "Text" })
	local row, entry = self:_row(26, o.Text, "Label")
	local lbl = Label({
		Size = UDim2.new(1, 0, 1, 0),
		Text = o.Text or "",
		TextSize = 13,
		FontFace = Fonts.Medium,
		TextColor3 = o.Color or Theme.Text,
		RichText = true,
		Parent = row,
	})
	Pad(lbl, 14, 0, 14, 0)
	if o.TextWrapped or (o.TextWrapped == nil and not o.Height) then
		row.AutomaticSize = Enum.AutomaticSize.Y
		lbl.AutomaticSize = Enum.AutomaticSize.Y
		lbl.Size = UDim2.new(1, 0, 0, 0)
		lbl.TextWrapped = true
		lbl.TextTruncate = Enum.TextTruncate.None
		lbl.TextYAlignment = Enum.TextYAlignment.Top
	elseif o.Height then
		row.Size = UDim2.new(1, 0, 0, o.Height)
	end
	local handle = { Instance = lbl }
	function handle:Set(t)
		lbl.Text = t
	end
	function handle:Get()
		return lbl.Text
	end
	function handle:SetColor(c)
		Tween(lbl, { TextColor3 = c }, 0.25)
	end
	local alive = true
	if type(o.Update) == "function" then
		local rate = math.max(tonumber(o.UpdateRate) or 1, 0.05)
		task.spawn(function()
			while alive and lbl.Parent do
				local ok, text = pcall(o.Update)
				if ok and text ~= nil then
					lbl.Text = tostring(text)
				end
				task.wait(rate)
			end
		end)
		function handle:SetUpdateRate(r)
			rate = math.max(tonumber(r) or rate, 0.05)
		end
	end
	row.Destroying:Connect(function()
		alive = false
	end)
	return Register(self, o, handle, entry, row)
end

function Container:Paragraph(o)
	o = Opts(o, { Title = "Name" })
	local row, entry = self:_row(0, o.Name, "Paragraph")
	row.AutomaticSize = Enum.AutomaticSize.Y
	Pad(row, 14, 8, 14, 12)
	List(row, 7)
	local titleLabel
	if (o.Name or "") ~= "" then
		titleLabel = Label({ Size = UDim2.new(1, 0, 0, 18), Text = o.Name, TextSize = 15, FontFace = Fonts.Bold, LayoutOrder = 1, Parent = row })
	end
	local body = Label({
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		Text = o.Content or "",
		TextSize = 13,
		LineHeight = 1.15,
		FontFace = Fonts.Regular,
		TextColor3 = Theme.Muted,
		TextWrapped = true,
		TextTruncate = Enum.TextTruncate.None,
		TextYAlignment = Enum.TextYAlignment.Top,
		RichText = true,
		LayoutOrder = 2,
		Parent = row,
	})
	return Register(self, o, {
		Set = function(_, t)
			body.Text = t
		end,
		SetTitle = function(_, t)
			if titleLabel then
				titleLabel.Text = t
			end
		end,
	}, entry, row)
end

function Container:Button(o)
	o = Opts(o, ControlAliases)
	local primary = o.Style == "Primary"
	local danger = o.Risky == true or o.Style == "Danger"
	local btnHeight = 34
	local row, entry = self:_row(btnHeight + 6 + (o.Desc and 16 or 0), o.Name, "Button")
	local face = New("TextButton", {
		Position = UDim2.fromOffset(14, 3),
		Size = UDim2.new(1, -28, 0, btnHeight),
		BackgroundColor3 = primary and Theme.Accent or (danger and Theme.Error or Theme.Surface),
		BackgroundTransparency = danger and 0.92 or 0,
		BorderSizePixel = 0,
		Text = "",
		AutoButtonColor = false,
		ClipsDescendants = true,
		Parent = row,
	})
	Round(face, 8)
	local stroke = Stroke(face, primary and Theme.Accent or (danger and Theme.Error or Theme.Stroke), 1, primary and 0.2 or (danger and 0.55 or 0))
	local inner = New("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.new(0, 0, 1, 0),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundTransparency = 1,
		Parent = face,
	})
	List(inner, 6, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
	if o.Icon then
		local img = New("ImageLabel", { Size = UDim2.fromOffset(14, 14), BackgroundTransparency = 1, ImageColor3 = primary and Theme.AccentDark or Theme.Accent, ScaleType = Enum.ScaleType.Fit, LayoutOrder = 1, Parent = inner })
		Icon(img, o.Icon)
	end
	local text = Label({
		Size = UDim2.new(0, 0, 1, 0),
		AutomaticSize = Enum.AutomaticSize.X,
		Text = o.Name or "Button",
		TextSize = 12,
		FontFace = primary and Fonts.Bold or Fonts.Medium,
		TextColor3 = primary and Theme.AccentDark or (danger and Theme.Error or Theme.Text),
		TextTruncate = Enum.TextTruncate.None,
		LayoutOrder = 2,
		Parent = inner,
	})
	if o.Desc then
		Label({ Position = UDim2.fromOffset(14, btnHeight + 6), Size = UDim2.new(1, -28, 0, 14), Text = o.Desc, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = row })
	end
	local rest = danger and 0.92 or 0
	face.MouseEnter:Connect(function()
		Tween(face, { BackgroundColor3 = primary and Theme.Accent or (danger and Theme.Error or Theme.Surface3), BackgroundTransparency = danger and 0.84 or 0 }, 0.12)
		Tween(stroke, { Color = primary and Theme.Accent or (danger and Theme.Error or Theme.StrokeHover), Transparency = 0 }, 0.12)
	end)
	face.MouseLeave:Connect(function()
		Tween(face, { BackgroundColor3 = primary and Theme.Accent or (danger and Theme.Error or Theme.Surface), BackgroundTransparency = rest }, 0.2)
		Tween(stroke, { Color = primary and Theme.Accent or (danger and Theme.Error or Theme.Stroke), Transparency = primary and 0.2 or (danger and 0.55 or 0) }, 0.2)
	end)
	face.MouseButton1Click:Connect(function()
		Ripple(face)
		Safe(o.Callback)
	end)
	return Register(self, o, {
		SetText = function(_, t)
			text.Text = t
		end,
		Button = face,
	}, entry, row)
end

function Container:Toggle(o)
	o = Opts(o, ControlAliases)
	local row, entry = self:_row(Rows(o), o.Name, "Toggle")
	local btn = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = row })
	Title(row, o.Name, o.Desc, 60)
	local track = New("Frame", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -14, 0.5, 0),
		Size = UDim2.fromOffset(36, 20),
		BackgroundColor3 = Theme.Surface3,
		BorderSizePixel = 0,
		Parent = row,
	})
	Round(track, 100)
	Stroke(track, Theme.Stroke)
	local knob = New("Frame", {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 3, 0.5, 0),
		Size = UDim2.fromOffset(14, 14),
		BackgroundColor3 = Theme.Muted,
		BorderSizePixel = 0,
		Parent = track,
	})
	Round(knob, 100)
	local glow = Glow(track, UDim2.new(1, 24, 1, 24), Theme.Accent, 1)
	local handle = { Value = o.Default == true }
	local function render(animate)
		local t = animate and 0.25 or 0
		Tween(track, { BackgroundColor3 = handle.Value and Theme.Accent or Theme.Surface3 }, t)
		Tween(glow, { ImageTransparency = handle.Value and 0.75 or 1 }, t)
		Tween(knob, {
			Position = handle.Value and UDim2.new(0, 36 - 3 - 14, 0.5, 0) or UDim2.new(0, 3, 0.5, 0),
			BackgroundColor3 = handle.Value and Theme.AccentDark or Theme.Muted,
		}, t, Enum.EasingStyle.Back)
		if animate then
			Tween(knob, { Size = UDim2.fromOffset(18, 12) }, 0.08)
			task.delay(0.08, function()
				Tween(knob, { Size = UDim2.fromOffset(14, 14) }, 0.2, Enum.EasingStyle.Back)
			end)
		end
	end
	function handle:Set(v, silent)
		v = v == true
		if v == self.Value then
			return
		end
		self.Value = v
		render(true)
		if not silent then
			Safe(o.Callback, v)
		end
	end
	function handle:Get()
		return self.Value
	end
	btn.MouseButton1Click:Connect(function()
		handle:Set(not handle.Value)
	end)
	render(false)
	if handle.Value then
		Safe(o.Callback, true)
	end
	return Register(self, o, handle, entry, row)
end

function Container:Slider(o)
	o = Opts(o, ControlAliases)
	local min, max, step = o.Min or 0, o.Max or 100, o.Step or 1
	local decimals = (tostring(step):find("%.") and #tostring(step) - tostring(step):find("%.")) or 0
	local fmt = "%." .. decimals .. "f"
	local height = o.Desc and 66 or 50
	local row, entry = self:_row(height, o.Name, "Slider")
	Label({ Position = UDim2.fromOffset(14, 5), Size = UDim2.new(1, -120, 0, 18), Text = o.Name or "Slider", TextSize = 13, Parent = row })

	if o.Desc then
		Label({ Position = UDim2.fromOffset(14, 27), Size = UDim2.new(1, -28, 0, 15), Text = o.Desc, TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = row })
	end
	local chip = New("Frame", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -14, 0, 2),
		Size = UDim2.fromOffset(44, 26),
		BackgroundColor3 = Theme.Surface3,
		BorderSizePixel = 0,
		ClipsDescendants = true,
		Parent = row,
	})
	Round(chip, 6)
	local chipStroke = Stroke(chip)
	local valueLabel = Label({ Size = UDim2.fromScale(1, 1), TextSize = 12, FontFace = Font.fromEnum(Enum.Font.Code), TextColor3 = Theme.Accent, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.None, Parent = chip })
	local editBox = New("TextBox", {
		Position = UDim2.fromScale(0, 0),
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Text = "",
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Medium,
		ClearTextOnFocus = false,
		Visible = false,
		Parent = chip,
	})
	local chipBtn = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 2, Parent = chip })

	local trackY = height - 13
	local track = New("Frame", { Position = UDim2.new(0, 14, 0, trackY), Size = UDim2.new(1, -28, 0, 6), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = row })
	Round(track, 3)
	local fill = New("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, Parent = track })
	Round(fill, 3)
	local knob = New("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0, 0, 0.5, 0),
		Size = UDim2.fromOffset(12, 16),
		BackgroundColor3 = Theme.Text,
		BorderSizePixel = 0,
		ZIndex = 3,
		Parent = track,
	})
	Round(knob, 3)
	Stroke(knob, Theme.Accent, 1, 0.15)
	local hit = New("TextButton", {
		Position = UDim2.new(0, 8, 0, trackY - 13),
		Size = UDim2.new(1, -16, 0, 28),
		BackgroundTransparency = 1,
		Text = "",
		AutoButtonColor = false,
		ZIndex = 4,
		Parent = row,
	})

	local handle = { Value = math.clamp(o.Default or min, min, max) }
	local dragging = false
	local function snap(v)
		return math.clamp(math.floor((v - min) / step + 0.5) * step + min, min, max)
	end
	local function alpha()
		return (max - min) == 0 and 0 or (handle.Value - min) / (max - min)
	end
	local function show(time)
		local a = alpha()
		Tween(fill, { Size = UDim2.new(a, 0, 1, 0) }, time, Enum.EasingStyle.Linear)
		Tween(knob, { Position = UDim2.new(a, 0, 0.5, 0) }, time, Enum.EasingStyle.Linear)
		valueLabel.Text = (o.Prefix or "") .. Num(handle.Value) .. (o.Suffix or "")
		Tween(chip, { Size = UDim2.fromOffset(math.max(valueLabel.TextBounds.X / math.max(self.Window.RootScale.Scale, 0.05) + 20, 44), 26) }, 0.2)
	end
	valueLabel:GetPropertyChangedSignal("TextBounds"):Connect(function()
		Tween(chip, { Size = UDim2.fromOffset(math.max(valueLabel.TextBounds.X / math.max(self.Window.RootScale.Scale, 0.05) + 20, 44), 26) }, 0.2)
	end)
	function handle:Set(v, silent)
		v = snap(tonumber(v) or min)
		if v == self.Value then
			return
		end
		self.Value = v
		show(dragging and 0.05 or 0.22)
		if not silent then
			Safe(o.Callback, v)
		end
	end
	function handle:Get()
		return self.Value
	end
	local function fromX(x)
		handle:Set(min + (max - min) * math.clamp((x - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1))
	end
	hit.MouseEnter:Connect(function()
		if not dragging then
			Tween(knob, { BackgroundColor3 = Theme.Accent }, 0.15)
		end
	end)
	hit.MouseLeave:Connect(function()
		if not dragging then
			Tween(knob, { BackgroundColor3 = Theme.Text }, 0.2)
		end
	end)
	hit.InputBegan:Connect(function(input)
		if IsPress(input) then
			dragging = true
			Tween(knob, { Size = UDim2.fromOffset(16, 18) }, 0.15, Enum.EasingStyle.Back)
			fromX(MousePos().X)
		end
	end)
	self.Window:_listen(UserInputService.InputChanged, function(input)
		if dragging and IsMove(input) then
			fromX(MousePos().X)
		end
	end)
	self.Window:_listen(UserInputService.InputEnded, function(input)
		if dragging and IsPress(input) then
			dragging = false
			Tween(knob, { Size = UDim2.fromOffset(12, 16) }, 0.25)
			Safe(o.OnRelease, handle.Value)
		end
	end)
	chipBtn.MouseEnter:Connect(function()
		Tween(chipStroke, { Color = Theme.StrokeHover }, 0.12)
	end)
	chipBtn.MouseLeave:Connect(function()
		if not editBox:IsFocused() then
			Tween(chipStroke, { Color = Theme.Stroke }, 0.2)
		end
	end)
	chipBtn.MouseButton1Click:Connect(function()
		editBox.Text = Num(handle.Value)
		valueLabel.Visible = false
		chipBtn.Visible = false
		editBox.Visible = true
		editBox:CaptureFocus()
	end)
	editBox.FocusLost:Connect(function()
		local v = tonumber(editBox.Text)
		editBox.Visible = false
		valueLabel.Visible = true
		chipBtn.Visible = true
		Tween(chipStroke, { Color = Theme.Stroke }, 0.2)
		if v then
			handle:Set(v)
		end
	end)
	show(0)
	return Register(self, o, handle, entry, row)
end

function Container:Input(o)
	o = Opts(o, { Title = "Name", Description = "Desc", PlaceholderText = "Placeholder", CurrentValue = "Default", Value = "Default" })
	local row, entry = self:_row(Rows(o), o.Name, "Input")
	local title = Title(row, o.Name, o.Desc, 160)
	local chip, stroke = Chip(row, CHIP + 2)
	local x = 8
	if o.Icon then
		NewIcon(chip, o.Icon, 16, Theme.Muted, UDim2.new(0, 8, 0.5, -8))
		x = 30
	end
	local box = New("TextBox", {
		Position = UDim2.fromOffset(x, 0),
		Size = UDim2.new(1, -(x + 8), 1, 0),
		BackgroundTransparency = 1,
		Text = tostring(o.Default or ""),
		PlaceholderText = o.Placeholder or "",
		PlaceholderColor3 = Theme.Muted,
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextXAlignment = Enum.TextXAlignment.Left,
		ClearTextOnFocus = o.ClearTextOnFocus == true,
		TextTruncate = Enum.TextTruncate.None,
		ClipsDescendants = true,
		Parent = chip,
	})
	local function resize()
		local w = ChipWidth(row)
		chip.Size = UDim2.fromOffset(w, CHIP + 2)
		title.Size = UDim2.new(1, -(14 + w + 24), title.Size.Y.Scale, title.Size.Y.Offset)
	end
	row:GetPropertyChangedSignal("AbsoluteSize"):Connect(resize)
	task.defer(resize)
	local validated = o.Numeric or o.Required or o.Min ~= nil or o.Max ~= nil or type(o.Validate) == "function"
	local accepted = o.Numeric and tonumber(box.Text) or box.Text
	local errorText
	if validated then
		local height = Rows(o)
		errorText = Label({ Name = "ValidationError", Position = UDim2.fromOffset(14, height), Size = UDim2.new(1, -28, 0, 26), TextSize = 10, TextColor3 = Theme.Error, TextWrapped = true, TextTruncate = Enum.TextTruncate.None, Visible = false, Parent = row })
		chip.Position = UDim2.new(1, -14, 0, height / 2)
		if title.Size.Y.Scale == 1 then title.Size = UDim2.new(title.Size.X.Scale, title.Size.X.Offset, 0, height) end
	end
	local handle = { TextBox = box }
	function handle:Validate(value)
		local text = tostring(value or "")
		if o.Required and text:match("^%s*$") then return false, "Enter a value." end
		local number = tonumber(text)
		if o.Numeric and (not number or number ~= number or math.abs(number) == math.huge) then return false, "Enter a valid number." end
		if o.Min ~= nil and (not number or number < o.Min) then return false, "Minimum: " .. tostring(o.Min) end
		if o.Max ~= nil and (not number or number > o.Max) then return false, "Maximum: " .. tostring(o.Max) end
		if type(o.Validate) == "function" then
			local ok, valid, reason = pcall(o.Validate, o.Numeric and number or text)
			if not ok or valid == false then return false, reason or "Check this value." end
		end
		return true
	end
	function handle:Get()
		if validated then return accepted end
		return box.Text
	end
	function handle:Set(v, silent)
		local ok, reason = self:Validate(v)
		if errorText then
			errorText.Text, errorText.Visible = reason or "", not ok
			row.Size = UDim2.new(1, 0, 0, Rows(o) + (ok and 0 or 28))
		end
		Tween(stroke, { Color = ok and Theme.Stroke or Theme.Error }, 0.15)
		if not ok then return false, reason end
		box.Text = tostring(v or "")
		accepted = o.Numeric and tonumber(box.Text) or box.Text
		if not silent then Safe(o.Callback, self:Get()) end
		return true
	end
	box.Focused:Connect(function()
		Tween(stroke, { Color = Theme.StrokeHover }, 0.15)
	end)
	box.FocusLost:Connect(function(enter)
		if handle._disabled then return end
		if handle:Set(box.Text, true) then Safe(o.Callback, handle:Get(), enter) end
	end)
	return Register(self, o, handle, entry, row)
end

function Container:Keybind(o)
	o = Opts(o, { Title = "Name", Description = "Desc", CurrentKeybind = "Default", Value = "Default" })
	if type(o.Default) == "string" then
		o.Default = Enum.KeyCode[o.Default]
	end
	local row, entry = self:_row(Rows(o), o.Name, "Keybind")
	local title = Title(row, o.Name, o.Desc, 110)
	local chip, stroke = Chip(row)
	local btn = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = chip })
	local text = Label({ Size = UDim2.fromScale(1, 1), TextSize = 13, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.None, Parent = chip })
	local handle = { Value = o.Default, Listening = false }
	local function resize()
		local w = math.max(text.TextBounds.X + 20, 36)
		Tween(chip, { Size = UDim2.fromOffset(w, CHIP) }, 0.2)
		title.Size = UDim2.new(1, -(14 + w + 24), title.Size.Y.Scale, title.Size.Y.Offset)
	end
	text:GetPropertyChangedSignal("TextBounds"):Connect(resize)
	local function render()
		text.Text = handle.Listening and "..." or KeyName(handle.Value)
		Tween(stroke, { Color = handle.Listening and Theme.StrokeHover or Theme.Stroke }, 0.15)
		Tween(text, { TextColor3 = handle.Listening and Theme.Accent or Theme.Muted }, 0.15)
	end
	function handle:Set(key, silent)
		self.Value = key
		self.Listening = false
		render()
		if not silent then
			Safe(o.OnChanged, key)
		end
	end
	function handle:Get()
		return self.Value
	end
	btn.MouseButton1Click:Connect(function()
		handle.Listening = not handle.Listening
		render()
	end)
	self.Window:_listen(UserInputService.InputBegan, function(input, processed)
		if handle._disabled or input.UserInputType ~= Enum.UserInputType.Keyboard then
			return
		end
		if handle.Listening then
			if o.ClearOnEscape and (input.KeyCode == Enum.KeyCode.Escape or input.KeyCode == Enum.KeyCode.Backspace) then
				handle:Set(nil)
			elseif input.KeyCode == Enum.KeyCode.Escape then
				handle.Listening = false
				render()
			else
				local conflicts = self.Window:GetKeybindConflicts(input.KeyCode, handle)
				if #conflicts > 0 then
					handle.Listening = false
					render()
					self.Window:Notify({ Title = "Key already used", Content = table.concat(conflicts, ", "), Type = "Warning" })
				else
					handle:Set(input.KeyCode)
				end
			end
		elseif not processed and handle.Value and input.KeyCode == handle.Value then
			Safe(o.Callback, input.KeyCode)
		end
	end)
	render()
	task.defer(resize)
	return Register(self, o, handle, entry, row)
end

function Container:Stepper(o)
	o = Opts(o, ControlAliases)
	local min, max, step = o.Min or 0, o.Max or 100, o.Step or 1
	local decimals = (tostring(step):find("%.") and #tostring(step) - tostring(step):find("%.")) or 0
	local fmt = "%." .. decimals .. "f"
	local row, entry = self:_row(Rows(o) + 8, o.Name, "Stepper")
	local title = Title(row, o.Name, o.Desc, 150)
	local chip, stroke = Chip(row)
	chip.AutomaticSize = Enum.AutomaticSize.X
	chip.Size = UDim2.fromOffset(0, 32)
	Pad(chip, 3, 3, 3, 3)
	List(chip, 2, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
	local handle = { Value = math.clamp(o.Default or min, min, max) }
	local function button(symbol, order)
		local b = New("TextButton", {
			Size = UDim2.fromOffset(26, 26),
			BackgroundColor3 = Theme.Surface3,
			BackgroundTransparency = 0,
			BorderSizePixel = 0,
			Text = symbol,
			TextColor3 = Theme.Muted,
			TextSize = 18,
			FontFace = Fonts.Medium,
			AutoButtonColor = false,
			LayoutOrder = order,
			Parent = chip,
		})
		Round(b, 5)
		b.MouseEnter:Connect(function()
			Tween(b, { TextColor3 = Theme.Accent, BackgroundColor3 = Theme.Stroke }, 0.12)
		end)
		b.MouseLeave:Connect(function()
			Tween(b, { TextColor3 = Theme.Muted, BackgroundColor3 = Theme.Surface3 }, 0.2)
		end)
		return b
	end
	local minus = button("\u{2212}", 1)
	local value = Label({ Size = UDim2.new(0, 30, 1, 0), TextSize = 13, FontFace = Font.fromEnum(Enum.Font.Code), TextColor3 = Theme.Text, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 2, Parent = chip })
	local plus = button("+", 3)
	value:GetPropertyChangedSignal("TextBounds"):Connect(function()
		Tween(value, { Size = UDim2.new(0, math.max(value.TextBounds.X / math.max(self.Window.RootScale.Scale, 0.05) + 12, 30), 1, 0) }, 0.2)
	end)
	chip:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
		title.Size = UDim2.new(1, -(14 + chip.AbsoluteSize.X / math.max(self.Window.RootScale.Scale, 0.05) + 24), title.Size.Y.Scale, title.Size.Y.Offset)
	end)
	local function render()
		value.Text = string.format(fmt, handle.Value) .. (o.Suffix or "")
		Tween(minus, { TextTransparency = handle.Value <= min and 0.6 or 0 }, 0.15)
		Tween(plus, { TextTransparency = handle.Value >= max and 0.6 or 0 }, 0.15)
	end
	function handle:Set(v, silent)
		v = math.clamp(math.floor((tonumber(v) or min) / step + 0.5) * step, min, max)
		if v == self.Value then
			return
		end
		self.Value = v
		render()
		if not silent then
			Safe(o.Callback, v)
		end
	end
	function handle:Get()
		return self.Value
	end
	local function bump(dir)
		handle:Set(handle.Value + dir * step)
		Tween(stroke, { Color = Theme.StrokeHover }, 0.08)
		task.delay(0.12, function()
			Tween(stroke, { Color = Theme.Stroke }, 0.2)
		end)
	end
	local function hold(btn, dir)
		local down = false
		btn.InputBegan:Connect(function(input)
			if not IsPress(input) then
				return
			end
			down = true
			bump(dir)
			task.delay(0.4, function()
				while down do
					bump(dir)
					task.wait(0.07)
				end
			end)
		end)
		btn.InputEnded:Connect(function(input)
			if IsPress(input) then
				down = false
			end
		end)
		btn.MouseLeave:Connect(function()
			down = false
		end)
	end
	hold(minus, -1)
	hold(plus, 1)
	render()
	return Register(self, o, handle, entry, row)
end

function Container:Progress(o)
	o = Opts(o, ControlAliases)
	local row, entry = self:_row((o.Desc and ROW_DESC or ROW) + 14, o.Name, "Progress")
	local y = o.Desc and math.floor((ROW_DESC - 32) / 2) - 2 or 5
	Label({ Position = UDim2.fromOffset(14, y), Size = UDim2.new(1, -110, 0, 18), Text = o.Name or "Progress", TextSize = 13, Parent = row })
	if o.Desc then
		Label({ Position = UDim2.fromOffset(14, y + 17), Size = UDim2.new(1, -110, 0, 15), Text = o.Desc, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = row })
	end
	local valueLabel = Label({
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -14, 0, y),
		Size = UDim2.fromOffset(90, 18),
		TextXAlignment = Enum.TextXAlignment.Right,
		TextSize = 12,
		FontFace = Fonts.Bold,
		TextColor3 = o.TextColor or Theme.Accent,
		RichText = true,
		Parent = row,
	})
	local track = New("Frame", { Position = UDim2.new(0, 14, 1, -16), Size = UDim2.new(1, -28, 0, 9), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = row })
	Round(track, 4)
	Stroke(track, Theme.Stroke, 1, 0.4)
	local fill = New("Frame", { Size = UDim2.new(0, 0, 1, 0), BackgroundColor3 = o.Color or Theme.Accent, BorderSizePixel = 0, Parent = track })
	Round(fill, 3)
	fill.ClipsDescendants = true
	New("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.new(0, 2, 1, 0), BackgroundColor3 = Theme.Text, BackgroundTransparency = 0.3, BorderSizePixel = 0, Parent = fill })
	local handle = { Value = math.clamp(o.Default or 0, 0, 1) }
	local function render(time)
		Tween(fill, { Size = UDim2.new(handle.Value, 0, 1, 0) }, time)
		valueLabel.Text = type(o.Format) == "function" and tostring(o.Format(handle.Value)) or string.format("%d%%", math.floor(handle.Value * 100 + 0.5))
	end
	function handle:Set(v, silent)
		v = math.clamp(tonumber(v) or 0, 0, 1)
		if v == self.Value then
			return
		end
		self.Value = v
		render(0.35)
		if not silent then
			Safe(o.Callback, v)
		end
	end
	function handle:Get()
		return self.Value
	end
	function handle:SetColor(c)
		Tween(fill, { BackgroundColor3 = c }, 0.25)
	end
	function handle:SetTextColor(c)
		Tween(valueLabel, { TextColor3 = c }, 0.25)
	end
	render(0)
	handle.Render = function()
		render(0)
	end
	return Register(self, o, handle, entry, row)
end

function Container:ColorPicker(o)
	o = Opts(o, { Title = "Name", Description = "Desc", Color = "Default", CurrentValue = "Default", Value = "Default" })
	local EXTRA = 194
	local base = Rows(o)
	local row, entry = self:_row(base, o.Name, "ColorPicker")
	row.ClipsDescendants = true
	local head = New("TextButton", { Size = UDim2.new(1, 0, 0, base), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = row })
	Title(head, o.Name or "Color", o.Desc, 140)
	local swatch = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -38, 0.5, 0), Size = UDim2.fromOffset(22, 22), BorderSizePixel = 0, Parent = head })
	Round(swatch, 6)
	Stroke(swatch, Theme.Stroke)
	local hexLabel = Label({ AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -68, 0.5, 0), Size = UDim2.fromOffset(64, 16), TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Right, Parent = head })
	local arrow = NewIcon(head, "chevron-down", 16, Theme.Muted, UDim2.new(1, -30, 0.5, -8))

	local body = New("Frame", { Position = UDim2.fromOffset(14, base + 2), Size = UDim2.new(1, -28, 0, EXTRA - 12), BackgroundTransparency = 1, Visible = false, Parent = row })
	local sv = New("TextButton", { Size = UDim2.new(1, 0, 0, 118), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, Text = "", AutoButtonColor = false, Parent = body })
	Round(sv, 8)
	Stroke(sv, Theme.Stroke)
	local satGradient = New("UIGradient", { Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.new(1, 0, 0)), Parent = sv })
	local dark = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, Parent = sv })
	Round(dark, 8)
	New("UIGradient", { Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(1, 0) }), Rotation = 90, Parent = dark })
	local function picker(parent, size)
		local ring = New("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromOffset(size, size), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, ZIndex = 3, Parent = parent })
		Round(ring, 100)
		Stroke(ring, Color3.new(0, 0, 0), 1, 0.7)
		local dot = New("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.new(1, -4, 1, -4), BorderSizePixel = 0, ZIndex = 3, Parent = ring })
		Round(dot, 100)
		return ring, dot
	end
	local svRing, svDot = picker(sv, 14)
	local hueBar = New("TextButton", { Position = UDim2.fromOffset(0, 132), Size = UDim2.new(1, 0, 0, 10), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, Text = "", AutoButtonColor = false, Parent = body })
	Round(hueBar, 100)
	New("UIGradient", {
		Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)),
			ColorSequenceKeypoint.new(1 / 6, Color3.fromRGB(255, 255, 0)),
			ColorSequenceKeypoint.new(2 / 6, Color3.fromRGB(0, 255, 0)),
			ColorSequenceKeypoint.new(3 / 6, Color3.fromRGB(0, 255, 255)),
			ColorSequenceKeypoint.new(4 / 6, Color3.fromRGB(0, 0, 255)),
			ColorSequenceKeypoint.new(5 / 6, Color3.fromRGB(255, 0, 255)),
			ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 0, 0)),
		}),
		Parent = hueBar,
	})
	local hueRing, hueDot = picker(hueBar, 16)
	hueRing.Position = UDim2.fromScale(0, 0.5)

	local hexBox = New("Frame", { Position = UDim2.fromOffset(0, 154), Size = UDim2.fromOffset(110, 28), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = body })
	Round(hexBox, 7)
	local hexStroke = Stroke(hexBox)
	local mini = New("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 6, 0.5, 0), Size = UDim2.fromOffset(16, 16), BorderSizePixel = 0, Parent = hexBox })
	Round(mini, 4)
	Stroke(mini, Theme.Stroke)
	local hexInput = New("TextBox", {
		Position = UDim2.fromOffset(30, 0),
		Size = UDim2.new(1, -38, 1, 0),
		BackgroundTransparency = 1,
		Text = "",
		TextTruncate = Enum.TextTruncate.None,
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextXAlignment = Enum.TextXAlignment.Left,
		ClearTextOnFocus = false,
		Parent = hexBox,
	})
	local rgbLabel = Label({ Position = UDim2.fromOffset(118, 154), Size = UDim2.new(1, -118, 0, 28), TextXAlignment = Enum.TextXAlignment.Right, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = body })

	local handle = { Open = false }
	local h, s, v = Color3.toHSV(o.Default or Theme.Accent)
	local function toHex(c)
		return string.format("#%02X%02X%02X", math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5))
	end
	local function render(time)
		local c = Color3.fromHSV(h, s, v)
		handle.Value = c
		swatch.BackgroundColor3, mini.BackgroundColor3, svDot.BackgroundColor3 = c, c, c
		hueDot.BackgroundColor3 = Color3.fromHSV(h, 1, 1)
		hexLabel.Text = toHex(c)
		satGradient.Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromHSV(h, 1, 1))
		Tween(svRing, { Position = UDim2.fromScale(s, 1 - v) }, time)
		Tween(hueRing, { Position = UDim2.fromScale(h, 0.5) }, time)
		if not hexInput:IsFocused() then
			hexInput.Text = toHex(c)
		end
		rgbLabel.Text = string.format("%d  %d  %d", math.floor(c.R * 255 + 0.5), math.floor(c.G * 255 + 0.5), math.floor(c.B * 255 + 0.5))
	end
	local function changed(time, silent)
		render(time)
		if not silent then
			Safe(o.Callback, handle.Value)
		end
	end
	function handle:Set(c, silent)
		h, s, v = Color3.toHSV(c)
		changed(0.25, silent)
	end
	function handle:Get()
		return self.Value
	end
	function handle:SetOpen(open)
		self.Open = open == true
		Tween(row, { Size = UDim2.new(1, 0, 0, self.Open and base + EXTRA or base) }, 0.35)
		Tween(arrow, { Rotation = self.Open and 180 or 0, ImageColor3 = self.Open and Theme.Accent or Theme.Muted }, 0.3)
		if self.Open then
			body.Visible = true
		else
			task.delay(0.35, function()
				if not self.Open then
					body.Visible = false
				end
			end)
		end
	end
	head.MouseButton1Click:Connect(function()
		handle:SetOpen(not handle.Open)
	end)
	local mode
	local function applySV(x, y)
		s = math.clamp((x - sv.AbsolutePosition.X) / sv.AbsoluteSize.X, 0, 1)
		v = 1 - math.clamp((y - sv.AbsolutePosition.Y) / sv.AbsoluteSize.Y, 0, 1)
		changed(0.04)
	end
	local function applyHue(x)
		h = math.clamp((x - hueBar.AbsolutePosition.X) / hueBar.AbsoluteSize.X, 0, 0.999)
		changed(0.04)
	end
	sv.InputBegan:Connect(function(input)
		if IsPress(input) then
			mode = "sv"
			Tween(svRing, { Size = UDim2.fromOffset(18, 18) }, 0.2)
			local m = MousePos()
			applySV(m.X, m.Y)
		end
	end)
	hueBar.InputBegan:Connect(function(input)
		if IsPress(input) then
			mode = "hue"
			Tween(hueRing, { Size = UDim2.fromOffset(20, 20) }, 0.2)
			applyHue(MousePos().X)
		end
	end)
	self.Window:_listen(UserInputService.InputChanged, function(input)
		if mode and IsMove(input) then
			local m = MousePos()
			if mode == "sv" then
				applySV(m.X, m.Y)
			else
				applyHue(m.X)
			end
		end
	end)
	self.Window:_listen(UserInputService.InputEnded, function(input)
		if mode and IsPress(input) then
			mode = nil
			Tween(svRing, { Size = UDim2.fromOffset(14, 14) }, 0.25)
			Tween(hueRing, { Size = UDim2.fromOffset(16, 16) }, 0.25)
		end
	end)
	hexInput.Focused:Connect(function()
		Tween(hexStroke, { Color = Theme.StrokeHover }, 0.15)
	end)
	hexInput.FocusLost:Connect(function()
		Tween(hexStroke, { Color = Theme.Stroke }, 0.15)
		local r, g, b = hexInput.Text:match("^%s*#?(%x%x)(%x%x)(%x%x)%s*$")
		if r then
			handle:Set(Color3.fromRGB(tonumber(r, 16), tonumber(g, 16), tonumber(b, 16)))
		else
			hexInput.Text = toHex(handle.Value)
		end
	end)
	render(0)
	return Register(self, o, handle, entry, row)
end

function Container:Dropdown(o)
	o = Opts(o, ControlAliases)
	local win = self.Window
	local multi = o.Multi == true
	local options = o.Options or {}
	local selected = {}
	if multi then
		for _, v in ipairs(type(o.Default) == "table" and o.Default or {}) do
			selected[v] = true
		end
	elseif o.Default ~= nil then
		selected[o.Default] = true
	end

	local stacked = o.Stacked == true
	local chipHeight = stacked and 30 or CHIP
	local topPad = (stacked and o.Name and o.Name ~= "") and 20 or 2
	local row, entry = self:_row(stacked and (topPad + chipHeight + 4) or Rows(o), o.Name, "Dropdown")
	local title
	if stacked then
		if topPad > 2 then
			Label({ Position = UDim2.fromOffset(14, 1), Size = UDim2.new(1, -28, 0, 16), Text = o.Name, TextSize = 13, Parent = row })
		end
	else
		title = Title(row, o.Name, o.Desc, 180)
	end
	local chip, chipStroke = Chip(row, chipHeight)
	if stacked then
		chip.AnchorPoint = Vector2.zero
		chip.Position = UDim2.fromOffset(14, topPad)
	end
	local chipText = Label({ Position = UDim2.fromOffset(10, 0), Size = UDim2.new(1, -34, 1, 0), TextColor3 = Theme.Muted, TextSize = 13, Parent = chip })
	local arrow = NewIcon(chip, "chevron-down", 16, Theme.Muted, UDim2.new(1, -22, 0.5, -8))
	local chipButton = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 2, Parent = chip })

	local function resize()
		if stacked then
			chip.Size = UDim2.new(1, -28, 0, chipHeight)
			return
		end
		local w = ChipWidth(row)
		chip.Size = UDim2.fromOffset(w, CHIP)
		title.Size = UDim2.new(1, -(14 + w + 24), title.Size.Y.Scale, title.Size.Y.Offset)
	end
	row:GetPropertyChangedSignal("AbsoluteSize"):Connect(resize)
	task.defer(resize)

	local handle = { Open = false }
	local function result()
		if not multi then
			for _, opt in ipairs(options) do
				if selected[opt] then
					return opt
				end
			end
			return nil
		end
		local list = {}
		for _, opt in ipairs(options) do
			if selected[opt] then
				table.insert(list, opt)
			end
		end
		return list
	end
	local function summary()
		local r = result()
		if #options == 0 then
			return o.EmptyText or "None"
		elseif multi then
			if #r > 2 then
				return tostring(r[1]) .. ", " .. tostring(r[2]) .. "  +" .. (#r - 2)
			end
			return #r > 0 and table.concat(r, ", ") or (o.NoneText or "None")
		end
		return r ~= nil and tostring(r) or (o.NoneText or "None")
	end

	-- popup
	local OPTION_H, MAX_ROWS = 28, o.MaxRows or 6
	local pop = New("Frame", { AnchorPoint = Vector2.new(1, 0), Size = UDim2.fromOffset(220, 0), BackgroundTransparency = 1, Visible = false, ZIndex = 45, Parent = win.Gui })
	local shadow = New("ImageLabel", {
		Position = UDim2.fromOffset(-18, -12),
		Size = UDim2.new(1, 36, 1, 36),
		BackgroundTransparency = 1,
		Image = ASSETS.Shadow,
		ImageColor3 = Color3.new(0, 0, 0),
		ImageTransparency = 1,
		ScaleType = Enum.ScaleType.Slice,
		SliceCenter = Rect.new(49, 49, 450, 450),
		Parent = pop,
	})
	local card = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Theme.Background, BorderSizePixel = 0, ClipsDescendants = true, Parent = pop })
	Round(card, 12)
	local cardStroke = Stroke(card, Theme.Stroke, 1)
	local inner = New("Frame", { Size = UDim2.new(1, 0, 0, 120), BackgroundTransparency = 1, Parent = card })
	Pad(inner, 8, 8, 8, 8)

	local searchBar = New("Frame", { Size = UDim2.new(1, 0, 0, 32), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = inner })
	Round(searchBar, 7)
	local searchStroke = Stroke(searchBar)
	local searchIcon = NewIcon(searchBar, "search", 14, Theme.Muted, UDim2.new(0, 10, 0.5, -7))
	local searchBox = New("TextBox", {
		Position = UDim2.fromOffset(32, 0),
		Size = UDim2.new(1, -40, 1, 0),
		BackgroundTransparency = 1,
		Text = "",
		PlaceholderText = o.SearchPlaceholder or "Search",
		PlaceholderColor3 = Theme.Muted,
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextXAlignment = Enum.TextXAlignment.Left,
		ClearTextOnFocus = false,
		Parent = searchBar,
	})
	searchBox.Focused:Connect(function()
		Tween(searchStroke, { Color = Theme.StrokeHover }, 0.15)
		Tween(searchIcon, { ImageColor3 = Theme.Accent }, 0.15)
	end)
	searchBox.FocusLost:Connect(function()
		Tween(searchStroke, { Color = Theme.Stroke }, 0.2)
		Tween(searchIcon, { ImageColor3 = Theme.Muted }, 0.2)
	end)

	if type(o.GetOptions) == "function" then
		searchBar.Size = UDim2.new(1, -36, 0, 32)
		local refresh = New("TextButton", { Name = "RefreshOptions", Position = UDim2.new(1, -30, 0, 0), Size = UDim2.fromOffset(30, 32), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Text = "", AutoButtonColor = false, Parent = inner })
		Round(refresh, 6)
		local icon = NewIcon(refresh, "refresh-cw", 14, Theme.Muted, UDim2.fromOffset(8, 9))
		refresh.MouseEnter:Connect(function() Tween(icon, { ImageColor3 = Theme.Accent }, 0.15) end)
		refresh.MouseLeave:Connect(function() Tween(icon, { ImageColor3 = Theme.Muted }, 0.15) end)
		refresh.MouseButton1Click:Connect(function() handle:Reload() end)
	end

	local bulk = New("Frame", { Name = "BulkActions", Size = UDim2.new(1, 0, 0, 28), BackgroundTransparency = 1, Visible = multi, Parent = inner })
	local function bulkButton(text, pos)
		local b = New("TextButton", { Position = pos, Size = UDim2.new(0.5, -3, 1, 0), BackgroundColor3 = Theme.Surface3, BackgroundTransparency = 0.35, BorderSizePixel = 0, Text = "", AutoButtonColor = false, ClipsDescendants = true, Parent = bulk })
		Round(b, 6)
		local st = Stroke(b)
		Label({ Size = UDim2.fromScale(1, 1), Text = text, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, Parent = b })
		b.MouseEnter:Connect(function()
			Tween(b, { BackgroundTransparency = 0.05 }, 0.15)
			Tween(st, { Color = Theme.StrokeHover }, 0.15)
		end)
		b.MouseLeave:Connect(function()
			Tween(b, { BackgroundTransparency = 0.35 }, 0.25)
			Tween(st, { Color = Theme.Stroke }, 0.25)
		end)
		b.MouseButton1Click:Connect(function()
			Ripple(b)
		end)
		return b
	end
	local selectAll = bulkButton(o.SelectAllText or "Select all", UDim2.fromOffset(0, 0))
	selectAll.Name = "SelectAll"
	local clearAll = bulkButton(o.ClearAllText or "Unselect all", UDim2.new(0.5, 3, 0, 0))

	clearAll.Name = "UnselectAll"
	local list = New("ScrollingFrame", {
		Size = UDim2.new(1, 0, 0, 100),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 3,
		ScrollBarImageColor3 = Theme.Accent,
		ScrollBarImageTransparency = 0.4,
		CanvasSize = UDim2.new(),
		Parent = inner,
	})
	List(list, 2)
	local empty = Label({ Size = UDim2.new(1, 0, 0, OPTION_H), Text = o.NoResultsText or "No results", TextSize = 13, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, LayoutOrder = 0, Visible = false, Parent = list })

	local query = ""
	local items = {}
	local popSize = Vector2.new(220, 120)

	local function matches(opt)
		return query == "" or string.find(string.lower(tostring(opt)), query, 1, true) ~= nil
	end
	local function esc(t)
		return (t:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
	end
	local function highlight(text)
		text = tostring(text)
		local a = query ~= "" and string.find(string.lower(text), query, 1, true)
		if not a then
			return esc(text)
		end
		local b = a + #query - 1
		return esc(text:sub(1, a - 1)) .. '<font color="#' .. Theme.Accent:ToHex() .. '"><b>' .. esc(text:sub(a, b)) .. "</b></font>" .. esc(text:sub(b + 1))
	end
	local function paint(item, animate)
		local on = selected[item.Option] == true
		local t = animate and 0.18 or 0
		Tween(item.Frame, {
			BackgroundColor3 = on and Theme.Accent or Theme.Surface3,
			BackgroundTransparency = on and (item.Hover and 0.8 or 0.88) or (item.Hover and 0.55 or 1),
		}, t)
		Tween(item.Label, { TextColor3 = (on or item.Hover) and Theme.Text or Theme.Muted }, t)
		if multi then
			Tween(item.Box, { BackgroundColor3 = on and Theme.Accent or Theme.Surface2 }, t)
			Tween(item.BoxStroke, { Color = on and Theme.Accent or Theme.Stroke }, t)
		else
			Tween(item.Bar, { BackgroundTransparency = on and 0 or 1, Size = UDim2.fromOffset(3, on and OPTION_H - 14 or 4) }, animate and 0.3 or 0)
		end
		Tween(item.Check, { ImageTransparency = on and 0 or 1 }, t)
		if animate and on then
			item.CheckScale.Scale = 0.5
			Tween(item.CheckScale, { Scale = 1 }, 0.3, Enum.EasingStyle.Back)
		else
			item.CheckScale.Scale = 1
		end
	end
	local function refreshChip(animate)
		chipText.Text = summary()
		local r = result()
		local has = #options > 0 and (multi and #r > 0 or (not multi and r ~= nil))
		Tween(chipText, { TextColor3 = has and Theme.Text or Theme.Muted }, animate and 0.15 or 0)
		for _, item in pairs(items) do
			paint(item, animate)
		end
	end
	local function layoutPopup(instant)
		local showSearch = type(o.GetOptions) == "function" or (o.Searchable ~= false and #options > (o.SearchAfter or 0))
		searchBar.Visible = showSearch
		local y = showSearch and 38 or 0
		bulk.Position = UDim2.fromOffset(0, y)
		if multi and #options > 0 then
			y += 34
		end
		bulk.Visible = multi and #options > 0
		local count = 0
		for _, opt in ipairs(options) do
			if matches(opt) then
				count += 1
			end
		end
		empty.Visible = count == 0
		local rows = math.clamp(count, 1, MAX_ROWS)
		local listHeight = rows * OPTION_H + (rows - 1) * 2
		list.CanvasSize = UDim2.fromOffset(0, math.max(count, 1) * (OPTION_H + 2) - 2)
		list.Position = UDim2.fromOffset(0, y)
		list.Size = UDim2.new(1, 0, 0, listHeight)
		local width = math.max(chip.AbsoluteSize.X, o.PopupWidth or 210)
		popSize = Vector2.new(math.min(width, win.Gui.AbsoluteSize.X - 16), y + listHeight + 16)
		inner.Size = UDim2.new(1, 0, 0, popSize.Y)
		if handle.Open then
			if instant then
				pop.Size = UDim2.fromOffset(popSize.X, popSize.Y)
			else
				Tween(pop, { Size = UDim2.fromOffset(popSize.X, popSize.Y) }, 0.22)
			end
		end
	end
	local function applyFilter()
		for opt, item in pairs(items) do
			local ok = matches(opt)
			item.Frame.Visible = ok
			if ok then
				item.Label.Text = highlight(opt)
			end
		end
	end
	local function changed()
		refreshChip(true)
		Safe(o.Callback, result())
	end

	local built = false
	local function buildItems()
		built = true
		for opt, item in pairs(items) do
			item.Frame:Destroy()
			items[opt] = nil
		end
		for i, opt in ipairs(options) do
			local frame = New("TextButton", { Size = UDim2.new(1, -6, 0, OPTION_H), BackgroundColor3 = Theme.Surface3, BackgroundTransparency = 1, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = list })
			Round(frame, 7)
			local item = { Option = opt, Frame = frame, Hover = false }
			if multi then
				item.Box = New("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Size = UDim2.fromOffset(18, 18), BackgroundColor3 = Theme.Surface2, BorderSizePixel = 0, Parent = frame })
				Round(item.Box, 5)
				item.BoxStroke = Stroke(item.Box, Theme.Stroke)
				item.Check = New("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(12, 12), BackgroundTransparency = 1, ImageColor3 = Theme.AccentDark, ImageTransparency = 1, ScaleType = Enum.ScaleType.Fit, Parent = item.Box })
			else
				item.Bar = New("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 3, 0.5, 0), Size = UDim2.fromOffset(3, 4), BackgroundColor3 = Theme.Accent, BackgroundTransparency = 1, BorderSizePixel = 0, Parent = frame })
				Round(item.Bar, 100)
				item.Check = New("ImageLabel", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -10, 0.5, 0), Size = UDim2.fromOffset(14, 14), BackgroundTransparency = 1, ImageColor3 = Theme.Accent, ImageTransparency = 1, ScaleType = Enum.ScaleType.Fit, Parent = frame })
			end
			Icon(item.Check, "check")
			item.CheckScale = New("UIScale", { Parent = item.Check })
			item.Label = Label({
				Position = UDim2.fromOffset(multi and 36 or 14, 0),
				Size = UDim2.new(1, multi and -44 or -46, 1, 0),
				Text = highlight(opt),
				TextSize = 13,
				TextColor3 = Theme.Muted,
				RichText = true,
				Parent = frame,
			})
			frame.MouseEnter:Connect(function()
				item.Hover = true
				paint(item, true)
			end)
			frame.MouseLeave:Connect(function()
				item.Hover = false
				paint(item, true)
			end)
			frame.MouseButton1Click:Connect(function()
				if selected[opt] then
					if not multi and o.AllowNone == false then
						handle:SetOpen(false)
						return
					end
					selected[opt] = nil
				else
					if not multi then
						selected = {}
					end
					selected[opt] = true
				end
				changed()
				if not multi then
					handle:SetOpen(false)
				end
			end)
			items[opt] = item
			paint(item, false)
		end
		applyFilter()
	end

	local follow
	local serial = 0
	local function reposition()
		local screen = win.Gui.AbsoluteSize
		local page = win.PageHolder
		local center = chip.AbsolutePosition + chip.AbsoluteSize / 2
		if not MouseOver(page, center) then
			handle:SetOpen(false)
			return
		end
		local origin = chip.AbsolutePosition - win.Gui.AbsolutePosition
		local right = math.clamp(origin.X + chip.AbsoluteSize.X, popSize.X + 8, math.max(screen.X - 8, popSize.X + 8))
		local below = origin.Y + chip.AbsoluteSize.Y + 6
		if below + popSize.Y > screen.Y - 8 and origin.Y - 6 - popSize.Y >= 8 then
			pop.AnchorPoint = Vector2.new(1, 1)
			pop.Position = UDim2.fromOffset(right, origin.Y - 6)
			card.AnchorPoint = Vector2.new(0, 1)
			card.Position = UDim2.fromScale(0, 1)
		else
			pop.AnchorPoint = Vector2.new(1, 0)
			pop.Position = UDim2.fromOffset(right, below)
			card.AnchorPoint = Vector2.zero
			card.Position = UDim2.fromScale(0, 0)
		end
	end

	function handle:SetOpen(open)
		open = open == true
		if open and self._disabled then return end
		if open == self.Open then
			return
		end
		if open and not built then
			buildItems()
			refreshChip(false)
		end
		self.Open = open
		Tween(arrow, { Rotation = open and 180 or 0, ImageColor3 = open and Theme.Accent or Theme.Muted }, 0.3)
		Tween(chipStroke, { Color = open and Theme.Accent or Theme.Stroke, Transparency = open and 0.35 or 0 }, 0.2)
		Tween(chip, { BackgroundColor3 = open and Theme.Surface2 or Theme.Surface }, 0.2)
		serial += 1
		local mine = serial
		if open then
			if win._closePopup then
				win._closePopup()
			end
			win._closePopup = function()
				handle:SetOpen(false)
			end
			query = ""
			searchBox.Text = ""
			applyFilter()
			layoutPopup(true)
			list.CanvasPosition = Vector2.zero
			reposition()
			pop.Size = UDim2.fromOffset(popSize.X, 0)
			pop.Visible = true
			Tween(pop, { Size = UDim2.fromOffset(popSize.X, popSize.Y) }, 0.3)
			Tween(cardStroke, { Transparency = 0 }, 0.12)
			Tween(shadow, { ImageTransparency = 0.4 }, 0.3)
			follow = follow or RunService.RenderStepped:Connect(reposition)
		else
			win._closePopup = nil
			if searchBox:IsFocused() then
				searchBox:ReleaseFocus()
			end
			Tween(pop, { Size = UDim2.fromOffset(popSize.X, 0) }, 0.2)
			Tween(shadow, { ImageTransparency = 1 }, 0.16)
			task.delay(0.21, function()
				if serial == mine and not handle.Open then
					pop.Visible = false
					if follow then
						follow:Disconnect()
						follow = nil
					end
				end
			end)
		end
	end
	function handle:Get()
		return result()
	end
	function handle:Set(v, silent)
		selected = {}
		if multi then
			for _, x in ipairs(type(v) == "table" and v or { v }) do
				selected[x] = true
			end
		elseif v ~= nil then
			selected[v] = true
		end
		refreshChip(handle.Open)
		if not silent then
			Safe(o.Callback, result())
		end
	end
	function handle:Refresh(newOptions, keep, silent)
		options = newOptions or {}
		if not keep then
			selected = {}
		end
		if built then
			buildItems()
		end
		refreshChip(false)
		layoutPopup(false)
		if not silent then
			Safe(o.Callback, result())
		end
	end

	function handle:Reload()
		if type(o.GetOptions) ~= "function" then return false, "No options provider" end
		local ok, values = pcall(o.GetOptions)
		if not ok or type(values) ~= "table" then
			win:Notify({ Title = "Refresh failed", Content = "Options could not be loaded.", Type = "Error" })
			return false, values
		end
		if self.Type == "Dropdown" then self:Refresh(values) else self:Refresh(values, true) end
		return true
	end

	selectAll.MouseButton1Click:Connect(function()
		for _, opt in ipairs(options) do
			if matches(opt) then
				selected[opt] = true
			end
		end
		changed()
	end)
	clearAll.MouseButton1Click:Connect(function()
		selected = {}
		changed()
	end)
	searchBox:GetPropertyChangedSignal("Text"):Connect(function()
		query = string.lower(searchBox.Text)
		applyFilter()
		layoutPopup(false)
	end)
	chipButton.MouseButton1Click:Connect(function()
		handle:SetOpen(not handle.Open)
	end)
	chipButton.MouseEnter:Connect(function()
		if not handle.Open then
			Tween(chipStroke, { Color = Theme.StrokeHover }, 0.15)
			Tween(chip, { BackgroundColor3 = Theme.Surface2 }, 0.15)
		end
	end)
	chipButton.MouseLeave:Connect(function()
		if not handle.Open then
			Tween(chipStroke, { Color = Theme.Stroke }, 0.25)
			Tween(chip, { BackgroundColor3 = Theme.Surface }, 0.25)
		end
	end)
	win:_listen(UserInputService.InputBegan, function(input)
		if not handle.Open then
			return
		end
		if input.KeyCode == Enum.KeyCode.Escape then
			handle:SetOpen(false)
		elseif IsPress(input) then
			local m = MousePos()
			if not MouseOver(pop, m) and not MouseOver(chip, m) then
				handle:SetOpen(false)
			end
		end
	end)
	row.Destroying:Connect(function()
		if follow then
			follow:Disconnect()
		end
		pop:Destroy()
	end)
	refreshChip(false)
	return Register(self, o, handle, entry, row)
end

function Container:ButtonRow(o)
	local list = type(o) == "table" and (o.Buttons or o) or {}
	local row, entry = self:_row(40, nil, "ButtonRow")
	local holder = New("Frame", { Position = UDim2.fromOffset(14, 2), Size = UDim2.new(1, -28, 0, 34), BackgroundTransparency = 1, Parent = row })
	local count = math.max(#list, 1)
	local handle = { Buttons = {} }
	local names = {}
	for i, b in ipairs(list) do
		if type(b) == "string" then
			b = { Name = b }
		end
		local name = b.Name or b.Title or "Button"
		table.insert(names, name)
		local face = New("TextButton", {
			Position = UDim2.new((i - 1) / count, (i - 1) * 6 / count, 0, 0),
			Size = UDim2.new(1 / count, -6 * (count - 1) / count, 1, 0),
			BackgroundColor3 = b.Style == "Danger" and Theme.Error or Theme.Surface,
			BackgroundTransparency = b.Style == "Danger" and 0.92 or 0,
			BorderSizePixel = 0,
			Text = "",
			AutoButtonColor = false,
			ClipsDescendants = true,
			Parent = holder,
		})
		Round(face, 7)
		local stroke = Stroke(face, b.Style == "Danger" and Theme.Error or Theme.Stroke, 1, b.Style == "Danger" and 0.55 or 0)
		local label = Label({ Size = UDim2.fromScale(1, 1), Text = name, TextSize = 11, FontFace = Fonts.Bold, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = b.Style == "Danger" and Theme.Error or Theme.Text, Parent = face })
		local rest = b.Style == "Danger" and 0.92 or 0
		if b.Style == "Primary" then
			face.BackgroundColor3 = Theme.Accent
			rest = 0
			face.BackgroundTransparency = rest
			label.TextColor3 = Theme.AccentDark
		end
		face.MouseEnter:Connect(function()
			Tween(face, { BackgroundTransparency = b.Style == "Danger" and 0.84 or 0, BackgroundColor3 = b.Style == "Primary" and Theme.Accent or (b.Style == "Danger" and Theme.Error or Theme.Surface3) }, 0.12)
			Tween(stroke, { Color = b.Style == "Primary" and Theme.Accent or (b.Style == "Danger" and Theme.Error or Theme.StrokeHover) }, 0.12)
		end)
		face.MouseLeave:Connect(function()
			Tween(face, { BackgroundTransparency = rest, BackgroundColor3 = b.Style == "Primary" and Theme.Accent or (b.Style == "Danger" and Theme.Error or Theme.Surface) }, 0.2)
			Tween(stroke, { Color = b.Style == "Primary" and Theme.Accent or (b.Style == "Danger" and Theme.Error or Theme.Stroke) }, 0.2)
		end)
		face.MouseButton1Click:Connect(function()
			Ripple(face)
			Safe(b.Callback)
		end)
		handle.Buttons[i] = { Button = face, Label = label }
	end
	function handle:SetText(i, text)
		if self.Buttons[i] then
			self.Buttons[i].Label.Text = tostring(text)
		end
	end
	entry.Name = string.lower(table.concat(names, " "))
	return Register(self, type(o) == "table" and o or {}, handle, entry, row)
end

-- text box with an optional button on its right
function Container:ActionInput(placeholder, buttonText, callback)
	local row, entry = self:_row(44, placeholder, "ActionInput")
	local boxFrame = New("Frame", { Position = UDim2.fromOffset(14, 4), Size = UDim2.new(1, -28, 0, 36), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
	Round(boxFrame, 8)
	local stroke = Stroke(boxFrame)
	local box = New("TextBox", { Position = UDim2.fromOffset(10, 0), Size = UDim2.new(1, -20, 1, 0), BackgroundTransparency = 1, Text = "", PlaceholderText = placeholder, PlaceholderColor3 = Theme.Muted, TextColor3 = Theme.Text, TextSize = 12, FontFace = Fonts.Regular, TextXAlignment = Enum.TextXAlignment.Left, ClearTextOnFocus = false, Parent = boxFrame })
	if buttonText then
		local button = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -4, 0.5, 0), Size = UDim2.fromOffset(48, 28), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Text = "", AutoButtonColor = false, ClipsDescendants = true, Parent = boxFrame })
		Round(button, 6)
		local buttonStroke = Stroke(button, Theme.StrokeHover, 1, 0.4)
		local buttonLabel = Label({ Size = UDim2.fromScale(1, 1), Text = buttonText, TextColor3 = Theme.Accent, TextSize = 11, FontFace = Fonts.Bold, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.None, Parent = button })
		local function resize()
			local width = math.max(buttonLabel.TextBounds.X / math.max(self.Window.RootScale.Scale, 0.05) + 24, 48)
			button.Size = UDim2.fromOffset(width, 28)
			box.Size = UDim2.new(1, -(width + 24), 1, 0)
		end
		buttonLabel:GetPropertyChangedSignal("TextBounds"):Connect(resize)
		resize()
		button.MouseEnter:Connect(function() Tween(buttonStroke, { Color = Theme.Accent, Transparency = 0 }, 0.15) end)
		button.MouseLeave:Connect(function() Tween(buttonStroke, { Color = Theme.StrokeHover, Transparency = 0.4 }, 0.2) end)
		button.MouseButton1Click:Connect(function() Ripple(button) Safe(callback, box.Text) end)
	end
	box.Focused:Connect(function() Tween(stroke, { Color = Theme.Accent }, 0.15) end)
	box.FocusLost:Connect(function(enter)
		Tween(stroke, { Color = Theme.Stroke }, 0.2)
		if enter and box.Text ~= "" then Safe(callback, box.Text) end
	end)
	return Register(self, {}, { Get = function() return box.Text end, Set = function(_, value) box.Text = tostring(value or "") end }, entry, row)
end

local function Trim(s)
	return (tostring(s or ""):match("^%s*(.-)%s*$"))
end

local function ManagerBox(self, o, name, icon)
	if self.Body then
		return self
	end
	local box = self:Groupbox({ Name = o.Name or name, Icon = o.Icon or icon, Side = o.Side })
	return box
end

function Container:ConfigManager(o)
	o = Opts(o, { Title = "Name" })
	local box = ManagerBox(self, o, "Configs", "folder")
	local win = self.Window
	local api = {}
	local dropdown, status, modeDropdown, nameInput

	local function notify(ok, title, text)
		win:Notify({ Title = title, Content = text, Type = ok and "Success" or "Error", Duration = 3 })
	end
	local function refreshStatus()
		status:Set(("loaded: %s   |   autoload: %s"):format(win.LoadedConfig or "none", win:GetAutoload() or "none"))
	end
	local function selected()
		local name = dropdown:Get()
		if not name then
			notify(false, "No config selected", "Pick one from the list first")
		end
		return name
	end

	nameInput = box:ActionInput(o.Placeholder or "config name", nil, function(text)
		api:Create(text)
	end)
	local names = win:ListConfigs()
	local start = win.LoadedConfig or win:GetAutoload()
	dropdown = box:Dropdown({ Stacked = true, Options = names, Default = table.find(names, start) and start or nil, EmptyText = "--", NoneText = "--" })
	box:ButtonRow({
		{ Name = "Create", Callback = function() api:Create(nameInput:Get()) end },
		{ Name = "Save", Callback = function() api:Save() end },
	})
	box:ButtonRow({
		{ Name = "Load", Callback = function() api:Load() end },
		{ Name = "Delete", Style = "Danger", Callback = function() api:Delete() end },
	})
	box:ButtonRow({
		{ Name = "Set autoload", Callback = function() api:SetAutoload() end },
		{ Name = "Clear autoload", Callback = function() api:ClearAutoload() end },
	})
	box:ButtonRow({
		{ Name = "Rename", Callback = function() api:Rename(nil, nameInput:Get()) end },
		{ Name = "Reset", Style = "Danger", Callback = function() api:Reset() end },
	})
	status = box:Label("loaded: none   |   autoload: none")
	modeDropdown = box:Dropdown({
		Name = "Autoload mode",
		Stacked = true,
		Options = { "All accounts", "This account" },
		Default = win:GetAutoloadMode() == "Account" and "This account" or "All accounts",
		AllowNone = false,
		Callback = function(v)
			api:SetAutoloadMode(v == "This account" and "Account" or "Global")
		end,
	})
	box:Button({ Name = "Refresh list", Callback = function() api:Refresh() end })

	function api:Refresh()
		local list = win:ListConfigs()
		local current = dropdown:Get()
		dropdown:Refresh(list, true, true)
		if current and not table.find(list, current) then
			dropdown:Set(win.LoadedConfig and table.find(list, win.LoadedConfig) and win.LoadedConfig or nil, true)
		end
		refreshStatus()
	end
	local function refreshTo(name)
		api:Refresh()
		dropdown:Set(name, true)
	end
	function api:Create(name)
		name = Trim(name)
		if name == "" then
			return notify(false, "Name the config", "Type a name before creating it")
		end
		if not ValidName(name) then
			return notify(false, "Invalid name", 'Names cannot contain \\ / : * ? " < > |')
		end
		local ok, err = win:SaveConfig(name)
		if ok then
			win.LoadedConfig = name
			nameInput:Set("")
			refreshTo(name)
		end
		notify(ok, ok and "Config created" or "Create failed", ok and name or tostring(err))
	end
	function api:Save(name)
		name = name or dropdown:Get()
		if not name then
			local typed = Trim(nameInput:Get())
			if typed == "" then
				return notify(false, "No config selected", "Pick one from the list or type a name")
			end
			return api:Create(typed)
		end
		local ok, err = win:SaveConfig(name)
		if ok then
			win.LoadedConfig = name
			refreshStatus()
		end
		notify(ok, ok and "Config saved" or "Save failed", ok and name or tostring(err))
	end
	function api:Load(name)
		name = name or selected()
		if not name then
			return
		end
		local ok, err = win:LoadConfig(name)
		refreshStatus()
		notify(ok, ok and "Config loaded" or "Load failed", ok and name or tostring(err))
	end
	function api:Delete(name)
		name = name or selected()
		if not name then
			return
		end
		win:Confirm({
			Title = "Delete config",
			Content = "Remove " .. name .. "? This cannot be undone.",
			Icon = "trash-2",
			ConfirmText = "Delete",
			Callback = function()
				local ok, err = win:DeleteConfig(name)
				if ok then
					for _, mode in ipairs({ "Account", "Global" }) do
						if win:GetAutoload(mode) == name then
							win:SetAutoload(nil, mode)
						end
					end
					dropdown:Set(nil, true)
				end
				api:Refresh()
				notify(ok, ok and "Config deleted" or "Delete failed", ok and name or tostring(err))
			end,
		})
	end
	function api:Rename(name, newName)
		name = name or selected()
		if not name then
			return
		end
		newName = Trim(newName)
		if newName == "" then
			return notify(false, "Name the config", "Type the new name in the name box")
		end
		if not ValidName(newName) then
			return notify(false, "Invalid name", 'Names cannot contain \\ / : * ? " < > |')
		end
		local ok, err = win:RenameConfig(name, newName)
		if ok then
			nameInput:Set("")
			refreshTo(newName)
		end
		notify(ok, ok and "Config renamed" or "Rename failed", ok and (name .. " -> " .. newName) or tostring(err))
	end
	function api:Reset()
		win:Confirm({
			Title = "Reset settings",
			Content = "Delete every saved config and the autoload for this game? This cannot be undone.",
			Icon = "rotate-ccw",
			ConfirmText = "Reset",
			Callback = function()
				local ok = win:ResetConfig()
				dropdown:Set(nil, true)
				api:Refresh()
				modeDropdown:Set("All accounts", true)
				notify(ok, ok and "Settings reset" or "Reset incomplete", ok and "All configs removed" or "Some files could not be deleted")
			end,
		})
	end
	function api:SetAutoload(name)
		name = name or selected()
		if not name then
			return
		end
		local ok, err = win:SetAutoload(name)
		refreshStatus()
		notify(ok, ok and "Autoload set" or "Autoload failed", ok and name or tostring(err))
	end
	function api:ClearAutoload()
		local current = win:GetAutoload()
		if not current then
			return notify(false, "No autoload", "Nothing is set to autoload")
		end
		local ok, err = win:SetAutoload(nil)
		refreshStatus()
		notify(ok, ok and "Autoload cleared" or "Clear failed", ok and current or tostring(err))
	end
	function api:SetAutoloadMode(mode)
		local ok, err = win:SetAutoloadMode(mode)
		local text = mode == "Account" and "This account" or "All accounts"
		if modeDropdown:Get() ~= text then
			modeDropdown:Set(text, true)
		end
		refreshStatus()
		notify(ok, ok and "Autoload mode" or "Mode change failed", ok and text or tostring(err))
	end
	function api:Export()
		local code, err = win:ExportConfig()
		if not code then
			notify(false, "Export failed", tostring(err))
			return nil
		end
		win:CopyToClipboard(code, "Config code")
		return code
	end
	function api:Import(code)
		code = Trim(code)
		if code == "" then
			return notify(false, "Nothing to import", "Paste a config code first")
		end
		local data = win:DecodeConfig(code)
		if not data then
			return notify(false, "Import failed", "Invalid config code")
		end
		local name = Trim(nameInput:Get())
		if name == "" then
			name = nil
			if ValidName(data.Name) then
				name = data.Name
				local n = 2
				while win:ConfigExists(name) do
					name = ("%s (%d)"):format(data.Name, n)
					n += 1
				end
			end
		elseif not ValidName(name) then
			return notify(false, "Invalid name", 'Names cannot contain \\ / : * ? " < > |')
		end
		local ok, err = win:ImportConfig(code, name)
		if ok then
			if name then
				nameInput:Set("")
				refreshTo(name)
			end
		end
		notify(ok, ok and "Config imported" or "Import failed", ok and (name or "Applied to current settings") or tostring(err))
	end
	win:OnConfigChanged(function()
		api:Refresh()
	end)
	refreshStatus()
	return api
end

local PresetOrder = { "Charcoal", "Midnight", "Nebula", "Synthwave", "Sakura", "Velvet", "Rose", "Crimson", "Sunset", "Amber", "Gold", "Cyber", "Toxic", "Matcha", "Emerald", "Aurora", "Ocean", "Frost", "Abyss", "Mono", "Halloween", "Haunted", "Christmas", "Valentine", "Lunar", "Tropical", "Dracula", "Coffee" }
local function PresetList()
	local list, seen = {}, {}
	for _, n in ipairs(PresetOrder) do
		if Lib.ThemePresets[n] then
			table.insert(list, n)
			seen[n] = true
		end
	end
	local rest = {}
	for n in pairs(Lib.ThemePresets) do
		if not seen[n] then
			table.insert(rest, n)
		end
	end
	table.sort(rest)
	for _, n in ipairs(rest) do
		table.insert(list, n)
	end
	return list
end

function Container:ThemeManager(o)
	o = Opts(o, { Title = "Name" })
	local box = ManagerBox(self, o, "Themes", "palette")
	local win = self.Window
	local api = {}
	local themeDropdown, statusLabel, defaultRow, presetDropdown, nameInput

	local function notify(ok, title, text)
		win:Notify({ Title = title, Content = text, Type = ok and "Success" or "Error", Duration = 3 })
	end
	local function refreshDefault()
		local default = win:GetDefaultTheme()
		statusLabel:Set("Default theme: " .. (default or "none"))
		local current = themeDropdown:Get() or presetDropdown:Get()
		defaultRow:SetText(2, (current and current == default) and "Clear Default" or "Set Default")
	end
	local function selected()
		local name = themeDropdown:Get()
		if not name then
			notify(false, "No theme selected", "Pick one from the list first")
		end
		return name
	end

	presetDropdown = box:Dropdown({
		Name = "Preset",
		Options = PresetList(),
		Default = Lib.ThemePresets[Lib.ThemeName or ""] and Lib.ThemeName or nil,
		NoneText = "custom",
		AllowNone = false,
		Callback = function(v)
			if v then
				Lib:SetTheme(v)
				themeDropdown:Set(nil, true)
				refreshDefault()
			end
		end,
	})
	nameInput = box:ActionInput(o.Placeholder or "theme name", "Create", function(text)
		api:Create(text)
	end)
	themeDropdown = box:Dropdown({
		Name = "Theme",
		Options = win:ListThemes(),
		EmptyText = "no themes",
		NoneText = "select",
		Callback = function()
			refreshDefault()
		end,
	})
	box:ButtonRow({
		{ Name = "Save", Callback = function() api:Save() end },
		{ Name = "Load", Callback = function() api:Load() end },
	})
	defaultRow = box:ButtonRow({
		{ Name = "Delete", Callback = function() api:Delete() end },
		{ Name = "Set Default", Callback = function() api:ToggleDefault() end },
	})
	statusLabel = box:Label("Default theme: none")

	function api:Refresh()
		themeDropdown:Refresh(win:ListThemes(), true, true)
		refreshDefault()
	end
	function api:Create(name)
		name = Trim(name)
		if name == "" then
			return notify(false, "Name the theme", "Type a name before creating it")
		end
		if not ValidName(name) then
			return notify(false, "Invalid name", 'Names cannot contain \\ / : * ? " < > |')
		end
		if Lib.ThemePresets[name] then
			return notify(false, "Name taken", name .. " is a built-in preset")
		end
		local ok, err = win:SaveTheme(name)
		api:Refresh()
		if ok then
			themeDropdown:Set(name, true)
			nameInput:Set("")
			refreshDefault()
		end
		notify(ok, ok and "Theme created" or "Create failed", ok and name or tostring(err))
	end
	function api:Save(name)
		name = name or selected()
		if not name then
			return
		end
		local ok, err = win:SaveTheme(name)
		notify(ok, ok and "Theme saved" or "Save failed", ok and name or tostring(err))
	end
	function api:Load(name)
		name = name or selected()
		if not name then
			return
		end
		local ok, err = win:LoadTheme(name)
		if ok then
			presetDropdown:Set(nil, true)
		end
		notify(ok, ok and "Theme loaded" or "Load failed", ok and name or tostring(err))
	end
	function api:Delete(name)
		name = name or selected()
		if not name then
			return
		end
		win:Confirm({
			Title = "Delete theme",
			Content = "Remove " .. name .. "? This cannot be undone.",
			Icon = "trash-2",
			ConfirmText = "Delete",
			Callback = function()
				local ok, err = win:DeleteTheme(name)
				api:Refresh()
				notify(ok, ok and "Theme deleted" or "Delete failed", ok and name or tostring(err))
			end,
		})
	end
	function api:ToggleDefault(name)
		name = name or themeDropdown:Get() or presetDropdown:Get()
		if not name then
			return notify(false, "Nothing selected", "Pick a theme or a preset first")
		end
		local was = win:GetDefaultTheme() == name
		local ok, err = win:SetDefaultTheme(not was and name or nil)
		refreshDefault()
		notify(ok, was and "Default cleared" or "Default theme set", ok and name or tostring(err))
	end

	if o.Customize ~= false then
		box:Divider()
		for _, entry in ipairs(o.Colors or { { "Accent", "Accent" }, { "Background", "Background" }, { "Surface2", "Surface" }, { "Text", "Text" }, { "Muted", "Muted text" } }) do
			local key, label = entry[1], entry[2] or entry[1]
			local picker
			local pending, queued = nil, false
			picker = box:ColorPicker({
				Name = label,
				Default = Theme[key],
				Callback = function(color)
					pending = color
					if queued then
						return
					end
					queued = true
					task.delay(0.08, function()
						queued = false
						Lib:SetTheme({ [key] = pending })
						presetDropdown:Set(nil, true)
					end)
				end,
			})
			table.insert(Lib._themeListeners, function()
				if picker.Value ~= Theme[key] then
					picker:Set(Theme[key], true)
				end
			end)
		end
	end
	refreshDefault()
	return api
end

---------------------------------------------------------------- groupbox / tab
local Tab = setmetatable({}, { __index = Container })
Tab.__index = Tab

local Groupbox = setmetatable({}, { __index = Container })
Groupbox.__index = Groupbox

function Container:Reset()
	for _, entry in ipairs(self.Window.Controls) do
		if entry.Frame.Parent and entry.Frame:IsDescendantOf(self.Body) and entry.Handle and entry.Handle.Reset then
			entry.Handle:Reset()
		end
	end
end

function Tab:_fullColumn()
	if not self._full then
		self._full = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = 2, Parent = self._stack })
		List(self._full, 10)
	end
	return self._full
end

function Groupbox:_enablePopOut(header, titleLabel, enabled)
	if enabled == false then return end
	local group, win, box = self, self.Window, self.Frame
	local panel, placeholder, dockStroke, shadow, motionScale, settle
	local startMouse, startPosition, dragged, suppressClick
	local pop = New("TextButton", { Name = "DockToggle", AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -34, 0.5, 0), Size = UDim2.fromOffset(24, 24), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 1, BorderSizePixel = 0, Text = "", AutoButtonColor = false, ZIndex = 3, Parent = header })
	Round(pop, 6)
	local mark = NewIcon(pop, "picture-in-picture-2", 13, Theme.Muted, UDim2.new(0.5, -6.5, 0.5, -6.5))
	titleLabel.Size -= UDim2.fromOffset(26, 0)
	local function scale() return math.max(win.RootScale.Scale, 0.05) end
	local function point(position) return (position - win.Gui.AbsolutePosition) / scale() end
	local function clamp(position, size)
		local screen = win.Gui.AbsoluteSize / scale()
		return Vector2.new(math.clamp(position.X, size.X / 2 + 8, math.max(screen.X - size.X / 2 - 8, size.X / 2 + 8)), math.clamp(position.Y, 8, math.max(screen.Y - math.min(size.Y, 120) - 8, 8)))
	end
	local function overDock()
		if not placeholder or not placeholder.Parent or not win.Open or (group.Tab and not group.Tab.Page.Visible) then return false end
		local center = header.AbsolutePosition + header.AbsoluteSize / 2
		local origin, size = placeholder.AbsolutePosition, placeholder.AbsoluteSize
		local page = group.Tab and group.Tab.Page
		if page and (center.Y < page.AbsolutePosition.Y or center.Y > page.AbsolutePosition.Y + page.AbsoluteSize.Y) then return false end
		local margin = 12 * scale()
		return center.X >= origin.X - margin and center.X <= origin.X + size.X + margin and center.Y >= origin.Y - margin and center.Y <= origin.Y + size.Y + margin
	end
	local function closePopup() if win._closePopup then win._closePopup() end end
	function group:PopOut()
		if self._popped or self._destroyed or not box.Parent then return end
		if settle then settle() end
		closePopup()
		if not win._popLayer then
			win._popLayer = New("Frame", { Name = "PopOuts", Size = UDim2.fromScale(1 / scale(), 1 / scale()), BackgroundTransparency = 1, ZIndex = 20, Parent = win.Gui })
			win._popScale = New("UIScale", { Scale = scale(), Parent = win._popLayer })
			win._popPanels = {}
		end
		self._popped = true
		local origin, size = point(box.AbsolutePosition), box.AbsoluteSize / scale()
		placeholder = New("TextButton", { Name = "DockPlaceholder", Size = UDim2.new(1, 0, 0, size.Y), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 0.6, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = box.LayoutOrder, Parent = box.Parent })
		Round(placeholder, 10)
		dockStroke = Stroke(placeholder, Theme.Stroke, 1, 0.3)
		Label({ Size = UDim2.new(1, -24, 0, 40), Position = UDim2.fromOffset(12, 0), Text = self.Name .. " - popped out, click to dock", TextSize = 12, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, Parent = placeholder })
		placeholder.MouseButton1Click:Connect(function() self:Dock() end)
		Tween(placeholder, { Size = UDim2.new(1, 0, 0, 40) }, 0.42, Enum.EasingStyle.Quint)
		panel = New("Frame", { Name = "PopOut", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromOffset(origin.X + size.X / 2, origin.Y), Size = UDim2.fromOffset(size.X, size.Y), BackgroundTransparency = 1, Parent = win._popLayer })
		motionScale = New("UIScale", { Scale = 0.97, Parent = panel })
		shadow = New("ImageLabel", { Position = UDim2.fromOffset(-24, -18), Size = UDim2.new(1, 48, 1, 44), BackgroundTransparency = 1, Image = ASSETS.Shadow, ImageColor3 = Color3.new(0, 0, 0), ImageTransparency = 1, ScaleType = Enum.ScaleType.Slice, SliceCenter = Rect.new(49, 49, 450, 450), ZIndex = 0, Parent = panel })
		box.Parent = panel
		win._popPanels[self] = true
		Icon(mark, "minimize-2")
		local target = clamp(self._popSpot or Vector2.new(origin.X + size.X / 2 + 22, origin.Y - 14), size)
		Tween(panel, { Position = UDim2.fromOffset(target.X, target.Y) }, 0.5, Enum.EasingStyle.Quint)
		Tween(motionScale, { Scale = 1 }, 0.55, Enum.EasingStyle.Back)
		Tween(shadow, { ImageTransparency = 0.35 }, 0.4)
	end
	function group:Dock(instant)
		if not self._popped then if instant and settle then settle() end return end
		self._popped = false
		startMouse, dragged = nil, false
		closePopup()
		win._popPanels[self] = nil
		self._popSpot = Vector2.new(panel.Position.X.Offset, panel.Position.Y.Offset)
		Icon(mark, "picture-in-picture-2")
		local floating, slot = panel, placeholder
		local function finish()
			if settle ~= finish then return end
			settle = nil
			if box.Parent == floating and slot.Parent and not self._destroyed then box.Parent = slot.Parent box.LayoutOrder = slot.LayoutOrder end
			slot:Destroy()
			floating:Destroy()
			panel, placeholder = nil, nil
		end
		settle = finish
		if instant or not win.Open or not slot.Parent or not slot.Visible then finish() return end
		local size = Vector2.new(slot.AbsoluteSize.X / scale(), box.AbsoluteSize.Y / scale())
		local origin = point(slot.AbsolutePosition)
		Tween(slot, { Size = UDim2.new(1, 0, 0, size.Y) }, 0.36, Enum.EasingStyle.Quint)
		Tween(floating, { Position = UDim2.fromOffset(origin.X + size.X / 2, origin.Y), Size = UDim2.fromOffset(size.X, size.Y) }, 0.36, Enum.EasingStyle.Quint)
		Tween(motionScale, { Scale = 1 }, 0.2)
		Tween(shadow, { ImageTransparency = 1 }, 0.3)
		task.delay(0.37, finish)
	end
	function group:IsPoppedOut() return self._popped == true end
	function group:_popStep()
		if not panel or not panel.Parent then return end
		panel.Size = UDim2.fromOffset(panel.Size.X.Offset, box.AbsoluteSize.Y / scale())
		panel.Visible, placeholder.Visible = box.Visible, box.Visible
		if startMouse then
			local delta = MousePos() - startMouse
			if not dragged and delta.Magnitude >= 5 then
				dragged, suppressClick = true, true closePopup()
				Tween(motionScale, { Scale = 1.025 }, 0.18)
				Tween(shadow, { ImageTransparency = 0.15 }, 0.18)
			end
			if dragged then
				local target = clamp(startPosition + delta / scale(), Vector2.new(panel.Size.X.Offset, panel.Size.Y.Offset))
				panel.Position = UDim2.fromOffset(target.X, target.Y)
				dockStroke.Color = overDock() and Theme.Accent or Theme.Stroke
			end
		end
	end
	function group:_popRelease()
		startMouse = nil
		if dragged and panel then
			if overDock() then self:Dock() return end
			dockStroke.Color = Theme.Stroke
			Tween(motionScale, { Scale = 1 }, 0.4, Enum.EasingStyle.Back)
			Tween(shadow, { ImageTransparency = 0.35 }, 0.3)
			self._popSpot = Vector2.new(panel.Position.X.Offset, panel.Position.Y.Offset)
		end
	end
	header.InputBegan:Connect(function(input)
		if self._popped and IsPress(input) then startMouse, startPosition, dragged, suppressClick = MousePos(), Vector2.new(panel.Position.X.Offset, panel.Position.Y.Offset), false, false end
	end)
	header.MouseButton1Click:Connect(function()
		if suppressClick then suppressClick = false return end
		self:SetCollapsed(not self:IsCollapsed())
	end)
	pop.MouseEnter:Connect(function() Tween(pop, { BackgroundTransparency = 0 }, 0.15) end)
	pop.MouseLeave:Connect(function() Tween(pop, { BackgroundTransparency = 1 }, 0.25) end)
	pop.MouseButton1Click:Connect(function() if self._popped then self:Dock() else self:PopOut() end end)
end

function Tab:Groupbox(o, icon)
	o = Opts(o, { Title = "Name" })
	icon = o.Icon or icon
	local side = o.Side
	local full = side == "Full"
	if not full and side ~= "Left" and side ~= "Right" and side ~= 1 and side ~= 2 then
		side = self.Counts[1] <= self.Counts[2] and "Left" or "Right"
	end
	local index = (side == "Left" or side == 1 or full) and 1 or 2
	self.Counts[index] += 1

	local box = New("Frame", {
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = Theme.Surface2,
		BorderSizePixel = 0,
		LayoutOrder = self.Counts[index],
		Parent = full and self:_fullColumn() or (index == 1 and self.Left or self.Right),
	})
	Round(box, 10)
	Stroke(box, Theme.Stroke)
	List(box, 0)

	local header = New("TextButton", {
		Size = UDim2.new(1, 0, 0, 40),
		BackgroundColor3 = Theme.Surface3,
		BorderSizePixel = 0,
		Text = "",
		AutoButtonColor = false,
		LayoutOrder = 1,
		Parent = box,
	})
	Round(header, 10)
	New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 10), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = header })
	local x = 14
	if icon then
		local img = NewIcon(header, icon, 14, Theme.Accent, UDim2.new(0, 14, 0.5, -7))
		img.ZIndex = 2
		x = 37
	end
	local titleLabel = Label({ Position = UDim2.fromOffset(x, 0), Size = UDim2.new(1, -(x + 40), 1, 0), Text = o.Name or "Groupbox", TextSize = 13, FontFace = Fonts.Bold, ZIndex = 2, Parent = header })
	local chevron = NewIcon(header, "chevron-down", 14, Theme.Muted, UDim2.new(1, -28, 0.5, -7))
	chevron.ZIndex = 2
	New("Frame", { Size = UDim2.new(1, 0, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, LayoutOrder = 2, Parent = box })

	local holder = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, ClipsDescendants = true, LayoutOrder = 3, Parent = box })
	local body = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = holder })
	Pad(body, 0, 6, 0, 8)
	List(body, 2)

	local group = setmetatable({ Body = body, Items = {}, Window = self.Window, Frame = box, Name = o.Name or "Groupbox", Tab = self._entry }, Groupbox)
	if self._entry then
		table.insert(self.Window.Groups, { Name = group.Name, Tab = self._entry, Obj = group, Frame = box })
	end
	local collapsed = false
	function group:SetCollapsed(v)
		collapsed = v
		holder.Visible = not v
		Tween(chevron, { Rotation = v and -90 or 0 }, 0.2)
	end
	function group:IsCollapsed()
		return collapsed
	end
	function group:SetTitle(t)
		titleLabel.Text = t
	end
	function group:SetVisible(v)
		box.Visible = v
	end
	function group:Destroy()
		if self.Dock then self:Dock(true) end
		self._destroyed = true
		box:Destroy()
	end
	group:_enablePopOut(header, titleLabel, o.PopOut)
	if o.PopOut == false then
		header.MouseButton1Click:Connect(function() group:SetCollapsed(not collapsed) end)
	end
	if o.Collapsed then
		group:SetCollapsed(true)
	end
	return group
end

function Tab:AddLeftGroupbox(o, icon)
	o = Opts(o, { Title = "Name" })
	o.Side = "Left"
	return self:Groupbox(o, icon)
end

function Tab:AddRightGroupbox(o, icon)
	o = Opts(o, { Title = "Name" })
	o.Side = "Right"
	return self:Groupbox(o, icon)
end

---------------------------------------------------------------- window
local Window = {}
Window.__index = Window

local ISLAND = { Top = 8, Width = 168, Height = 32, Wide = 340, Radius = 34 }

local function ExecutorStatus(supported)
	local name = "Unknown"
	pcall(function()
		name = (identifyexecutor and identifyexecutor()) or (getexecutorname and getexecutorname()) or (game:GetService("RunService"):IsStudio() and "Studio") or "Unknown"
	end)
	name = tostring(name)
	if type(supported) == "table" then
		for _, entry in ipairs(supported) do
			if string.find(string.lower(name), string.lower(tostring(entry)), 1, true) then
				return name, true, "Your executor is supported and fully compatible."
			end
		end
		return name, false, "Not on the supported list. Some features may not work."
	end
	local missing = {}
	for _, check in ipairs({
		{ "writefile", writefile },
		{ "readfile", readfile },
		{ "getcustomasset", getcustomasset },
		{ "setclipboard", setclipboard or toclipboard },
		{ "request", request or http_request or (syn and syn.request) },
	}) do
		if type(check[2]) ~= "function" then
			table.insert(missing, check[1])
		end
	end
	if #missing == 0 then
		return name, true, "Your executor is supported and fully compatible."
	end
	return name, false, "Missing " .. table.concat(missing, ", ") .. ". Some features may not work."
end

local FeatureKinds = {
	AutomationStatus = "activity",	Toggle = "toggle-right",
	Slider = "sliders-horizontal",
	Dropdown = "list",
	Input = "text-cursor-input",
	Keybind = "keyboard",
	ColorPicker = "palette",
	Stepper = "plus",
	Button = "mouse-pointer-click",
}

function Window:GetKeybindConflicts(key, ignore)
	local names = {}
	if not key or key == Enum.KeyCode.Unknown then return names end
	if key == self:_toggleKey() then table.insert(names, "Hide window") end
	for _, entry in ipairs(self.Controls) do
		local handle = entry.Handle
		if handle and handle ~= ignore and entry.Frame.Parent then
			local bound = handle.Keybind
			if entry.Kind == "Keybind" then bound = handle:Get() end
			if bound == key then table.insert(names, entry.Title or "Control") end
		end
	end
	return names
end

function Window:_collectFlags()
	local data = {}
	for flag, handle in pairs(Lib.Flags) do
		if type(handle.Get) == "function" then
			local ok, value = pcall(handle.Get, handle)
			if ok and value ~= nil then
				data[flag] = Encode(value)
			end
		end
	end
	return data
end

function Window:_applyFlags(flags)
	for flag, value in pairs(flags) do
		local handle = Lib.Flags[flag]
		if handle and type(handle.Set) == "function" then
			pcall(handle.Set, handle, Decode(value))
		else
			self._pending[flag] = value
		end
	end
end

function Window:_flagCreated(flag, handle)
	local value = self._pending[flag]
	if value == nil then
		return
	end
	self._pending[flag] = nil
	task.defer(function()
		if Lib.Flags[flag] == handle then
			pcall(handle.Set, handle, Decode(value))
		end
	end)
end

function Window:_configChanged()
	for _, fn in ipairs(self._configListeners) do
		Safe(fn)
	end
end

function Window:OnConfigChanged(fn)
	table.insert(self._configListeners, fn)
end

function Window:ListConfigs()
	return ListNames("Saved")
end

function Window:ConfigExists(name)
	return table.find(ListNames("Saved"), name) ~= nil
end

function Window:SaveConfig(name)
	if not ValidName(name) then
		return false, "invalid name"
	end
	local ok, err = WriteJson("Saved", name, { Version = 1, Name = name, Game = GameName(), Flags = self:_collectFlags() })
	if ok then
		self:_configChanged()
	end
	return ok, err
end

function Window:LoadConfig(name)
	if not ValidName(name) then
		return false, "invalid name"
	end
	local data = ReadJson(Dir("Saved") .. "/" .. name .. ".json")
	if not data or type(data.Flags) ~= "table" then
		return false, "config not found"
	end
	self:_applyFlags(data.Flags)
	self.LoadedConfig = name
	self:_configChanged()
	return true
end

function Window:DeleteConfig(name)
	if not (type(delfile) == "function" and ValidName(name)) then
		return false, "cannot delete"
	end
	local ok, err = pcall(delfile, Dir("Saved") .. "/" .. name .. ".json")
	if ok then
		if self.LoadedConfig == name then
			self.LoadedConfig = nil
		end
		self:_configChanged()
	end
	return ok, err
end

function Window:RenameConfig(name, newName)
	if not (ValidName(name) and ValidName(newName)) then
		return false, "invalid name"
	end
	if self:ConfigExists(newName) then
		return false, "name already used"
	end
	local data = ReadJson(Dir("Saved") .. "/" .. name .. ".json")
	if not data then
		return false, "config not found"
	end
	data.Name = newName
	local ok, err = WriteJson("Saved", newName, data)
	if not ok then
		return false, err
	end
	pcall(delfile, Dir("Saved") .. "/" .. name .. ".json")
	for _, mode in ipairs({ "Account", "Global" }) do
		if self:GetAutoload(mode) == name then
			self:SetAutoload(newName, mode)
		end
	end
	if self.LoadedConfig == name then
		self.LoadedConfig = newName
	end
	self:_configChanged()
	return true
end

function Window:ResetConfig()
	local allOk = true
	if type(delfile) == "function" and type(listfiles) == "function" and isfolder(Dir("Saved")) then
		for _, path in ipairs(listfiles(Dir("Saved"))) do
			if not pcall(delfile, path) then
				allOk = false
			end
		end
	end
	self.LoadedConfig = nil
	self:_configChanged()
	return allOk
end

function Window:ExportConfig()
	if next(Lib.Flags) == nil then
		return nil, "nothing to export"
	end
	return HttpService:JSONEncode({ Version = 1, Name = self.LoadedConfig or "config", Game = GameName(), Flags = self:_collectFlags() })
end

function Window:DecodeConfig(code)
	local ok, data = pcall(function()
		return HttpService:JSONDecode(code)
	end)
	if ok and type(data) == "table" and type(data.Flags) == "table" then
		return data
	end
	return nil
end

function Window:ImportConfig(code, name)
	local data = self:DecodeConfig(code)
	if not data then
		return false, "invalid code"
	end
	if name then
		local ok, err = WriteJson("Saved", name, { Version = 1, Name = name, Game = data.Game or GameName(), Flags = data.Flags })
		if not ok then
			return false, err
		end
	end
	self:_applyFlags(data.Flags)
	if name then
		self.LoadedConfig = name
	end
	self:_configChanged()
	return true
end

-- autoload: Saved/<Game>/_autoload.json
local function AutoloadData()
	return ReadJson(Dir("Saved") .. "/_autoload.json") or {}
end

function Window:GetAutoloadMode()
	return AutoloadData().Mode == "Account" and "Account" or "Global"
end

function Window:GetAutoload(mode)
	local data = AutoloadData()
	mode = mode or (data.Mode == "Account" and "Account" or "Global")
	if mode == "Account" then
		return data.Accounts and data.Accounts[tostring(LocalPlayer.UserId)] or nil
	end
	return data.Global
end

function Window:SetAutoload(name, mode)
	local data = AutoloadData()
	mode = mode or (data.Mode == "Account" and "Account" or "Global")
	if mode == "Account" then
		data.Accounts = data.Accounts or {}
		data.Accounts[tostring(LocalPlayer.UserId)] = name
	else
		data.Global = name
	end
	return WriteJson("Saved", "_autoload", data)
end

function Window:SetAutoloadMode(mode)
	local data = AutoloadData()
	data.Mode = mode == "Account" and "Account" or "Global"
	return WriteJson("Saved", "_autoload", data)
end

function Window:LoadAutoload()
	local name = self:GetAutoload()
	if name then
		return self:LoadConfig(name)
	end
	return false
end

-- themes: Theme/<Game>/<name>.json
function Window:ListThemes()
	return ListNames("Theme")
end

function Window:SaveTheme(name)
	if not ValidName(name) then
		return false, "invalid name"
	end
	local colors = {}
	for _, key in ipairs(ThemeKeys) do
		colors[key] = Encode(Theme[key])
	end
	return WriteJson("Theme", name, { Version = 1, Name = name, Game = GameName(), Colors = colors })
end

function Window:LoadTheme(name)
	if not ValidName(name) then
		return false, "invalid name"
	end
	local data = ReadJson(Dir("Theme") .. "/" .. name .. ".json")
	if not data or type(data.Colors) ~= "table" then
		return false, "theme not found"
	end
	local colors = {}
	for key, value in pairs(data.Colors) do
		colors[key] = Decode(value)
	end
	return Lib:SetTheme(colors)
end

function Window:DeleteTheme(name)
	if not (type(delfile) == "function" and ValidName(name)) then
		return false, "cannot delete"
	end
	local ok, err = pcall(delfile, Dir("Theme") .. "/" .. name .. ".json")
	if ok and self:GetDefaultTheme() == name then
		self:SetDefaultTheme(nil)
	end
	return ok, err
end

function Window:GetDefaultTheme()
	local data = ReadJson(Dir("Theme") .. "/_default.json")
	return data and data.Name or nil
end

function Window:SetDefaultTheme(name)
	return WriteJson("Theme", "_default", { Name = name })
end

function Window:_applyDefaultTheme()
	local name = self:GetDefaultTheme()
	if not name then
		return
	end
	if Lib.ThemePresets[name] then
		Lib:SetTheme(name)
	else
		self:LoadTheme(name)
	end
end

function Window:CopyToClipboard(text, label)
	if setclipboard then
		setclipboard(text)
		self:Notify({ Title = label or "Copied", Content = "Copied to clipboard", Type = "Success", Duration = 2 })
		return true
	end
	self:Notify({ Title = "Copy failed", Content = "Executor has no clipboard", Type = "Error", Duration = 3 })
	return false
end

-- confirm dialog (used by delete / reset)
function Window:Confirm(o)
	o = Opts(o, { Text = "Content", Message = "Content" })
	if self._dialog then
		self._dialog.Close()
	end
	local backdrop = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 40, Parent = self.Root })
	local card = New("CanvasGroup", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, 0.5, 10),
		Size = UDim2.fromOffset(320, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = Theme.Background,
		BorderSizePixel = 0,
		GroupTransparency = 1,
		Active = true,
		Parent = backdrop,
	})
	Round(card, 12)
	local stroke = Stroke(card, Theme.Stroke, 1)
	local scale = New("UIScale", { Scale = 0.94, Parent = card })
	local content = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = card })
	Pad(content, 18, 18, 18, 16)
	List(content, 12)
	local head = New("Frame", { Size = UDim2.new(1, 0, 0, 36), BackgroundTransparency = 1, LayoutOrder = 1, Parent = content })
	local bubble = New("Frame", { Size = UDim2.fromOffset(36, 36), BackgroundColor3 = Theme.Accent, BackgroundTransparency = 0.85, BorderSizePixel = 0, Parent = head })
	Round(bubble, 18)
	NewIcon(bubble, o.Icon or "triangle-alert", 17, Theme.Accent, UDim2.new(0.5, -8.5, 0.5, -8.5))
	Label({ Position = UDim2.fromOffset(48, 0), Size = UDim2.new(1, -48, 1, 0), Text = o.Title or "Confirm", TextSize = 15, FontFace = Fonts.Bold, Parent = head })
	Label({
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		Text = o.Content or "",
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextColor3 = Theme.Muted,
		TextWrapped = true,
		TextTruncate = Enum.TextTruncate.None,
		TextYAlignment = Enum.TextYAlignment.Top,
		LayoutOrder = 2,
		Parent = content,
	})
	local buttons = New("Frame", { Size = UDim2.new(1, 0, 0, 32), BackgroundTransparency = 1, LayoutOrder = 3, Parent = content })

	local dialog = {}
	local closed = false
	function dialog.Close()
		if closed then
			return
		end
		closed = true
		if self._dialog == dialog then
			self._dialog = nil
		end
		Tween(backdrop, { BackgroundTransparency = 1 }, 0.18)
		Tween(card, { Position = UDim2.new(0.5, 0, 0.5, 8), GroupTransparency = 1 }, 0.18)
		Tween(scale, { Scale = 0.96 }, 0.18)
		Tween(stroke, { Transparency = 1 }, 0.12)
		task.delay(0.2, function()
			backdrop:Destroy()
		end)
	end
	local function button(index, text, primary, fn)
		local face = New("TextButton", {
			Position = UDim2.new((index - 1) / 2, (index - 1) * 3, 0, 0),
			Size = UDim2.new(0.5, -3, 1, 0),
			BackgroundColor3 = primary and Theme.Accent or Theme.Surface3,
			BackgroundTransparency = primary and 0.12 or 0.45,
			BorderSizePixel = 0,
			Text = "",
			AutoButtonColor = false,
			ClipsDescendants = true,
			Parent = buttons,
		})
		Round(face, 6)
		Stroke(face, primary and Theme.Accent or Theme.Stroke, 1, primary and 0.4 or 0)
		Label({ Size = UDim2.fromScale(1, 1), Text = text, TextSize = 13, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = primary and Theme.AccentDark or Theme.Text, Parent = face })
		face.MouseEnter:Connect(function()
			Tween(face, { BackgroundTransparency = primary and 0 or 0.2 }, 0.12)
		end)
		face.MouseLeave:Connect(function()
			Tween(face, { BackgroundTransparency = primary and 0.12 or 0.45 }, 0.25)
		end)
		face.MouseButton1Click:Connect(fn)
	end
	button(1, o.CancelText or "Cancel", false, dialog.Close)
	button(2, o.ConfirmText or "Confirm", true, function()
		dialog.Close()
		Safe(o.Callback)
	end)
	backdrop.MouseButton1Click:Connect(dialog.Close)
	self._dialog = dialog
	Tween(backdrop, { BackgroundTransparency = 0.45 }, 0.25)
	Tween(card, { Position = UDim2.fromScale(0.5, 0.5), GroupTransparency = 0 }, 0.3)
	Tween(scale, { Scale = 1 }, 0.4, Enum.EasingStyle.Back)
	return dialog
end
Window.Dialog = Window.Confirm

function Window:_listen(signal, fn)
	table.insert(self.Connections, signal:Connect(fn))
end

function Window:_trackName(label, kind)
	table.insert(self.Names, { Label = label, Kind = kind })
	self:_renderIdentity(true)
end

-- avatars stay invisible until the thumbnail has loaded, then fade in
function Window:_trackAvatar(image, placeholder)
	local entry = { Image = image, Placeholder = placeholder, Loaded = image.IsLoaded }
	table.insert(self.Avatars, entry)
	image.ImageTransparency = 1
	self:_renderIdentity(true)
	task.spawn(function()
		pcall(function()
			game:GetService("ContentProvider"):PreloadAsync({ image })
		end)
		entry.Loaded = true
		self:_renderIdentity()
	end)
end

function Window:_renderIdentity(instant)
	for _, n in ipairs(self.Names) do
		if n.Kind == "User" then
			n.Label.Text = self.HideName and "@hidden" or ("@" .. LocalPlayer.Name)
		else
			n.Label.Text = self.HideName and "Hidden" or LocalPlayer.DisplayName
		end
	end
	for _, a in ipairs(self.Avatars) do
		local show = a.Loaded and not self.HideAvatar
		local time = instant and 0 or (show and 0.35 or 0.2)
		Tween(a.Image, { ImageTransparency = show and 0 or 1 }, time, Enum.EasingStyle.Quad)
		Tween(a.Placeholder, { ImageTransparency = self.HideAvatar and 0.2 or 1 }, time, Enum.EasingStyle.Quad)
	end
end

function Window:SetHideName(on)
	self.HideName = on == true
	self:_renderIdentity()
end

function Window:SetHideAvatar(on)
	self.HideAvatar = on == true
	self:_renderIdentity()
end

-- sidebar entry + page scaffold shared by Home and normal tabs
function Window:_addPage(name, icon, scrolling, builtIn, activeIcon)
	local button = New("TextButton", {
		Size = UDim2.new(1, 0, 0, 36),
		BackgroundColor3 = Theme.Surface3,
		BackgroundTransparency = 1,
		Text = "",
		AutoButtonColor = false,
		LayoutOrder = self:_nextSideOrder(builtIn),
		Parent = self.TabList,
	})
	Round(button, 8)
	local stroke = Stroke(button, Theme.Stroke, 1, 1)
	local img = NewIcon(button, icon or "circle", 16, Theme.Muted, UDim2.new(0, 14, 0.5, -8))
	local activeImg = NewIcon(button, activeIcon or ({ house = "house-heart", cloud = "cloud-check", layers = "layers-2", ["panels-top-left"] = "panel-top" })[icon] or "circle-check", 16, Theme.AccentDark, UDim2.new(0, 14, 0.5, -8))
	activeImg.Name, img.Name = "ActiveIcon", "InactiveIcon"
	activeImg.AnchorPoint, img.AnchorPoint = Vector2.new(0.5, 0.5), Vector2.new(0.5, 0.5)
	activeImg.Position, img.Position = UDim2.new(0, 22, 0.5, 0), UDim2.new(0, 22, 0.5, 0)
	activeImg.ImageTransparency, activeImg.Size, activeImg.Rotation = 1, UDim2.fromOffset(16, 16), 0
	local text = Label({
		Position = UDim2.fromOffset(40, 0),
		Size = UDim2.new(1, -48, 1, 0),
		Text = name,
		TextColor3 = Theme.Muted,
		Parent = button,
	})
	local badgeFrame = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -10, 0.5, 0), Size = UDim2.fromOffset(18, 18), BackgroundColor3 = Theme.Error, BorderSizePixel = 0, Visible = false, Parent = button })
	Round(badgeFrame, 100)
	local badgeLabel = Label({ AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, -1), Size = UDim2.fromScale(1, 1), TextSize = 10, TextColor3 = Color3.new(1, 1, 1), FontFace = Fonts.Bold, TextXAlignment = Enum.TextXAlignment.Center, TextYAlignment = Enum.TextYAlignment.Center, TextTruncate = Enum.TextTruncate.None, Parent = badgeFrame })
	local page = New("ScrollingFrame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 3,
		ScrollBarImageColor3 = Theme.Surface3,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		Visible = false,
		Parent = self.PageHolder,
	})
	Pad(page, 2, 2, 8, 12)
	local entry = { Name = name, Icon = icon, Button = button, Page = page, Img = img, ActiveImg = activeImg, Text = text, Stroke = stroke, Badge = { Frame = badgeFrame, Label = badgeLabel } }
	table.insert(self.Pages, entry)
	button.MouseButton1Click:Connect(function()
		self:SelectPage(entry)
	end)
	button.MouseEnter:Connect(function()
		if self.Current ~= entry then
			Tween(button, { BackgroundTransparency = 0.65 }, 0.15)
			Tween(text, { TextColor3 = Theme.Text }, 0.15)
		end
	end)
	button.MouseLeave:Connect(function()
		if self.Current ~= entry then
			Tween(button, { BackgroundTransparency = 1 }, 0.2)
			Tween(text, { TextColor3 = Theme.Muted }, 0.2)
		end
	end)

	return entry, page
end

function Window:SelectPage(entry)
	if self.Current == entry then
		return
	end
	for _, p in ipairs(self.Pages) do
		local on = p == entry
		p.Page.Visible = on
		Tween(p.Button, { BackgroundColor3 = on and Theme.Accent or Theme.Surface3, BackgroundTransparency = on and 0 or 1 }, 0.45, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
		Tween(p.Stroke, { Color = Theme.Accent, Transparency = 1 }, 0.2)
		Tween(p.Img, { ImageTransparency = on and 1 or 0, Size = UDim2.fromOffset(16, 16), Rotation = 0 }, 0.55, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
		Tween(p.ActiveImg, { ImageTransparency = on and 0 or 1, ImageColor3 = Theme.AccentDark, Size = UDim2.fromOffset(16, 16), Rotation = 0 }, 0.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
		Tween(p.Text, { TextColor3 = on and Theme.AccentDark or Theme.Muted }, 0.45, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
	end
	self.Current = entry
	self.PageIconGhost.Image = self.PageIcon.Image
	self.PageIconGhost.ImageRectOffset, self.PageIconGhost.ImageRectSize = self.PageIcon.ImageRectOffset, self.PageIcon.ImageRectSize
	self.PageIconGhost.ImageTransparency, self.PageIconGhost.Size = self.PageIcon.ImageTransparency, self.PageIcon.Size
	self.PageIconGhost.Rotation = 0
	Tween(self.PageIconGhost, { ImageTransparency = 1, Size = UDim2.fromOffset(18, 18), Rotation = 0 }, 0.45, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
	self.PageIcon.ImageTransparency, self.PageIcon.Size, self.PageIcon.Rotation = 1, UDim2.fromOffset(18, 18), 0
	self.PageIcon.Image = entry.ActiveImg.Image
	self.PageIcon.ImageRectOffset = entry.ActiveImg.ImageRectOffset
	self.PageIcon.ImageRectSize = entry.ActiveImg.ImageRectSize
	Tween(self.PageIcon, { ImageTransparency = 0, Size = UDim2.fromOffset(18, 18), Rotation = 0 }, 0.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
	self.PageTitle.Text = entry.Name
	entry.Page.CanvasPosition = Vector2.zero
end

function Window:SelectTab(tab)
	self:SelectPage(tab._entry or tab)
end

local SearchIcons = {
	Tab = "app-window",
	Groupbox = "layout-grid",
	Button = "mouse-pointer-click",
	ButtonRow = "mouse-pointer-click",
	Toggle = "toggle-right",
	Slider = "sliders-horizontal",
	Dropdown = "list",
	Input = "text-cursor-input",
	Keybind = "keyboard",
	ColorPicker = "palette",
	Stepper = "chevrons-up-down",
	Progress = "activity",
	Label = "type",
	Paragraph = "type",
}

-- every tab, groupbox and control whose name contains the query, best matches first
function Window:_searchResults(query)
	local out = {}
	local function add(name, data)
		if type(name) ~= "string" or name == "" then
			return
		end
		local at = string.find(string.lower(name), query, 1, true)
		if not at then
			return
		end
		data.Name, data.At = name, at
		data.Rank = at == 1 and 0 or (string.find(string.sub(name, at - 1, at - 1), "[%s%p]") and 1 or 2)
		data.Order = #out + 1
		table.insert(out, data)
	end
	for _, page in ipairs(self.Pages) do
		add(page.Name, { Kind = "Tab", Page = page })
	end
	for _, g in ipairs(self.Groups) do
		if g.Frame.Parent and g.Frame.Visible then
			add(g.Name, { Kind = "Groupbox", Page = g.Tab, Group = g })
		end
	end
	for _, c in ipairs(self.Controls) do
		if c.Tab and c.Title and c.Kind ~= "Section" and c.Kind ~= "Divider" and c.Frame:IsDescendantOf(self.Gui) and c.Frame:GetAttribute("UserVisible") ~= false then
			add(c.Title, { Kind = c.Kind, Page = c.Tab, GroupName = c.Group, Control = c })
		end
	end
	table.sort(out, function(a, b)
		if a.Rank ~= b.Rank then
			return a.Rank < b.Rank
		end
		return a.Order < b.Order
	end)
	return out
end

function Window:_revealResult(r)
	if r.Kind == "Tab" then
		self:SelectPage(r.Page)
		task.delay(0.1, function()
			if r.Page.Button.Parent then
				self:_flash(r.Page.Button, 8)
			end
		end)
	elseif r.Kind == "Groupbox" then
		self:_reveal({ Tab = r.Page, GroupObj = r.Group.Obj, Frame = r.Group.Frame }, 10)
	else
		self:_reveal(r.Control)
	end
end

function Window:_buildSearch(header)
	local ROW_H, MAX_ROWS = 34, 8
	local field = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -98, 0.5, 0), Size = UDim2.fromOffset(176, 34), BackgroundTransparency = 1, ZIndex = 5, Parent = header })
	local line = New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, -2), Size = UDim2.new(1, 0, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = field })
	local bar = New("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -1), Size = UDim2.new(0, 0, 0, 2), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, ZIndex = 2, Parent = field })
	Round(bar, 100)
	local icon = NewIcon(field, "search", 15, Theme.Muted, UDim2.new(0, 2, 0.5, -8))
	local box = New("TextBox", {
		Position = UDim2.fromOffset(26, 0),
		Size = UDim2.new(1, -28, 1, -2),
		BackgroundTransparency = 1,
		Text = "",
		PlaceholderText = "Search",
		PlaceholderColor3 = Theme.Muted,
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextTruncate = Enum.TextTruncate.AtEnd,
		ClearTextOnFocus = false,
		Parent = field,
	})
	self.Search = box
	field.MouseEnter:Connect(function()
		if not box:IsFocused() then
			Tween(line, { BackgroundColor3 = Theme.StrokeHover }, 0.15)
		end
	end)
	field.MouseLeave:Connect(function()
		Tween(line, { BackgroundColor3 = Theme.Stroke }, 0.25)
	end)

	-- results popup
	local pop = New("Frame", { AnchorPoint = Vector2.new(1, 0), Size = UDim2.fromOffset(300, 0), BackgroundTransparency = 1, Visible = false, ZIndex = 45, Parent = self.Gui })
	local shadow = New("ImageLabel", {
		Position = UDim2.fromOffset(-18, -12),
		Size = UDim2.new(1, 36, 1, 36),
		BackgroundTransparency = 1,
		Image = ASSETS.Shadow,
		ImageColor3 = Color3.new(0, 0, 0),
		ImageTransparency = 1,
		ScaleType = Enum.ScaleType.Slice,
		SliceCenter = Rect.new(49, 49, 450, 450),
		Parent = pop,
	})
	local card = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Theme.Background, BorderSizePixel = 0, ClipsDescendants = true, Parent = pop })
	Round(card, 10)
	local cardStroke = Stroke(card, Theme.Stroke, 1)
	local scroll = New("ScrollingFrame", {
		Position = UDim2.fromOffset(6, 6),
		Size = UDim2.new(1, -12, 1, -12),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 3,
		ScrollBarImageColor3 = Theme.Accent,
		ScrollBarImageTransparency = 0.4,
		CanvasSize = UDim2.new(),
		Parent = card,
	})
	List(scroll, 2)
	local empty = Label({ Size = UDim2.new(1, 0, 0, ROW_H), Text = "No results", TextSize = 13, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, LayoutOrder = 0, Visible = false, Parent = scroll })

	local rows, results = {}, {}
	local index, isOpen, serial = 1, false, 0
	local size = Vector2.new(300, 0)
	local follow
	local close

	local function measure()
		local gui = self.Gui.AbsoluteSize
		local top = field.AbsolutePosition.Y + field.AbsoluteSize.Y - self.Gui.AbsolutePosition.Y + 6
		local h = math.min(math.max(#rows, 1), MAX_ROWS) * (ROW_H + 2) - 2 + 12
		h = math.max(math.min(h, gui.Y - top - 12), ROW_H + 12)
		size = Vector2.new(math.min(math.max(field.AbsoluteSize.X, 300), math.max(gui.X - 16, 160)), h)
	end
	local function place()
		local origin = field.AbsolutePosition - self.Gui.AbsolutePosition
		local x = math.clamp(origin.X + field.AbsoluteSize.X, size.X + 8, math.max(self.Gui.AbsoluteSize.X - 8, size.X + 8))
		pop.Position = UDim2.fromOffset(x, origin.Y + field.AbsoluteSize.Y + 6)
	end
	local function paint()
		for i, r in ipairs(rows) do
			local on = i == index
			Tween(r.Button, { BackgroundTransparency = on and 0.35 or 1 }, 0.12)
			if r.Icon then
				Tween(r.Icon, { ImageColor3 = on and Theme.Accent or Theme.Muted }, 0.12)
			end
		end
	end
	local function keepInView()
		local top = (index - 1) * (ROW_H + 2)
		local view = scroll.AbsoluteWindowSize.Y
		local y = scroll.CanvasPosition.Y
		if top < y then
			y = top
		elseif top + ROW_H > y + view then
			y = top + ROW_H - view
		else
			return
		end
		scroll.CanvasPosition = Vector2.new(0, math.max(y, 0))
	end
	local function setOpen(open)
		if open == isOpen then
			return
		end
		isOpen = open
		serial += 1
		local mine = serial
		if open then
			if self._closePopup and self._closePopup ~= close then
				self._closePopup()
			end
			self._closePopup = close
			place()
			pop.Size = UDim2.fromOffset(size.X, 0)
			pop.Visible = true
			Tween(pop, { Size = UDim2.fromOffset(size.X, size.Y) }, 0.26)
			Tween(cardStroke, { Transparency = 0 }, 0.12)
			Tween(shadow, { ImageTransparency = 0.55 }, 0.26)
			follow = follow or RunService.RenderStepped:Connect(place)
		else
			if self._closePopup == close then
				self._closePopup = nil
			end
			Tween(pop, { Size = UDim2.fromOffset(size.X, 0) }, 0.18)
			Tween(shadow, { ImageTransparency = 1 }, 0.14)
			task.delay(0.19, function()
				if serial == mine and not isOpen then
					pop.Visible = false
					cardStroke.Transparency = 1
					if follow then
						follow:Disconnect()
						follow = nil
					end
				end
			end)
		end
	end
	close = function()
		setOpen(false)
	end
	local function pick(result)
		if not result then
			return
		end
		setOpen(false)
		box.Text = ""
		if box:IsFocused() then
			box:ReleaseFocus()
		end
		self:_revealResult(result)
	end
	local function esc(t)
		return (t:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
	end
	local function render(query)
		for _, r in ipairs(rows) do
			r.Button:Destroy()
		end
		table.clear(rows)
		results = self:_searchResults(query)
		index = 1
		for i, r in ipairs(results) do
			if i > 50 then
				break
			end
			local button = New("TextButton", { Size = UDim2.new(1, 0, 0, ROW_H), BackgroundColor3 = Theme.Surface3, BackgroundTransparency = 1, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = scroll })
			Round(button, 7)
			local holder = New("Frame", { Position = UDim2.fromOffset(10, 0), Size = UDim2.new(1, -20, 1, 0), BackgroundTransparency = 1, ClipsDescendants = true, Parent = button })
			List(holder, 5, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
			local order = 0
			local firstIcon
			local function addIcon(name)
				order += 1
				local img = New("ImageLabel", { Size = UDim2.fromOffset(14, 14), BackgroundTransparency = 1, ImageColor3 = Theme.Muted, ScaleType = Enum.ScaleType.Fit, LayoutOrder = order, Parent = holder })
				Icon(img, name)
				firstIcon = firstIcon or img
			end
			local function addText(text, color, rich)
				order += 1
				return Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = text, RichText = rich == true, TextSize = 13, FontFace = color and Fonts.Medium or Fonts.Regular, TextColor3 = color or Theme.Muted, TextTruncate = Enum.TextTruncate.None, LayoutOrder = order, Parent = holder })
			end
			addIcon(r.Page.Icon or SearchIcons.Tab)
			if r.Kind ~= "Tab" then
				addText(r.Page.Name)
				addText(">")
				local group = r.GroupName
				if group and group ~= "" and r.Kind ~= "Groupbox" then
					addText(group)
					addText(">")
				end
			end
			local at = r.At + #query
			addText(esc(r.Name:sub(1, r.At - 1)) .. "<b>" .. esc(r.Name:sub(r.At, at - 1)) .. "</b>" .. esc(r.Name:sub(at)), Theme.Accent, true)
			button.MouseEnter:Connect(function()
				index = i
				paint()
			end)
			button.MouseButton1Click:Connect(function()
				pick(r)
			end)
			table.insert(rows, { Button = button, Icon = firstIcon })
		end
		empty.Visible = #rows == 0
		scroll.CanvasSize = UDim2.fromOffset(0, math.max(#rows, 1) * (ROW_H + 2) - 2)
		scroll.CanvasPosition = Vector2.zero
		paint()
		measure()
		if isOpen then
			place()
			Tween(pop, { Size = UDim2.fromOffset(size.X, size.Y) }, 0.2)
		end
	end
	local function update()
		local query = string.match(string.lower(box.Text), "^%s*(.-)%s*$")
		if query == "" then
			setOpen(false)
			return
		end
		render(query)
		setOpen(true)
	end
	box.Focused:Connect(function()
		Tween(bar, { Size = UDim2.new(1, 0, 0, 2) }, 0.35)
		Tween(icon, { ImageColor3 = Theme.Accent }, 0.15)
		if box.Text ~= "" then
			update()
		end
	end)
	box.FocusLost:Connect(function(enter)
		Tween(bar, { Size = UDim2.new(0, 0, 0, 2) }, 0.3)
		Tween(icon, { ImageColor3 = Theme.Muted }, 0.2)
		if enter and isOpen then
			pick(results[index])
		end
	end)
	box:GetPropertyChangedSignal("Text"):Connect(update)
	self:_listen(UserInputService.InputBegan, function(input)
		if not isOpen then
			return
		end
		if input.KeyCode == Enum.KeyCode.Up or input.KeyCode == Enum.KeyCode.Down then
			if #rows > 0 then
				index = math.clamp(index + (input.KeyCode == Enum.KeyCode.Up and -1 or 1), 1, #rows)
				paint()
				keepInView()
			end
		elseif input.KeyCode == Enum.KeyCode.Escape then
			setOpen(false)
		elseif IsPress(input) then
			local m = MousePos()
			if not MouseOver(pop, m) and not MouseOver(field, m) then
				setOpen(false)
			end
		end
	end)
	self:_listen(self.Gui:GetPropertyChangedSignal("AbsoluteSize"), function()
		if isOpen then
			measure()
			place()
		end
	end)
end

function Window:Tab(o, icon, builtIn)
	o = Opts(o, { Title = "Name" })
	local entry, page = self:_addPage(o.Name or "Tab", o.Icon or icon, true, builtIn, o.ActiveIcon)
	local stack = New("Frame", { Size = UDim2.new(1, -12, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = page })
	List(stack, 10)
	local columns = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = 1, Parent = stack })
	local function column(x)
		local f = New("Frame", {
			Position = UDim2.new(x, x == 0 and 0 or 5, 0, 0),
			Size = UDim2.new(0.5, -5, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundTransparency = 1,
			Parent = columns,
		})
		List(f, 10)
		return f
	end
	local tab = setmetatable({ Window = self, Left = column(0), Right = column(0.5), Counts = { 0, 0 }, _entry = entry, _stack = stack }, Tab)
	if not self.Current and not self.HomeEnabled then
		self:SelectPage(entry)
	end
	return tab
end

function Window:Notify(o)
	o = Opts(o, { Text = "Content", Message = "Content", Image = "Icon" })
	local color = ({ Success = Theme.Success, Warning = Theme.Warning, Error = Theme.Error })[o.Type] or Theme.Text
	local duration = o.Duration or 4
	self.NotifyOrder += 1

	local slot = New("Frame", { Size = UDim2.new(1, 0, 0, 0), BackgroundTransparency = 1, LayoutOrder = self.NotifyOrder, Parent = self.Toasts })
	local mover = New("Frame", { Position = UDim2.fromOffset(320, 0), Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = slot })
	local shadow = New("ImageLabel", {
		Position = UDim2.fromOffset(-20, -20),
		Size = UDim2.new(1, 40, 1, 40),
		BackgroundTransparency = 1,
		Image = ASSETS.Shadow,
		ImageColor3 = Color3.new(0, 0, 0),
		ImageTransparency = 1,
		ScaleType = Enum.ScaleType.Slice,
		SliceCenter = Rect.new(49, 49, 450, 450),
		ZIndex = 0,
		Parent = mover,
	})
	local card = New("CanvasGroup", {
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundColor3 = Theme.Background,
		BorderSizePixel = 0,
		GroupTransparency = 1,
		Parent = mover,
	})
	Round(card, 10)
	local stroke = Stroke(card, Theme.Stroke)
	local content = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = card })
	Pad(content, 16, 16, 14, 24)
	local offset = 0
	if o.Icon then
		NewIcon(content, o.Icon, 16, color == Theme.Text and Theme.Accent or color, UDim2.fromOffset(0, 0))
		offset = 24
	end
	Label({ Position = UDim2.fromOffset(offset, 0), Size = UDim2.new(1, -28 - offset, 0, 16), Text = o.Title or "Notification", TextSize = 14, TextColor3 = color, Parent = content })
	local close = New("TextButton", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, 6, 0, -5),
		Size = UDim2.fromOffset(24, 24),
		BackgroundTransparency = 1,
		Text = "\u{d7}",
		TextColor3 = Theme.Muted,
		TextSize = 22,
		FontFace = Fonts.Bold,
		AutoButtonColor = false,
		Parent = content,
	})
	close.MouseEnter:Connect(function()
		Tween(close, { TextColor3 = Theme.Text }, 0.15)
	end)
	close.MouseLeave:Connect(function()
		Tween(close, { TextColor3 = Theme.Muted }, 0.2)
	end)
	if o.Content then
		Label({
			Position = UDim2.fromOffset(offset, 21),
			Size = UDim2.new(1, -offset, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			Text = o.Content,
			TextSize = 13,
			FontFace = Fonts.Regular,
			TextColor3 = Theme.Muted,
			TextWrapped = true,
			TextTruncate = Enum.TextTruncate.None,
			TextYAlignment = Enum.TextYAlignment.Top,
			Parent = content,
		})
	end
	local barTrack = New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 16, 1, -8), Size = UDim2.new(1, -32, 0, 3), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = card })
	Round(barTrack, 100)
	local bar = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, Parent = barTrack })
	Round(bar, 100)

	task.defer(function()
		if slot.Parent then
			Tween(slot, { Size = UDim2.new(1, 0, 0, card.AbsoluteSize.Y) }, 0.3)
		end
	end)
	Tween(mover, { Position = UDim2.fromOffset(0, 0) }, 0.5, Enum.EasingStyle.Back)
	Tween(card, { GroupTransparency = 0 }, 0.3)
	Tween(shadow, { ImageTransparency = 0.6 }, 0.4)
	Tween(bar, { Size = UDim2.fromScale(0, 1) }, duration, Enum.EasingStyle.Linear)

	local done = false
	local function dismiss()
		if done then
			return
		end
		done = true
		for i, fn in ipairs(self.ToastList) do
			if fn == dismiss then
				table.remove(self.ToastList, i)
				break
			end
		end
		Tween(mover, { Position = UDim2.fromOffset(320, 0) }, 0.3)
		Tween(card, { GroupTransparency = 1 }, 0.2)
		Tween(stroke, { Transparency = 1 }, 0.15)
		Tween(shadow, { ImageTransparency = 1 }, 0.2)
		task.delay(0.22, function()
			slot.ClipsDescendants = true
			Tween(slot, { Size = UDim2.new(1, 0, 0, -4) }, 0.22)
			task.delay(0.24, function()
				slot:Destroy()
			end)
		end)
	end
	task.delay(duration, dismiss)
	close.MouseButton1Click:Connect(dismiss)
	table.insert(self.ToastList, dismiss)
	while #self.ToastList > self.MaxNotifications do
		table.remove(self.ToastList, 1)()
	end
	return { Dismiss = dismiss }
end

-- drag outline (default "Outline" style): a ghost frame follows the cursor, window glides there on release
local function MakeGhost(win)
	if win._dragGhost then win._dragGhost:Destroy() end
	local root = win.Root
	local ghost = New("Frame", {
		AnchorPoint = root.AnchorPoint,
		Position = root.Position,
		Size = UDim2.fromOffset(win:_shownSize().X, win:_shownSize().Y),
		BackgroundColor3 = Theme.Accent,
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ZIndex = 40,
		Parent = win.Gui,
	})
	win._dragGhost = ghost
	Round(ghost, 12)
	local shown, hidden = {}, {}
	local function track(obj, showProps, hideProps)
		table.insert(shown, { obj, showProps })
		table.insert(hidden, { obj, hideProps })
	end
	track(ghost, { BackgroundTransparency = 0.92 }, { BackgroundTransparency = 1 })
	local stroke = Stroke(ghost, Theme.Accent, 1.5, 1)
	track(stroke, { Transparency = 0.2 }, { Transparency = 1 })
	for _, corner in ipairs({ Vector2.new(0, 0), Vector2.new(1, 0), Vector2.new(0, 1), Vector2.new(1, 1) }) do
		local pos = UDim2.new(corner.X, corner.X == 0 and 6 or -6, corner.Y, corner.Y == 0 and 6 or -6)
		for _, size in ipairs({ UDim2.fromOffset(16, 2), UDim2.fromOffset(2, 16) }) do
			local bar = New("Frame", {
				AnchorPoint = corner,
				Position = pos,
				Size = size,
				BackgroundColor3 = Theme.Accent,
				BackgroundTransparency = 1,
				BorderSizePixel = 0,
				Parent = ghost,
			})
			Round(bar, 1)
			track(bar, { BackgroundTransparency = 0 }, { BackgroundTransparency = 1 })
		end
	end
	local scale = New("UIScale", { Scale = 1.02, Parent = ghost })
	for _, s in ipairs(shown) do
		Tween(s[1], s[2], 0.15, Enum.EasingStyle.Quad)
	end
	Tween(scale, { Scale = 1 }, 0.25)
	return ghost, function()
		if not ghost.Parent then return end
		for _, h in ipairs(hidden) do
			Tween(h[1], h[2], 0.2, Enum.EasingStyle.Quad)
		end
		task.delay(0.22, function()
			if win._dragGhost == ghost then win._dragGhost = nil end
			ghost:Destroy()
		end)
	end
end

-- Phones get smaller UI than desktop (window, pill, notifications): 0.8 on a narrow or touch-only screen, otherwise 1
local function CompactFactor(gui)
	local viewport = gui.AbsoluteSize
	if (viewport.X == 0 or viewport.Y == 0) and workspace.CurrentCamera then
		viewport = workspace.CurrentCamera.ViewportSize
	end
	return (viewport.X < 900 or UserInputService.TouchEnabled and not UserInputService.MouseEnabled) and 0.8 or 1
end

-- Keep the requested relative centre even when a smaller screen temporarily clamps it.
function Window:_followScreen()
	local screen, root = self.Gui.AbsoluteSize, self.Root
	if screen.X <= 0 or screen.Y <= 0 or self._resizeActive then return end
	local center = self:_clamp((self._screenPosition or Vector2.new(0.5, 0.5)) * screen)
	root.Position = UDim2.fromOffset(center.X, center.Y)
end

-- What the window really covers on screen (its own size times its UIScale)
function Window:_shownSize()
	local size = self.Root.Size
	return Vector2.new(size.X.Offset, size.Y.Offset) * self.RootScale.Scale
end

function Window:_clamp(center)
	local screen = self.Gui.AbsoluteSize
	local half = self:_shownSize() / 2
	return Vector2.new(
		math.clamp(center.X, half.X, math.max(screen.X - half.X, half.X)),
		math.clamp(center.Y, half.Y, math.max(screen.Y - half.Y, half.Y))
	)
end

function Window:_enableResize(minSize, maxSize)
	local root = self.Root
	maxSize = maxSize or Vector2.new(math.huge, math.huge)
	local grip = New("Frame", { Name = "ResizeGrip", AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -2, 1, -2), Size = UDim2.fromOffset(28, 28), BackgroundTransparency = 1, Active = true, ZIndex = 20, Parent = root })
	self._grip = grip
	local mark = New("Frame", { AnchorPoint = Vector2.new(1, 1), Position = UDim2.fromOffset(24, 24), Size = UDim2.fromOffset(22, 22), BackgroundTransparency = 1, ZIndex = 20, Parent = grip })
	Round(mark, 8)
	local stroke = Stroke(mark, Theme.Muted, 2, 0.55)
	New("UIGradient", { Rotation = 45, Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.55, 1), NumberSequenceKeypoint.new(0.85, 0), NumberSequenceKeypoint.new(1, 0) }), Parent = stroke })
	local dragging = false
	local origin = Vector2.zero -- the window's visible top-left while it is being resized
	local startMouse, startSize, current, velocity, target, lastSize = Vector2.zero, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.zero
	local function paint(on)
		Tween(stroke, { Color = on and Theme.Accent or Theme.Muted, Transparency = on and 0 or 0.55 }, on and 0.15 or 0.3)
	end
	local function clamp(size)
		return Vector2.new(math.floor(math.clamp(size.X, minSize.X, math.max(minSize.X, math.min(maxSize.X, self.Gui.AbsoluteSize.X / self.RootScale.Scale))) + 0.5), math.floor(math.clamp(size.Y, minSize.Y, math.max(minSize.Y, math.min(maxSize.Y, self.Gui.AbsoluteSize.Y / self.RootScale.Scale))) + 0.5))
	end
	self:_listen(grip.InputBegan, function(input)
		if not IsPress(input) or not self.Open then
			return
		end
		if not self._resizeActive then
			-- the anchor point is where the window sits; the window is drawn scaled around it, so the visible top-left comes from the shown size
			origin = root.AbsolutePosition + root.AbsoluteSize * root.AnchorPoint - self.Gui.AbsolutePosition - self:_shownSize() / 2
			root.AnchorPoint = Vector2.zero
			root.Position = UDim2.fromOffset(origin.X, origin.Y)
			current = Vector2.new(root.Size.X.Offset, root.Size.Y.Offset)
			velocity, lastSize = Vector2.zero, current
		end
		self._resizeActive, dragging = true, true
		startSize, startMouse = current, MousePos()
		target = clamp(startSize)
		paint(true)
	end)
	self:_listen(grip.MouseEnter, function()
		if not dragging then paint(true) end
	end)
	self:_listen(grip.MouseLeave, function()
		if not dragging then paint(false) end
	end)
	self:_listen(UserInputService.InputEnded, function(input)
		if dragging and IsPress(input) then
			dragging = false
			paint(false)
		end
	end)
	self._resizeStep = function(dt)
		if not self._resizeActive then return end
		if dragging and self.Open then
			target = clamp(startSize + (MousePos() - startMouse) / self.RootScale.Scale)
		else
			dragging = false
		end
		dt = math.min(dt, 1 / 30)
		local decay = math.exp(-20 * dt)
		local delta = current - target
		local step = (velocity + delta * 20) * dt
		velocity = (velocity - step * 20) * decay
		current = target + (delta + step) * decay
		local size = Vector2.new(math.floor(current.X + 0.5), math.floor(current.Y + 0.5))
		if size ~= lastSize then
			lastSize = size
			root.Size = UDim2.fromOffset(size.X, size.Y)
			-- growing pushes the window back on screen instead of running off the edge
			local shown, screen = Vector2.new(size.X, size.Y) * self.RootScale.Scale, self.Gui.AbsoluteSize
			origin = Vector2.new(math.clamp(origin.X, 0, math.max(screen.X - shown.X, 0)), math.clamp(origin.Y, 0, math.max(screen.Y - shown.Y, 0)))
			root.Position = UDim2.fromOffset(origin.X, origin.Y)
		end
		if not dragging and (current - target).Magnitude < 0.3 and velocity.Magnitude < 3 then
			current, velocity, lastSize = target, Vector2.zero, target
			root.Size = UDim2.fromOffset(target.X, target.Y)
			local center = origin + self:_shownSize() / 2
			root.AnchorPoint = Vector2.new(0.5, 0.5)
			center = self:_clamp(center)
			root.Position = UDim2.fromOffset(center.X, center.Y)
			if self.Gui.AbsoluteSize.X > 0 and self.Gui.AbsoluteSize.Y > 0 then
				self._screenPosition = center / self.Gui.AbsoluteSize
			end
			self._resizeActive = false
		end
	end
end

function Window:_enableDrag(handles)
	local pressed, moved = false, false
	local startMouse, grab, target = Vector2.zero, Vector2.zero, nil
	local ghost, closeGhost, dragInput
	local function mouse()
		if dragInput and dragInput.UserInputType == Enum.UserInputType.Touch then
			return Vector2.new(dragInput.Position.X, dragInput.Position.Y) - GuiService:GetGuiInset()
		end
		return MousePos()
	end
	local function center()
		return self.Root.AbsolutePosition + self.Root.AbsoluteSize * self.Root.AnchorPoint - self.Gui.AbsolutePosition
	end
	for _, handle in ipairs(handles) do
		self:_listen(handle.InputBegan, function(input)
			if IsPress(input) and self.Open and not self._resizeActive and not pressed then
				dragInput = input
				pressed, moved = true, false
				startMouse = mouse()
				grab = startMouse - center()
			end
		end)
	end
	local function release()
		pressed = false
		local final
		if ghost then
			final = self:_clamp(Vector2.new(ghost.Position.X.Offset, ghost.Position.Y.Offset))
			closeGhost()
			ghost = nil
		elseif moved then
			final = self:_clamp(center())
		end
		if final and self.Gui.AbsoluteSize.X > 0 and self.Gui.AbsoluteSize.Y > 0 then
			self._screenPosition = final / self.Gui.AbsoluteSize
			Tween(self.Root, { Position = UDim2.fromOffset(final.X, final.Y) }, 0.3)
		end
		moved, dragInput = false, nil
	end
	self:_listen(UserInputService.InputEnded, function(input)
		if IsPress(input) and self._popPanels then
			for group in pairs(self._popPanels) do group:_popRelease() end
		end
		if pressed and input == dragInput then
			release()
		end
	end)
	self:_listen(UserInputService.TouchEnded, function(input)
		if pressed and input == dragInput then
			release()
		end
	end)
	self:_listen(UserInputService.WindowFocusReleased, function()
		if pressed then release() end
	end)
	self:_listen(RunService.RenderStepped, function(dt)
		if pressed and (not self.Open or dragInput.UserInputState == Enum.UserInputState.End or dragInput.UserInputState == Enum.UserInputState.Cancel) then release() end
		if self._resizeStep then self._resizeStep(dt) end
		if self._popLayer then
			local scale = math.max(self.RootScale.Scale, 0.05)
			self._popScale.Scale = scale
			self._popLayer.Size = UDim2.fromScale(1 / scale, 1 / scale)
			self._popLayer.Visible = self.Open and self._dialog == nil
			for group in pairs(self._popPanels) do group:_popStep() end
		end
		if ghost and not pressed then
			closeGhost()
			ghost = nil
		end
		if not pressed then
			return
		end
		local now = mouse()
		if not moved and (now - startMouse).Magnitude > 3 then
			moved = true
			ghost, closeGhost = MakeGhost(self)
		end
		if moved then
			local shown = self:_shownSize()
			ghost.Size = UDim2.fromOffset(shown.X, shown.Y)
			target = self:_clamp(now - grab)
			local alpha = 1 - math.exp(-dt * 45)
			local current = Vector2.new(ghost.Position.X.Offset, ghost.Position.Y.Offset)
			local nextPos = current:Lerp(target, alpha)
			ghost.Position = UDim2.fromOffset(nextPos.X, nextPos.Y)
		end
	end)
end

function Window:_featureGroups()
	local groups, total = {}, 0
	for _, page in ipairs(self.Pages) do
		if page ~= self.HomeEntry and not page.BuiltIn then
			local group = { Name = page.Name, Icon = page.Icon, Page = page, Items = {} }
			for _, c in ipairs(self.Controls) do
				if c.Tab == page and FeatureKinds[c.Kind] and c.Title and c.Title ~= "" then
					table.insert(group.Items, c)
				end
			end
			if #group.Items > 0 then
				table.insert(groups, group)
				total += #group.Items
			end
		end
	end
	return groups, total
end

function Window:_featureSummary()
	local groups, total = self:_featureGroups()
	return total .. (total == 1 and " feature" or " features") .. " across " .. #groups .. (#groups == 1 and " tab" or " tabs"), groups, total
end

function Window:ShowFeatures()
	if self._dialog then
		self._dialog.Close()
	end
	local summary, groups, total = self:_featureSummary()
	local backdrop = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 40, Parent = self.Root })
	local card = New("CanvasGroup", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, 0.5, 10),
		Size = UDim2.fromOffset(math.min(440, self.Root.AbsoluteSize.X - 24), math.min(480, self.Root.AbsoluteSize.Y - 24)),
		BackgroundColor3 = Theme.Background,
		BorderSizePixel = 0,
		GroupTransparency = 1,
		Active = true,
		Parent = backdrop,
	})
	Round(card, 12)
	local stroke = Stroke(card, Theme.Stroke, 1)
	local scale = New("UIScale", { Scale = 0.94, Parent = card })

	NewIcon(card, "list-checks", 18, Theme.Accent, UDim2.fromOffset(16, 22))
	Label({ Position = UDim2.fromOffset(44, 16), Size = UDim2.new(1, -92, 0, 18), Text = "Feature list", TextSize = 15, Parent = card })
	Label({ Position = UDim2.fromOffset(44, 35), Size = UDim2.new(1, -92, 0, 14), Text = summary, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = card })
	local closeButton = New("TextButton", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 10), Size = UDim2.fromOffset(38, 38), BackgroundColor3 = Theme.Surface3, BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = card })
	Round(closeButton, 8)
	NewIcon(closeButton, "x", 16, Theme.Muted, UDim2.fromOffset(8, 8))
	closeButton.MouseEnter:Connect(function()
		Tween(closeButton, { BackgroundTransparency = 0.5 }, 0.12)
	end)
	closeButton.MouseLeave:Connect(function()
		Tween(closeButton, { BackgroundTransparency = 1 }, 0.2)
	end)

	local searchBar = New("Frame", { Position = UDim2.fromOffset(16, 60), Size = UDim2.new(1, -32, 0, 32), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = card })
	Round(searchBar, 7)
	local searchStroke = Stroke(searchBar)
	local searchIcon = NewIcon(searchBar, "search", 14, Theme.Muted, UDim2.new(0, 10, 0.5, -7))
	local searchBox = New("TextBox", {
		Position = UDim2.fromOffset(32, 0),
		Size = UDim2.new(1, -40, 1, 0),
		BackgroundTransparency = 1,
		Text = "",
		PlaceholderText = "Search features",
		PlaceholderColor3 = Theme.Muted,
		TextColor3 = Theme.Text,
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextXAlignment = Enum.TextXAlignment.Left,
		ClearTextOnFocus = false,
		Parent = searchBar,
	})
	searchBox.Focused:Connect(function()
		Tween(searchStroke, { Color = Theme.StrokeHover }, 0.15)
		Tween(searchIcon, { ImageColor3 = Theme.Accent }, 0.15)
	end)
	searchBox.FocusLost:Connect(function()
		Tween(searchStroke, { Color = Theme.Stroke }, 0.2)
		Tween(searchIcon, { ImageColor3 = Theme.Muted }, 0.2)
	end)

	local scroll = New("ScrollingFrame", {
		Position = UDim2.fromOffset(16, 102),
		Size = UDim2.new(1, -26, 1, -116),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 3,
		ScrollBarImageColor3 = Theme.Accent,
		ScrollBarImageTransparency = 0.4,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		Parent = card,
	})
	local listFrame = New("Frame", { Size = UDim2.new(1, -10, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = scroll })
	List(listFrame, 2)
	local emptyLabel = Label({ Size = UDim2.new(1, 0, 0, 60), Text = total == 0 and "No features yet" or "No matches", TextSize = 13, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, LayoutOrder = 0, Visible = total == 0, Parent = listFrame })

	local dialog = {}
	local closed = false
	local connection
	function dialog.Close()
		if closed then
			return
		end
		closed = true
		if self._dialog == dialog then
			self._dialog = nil
		end
		if connection then
			connection:Disconnect()
		end
		Tween(backdrop, { BackgroundTransparency = 1 }, 0.18)
		Tween(card, { Position = UDim2.new(0.5, 0, 0.5, 8), GroupTransparency = 1 }, 0.18)
		Tween(scale, { Scale = 0.96 }, 0.18)
		Tween(stroke, { Transparency = 1 }, 0.12)
		task.delay(0.2, function()
			backdrop:Destroy()
		end)
	end

	local order = 0
	local sections = {}
	for _, group in ipairs(groups) do
		order += 1
		local header = New("Frame", { Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, LayoutOrder = order, Parent = listFrame })
		NewIcon(header, group.Icon or "layout-grid", 14, Theme.Accent, UDim2.fromOffset(2, 11))
		Label({ Position = UDim2.fromOffset(24, 10), Size = UDim2.new(1, -70, 0, 16), Text = string.upper(group.Name), TextSize = 11, TextColor3 = Theme.Muted, Parent = header })
		local count = Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -4, 0, 10), Size = UDim2.fromOffset(40, 16), Text = tostring(#group.Items), TextSize = 11, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Right, Parent = header })
		local section = { Header = header, Count = count, Rows = {} }
		for _, item in ipairs(group.Items) do
			order += 1
			local rowFrame = New("TextButton", { Size = UDim2.new(1, 0, 0, 42), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 1, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = order, Parent = listFrame })
			Round(rowFrame, 8)
			NewIcon(rowFrame, FeatureKinds[item.Kind] or "check", 14, Theme.Muted, UDim2.new(0, 10, 0.5, -7))
			Label({ Position = UDim2.fromOffset(34, 5), Size = UDim2.new(1, -78, 0, 18), Text = item.Title, TextSize = 13, Parent = rowFrame })
			Label({ Position = UDim2.fromOffset(34, 23), Size = UDim2.new(1, -78, 0, 14), Text = item.Kind .. " - " .. item.Group, TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = rowFrame })
			local arrowIcon = NewIcon(rowFrame, "arrow-up-right", 14, Theme.Muted, UDim2.new(1, -24, 0.5, -7))
			arrowIcon.ImageTransparency = 0.4
			rowFrame.MouseEnter:Connect(function()
				Tween(rowFrame, { BackgroundTransparency = 0.3 }, 0.12)
			end)
			rowFrame.MouseLeave:Connect(function()
				Tween(rowFrame, { BackgroundTransparency = 1 }, 0.2)
			end)
			rowFrame.MouseButton1Click:Connect(function()
				dialog.Close()
				self:_reveal(item)
			end)
			table.insert(section.Rows, { Frame = rowFrame, Key = string.lower(item.Title .. " " .. item.Kind .. " " .. item.Group) })
		end
		table.insert(sections, section)
	end
	searchBox:GetPropertyChangedSignal("Text"):Connect(function()
		local q = string.lower(searchBox.Text)
		local any = false
		for _, section in ipairs(sections) do
			local shown = 0
			for _, r in ipairs(section.Rows) do
				local ok = q == "" or string.find(r.Key, q, 1, true) ~= nil
				r.Frame.Visible = ok
				if ok then
					shown += 1
				end
			end
			section.Header.Visible = shown > 0
			section.Count.Text = tostring(shown)
			any = any or shown > 0
		end
		emptyLabel.Visible = not any
		scroll.CanvasPosition = Vector2.zero
	end)
	closeButton.MouseButton1Click:Connect(dialog.Close)
	backdrop.MouseButton1Click:Connect(dialog.Close)
	connection = UserInputService.InputBegan:Connect(function(input)
		if input.KeyCode == Enum.KeyCode.Escape then
			dialog.Close()
		end
	end)
	self._dialog = dialog
	Tween(backdrop, { BackgroundTransparency = 0.45 }, 0.25)
	Tween(card, { Position = UDim2.fromScale(0.5, 0.5), GroupTransparency = 0 }, 0.3)
	Tween(scale, { Scale = 1 }, 0.4, Enum.EasingStyle.Back)
	return dialog
end

function Window:_buildHome(o)
	local entry, page = self:_addPage("Home", "house", false)
	entry.Button.LayoutOrder = -2
	List(page, 10)

	local function card(height, order)
		local c = New("Frame", {
			Size = UDim2.new(1, 0, 0, height),
			BackgroundColor3 = Theme.Surface2,
			BorderSizePixel = 0,
			LayoutOrder = order,
			Parent = page,
		})
		Round(c, 12)
		Stroke(c, Theme.Stroke)
		return c
	end

	-- welcome card
	local welcome = card(142, 1)
	welcome.ClipsDescendants = true
	local bust = New("ImageLabel", {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -16, 1, 0),
		Size = UDim2.fromOffset(140, 140),
		BackgroundTransparency = 1,
		Image = "rbxthumb://type=AvatarBust&id=" .. LocalPlayer.UserId .. "&w=420&h=420",
		ScaleType = Enum.ScaleType.Fit,
		Parent = welcome,
	})
	New("UIGradient", {
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(0.45, 0),
			NumberSequenceKeypoint.new(1, 0),
		}),
		Parent = bust,
	})
	local bustPlaceholder = NewIcon(bust, "user", 40, Theme.Muted, UDim2.new(0.6, -20, 0.55, -20))
	bustPlaceholder.ImageTransparency = 1
	self:_trackAvatar(bust, bustPlaceholder)
	local textWidth = UDim2.new(1, -190, 0, 0)
	Label({ Position = UDim2.fromOffset(22, 20), Size = textWidth + UDim2.fromOffset(0, 14), Text = string.upper(o.Welcome or "Welcome back"), TextSize = 10, TextColor3 = Theme.Muted, Parent = welcome })
	local nameLabel = Label({ Position = UDim2.fromOffset(22, 35), Size = textWidth + UDim2.fromOffset(0, 32), Text = LocalPlayer.DisplayName, TextSize = 26, FontFace = Fonts.Bold, Parent = welcome })
	self:_trackName(nameLabel, "Display")
	local userLabel = Label({ Position = UDim2.fromOffset(22, 67), Size = textWidth + UDim2.fromOffset(0, 16), Text = "@" .. LocalPlayer.Name, TextSize = 13, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = welcome })
	self:_trackName(userLabel, "User")
	local chips = New("Frame", { Position = UDim2.new(0, 22, 1, -40), Size = UDim2.new(1, -44, 0, 24), BackgroundTransparency = 1, Parent = welcome })
	List(chips, 6, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center

	local function chip(order, icon, text, active, onClick)
		local b = New("TextButton", {
			Size = UDim2.fromOffset(0, 24),
			AutomaticSize = Enum.AutomaticSize.X,
			BackgroundColor3 = active and Theme.Accent or Theme.Surface3,
			BackgroundTransparency = active and 0.85 or 0.4,
			BorderSizePixel = 0,
			Text = "",
			AutoButtonColor = false,
			LayoutOrder = order,
			Parent = chips,
		})
		Round(b, 12)
		Pad(b, 8, 0)
		local inner = New("Frame", { Size = UDim2.fromScale(0, 1), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, Parent = b })
		List(inner, 5, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
		local img = New("ImageLabel", { Size = UDim2.fromOffset(12, 12), BackgroundTransparency = 1, ImageColor3 = active and Theme.Accent or Theme.Muted, LayoutOrder = 1, Parent = inner })
		Icon(img, icon)
		local lbl = Label({ Size = UDim2.fromOffset(0, 24), AutomaticSize = Enum.AutomaticSize.X, Text = text, TextSize = 11, TextColor3 = active and Theme.Accent or Theme.Muted, FontFace = Fonts.Bold, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 2, Parent = inner })
		local state = active
		if onClick then
			b.MouseButton1Click:Connect(function()
				state = not state
				onClick(state)
				Tween(b, { BackgroundColor3 = state and Theme.Accent or Theme.Surface3, BackgroundTransparency = state and 0.85 or 0.4 }, 0.15)
				Tween(img, { ImageColor3 = state and Theme.Accent or Theme.Muted }, 0.15)
				Tween(lbl, { TextColor3 = state and Theme.Accent or Theme.Muted }, 0.15)
			end)
		end
	end
	chip(1, "zap", tostring(o.Tier or "Free"), true)
	chip(2, "eye-off", "Name", false, function(on)
		self:SetHideName(on)
	end)
	chip(3, "user-x", "Avatar", false, function(on)
		self:SetHideAvatar(on)
	end)

	-- stats card
	local stats = card(0, 2)
	stats.AutomaticSize = Enum.AutomaticSize.Y
	stats.Size = UDim2.new(1, 0, 0, 0)
	Pad(stats, 18, 14, 18, 14)
	List(stats, 14)
	local graphs = New("Frame", { Size = UDim2.new(1, 0, 0, 78), BackgroundTransparency = 1, LayoutOrder = 1, Parent = stats })
	local BARS = 24
	local function graph(x, icon, caption, reference)
		local g = New("Frame", { Position = UDim2.new(x, x == 0 and 0 or 10, 0, 0), Size = UDim2.new(0.5, -10, 1, 0), BackgroundTransparency = 1, Parent = graphs })
		NewIcon(g, icon, 12, Theme.Muted, UDim2.fromOffset(0, 1))
		Label({ Position = UDim2.fromOffset(18, 0), Size = UDim2.new(1, -18, 0, 14), Text = caption, TextSize = 10, TextColor3 = Theme.Muted, Parent = g })
		local value = Label({ Position = UDim2.fromOffset(0, 16), Size = UDim2.new(1, 0, 0, 28), Text = "\u{2026}", TextSize = 24, FontFace = Fonts.Bold, Parent = g })
		local strip = New("Frame", { Position = UDim2.fromOffset(0, 50), Size = UDim2.new(1, 0, 0, 26), BackgroundTransparency = 1, Parent = g })
		List(strip, 2, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Bottom
		local bars = {}
		for i = 1, BARS do
			local bar = New("Frame", { Size = UDim2.new(1 / BARS, -2, 0, 2), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, LayoutOrder = i, Parent = strip })
			Round(bar, 2)
			bars[i] = bar
		end
		local history = {}
		return value, function(sample, color)
			table.insert(history, sample)
			if #history > BARS then
				table.remove(history, 1)
			end
			local top = reference
			for _, h in ipairs(history) do
				top = math.max(top, h)
			end
			local offset = BARS - #history
			for i = 1, BARS do
				local v = history[i - offset]
				local last = i == BARS
				Tween(bars[i], {
					Size = UDim2.new(1 / BARS, -2, v and math.max(v / top, 0.08) or 0, v and 0 or 2),
					BackgroundColor3 = (last and color) or (v and Theme.Muted or Theme.Surface3),
					BackgroundTransparency = last and 0 or (v and 0.6 or 0),
				}, 0.35)
			end
		end
	end
	local fpsValue, fpsPush = graph(0, "gauge", "FPS", 60)
	local pingValue, pingPush = graph(0.5, "wifi", "PING", 100)

	local numbers = New("Frame", { Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, LayoutOrder = 2, Parent = stats })
	local function number(x, caption)
		local n = New("Frame", { Position = UDim2.fromScale(x, 0), Size = UDim2.fromScale(1 / 3, 1), BackgroundTransparency = 1, Parent = numbers })
		local value = Label({ Size = UDim2.new(1, 0, 0, 16), Text = "-", TextSize = 13, FontFace = Fonts.Bold, Parent = n })
		Label({ Position = UDim2.fromOffset(0, 18), Size = UDim2.new(1, 0, 0, 12), Text = string.upper(caption), TextSize = 9, TextColor3 = Theme.Muted, Parent = n })
		return value
	end
	local playersValue = number(0, "Players")
	local execsValue = number(1 / 4, "Library runs")
	local liveUsersValue = number(2 / 4, "Live sessions")
	local sessionValue = number(3 / 4, "Session")
	execsValue.Text, liveUsersValue.Text = "-", "-"

	-- game card
	local gameCard = card(0, 3)
	gameCard.AutomaticSize = Enum.AutomaticSize.Y
	gameCard.Size = UDim2.new(1, 0, 0, 0)
	Pad(gameCard, 18, 16, 18, 12)
	List(gameCard, 12)
	local top = New("Frame", { Size = UDim2.new(1, 0, 0, 56), BackgroundTransparency = 1, LayoutOrder = 1, Parent = gameCard })
	local gameIcon = New("ImageLabel", {
		Size = UDim2.fromOffset(56, 56),
		BackgroundColor3 = Theme.Surface3,
		BorderSizePixel = 0,
		Image = "rbxthumb://type=GameIcon&id=" .. game.GameId .. "&w=150&h=150",
		Parent = top,
	})
	Round(gameIcon, 10)
	local gameName = Label({ Position = UDim2.fromOffset(68, 8), Size = UDim2.new(1, -68, 0, 20), Text = "Loading...", TextSize = 15, FontFace = Fonts.Bold, Parent = top })
	local gameSub = Label({ Position = UDim2.fromOffset(68, 30), Size = UDim2.new(1, -68, 0, 16), Text = "", TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = top })
	task.spawn(function()
		local ok, info = pcall(MarketplaceService.GetProductInfo, MarketplaceService, game.PlaceId)
		if ok and info then
			self.GameName = info.Name
			gameName.Text = info.Name
			self.ProfileGame.Text = info.Name
			self.IslandGame.Text = info.Name
			self.GameCreator = info.Creator and info.Creator.Name or ""
		end
	end)
	local buttons = New("Frame", { Size = UDim2.new(1, 0, 0, 40), BackgroundTransparency = 1, LayoutOrder = 2, Parent = gameCard })
	local function action(index, icon, text, fn)
		local b = New("TextButton", {
			Position = UDim2.new((index - 1) / 4, (index - 1) * 2, 0, 0),
			Size = UDim2.new(0.25, -6, 1, 0),
			BackgroundColor3 = Theme.Surface3,
			BackgroundTransparency = 0.55,
			BorderSizePixel = 0,
			Text = "",
			AutoButtonColor = false,
			Parent = buttons,
		})
		Round(b, 10)
		Stroke(b, Theme.Stroke)
		NewIcon(b, icon, 16, Theme.Text, UDim2.new(0.5, -8, 0, 5))
		Label({ Position = UDim2.fromOffset(0, 24), Size = UDim2.new(1, 0, 0, 12), Text = text, TextSize = 10, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, Parent = b })
		b.MouseEnter:Connect(function()
			Tween(b, { BackgroundTransparency = 0.2 }, 0.15)
		end)
		b.MouseLeave:Connect(function()
			Tween(b, { BackgroundTransparency = 0.55 }, 0.2)
		end)
		b.MouseButton1Click:Connect(fn)
	end
	action(1, "refresh-cw", "Rejoin", function()
		pcall(TeleportService.TeleportToPlaceInstance, TeleportService, game.PlaceId, game.JobId, LocalPlayer)
	end)
	action(2, "shuffle", "Hop", function()
		ServerTeleport(false)
	end)
	action(3, "users", "Lowest", function()
		ServerTeleport(true)
	end)
	action(4, "copy", "Job ID", function()
		if setclipboard then
			setclipboard(game.JobId)
			self:Notify({ Title = "Copied", Content = "Job ID copied", Type = "Success", Duration = 2 })
		end
	end)
	Label({
		Size = UDim2.new(1, 0, 0, 12),
		Text = "Job " .. string.sub(game.JobId, 1, 8) .. "...  .  Place " .. game.PlaceId,
		TextSize = 10,
		FontFace = Fonts.Regular,
		TextColor3 = Theme.Muted,
		LayoutOrder = 3,
		Parent = gameCard,
	})

	-- links card (Discord / Website / custom links + feature list)
	local links = {}
	if o.Discord then
		table.insert(links, { Icon = o.DiscordIcon or "message-circle", Title = o.DiscordTitle or "Community", Text = o.Discord })
	end
	if o.Website then
		table.insert(links, { Icon = o.WebsiteIcon or "globe", Title = o.WebsiteTitle or "Website", Text = o.Website })
	end
	for _, link in ipairs(o.Links or {}) do
		table.insert(links, link)
	end
	local featureSubtitle
	if #links > 0 or o.Features ~= false then
		local linkCard = card(0, 4)
		linkCard.AutomaticSize = Enum.AutomaticSize.Y
		linkCard.Size = UDim2.new(1, 0, 0, 0)
		Pad(linkCard, 16, 16, 14, 14)
		List(linkCard, 0)
		Label({ Size = UDim2.new(1, 0, 0, 22), Text = "LINKS", TextSize = 10, TextColor3 = Theme.Muted, TextYAlignment = Enum.TextYAlignment.Top, LayoutOrder = 0, Parent = linkCard })
		local linkCount = 0
		local function linkRow(icon, title, subtitle, actionIcon, fn)
			linkCount += 1
			local r = New("Frame", { Size = UDim2.new(1, 0, 0, 46), BackgroundTransparency = 1, LayoutOrder = linkCount, Parent = linkCard })
			if linkCount > 1 then
				New("Frame", { Size = UDim2.new(1, 0, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = r })
			end
			NewIcon(r, icon, 16, Theme.Accent, UDim2.new(0, 0, 0.5, -8))
			Label({ Position = UDim2.fromOffset(28, 6), Size = UDim2.new(1, -68, 0, 18), Text = title, TextSize = 13, Parent = r })
			local sub = Label({ Position = UDim2.fromOffset(28, 24), Size = UDim2.new(1, -68, 0, 15), Text = subtitle, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = r })
			local btn = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, 0, 0.5, 0), Size = UDim2.fromOffset(30, 30), BackgroundColor3 = Theme.Surface3, BackgroundTransparency = 0.5, BorderSizePixel = 0, Text = "", AutoButtonColor = false, Parent = r })
			Round(btn, 8)
			local btnStroke = Stroke(btn)
			local btnIcon = NewIcon(btn, actionIcon, 14, Theme.Muted, UDim2.fromOffset(8, 8))
			btn.MouseEnter:Connect(function()
				Tween(btn, { BackgroundTransparency = 0 }, 0.15)
				Tween(btnStroke, { Color = Theme.StrokeHover }, 0.15)
				Tween(btnIcon, { ImageColor3 = Theme.Accent }, 0.15)
			end)
			btn.MouseLeave:Connect(function()
				Tween(btn, { BackgroundTransparency = 0.5 }, 0.25)
				Tween(btnStroke, { Color = Theme.Stroke }, 0.25)
				Tween(btnIcon, { ImageColor3 = Theme.Muted }, 0.25)
			end)
			btn.MouseButton1Click:Connect(fn)
			return sub
		end
		for _, link in ipairs(links) do
			local hasCallback = type(link.Callback) == "function"
			linkRow(link.Icon or "link", link.Title or "", link.Text or "", hasCallback and "arrow-up-right" or "copy", function()
				if hasCallback then
					Safe(link.Callback)
				elseif setclipboard then
					setclipboard(link.Copy or link.Text)
					self:Notify({ Title = link.Title or "Copied", Content = "Copied to clipboard", Type = "Success", Duration = 2 })
				end
			end)
		end
		if o.Features ~= false then
			featureSubtitle = linkRow("list-checks", "Feature list", "", "chevron-right", function()
				self:ShowFeatures()
			end)
		end
	end

	if o.SocialLinks ~= false then
		local socials = o.SocialLinks or {}
		local socialRow = New("Frame", { Name = "SocialLinks", Size = UDim2.new(1, -12, 0, 54), BackgroundTransparency = 1, LayoutOrder = 5, Parent = page })
		local layout = List(socialRow, 8, Enum.FillDirection.Horizontal)
		layout.VerticalAlignment = Enum.VerticalAlignment.Center
		local brandSheet
		if HasFiles() and type(getcustomasset) == "function" then
			pcall(function()
				local path = EnsureDir("Assets") .. "/social-logos-v2.png"
				if not (type(isfile) == "function" and isfile(path)) then
					writefile(path, "\137\080\078\071\013\010\026\010\000\000\000\013\073\072\068\082\000\000\002\000\000\000\000\128\008\006\000\000\000\125\087\209\011\000\000\021\039\073\068\065\084\120\156\237\221\239\117\212\070\020\005\240\107\078\190\135\084\016\081\065\236\010\016\021\096\042\096\169\000\168\000\185\002\067\005\044\021\096\042\176\168\000\083\129\151\010\066\042\032\115\173\039\144\151\245\090\187\171\209\252\187\191\115\020\019\112\194\238\142\172\121\243\230\205\204\031\016\017\041\220\143\031\063\106\247\229\018\211\250\124\116\116\084\067\110\184\207\184\114\095\254\113\215\177\093\015\237\058\070\153\174\220\245\221\174\043\187\190\186\123\102\133\153\252\001\017\017\017\015\092\167\255\220\125\169\237\170\032\067\195\192\231\180\255\133\251\204\086\238\075\203\203\005\003\031\224\209\017\068\068\010\231\041\003\176\114\015\240\071\040\140\251\044\217\177\189\068\215\169\061\132\028\130\217\129\011\119\189\115\247\210\021\038\246\000\034\034\226\067\133\130\048\136\114\023\131\168\047\238\090\064\157\255\020\248\025\046\220\245\133\159\173\005\170\147\081\000\032\034\226\137\141\134\179\198\247\104\029\063\175\026\226\075\237\174\075\011\004\038\185\175\020\000\136\136\248\083\033\083\174\019\122\232\174\115\116\035\254\026\050\151\026\093\070\224\156\109\128\003\040\000\016\017\241\167\070\134\044\021\125\237\174\087\144\080\248\217\095\031\050\045\160\000\064\068\196\159\199\200\140\235\112\222\160\075\247\107\142\063\060\182\193\165\181\201\206\020\000\136\136\248\115\124\104\154\054\038\238\189\188\119\095\026\072\108\026\107\155\157\040\000\016\017\241\235\020\137\179\249\254\190\186\095\226\180\096\027\237\018\112\042\000\016\017\241\043\233\000\192\058\020\166\252\075\221\177\047\037\108\163\203\177\065\128\002\000\017\017\191\158\038\062\013\160\206\063\045\055\065\192\152\111\084\000\032\034\226\095\146\213\242\054\175\172\206\063\061\199\099\106\002\020\000\136\136\248\247\028\137\113\029\072\003\205\249\167\108\097\109\120\039\005\000\034\034\254\085\238\097\188\064\034\108\109\249\094\075\203\036\042\111\182\237\019\160\195\128\036\009\107\071\137\214\238\122\049\231\177\153\219\216\107\099\186\173\069\128\035\061\229\112\158\014\003\090\183\114\215\137\187\055\190\035\098\086\175\192\077\126\180\206\063\015\188\223\030\109\186\239\116\028\176\068\201\061\132\184\129\074\109\087\127\118\248\080\131\120\210\147\236\252\107\012\118\125\115\175\191\063\227\187\069\119\172\231\103\072\233\042\116\181\000\013\226\214\064\157\127\078\216\150\013\054\212\161\040\003\032\081\176\195\045\250\078\127\236\178\169\039\174\099\109\017\208\142\035\071\030\235\217\186\235\147\050\004\113\153\041\003\064\012\012\079\098\109\127\251\057\252\002\201\209\201\250\145\194\010\000\036\024\247\176\121\138\174\179\175\177\223\161\041\028\089\063\065\064\118\010\090\141\221\173\208\005\003\023\238\061\124\130\004\053\099\000\064\087\174\205\079\016\161\003\238\103\137\223\111\207\203\217\003\000\155\047\253\123\237\183\235\013\223\202\180\197\125\203\079\106\196\161\189\231\207\025\117\125\031\241\223\125\203\125\100\104\015\090\086\068\179\227\159\034\205\024\044\011\048\097\167\193\123\099\233\174\015\235\017\186\204\099\230\000\128\222\185\182\142\106\105\096\128\207\064\230\119\235\121\057\073\000\096\069\035\044\208\026\118\218\245\224\091\106\200\062\218\013\191\238\131\137\175\177\023\019\245\044\232\123\137\174\211\175\048\045\118\154\011\004\224\222\215\018\211\047\239\090\161\155\042\120\167\105\130\249\004\234\252\088\200\186\068\036\052\250\047\194\173\044\192\094\001\128\205\019\049\125\091\099\115\129\150\204\099\088\104\246\041\182\209\163\187\079\216\057\046\224\255\161\194\010\215\149\221\151\127\162\011\050\134\215\080\189\229\255\211\127\158\067\125\192\181\178\235\063\126\206\022\212\092\195\175\214\093\111\053\069\224\095\192\209\111\020\065\128\070\255\069\249\089\011\048\058\000\176\081\062\071\113\011\076\063\138\147\105\172\208\165\146\223\133\202\014\232\062\241\098\133\192\237\154\187\192\029\096\240\032\192\083\054\075\226\244\051\107\058\042\000\112\055\007\083\183\092\234\164\145\126\026\216\073\240\161\114\129\025\217\174\083\218\060\196\175\051\215\174\013\100\082\017\140\128\131\006\001\238\253\255\011\061\223\075\241\221\221\107\127\241\023\091\119\002\180\035\032\063\186\095\242\210\205\145\014\182\213\071\182\221\092\135\144\104\231\176\217\188\177\169\014\201\203\123\215\174\231\063\002\028\026\100\059\020\234\249\094\142\135\253\174\148\119\006\000\131\035\032\199\174\201\150\248\176\237\046\103\122\168\156\067\230\114\239\033\031\146\036\174\010\184\012\016\224\213\144\210\212\252\199\198\000\064\231\063\103\101\167\243\161\247\225\254\223\175\160\123\101\078\199\246\153\075\126\110\054\226\113\237\251\102\198\108\192\099\072\105\110\218\124\099\013\128\029\035\184\128\228\100\233\230\125\094\096\098\218\055\060\152\168\119\148\075\077\164\085\240\108\227\006\093\209\150\151\226\207\153\086\179\072\156\030\253\150\001\176\130\191\005\036\055\011\107\219\169\169\056\052\012\126\230\154\118\201\027\219\248\173\187\174\045\035\080\097\122\202\220\149\235\120\211\020\128\030\042\249\154\180\109\109\212\164\026\145\112\078\061\005\117\018\151\254\048\151\107\043\236\125\062\225\244\128\002\128\114\221\014\000\172\050\176\130\228\170\154\248\076\114\021\163\133\023\164\114\092\130\097\192\183\116\215\191\174\221\251\090\129\067\230\240\021\000\148\235\120\253\056\224\151\144\220\177\141\151\056\144\173\249\175\032\161\085\184\227\168\079\201\222\177\093\252\121\228\151\043\116\155\070\245\095\063\143\168\017\081\240\088\174\135\063\139\000\085\012\082\148\071\135\020\143\233\094\137\210\035\021\004\238\047\210\034\192\067\221\187\105\020\179\008\080\022\160\084\087\195\041\000\205\037\150\227\208\182\110\032\177\105\032\178\059\117\254\229\186\085\003\080\067\074\081\099\079\054\250\215\158\225\241\121\238\169\074\092\068\050\053\012\000\254\129\148\226\144\182\110\032\177\106\032\034\050\210\077\000\096\085\196\021\164\020\213\062\149\227\026\253\071\079\089\000\017\025\173\207\000\104\030\168\060\251\180\121\003\137\157\246\241\016\145\081\020\000\148\107\167\054\215\232\063\025\167\086\209\046\034\178\085\031\000\104\045\104\121\118\109\243\006\146\010\029\203\044\034\247\234\003\128\026\082\154\122\236\055\106\244\159\156\058\192\145\178\034\146\152\007\016\185\095\003\073\141\118\006\020\145\173\250\000\064\231\065\151\103\212\082\064\091\045\160\209\127\122\158\234\140\000\017\217\070\025\128\114\141\237\028\022\144\020\177\125\023\144\208\062\184\235\051\068\034\244\064\235\134\203\053\178\237\117\064\084\186\212\118\225\173\142\142\142\106\247\245\153\187\254\131\072\068\152\001\168\144\015\254\144\125\131\140\085\109\251\067\091\078\182\245\123\036\106\220\240\073\103\124\068\192\005\001\023\232\126\150\222\065\036\018\089\077\001\240\135\204\093\149\251\229\107\040\218\158\194\002\146\186\005\036\010\238\217\244\221\093\044\206\124\228\174\079\016\009\044\183\012\192\013\247\067\246\022\138\182\199\184\179\014\192\010\200\158\066\082\247\052\199\105\062\222\159\238\122\220\095\072\008\143\109\118\023\051\051\079\160\250\000\009\040\203\000\128\214\162\109\253\144\109\182\109\173\056\031\080\170\034\207\067\146\075\002\025\184\184\139\231\027\156\187\235\210\093\215\063\140\251\227\127\221\213\246\215\143\095\254\181\239\253\136\200\185\231\083\107\245\001\012\004\062\064\100\102\217\175\002\176\104\187\070\247\067\166\250\128\241\084\064\150\143\100\050\057\174\227\102\198\226\061\059\114\247\175\215\238\090\162\011\096\106\140\027\172\060\180\239\077\166\246\193\002\129\133\251\229\095\232\166\047\245\156\146\089\020\179\012\208\126\200\042\168\062\224\094\182\139\156\118\146\203\071\021\243\206\128\044\054\229\136\221\070\246\044\150\091\160\192\236\147\101\045\223\218\115\234\004\221\020\230\087\136\120\146\237\020\192\093\084\031\112\075\117\199\239\047\032\185\137\110\068\108\233\125\142\242\047\145\208\136\125\014\238\057\117\197\041\076\119\049\112\227\052\230\011\116\211\004\202\014\200\100\138\011\000\072\245\001\063\085\119\252\190\138\255\242\019\077\155\014\058\254\037\180\204\244\094\054\141\185\228\052\129\101\007\056\085\192\041\077\102\051\057\144\225\051\076\129\129\236\236\015\020\140\063\088\232\014\078\169\209\061\140\254\070\225\172\098\188\130\228\230\152\109\107\247\124\016\246\115\246\030\186\191\014\194\001\012\126\021\064\254\198\086\240\048\115\176\130\200\022\218\010\024\183\234\003\152\102\043\189\062\064\169\216\124\005\105\091\091\178\119\142\046\213\095\065\188\178\012\103\027\050\216\147\052\040\000\024\096\154\013\221\003\234\012\229\170\033\185\154\253\080\039\043\062\252\002\157\078\040\018\029\005\000\107\044\122\110\080\238\110\093\177\204\021\115\078\147\243\155\156\235\252\235\200\160\171\142\102\166\038\166\182\225\107\225\107\058\025\188\206\126\158\150\239\033\150\249\217\227\057\055\005\114\127\023\151\146\178\243\175\032\034\209\097\000\048\234\088\216\210\172\237\214\149\235\082\156\091\053\015\145\236\027\207\041\152\215\156\146\177\042\232\214\230\060\111\088\117\244\210\218\038\116\017\039\255\110\118\250\167\246\154\174\250\063\024\164\097\095\069\054\189\084\099\006\092\203\239\190\188\133\136\068\139\001\128\118\123\219\194\030\226\076\099\230\088\031\080\173\253\123\141\176\024\104\029\219\082\205\123\013\054\121\122\129\249\049\072\169\135\157\254\054\131\233\165\208\193\100\013\143\108\190\159\187\240\045\032\034\081\211\020\192\072\133\212\007\132\076\255\179\099\172\247\041\092\178\182\153\051\008\120\049\054\072\025\178\076\070\141\176\065\128\183\140\159\085\159\107\077\191\072\034\020\000\236\032\231\250\128\192\203\255\152\089\057\029\166\250\119\101\065\192\028\193\217\059\251\187\246\050\008\002\066\213\005\028\091\071\061\169\065\231\175\029\036\069\018\161\000\096\015\153\214\007\132\124\112\047\166\088\178\100\193\153\207\154\000\118\218\013\014\100\065\192\002\225\248\104\235\115\168\243\023\073\138\002\128\003\172\213\007\164\190\019\087\168\135\247\087\247\025\094\096\058\013\252\105\014\201\082\012\241\222\065\184\002\198\026\019\178\130\191\005\068\036\041\010\000\038\096\041\097\118\160\076\065\167\090\040\088\035\140\073\043\197\061\118\172\223\014\073\253\223\161\065\024\053\038\226\058\255\005\212\249\139\036\073\001\192\180\126\216\149\162\032\203\065\061\116\170\180\196\244\150\152\152\005\043\033\050\071\147\180\181\213\141\156\067\068\146\164\000\096\002\060\220\004\221\134\039\013\018\092\086\105\015\242\016\175\219\087\033\101\139\233\181\240\163\197\252\030\078\116\060\048\151\251\197\122\191\235\024\093\145\123\040\000\056\128\157\099\206\142\127\137\180\119\059\011\053\255\063\106\013\253\174\142\060\236\129\110\163\117\031\090\132\113\080\155\187\251\190\065\220\069\127\147\212\106\136\228\076\001\192\030\056\098\182\205\078\114\089\246\020\234\061\248\124\072\135\220\033\112\023\043\132\081\097\079\150\049\122\009\017\073\090\209\199\001\239\202\214\058\243\193\215\032\047\089\101\000\060\072\037\152\216\197\033\109\222\064\059\136\138\036\079\001\192\072\054\207\207\138\245\028\031\124\058\015\098\187\063\145\159\189\238\099\078\123\033\192\169\130\034\050\061\078\001\228\182\191\253\164\214\230\249\115\235\252\251\010\244\010\097\212\240\231\111\076\199\103\134\036\212\061\181\111\208\247\010\034\146\005\102\000\152\134\125\012\185\101\176\196\041\231\125\205\087\200\087\133\009\113\250\103\170\077\128\214\132\154\126\217\057\240\176\159\137\144\231\069\048\096\109\209\061\179\054\077\031\241\061\213\008\127\168\149\072\018\052\005\176\038\227\121\254\141\044\165\027\010\059\147\006\019\243\244\158\106\119\077\185\099\097\047\088\017\041\151\002\142\061\205\208\052\152\031\051\148\075\094\035\095\171\143\054\018\201\146\086\001\012\184\007\034\059\254\107\020\210\249\071\192\203\193\052\240\147\181\241\149\009\010\057\162\030\253\217\091\059\205\061\247\255\193\093\149\235\248\095\237\024\168\136\200\008\010\000\240\115\158\159\029\127\174\069\126\219\132\094\198\232\099\078\217\071\167\250\116\234\096\197\182\209\013\105\151\182\159\115\042\140\163\254\039\174\211\095\120\154\118\017\017\020\030\000\216\122\126\174\229\231\085\161\076\161\003\158\151\083\118\172\214\169\086\152\030\095\227\212\193\202\027\132\181\203\231\062\087\000\192\029\252\042\143\027\047\137\136\097\000\176\066\097\216\225\184\139\005\126\028\245\215\040\023\211\170\161\003\000\254\253\013\038\096\129\132\207\189\233\095\090\033\220\193\220\255\135\193\068\133\176\234\049\223\100\159\235\028\083\021\236\252\107\141\250\069\230\081\092\000\048\152\231\215\114\166\110\039\190\208\083\000\196\142\117\138\017\166\239\189\233\031\218\223\113\016\219\135\063\165\067\116\106\248\167\206\095\100\102\197\076\001\020\062\207\159\130\247\135\028\080\099\103\210\215\240\143\133\139\031\247\157\182\176\247\120\137\180\212\240\139\115\254\167\234\252\069\230\149\125\000\160\121\254\100\176\067\253\098\025\154\209\108\058\135\163\242\005\230\195\108\197\229\174\211\001\182\060\145\247\097\106\001\168\239\125\066\026\031\007\056\137\200\118\217\078\001\104\158\127\148\024\151\086\189\101\192\054\038\027\096\219\051\179\125\231\172\080\239\241\245\049\096\121\115\095\054\096\237\240\168\020\179\079\062\167\137\062\187\206\255\045\068\100\118\220\008\104\133\204\240\161\140\110\142\095\169\254\237\098\077\185\214\232\058\215\021\186\077\096\086\248\117\159\242\207\042\116\157\126\044\005\140\141\123\173\023\232\002\170\214\254\172\194\175\215\025\067\157\197\094\102\216\040\170\129\136\004\145\213\078\128\086\072\198\081\127\005\025\043\230\109\160\043\164\211\065\156\034\207\109\163\125\006\089\223\180\220\079\036\156\220\050\000\007\087\104\023\102\005\041\217\152\224\207\103\246\066\169\127\145\128\030\168\248\166\092\106\123\009\236\002\241\168\033\082\024\029\006\084\046\029\003\045\033\125\083\000\042\018\086\191\012\240\051\164\052\049\174\000\144\114\172\032\034\065\233\048\032\017\017\145\002\245\001\064\011\041\077\011\041\221\087\132\163\012\148\072\096\125\000\160\045\056\203\211\183\121\200\078\064\194\010\249\115\175\061\058\068\002\235\139\000\021\141\151\167\111\115\005\127\018\066\133\050\172\032\018\041\005\000\229\082\155\139\252\226\107\191\131\021\068\034\117\051\005\096\167\112\125\131\148\226\155\078\094\147\145\124\221\039\127\034\046\190\166\036\086\016\137\212\112\021\128\070\132\229\024\182\181\002\129\114\181\035\190\199\215\115\225\120\223\035\149\083\162\189\014\036\102\195\000\160\133\148\162\029\252\058\084\224\199\141\136\206\220\245\001\101\226\251\231\123\127\141\184\173\224\079\141\120\252\131\233\041\171\042\081\027\006\000\049\109\203\041\126\133\110\107\174\060\168\221\232\136\231\192\047\220\175\255\066\215\017\150\240\192\228\123\127\225\174\138\239\221\142\194\061\065\164\239\221\243\008\054\138\195\147\236\232\105\031\217\136\020\178\170\010\082\202\245\245\103\000\096\063\232\090\018\150\191\175\107\015\245\016\015\169\165\123\013\063\255\094\214\035\176\035\116\087\229\254\245\009\186\145\113\078\091\021\247\163\253\019\247\030\143\221\181\028\214\096\216\103\241\030\243\027\219\246\190\118\010\125\238\058\223\010\225\189\130\031\045\226\183\130\148\234\251\250\078\128\058\157\043\127\183\218\216\117\062\204\006\112\004\058\103\240\119\238\030\252\151\155\206\154\231\241\176\150\021\168\208\141\148\063\033\093\124\237\195\209\254\111\029\046\063\003\119\125\193\188\199\030\179\173\079\172\237\199\240\025\036\046\016\144\141\254\159\195\143\022\241\083\013\080\185\086\071\235\191\227\126\032\086\238\203\223\144\028\125\179\081\246\111\172\032\171\113\215\075\204\171\117\215\217\125\231\194\187\215\199\116\113\109\151\143\249\218\041\048\157\202\078\181\189\175\115\181\224\231\013\230\159\007\127\231\094\219\078\035\094\123\173\151\240\131\029\208\147\077\193\209\028\024\136\194\079\027\252\231\222\083\244\069\142\238\253\055\232\238\067\041\207\217\166\000\128\015\218\143\144\028\061\027\217\049\045\049\127\016\216\098\068\032\064\150\054\174\209\205\033\115\004\023\042\096\101\135\207\142\171\239\244\087\247\253\007\238\181\063\069\151\114\174\049\047\190\214\197\152\207\119\019\247\186\217\081\251\090\186\119\229\094\215\009\102\230\222\019\219\225\028\126\124\176\076\086\212\244\188\047\218\179\163\077\191\235\110\138\037\252\165\197\036\140\209\015\164\128\217\000\090\217\223\253\105\151\189\010\044\112\169\236\234\127\061\085\096\240\205\094\087\107\095\087\187\116\164\246\121\242\231\233\021\194\236\128\247\206\093\205\033\123\063\184\247\192\032\231\041\252\097\240\215\096\038\150\250\231\232\223\215\040\253\005\107\061\016\057\011\166\175\033\037\122\116\087\000\192\031\138\022\241\166\090\101\055\125\213\253\078\029\128\117\170\172\025\008\113\031\240\181\158\089\149\252\222\236\001\087\173\253\118\125\199\183\183\107\255\190\058\180\010\222\082\172\012\164\066\164\131\217\238\139\041\210\235\238\125\044\224\191\080\113\150\078\211\238\009\214\093\248\106\019\022\125\086\071\137\108\182\165\105\223\034\221\076\007\255\177\233\079\120\227\218\195\191\133\130\128\212\237\213\249\147\141\114\143\173\019\227\232\117\206\221\219\248\112\062\248\001\106\029\248\106\237\183\091\204\135\239\097\238\206\159\029\080\115\104\240\052\196\142\217\238\003\159\029\197\123\247\119\192\103\016\096\035\127\006\050\062\219\228\034\149\206\223\180\080\198\183\052\045\255\241\224\174\063\181\027\184\070\218\085\216\165\227\210\179\250\208\135\145\165\102\043\204\187\105\207\231\020\082\168\247\177\078\120\206\181\214\076\247\087\083\118\254\003\075\248\199\032\192\203\188\252\160\152\241\024\126\249\248\236\125\106\033\165\185\169\005\059\026\243\157\086\040\178\068\124\251\119\203\102\028\001\046\118\088\230\053\154\141\160\248\128\123\012\191\158\236\091\176\022\027\207\085\244\061\174\213\127\229\179\154\126\230\249\098\190\143\103\071\019\108\068\100\083\154\172\116\223\105\245\195\158\024\184\214\072\140\231\034\079\137\203\207\021\042\015\198\124\183\117\036\021\186\173\091\181\115\084\188\216\054\108\163\202\071\231\079\236\096\236\001\199\013\123\124\109\016\243\041\151\206\159\236\189\248\250\172\248\255\101\176\084\031\121\094\074\103\157\241\092\089\032\006\154\215\174\099\122\127\200\102\065\238\191\101\199\207\160\101\142\206\159\150\072\147\151\231\133\068\233\103\091\143\202\000\172\179\081\096\191\046\155\191\086\228\024\006\071\250\124\232\183\232\230\029\189\118\000\155\216\232\182\193\180\025\129\071\071\153\029\162\098\063\051\095\048\029\118\252\205\220\129\082\192\170\241\011\187\182\174\014\177\209\062\239\197\083\187\230\172\191\224\046\155\190\167\023\188\240\112\127\074\188\078\250\190\098\175\000\096\019\235\008\248\195\214\255\000\012\247\215\246\157\046\206\085\063\106\228\003\175\239\220\249\245\123\108\035\228\009\003\129\179\057\151\131\205\201\125\070\156\058\057\116\105\037\107\114\222\134\108\255\008\054\143\025\254\060\012\085\008\179\204\178\151\244\180\149\107\215\022\122\086\231\238\214\020\213\100\001\192\088\022\161\175\071\201\195\096\097\168\198\118\021\194\047\095\233\215\136\111\211\110\248\189\077\015\177\171\196\170\135\127\099\035\009\166\091\247\169\042\078\118\004\053\134\221\251\108\243\093\239\089\102\122\056\250\109\098\200\140\216\251\088\065\153\191\161\015\041\108\252\179\205\076\181\042\018\214\173\032\117\246\000\064\202\096\157\196\002\093\048\048\182\195\059\057\010\180\037\236\092\118\124\200\050\184\100\214\096\025\091\096\056\211\190\000\169\072\106\221\255\054\202\002\100\237\183\002\085\005\000\226\157\117\122\011\116\115\178\119\141\026\179\077\253\175\187\103\042\160\031\237\047\099\079\039\207\176\059\096\042\094\123\090\118\057\059\213\002\100\237\183\001\150\002\000\153\141\101\005\250\226\172\097\199\145\117\234\127\221\029\083\001\156\219\191\072\105\239\131\003\166\052\114\194\162\196\083\100\100\162\090\021\137\203\198\067\192\020\000\072\016\107\193\064\147\123\234\127\157\101\069\248\003\121\083\221\158\106\250\184\240\121\099\078\209\028\231\144\250\031\082\141\071\118\238\188\079\021\000\136\200\065\010\173\007\224\084\077\157\107\224\170\130\192\172\220\089\091\053\106\035\032\017\145\187\216\180\197\156\219\068\199\224\085\206\089\043\171\063\057\131\164\238\108\219\125\170\012\128\136\076\162\160\099\196\095\164\084\171\113\136\130\218\052\071\247\046\077\085\000\032\034\147\041\160\195\040\166\243\239\185\054\229\008\082\167\194\166\101\084\097\181\166\000\068\100\050\054\226\200\117\058\160\184\206\223\212\232\142\021\151\052\220\028\001\063\230\027\021\000\136\200\164\044\008\120\141\124\176\224\239\089\161\157\255\240\104\120\005\001\241\187\233\252\199\174\076\081\000\032\034\147\179\141\113\094\160\235\060\083\214\063\080\047\080\048\118\040\150\082\046\173\216\051\037\156\243\223\105\089\170\002\000\017\241\194\070\204\236\052\124\029\133\236\027\059\187\108\151\250\237\195\178\059\090\029\016\159\179\163\061\206\162\080\017\160\136\120\023\193\009\130\187\224\198\041\139\148\079\246\243\205\246\009\096\086\068\155\005\133\117\208\189\170\012\128\136\120\103\231\060\156\032\254\108\000\071\183\199\234\252\183\179\207\167\114\215\059\072\040\252\236\015\186\087\149\001\016\145\089\217\232\177\065\092\167\206\049\221\031\197\113\203\169\177\003\132\088\243\161\083\004\231\193\032\122\146\141\168\148\001\016\145\089\113\196\098\199\146\062\065\216\140\000\011\020\217\241\063\226\252\169\058\255\253\176\035\138\164\061\115\199\207\246\009\063\235\169\234\082\148\001\016\145\160\220\008\178\066\119\040\020\015\071\154\227\100\193\155\147\023\145\240\033\076\049\179\140\000\219\114\219\241\223\050\078\127\060\248\091\031\197\168\010\000\068\036\026\214\121\176\227\168\049\093\074\153\015\081\062\060\249\032\093\170\211\159\143\029\020\085\219\085\242\177\209\187\096\097\095\139\046\064\245\186\252\084\001\128\136\068\203\002\130\026\093\193\089\191\181\041\143\171\093\223\154\150\015\205\149\253\154\029\252\085\127\041\181\031\007\203\244\028\015\174\135\216\220\150\165\224\030\019\188\087\131\221\175\255\003\089\213\004\032\089\176\113\214\000\000\000\000\073\069\078\068\174\066\096\130")
				end
				brandSheet = getcustomasset(path)
			end)
		end
		for i, social in ipairs({
			{ "YouTube", "youtube", Color3.fromRGB(230, 48, 61), "https://www.youtube.com/@seisen4", 0 },
			{ "Discord", "message-circle", Color3.fromRGB(88, 101, 242), o.Discord or "https://discord.gg/CQ2tFjkn4C", 128 },
			{ "TikTok", "music-2", Color3.fromRGB(33, 175, 181), "https://www.tiktok.com/@seisen.hub", 256 },
			{ "Website", "globe", Color3.fromRGB(52, 137, 217), o.Website or "https://seisen.vercel.app" },
			{ "Premium", "crown", Color3.fromRGB(177, 124, 37), "https://seisen.vercel.app/premium" },
		}) do
			local btn = New("TextButton", { Name = social[1], Size = UDim2.fromOffset(40, 40), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = socialRow })
			local face
			if brandSheet then
				btn.BackgroundTransparency = 1
				face = New("ImageLabel", { Name = "SmoothSurface", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Image = brandSheet, ImageRectOffset = Vector2.new(384, 0), ImageRectSize = Vector2.new(128, 128), ImageColor3 = Theme.Surface, ResampleMode = Enum.ResamplerMode.Default, Parent = btn })
			else
				Round(btn, 11)
			end
			local icon = NewIcon(btn, social[2], 20, social[3]:Lerp(Theme.Text, 0.3), UDim2.fromOffset(10, 10))
			icon.ZIndex, icon.ResampleMode = 2, Enum.ResamplerMode.Default
			if brandSheet and social[5] then
				icon.Image, icon.ImageRectOffset, icon.ImageRectSize = brandSheet, Vector2.new(social[5], 0), Vector2.new(128, 128)
			end
			btn.MouseEnter:Connect(function()
				if face then Tween(face, { ImageColor3 = social[3] }, 0.18) else Tween(btn, { BackgroundColor3 = social[3] }, 0.18) end
				Tween(icon, { ImageColor3 = Color3.new(1, 1, 1), Position = UDim2.fromOffset(10, 8) }, 0.18)
			end)
			btn.MouseLeave:Connect(function()
				if face then Tween(face, { ImageColor3 = Theme.Surface }, 0.2) else Tween(btn, { BackgroundColor3 = Theme.Surface }, 0.2) end
				Tween(icon, { ImageColor3 = social[3]:Lerp(Theme.Text, 0.3), Position = UDim2.fromOffset(10, 10) }, 0.2)
			end)
			btn.MouseButton1Click:Connect(function()
				if setclipboard then
					setclipboard(socials[social[1]] or social[4])
					self:Notify({ Title = social[1], Content = "Link copied to clipboard", Type = "Success", Duration = 2 })
				end
			end)
		end
	end

	-- executor row
	local executorName, executorOk, executorText = ExecutorStatus(o.SupportedExecutors)
	local executorRow = New("Frame", { Size = UDim2.new(1, -12, 0, 26), BackgroundTransparency = 1, LayoutOrder = 6, Parent = page })
	local statusDot = New("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 4, 0.5, 0), Size = UDim2.fromOffset(7, 7), BackgroundColor3 = executorOk and Theme.Success or Theme.Warning, BorderSizePixel = 0, Parent = executorRow })
	Round(statusDot, 100)
	local statusText = New("Frame", { Position = UDim2.fromOffset(18, 0), Size = UDim2.new(1, -170, 1, 0), BackgroundTransparency = 1, ClipsDescendants = true, Parent = executorRow })
	List(statusText, 8, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
	Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = executorName, TextSize = 12, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 1, Parent = statusText })
	Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = executorText, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = executorOk and Theme.Muted or Theme.Warning, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 2, Parent = statusText })
	local hint = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -2, 0.5, 0), Size = UDim2.fromOffset(0, 22), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, Parent = executorRow })
	List(hint, 6, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
	Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = "Hide with", TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 1, Parent = hint })
	local keyChip = New("Frame", { Size = UDim2.fromOffset(0, 20), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, LayoutOrder = 2, Parent = hint })
	Round(keyChip, 5)
	Stroke(keyChip)
	Pad(keyChip, 6, 0)
	Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = KeyName(self.Keybind), TextSize = 11, FontFace = Fonts.Bold, TextTruncate = Enum.TextTruncate.None, Parent = keyChip })

	-- live stats (shared fps counter lives on the window)
	task.spawn(function()
		while self.Gui.Parent do
			if page.Visible and self.Open then
				if Lib._usage and Lib._usage.executions ~= nil then
					execsValue.Text = FormatCount(Lib._usage.executions)
					liveUsersValue.Text = FormatCount(Lib._usage.live)
				end
				local fps = self.FPS
				local fpsColor = HealthColor(fps, 50, 30)
				fpsValue.Text = tostring(fps)
				if fpsValue.TextColor3 ~= fpsColor then
					Tween(fpsValue, { TextColor3 = fpsColor }, 0.3)
				end
				fpsPush(fps, fpsColor)
				local ping = self:_ping()
				local pingColor = HealthColor(ping, 90, 180, true)
				pingValue.Text = ping .. "ms"
				if pingValue.TextColor3 ~= pingColor then
					Tween(pingValue, { TextColor3 = pingColor }, 0.3)
				end
				pingPush(ping, pingColor)
				playersValue.Text = FormatCount(#Players:GetPlayers()) .. "/" .. FormatCount(Players.MaxPlayers)
				gameSub.Text = (self.GameCreator and ("by " .. self.GameCreator .. "  .  ") or "") .. playersValue.Text .. " players"
				sessionValue.Text = FormatTime(os.clock() - self.SessionStart)
				if featureSubtitle then
					featureSubtitle.Text = self:_featureSummary()
				end
			end
			task.wait(1)
		end
	end)
	return entry
end

function Window:_ping()
	local ok, ping = pcall(function()
		return math.floor(LocalPlayer:GetNetworkPing() * 1000)
	end)
	return ok and ping or 0
end

-- island pill (hidden window) + hover card
function Window:_buildIsland()
	local gui = self.Gui
	local island = New("CanvasGroup", {
		Name = "Island",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, ISLAND.Top),
		Size = UDim2.fromOffset(ISLAND.Width, ISLAND.Height),
		BackgroundColor3 = Color3.new(0, 0, 0),
		BorderSizePixel = 0,
		GroupTransparency = 1,
		Visible = false,
		ZIndex = 30,
		Parent = gui,
	})
	local corner = Round(island, ISLAND.Height / 2)
	local base = CompactFactor(gui)
	local scale = New("UIScale", { Scale = base, Parent = island })
	self._islandBase = base
	self.IsCompact = base < 1 -- on phones the pill always sits top-centre and is not dragged
	self.Island = island
	self._islandScale = scale

	-- compact
	local compact = New("CanvasGroup", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(30, 30, 34), BorderSizePixel = 0, Parent = island })
	New("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), Color3.fromRGB(120, 120, 120)), Parent = compact })
	local orb = New("Frame", {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 5, 0.5, 0),
		Size = UDim2.fromOffset(ISLAND.Height - 10, ISLAND.Height - 10),
		BackgroundColor3 = Theme.Accent,
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		Parent = compact,
	})
	local orbSize = IsAsset(self.LogoIcon) and 20 or 16
	NewIcon(orb, self.LogoIcon, orbSize, Theme.Accent, UDim2.new(0.5, -orbSize / 2, 0.5, -orbSize / 2))
	Label({
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, ISLAND.Height + 2, 0.5, 0),
		Size = UDim2.new(1, -ISLAND.Height - 2 - 72, 0, 18),
		Text = self.Title,
		TextSize = 13,
		FontFace = Fonts.Bold,
		TextColor3 = WHITE,
		Parent = compact,
	})
	local right = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14, 0.5, 0), Size = UDim2.fromOffset(0, 18), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, Parent = compact })
	local rightList = List(right, 7, Enum.FillDirection.Horizontal)
	rightList.HorizontalAlignment = Enum.HorizontalAlignment.Right
	rightList.VerticalAlignment = Enum.VerticalAlignment.Center
	local dot = New("Frame", { Size = UDim2.fromOffset(6, 6), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, LayoutOrder = -1, Parent = right })
	Round(dot, 3)
	local compactTime = Label({ Size = UDim2.fromOffset(0, 18), AutomaticSize = Enum.AutomaticSize.X, Text = "0s", TextSize = 12, FontFace = Fonts.Bold, TextColor3 = Color3.fromRGB(220, 220, 224), TextTruncate = Enum.TextTruncate.None, LayoutOrder = 0, Parent = right })

	-- expanded
	local expanded = New("CanvasGroup", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.fromScale(0.5, 0),
		Size = UDim2.new(0, ISLAND.Wide, 0, 400),
		BackgroundTransparency = 1,
		GroupTransparency = 1,
		Parent = island,
	})
	local content = New("Frame", { Position = UDim2.fromOffset(16, 14), Size = UDim2.new(1, -32, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = expanded })
	List(content, 8)

	local head = New("Frame", { Size = UDim2.new(1, 0, 0, 48), BackgroundTransparency = 1, LayoutOrder = 1, Parent = content })
	local avatar = New("ImageLabel", {
		Size = UDim2.fromOffset(48, 48),
		BackgroundColor3 = Color3.fromRGB(38, 38, 41),
		BorderSizePixel = 0,
		Image = "rbxthumb://type=AvatarHeadShot&id=" .. LocalPlayer.UserId .. "&w=150&h=150",
		Parent = head,
	})
	Round(avatar, 12)
	local avatarPlaceholder = NewIcon(avatar, "user", 20, Theme.Muted, UDim2.new(0.5, -10, 0.5, -10))
	avatarPlaceholder.ImageTransparency = 1
	self:_trackAvatar(avatar, avatarPlaceholder)
	self.IslandName = Label({ Position = UDim2.fromOffset(60, 5), Size = UDim2.new(1, -150, 0, 20), Text = LocalPlayer.DisplayName, TextSize = 15, FontFace = Fonts.Bold, TextColor3 = WHITE, Parent = head })
	self:_trackName(self.IslandName, "Display")
	self.IslandGame = Label({ Position = UDim2.fromOffset(60, 26), Size = UDim2.new(1, -150, 0, 15), Text = "", TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = head })
	local session = Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 3), Size = UDim2.fromOffset(90, 24), Text = "0s", TextSize = 20, FontFace = Fonts.Bold, TextColor3 = WHITE, TextXAlignment = Enum.TextXAlignment.Right, Parent = head })
	Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 27), Size = UDim2.fromOffset(90, 14), Text = "session", TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Right, Parent = head })

	local meters = New("Frame", { Size = UDim2.new(1, 0, 0, 42), BackgroundTransparency = 1, LayoutOrder = 2, Parent = content })
	local function meter(position, caption)
		local m = New("Frame", { Position = position, Size = UDim2.new(0.5, -10, 1, 0), BackgroundTransparency = 1, Parent = meters })
		local value = Label({ Size = UDim2.new(1, -70, 0, 24), Text = "", TextSize = 20, FontFace = Fonts.Bold, TextColor3 = WHITE, RichText = true, Parent = m })
		Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 6), Size = UDim2.fromOffset(70, 14), Text = caption, TextSize = 10, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Right, Parent = m })
		local track = New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, -4), Size = UDim2.new(1, 0, 0, 3), BackgroundColor3 = Color3.fromRGB(38, 38, 42), BorderSizePixel = 0, Parent = m })
		Round(track, 100)
		local fill = New("Frame", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = Theme.Success, BorderSizePixel = 0, Parent = track })
		Round(fill, 100)
		return fill, value
	end
	local fpsFill, fpsText = meter(UDim2.fromScale(0, 0), "FRAME RATE")
	local pingFill, pingText = meter(UDim2.new(0.5, 10, 0, 0), "PING")

	local pills = New("Frame", { Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, LayoutOrder = 3, Parent = content })
	List(pills, 8, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
	local function pill(order, caption, valueColor)
		local p = New("Frame", { Size = UDim2.fromOffset(0, 30), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Color3.fromRGB(32, 32, 35), BorderSizePixel = 0, LayoutOrder = order, Parent = pills })
		Round(p, 100)
		Pad(p, 14, 0)
		local inner = New("Frame", { Size = UDim2.fromScale(0, 1), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, Parent = p })
		List(inner, 7, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
		Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = caption, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 1, Parent = inner })
		return Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, TextSize = 12, FontFace = Fonts.Bold, TextColor3 = valueColor or WHITE, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 2, Parent = inner })
	end
	local playersPill = pill(1, "Players")
	local runningPill = pill(2, "Running", Theme.Accent)
	local tabPill = pill(3, "Tab")
	Label({ Size = UDim2.new(1, 0, 0, 14), Text = "Click or press " .. KeyName(self.Keybind) .. " to open", TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 5, Parent = content })

	local function refresh()
		compactTime.Text = FormatTime(os.clock() - self.SessionStart)
		session.Text = compactTime.Text
		local fps = self.FPS
		local fpsColor = HealthColor(fps, 50, 30)
		Tween(dot, { BackgroundColor3 = fpsColor }, 0.4)
		fpsText.Text = fps .. '<font size="12" color="#8A8A93"> fps</font>'
		Tween(fpsFill, { Size = UDim2.fromScale(math.clamp(fps / 60, 0.05, 1), 1), BackgroundColor3 = fpsColor }, 0.4)
		local ping = self:_ping()
		pingText.Text = ping .. '<font size="12" color="#8A8A93"> ms</font>'
		Tween(pingFill, { Size = UDim2.fromScale(math.clamp(1 - (ping - 40) / 360, 0.05, 1), 1), BackgroundColor3 = HealthColor(ping, 90, 180, true) }, 0.4)
		playersPill.Text = FormatCount(#Players:GetPlayers()) .. "/" .. FormatCount(Players.MaxPlayers)
		runningPill.Text = tostring(self.Running or 0)
		tabPill.Text = self.Current and self.Current.Name or "-"
	end
	task.spawn(function()
		while island.Parent do
			if island.Visible and not self.Open then
				refresh()
			end
			task.wait(0.5)
		end
	end)

	-- state machine
	local state, serial = "Compact", 0
	local hover, pressedOn, dragged, dragStart, dragOrigin = false, false, false, nil, nil
	local posTween, sizeTween, cornerTween
	local screenAnchor -- Vector2 of top-centre, nil = default

	local function sizeOf(name)
		if name == "Expanded" then
			return Vector2.new(ISLAND.Wide, math.floor(content.AbsoluteSize.Y + 28 + 0.5)), ISLAND.Radius
		end
		return Vector2.new(ISLAND.Width, ISLAND.Height), ISLAND.Height / 2
	end
	local function anchor()
		return screenAnchor or Vector2.new(gui.AbsoluteSize.X / 2, ISLAND.Top)
	end
	local function clampAnchor(size, a)
		local screen = gui.AbsoluteSize
		return Vector2.new(
			math.clamp(a.X, size.X / 2 + 6, math.max(screen.X - size.X / 2 - 6, size.X / 2 + 6)),
			math.clamp(a.Y, 6, math.max(screen.Y - size.Y - 6, 6))
		)
	end
	local function place(size, time, style)
		local target = clampAnchor(size, anchor())
		if posTween then
			posTween:Cancel()
		end
		if time and time > 0 then
			posTween = Tween(island, { Position = UDim2.fromOffset(target.X, target.Y) }, time, style)
		else
			island.Position = UDim2.fromOffset(target.X, target.Y)
		end
	end
	-- the screen was resized: put the pill back where its anchor now is (top-centre unless dragged)
	self._islandReplace = function()
		place((sizeOf(state)))
	end
	local groups = { Compact = compact, Expanded = expanded }
	local function go(name, instant)
		local changed = name ~= state
		state = name
		serial += 1
		local mine = serial
		local size, radius = sizeOf(name)
		local current = Vector2.new(island.Size.X.Offset, island.Size.Y.Offset)
		local growing = size.X > current.X + 1 or size.Y > current.Y + 1
		local time = instant and 0 or (growing and 0.5 or 0.38)
		if sizeTween then
			sizeTween:Cancel()
		end
		if cornerTween then
			cornerTween:Cancel()
		end
		place(size, time)
		sizeTween = Tween(island, { Size = UDim2.fromOffset(size.X, size.Y) }, time, growing and Enum.EasingStyle.Back or Enum.EasingStyle.Quint)
		cornerTween = Tween(corner, { CornerRadius = UDim.new(0, radius) }, time)
		if changed or instant then
			if not instant and not pressedOn and not dragged then
				scale.Scale = (growing and 0.96 or 1.03) * base
				Tween(scale, { Scale = base }, growing and 0.55 or 0.4, Enum.EasingStyle.Back)
			end
			for n, g in pairs(groups) do
				if n ~= name then
					Tween(g, { GroupTransparency = 1 }, instant and 0 or 0.14, Enum.EasingStyle.Quad)
				end
			end
			local g = groups[name]
			if instant then
				g.GroupTransparency = 0
				if g == expanded then
					g.Position = UDim2.fromScale(0.5, 0)
				end
			else
				if g == expanded then
					g.Position = UDim2.new(0.5, 0, 0, 6)
				end
				task.delay(0.1, function()
					if serial == mine then
						Tween(g, { GroupTransparency = 0 }, 0.22, Enum.EasingStyle.Quad)
						if g == expanded then
							Tween(g, { Position = UDim2.fromScale(0.5, 0) }, 0.32)
						end
					end
				end)
			end
		end
	end
	self._islandReset = function()
		hover, pressedOn, dragged, dragStart = false, false, false, nil
		scale.Scale = base
		go("Compact", true)
	end

	self._islandLand = function()
		self._islandReset()
		local size = Vector2.new(ISLAND.Width, ISLAND.Height)
		local a = clampAnchor(size, anchor())
		return Vector2.new(a.X - size.X / 2, a.Y), size
	end

	local hit = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 10, Parent = island })
	local hoverId = 0
	hit.MouseEnter:Connect(function()
		if dragged then
			return
		end
		hover = true
		hoverId += 1
		local mine = hoverId
		if state == "Expanded" then
			return
		end
		if not pressedOn then
			Tween(scale, { Scale = 1.04 * base }, 0.18)
		end
		task.delay(0.12, function()
			if hoverId == mine and hover and not self.Open and not dragged then
				refresh()
				go("Expanded")
			end
		end)
	end)
	hit.MouseLeave:Connect(function()
		hover = false
		hoverId += 1
		local mine = hoverId
		if not pressedOn then
			Tween(scale, { Scale = base }, 0.25)
		end
		task.delay(state == "Expanded" and 0.28 or 0.1, function()
			if hoverId == mine and not hover and not self.Open then
				go("Compact")
			end
		end)
	end)
	hit.InputBegan:Connect(function(input)
		if IsPress(input) then
			pressedOn, dragged = true, false
			Tween(scale, { Scale = 0.95 * base }, 0.12, Enum.EasingStyle.Quad)
			dragStart = Vector2.new(input.Position.X, input.Position.Y)
			dragOrigin = clampAnchor(Vector2.new(island.Size.X.Offset, island.Size.Y.Offset), anchor())
		end
	end)
	self:_listen(UserInputService.InputChanged, function(input)
		if not dragStart or not IsMove(input) or self.Open or self.IsCompact then
			return
		end
		local delta = Vector2.new(input.Position.X, input.Position.Y) - dragStart
		if not dragged then
			if delta.Magnitude < 6 then
				return
			end
			dragged, hover = true, false
			go("Compact")
			Tween(scale, { Scale = 1.06 * base }, 0.2)
		end
		local size = Vector2.new(ISLAND.Width, ISLAND.Height)
		screenAnchor = clampAnchor(size, dragOrigin + delta)
		if posTween then
			posTween:Cancel()
		end
		island.Position = UDim2.fromOffset(screenAnchor.X, screenAnchor.Y)
	end)
	self:_listen(UserInputService.InputEnded, function(input)
		if not IsPress(input) or not pressedOn then
			return
		end
		pressedOn, dragStart = false, nil
		Tween(scale, { Scale = base }, 0.35, Enum.EasingStyle.Back)
		if dragged then
			local home = Vector2.new(gui.AbsoluteSize.X / 2, ISLAND.Top)
			if screenAnchor and (screenAnchor - home).Magnitude < 28 then
				screenAnchor = nil
				place(Vector2.new(ISLAND.Width, ISLAND.Height), 0.35, Enum.EasingStyle.Back)
			end
			task.delay(0.1, function()
				dragged = false
			end)
		end
	end)
	hit.MouseButton1Click:Connect(function()
		if dragged then
			return
		end
		if not self.Open then
			self:Restore()
		end
	end)
	self._islandGo = go
end

local function MorphGhost(win, pos, size, radius)
	-- a rapid minimize/restore skips the old ghost's cleanup, so drop any leftover before making the next
	if win._ghost then
		win._ghost:Destroy()
	end
	local ghost = New("Frame", {
		Position = UDim2.fromOffset(pos.X, pos.Y),
		Size = UDim2.fromOffset(size.X, size.Y),
		BackgroundColor3 = Theme.Background,
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ZIndex = 29,
		Parent = win.Gui,
	})
	win._ghost = ghost
	local corner = Round(ghost, radius)
	local stroke = Stroke(ghost, Theme.Stroke, 1, 1)
	return ghost, corner, stroke
end

local function MorphTo(ghost, corner, pos, size, radius, time)
	Tween(ghost, { Position = UDim2.fromOffset(pos.X, pos.Y), Size = UDim2.fromOffset(size.X, size.Y) }, time)
	Tween(corner, { CornerRadius = UDim.new(0, radius) }, time)
end

local function MorphOut(ghost, stroke, time)
	Tween(ghost, { BackgroundTransparency = 1 }, time, Enum.EasingStyle.Quad)
	Tween(stroke, { Transparency = 1 }, time, Enum.EasingStyle.Quad)
	task.delay(time + 0.02, function()
		ghost:Destroy()
	end)
end

function Window:Minimize()
	if not self.Open then
		return
	end
	self.Open = false
	self.Generation = (self.Generation or 0) + 1
	local gen = self.Generation
	if self._closePopup then
		self._closePopup()
	end
	local pos = self.Root.AbsolutePosition - self.Gui.AbsolutePosition
	local size = self.Root.AbsoluteSize
	local ghost, corner, stroke = MorphGhost(self, pos, size, 12)
	Tween(ghost, { BackgroundTransparency = 0 }, 0.11, Enum.EasingStyle.Quad)
	Tween(stroke, { Transparency = 0 }, 0.11, Enum.EasingStyle.Quad)
	Tween(self.RootScale, { Scale = 0.985 * (self.BaseScale or 1) }, 0.11, Enum.EasingStyle.Quad)
	self.Island.Visible = true
	self.Island.GroupTransparency = 1
	task.delay(0.11, function()
		if self.Generation ~= gen then
			return
		end
		self.Root.Visible = false
		self.RootScale.Scale = self.BaseScale or 1
		local landPos, landSize = self._islandLand()
		MorphTo(ghost, corner, landPos, landSize, math.floor(landSize.Y / 2), 0.36)
		task.delay(0.3, function()
			if self.Generation ~= gen then
				return
			end
			self._islandScale.Scale = 0.9 * self._islandBase
			Tween(self._islandScale, { Scale = self._islandBase }, 0.3)
			Tween(self.Island, { GroupTransparency = 0 }, 0.18, Enum.EasingStyle.Quad)
			MorphOut(ghost, stroke, 0.2)
		end)
	end)
end

function Window:Restore()
	if self.Open then
		return
	end
	self.Open = true
	self.Generation = (self.Generation or 0) + 1
	local gen = self.Generation
	local gui = self.Gui
	local size = self.Root.AbsoluteSize
	local center = self.Root.AbsolutePosition + size / 2 - gui.AbsolutePosition
	local target = center - size / 2
	local fromPos, fromSize = target, size
	if self.Island.Visible then
		fromPos = self.Island.AbsolutePosition - gui.AbsolutePosition
		fromSize = self.Island.AbsoluteSize
		self._islandReset()
		Tween(self.Island, { GroupTransparency = 1 }, 0.12, Enum.EasingStyle.Quad)
		task.delay(0.12, function()
			if self.Generation == gen then
				self.Island.Visible = false
			end
		end)
	end
	local ghost, corner, stroke = MorphGhost(self, fromPos, fromSize, math.floor(math.min(fromSize.X, fromSize.Y) / 2))
	Tween(ghost, { BackgroundTransparency = 0 }, 0.1, Enum.EasingStyle.Quad)
	Tween(stroke, { Transparency = 0 }, 0.1, Enum.EasingStyle.Quad)
	MorphTo(ghost, corner, target, size, 12, 0.4)
	task.delay(0.3, function()
		if self.Generation ~= gen then
			return
		end
		self.RootScale.Scale = self.BaseScale or 1
		self.Root.GroupTransparency = 0
		self.Root.Visible = true
	end)
	task.delay(0.4, function()
		if self.Generation == gen then
			MorphOut(ghost, stroke, 0.22)
		end
	end)
end

-- highlight a control (used by the feature list)
function Window:_flash(target, radius)
	for _, name in ipairs({ "SearchFlash", "SearchGlow" }) do
		local old = target:FindFirstChild(name)
		if old then
			old:Destroy()
		end
	end
	radius = radius or 8
	local accent = Theme.Accent
	local bright = accent:Lerp(Color3.new(1, 1, 1), 0.65)
	local glow = New("Frame", { Name = "SearchGlow", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 10, Parent = target })
	Round(glow, radius)
	local glowStroke = New("UIStroke", { Color = accent, Thickness = 1, Transparency = 1, ApplyStrokeMode = Enum.ApplyStrokeMode.Border, Parent = glow })
	local flash = New("Frame", { Name = "SearchFlash", Size = UDim2.fromScale(1, 1), BackgroundColor3 = accent, BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 10, Parent = target })
	Round(flash, radius)
	local sheen = New("UIGradient", {
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.7),
			NumberSequenceKeypoint.new(0.4, 0.55),
			NumberSequenceKeypoint.new(0.5, 0),
			NumberSequenceKeypoint.new(0.6, 0.55),
			NumberSequenceKeypoint.new(1, 0.7),
		}),
		Rotation = 18,
		Offset = Vector2.new(-1, 0),
		Parent = flash,
	})
	local ring = New("UIStroke", { Color = Color3.new(1, 1, 1), Thickness = 1.6, Transparency = 1, ApplyStrokeMode = Enum.ApplyStrokeMode.Border, Parent = flash })
	local ringGradient = New("UIGradient", {
		Color = ColorSequence.new({ ColorSequenceKeypoint.new(0, accent), ColorSequenceKeypoint.new(0.5, bright), ColorSequenceKeypoint.new(1, accent) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.45), NumberSequenceKeypoint.new(0.5, 0), NumberSequenceKeypoint.new(1, 0.45) }),
		Parent = ring,
	})
	local inner = pcall(function()
		glowStroke.BorderStrokePosition = Enum.BorderStrokePosition.Inner
		ring.BorderStrokePosition = Enum.BorderStrokePosition.Inner
	end)
	local thick = inner and 6 or 3
	if not inner then
		glow.Position = UDim2.fromOffset(thick + 1, thick + 1)
		glow.Size = UDim2.new(1, -(thick + 1) * 2, 1, -(thick + 1) * 2)
		flash.Position = UDim2.fromOffset(2, 2)
		flash.Size = UDim2.new(1, -4, 1, -4)
	end
	local scale
	if not target:FindFirstChildOfClass("UIScale") then
		scale = New("UIScale", { Scale = 0.975, Parent = target })
		Tween(scale, { Scale = 1 }, 0.4)
	end
	Tween(flash, { BackgroundTransparency = 0.8 }, 0.2, Enum.EasingStyle.Quad)
	Tween(ring, { Transparency = 0 }, 0.2, Enum.EasingStyle.Quad)
	Tween(glowStroke, { Thickness = thick, Transparency = 0.72 }, 0.35)
	Tween(sheen, { Offset = Vector2.new(1, 0) }, 0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut)
	Tween(ringGradient, { Rotation = 540 }, 2.2, Enum.EasingStyle.Quad)
	task.spawn(function()
		task.wait(0.75)
		Tween(flash, { BackgroundTransparency = 0.9 }, 0.35, Enum.EasingStyle.Sine)
		Tween(glowStroke, { Thickness = thick / 2, Transparency = 0.85 }, 0.35, Enum.EasingStyle.Sine)
		task.wait(0.35)
		Tween(flash, { BackgroundTransparency = 0.84 }, 0.3, Enum.EasingStyle.Sine)
		Tween(glowStroke, { Thickness = thick * 0.85, Transparency = 0.76 }, 0.3, Enum.EasingStyle.Sine)
		task.wait(0.4)
		Tween(flash, { BackgroundTransparency = 1 }, 0.55, Enum.EasingStyle.Quad)
		Tween(ring, { Transparency = 1 }, 0.65, Enum.EasingStyle.Quad)
		Tween(glowStroke, { Thickness = thick, Transparency = 1 }, 0.65, Enum.EasingStyle.Quad)
		task.wait(0.7)
		flash:Destroy()
		glow:Destroy()
		if scale then
			scale:Destroy()
		end
	end)
end

-- jump to a control from the feature list and highlight it
function Window:_reveal(item, radius)
	self:SelectPage(item.Tab)
	local wasCollapsed = item.GroupObj and item.GroupObj.IsCollapsed and item.GroupObj:IsCollapsed()
	if wasCollapsed then
		item.GroupObj:SetCollapsed(false)
	end
	task.spawn(function()
		task.wait()
		task.wait()
		local page, frame = item.Tab.Page, item.Frame
		if not frame.Parent then
			return
		end
		local offset = frame.AbsolutePosition.Y - page.AbsolutePosition.Y + page.CanvasPosition.Y
		local maxScroll = math.max(page.AbsoluteCanvasSize.Y - page.AbsoluteSize.Y, 0)
		local goal = math.clamp(offset + frame.AbsoluteSize.Y / 2 - page.AbsoluteSize.Y / 2, 0, maxScroll)
		if math.abs(goal - page.CanvasPosition.Y) > 2 then
			Tween(page, { CanvasPosition = Vector2.new(0, goal) }, 0.45)
			task.wait(0.25)
		end
		if frame.Parent then
			self:_flash(frame, radius or 8)
		end
	end)
end

function Window:Toggle()
	if self.Open then
		self:Minimize()
	else
		self:Restore()
	end
end

function Window:Destroy()
	for _, registry in ipairs({ Lib.Toggles, Lib.Options, Lib.Labels }) do
		for flag, obj in pairs(registry) do
			if obj.Frame and obj.Frame:IsDescendantOf(self.Gui) then
				registry[flag] = nil
			end
		end
	end
	for flag, handle in pairs(Lib.Flags) do
		if handle.Frame and handle.Frame:IsDescendantOf(self.Gui) then
			Lib.Flags[flag] = nil
		end
	end
	for _, c in ipairs(self.Connections) do
		c:Disconnect()
	end
	self.Gui:Destroy()
	for i, w in ipairs(Lib.Windows) do
		if w == self then
			table.remove(Lib.Windows, i)
			break
		end
	end
	if #Lib.Windows == 0 and Lib._usage then
		local state = Lib._usage
		state.closed = true
		if not state.busy then
			task.spawn(function() Lib:_SupabaseRPC("library_leave", { p_session = state.session }) end)
		end
	end
	if #Lib.Windows == 0 and Lib._trackstat then
		Lib:_TrackstatClose(Lib._trackstat)
	end
end
Window.Unload = Window.Destroy

function Lib:CreateWindow(o)
	o = Opts(o, { Name = "Title", LoadingSubtitle = "Subtitle", ToggleUIKeybind = "Keybind", ToggleKeybind = "Keybind" })
	if type(o.Keybind) == "string" then
		o.Keybind = Enum.KeyCode[o.Keybind]
	end
	local self = setmetatable({
		Title = o.Title or "Seisen UI",
		Subtitle = (function()
			if o.SubTitle or o.Version then
				return (o.SubTitle or "") .. ((o.SubTitle and o.Version) and "  ·  " or "") .. (o.Version or "")
			end
			return o.Subtitle or ""
		end)(),
		Keybind = o.Keybind or Enum.KeyCode.LeftAlt,
		LogoIcon = (o.Icon == nil or o.Icon == "rbxassetid://108392837079013" or o.Icon == "rbxassetid://84012214673060" or o.Icon == "rbxassetid://140648321855248") and "rbxassetid://83859339194823" or o.Icon,
		Pages = {},
		Controls = {},
		Connections = {},
		Open = true,
		HomeEnabled = o.Home ~= false,
		ScriptUrl = o.ScriptUrl,
		SessionStart = os.clock(),
		FPS = 60,
		Names = {},
		Avatars = {},
		_pending = {},
		_pendingObjects = {},
		Groups = {},
		_configListeners = {},
		HideName = false,
		HideAvatar = false,
	}, Window)

	Lib.FolderName = o.Folder
	self:_applyDefaultTheme()

	local gui = New("ScreenGui", { Name = "SeisenUI_" .. self.Title, ResetOnSpawn = false, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, IgnoreGuiInset = true, DisplayOrder = 1000000 })
	pcall(function()
		if syn and syn.protect_gui then
			syn.protect_gui(gui)
		end
	end)
	ParentGui(gui, o.Parent)
	self.Gui = gui
	Lib.ScreenGui = gui
	Lib.ToggleKeybind = self.Keybind
	self.Options, self.Toggles = Lib.Options, Lib.Toggles
	table.insert(Lib.Windows, self)

	local size = o.Size or UDim2.fromOffset(760, 520)
	local root = New("CanvasGroup", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = size,
		BackgroundColor3 = Theme.Background,
		BorderSizePixel = 0,
		Parent = gui,
	})
	Round(root, 12)
	Stroke(root, Theme.Stroke)
	self.Root = root
	self.RootScale = New("UIScale", { Parent = root })
	self:_setBaseScale(o.Scale or Lib._baseScale or 1)
	self:_listen(root:GetPropertyChangedSignal("Size"), function() self:_setBaseScale() end)
	-- Position uses offsets so the drag/clamp math stays in pixels.
	task.defer(function() self:_followScreen() end)

	-- sidebar
	local sidebar = New("Frame", { Size = UDim2.new(0, 188, 1, 0), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = root })
	New("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.new(0, 1, 1, 0), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = sidebar })
	local brand = New("Frame", { Size = UDim2.new(1, 0, 0, 68), BackgroundTransparency = 1, Parent = sidebar })
	local logo = New("Frame", { Position = UDim2.fromOffset(10, 10), Size = UDim2.fromOffset(48, 48), BackgroundTransparency = 1, BorderSizePixel = 0, Parent = brand })
	local logoSize = IsAsset(self.LogoIcon) and 32 or 24
	NewIcon(logo, self.LogoIcon, logoSize, Theme.Accent, UDim2.new(0.5, -logoSize / 2, 0.5, -logoSize / 2))
	Label({ Position = UDim2.fromOffset(62, 15), Size = UDim2.new(1, -70, 0, 20), Text = self.Title, TextSize = 14, FontFace = Fonts.Bold, Parent = brand })
	Label({ Position = UDim2.fromOffset(62, 35), Size = UDim2.new(1, -70, 0, 14), Text = self.Subtitle, TextSize = 10, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = brand })

	self.TabList = New("ScrollingFrame", {
		Position = UDim2.fromOffset(8, 72),
		Size = UDim2.new(1, -16, 1, -72 - 76),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 0,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		Parent = sidebar,
	})
	List(self.TabList, 4)
	Pad(self.TabList, 2, 2, 2, 2)

	local profile = New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 8, 1, -8), Size = UDim2.new(1, -16, 0, 56), BackgroundColor3 = Theme.Surface2, BorderSizePixel = 0, Parent = sidebar })
	Round(profile, 10)
	Stroke(profile, Theme.Stroke)
	self.ProfileAvatar = New("ImageLabel", {
		Position = UDim2.fromOffset(8, 12),
		Size = UDim2.fromOffset(32, 32),
		BackgroundColor3 = Theme.Surface3,
		BorderSizePixel = 0,
		Image = "rbxthumb://type=AvatarHeadShot&id=" .. LocalPlayer.UserId .. "&w=100&h=100",
		Parent = profile,
	})
	Round(self.ProfileAvatar, 16)
	local profilePlaceholder = NewIcon(self.ProfileAvatar, "user", 14, Theme.Muted, UDim2.new(0.5, -7, 0.5, -7))
	profilePlaceholder.ImageTransparency = 1
	self:_trackAvatar(self.ProfileAvatar, profilePlaceholder)
	local online = New("Frame", { Position = UDim2.fromOffset(30, 34), Size = UDim2.fromOffset(9, 9), BackgroundColor3 = Theme.Success, BorderSizePixel = 0, Parent = profile })
	Round(online, 5)
	Stroke(online, Theme.Surface2, 2)
	self.ProfileName = Label({ Position = UDim2.fromOffset(48, 11), Size = UDim2.new(1, -78, 0, 18), Text = LocalPlayer.DisplayName, TextSize = 12, FontFace = Fonts.Bold, Parent = profile })
	self:_trackName(self.ProfileName, "Display")
	self.ProfileGame = Label({ Position = UDim2.fromOffset(48, 29), Size = UDim2.new(1, -78, 0, 14), Text = "", TextSize = 10, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = profile })
	NewIcon(profile, "chevron-right", 14, Theme.Muted, UDim2.new(1, -24, 0.5, -7))

	-- content
	local main = New("Frame", { Position = UDim2.fromOffset(188, 0), Size = UDim2.new(1, -188, 1, 0), BackgroundColor3 = Theme.Background, BorderSizePixel = 0, Parent = root })
	local header = New("Frame", { Size = UDim2.new(1, 0, 0, 64), BackgroundTransparency = 1, Parent = main })
	self.PageIcon = NewIcon(header, "house", 18, Theme.Accent, UDim2.fromOffset(24, 23))
	self.PageIcon.AnchorPoint, self.PageIcon.Position = Vector2.new(0.5, 0.5), UDim2.fromOffset(33, 32)
	self.PageIconGhost = self.PageIcon:Clone()
	self.PageIconGhost.Name, self.PageIconGhost.ImageTransparency, self.PageIconGhost.Parent = "PageIconOutgoing", 1, header
	self.PageTitle = Label({ Position = UDim2.fromOffset(52, 0), Size = UDim2.new(1, -330, 1, 0), Text = "", TextSize = 20, FontFace = Fonts.Bold, Parent = header })

	self:_buildSearch(header)

	local minimize = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -56, 0.5, 0), Size = UDim2.fromOffset(30, 30), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = header })
	local minimizeIcon = NewIcon(minimize, "minimize-2", 16, Theme.Muted, UDim2.fromOffset(7, 7))
	minimize.MouseEnter:Connect(function()
		Tween(minimizeIcon, { ImageColor3 = Theme.Accent }, 0.15)
	end)
	minimize.MouseLeave:Connect(function()
		Tween(minimizeIcon, { ImageColor3 = Theme.Muted }, 0.2)
	end)
	minimize.MouseButton1Click:Connect(function()
		self:Minimize()
	end)

	local close = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -20, 0.5, 0), Size = UDim2.fromOffset(30, 30), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = header })
	local closeIcon = NewIcon(close, "x", 16, Theme.Muted, UDim2.fromOffset(7, 7))
	close.MouseEnter:Connect(function()
		Tween(closeIcon, { ImageColor3 = Theme.Error }, 0.15)
	end)
	close.MouseLeave:Connect(function()
		Tween(closeIcon, { ImageColor3 = Theme.Muted }, 0.2)
	end)
	close.MouseButton1Click:Connect(function()
		Lib:Unload()
	end)

	self.PageHolder = New("Frame", { Position = UDim2.fromOffset(32, 76), Size = UDim2.new(1, -64, 1, -100), BackgroundTransparency = 1, ClipsDescendants = true, Parent = main })
	self.Toasts = New("Frame", { Name = "Notifications", AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -20, 1, -20), Size = UDim2.new(0, 280, 1, -40), BackgroundTransparency = 1, ZIndex = 50, Parent = gui })
	New("UIScale", { Scale = CompactFactor(gui), Parent = self.Toasts })
	List(self.Toasts, 4).VerticalAlignment = Enum.VerticalAlignment.Bottom
	self.NotifyOrder, self.ToastList, self.MaxNotifications = 0, {}, o.MaxNotifications or 4
	self:_listen(gui:GetPropertyChangedSignal("AbsoluteSize"), function()
		self:_setBaseScale()
		self:_followScreen()
		if self._islandReplace then
			self._islandReplace()
		end
		self.Toasts.Size = UDim2.new(0, math.min(280, gui.AbsoluteSize.X - 40), 1, -40)
	end)

	-- fps counter shared by Home + island
	local frames, last = 0, os.clock()
	self:_listen(RunService.RenderStepped, function()
		if Lib._usage then Lib:_UpdateUsage() end
		if Lib._trackstat then Lib:_UpdateTrackstat() end
		if self._serverHopStep then self._serverHopStep() end
		frames += 1
		local now = os.clock()
		if now - last >= 0.5 then
			self.FPS = math.floor(frames / (now - last) + 0.5)
			frames, last = 0, now
		end
	end)

	if self.HomeEnabled then
		local home = self:_buildHome(o)
		self.HomeEntry = home
	end
	self:_buildIsland()
	self:_enableResize(o.MinSize or Vector2.new(480, 360), o.MaxSize)
	self:_enableDrag({ header, brand })

	self:_listen(UserInputService.InputBegan, function(input, processed)
		if not processed and input.KeyCode == self:_toggleKey() then
			self:Toggle()
		end
	end)

	if self.HomeEnabled then
		self:SelectPage(self.HomeEntry)
	end
	if o.Scale then
		Lib:SetScale(o.Scale)
	end
	Lib:_buildBuiltIns(self, o)
	-- saved autoload config is applied after the script has built its controls (same timing as the old library)
	task.delay(0.6, function()
		if self.Gui.Parent then
			self:LoadAutoload()
		end
	end)
	return self
end

Lib.Window = Lib.CreateWindow

function Lib:Notify(o)
	local w = Lib.Windows[#Lib.Windows]
	if w then
		w:Notify(o)
	end
end

function Lib:Destroy()
	for i = #Lib.Windows, 1, -1 do
		Lib.Windows[i]:Destroy()
	end
end
Lib.Unload = Lib.Destroy

---------------------------------------------------------------- Seisen API compatibility
-- The old SeisenUI_New API (CreateWindow / AddTab / AddLeftSection / Add* / Toggles / Options / Notify ...)
-- drawn with the NewUI look. Option names, return objects and callback timing follow the old library.

Lib.Toggles, Lib.Options, Lib.Labels = {}, {}, {}
Lib.NotificationsEnabled = true
Lib.IsMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled
Lib.IsNew = true
Lib.IntroOngoing = false
Lib.KeybindRows = {}
Lib.KeybindConnections = {}
Lib.OpenDropdowns = {}
Lib.Registry = {}

-- ------------------------------------------------------------ theme (old keys read from the new theme)
do
	local White = Color3.new(1, 1, 1)
	local oldGet = {
		Background = function() return Theme.Background end,
		Sidebar = function() return Theme.Surface end,
		SidebarActive = function() return Theme.Surface3 end,
		Content = function() return Theme.Surface end,
		Element = function() return Theme.Surface2 end,
		ElementHover = function() return Theme.Surface3 end,
		InputBg = function() return Theme.Surface end,
		Border = function() return Theme.Stroke end,
		BorderLight = function() return Theme.StrokeHover end,
		Accent = function() return Theme.Accent end,
		AccentHover = function() return Theme.Accent:Lerp(White, 0.2) end,
		AccentDark = function() return Theme.AccentDark end,
		Text = function() return Theme.Text end,
		TextDim = function() return Theme.Muted:Lerp(Theme.Text, 0.3) end,
		TextMuted = function() return Theme.Muted end,
		Toggle = function() return Theme.Accent end,
		ToggleOff = function() return Theme.Surface3 end,
		Success = function() return Theme.Success end,
		Warning = function() return Theme.Warning end,
		Error = function() return Theme.Error end,
		Info = function() return Theme.Muted end,
		LightContrast = function() return Theme.Surface3 end,
	}
	-- only the primary colours are written back; the rest are derived
	local oldToNew = {
		Background = "Background", Element = "Surface2", Border = "Stroke", Accent = "Accent",
		AccentDark = "AccentDark", Text = "Text", TextMuted = "Muted", ToggleOff = "Surface3",
		Success = "Success", Warning = "Warning", Error = "Error",
	}
	local pending, queued = {}, false
	local function flush()
		queued = false
		local out
		for k, v in pairs(pending) do
			local key = oldToNew[k]
			if key and typeof(v) == "Color3" then
				out = out or {}
				out[key] = v
			end
		end
		pending = {}
		if out then
			Lib:SetTheme(out)
		end
	end
	Lib.Theme = setmetatable({}, {
		__index = function(_, k)
			if pending[k] ~= nil then
				return pending[k]
			end
			local g = oldGet[k]
			if g then
				return g()
			end
			return Theme[k]
		end,
		__newindex = function(_, k, v)
			pending[k] = v
			if not queued then
				queued = true
				task.defer(flush)
			end
		end,
	})
	function Lib:UpdateColorsUsingRegistry()
		flush()
	end
	function Lib:RegisterElement() end
end

-- ------------------------------------------------------------ small helpers
local function Num(v)
	return tostring(tonumber(string.format("%.10g", v)))
end

local function Opt(o)
	if type(o) == "string" then
		return { Name = o, Text = o }
	end
	return o or {}
end

local function CurrentWindow()
	return Lib.Windows[#Lib.Windows]
end

function Lib:GetIcon(name)
	local img = Instance.new("ImageLabel")
	Icon(img, name)
	local url = img.Image
	img:Destroy()
	return { Url = url, ImageRectOffset = Vector2.zero, ImageRectSize = Vector2.zero }
end

function Lib:ApplyIcon(element, name)
	Icon(element, name)
end

function Lib:Create(class, props, children)
	local inst = Instance.new(class)
	for k, v in pairs(props or {}) do
		if k ~= "Parent" then
			inst[k] = v
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = inst
	end
	inst.Parent = props and props.Parent
	return inst
end

function Lib:CloseAllDropdowns()
	local win = CurrentWindow()
	if win and win._closePopup then
		win._closePopup()
	end
end

-- ------------------------------------------------------------ tooltip
local TipGui, TipFrame, TipLabel, TipConnection
function Lib:ShowTooltip(text)
	local win = CurrentWindow()
	if not win or type(text) ~= "string" or text == "" then
		return
	end
	if not TipFrame or not TipFrame.Parent then
		TipFrame = New("Frame", { BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Size = UDim2.fromOffset(0, 0), AutomaticSize = Enum.AutomaticSize.XY, ZIndex = 80, Visible = false, Parent = win.Gui })
		Round(TipFrame, 8)
		Stroke(TipFrame, Theme.StrokeHover)
		Pad(TipFrame, 10, 6, 10, 6)
		TipLabel = Label({ Size = UDim2.fromOffset(0, 0), AutomaticSize = Enum.AutomaticSize.XY, TextSize = 12, FontFace = Fonts.Regular, TextWrapped = false, TextTruncate = Enum.TextTruncate.None, ZIndex = 81, Parent = TipFrame })
	end
	TipLabel.Text = text
	TipFrame.Visible = true
	if TipConnection then
		TipConnection:Disconnect()
	end
	TipConnection = RunService.RenderStepped:Connect(function()
		if not TipFrame or not TipFrame.Parent then
			return
		end
		local m = MousePos()
		local screen = win.Gui.AbsoluteSize
		local size = TipFrame.AbsoluteSize
		local x = math.clamp(m.X + 14, 6, math.max(screen.X - size.X - 6, 6))
		local y = math.clamp(m.Y + 18, 6, math.max(screen.Y - size.Y - 6, 6))
		TipFrame.Position = UDim2.fromOffset(x - win.Gui.AbsolutePosition.X, y - win.Gui.AbsolutePosition.Y)
	end)
end

function Lib:HideTooltip()
	if Lib.TooltipThread then
		pcall(task.cancel, Lib.TooltipThread)
		Lib.TooltipThread = nil
	end
	if TipConnection then
		TipConnection:Disconnect()
		TipConnection = nil
	end
	if TipFrame then
		TipFrame.Visible = false
	end
end

-- ------------------------------------------------------------ notifications
-- remove GUIs a previous instance of the library left behind (matched by exact name only)
local function SweepOrphans()
	for _, parent in ipairs({ game:GetService("CoreGui"), LocalPlayer:FindFirstChildOfClass("PlayerGui") }) do
		pcall(function()
			for _, g in ipairs(parent:GetChildren()) do
				if g.Name == "SeisenNotify" or g.Name == "SeisenWidget" or g.Name == "SeisenFlyPad" then
					g:Destroy()
				end
			end
		end)
	end
end

local function NotifyHost()
	if Lib._notifyHost and Lib._notifyHost.Gui.Parent then
		return Lib._notifyHost
	end
	SweepOrphans()
	local gui = New("ScreenGui", { Name = "SeisenNotify", ResetOnSpawn = false, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, IgnoreGuiInset = true, DisplayOrder = 1000010 })
	ParentGui(gui)
	local toasts = New("Frame", { Name = "Notifications", AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -20, 1, -20), Size = UDim2.new(0, 280, 1, -40), BackgroundTransparency = 1, ZIndex = 50, Parent = gui })
	New("UIScale", { Scale = CompactFactor(gui), Parent = toasts })
	List(toasts, 4).VerticalAlignment = Enum.VerticalAlignment.Bottom
	Lib._notifyHost = setmetatable({ Gui = gui, Toasts = toasts, NotifyOrder = 0, ToastList = {}, MaxNotifications = 4, Connections = {} }, Window)
	return Lib._notifyHost
end

Window._notify = Window.Notify
function Lib:Notify(o)
	o = o or {}
	if Lib.NotificationsEnabled == false then
		return
	end
	local kind = type(o.Type) == "string" and o.Type:lower() or "info"
	local opts = {
		Title = o.Title or "Notification",
		Content = o.Content or "",
		Duration = o.Duration or 3,
		Type = (kind == "success" and "Success") or (kind == "warning" and "Warning") or (kind == "error" and "Error") or nil,
		Color = o.Color,
		Icon = o.Image or o.Icon or (kind == "success" and "circle-check") or (kind == "warning" and "triangle-alert") or (kind == "error" and "circle-x") or "info",
	}
	local win = CurrentWindow()
	local host = (win and win.Toasts and win) or NotifyHost()
	return Window._notify(host, opts)
end

function Window:Notify(o)
	return Lib:Notify(o)
end

-- ------------------------------------------------------------ game lock / unload
function Lib:SetGameId(gameId)
	local current = game.GameId
	local ok = false
	if type(gameId) == "table" then
		for _, id in ipairs(gameId) do
			if current == id then
				ok = true
				break
			end
		end
	else
		ok = current == gameId
	end
	if not ok then
		Lib:Notify({ Title = "Unauthorized Game", Content = "This script won't work on this game.", Duration = 5 })
		return false
	end
	return true
end

function Lib:OnUnload(fn)
	self._unloadFn = fn
end

function Lib:SetScale(scale)
	Lib._baseScale = math.clamp(scale, 0.5, 2)
	for _, win in ipairs(Lib.Windows) do
		win:_setBaseScale(Lib._baseScale)
	end
end

function Lib:Toggle()
	local win = CurrentWindow()
	if win then
		win:Toggle()
	end
end

function Lib:Unload()
	if self._unloadFn then
		local fn = self._unloadFn
		self._unloadFn = nil
		pcall(fn)
	end
	for _, conn in ipairs(self.KeybindConnections) do
		pcall(function()
			conn:Disconnect()
		end)
	end
	self.KeybindConnections = {}
	pcall(function()
		for _, toggle in pairs(self.Toggles) do
			if toggle.SetValue and toggle.Value then
				pcall(toggle.SetValue, toggle, false)
			end
		end
	end)
	if self._stopFly then
		pcall(self._stopFly)
	end
	pcall(function()
		local char = LocalPlayer.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then
			if self._originalWalkSpeed ~= nil then
				hum.WalkSpeed = self._originalWalkSpeed
			end
			if self._originalJumpPower ~= nil then
				hum.UseJumpPower = self._originalUseJumpPower
				if hum.UseJumpPower then
					hum.JumpPower = self._originalJumpPower
				else
					hum.JumpHeight = self._originalJumpPower
				end
			end
		end
	end)
	self:CloseAllDropdowns()
	self:HideTooltip()
	for i = #Lib.Windows, 1, -1 do
		Lib.Windows[i]:Destroy()
	end
	for _, g in pairs({ widget = self._widgetGui, keybind = self._keybindGui, notify = Lib._notifyHost and Lib._notifyHost.Gui }) do
		pcall(function()
			g:Destroy()
		end)
	end
	self._widgetGui, self._keybindGui, self._statsWidget, Lib._notifyHost = nil, nil, nil, nil
	SweepOrphans()
	self.Toggles, self.Options, self.Labels, self.Flags = {}, {}, {}, {}
	self.KeybindRows, self.KeybindFrame = {}, nil
end
Lib.Destroy = Lib.Unload
function Window:Unload()
	Lib:Unload()
end

-- ------------------------------------------------------------ common element behaviour
local function Finish(self, o, obj, row)
	obj.Frame = row
	obj.Instance = obj.Instance or row
	obj._disabled = o.Disabled or false
	obj._visible = o.Visible ~= false
	obj._tooltip = o.Tooltip
	obj._disabledTooltip = o.DisabledTooltip
	SetUserVisible(row, obj._visible)

	local veil = New("Frame", { Name = "Veil", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 0.4, BorderSizePixel = 0, Active = true, Visible = obj._disabled, ZIndex = 30, Parent = row })
	if obj.Type == "Button" and obj.Button then
		veil.Position, veil.Size = obj.Button.Position, obj.Button.Size
		veil.BackgroundColor3, veil.BackgroundTransparency = Theme.Surface, 0.5
		Round(veil, 8)
		local lock = NewIcon(veil, "lock", 12, Theme.Muted, UDim2.new(1, -22, 0.5, -6))
		lock.ZIndex = 31
	end
	function obj:SetVisible(v)
		self._visible = v
		SetUserVisible(row, v)
	end
	function obj:SetDisabled(d, reason)
		if reason ~= nil then self._disabledTooltip = reason end
		self._disabled = d == true
		veil.Visible = self._disabled
		if self._disabled and self.SetOpen then self:SetOpen(false) end
	end
	function obj:SetTooltip(t)
		self._tooltip = t
	end
	do
		row.MouseEnter:Connect(function()
			local tip = obj._disabled and obj._disabledTooltip or obj._tooltip
			if not tip then
				return
			end
			if Lib.TooltipThread then
				pcall(task.cancel, Lib.TooltipThread)
			end
			Lib.TooltipThread = task.delay(0.2, function()
				Lib:ShowTooltip(tip)
			end)
		end)
		row.MouseLeave:Connect(function()
			Lib:HideTooltip()
		end)
	end
	return obj
end

-- saved values that arrived before the control existed
local function ApplyEntry(entry)
	local function set(registry, value, ...)
		local obj = registry[entry.idx]
		if obj and obj.SetValue then
			obj:SetValue(value, ...)
		end
		return obj
	end
	if entry.type == "Toggle" then
		local t = set(Lib.Toggles, entry.value)
		if t and entry.keybind and t.SetKeybind then
			local k = Enum.KeyCode[entry.keybind]
			if k then
				t:SetKeybind(k)
			end
		end
	elseif entry.type == "Slider" then
		set(Lib.Options, tonumber(entry.value))
	elseif entry.type == "Dropdown" then
		set(Lib.Options, entry.value)
	elseif entry.type == "Keybind" then
		set(Lib.Options, Enum.KeyCode[entry.value] or Enum.KeyCode.Unknown)
	elseif entry.type == "ColorPicker" then
		set(Lib.Options, Color3.fromHex(entry.value))
	elseif entry.type == "Input" then
		if entry.text ~= nil then
			set(Lib.Options, tostring(entry.text))
		end
	elseif entry.type == "Flag" then
		local h = Lib.Flags[entry.idx]
		if h and h.Set then
			h:Set(Decode(entry.value))
		end
	end
end
Lib._applyEntry = ApplyEntry

local function RegisterOld(self, flag, registry, obj)
	if not flag then
		return
	end
	Lib[registry][flag] = obj
	local win = self.Window
	local pend = win and win._pendingObjects and win._pendingObjects[flag]
	if pend then
		win._pendingObjects[flag] = nil
		task.defer(function()
			pcall(ApplyEntry, pend)
		end)
	end
end

local function Fire(obj)
	for _, fn in ipairs(obj._listeners or {}) do
		pcall(fn, obj.Value)
	end
end

-- ------------------------------------------------------------ Label / Button / Toggle / Slider / Keybind
function Container:AddLabel(o)
	o = Opt(o)
	local h = self:Label({ Text = o.Text or o.Name or "Label", TextWrapped = o.TextWrapped, Height = o.Height })
	h.SetText = h.Set
	h.Type = "Label"
	if o.Flag then
		Lib.Labels[o.Flag] = h
	end
	return h
end

function Container:AddButton(o)
	o = Opt(o)
	local name = o.Name or "Button"
	local callback = o.Callback or function() end
	local obj
	local waiting, last = false, 0
	local h = self:Button({
		Name = name,
		Style = o.Style,
		Risky = o.Risky,
		Icon = o.Icon,
		Callback = function()
			if obj and obj._disabled then
				return
			end
			Lib:CloseAllDropdowns()
			if o.ConfirmText and not waiting then
				waiting = true
				obj:SetText(o.ConfirmText)
				return
			end
			waiting = false
			obj:SetText(name)
			if o.DoubleClick then
				local now = tick()
				if now - last < 0.4 then
					last = 0
					callback()
				else
					last = now
				end
			else
				callback()
			end
		end,
	})
	obj = h
	obj.Type = "Button"
	if o.ConfirmText and obj.Button then
		obj.Button.MouseLeave:Connect(function()
			if waiting then
				waiting = false
				obj:SetText(name)
			end
		end)
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

local function ToggleKeybindChip(self, row, o, obj, keybind)
	local win = self.Window
	local chip = New("TextButton", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -(14 + 36 + 10), 0.5, 0),
		Size = UDim2.fromOffset(40, 20),
		BackgroundColor3 = Theme.Surface,
		BorderSizePixel = 0,
		Text = KeyName(keybind ~= Enum.KeyCode.Unknown and keybind or nil),
		TextColor3 = Theme.Accent,
		TextSize = 11,
		FontFace = Fonts.Bold,
		AutoButtonColor = false,
		ZIndex = 2,
		Visible = not Lib.IsMobile,
		Parent = row,
	})
	Round(chip, 5)
	local stroke = Stroke(chip)
	local title = row:FindFirstChildWhichIsA("TextLabel")
	if title then
		title.Size = UDim2.new(1, -(14 + 36 + 10 + 40 + 12), title.Size.Y.Scale, title.Size.Y.Offset)
	end
	local listening = false
	local function show()
		chip.Text = listening and "..." or KeyName(obj.Keybind ~= Enum.KeyCode.Unknown and obj.Keybind or nil)
		Tween(stroke, { Color = listening and Theme.Accent or Theme.Stroke }, 0.15)
		local w = math.max(chip.TextBounds.X + 14, 34)
		chip.Size = UDim2.fromOffset(w, 20)
		if title then
			title.Size = UDim2.new(1, -(14 + 36 + 10 + w + 12), title.Size.Y.Scale, title.Size.Y.Offset)
		end
		chip.Position = UDim2.new(1, -(14 + 36 + 10), 0.5, 0)
	end
	function obj:SetKeybind(key)
		self.Keybind = key or Enum.KeyCode.Unknown
		show()
		Lib:_refreshKeybinds()
	end
	chip.MouseButton1Click:Connect(function()
		listening = true
		show()
	end)
	win:_listen(UserInputService.InputBegan, function(input, processed)
		if obj._disabled then return end
		if listening and input.UserInputType == Enum.UserInputType.Keyboard then
			listening = false
			if input.KeyCode == Enum.KeyCode.Backspace or input.KeyCode == Enum.KeyCode.Escape then
				obj.Keybind = Enum.KeyCode.Unknown
			else
				local conflicts = win:GetKeybindConflicts(input.KeyCode, obj)
				if #conflicts > 0 then
					win:Notify({ Title = "Key already used", Content = table.concat(conflicts, ", "), Type = "Warning" })
				else
					obj.Keybind = input.KeyCode
				end
			end
			show()
			Lib:_refreshKeybinds()
		elseif not listening and not processed and obj.Keybind ~= Enum.KeyCode.Unknown and input.KeyCode == obj.Keybind then
			if not obj._disabled then
				obj:SetValue(not obj.Value)
			end
		end
	end)
	show()
end

function Container:AddToggle(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local obj
	local keybind = o.Keybind or Enum.KeyCode.Unknown
	local h = self:Toggle({
		Name = o.Name or "Toggle",
		Default = o.Default or false,
		Callback = function(v)
			if obj then
				obj.Value = v
			end
			callback(v)
			if obj then
				Fire(obj)
				if obj._kbUpdate then
					pcall(obj._kbUpdate)
				end
			end
		end,
	})
	obj = h
	obj.Type = "Toggle"
	obj.Name = o.Name or "Toggle"
	obj.Keybind = keybind
	obj.Value = h.Value
	local setNative = h.Set
	function obj:SetValue(val)
		val = val and true or false
		if val ~= self.Value then
			setNative(self, val)
		else
			self.Value = val
			callback(val)
			Fire(self)
		end
	end
	Finish(self, o, obj, h.Frame)
	if o.Keybind ~= nil then
		ToggleKeybindChip(self, h.Frame, o, obj, keybind)
		obj._kbUpdate = Lib:RegisterKeybindRow(o.Name or o.Flag, function()
			return obj.Keybind
		end, true, function()
			return obj.Value
		end)
	end
	RegisterOld(self, o.Flag, "Toggles", obj)
	return obj
end

function Container:AddSlider(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local obj
	local h = self:Slider({
		Name = o.Name or "Slider",
		Min = o.Min,
		Max = o.Max,
		Default = o.Default,
		Step = o.Increment or 1,
		Suffix = o.Suffix,
		Prefix = o.Prefix,
		Callback = function(v)
			if obj then
				obj.Value = v
			end
			callback(v)
			if obj then
				Fire(obj)
			end
		end,
	})
	obj = h
	obj.Type = "Slider"
	local nativeSet = h.Set
	function obj:SetValue(val)
		nativeSet(self, tonumber(val) or self.Value, true)
		self.Value = h.Value
		callback(self.Value)
		Fire(self)
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

function Container:AddKeybind(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local default = o.Default or Enum.KeyCode.Unknown
	local obj
	local h = self:Keybind({
		Name = o.Name or "Keybind",
		Default = default ~= Enum.KeyCode.Unknown and default or nil,
		ClearOnEscape = true,
		OnChanged = function(key)
			key = key or Enum.KeyCode.Unknown
			if obj then
				obj.Value = key
			end
			callback(key)
			if obj then
				Fire(obj)
			end
		end,
	})
	obj = h
	obj.Type = "Keybind"
	obj.Value = default
	local nativeSet = h.Set
	function obj:SetValue(key)
		key = key or Enum.KeyCode.Unknown
		nativeSet(self, key ~= Enum.KeyCode.Unknown and key or nil, true)
		self.Value = key
		callback(key)
		Fire(self)
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

-- ------------------------------------------------------------ Dropdown / SearchableDropdown
local function DropdownImpl(self, o, forceSearch)
	o = Opt(o)
	local callback = o.Callback or function() end
	local items = {}
	for i, v in ipairs(o.Options or o.Items or {}) do
		items[i] = v
	end
	local multi = o.Multi == true
	local function toDict(val)
		local dict = {}
		if type(val) == "table" then
			for k, v in pairs(val) do
				if type(k) == "number" and type(v) == "string" then
					dict[v] = true
				elseif type(k) == "string" and v then
					dict[k] = true
				end
			end
		elseif val ~= nil then
			dict[val] = true
		end
		return dict
	end
	local function toList(dict)
		local list = {}
		for _, item in ipairs(items) do
			if dict[item] then
				table.insert(list, item)
			end
		end
		return list
	end
	local value
	if multi then
		value = o.Default and toDict(o.Default) or {}
	else
		value = o.Default or items[1]
	end
	local obj
	local h = self:Dropdown({
		Name = o.Name or "Dropdown",
		Options = items,
		Multi = multi,
		Default = multi and toList(value) or value,
		Searchable = forceSearch or o.Search == true,
		MaxRows = o.MaxVisible or 6,
		SelectAllText = o.SelectAllText,
		ClearAllText = o.UnselectAllText or o.ClearAllText,
		GetOptions = o.GetOptions,
		AllowNone = false,
		Callback = function(v)
			if multi then
				value = toDict(v)
			else
				value = v
			end
			if obj then
				obj.Value = value
			end
			callback(value)
			if obj then
				Fire(obj)
			end
		end,
	})
	obj = h
	obj.Type = "Dropdown"
	obj.Multi = multi
	obj.Value = value
	local nativeSet, nativeRefresh = h.Set, h.Refresh
	function obj:SetValue(val)
		if multi then
			value = toDict(val)
			nativeSet(self, toList(value), true)
		else
			local valid = val == nil or val == "None"
			for _, item in ipairs(items) do
				if tostring(item) == tostring(val) then
					valid = true
					val = item
					break
				end
			end
			value = valid and val or (o.Default or items[1] or "None")
			nativeSet(self, value ~= "None" and value or nil, true)
		end
		self.Value = value
		callback(value)
		Fire(self)
	end
	function obj:Refresh(newList, reset)
		local previous = multi and toList(value) or value
		items = table.clone(newList or {})
		nativeRefresh(self, items, true, true)
		if multi then
			value = reset and {} or toDict(toList(value))
			nativeSet(self, toList(value), true)
		else
			if reset or not table.find(items, value) then
				value = table.find(items, o.Default) and o.Default or items[1]
			end
			nativeSet(self, value, true)
		end
		self.Value = value
		if (multi and #previous ~= #toList(value)) or (not multi and previous ~= value) then
			callback(value)
			Fire(self)
		end
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

function Container:AddDropdown(o)
	return DropdownImpl(self, o, false)
end

function Container:AddSearchableDropdown(o)
	return DropdownImpl(self, o, true)
end

-- ------------------------------------------------------------ Textbox
function Container:AddTextbox(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local obj
	local h = self:Input({
		Name = o.Name or "Textbox",
		Placeholder = o.Placeholder or "",
		Default = o.Default or "",
		ClearTextOnFocus = o.ClearTextOnFocus ~= false,
		Numeric = o.Numeric, Min = o.Min, Max = o.Max, Required = o.Required, Validate = o.Validate,
		Callback = function(text)
			if obj then
				obj.Value = text
			end
			callback(text)
			if obj then
				Fire(obj)
			end
		end,
	})
	obj = h
	obj.Type = "Input"
	obj.Value = h:Get()
	if h.TextBox then
		h.TextBox:GetPropertyChangedSignal("Text"):Connect(function()
			obj.Value = h:Get()
		end)
	end
	local nativeSet = h.Set
	function obj:SetValue(v)
		local ok, reason = nativeSet(self, v, true)
		if not ok then return false, reason end
		self.Value = h:Get()
		callback(self.Value)
		Fire(self)
		return true
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

-- several text boxes on one row (shared caption on top)
local function MultiTextbox(self, list, caption)
	local row, entry = self:_row(54, caption, "Input")
	Label({ Position = UDim2.fromOffset(14, 2), Size = UDim2.new(1, -28, 0, 14), Text = caption, TextSize = 11, TextColor3 = Theme.Muted, FontFace = Fonts.Regular, Parent = row })
	local count = #list
	local objs = {}
	for i, o in ipairs(list) do
		local callback = o.Callback or function() end
		local frame = New("Frame", {
			Position = UDim2.new((i - 1) / count, (i == 1 and 14 or 4), 0, 20),
			Size = UDim2.new(1 / count, -(i == 1 and 18 or (i == count and 18 or 8)) + (i == 1 and 4 or 0), 0, 28),
			BackgroundColor3 = Theme.Surface,
			BorderSizePixel = 0,
			Parent = row,
		})
		Round(frame, 6)
		local stroke = Stroke(frame)
		local box = New("TextBox", {
			Position = UDim2.fromOffset(8, 0),
			Size = UDim2.new(1, -16, 1, 0),
			BackgroundTransparency = 1,
			Text = o.Default or "",
			PlaceholderText = o.Placeholder or "",
			PlaceholderColor3 = Theme.Muted,
			TextColor3 = Theme.Text,
			TextSize = 12,
			FontFace = Fonts.Regular,
			TextXAlignment = Enum.TextXAlignment.Left,
			ClearTextOnFocus = o.ClearTextOnFocus ~= false,
			TextTruncate = Enum.TextTruncate.AtEnd,
			ClipsDescendants = true,
			Parent = frame,
		})
		local obj = { Type = "Input", Value = box.Text }
		box.Focused:Connect(function()
			Tween(stroke, { Color = Theme.Accent }, 0.15)
		end)
		box.FocusLost:Connect(function()
			Tween(stroke, { Color = Theme.Stroke }, 0.15)
			obj.Value = box.Text
			callback(box.Text)
			Fire(obj)
		end)
		box:GetPropertyChangedSignal("Text"):Connect(function()
			obj.Value = box.Text
		end)
		function obj:SetValue(v)
			box.Text = tostring(v or "")
			self.Value = box.Text
			callback(self.Value)
			Fire(self)
		end
		Finish(self, o, obj, row)
		RegisterOld(self, o.Flag, "Options", obj)
		objs[i] = obj
	end
	return table.unpack(objs)
end

function Container:AddDualTextbox(o1, o2)
	o1, o2 = Opt(o1), Opt(o2)
	return MultiTextbox(self, { o1, o2 }, o1.Label or "Dual Textbox")
end

function Container:AddTripleTextbox(o1, o2, o3)
	o1, o2, o3 = Opt(o1), Opt(o2), Opt(o3)
	return MultiTextbox(self, { o1, o2, o3 }, o1.Label or "Triple Textbox")
end

-- ------------------------------------------------------------ Checkbox
function Container:AddCheckbox(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local state = o.Default or false
	local row, entry = self:_row(ROW, o.Name, "Toggle")
	local btn = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = row })
	Title(row, o.Name or "Checkbox", nil, 50)
	local box = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14, 0.5, 0), Size = UDim2.fromOffset(18, 18), BackgroundColor3 = Theme.Surface2, BorderSizePixel = 0, Parent = row })
	Round(box, 5)
	local stroke = Stroke(box, Theme.Stroke)
	local check = New("ImageLabel", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(12, 12), BackgroundTransparency = 1, ImageColor3 = Theme.AccentDark, ImageTransparency = 1, ScaleType = Enum.ScaleType.Fit, Parent = box })
	Icon(check, "check")
	local scale = New("UIScale", { Parent = check })
	local obj = { Type = "Toggle", Name = o.Name or "Checkbox", Value = state }
	local function render(animate)
		local t = animate and 0.18 or 0
		Tween(box, { BackgroundColor3 = state and Theme.Accent or Theme.Surface2 }, t)
		Tween(stroke, { Color = state and Theme.Accent or Theme.Stroke }, t)
		Tween(check, { ImageTransparency = state and 0 or 1 }, t)
		if animate and state then
			scale.Scale = 0.5
			Tween(scale, { Scale = 1 }, 0.3, Enum.EasingStyle.Back)
		end
	end
	function obj:SetValue(v)
		state = v and true or false
		self.Value = state
		render(true)
		callback(state)
		Fire(self)
	end
	btn.MouseButton1Click:Connect(function()
		if obj._disabled then
			return
		end
		Lib:CloseAllDropdowns()
		obj:SetValue(not state)
	end)
	render(false)
	Finish(self, o, obj, row)
	RegisterOld(self, o.Flag, "Toggles", obj)
	if state then
		callback(true)
	end
	return obj
end

-- ------------------------------------------------------------ ColorPicker / ProgressBar
function Container:AddColorPicker(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local default = o.Default or Color3.fromRGB(82, 148, 246)
	local obj
	local h = self:ColorPicker({
		Name = o.Name or "Color",
		Default = default,
		Callback = function(c)
			if obj then
				obj.Value = c
			end
			callback(c)
			if obj then
				Fire(obj)
			end
		end,
	})
	obj = h
	obj.Type = "ColorPicker"
	obj.Value = default
	local nativeSet = h.Set
	function obj:SetValue(c)
		nativeSet(self, c, true)
		self.Value = c
		callback(c)
		Fire(self)
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

function Container:AddProgressBar(o)
	o = Opt(o)
	local max = o.Max or 100
	local suffix = o.Suffix or ""
	local value = o.Default or 0
	local h = self:Progress({
		Name = o.Name or "Progress",
		Default = math.clamp(value / max, 0, 1),
		Format = function(frac)
			return Num(frac * max) .. suffix
		end,
	})
	local obj = h
	obj.Type = "ProgressBar"
	obj.Value = value
	function obj:SetValue(v)
		v = math.clamp(tonumber(v) or 0, 0, max)
		h.Set(self, v / max, true)
		h.Render()
		self.Value = v
	end
	function obj:SetMax(m)
		max = m
		self:SetValue(self.Value)
	end
	Finish(self, o, obj, h.Frame)
	RegisterOld(self, o.Flag, "Options", obj)
	return obj
end

-- ------------------------------------------------------------ Divider / Paragraph / Space / Badge / TooltipLabel
function Container:AddDivider(text)
	local o = type(text) == "string" and { Text = text } or Opt(text)
	local h = self:Divider({ Text = o.Text })
	h.Instance = h.Frame
	return h
end

function Container:AddParagraph(o)
	o = Opt(o)
	local h = self:Paragraph({ Name = o.Title or o.Name or "", Content = o.Content or o.Text or "" })
	h.SetContent = h.Set
	h.Instance = h.Frame
	return h
end

function Container:AddSpace(height)
	local row = self:_row(type(height) == "number" and height or 8, nil, "Space")
	return {}
end

function Container:AddBadge(o)
	o = Opt(o)
	local color = o.Color or Theme.Accent
	local row, entry = self:_row(32, o.Name, "Badge")
	if (o.Name or "") ~= "" then
		Label({ Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -90, 1, 0), Text = o.Name, TextSize = 13, Parent = row })
	end
	local pill = New("TextLabel", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -14, 0.5, 0),
		Size = UDim2.fromOffset(0, 24),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = Theme.Surface,
		BackgroundTransparency = 0,
		Text = o.Text or "Badge",
		TextColor3 = color,
		TextSize = 10,
		FontFace = Fonts.Bold,
		TextTruncate = Enum.TextTruncate.None,
		Parent = row,
	})
	Round(pill, (o.Style or "pill") == "pill" and 6 or 2)
	Pad(pill, 20, 0, 9, 0)
	local dot = New("Frame", { Position = UDim2.new(0, -12, 0.5, -3), Size = UDim2.fromOffset(6, 6), BackgroundColor3 = color, BorderSizePixel = 0, Parent = pill })
	Round(dot, 2)
	local stroke = Stroke(pill, color, 1, 0.6)
	local obj = { Instance = pill }
	function obj:SetText(t)
		pill.Text = t
	end
	function obj:SetColor(c)
		pill.TextColor3, dot.BackgroundColor3, stroke.Color = c, c, c
	end
	Finish(self, o, obj, row)
	obj.Instance = pill
	return obj
end

function Container:AddTooltipLabel(o)
	o = Opt(o)
	local row, entry = self:_row(30, o.Text, "Label")
	local lbl = Label({ Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -58, 1, 0), Text = o.Text or "", TextSize = 13, FontFace = Fonts.Medium, TextColor3 = Theme.Text, Parent = row })
	local q = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14, 0.5, 0), Size = UDim2.fromOffset(22, 22), BackgroundColor3 = Theme.Surface2, Text = "i", TextColor3 = Theme.Muted, TextSize = 10, FontFace = Fonts.Bold, AutoButtonColor = false, Parent = row })
	Round(q, 6)
	Stroke(q)
	local tip = o.Tooltip or ""
	q.MouseEnter:Connect(function()
		Lib:ShowTooltip(tip)
	end)
	q.MouseLeave:Connect(function()
		Lib:HideTooltip()
	end)
	local obj = { Instance = row }
	function obj:SetText(t)
		lbl.Text = t
	end
	return Finish(self, {}, obj, row)
end

function Container:AddLiveLabel(o)
	o = Opt(o)
	local getValue = o.GetValue or function()
		return "-"
	end
	local interval = o.Interval or 1
	local prefix, suffix = o.Prefix or "", o.Suffix or ""
	local row, entry = self:_row(36, o.Name, "Label")
	local box = New("Frame", { Position = UDim2.fromOffset(12, 2), Size = UDim2.new(1, -24, 1, -4), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
	Round(box, 6)
	Pad(box, 10, 0, 10, 0)
	if (o.Name or "") ~= "" then
		Label({ Size = UDim2.new(0.45, 0, 1, 0), Text = string.upper(o.Name), TextSize = 10, FontFace = Fonts.Bold, TextColor3 = Theme.Muted, Parent = box })
	end
	local value = Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.new(0.55, 0, 1, 0), Text = prefix .. "-" .. suffix, TextSize = 13, FontFace = Font.fromEnum(Enum.Font.Code), TextColor3 = Theme.Accent, TextXAlignment = Enum.TextXAlignment.Right, Parent = box })
	local running = false
	local obj = {}
	local function loop()
		while running and row:IsDescendantOf(game) do
			local ok, v = pcall(getValue)
			if ok then
				value.Text = prefix .. tostring(v) .. suffix
			end
			task.wait(interval)
		end
		running = false
	end
	function obj:SetInterval(s)
		interval = s
	end
	function obj:Stop()
		running = false
	end
	function obj:Start()
		if running then
			return
		end
		running = true
		task.spawn(loop)
	end
	obj:Start()
	return Finish(self, {}, obj, row)
end

---------------------------------------------------------------- Seisen API: window / tabs / sections
function Window:_nextSideOrder(builtIn)
	if builtIn then
		self._builtOrder = (self._builtOrder or 10000) + 1
		return self._builtOrder
	end
	self._sideOrder = (self._sideOrder or 0) + 1
	return self._sideOrder
end

function Window:AddSidebarSection(label, isBuiltIn)
	local holder = New("Frame", { Size = UDim2.new(1, 0, 0, 26), BackgroundTransparency = 1, LayoutOrder = self:_nextSideOrder(isBuiltIn), Parent = self.TabList })
	Label({ Position = UDim2.fromOffset(8, 8), Size = UDim2.new(1, -16, 0, 14), Text = string.upper(label or ""), TextSize = 10, TextColor3 = Theme.Muted, Parent = holder })
end

function Window:AddSidebarDivider(isBuiltIn)
	local holder = New("Frame", { Size = UDim2.new(1, 0, 0, 9), BackgroundTransparency = 1, LayoutOrder = self:_nextSideOrder(isBuiltIn), Parent = self.TabList })
	New("Frame", { Position = UDim2.fromOffset(8, 4), Size = UDim2.new(1, -16, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = holder })
end

function Window:AddSidebarSpace(height)
	New("Frame", { Size = UDim2.new(1, 0, 0, type(height) == "number" and height or 8), BackgroundTransparency = 1, LayoutOrder = self:_nextSideOrder(false), Parent = self.TabList })
end

function Window:AddTab(name, iconName, isBuiltIn)
	local tab = self:Tab({ Name = name, Icon = iconName }, nil, isBuiltIn)
	tab._entry.BuiltIn = isBuiltIn == true
	return tab
end

function Window:_setBaseScale(scale)
	self._requestedScale = scale or self._requestedScale or 1
	local viewport = self.Gui.AbsoluteSize
	if (viewport.X == 0 or viewport.Y == 0) and workspace.CurrentCamera then
		viewport = workspace.CurrentCamera.ViewportSize
	end
	if viewport.X == 0 or viewport.Y == 0 then return end
	local size = self.Root.Size
	local fit = math.min(viewport.X / (size.X.Offset + 32), viewport.Y / (size.Y.Offset + 32))
	self.BaseScale = math.min(fit, math.clamp(math.min(1, fit) * CompactFactor(self.Gui) * self._requestedScale, 0.25, 2))
	self.RootScale.Scale = self.BaseScale
end

function Window:SetScale(scale)
	Lib:SetScale(scale)
end

-- the built-in "Open / Close Key" setting changes Lib.ToggleKeybind
function Window:_toggleKey()
	return Lib.ToggleKeybind or self.Keybind
end

-- tab object ------------------------------------------------------------------
function Tab:AddLeftSection(name, icon)
	return self:Groupbox({ Name = name, Icon = icon, Side = "Left" })
end

function Tab:AddRightSection(name, icon)
	return self:Groupbox({ Name = name, Icon = icon, Side = "Right" })
end

function Tab:AddSection(name, icon)
	return self:Groupbox({ Name = name, Icon = icon, Side = "Full" })
end

function Tab:CreateSection(options, sideArg, iconArg)
	local name, side, icon
	if type(options) == "string" then
		name, side, icon = options, sideArg or "Left", iconArg
	else
		options = options or {}
		name, side, icon = options.Name or "Section", options.Side or "Left", options.Icon
	end
	return self:Groupbox({ Name = name, Icon = icon, Side = side })
end

function Tab:SetNotification(value)
	local badge = self._entry.Badge
	if not badge then
		return
	end
	if not value or value == 0 or value == "" then
		badge.Frame.Visible = false
	else
		badge.Label.Text = tostring(value)
		badge.Frame.Visible = true
	end
end

function Tab:ClearNotification()
	self:SetNotification(nil)
end

-- sections inside sections / free-standing sections
function Lib:CreateSection(parent, name, iconName)
	local win = CurrentWindow()
	local host = setmetatable({ Window = win, Left = parent, Right = parent, Counts = { 0, 0 }, _entry = win and win.Current }, Tab)
	return host:Groupbox({ Name = name, Icon = iconName, Side = "Left" })
end

function Groupbox:CreateSection(opts)
	opts = Opt(opts)
	local row = self:_row(0, opts.Name, "Section")
	row.AutomaticSize = Enum.AutomaticSize.Y
	Pad(row, 14, 4, 14, 4)
	List(row, 0)
	local host = setmetatable({ Window = self.Window, Left = row, Right = row, Counts = { 0, 0 }, _entry = self.Tab }, Tab)
	return host:Groupbox({ Name = opts.Name or "Section", Icon = opts.Icon, Side = "Left" })
end

-- changelog -------------------------------------------------------------------
local ChangeTagColors = { Added = "#57F287", Fixed = "#ED4245", Improved = "#5865F2" }
local function FormatChangeLine(text)
	local tag, rest = tostring(text):match("^%[(%a+)%]%s*(.*)$")
	if not tag then
		return text
	end
	return '<font color="' .. (ChangeTagColors[tag] or "#A0A0B0") .. '">[' .. tag .. "]</font> " .. rest
end

function Window:ShowChangelog(entries)
	if not entries or #entries == 0 or self._changelogTab then
		return
	end
	local tab = self:AddTab("Changelog", "list", true)
	tab._entry.Button.LayoutOrder = 10000
	for i, entry in ipairs(entries) do
		local title = tostring(entry.Version or "") .. "  ·  " .. tostring(entry.Date or "") .. (i == 1 and "  (Latest)" or "")
		local section = tab:AddSection(title, i == 1 and "sparkles" or "clock")
		local lines = {}
		for _, change in ipairs(entry.Changes or {}) do
			table.insert(lines, FormatChangeLine(change))
		end
		section:AddParagraph({ Content = table.concat(lines, "\n") })
		if i > 1 then section:SetCollapsed(true) end
	end
	self._changelogTab = tab
end

---------------------------------------------------------------- Seisen API: remaining elements
function Container:AddImage(o)
	o = Opt(o)
	local size = o.Size or UDim2.new(1, 0, 0, 80)
	local height = size.Y.Offset > 0 and size.Y.Offset or 80
	local row = self:_row(height + 12, nil, "Image")
	local stage = New("Frame", { Position = UDim2.fromOffset(12, 4), Size = UDim2.new(size.X.Scale, size.X.Offset - 24, 0, height), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = row })
	Round(stage, o.Corner or 8)
	Stroke(stage, Theme.Stroke, 1, 0.25)
	New("UIGradient", { Rotation = 35, Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.fromRGB(150, 150, 150)), Parent = stage })
	local img = New("ImageLabel", { Position = UDim2.fromOffset(12, 12), Size = UDim2.new(1, -24, 1, -24), BackgroundTransparency = 1, Image = o.Image or "rbxassetid://0", ScaleType = Enum.ScaleType.Fit, Parent = stage })
	return Finish(self, {}, { Instance = row, Image = img }, row)
end

function Container:AddViewport(o)
	o = Opt(o)
	local size = o.Size or UDim2.new(1, 0, 0, 100)
	local height = size.Y.Offset > 0 and size.Y.Offset or 100
	local row = self:_row(height + 12, nil, "Viewport")
	local vp = New("ViewportFrame", { Position = UDim2.fromOffset(12, 4), Size = UDim2.new(size.X.Scale, size.X.Offset - 24, 0, height), BackgroundColor3 = Theme.Surface, Ambient = Color3.fromRGB(160, 160, 160), LightColor = Theme.Text, LightDirection = Vector3.new(-1, -1, -1), BorderSizePixel = 0, Parent = row })
	Round(vp, 8)
	Stroke(vp, Theme.Stroke, 1, 0.25)
	Label({ Position = UDim2.fromOffset(10, 8), Size = UDim2.new(1, -20, 0, 14), Text = "3D PREVIEW", TextSize = 9, FontFace = Fonts.Bold, TextColor3 = Theme.Muted, Parent = vp })
	local cam = Instance.new("Camera")
	cam.Parent = vp
	vp.CurrentCamera = cam
	if o.Model then
		local clone = o.Model:Clone()
		clone.Parent = vp
		local cf, sz = clone:GetBoundingBox()
		cam.CFrame = CFrame.new(cf.Position + Vector3.new(sz.X * 1.5, sz.Y, sz.Z * 1.7), cf.Position)
	end
	return Finish(self, {}, { Instance = vp, Viewport = vp, Camera = cam }, row)
end

function Container:AddDependencyBox(o)
	o = Opt(o)
	local invert = o.Invert or false
	local row = self:_row(0, nil, "DependencyBox")
	row.AutomaticSize = Enum.AutomaticSize.Y
	List(row, 4)
	local flags = type(o.DependsOn) == "table" and o.DependsOn or (o.DependsOn and { o.DependsOn } or {})
	local function check()
		local all = true
		for _, flag in ipairs(flags) do
			if not (Lib.Toggles[flag] and Lib.Toggles[flag].Value) then
				all = false
				break
			end
		end
		-- same expression as the old library (Invert never hides the box there)
		SetUserVisible(row, invert and not all or all)
	end
	for _, flag in ipairs(flags) do
		local t = Lib.Toggles[flag]
		if t then
			t._listeners = t._listeners or {}
			table.insert(t._listeners, check)
		end
	end
	check()
	return { Instance = row, Frame = row }
end

function Container:AddCodeBlock(o)
	o = Opt(o)
	local code = o.Code or ""
	local height = o.Height or 58
	local row = self:_row(height + 42, nil, "CodeBlock")
	local header = New("Frame", { Position = UDim2.fromOffset(14, 2), Size = UDim2.new(1, -28, 0, 30), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
	Round(header, 8)
	New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 8), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = header })
	Label({ Position = UDim2.fromOffset(10, 0), Size = UDim2.new(1, -60, 1, 0), Text = string.upper(o.Language or "lua") .. " / SOURCE", TextSize = 10, TextColor3 = Theme.Muted, FontFace = Fonts.Bold, ZIndex = 2, Parent = header })
	local copy = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -4, 0.5, 0), Size = UDim2.fromOffset(48, 22), BackgroundColor3 = Theme.Surface3, Text = "Copy", TextColor3 = Theme.Muted, TextSize = 10, FontFace = Fonts.Bold, AutoButtonColor = false, ZIndex = 2, Parent = header })
	Round(copy, 4)
	local area = New("Frame", { Position = UDim2.fromOffset(14, 32), Size = UDim2.new(1, -28, 0, height), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, ClipsDescendants = true, Parent = row })
	Round(area, 8)
	New("Frame", { Size = UDim2.new(1, 0, 0, 8), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = area })
	Pad(area, 10, 8, 10, 8)
	Stroke(area, Theme.Stroke, 1, 0.4)
	local lbl = Label({ Size = UDim2.fromScale(1, 1), Text = code, TextColor3 = Theme.Text, TextSize = 12, FontFace = Font.fromEnum(Enum.Font.Code), TextYAlignment = Enum.TextYAlignment.Top, TextWrapped = true, RichText = false, TextTruncate = Enum.TextTruncate.None, Parent = area })
	copy.MouseButton1Click:Connect(function()
		copy.Text = "Copied"
		pcall(setclipboard, code)
		task.delay(1.5, function()
			if copy.Parent then
				copy.Text = "Copy"
			end
		end)
	end)
	local obj = { Instance = row }
	function obj:SetCode(c)
		code = c
		lbl.Text = c
	end
	return Finish(self, {}, obj, row)
end

function Container:AddMultiButton(o)
	o = Opt(o)
	local list = {}
	for i, b in ipairs(o.Buttons or {}) do
		list[i] = { Name = b.Name or "Button", Style = b.Risky and "Danger" or nil, Callback = b.Callback }
	end
	local h = self:ButtonRow(list)
	h.Instance = h.Frame
	return h
end

function Container:AddHStack(o)
	o = Opt(o)
	local cols, gap, height = o.Columns or 2, o.Gap or 6, o.Height or 0
	local row = self:_row(height, nil, "HStack")
	if height == 0 then
		row.AutomaticSize = Enum.AutomaticSize.Y
	end
	List(row, gap, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Top
	local slots = {}
	for i = 1, cols do
		local slot = New("Frame", { Size = UDim2.new(1 / cols, -gap * (cols - 1) / cols, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = i, Parent = row })
		List(slot, 4)
		slots[i] = slot
	end
	return { Instance = row, Slots = slots, GetSlot = function(_, i) return slots[i] end }
end

function Container:AddVStack(o)
	o = Opt(o)
	local row = self:_row(0, nil, "VStack")
	row.AutomaticSize = Enum.AutomaticSize.Y
	Pad(row, 12, 4, 12, 4)
	List(row, 0)
	local content = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = o.Background and 0 or 1, BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
	if o.Background then Round(content, 8) Stroke(content, Theme.Stroke) end
	Pad(content, 0, 4, 0, 4)
	List(content, o.Gap or 4)
	return { Instance = content, Add = function(_, createFn, opts) return createFn(content, opts) end }
end

function Container:AddGraph(o)
	o = Opt(o)
	local height, maxValues = o.Height or 80, o.MaxValues or 15
	local row = self:_row(height + 40, o.Name, "Graph")
	Label({ Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -100, 0, 18), Text = o.Name or "Graph", TextSize = 12, FontFace = Fonts.Bold, Parent = row })
	local canvas = New("Frame", { Position = UDim2.fromOffset(14, 28), Size = UDim2.new(1, -28, 0, height), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
	Round(canvas, 6)
	Stroke(canvas)
	local latest = Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -14, 0, 0), Size = UDim2.fromOffset(76, 18), Text = "-", TextSize = 14, FontFace = Fonts.Bold, TextColor3 = Theme.Accent, TextXAlignment = Enum.TextXAlignment.Right, Parent = row })
	for i = 1, 3 do
		New("Frame", { Position = UDim2.new(0, 8, i / 4, 0), Size = UDim2.new(1, -16, 0, 1), BackgroundColor3 = Theme.Stroke, BackgroundTransparency = 0.45, BorderSizePixel = 0, Parent = canvas })
	end
	local data = {}
	local obj = { Window = self.Window }
	function obj:Render()
		local width = canvas.AbsoluteSize.X / math.max(self.Window.RootScale.Scale, 0.05)
		if width <= 0 then
			return
		end
		for _, child in ipairs(canvas:GetChildren()) do
			if child.Name == "GraphBar" then
				child:Destroy()
			end
		end
		latest.Text = data[#data] and tostring(data[#data]) or "-"
		local top = 0.001
		for _, v in ipairs(data) do
			top = math.max(top, v)
		end
		local barWidth = math.floor(math.max(1, ((width - 16) - (maxValues - 1) * 4) / maxValues))
		for i, v in ipairs(data) do
			local bar = New("Frame", { Name = "GraphBar", AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromOffset(8 + (i - 1) * (barWidth + 4), height - 8), Size = UDim2.new(0, barWidth, 0, math.clamp(v / top * (height - 16), 2, height - 16)), BackgroundColor3 = i == #data and Theme.Accent or Theme.StrokeHover, BorderSizePixel = 0, LayoutOrder = i, Parent = canvas })
			Round(bar, 3)
			local tip = Label({ Position = UDim2.new(0.5, -25, 0, -20), Size = UDim2.fromOffset(50, 16), Text = tostring(v), TextSize = 10, TextXAlignment = Enum.TextXAlignment.Center, BackgroundTransparency = 0, BackgroundColor3 = Theme.Surface, Visible = false, ZIndex = 20, Parent = bar })
			Round(tip, 4)
			bar.MouseEnter:Connect(function()
				tip.Visible = true
			end)
			bar.MouseLeave:Connect(function()
				tip.Visible = false
			end)
		end
	end
	function obj:AddPoint(v)
		table.insert(data, v)
		if #data > maxValues then
			table.remove(data, 1)
		end
		self:Render()
	end
	function obj:Clear()
		data = {}
		self:Render()
	end
	canvas:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
		obj:Render()
	end)
	return Finish(self, {}, obj, row)
end

function Container:AddGridLayout(o)
	o = Opt(o)
	local columns, cellHeight, gap = o.Columns or 2, o.CellHeight or 28, o.Gap or 6
	local row = self:_row(0, nil, "Grid")
	row.AutomaticSize = Enum.AutomaticSize.Y
	Pad(row, 0, 2, 0, 2)
	local layout = New("UIGridLayout", { SortOrder = Enum.SortOrder.LayoutOrder, CellSize = UDim2.new(1 / columns, -((columns - 1) * gap / columns), 0, cellHeight), CellPadding = UDim2.new(0, gap, 0, gap), Parent = row })
	local obj = { Instance = row }
	for _, kind in ipairs({ "Toggle", "Button", "Checkbox", "Badge", "Label", "Slider", "Dropdown", "Textbox" }) do
		obj["Add" .. kind] = function(_, itemOpts)
			local cell = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = row })
			local handle = Lib["Create" .. kind](Lib, cell, itemOpts)
			local function fit()
				local height = math.max(cellHeight, handle.Frame.Size.Y.Offset, handle.Frame.AbsoluteSize.Y / math.max(self.Window.RootScale.Scale, 0.05))
				if height > layout.CellSize.Y.Offset then layout.CellSize = UDim2.new(layout.CellSize.X.Scale, layout.CellSize.X.Offset, 0, height) end
			end
			handle.Frame:GetPropertyChangedSignal("AbsoluteSize"):Connect(fit)
			fit()
			return handle
		end
	end
	return obj
end

function Container:AddRaw(o)
	local el = o.Element or o
	el.LayoutOrder = #self.Items + 1
	el.Size = UDim2.new(1, 0, 0, o.Height or 42)
	el.Parent = self.Body
end

local function BuildTabbox(self, o, underline)
	o = Opt(o)
	local tabs = o.Tabs or {}
	local row = self:_row(0, nil, "Tabbox")
	row.AutomaticSize = Enum.AutomaticSize.Y
	List(row, 4)
	local header = New("Frame", { Size = UDim2.new(1, 0, 0, underline and 28 or 26), BackgroundColor3 = Theme.Surface3, BackgroundTransparency = underline and 1 or 0.4, BorderSizePixel = 0, LayoutOrder = 1, Parent = row })
	if not underline then
		Round(header, 8)
	else
		New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 1), BackgroundColor3 = Theme.Stroke, BorderSizePixel = 0, Parent = header })
	end
	local frames, buttons, order = {}, {}, {}
	local active
	local obj = { Tabs = frames, Instance = row }
	local function activate(name)
		active = name
		obj.ActiveTab = name
		obj.Value = name
		for tName, frame in pairs(frames) do
			frame.Visible = tName == name
		end
		for tName, b in pairs(buttons) do
			local on = tName == name
			Tween(b.Label, { TextColor3 = on and Theme.Text or Theme.Muted }, 0.15)
			if underline then
				Tween(b.Mark, { BackgroundTransparency = on and 0 or 1 }, 0.15)
			else
				Tween(b.Face, { BackgroundTransparency = on and 0.8 or 1 }, 0.15)
			end
		end
	end
	local function relayout()
		local n = math.max(#order, 1)
		for i, name in ipairs(order) do
			local b = buttons[name]
			b.Face.Size = UDim2.new(1 / n, underline and 0 or -2, 1, underline and -2 or -4)
			b.Face.Position = UDim2.new((i - 1) / n, underline and 0 or 1, 0, underline and 0 or 2)
		end
	end
	local function build(name)
		if frames[name] then
			return frames[name]
		end
		local face = New("TextButton", { BackgroundColor3 = Theme.Accent, BackgroundTransparency = 1, BorderSizePixel = 0, Text = "", AutoButtonColor = false, Parent = header })
		if not underline then
			Round(face, 6)
		end
		local label = Label({ Size = UDim2.fromScale(1, 1), Text = name, TextSize = 11, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, Parent = face })
		local mark
		if underline then
			mark = New("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 1), Size = UDim2.new(0.6, 0, 0, 2), BackgroundColor3 = Theme.Accent, BackgroundTransparency = 1, BorderSizePixel = 0, Parent = face })
			Round(mark, 100)
		end
		local content = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Visible = false, LayoutOrder = 2, Parent = row })
		List(content, 4)
		Pad(content, 0, 2, 0, 0)
		frames[name] = content
		buttons[name] = { Face = face, Label = label, Mark = mark }
		table.insert(order, name)
		face.MouseButton1Click:Connect(function()
			activate(name)
		end)
		relayout()
		return content
	end
	for _, name in ipairs(tabs) do
		build(name)
	end
	activate(o.Default or tabs[1])
	function obj:GetTab(name)
		return frames[name]
	end
	function obj:SetTab(name)
		activate(name)
	end
	function obj:AddTab(name, switch)
		local content = build(name)
		if switch then
			activate(name)
		end
		return content
	end
	if o.Flag then
		Lib.Options[o.Flag] = obj
	end
	return Finish(self, {}, obj, row)
end

function Container:AddTabbox(o)
	return BuildTabbox(self, o, false)
end
Container.AddLeftTabbox = Container.AddTabbox
Container.AddRightTabbox = Container.AddTabbox

function Container:AddTabSection(o)
	return BuildTabbox(self, o, true)
end

function Container:AddList(o)
	o = Opt(o)
	local maxItems, height = o.MaxItems or 50, o.Height or 100
	local row = self:_row(height + 32, o.Name, "List")
	Label({ Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -28, 0, 14), Text = o.Name or "Log", TextSize = 12, FontFace = Fonts.Bold, TextColor3 = Theme.Text, Parent = row })
	local scroll = New("ScrollingFrame", { Position = UDim2.fromOffset(14, 24), Size = UDim2.new(1, -28, 0, height), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, ScrollBarThickness = 3, ScrollBarImageColor3 = Theme.Accent, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, Parent = row })
	Round(scroll, 6)
	Stroke(scroll)
	local layout = List(scroll, 3)
	Pad(scroll, 8, 8, 8, 8)
	local rows = {}
	local obj = {}
	function obj:Push(text, color)
		local lbl = Label({ Size = UDim2.new(1, 0, 0, 24), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 0, Text = tostring(text), TextColor3 = color or Theme.Text, TextSize = 12, FontFace = Fonts.Medium, LayoutOrder = #rows + 1, Parent = scroll })
		Round(lbl, 4)
		Pad(lbl, 18, 0, 6, 0)
		local dot = New("Frame", { Position = UDim2.new(0, -10, 0.5, -2), Size = UDim2.fromOffset(4, 4), BackgroundColor3 = color or Theme.Muted, BorderSizePixel = 0, Parent = lbl })
		Round(dot, 2)
		table.insert(rows, lbl)
		if #rows > maxItems then
			table.remove(rows, 1):Destroy()
		end
		local h = layout.AbsoluteContentSize.Y + 16
		scroll.CanvasSize = UDim2.fromOffset(0, h)
		scroll.CanvasPosition = Vector2.new(0, math.max(0, h - height))
	end
	function obj:Clear()
		for _, r in ipairs(rows) do
			r:Destroy()
		end
		rows = {}
		scroll.CanvasSize = UDim2.new()
	end
	function obj:SetText(text)
		self:Clear()
		self:Push(text)
	end
	Finish(self, {}, obj, row)
	if o.Flag then
		Lib.Flags[o.Flag] = obj
	end
	return obj
end

function Container:AddRangeSlider(o)
	o = Opt(o)
	local min, max, step = o.Min or 0, o.Max or 100, o.Increment or 1
	local suffix = o.Suffix or ""
	local callback = o.Callback or function() end
	local lo = o.DefaultMin ~= nil and o.DefaultMin or min
	local hi = o.DefaultMax ~= nil and o.DefaultMax or max
	local row = self:_row(52, o.Name, "Slider")
	Label({ Position = UDim2.fromOffset(14, 5), Size = UDim2.new(1, -120, 0, 18), Text = o.Name or "Range", TextSize = 13, Parent = row })
	local valueLabel = Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -14, 0, 5), Size = UDim2.fromOffset(100, 18), TextXAlignment = Enum.TextXAlignment.Right, TextColor3 = Theme.Accent, FontFace = Fonts.Bold, Parent = row })
	local track = New("Frame", { Position = UDim2.new(0, 14, 0, 36), Size = UDim2.new(1, -28, 0, 5), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = row })
	Round(track, 100)
	local fill = New("Frame", { BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, Parent = track })
	Round(fill, 100)
	local function knob()
		local k = New("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromOffset(12, 12), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, ZIndex = 3, Parent = track })
		Round(k, 100)
		return k
	end
	local kLo, kHi = knob(), knob()
	local obj = { Value = { Min = lo, Max = hi } }
	local function snap(v)
		return math.clamp(math.floor((v - min) / step + 0.5) * step + min, min, max)
	end
	local function render()
		local a = (lo - min) / math.max(max - min, 1e-9)
		local b = (hi - min) / math.max(max - min, 1e-9)
		fill.Position = UDim2.fromScale(a, 0)
		fill.Size = UDim2.fromScale(math.max(b - a, 0), 1)
		kLo.Position = UDim2.fromScale(a, 0.5)
		kHi.Position = UDim2.fromScale(b, 0.5)
		valueLabel.Text = Num(lo) .. " - " .. Num(hi) .. suffix
		obj.Value = { Min = lo, Max = hi }
	end
	function obj:SetValue(a, b)
		lo, hi = snap(a), snap(b)
		if lo > hi then
			lo, hi = hi, lo
		end
		render()
		callback(obj.Value)
	end
	local dragging
	local hit = New("TextButton", { Position = UDim2.new(0, 8, 0, 24), Size = UDim2.new(1, -16, 0, 28), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, ZIndex = 4, Parent = row })
	local function fromX(x)
		local v = snap(min + (max - min) * math.clamp((x - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1))
		if dragging == "lo" then
			lo = math.min(v, hi)
		else
			hi = math.max(v, lo)
		end
		render()
		callback(obj.Value)
	end
	hit.InputBegan:Connect(function(input)
		if IsPress(input) then
			local x = MousePos().X
			local v = min + (max - min) * math.clamp((x - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
			dragging = math.abs(v - lo) <= math.abs(v - hi) and "lo" or "hi"
			fromX(x)
		end
	end)
	self.Window:_listen(UserInputService.InputChanged, function(input)
		if dragging and IsMove(input) then
			fromX(MousePos().X)
		end
	end)
	self.Window:_listen(UserInputService.InputEnded, function(input)
		if dragging and IsPress(input) then
			dragging = nil
		end
	end)
	render()
	Finish(self, o, obj, row)
	if o.Flag then
		Lib.Flags[o.Flag] = obj
	end
	return obj
end

function Container:AddAccordion(o)
	o = Opt(o)
	local callback = o.Callback or function() end
	local isOpen = o.Open == true
	local row = self:_row(0, o.Name, "Accordion")
	row.AutomaticSize = Enum.AutomaticSize.Y
	Pad(row, 14, 4, 14, 4)
	List(row, 0)
	local card = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
	Round(card, 8)
	Stroke(card)
	List(card, 0)
	local header = New("TextButton", { Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, LayoutOrder = 1, Parent = card })
	Label({ Position = UDim2.fromOffset(10, 0), Size = UDim2.new(1, -40, 1, 0), Text = o.Name or "Section", TextSize = 12, FontFace = Fonts.Bold, Parent = header })
	local chevron = NewIcon(header, "chevron-down", 14, Theme.Muted, UDim2.new(1, -24, 0.5, -7))
	local body = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Visible = false, LayoutOrder = 2, Parent = card })
	List(body, 4)
	Pad(body, 8, 4, 8, 8)
	local obj = { Instance = body }
	local function setOpen(v)
		isOpen = v
		body.Visible = v
		Tween(chevron, { Rotation = v and 180 or 0 }, 0.2)
		callback(v)
	end
	function obj:SetOpen(v)
		setOpen(v)
	end
	function obj:Toggle()
		setOpen(not isOpen)
	end
	header.MouseButton1Click:Connect(function()
		setOpen(not isOpen)
	end)
	setOpen(isOpen)
	return Finish(self, {}, obj, row)
end

local function ChoiceGroup(self, o, fill, kind)
	o = Opt(o)
	local callback = o.Callback or function() end
	local options = o.Options or {}
	local selected = o.Default or options[1] or ""
	local hasName = (o.Name or "") ~= ""
	local obj
	local row = self:_row(0, o.Name, "Dropdown")
	row.AutomaticSize = Enum.AutomaticSize.Y
	List(row, 4)
	Pad(row, 14, 0, 14, 4)
	if hasName then
		Label({ Size = UDim2.new(1, 0, 0, 14), Text = o.Name, TextSize = 11, TextColor3 = Theme.Muted, LayoutOrder = 1, Parent = row })
	end
	local holder = New("Frame", { Size = UDim2.new(1, 0, 0, fill and 28 or 0), AutomaticSize = fill and Enum.AutomaticSize.None or Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = 2, Parent = row })
	local layout = List(holder, 6, Enum.FillDirection.Horizontal)
	layout.Wraps = not fill
	layout.VerticalAlignment = Enum.VerticalAlignment.Center
	local buttons = {}
	local function paint()
		for name, b in pairs(buttons) do
			local on = name == selected
			Tween(b.Face, { BackgroundColor3 = on and Theme.Accent or Theme.Surface3, BackgroundTransparency = on and 0.8 or 0.45 }, 0.15)
			Tween(b.Stroke, { Color = on and Theme.Accent or Theme.Stroke }, 0.15)
			Tween(b.Label, { TextColor3 = on and Theme.Text or Theme.Muted }, 0.15)
		end
	end
	local count = math.max(#options, 1)
	for i, name in ipairs(options) do
		local face = New("TextButton", {
			Size = fill and UDim2.new(1 / count, -6 * (count - 1) / count, 1, 0) or UDim2.fromOffset(0, 26),
			AutomaticSize = fill and Enum.AutomaticSize.None or Enum.AutomaticSize.X,
			BackgroundColor3 = Theme.Surface3,
			BackgroundTransparency = 0.45,
			BorderSizePixel = 0,
			Text = "",
			AutoButtonColor = false,
			LayoutOrder = i,
			Parent = holder,
		})
		Round(face, fill and 6 or 100)
		local stroke = Stroke(face)
		if not fill then
			Pad(face, 12, 0)
		end
		local label = Label({ Size = fill and UDim2.fromScale(1, 1) or UDim2.fromOffset(0, 26), AutomaticSize = fill and Enum.AutomaticSize.None or Enum.AutomaticSize.X, Text = name, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.None, Parent = face })
		buttons[name] = { Face = face, Stroke = stroke, Label = label }
		face.MouseButton1Click:Connect(function()
			if obj and obj._disabled then
				return
			end
			selected = name
			obj.Value = name
			paint()
			callback(name)
			Fire(obj)
		end)
	end
	paint()
	obj = { Value = selected, Instance = row, Type = kind }
	function obj:SetValue(v)
		selected = v
		self.Value = v
		paint()
		callback(v)
		Fire(self)
	end
	Finish(self, o, obj, row)
	if o.Flag then
		Lib.Flags[o.Flag] = obj
		Lib.Options[o.Flag] = obj
	end
	return obj
end

function Container:AddRadioGroup(o)
	return ChoiceGroup(self, o, false, "RadioGroup")
end

function Container:AddSegmentedButtons(o)
	return ChoiceGroup(self, o, true, "SegmentedButtons")
end

---------------------------------------------------------------- Seisen API: Library:CreateX(parent, ...)
-- controls made with Library:CreateX(frame, ...) belong to whatever tab / section that frame sits in
function Lib:_pseudo(parent)
	local win = CurrentWindow()
	local tab, name, groupObj = win and win.Current, "", nil
	if win then
		for _, page in ipairs(win.Pages) do
			if parent:IsDescendantOf(page.Page) then
				tab = page
				break
			end
		end
		for _, g in ipairs(win.Groups) do
			if parent:IsDescendantOf(g.Frame) then
				name, groupObj = g.Name, g.Obj
				break
			end
		end
	end
	return setmetatable({ Body = parent, Items = {}, Window = win, Name = name, Tab = tab, _groupObj = groupObj }, Groupbox)
end

for _, name in ipairs({
	"Label", "Button", "Toggle", "Slider", "Keybind", "Dropdown", "Textbox", "DualTextbox", "TripleTextbox", "Checkbox",
	"ColorPicker", "ProgressBar", "Image", "Viewport", "DependencyBox", "TooltipLabel", "SearchableDropdown", "Paragraph",
	"Badge", "Space", "CodeBlock", "MultiButton", "Divider", "HStack", "VStack", "Graph", "GridLayout", "TabSection", "Tabbox",
	"List", "RangeSlider", "Accordion", "RadioGroup", "SegmentedButtons", "LiveLabel",
}) do
	Lib["Create" .. name] = function(self, parent, ...)
		local box = self:_pseudo(parent)
		return box["Add" .. name](box, ...)
	end
end

---------------------------------------------------------------- Seisen API: dialog / popup
local function BuildModal(options, visible, autoClose)
	local win = CurrentWindow()
	local gui = win and win.Gui or NotifyHost().Gui
	local overlay = New("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Visible = visible, ZIndex = 200, Parent = gui })
	local card = New("CanvasGroup", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 8), Size = UDim2.fromOffset(340, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundColor3 = Theme.Background, BorderSizePixel = 0, GroupTransparency = 1, Active = true, ZIndex = 201, Parent = overlay })
	Round(card, 12)
	Stroke(card, Theme.Stroke, 1)
	local content = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, Parent = card })
	Pad(content, 18, 16, 18, 16)
	List(content, 12)
	local head = New("Frame", { Size = UDim2.new(1, 0, 0, 24), BackgroundTransparency = 1, LayoutOrder = 1, Parent = content })
	local x = 0
	if options.Icon then
		NewIcon(head, options.Icon, 18, Theme.Accent, UDim2.fromOffset(0, 3))
		x = 28
	end
	Label({ Position = UDim2.fromOffset(x, 0), Size = UDim2.new(1, -(x + 28), 1, 0), Text = options.Title or "Dialog", TextSize = 15, FontFace = Fonts.Bold, Parent = head })
	local closeBtn = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, 0, 0.5, 0), Size = UDim2.fromOffset(24, 24), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = head })
	NewIcon(closeBtn, "x", 14, Theme.Muted, UDim2.fromOffset(5, 5))
	Label({
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		Text = options.Content or "",
		TextSize = 13,
		FontFace = Fonts.Regular,
		TextColor3 = Theme.Muted,
		TextWrapped = true,
		TextTruncate = Enum.TextTruncate.None,
		TextYAlignment = Enum.TextYAlignment.Top,
		RichText = true,
		LayoutOrder = 2,
		Parent = content,
	})
	local buttons = New("Frame", { Size = UDim2.new(1, 0, 0, 32), BackgroundTransparency = 1, LayoutOrder = 3, Parent = content })
	local bl = List(buttons, 8, Enum.FillDirection.Horizontal)
	bl.HorizontalAlignment = Enum.HorizontalAlignment.Right
	local obj = {}
	function obj.Show()
		overlay.Visible = true
		card.Position = UDim2.new(0.5, 0, 0.5, 8)
		Tween(overlay, { BackgroundTransparency = 0.5 }, 0.18)
		Tween(card, { GroupTransparency = 0, Position = UDim2.fromScale(0.5, 0.5) }, 0.22)
	end
	function obj.Close()
		Tween(overlay, { BackgroundTransparency = 1 }, 0.18)
		Tween(card, { GroupTransparency = 1 }, 0.18)
		task.delay(0.2, function()
			if autoClose then
				overlay:Destroy()
			else
				overlay.Visible = false
			end
		end)
	end
	closeBtn.MouseButton1Click:Connect(obj.Close)
	for i, b in ipairs(options.Buttons or { { Name = "Close" } }) do
		local primary = b.Style == "primary" or b.Style == "accent" or b.Primary
		local face = New("TextButton", { Size = UDim2.fromOffset(92, 32), BackgroundColor3 = primary and Theme.Accent or Theme.Surface3, BackgroundTransparency = primary and 0.12 or 0.45, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = buttons })
		Round(face, 6)
		Stroke(face, primary and Theme.Accent or Theme.Stroke, 1, primary and 0.4 or 0)
		Label({ Size = UDim2.fromScale(1, 1), Text = b.Name or "OK", TextSize = 13, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = primary and Theme.AccentDark or Theme.Text, Parent = face })
		face.MouseButton1Click:Connect(function()
			if b.Callback then
				pcall(b.Callback)
			end
			obj.Close()
		end)
	end
	if visible then
		obj.Show()
	end
	return obj
end

function Lib:CreateDialog(options)
	return BuildModal(options or {}, false, false)
end

function Lib:CreatePopup(options)
	return BuildModal(options or {}, true, true)
end

---------------------------------------------------------------- Seisen API: keybind panel / widget / fly pad
function Lib:BuildKeybindPanel()
	if self.KeybindFrame and self.KeybindFrame.Parent then
		return
	end
	local win = CurrentWindow()
	if not win then
		return
	end
	local panel = New("Frame", { Name = "KeybindPanel", Size = UDim2.fromOffset(200, 0), AutomaticSize = Enum.AutomaticSize.Y, Position = UDim2.new(0, 12, 1, -12), AnchorPoint = Vector2.new(0, 1), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 0.15, BorderSizePixel = 0, Visible = false, ZIndex = 60, Parent = win.Gui })
	Round(panel, 10)
	Stroke(panel)
	List(panel, 2)
	Pad(panel, 8, 6, 8, 6)
	local hint = Label({ Size = UDim2.new(1, 0, 0, 18), Text = "No keybinds set.", TextSize = 10, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, LayoutOrder = 999, Parent = panel })
	self.KeybindFrame = panel
	self._refreshKeybindEmptyHint = function()
		local any = false
		for _, entry in ipairs(self.KeybindRows) do
			if entry.row.Visible then
				any = true
				break
			end
		end
		hint.Visible = not any
		local shown = self.Toggles["BuiltIn_ShowKeybinds"] and self.Toggles["BuiltIn_ShowKeybinds"].Value or false
		panel.Visible = shown and any
	end
	-- drag
	local dragging, start, origin
	panel.InputBegan:Connect(function(input)
		if IsPress(input) then
			dragging, start, origin = true, MousePos(), Vector2.new(panel.AbsolutePosition.X, panel.AbsolutePosition.Y + panel.AbsoluteSize.Y)
		end
	end)
	win:_listen(UserInputService.InputChanged, function(input)
		if dragging and IsMove(input) then
			local target = origin + (MousePos() - start) - win.Gui.AbsolutePosition
			panel.Position = UDim2.fromOffset(target.X, target.Y)
		end
	end)
	win:_listen(UserInputService.InputEnded, function(input)
		if IsPress(input) then
			dragging = false
		end
	end)
end

function Lib:RegisterKeybindRow(name, getKey, isToggle, getValue)
	if not self.KeybindFrame then
		return function() end
	end
	local row = New("Frame", { Size = UDim2.new(1, 0, 0, 22), BackgroundTransparency = 1, Parent = self.KeybindFrame })
	local badge = New("TextLabel", { Position = UDim2.fromOffset(0, 2), Size = UDim2.new(0, 50, 1, -4), BackgroundColor3 = Theme.Surface3, Text = "NONE", TextColor3 = Theme.Accent, TextSize = 10, FontFace = Fonts.Bold, BorderSizePixel = 0, Parent = row })
	Round(badge, 5)
	Label({ Position = UDim2.fromOffset(56, 0), Size = UDim2.new(1, isToggle and -86 or -56, 1, 0), Text = tostring(name), TextSize = 11, FontFace = Fonts.Regular, Parent = row })
	local state
	if isToggle then
		state = Label({ AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 0), Size = UDim2.new(0, 28, 1, 0), Text = "OFF", TextSize = 10, TextColor3 = Theme.Muted, FontFace = Fonts.Bold, TextXAlignment = Enum.TextXAlignment.Right, Parent = row })
	end
	local function update()
		local key = getKey()
		local has = key and key ~= Enum.KeyCode.Unknown
		row.Visible = has and true or false
		if has then
			badge.Text = string.upper(KeyName(key))
		end
		if state then
			local on = getValue and getValue()
			state.Text = on and "ON" or "OFF"
			state.TextColor3 = on and Theme.Accent or Theme.Muted
		end
	end
	update()
	table.insert(self.KeybindRows, { update = update, row = row })
	return update
end

function Lib:_refreshKeybinds()
	for _, entry in ipairs(self.KeybindRows) do
		pcall(entry.update)
	end
	if self._refreshKeybindEmptyHint then
		self._refreshKeybindEmptyHint()
	end
end

function Lib:CreateWidget(o)
	o = Opt(o)
	local win = CurrentWindow()
	if self._widgetGui then
		pcall(function()
			self._widgetGui:Destroy()
		end)
	end
	local gui = New("ScreenGui", { Name = "SeisenWidget", ResetOnSpawn = false, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, IgnoreGuiInset = true, DisplayOrder = 1000020, Enabled = true })
	ParentGui(gui)
	self._widgetGui = gui
	local frame = New("Frame", { Position = UDim2.fromOffset(12, 12), Size = UDim2.fromOffset(170, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 0.1, BorderSizePixel = 0, Parent = gui })
	Round(frame, 10)
	Stroke(frame)
	List(frame, 2)
	Pad(frame, 10, 8, 10, 8)
	Label({ Size = UDim2.new(1, 0, 0, 16), Text = o.Title or "Performance", TextSize = 12, FontFace = Fonts.Bold, Parent = frame })
	local lines = {}
	local function line(key, text)
		lines[key] = Label({ Size = UDim2.new(1, 0, 0, 14), Text = text, TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = frame })
	end
	if o.ShowFPS then line("fps", "FPS: -") end
	if o.ShowPing then line("ping", "Ping: -") end
	if o.ShowMemory then line("mem", "Memory: -") end
	if o.ShowInstances then line("inst", "Instances: -") end
	local frames, last, fps = 0, os.clock(), 60
	local conn = RunService.RenderStepped:Connect(function()
		frames += 1
		if os.clock() - last >= 1 then
			fps, frames, last = frames, 0, os.clock()
		end
	end)
	local alive = true
	task.spawn(function()
		while alive and gui.Parent do
			if lines.fps then lines.fps.Text = "FPS: " .. fps end
			if lines.ping then
				local ok, ping = pcall(function() return math.floor(LocalPlayer:GetNetworkPing() * 1000) end)
				lines.ping.Text = "Ping: " .. (ok and ping or 0) .. "ms"
			end
			if lines.mem then
				local ok, mem = pcall(function() return math.round(game:GetService("Stats"):GetTotalMemoryUsageMb()) end)
				lines.mem.Text = "Memory: " .. (ok and mem or 0) .. " MB"
			end
			if lines.inst then
				lines.inst.Text = "Instances: " .. #workspace:GetDescendants()
			end
			task.wait(1)
		end
	end)
	local dragging, start, origin
	frame.InputBegan:Connect(function(input)
		if IsPress(input) then
			dragging, start, origin = true, MousePos(), Vector2.new(frame.Position.X.Offset, frame.Position.Y.Offset)
		end
	end)
	UserInputService.InputChanged:Connect(function(input)
		if dragging and IsMove(input) then
			local p = origin + (MousePos() - start)
			frame.Position = UDim2.fromOffset(p.X, p.Y)
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if IsPress(input) then
			dragging = false
		end
	end)
	gui.Destroying:Connect(function()
		alive = false
		conn:Disconnect()
	end)
	return { Instance = gui, Destroy = function() gui:Destroy() end }
end

function Lib:EnsureStatsWidget()
	if not self._statsWidget then
		self._statsWidget = self:CreateWidget({ Title = "Performance", ShowFPS = true, ShowPing = true, ShowMemory = true, ShowInstances = false })
	end
	return self._statsWidget
end

-- on-screen up/down buttons for mobile fly
function Lib:CreateFlyPad(onUp, onDown)
	local gui = New("ScreenGui", { Name = "SeisenFlyPad", ResetOnSpawn = false, IgnoreGuiInset = true, DisplayOrder = 1000020 })
	ParentGui(gui)
	local function pad(text, y, fn)
		local b = New("TextButton", { AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -24, 1, y), Size = UDim2.fromOffset(56, 56), BackgroundColor3 = Theme.Surface2, BackgroundTransparency = 0.2, Text = text, TextColor3 = Theme.Text, TextSize = 14, FontFace = Fonts.Bold, AutoButtonColor = false, Parent = gui })
		Round(b, 100)
		Stroke(b, Theme.Accent, 1, 0.4)
		b.InputBegan:Connect(function(input)
			if IsPress(input) then fn(true) end
		end)
		b.InputEnded:Connect(function(input)
			if IsPress(input) then fn(false) end
		end)
	end
	pad("UP", -160, onUp)
	pad("DOWN", -96, onDown)
	return gui
end

function Lib:SaveConfig(name)
	local win = CurrentWindow()
	return win and win:SaveConfig(name or "default")
end

function Lib:LoadConfig(name)
	local win = CurrentWindow()
	return win and win:LoadConfig(name or "default")
end

---------------------------------------------------------------- Seisen API: config files (old SaveManager format)
-- Seisen/Saved/<Folder>/<name>.json   { objects = { {type, idx, value, ...} }, exclusive, userId }
-- Seisen/Saved/<Folder>/autoload.txt | autoload_<userId>.txt   (pointer files)
-- Seisen/Theme/<Folder>/default.txt   (default theme name)
local IgnoredFlags = {
	BuiltIn_UIScale = true, BuiltIn_ToggleKey = true, BuiltIn_NotifyEnabled = true, BuiltIn_ThemePreset = true,
	BuiltIn_Fly = true, BuiltIn_NoClip = true, BuiltIn_WalkSpeedToggle = true, BuiltIn_JumpPowerToggle = true,
	BuiltIn_InfiniteJump = true,
}
local function Ignored(idx)
	return IgnoredFlags[idx] or idx:sub(1, 12) == "SaveManager_" or idx:sub(1, 13) == "ThemeCreator_"
end

local function ReadText(path)
	if not (HasFiles() and type(isfile) == "function") then
		return nil
	end
	local ok, text = pcall(function()
		if isfile(path) then
			return readfile(path)
		end
	end)
	return ok and text or nil
end

local function WriteText(kind, fileName, text)
	if not HasFiles() then
		return false, "executor has no file access"
	end
	return pcall(function()
		writefile(EnsureDir(kind) .. "/" .. fileName, text)
	end)
end

local function DeleteFile(path)
	if type(delfile) == "function" then
		pcall(delfile, path)
	end
end

function Window:_buildConfigData()
	local data = { objects = {}, exclusive = false, userId = LocalPlayer.UserId }
	for idx, toggle in pairs(Lib.Toggles) do
		if not Ignored(idx) then
			local kb = (toggle.Keybind and toggle.Keybind ~= Enum.KeyCode.Unknown) and toggle.Keybind.Name or nil
			table.insert(data.objects, { type = "Toggle", idx = idx, value = toggle.Value, keybind = kb })
		end
	end
	for idx, opt in pairs(Lib.Options) do
		if not Ignored(idx) and opt.Type then
			if opt.Type == "Slider" then
				table.insert(data.objects, { type = "Slider", idx = idx, value = tostring(opt.Value) })
			elseif opt.Type == "Dropdown" then
				table.insert(data.objects, { type = "Dropdown", idx = idx, value = opt.Value, multi = opt.Multi })
			elseif opt.Type == "ColorPicker" then
				table.insert(data.objects, { type = "ColorPicker", idx = idx, value = opt.Value and opt.Value:ToHex() or "ffffff" })
			elseif opt.Type == "Input" or opt.Type == "Textbox" then
				table.insert(data.objects, { type = "Input", idx = idx, text = opt.Value })
			elseif opt.Type == "Keybind" then
				local name = (opt.Value and opt.Value ~= Enum.KeyCode.Unknown) and opt.Value.Name or "Unknown"
				table.insert(data.objects, { type = "Keybind", idx = idx, value = name })
			end
		end
	end
	-- controls made with the native NewUI API (Flag = "...")
	for flag, handle in pairs(Lib.Flags) do
		if not Lib.Toggles[flag] and not Lib.Options[flag] and not Ignored(flag) and type(handle.Get) == "function" and handle.Frame then
			local ok, value = pcall(handle.Get, handle)
			if ok and value ~= nil then
				table.insert(data.objects, { type = "Flag", idx = flag, value = Encode(value) })
			end
		end
	end
	return data
end

function Window:_applyConfigData(data)
	for _, entry in pairs(data.objects or {}) do
		if entry.type == "Flag" then
			local h = Lib.Flags[entry.idx]
			if h and h.Set then
				task.spawn(pcall, h.Set, h, Decode(entry.value))
			else
				self._pending[entry.idx] = entry.value
			end
		elseif Lib.Toggles[entry.idx] or Lib.Options[entry.idx] then
			task.spawn(pcall, ApplyEntry, entry)
		else
			self._pendingObjects[entry.idx] = entry
		end
	end
	for flag, value in pairs(data.Flags or {}) do
		local h = Lib.Flags[flag]
		if h and h.Set then
			task.spawn(pcall, h.Set, h, Decode(value))
		end
	end
end

function Window:ListConfigs()
	return ListNames("Saved")
end

function Window:ConfigExists(name)
	return table.find(ListNames("Saved"), name) ~= nil
end

function Window:SaveConfig(name)
	if type(name) ~= "string" or name:gsub(" ", "") == "" then
		return false, "empty name"
	end
	if not ValidName(name) then
		return false, "invalid name"
	end
	local ok, err = WriteJson("Saved", name, self:_buildConfigData())
	if ok then
		self:_configChanged()
	end
	return ok, err
end

function Window:LoadConfig(name)
	if type(name) ~= "string" or name == "" then
		return false, "empty name"
	end
	if not ValidName(name) then
		return false, "invalid name"
	end
	local data = ReadJson(Dir("Saved") .. "/" .. name .. ".json")
	if not data then
		return false, "file not found"
	end
	if data.exclusive and data.userId ~= LocalPlayer.UserId then
		return false, "exclusive to another account"
	end
	self:_applyConfigData(data)
	self.LoadedConfig = name
	self:_configChanged()
	return true
end

function Window:DeleteConfig(name)
	if not (type(delfile) == "function" and ValidName(name)) then
		return false, "cannot delete"
	end
	local ok, err = pcall(delfile, Dir("Saved") .. "/" .. name .. ".json")
	if ok then
		DeleteFile(Dir("Saved") .. "/notes/" .. name .. ".txt")
		if self.LoadedConfig == name then
			self.LoadedConfig = nil
		end
		self:_configChanged()
	end
	return ok, err
end

function Window:RenameConfig(name, newName)
	if not (ValidName(name) and ValidName(newName)) then
		return false, "invalid name"
	end
	if self:ConfigExists(newName) then
		return false, "name already used"
	end
	local text = ReadText(Dir("Saved") .. "/" .. name .. ".json")
	if not text then
		return false, "config not found"
	end
	local ok, err = WriteText("Saved", newName .. ".json", text)
	if not ok then
		return false, err
	end
	local note = ReadText(Dir("Saved") .. "/notes/" .. name .. ".txt")
	if note then
		pcall(function()
			if not isfolder(Dir("Saved") .. "/notes") then
				makefolder(Dir("Saved") .. "/notes")
			end
			writefile(Dir("Saved") .. "/notes/" .. newName .. ".txt", note)
		end)
	end
	DeleteFile(Dir("Saved") .. "/" .. name .. ".json")
	DeleteFile(Dir("Saved") .. "/notes/" .. name .. ".txt")
	for _, mode in ipairs({ "Account", "Global" }) do
		if self:GetAutoload(mode) == name then
			self:SetAutoload(newName, mode)
		end
	end
	if self.LoadedConfig == name then
		self.LoadedConfig = newName
	end
	self:_configChanged()
	return true
end

function Window:ResetConfig()
	local allOk = true
	local dir = Dir("Saved")
	if type(delfile) == "function" and type(listfiles) == "function" and isfolder(dir) then
		for _, path in ipairs(listfiles(dir)) do
			local p = tostring(path)
			if p:match("%.json$") or p:match("autoload[^/\\]*%.txt$") then
				if not pcall(delfile, path) then
					allOk = false
				end
			end
		end
	end
	self.LoadedConfig = nil
	self:_configChanged()
	return allOk
end

function Window:ExportConfig()
	local data = self:_buildConfigData()
	if #data.objects == 0 then
		return nil, "nothing to export"
	end
	return HttpService:JSONEncode(data)
end

function Window:DecodeConfig(code)
	local ok, data = pcall(function()
		return HttpService:JSONDecode(code)
	end)
	if ok and type(data) == "table" and (type(data.objects) == "table" or type(data.Flags) == "table") then
		return data
	end
	return nil
end

function Window:ImportConfig(code, name)
	local data = self:DecodeConfig(code)
	if not data then
		return false, "invalid code"
	end
	if name then
		local ok, err = WriteText("Saved", name .. ".json", code)
		if not ok then
			return false, err
		end
		self.LoadedConfig = name
	end
	self:_applyConfigData(data)
	self:_configChanged()
	return true
end

-- autoload pointer files
local function AutoloadPath(account)
	if account then
		return Dir("Saved") .. "/autoload_" .. tostring(LocalPlayer.UserId) .. ".txt"
	end
	return Dir("Saved") .. "/autoload.txt"
end

local function ReadPointer(account)
	local text = ReadText(AutoloadPath(account))
	text = text and text:match("^%s*(.-)%s*$")
	return (text and text ~= "") and text or nil
end

function Window:GetAutoloadMode()
	return ReadPointer(true) and "Account" or "Global"
end

function Window:GetAutoload(mode)
	if mode == "Account" then
		return ReadPointer(true)
	elseif mode == "Global" then
		return ReadPointer(false)
	end
	return ReadPointer(true) or ReadPointer(false)
end

function Window:SetAutoload(name, mode)
	mode = mode or self:GetAutoloadMode()
	local account = mode == "Account"
	if not name then
		DeleteFile(AutoloadPath(account))
		return true
	end
	return WriteText("Saved", account and ("autoload_" .. tostring(LocalPlayer.UserId) .. ".txt") or "autoload.txt", name)
end

function Window:SetAutoloadMode(mode)
	local name = self:GetAutoload()
	if not name then
		return true
	end
	local account = mode == "Account"
	local ok, err = self:SetAutoload(name, account and "Account" or "Global")
	DeleteFile(AutoloadPath(not account))
	return ok, err
end

function Window:LoadAutoload()
	local name = self:GetAutoload()
	if name then
		return self:LoadConfig(name)
	end
	return false
end

-- themes ----------------------------------------------------------------------
function Window:GetDefaultTheme()
	local text = ReadText(Dir("Theme") .. "/default.txt")
	text = text and text:match("^%s*(.-)%s*$")
	return (text and text ~= "") and text or nil
end

function Window:SetDefaultTheme(name)
	if not name then
		DeleteFile(Dir("Theme") .. "/default.txt")
		return true
	end
	return WriteText("Theme", "default.txt", name)
end

function Window:LoadTheme(name)
	if not ValidName(name) then
		return false, "invalid name"
	end
	local data = ReadJson(Dir("Theme") .. "/" .. name .. ".json")
	if not data then
		return false, "theme not found"
	end
	local colors = {}
	if type(data.Colors) == "table" then
		for key, value in pairs(data.Colors) do
			colors[key] = Decode(value)
		end
	elseif data.BackgroundColor then
		-- old Theme Manager file
		local function hex(s, fallback)
			local ok, c = pcall(Color3.fromHex, s or fallback)
			return ok and c or Color3.fromHex(fallback)
		end
		colors.Background = hex(data.BackgroundColor, "101014")
		colors.Surface2 = hex(data.MainColor, "1c1c24")
		colors.Surface = colors.Background:Lerp(colors.Surface2, 0.5)
		colors.Accent = hex(data.AccentColor, "9b9baa")
		colors.Text = hex(data.FontColor, "e1e1e8")
		colors.Stroke = hex(data.OutlineColor, "2d2d38")
		colors.Surface3 = hex(data.ToggleOffColor, "2d2d38")
		colors.Muted = colors.Text:Lerp(Color3.new(0, 0, 0), 0.5)
	else
		return false, "theme not found"
	end
	return Lib:SetTheme(colors)
end

function Window:DeleteTheme(name)
	if not (type(delfile) == "function" and ValidName(name)) then
		return false, "cannot delete"
	end
	local ok, err = pcall(delfile, Dir("Theme") .. "/" .. name .. ".json")
	if ok and self:GetDefaultTheme() == name then
		self:SetDefaultTheme(nil)
	end
	return ok, err
end

function Window:_applyDefaultTheme()
	local name = self:GetDefaultTheme()
	if not name then
		return
	end
	if Lib.ThemePresets[name] then
		Lib:SetTheme(name)
	else
		self:LoadTheme(name)
	end
end

---------------------------------------------------------------- Seisen built-in tabs (code taken from the old library)
local Library = Lib
local function Create(class, props, children)
	return Lib:Create(class, props, children)
end

function Lib:_EnsureBuiltInSection(window)
	if self._builtInSectionCreated then
		return
	end
	self._builtInSectionCreated = true
	window:AddSidebarDivider(true)
end

function Window:_buildServerHop(tab)
	local section = tab:AddRightSection("Server Hop", "shuffle")
	local status = section:AddLabel({ Text = "Pick a maximum player count, including you." })
	local state = { max = 2, auto = false, busy = false, nextAt = 0, reconnect = true, reconnectAt = nil, checkAt = 0 }
	local autoExecute, armed = true, false
	local function queueScript()
		if not autoExecute or armed or not self.Gui.Parent then return end
		local queue = queue_on_teleport or queueonteleport
		if type(queue) ~= "function" or type(self.ScriptUrl) ~= "string" or self.ScriptUrl == "" then
			Lib:Notify({ Title = "Auto Execute", Content = type(queue) ~= "function" and "Teleport queue is unavailable in this executor." or "No script URL is available for this game.", Type = "warning" })
			return
		end
		armed = pcall(queue, ("loadstring(game:HttpGet(%q))()"):format(self.ScriptUrl))
	end
	local function reconnect()
		if not state.reconnect or state.reconnectAt or not self.Gui.Parent then return end
		queueScript()
		state.reconnectAt = os.clock() + 3
		status:SetText("Disconnected. Reconnecting in 3 seconds...")
	end
	self:_listen(GuiService.ErrorMessageChanged, function(message)
		if message and #message > 0 then reconnect() end
	end)
	self:_listen(TeleportService.TeleportInitFailed, function(player)
		if player == LocalPlayer then state.failed = true end
	end)
	local function hop(automatic)
		if state.busy or state.reconnectAt or not self.Gui.Parent then return end
		if #Players:GetPlayers() <= state.max then status:SetText("This server is within your player limit."); return end
		state.busy = true
		state.active = function() return self.Gui.Parent ~= nil and not state.reconnectAt and (not automatic or state.auto) end
		status:SetText("Searching for a quieter server...")
		task.spawn(function()
			local moved = ServerTeleport(true, state)
			state.busy, state.nextAt = false, os.clock() + 5
			if self.Gui.Parent then status:SetText(moved and "Teleporting..." or "No hop completed. Try again shortly.") end
		end)
	end
	section:AddButton({ Name = "Hop Server Now", Tooltip = "Find a quieter server when this server exceeds your player limit.", Callback = function() hop(false) end })
	section:AddDropdown({ Name = "Max Players", Flag = "BuiltIn_HopMaxPlayers", Options = { "1", "2", "3", "4", "5" }, Default = "2", Multi = false,
		Tooltip = "Maximum players in the destination, including you. Falls back to the quietest available server.",
		Callback = function(value) state.max = tonumber(value) or 2; state.nextAt = 0 end })
	section:AddToggle({ Name = "Player Check Hop", Flag = "BuiltIn_PlayerCheckHop", Default = false,
		Tooltip = "Keep hopping when the server has more players than your selected maximum.",
		Callback = function(value) state.auto = value; state.nextAt = 0; if not value then status:SetText("Auto hop stopped.") end end })
	section:AddToggle({ Name = "Auto Reconnect", Flag = "BuiltIn_AutoReconnect", Default = true,
		Tooltip = "Rejoin this server after a kick or disconnect. Retries every 6 seconds; uses a new server when no server ID is available.",
		Callback = function(value)
			state.reconnect = value
			if not value and state.reconnectAt then state.reconnectAt = nil; status:SetText("Auto reconnect stopped.") end
		end })
	section:AddToggle({ Name = "Auto Execute On Teleport", Flag = "BuiltIn_AutoExecute", Default = true,
		Tooltip = "Run this game's script again after teleporting. Requires your executor's teleport queue.",
		Callback = function(value) autoExecute = value end })
	self._serverHopStep = function()
		if not self.Gui.Parent then return end
		if state.reconnect and os.clock() >= state.checkAt then
			state.checkAt = os.clock() + 2
			pcall(function()
				local promptGui = game:GetService("CoreGui"):FindFirstChild("RobloxPromptGui")
				local overlay = promptGui and promptGui:FindFirstChild("promptOverlay")
				local prompt = overlay and overlay:FindFirstChild("ErrorPrompt")
				if prompt and prompt.Visible then reconnect() end
			end)
		end
		if state.reconnectAt then
			if os.clock() >= state.reconnectAt then
				state.reconnectAt = os.clock() + 6
				status:SetText("Reconnecting...")
				pcall(function()
					if game.JobId and #game.JobId > 0 then
						TeleportService:TeleportToPlaceInstance(game.PlaceId, game.JobId, LocalPlayer)
					else
						TeleportService:Teleport(game.PlaceId, LocalPlayer)
					end
				end)
			end
			return
		end
		if not state.auto or state.busy or os.clock() < state.nextAt then return end
		state.nextAt = os.clock() + 3
		if #Players:GetPlayers() > state.max then hop(true) else status:SetText("Good server found. Waiting...") end
	end
	self:_listen(LocalPlayer.OnTeleport, function(teleportState)
		if teleportState == Enum.TeleportState.Started or teleportState == Enum.TeleportState.InProgress then queueScript() end
	end)
end

function Library:_BuildConfigTab(window)
    self:_EnsureBuiltInSection(window)
    local configTab = window:AddTab("Performance", "activity", true)
    window:_buildServerHop(configTab)
    local configUI = configTab:AddLeftSection("UI Settings", "settings")
    local configLeft = configTab:AddLeftSection("Character", "person-standing")
    local configRight = configTab:AddRightSection("Misc", "sparkles")

    local walkSpeedValue = 16
    local walkSpeedConnection = nil
    local walkSpeedCharConnection = nil

    -- WalkSpeed Toggle
    configLeft:AddToggle({
        Name = "WalkSpeed",
        Default = false,
        Flag = "BuiltIn_WalkSpeedToggle",
        Callback = function(v)
            pcall(function()
                if v then
                    if LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
                        if self._originalWalkSpeed == nil then
                            self._originalWalkSpeed = LocalPlayer.Character.Humanoid.WalkSpeed
                        end
                        LocalPlayer.Character.Humanoid.WalkSpeed = walkSpeedValue
                    end

                    if not walkSpeedCharConnection then
                        walkSpeedCharConnection = LocalPlayer.CharacterAdded:Connect(function(char)
                            task.wait(0.5)
                            local hum = char:FindFirstChild("Humanoid")
                            if hum then
                                if self._originalWalkSpeed == nil then
                                    self._originalWalkSpeed = hum.WalkSpeed
                                end
                                hum.WalkSpeed = walkSpeedValue
                            end
                        end)
                    end

                    if not walkSpeedConnection then
                        walkSpeedConnection = RunService.Heartbeat:Connect(function()
                            if LocalPlayer.Character then
                                local hum = LocalPlayer.Character:FindFirstChild("Humanoid")
                                if hum and hum.WalkSpeed ~= walkSpeedValue then
                                    hum.WalkSpeed = walkSpeedValue
                                end
                            end
                        end)
                    end
                else
                    local wasActive = false
                    if walkSpeedConnection then
                        walkSpeedConnection:Disconnect()
                        walkSpeedConnection = nil
                        wasActive = true
                    end
                    if walkSpeedCharConnection then
                        walkSpeedCharConnection:Disconnect()
                        walkSpeedCharConnection = nil
                        wasActive = true
                    end
                    if wasActive and self._originalWalkSpeed ~= nil and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
                        LocalPlayer.Character.Humanoid.WalkSpeed = self._originalWalkSpeed
                    end
                end
            end)
        end
    })

    -- WalkSpeed Value Slider
    configLeft:AddSlider({
        Name = "WalkSpeed Value",
        Min = 16,
        Max = 300,
        Default = 16,
        Flag = "BuiltIn_WalkSpeed",
        Callback = function(v)
            walkSpeedValue = v
            if walkSpeedConnection and LocalPlayer.Character then
                local hum = LocalPlayer.Character:FindFirstChild("Humanoid")
                if hum then
                    hum.WalkSpeed = v
                end
            end
        end
    })

    configLeft:AddDivider()

    -- JumpPower
    local jumpPowerValue      = 50
    local jumpPowerConnection = nil
    local jumpPowerCharConn   = nil

    configLeft:AddToggle({
        Name    = "JumpPower",
        Default = false,
        Flag    = "BuiltIn_JumpPowerToggle",
        Callback = function(v)
            pcall(function()
                if v then
                    local char = LocalPlayer.Character
                    if char then
                        local hum = char:FindFirstChildOfClass("Humanoid")
                        if hum then
                            if self._originalJumpPower == nil then
                                self._originalUseJumpPower = hum.UseJumpPower
                                self._originalJumpPower = hum.UseJumpPower and hum.JumpPower or hum.JumpHeight
                            end
                            hum.UseJumpPower = true
                            hum.JumpPower    = jumpPowerValue
                        end
                    end
                    if not jumpPowerCharConn then
                        jumpPowerCharConn = LocalPlayer.CharacterAdded:Connect(function(char)
                            task.wait(0.5)
                            local hum = char:FindFirstChildOfClass("Humanoid")
                            if hum then
                                if self._originalJumpPower == nil then
                                    self._originalUseJumpPower = hum.UseJumpPower
                                    self._originalJumpPower = hum.UseJumpPower and hum.JumpPower or hum.JumpHeight
                                end
                                hum.UseJumpPower = true
                                hum.JumpPower    = jumpPowerValue
                            end
                        end)
                    end
                    if not jumpPowerConnection then
                        jumpPowerConnection = RunService.Heartbeat:Connect(function()
                            local char = LocalPlayer.Character
                            if not char then return end
                            local hum = char:FindFirstChildOfClass("Humanoid")
                            if hum and hum.JumpPower ~= jumpPowerValue then
                                hum.UseJumpPower = true
                                hum.JumpPower    = jumpPowerValue
                            end
                        end)
                    end
                else
                    if jumpPowerConnection then
                        jumpPowerConnection:Disconnect()
                        jumpPowerConnection = nil
                    end
                    if jumpPowerCharConn then
                        jumpPowerCharConn:Disconnect()
                        jumpPowerCharConn = nil
                    end
                    pcall(function()
                        local char = LocalPlayer.Character
                        if not char then return end
                        local hum = char:FindFirstChildOfClass("Humanoid")
                        if hum and self._originalJumpPower ~= nil then
                            hum.UseJumpPower = self._originalUseJumpPower
                            if hum.UseJumpPower then
                                hum.JumpPower = self._originalJumpPower
                            else
                                hum.JumpHeight = self._originalJumpPower
                            end
                        end
                    end)
                end
            end)
        end
    })

    configLeft:AddSlider({
        Name      = "JumpPower Value",
        Min       = 50,
        Max       = 300,
        Default   = 50,
        Flag      = "BuiltIn_JumpPower",
        Callback  = function(v)
            jumpPowerValue = v
            if jumpPowerConnection then
                pcall(function()
                    local char = LocalPlayer.Character
                    if not char then return end
                    local hum = char:FindFirstChildOfClass("Humanoid")
                    if hum then
                        hum.UseJumpPower = true
                        hum.JumpPower    = v
                    end
                end)
            end
        end
    })

    configLeft:AddDivider()

    -- Fly Setup
    local flying = false
    local flyVel = nil
    local flyGyro = nil
    local flySpeed = 50
    local flyCollisions = {}
    local flyCollisionConn = nil
    local flySteppedConn = nil
    local flyControls = nil
    local flyPadGui = nil
    local flyUp, flyDown = false, false

    local function stopFly()
        flying = false
        flyUp, flyDown = false, false
        if flyPadGui then
            pcall(function() flyPadGui:Destroy() end)
            flyPadGui = nil
        end
        if flyVel and flyVel.Parent then
            flyVel.Velocity = Vector3.zero
            flyVel:Destroy()
        end
        flyVel = nil
        self._flyVel = nil
        if flyGyro and flyGyro.Parent then
            flyGyro:Destroy()
        end
        flyGyro = nil
        self._flyGyro = nil
        if flyCollisionConn then
            flyCollisionConn:Disconnect()
            flyCollisionConn = nil
        end
        if flySteppedConn then
            flySteppedConn:Disconnect()
            flySteppedConn = nil
        end
        for part, original in pairs(flyCollisions) do
            if part and part.Parent then
                pcall(function() part.CanCollide = original end)
            end
        end
        flyCollisions = {}
        pcall(function()
            local char = LocalPlayer.Character
            local hum = char and char:FindFirstChildOfClass("Humanoid")
            if hum then hum.PlatformStand = false end
        end)
    end
    self._stopFly = stopFly

    configLeft:AddToggle({
        Name = "Fly",
        Default = false,
        Flag = "BuiltIn_Fly",
        Keybind = Enum.KeyCode.F3,
        Callback = function(v)
            if not v then
                stopFly()
                return
            end
            flying = true
            local char = LocalPlayer.Character
            if not char then flying = false return end
            local hrp = char:FindFirstChild("HumanoidRootPart")
            local hum = char:FindFirstChildOfClass("Humanoid")
            if not hrp then flying = false return end

            if hum then hum.PlatformStand = true end

            if flyVel and flyVel.Parent then flyVel:Destroy() end
            flyVel = Instance.new("BodyVelocity")
            flyVel.MaxForce = Vector3.new(1, 1, 1) * 10^6
            flyVel.Velocity = Vector3.zero
            flyVel.Parent = hrp
            self._flyVel = flyVel

            -- Keeps the HRP upright/facing the camera so it doesn't tumble
            -- from physics torque once PlatformStand disables Humanoid rotation control.
            if flyGyro and flyGyro.Parent then flyGyro:Destroy() end
            flyGyro = Instance.new("BodyGyro")
            flyGyro.MaxTorque = Vector3.new(1, 1, 1) * 10^6
            flyGyro.P = 3000
            flyGyro.D = 500
            flyGyro.CFrame = hrp.CFrame
            flyGyro.Parent = hrp
            self._flyGyro = flyGyro

            -- Disables collision on the whole character so bumping into geometry
            -- can't shove/flip the HRP hard enough to overpower the gyro.
            flyCollisions = {}
            for _, part in ipairs(char:GetDescendants()) do
                if part:IsA("BasePart") then
                    flyCollisions[part] = part.CanCollide
                    part.CanCollide = false
                end
            end
            if flyCollisionConn then flyCollisionConn:Disconnect() end
            flyCollisionConn = char.DescendantAdded:Connect(function(part)
                if flying and part:IsA("BasePart") then
                    if flyCollisions[part] == nil then
                        flyCollisions[part] = part.CanCollide
                    end
                    part.CanCollide = false
                end
            end)

            if flySteppedConn then flySteppedConn:Disconnect() end
            flySteppedConn = RunService.Stepped:Connect(function()
                if not flying then return end
                local currentChar = LocalPlayer.Character
                if not currentChar then return end
                for _, part in ipairs(currentChar:GetDescendants()) do
                    if part:IsA("BasePart") and part.CanCollide then
                        if flyCollisions[part] == nil then
                            flyCollisions[part] = part.CanCollide
                        end
                        part.CanCollide = false
                    end
                end
            end)

            -- IsKeyDown only ever sees a physical keyboard, so reading WASD/Space/Ctrl left
            -- mobile with a permanently zero direction - fly "worked" but never moved. The
            -- PlayerModule control set reports whatever the active device is actually doing
            -- (keyboard, touch thumbstick or gamepad), so take horizontal input from there.
            flyControls = nil
            pcall(function()
                local pm = LocalPlayer:FindFirstChild("PlayerScripts")
                pm = pm and pm:FindFirstChild("PlayerModule")
                if pm then flyControls = require(pm):GetControls() end
            end)

            -- Touch has no Space/LeftControl, so vertical needs on-screen buttons.
            if self.IsMobile then
                flyPadGui = self:CreateFlyPad(function(up) flyUp = up end, function(down) flyDown = down end)
            end

            task.spawn(function()
                while flying and flyVel and flyVel.Parent and hrp and hrp.Parent do
                    local cam = workspace.CurrentCamera
                    local dir = Vector3.zero

                    if self.IsMobile and flyControls then
                        local okMove, mv = pcall(function() return flyControls:GetMoveVector() end)
                        if okMove and typeof(mv) == "Vector3" and mv.Magnitude > 0.01 then
                            dir = dir + cam.CFrame.RightVector * mv.X - cam.CFrame.LookVector * mv.Z
                        end
                    else
                        if UserInputService:IsKeyDown(Enum.KeyCode.W) then dir = dir + cam.CFrame.LookVector end
                        if UserInputService:IsKeyDown(Enum.KeyCode.S) then dir = dir - cam.CFrame.LookVector end
                        if UserInputService:IsKeyDown(Enum.KeyCode.A) then dir = dir - cam.CFrame.RightVector end
                        if UserInputService:IsKeyDown(Enum.KeyCode.D) then dir = dir + cam.CFrame.RightVector end
                    end

                    if flyUp or UserInputService:IsKeyDown(Enum.KeyCode.Space) then dir = dir + Vector3.new(0, 1, 0) end
                    if flyDown or UserInputService:IsKeyDown(Enum.KeyCode.LeftControl) then dir = dir - Vector3.new(0, 1, 0) end

                    if dir.Magnitude > 1 then dir = dir.Unit end
                    flyVel.Velocity = dir * flySpeed
                    if flyGyro and flyGyro.Parent then
                        -- Looking close to straight up/down collapses this
                        -- flattened vector to near-zero, which previously
                        -- fed CFrame.new(zero, zero) — a degenerate lookAt
                        -- call (identical position and target) that
                        -- produces an undefined/NaN rotation. BodyGyro then
                        -- applies that NaN as its torque target, which is a
                        -- textbook cause of a violent, uncontrolled fling.
                        -- Skip the update for that frame instead — keeping
                        -- the last valid facing is harmless and avoids ever
                        -- constructing a degenerate CFrame.
                        local flatLook = cam.CFrame.LookVector * Vector3.new(1, 0, 1)
                        if flatLook.Magnitude > 0.05 then
                            flyGyro.CFrame = CFrame.new(Vector3.zero, flatLook)
                        end
                    end
                    task.wait()
                end
                if flyVel and flyVel.Parent then flyVel:Destroy() end
                if flyGyro and flyGyro.Parent then flyGyro:Destroy() end
            end)
        end
    })

    configLeft:AddSlider({
        Name = "Fly Speed",
        Min = 10,
        Max = 500,
        Default = 50,
        Increment = 5,
        Flag = "BuiltIn_FlySpeed",
        Callback = function(v)
            flySpeed = v
        end
    })

    configLeft:AddDivider()

    -- NoClip
    local noclipEnabled = false
    local noclipConn    = nil

    configLeft:AddToggle({
        Name    = "NoClip",
        Default = false,
        Flag    = "BuiltIn_NoClip",
        Keybind = Enum.KeyCode.N,
        Tooltip = "Walk through walls (toggle with N)",
        Callback = function(v)
            noclipEnabled = v
            if v then
                if not noclipConn then
                    noclipConn = RunService.Stepped:Connect(function()
                        if not noclipEnabled then return end
                        local char = LocalPlayer.Character
                        if not char then return end
                        for _, part in ipairs(char:GetDescendants()) do
                            if part:IsA("BasePart") then
                                part.CanCollide = false
                            end
                        end
                    end)
                end
            else
                if noclipConn then
                    noclipConn:Disconnect()
                    noclipConn = nil
                end
                pcall(function()
                    local char = LocalPlayer.Character
                    if not char then return end
                    local hum = char:FindFirstChildOfClass("Humanoid")
                    if hum then hum.PlatformStand = false end
                    for _, part in ipairs(char:GetDescendants()) do
                        if part:IsA("BasePart") then
                            part.CanCollide = true
                        end
                    end
                end)
            end
        end
    })

    -- Infinite Jump
    local infJumpEnabled = false

    configLeft:AddToggle({
        Name    = "Infinite Jump",
        Default = false,
        Flag    = "BuiltIn_InfiniteJump",
        Tooltip = "Jump again while airborne",
        Callback = function(v)
            infJumpEnabled = v
        end
    })

    UserInputService.JumpRequest:Connect(function()
        if not infJumpEnabled then return end
        local char = LocalPlayer.Character
        if not char then return end
        local hum = char:FindFirstChildOfClass("Humanoid")
        if not hum then return end
        local state = hum:GetState()
        if state == Enum.HumanoidStateType.Freefall
        or state == Enum.HumanoidStateType.Jumping then
            hum:ChangeState(Enum.HumanoidStateType.Jumping)
        end
    end)

    -- ── Right Column: Misc / UI Settings ────────────────────────────────────
    configRight:AddLabel({ Text = "Script by: Seisen" })

    local gameName = "Unknown Game"
    pcall(function()
        local MarketplaceService = game:GetService("MarketplaceService")
        local success, info = pcall(function()
            return MarketplaceService:GetProductInfo(game.PlaceId)
        end)
        if success and info then
            gameName = info.Name
        end
    end)
    configRight:AddLabel({ Text = "Game: " .. gameName })

    configRight:AddButton({
        Name = "Join Discord",
        Callback = function()
            setclipboard("https://discord.gg/F4sAf6z8Ph")
        end
    })

    configRight:AddDivider()

    -- FOV — use a persistent RenderStepped enforcer so games can't override it
    local _origFOV = 70
    pcall(function() _origFOV = workspace.CurrentCamera.FieldOfView end)
    local _fovValue   = 70
    local _fovEnabled = false
    RunService.RenderStepped:Connect(function()
        if _fovEnabled then
            pcall(function()
                workspace.CurrentCamera.FieldOfView = _fovValue
            end)
        end
    end)

    configRight:AddToggle({
        Name    = "Custom FOV",
        Default = false,
        Flag    = "BuiltIn_FOVToggle",
        Tooltip = "Override the camera field of view",
        Callback = function(v)
            _fovEnabled = v
            if not v then
                pcall(function()
                    workspace.CurrentCamera.FieldOfView = _origFOV
                end)
            end
        end
    })

    configRight:AddSlider({
        Name      = "FOV",
        Min       = 30,
        Max       = 120,
        Default   = 70,
        Increment = 1,
        Flag      = "BuiltIn_FOV",
        Tooltip   = "Camera field of view",
        Callback  = function(v)
            _fovValue = v
            if _fovEnabled then
                pcall(function()
                    workspace.CurrentCamera.FieldOfView = v
                end)
            end
        end
    })

    configRight:AddDivider()

    -- Anti-AFK
    local antiAfk = false
    local antiAfkConnection = nil
    configRight:AddToggle({
        Name = "Anti-AFK",
        Default = false,
        Flag = "BuiltIn_AntiAFK",
        Callback = function(v)
            antiAfk = v
            if antiAfk then
                if not antiAfkConnection then
                    local VirtualUser = game:GetService("VirtualUser")
                    antiAfkConnection = LocalPlayer.Idled:Connect(function()
                        if antiAfk then
                            VirtualUser:CaptureController()
                            VirtualUser:ClickButton2(Vector2.new())
                        end
                    end)
                end
            else
                if antiAfkConnection then
                    antiAfkConnection:Disconnect()
                    antiAfkConnection = nil
                end
            end
        end
    })

    -- FPS Boost
    local fpsBoostEnabled = false
    local originalSettings = {}
    local savedEffects    = {}
    local savedMaterials  = {}
    local savedPostFX     = {}
    local savedTerrain    = {}
    local fpsBoostConnection = nil

    local function processObject(obj)
        pcall(function()
            if obj:IsA("ParticleEmitter") or obj:IsA("Trail") or obj:IsA("Beam")
                or obj:IsA("Fire") or obj:IsA("Smoke") or obj:IsA("Sparkles") then
                if savedEffects[obj] == nil then
                    savedEffects[obj] = obj.Enabled
                end
                obj.Enabled = false
            end
        end)
    end

    configRight:AddToggle({
        Name = "FPS Boost",
        Default = false,
        Flag = "BuiltIn_FPSBoost",
        Tooltip = "Optimize graphics for better performance",
        Callback = function(v)
            fpsBoostEnabled = v
            local Lighting = game:GetService("Lighting")
            local Terrain  = workspace:FindFirstChildOfClass("Terrain")

            if fpsBoostEnabled then
                originalSettings.GlobalShadows = Lighting.GlobalShadows
                originalSettings.FogEnd        = Lighting.FogEnd
                originalSettings.FogStart      = Lighting.FogStart
                Lighting.GlobalShadows = false
                Lighting.FogEnd        = 100000
                Lighting.FogStart      = 100000

                local postFXClasses = {
                    "BloomEffect", "BlurEffect", "DepthOfFieldEffect",
                    "SunRaysEffect"
                }
                for _, child in ipairs(Lighting:GetChildren()) do
                    for _, cls in ipairs(postFXClasses) do
                        if child:IsA(cls) then
                            if savedPostFX[child] == nil then
                                savedPostFX[child] = { Enabled = child.Enabled }
                            end
                            child.Enabled = false
                            break
                        end
                    end
                end

                if Terrain then
                    pcall(function()
                        savedTerrain.Decoration        = Terrain.Decoration
                        savedTerrain.WaterWaveSize     = Terrain.WaterWaveSize
                        savedTerrain.WaterWaveSpeed    = Terrain.WaterWaveSpeed
                        savedTerrain.WaterReflectance  = Terrain.WaterReflectance
                        savedTerrain.WaterTransparency = Terrain.WaterTransparency
                        Terrain.Decoration        = false
                        Terrain.WaterWaveSize     = 0
                        Terrain.WaterWaveSpeed    = 0
                        Terrain.WaterReflectance  = 0
                        Terrain.WaterTransparency = 0.5
                    end)
                end

                for _, obj in ipairs(workspace:GetDescendants()) do
                    processObject(obj)
                end

                if not fpsBoostConnection then
                    fpsBoostConnection = workspace.DescendantAdded:Connect(function(obj)
                        if fpsBoostEnabled then processObject(obj) end
                    end)
                end

                pcall(function()
                    settings().Rendering.QualityLevel = Enum.QualityLevel.Level01
                end)
            else
                if fpsBoostConnection then
                    fpsBoostConnection:Disconnect()
                    fpsBoostConnection = nil
                end

                if originalSettings.GlobalShadows ~= nil then
                    Lighting.GlobalShadows = originalSettings.GlobalShadows
                    Lighting.FogEnd        = originalSettings.FogEnd
                    Lighting.FogStart      = originalSettings.FogStart
                    originalSettings = {}
                end

                for obj, saved in pairs(savedPostFX) do
                    pcall(function()
                        if obj and obj.Parent then obj.Enabled = saved.Enabled end
                    end)
                end
                savedPostFX = {}

                if Terrain and next(savedTerrain) then
                    pcall(function()
                        Terrain.Decoration        = savedTerrain.Decoration
                        Terrain.WaterWaveSize     = savedTerrain.WaterWaveSize
                        Terrain.WaterWaveSpeed    = savedTerrain.WaterWaveSpeed
                        Terrain.WaterReflectance  = savedTerrain.WaterReflectance
                        Terrain.WaterTransparency = savedTerrain.WaterTransparency
                    end)
                    savedTerrain = {}
                end

                pcall(function()
                    settings().Rendering.QualityLevel = Enum.QualityLevel.Automatic
                end)

                for obj, wasEnabled in pairs(savedEffects) do
                    pcall(function()
                        if obj and obj.Parent then obj.Enabled = wasEnabled end
                    end)
                end
                savedEffects = {}
            end
        end
    })

    -- SmoothPlastic Mode (FPS Boost +)
    local smoothPlasticEnabled = false
    local spMaterials  = {}
    local spConnection = nil

    configRight:AddToggle({
        Name = "FPS Boost +",
        Default = false,
        Flag = "BuiltIn_SmoothPlastic",
        Tooltip = "Replace all part materials with SmoothPlastic for better FPS",
        Callback = function(v)
            smoothPlasticEnabled = v

            local function applyToObj(obj)
                pcall(function()
                    if obj:IsA("BasePart") and obj.Material ~= Enum.Material.SmoothPlastic then
                        if spMaterials[obj] == nil then
                            spMaterials[obj] = obj.Material
                        end
                        obj.Material = Enum.Material.SmoothPlastic
                    end
                end)
            end

            if smoothPlasticEnabled then
                for _, obj in ipairs(workspace:GetDescendants()) do
                    applyToObj(obj)
                end
                if not spConnection then
                    spConnection = workspace.DescendantAdded:Connect(function(obj)
                        if smoothPlasticEnabled then applyToObj(obj) end
                    end)
                end
            else
                if spConnection then
                    spConnection:Disconnect()
                    spConnection = nil
                end
                for obj, mat in pairs(spMaterials) do
                    pcall(function()
                        if obj and obj.Parent then obj.Material = mat end
                    end)
                end
                spMaterials = {}
            end
        end
    })

    configRight:AddToggle({
        Name = "Auto Hide UI",
        Default = false,
        Flag = "BuiltIn_AutoHideUI",
        Tooltip = "Automatically hide the UI when the script loads",
        Callback = function(v)
            if v then
                task.defer(function()
                    Library:Toggle(false)
                end)
            end
        end
    })

    configRight:AddToggle({
        Name = "Show Keybinds Panel",
        Default = false,
        Flag = "BuiltIn_ShowKeybinds",
        Tooltip = "Show/hide the floating keybinds list",
        Callback = function(v)
            if Library.KeybindFrame then
                Library.KeybindFrame.Visible = v
                if v and Library._refreshKeybindEmptyHint then
                    Library._refreshKeybindEmptyHint()
                end
            end
        end
    })

    local _fbOrigBrightness  = 1
    local _fbOrigClockTime   = 14
    local _fbOrigAmbient     = Color3.new(0, 0, 0)
    local _fbOrigOutdoor     = Color3.new(0.5, 0.5, 0.5)
    pcall(function()
        local L = game:GetService("Lighting")
        _fbOrigBrightness = L.Brightness
        _fbOrigClockTime  = L.ClockTime
        _fbOrigAmbient    = L.Ambient
        _fbOrigOutdoor    = L.OutdoorAmbient
    end)

    configRight:AddToggle({
        Name = "Fullbright", Flag = "CFG_Fullbright", Default = false,
        Tooltip = "Remove all darkness so the world is fully lit",
        Callback = function(v)
            pcall(function()
                local L = game:GetService("Lighting")
                if v then
                    L.Brightness     = 2
                    L.ClockTime      = 14
                    L.Ambient        = Color3.new(1, 1, 1)
                    L.OutdoorAmbient = Color3.new(1, 1, 1)
                else
                    L.Brightness     = _fbOrigBrightness
                    L.ClockTime      = _fbOrigClockTime
                    L.Ambient        = _fbOrigAmbient
                    L.OutdoorAmbient = _fbOrigOutdoor
                end
            end)
        end
    })

    -- Auto-Rejoin
    local autoRejoin = false
    local autoRejoinConn1 = nil
    local autoRejoinConn2 = nil
    local autoRejoinVisConns = {}
    local rejoining = false

    local function doRejoin()
        if rejoining then return end
        rejoining = true
        Library:Notify({
            Title = "Auto-Rejoin",
            Content = "Rejoining in 5 seconds...",
            Duration = 5,
            Type = "warning"
        })
        task.wait(5)
        local TeleportService = game:GetService("TeleportService")
        local Players = game:GetService("Players")
        if #Players:GetPlayers() <= 1 then
            pcall(function()
                TeleportService:Teleport(game.PlaceId, LocalPlayer)
            end)
        else
            pcall(function()
                TeleportService:TeleportToPlaceInstance(game.PlaceId, game.JobId, LocalPlayer)
            end)
        end
    end

    -- ErrorPrompt is a permanent hidden child of promptOverlay, not one that gets
    -- added/removed per error, so ChildAdded never fires for it. The only real
    -- signal is its Visible property flipping true when a disconnect/error occurs.
    local function watchErrorPrompt(prompt)
        if not prompt or not prompt:IsA("GuiObject") then return end
        if autoRejoin and prompt.Visible then
            task.spawn(doRejoin)
        end
        local conn = prompt:GetPropertyChangedSignal("Visible"):Connect(function()
            if autoRejoin and prompt.Visible then
                task.spawn(doRejoin)
            end
        end)
        table.insert(autoRejoinVisConns, conn)
    end

    configRight:AddToggle({
        Name = "Auto-Rejoin",
        Default = false,
        Flag = "BuiltIn_AutoRejoin",
        Tooltip = "Automatically rejoin the game when disconnected or kicked",
        Callback = function(v)
            autoRejoin = v
            if autoRejoin then
                rejoining = false
                local CoreGui = game:GetService("CoreGui")
                local promptOverlay = CoreGui:FindFirstChild("RobloxPromptGui") and CoreGui.RobloxPromptGui:FindFirstChild("promptOverlay")
                if promptOverlay then
                    for _, child in ipairs(promptOverlay:GetChildren()) do
                        if child.Name == "ErrorPrompt" then
                            watchErrorPrompt(child)
                        end
                    end
                    autoRejoinConn1 = promptOverlay.ChildAdded:Connect(function(child)
                        if child.Name == "ErrorPrompt" then
                            watchErrorPrompt(child)
                        end
                    end)
                end

                local GuiService = game:GetService("GuiService")
                autoRejoinConn2 = GuiService.ErrorMessageChanged:Connect(function(message)
                    if autoRejoin and message ~= "" then
                        task.spawn(doRejoin)
                    end
                end)
            else
                if autoRejoinConn1 then
                    autoRejoinConn1:Disconnect()
                    autoRejoinConn1 = nil
                end
                if autoRejoinConn2 then
                    autoRejoinConn2:Disconnect()
                    autoRejoinConn2 = nil
                end
                for _, conn in ipairs(autoRejoinVisConns) do
                    pcall(function() conn:Disconnect() end)
                end
                table.clear(autoRejoinVisConns)
            end
        end
    })

    -- FPS Uncapper Section
    local fpsCapValue = 144  -- upvalue shared by both toggle and slider
    configRight:AddDivider()
    configRight:AddToggle({
        Name = "Unlock FPS",
        Default = false,
        Flag = "BuiltIn_UnlockFPS",
        Tooltip = "Remove the Roblox 60 FPS cap and allow higher frame rates",
        Callback = function(v)
            pcall(function()
                if setfpscap then
                    setfpscap(v and fpsCapValue or 60)
                elseif set_fps_cap then
                    set_fps_cap(v and fpsCapValue or 60)
                end
            end)
        end
    })
    configRight:AddSlider({
        Name = "FPS Limit",
        Min = 30,
        Max = 360,
        Default = 144,
        Increment = 5,
        Flag = "BuiltIn_FPSCap",
        Tooltip = "Maximum FPS cap when Unlock FPS is enabled",
        Callback = function(v)
            fpsCapValue = v  -- always update shared upvalue
            pcall(function()
                if Library.Toggles["BuiltIn_UnlockFPS"] and Library.Toggles["BuiltIn_UnlockFPS"].Value then
                    if setfpscap then
                        setfpscap(v)
                    elseif set_fps_cap then
                        set_fps_cap(v)
                    end
                end
            end)
        end
    })

    configRight:AddDivider()

    -- UI Settings Section
    configUI:AddSlider({
        Name = "UI Scale", Min = 50, Max = 150, Default = math.floor((self._baseScale or 1) * 100),
        Increment = 5, Suffix = "%", Flag = "BuiltIn_UIScale",
        Tooltip = "Manually adjust the UI size. 100% = default.",
        Callback = function(v)
            self:SetScale(v / 100)
        end,
    })

    configUI:AddKeybind({
        Name = "Open / Close Key", Default = self.ToggleKeybind or Enum.KeyCode.LeftAlt,
        Flag = "BuiltIn_ToggleKey",
        Tooltip = "Key that shows / hides the UI.",
        Callback = function(k)
            self.ToggleKeybind = k
        end,
    })

    configUI:AddToggle({
        Name = "Show Notifications", Default = self.NotificationsEnabled ~= false,
        Flag = "BuiltIn_NotifyEnabled",
        Tooltip = "Enable or disable all popup notifications.",
        Callback = function(v)
            self.NotificationsEnabled = v
        end,
    })

    self.PlayerSettings = configLeft
    self.UISettings     = configRight
    self.SettingsTab    = configTab

    return configTab
end

function Library:_BuildESPTab(window)
    self:_EnsureBuiltInSection(window)
    local espTab   = window:AddTab("ESP", "eye", true)
    local espLeft  = espTab:AddLeftSection("Players", "users")
    local espRight = espTab:AddRightSection("Options", "sliders-horizontal")

    local espLib             = nil
    local playerESPs         = {}
    local espEnabled         = false
    local espHighlight       = true
    local espNameTag         = true
    local espDistance        = true
    local espTracers         = false
    local espArrow           = false
    local espBox2D           = false
    local espBox3D           = false
    local espSkeleton        = false
    local espTeamColor       = false
    local espRainbow         = false
    local espColor           = Color3.fromRGB(255, 80, 80)
    local espMaxDist         = 5000
    local espPlayerAddConn   = nil
    local espPlayerRemConn   = nil
    local espCharConns       = {}

    local function getESP()
        if espLib and not espLib.Destroyed then return espLib end
        local g = (getgenv and getgenv()) or shared
        if g.mstudio45_ESP and not g.mstudio45_ESP.Destroyed then
            espLib = g.mstudio45_ESP
            return espLib
        end
        if self.ESPUrl then
            pcall(function()
                loadstring(game:HttpGet(self.ESPUrl, true))()
            end)
            local g2 = (getgenv and getgenv()) or shared
            if g2.mstudio45_ESP and not g2.mstudio45_ESP.Destroyed then
                espLib = g2.mstudio45_ESP
                return espLib
            end
        end
        return nil
    end

    local function playerColor(player)
        if espTeamColor and player.Team then
            return player.Team.TeamColor.Color
        end
        return espColor
    end

    local function addESP(player)
        if player == LocalPlayer then return end
        if playerESPs[player] then return end
        local lib = getESP()
        if not lib then return end
        local char = player.Character
        if not char then return end
        local col = playerColor(player)
        local ok, inst = pcall(function()
            return lib:Add({
                Name               = player.Name,
                Model              = char,
                ESPType            = "Highlight",
                MaxDistance        = espMaxDist,
                Color              = col,
                FillColor          = col,
                OutlineColor       = col,
                FillTransparency   = 0.6,
                OutlineTransparency = 0,
                Visible            = espHighlight,
                Tracer = {
                    Enabled      = espTracers,
                    Color        = col,
                    Thickness    = 1,
                    Transparency = 0,
                    From         = "Bottom"
                },
                Arrow = {
                    Enabled      = espArrow,
                    Color        = col,
                    CenterOffset = 300,
                },
                Box2D = {
                    Enabled      = espBox2D,
                    Color        = col,
                    Thickness    = 1,
                    Transparency = 0,
                    Filled       = false,
                },
                Box3D = {
                    Enabled      = espBox3D,
                    Color        = col,
                    Thickness    = 1,
                    Transparency = 0,
                },
                Skeleton = {
                    Enabled      = espSkeleton,
                    Color        = col,
                    Thickness    = 1,
                    Transparency = 0,
                },
            })
        end)
        if ok and inst then
            playerESPs[player] = inst
        end
    end

    local function removeESP(player)
        local inst = playerESPs[player]
        if inst then
            pcall(function() inst:Destroy() end)
            playerESPs[player] = nil
        end
    end

    local function clearESPs()
        for p, _ in pairs(playerESPs) do
            removeESP(p)
        end
    end

    local function enableESP()
        local lib = getESP()
        if not lib then
            self:Notify({ Title = "ESP", Content = "ESP library not found.\nSet Library.ESPUrl or load ESP.lua before enabling.", Duration = 6, Type = "error" })
            if self.Toggles and self.Toggles["BuiltIn_PlayerESP"] then
                self.Toggles["BuiltIn_PlayerESP"]:SetValue(false)
            end
            return
        end
        lib.GlobalConfig.Billboards = espNameTag
        lib.GlobalConfig.Distance   = espDistance
        lib.GlobalConfig.Tracers    = espTracers
        lib.GlobalConfig.Arrows     = espArrow
        lib.GlobalConfig.Boxes2D    = espBox2D
        lib.GlobalConfig.Boxes3D    = espBox3D
        lib.GlobalConfig.Skeleton   = espSkeleton
        lib.GlobalConfig.Rainbow    = espRainbow
        for _, p in ipairs(Players:GetPlayers()) do
            task.spawn(addESP, p)
        end
        espPlayerAddConn = Players.PlayerAdded:Connect(function(p)
            if not espEnabled then return end
            local charConn
            charConn = p.CharacterAdded:Connect(function()
                if not espEnabled then
                    charConn:Disconnect()
                    return
                end
                removeESP(p)
                task.wait(0.5)
                addESP(p)
            end)
            espCharConns[p] = charConn
            task.spawn(addESP, p)
        end)
        espPlayerRemConn = Players.PlayerRemoving:Connect(function(p)
            removeESP(p)
            if espCharConns[p] then
                pcall(function() espCharConns[p]:Disconnect() end)
                espCharConns[p] = nil
            end
        end)
        for _, p in ipairs(Players:GetPlayers()) do
            if p ~= LocalPlayer and not espCharConns[p] then
                local charConn
                charConn = p.CharacterAdded:Connect(function()
                    if not espEnabled then
                        charConn:Disconnect()
                        return
                    end
                    removeESP(p)
                    task.wait(0.5)
                    addESP(p)
                end)
                espCharConns[p] = charConn
            end
        end
    end

    local function disableESP()
        if espPlayerAddConn then espPlayerAddConn:Disconnect(); espPlayerAddConn = nil end
        if espPlayerRemConn then espPlayerRemConn:Disconnect(); espPlayerRemConn = nil end
        for _, conn in pairs(espCharConns) do
            pcall(function() conn:Disconnect() end)
        end
        espCharConns = {}
        clearESPs()
    end

    -- ── Controls ─────────────────────────────────────────────────
    espLeft:AddToggle({
        Name    = "Player ESP",
        Default = false,
        Flag    = "BuiltIn_PlayerESP",
        Tooltip = "Highlight all players in the server",
        Callback = function(v)
            espEnabled = v
            if v then enableESP() else disableESP() end
        end
    })

    espLeft:AddToggle({
        Name    = "Highlight",
        Default = true,
        Flag    = "BuiltIn_ESPHighlight",
        Tooltip = "Show chams/highlight on players",
        Callback = function(v)
            espHighlight = v
            for _, inst in pairs(playerESPs) do
                pcall(function()
                    if v then inst:Show() else inst:Hide() end
                end)
            end
        end
    })

    espLeft:AddToggle({
        Name    = "Name Tag",
        Default = true,
        Flag    = "BuiltIn_ESPNameTag",
        Tooltip = "Show player name above their head",
        Callback = function(v)
            espNameTag = v
            if espLib then espLib.GlobalConfig.Billboards = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Show Distance",
        Default = true,
        Flag    = "BuiltIn_ESPDistance",
        Tooltip = "Show stud distance in name tag",
        Callback = function(v)
            espDistance = v
            if espLib then espLib.GlobalConfig.Distance = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Tracers",
        Default = false,
        Flag    = "BuiltIn_ESPTracers",
        Tooltip = "Draw a line from the screen to each player",
        Callback = function(v)
            espTracers = v
            if espLib then espLib.GlobalConfig.Tracers = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Arrow",
        Default = false,
        Flag    = "BuiltIn_ESPArrow",
        Tooltip = "Show off-screen indicator arrow pointing to players",
        Callback = function(v)
            espArrow = v
            if espLib then espLib.GlobalConfig.Arrows = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Box 2D",
        Default = false,
        Flag    = "BuiltIn_ESPBox2D",
        Tooltip = "Draw a 2D screen-space bounding box around players",
        Callback = function(v)
            espBox2D = v
            if espLib then espLib.GlobalConfig.Boxes2D = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Box 3D",
        Default = false,
        Flag    = "BuiltIn_ESPBox3D",
        Tooltip = "Draw a 3D wireframe box around players in world space",
        Callback = function(v)
            espBox3D = v
            if espLib then espLib.GlobalConfig.Boxes3D = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Skeleton",
        Default = false,
        Flag    = "BuiltIn_ESPSkeleton",
        Tooltip = "Show bone skeleton lines on players",
        Callback = function(v)
            espSkeleton = v
            if espLib then espLib.GlobalConfig.Skeleton = v end
        end
    })

    espLeft:AddToggle({
        Name    = "Team Color",
        Default = false,
        Flag    = "BuiltIn_ESPTeamColor",
        Tooltip = "Use team colors instead of custom color",
        Callback = function(v)
            espTeamColor = v
        end
    })

    espLeft:AddToggle({
        Name    = "Rainbow",
        Default = false,
        Flag    = "BuiltIn_ESPRainbow",
        Tooltip = "Cycle ESP color through rainbow",
        Callback = function(v)
            espRainbow = v
            if espLib then espLib.GlobalConfig.Rainbow = v end
        end
    })

    -- ── Right options ─────────────────────────────────────────────
    espRight:AddColorPicker({
        Name    = "ESP Color",
        Default = Color3.fromRGB(255, 80, 80),
        Flag    = "BuiltIn_ESPColor",
        Callback = function(v)
            espColor = v
            if not espTeamColor then
                for _, inst in pairs(playerESPs) do
                    pcall(function() inst:SetEveryColor(v, true) end)
                end
            end
        end
    })

    espRight:AddSlider({
        Name      = "Max Distance",
        Min       = 100,
        Max       = 10000,
        Default   = 5000,
        Increment = 100,
        Flag      = "BuiltIn_ESPMaxDist",
        Tooltip   = "How far away players are visible",
        Callback  = function(v)
            espMaxDist = v
            for _, inst in pairs(playerESPs) do
                pcall(function() inst.CurrentSettings.MaxDistance = v end)
            end
        end
    })

    espRight:AddSlider({
        Name      = "Fill Transparency",
        Min       = 0,
        Max       = 100,
        Default   = 60,
        Increment = 5,
        Flag      = "BuiltIn_ESPFillAlpha",
        Tooltip   = "Highlight fill transparency (0 = solid, 100 = invisible)",
        Callback  = function(v)
            local alpha = v / 100
            for _, inst in pairs(playerESPs) do
                pcall(function() inst.CurrentSettings.FillTransparency = alpha end)
            end
        end
    })

    return espTab
end

function Library:_BuildGamesTab(window)
    self:_EnsureBuiltInSection(window)
    local theme = self.Theme

    -- Sidebar btn registered synchronously so collapse/expand works immediately
    local gamesTab = window:AddTab("Games", "gamepad-2", true)
    local left     = gamesTab:AddLeftSection("Supported",    "check-circle")
    local right    = gamesTab:AddRightSection("Discontinued", "x-circle")
    left:AddLabel({ Text = "Supported games:" })
    right:AddLabel({ Text = "Discontinued games:" })

    local GameNameMap = {
        ["10178802449"] = "+1 Mine Per Click",
        ["7882829745"]  = "Anime Eternal",
        ["8469926548"]  = "Anime Fight",
        ["7613921865"]  = "Anime Expeditions",
        ["9774981774"]  = "Anime Re:Ranger X",
        ["7074860883"]  = "Arise Crossover",
        ["111958650"]   = "Arsenal",
        ["8220767002"]  = "Bee Garden",
        ["5803093656"]  = "Blue Heater 2",
        ["7541395924"]  = "Build an Island",
        ["10265803948"] = "Build a Soccer Squad",
        ["8066283370"]  = "Build a Zoo",
        ["8820222330"]  = "Dig a Brainrot",
        ["7468338447"]  = "Dig to Earth",
        ["7546582051"]  = "Dungeon Heroes",
        ["9826885587"]  = "Evomon",
        ["8328640632"]  = "Farm It",
        ["6701277882"]  = "Fish It",
        ["9509842868"]  = "Garden Horizon",
        ["10200395747"] = "Grow a Garden",
        ["5995470825"]  = "Hypershot",
        ["9529182643"]  = "Levelbound",
        ["8316902627"]  = "Plant vs Brainrot",
        ["8662243497"]  = "Raft 101 Survival",
        ["6867859535"]  = "RE:XL",
        ["7094518649"]  = "Restaurant Tycoon 3",
        ["9792947201"]  = "Slime RNG",
        ["9073775318"]  = "Smile Seas",
        ["9802644580"]  = "Summon Heroes",
        ["4093155512"]  = "Swordburst 3",
        ["7671049560"]  = "The Forge",
        ["10039338037"] = "Build a Ring Farm",
        ["10006104044"] = "Wizard Alchemy",
        ["10035204815"] = "Ride a Pet",
        ["10502841145"] = "Anime Astral Simulator",
        ["10539411000"] = "Clean all the Leaves",
        ["10563114921"] = "Steal an Egg",
        ["10684750879"] = "+1 Loot to Forge",
        ["10765288803"] = "Break and Steal an Egg",
        ["5595353122"]  = "Slayer 2",
        ["6035872082"]  = "Rivals",
        ["8946565814"]  = "Anime Origins",
        ["985731078"]   = "World // Zero",
        ["9970645639"]  = "Run a Restaurant",
    }

    task.spawn(function()
        local ok,  Games        = pcall(function() return loadstring(game:HttpGet("https://raw.githubusercontent.com/Mentos4/roblox/main/gamelist.lua"))()       end)
        local ok2, Discontinued = pcall(function() return loadstring(game:HttpGet("https://raw.githubusercontent.com/Mentos4/roblox/main/discontinued.lua"))()  end)
        Games        = ok  and Games        or {}
        if not window.ScriptUrl or window.ScriptUrl == "" then window.ScriptUrl = Games[tostring(game.GameId)] or Games[game.GameId] end
        Discontinued = ok2 and Discontinued or {}

        local continuedList, discontinuedList = {}, {}
        for id, url in pairs(Games) do
            local name = GameNameMap[tostring(id)] or tostring(id)
            if Discontinued and Discontinued[id] then
                table.insert(discontinuedList, { id = id, url = url, name = name })
            else
                table.insert(continuedList,    { id = id, url = url, name = name })
            end
        end
        for id, v in pairs(Discontinued or {}) do
            if v and not Games[id] then
                table.insert(discontinuedList, { id = id, url = nil, name = GameNameMap[tostring(id)] or tostring(id) })
            end
        end

        local function sortByName(a, b) return a.name < b.name end
        table.sort(continuedList,    sortByName)
        table.sort(discontinuedList, sortByName)

        local function makeCard(g, isDiscontinued)
            local baseColor = theme.Element
            local row = Create("Frame", {
                Size = UDim2.new(1, 0, 0, 48),
                BackgroundColor3 = baseColor,
                BackgroundTransparency = 0.08,
                BorderSizePixel = 0,
                ClipsDescendants = true,
            }, {
                Create("UICorner", { CornerRadius = UDim.new(0, 6) }),
                Create("UIStroke", { Color = theme.Border, Thickness = 1 }),
            })
            local thumb = Create("ImageLabel", {
                Size = UDim2.new(1, -4, 1, -4),
                Position = UDim2.new(0, 2, 0, 2),
                BackgroundTransparency = 1,
                Image = "rbxthumb://type=GameIcon&id=" .. tostring(g.id) .. "&w=150&h=150",
                ImageTransparency = 0.34,
                ScaleType = Enum.ScaleType.Crop,
                ZIndex = 1, Parent = row
            }, { Create("UICorner", { CornerRadius = UDim.new(0, 5) }) })
            local overlay = Create("Frame", {
                Size = UDim2.new(1, 0, 1, 0),
                BackgroundColor3 = theme.Accent,
                BackgroundTransparency = 1,
                BorderSizePixel = 0, ZIndex = 2, Parent = row
            }, { Create("UICorner", { CornerRadius = UDim.new(0, 6) }) })
            Create("TextLabel", {
                Size = UDim2.new(1, -10, 1, 0),
                Position = UDim2.new(0, 5, 0, 0),
                BackgroundTransparency = 1,
                Text = g.name,
                TextColor3 = isDiscontinued and Color3.fromRGB(255, 210, 210) or Color3.fromRGB(255, 255, 255),
                Font = Enum.Font.GothamBold,
                TextSize = 12,
                TextXAlignment = Enum.TextXAlignment.Center,
                TextYAlignment = Enum.TextYAlignment.Center,
                TextTruncate = Enum.TextTruncate.AtEnd,
                TextStrokeTransparency = 0.3,
                ZIndex = 3, Parent = row
            })
            local stroke = row:FindFirstChildOfClass("UIStroke")
            row.MouseEnter:Connect(function()
                Tween(row,     { BackgroundColor3 = theme.Accent, BackgroundTransparency = 0.6 }, 0.12)
                Tween(overlay, { BackgroundTransparency = 0.6 }, 0.12)
                Tween(thumb,   { ImageTransparency = 0.12 },     0.12)
                if stroke then Tween(stroke, { Transparency = 0 }, 0.12) end
            end)
            row.MouseLeave:Connect(function()
                Tween(row,     { BackgroundColor3 = baseColor, BackgroundTransparency = 0.08 }, 0.12)
                Tween(overlay, { BackgroundTransparency = 1 },  0.12)
                Tween(thumb,   { ImageTransparency = 0.34 },    0.12)
                if stroke then Tween(stroke, { Transparency = 0.1 }, 0.12) end
            end)
            return row
        end

        for _, g in ipairs(continuedList) do
            left:AddRaw({ Element = makeCard(g, false), Height = 52 })
        end
        for _, g in ipairs(discontinuedList) do
            right:AddRaw({ Element = makeCard(g, true), Height = 52 })
        end
    end)
end

function Library:_BuildSuggestionsTab(window)
    self:_EnsureBuiltInSection(window)
    local suggestTab     = window:AddTab("Suggestions", "message-square", true)
    local suggestSection = suggestTab:AddLeftSection("Send a Suggestion", "send")

    local WEBHOOKS = {
        ["Suggestion"] = "https://ptb.discord.com/api/webhooks/1521484910177812520/wMF5tuZVGvtDcSE20sINPfbTUlzd0sPXcSDWq4GaGdP8HLMNEZhRl6QEYwft5ZRQHxDr",
        ["Bug Report"] = "https://ptb.discord.com/api/webhooks/1521488104735641763/PMruMCYdfEiOh8rlep_4U6TNbYuhR9-uOczrpLOFR9UUYnTHgLyKqiCaoXD83T0_s0k6",
        ["Vouch"]      = "https://ptb.discord.com/api/webhooks/1521488793536827603/gN1N6tMPmdFND71tpIzI0jDjxMa1Y1_8zwviLl5KCi-4j6ptPZ2e99o9IAFyJvVcpR8_",
    }
    local suggestCategory = "Vouch"
    local suggestText     = ""
    local suggestError    = ""

    suggestSection:AddParagraph({
        Title   = "How it works",
        Content = "Pick a category, write your message, then hit Submit. It gets posted directly to our Discord.",
    })

    suggestSection:AddDropdown({
        Name     = "Category",
        Options  = { "Vouch", "Suggestion", "Bug Report" },
        Default  = "Vouch",
        Flag     = "BuiltIn_SuggestCategory",
        Tooltip  = "Pick the category that best fits your message.",
        Callback = function(v) suggestCategory = v or "Vouch" end,
    })

    suggestSection:AddTextbox({
        Name             = "Message",
        Placeholder      = "Write your message here...",
        Default          = "",
        Flag             = "BuiltIn_SuggestText",
        ClearTextOnFocus = false,
        Tooltip          = "Write your message here.",
        Callback         = function(v) suggestText = v or "" end,
    })

    suggestSection:AddTextbox({
        Name             = "Error Screenshot URL (Bug Report only)",
        Placeholder      = "Paste image URL (Imgur, Gyazo...)",
        Default          = "",
        Flag             = "BuiltIn_SuggestError",
        ClearTextOnFocus = false,
        Tooltip          = "Required for Bug Reports. Take a screenshot of the console error, upload it, and paste the URL.",
        Callback         = function(v) suggestError = v or "" end,
    })

    suggestSection:AddButton({
        Name    = "Submit",
        Tooltip = "Post to the Discord channel for the selected category.",
        Callback = function()
            if suggestText == "" then
                self:Notify({
                    Title = "Suggestions", Content = "Please write something before submitting.",
                    Duration = 3, Type = "warning",
                })
                return
            end
            if suggestCategory == "Bug Report" and suggestError == "" then
                self:Notify({
                    Title = "Bug Report", Content = "Please attach a screenshot URL of the console error before submitting.",
                    Duration = 4, Type = "warning",
                })
                return
            end
            local webhook = WEBHOOKS[suggestCategory]
            if not webhook then return end
            local ok = pcall(function()
                local HS = game:GetService("HttpService")
                -- Anonymous by design: no username, userId, or avatar is ever read or sent,
                -- so submissions can't be traced back to a specific player.
                local isoTime = os.date("!%Y-%m-%dT%H:%M:%SZ")
                local body
                if suggestCategory == "Vouch" then
                    -- Vouch uses a regular text channel (no thread_name)
                    body = HS:JSONEncode({
                        username = "Seisen Hub",
                        embeds = {{
                            title       = "New vouch for Seisen Hub created!",
                            description = "⭐⭐⭐⭐⭐",
                            color       = 3447003,
                            fields      = {
                                { name = "Vouch:",      value = suggestText, inline = false },
                                { name = "Vouched by:", value = "Anonymous", inline = true  },
                            },
                            timestamp = isoTime,
                            footer    = { text = "Seisen Hub Script" },
                        }},
                    })
                elseif suggestCategory == "Bug Report" then
                    body = HS:JSONEncode({
                        thread_name = "[Bug Report] " .. isoTime,
                        username    = "Seisen Hub",
                        embeds = {{
                            title       = "Bug Report",
                            description = suggestText,
                            color       = 16711684,
                            image       = { url = suggestError },
                            footer      = { text = "Submitted anonymously" },
                        }},
                    })
                else
                    body = HS:JSONEncode({
                        thread_name = "[Suggestion] " .. isoTime,
                        username    = "Seisen Hub",
                        embeds = {{
                            title       = "Suggestion",
                            description = suggestText,
                            color       = 16711684,
                            footer      = { text = "Submitted anonymously" },
                        }},
                    })
                end
                local fn = request or (syn and syn.request) or (http and http.request)
                if fn then
                    fn({
                        Url     = webhook,
                        Method  = "POST",
                        Headers = { ["Content-Type"] = "application/json" },
                        Body    = body,
                    })
                end
            end)
            if ok then
                self:Notify({
                    Title = "Suggestions", Content = "Sent! Thank you.",
                    Duration = 4, Type = "success",
                })
                if self.Options and self.Options["BuiltIn_SuggestText"] then
                    self.Options["BuiltIn_SuggestText"]:SetValue("")
                end
                if self.Options and self.Options["BuiltIn_SuggestError"] then
                    self.Options["BuiltIn_SuggestError"]:SetValue("")
                end
                suggestText  = ""
                suggestError = ""
            else
                self:Notify({
                    Title = "Suggestions", Content = "Failed to send. Check your executor's HTTP permissions.",
                    Duration = 5, Type = "error",
                })
            end
        end,
    })
end

function Lib:_SupabaseRPC(fn, args, url, key)
	local req = request or http_request or (syn and syn.request) or (http and http.request)
	if not req then return false, "executor has no request function" end
	url, key = url or self.Supabase.Url, key or self.Supabase.Key
	local ok, res = pcall(req, {
		Url = url:gsub("/+$", "") .. "/rest/v1/rpc/" .. fn,
		Method = "POST",
		Headers = { apikey = key, Authorization = "Bearer " .. key, ["Content-Type"] = "application/json" },
		Body = HttpService:JSONEncode(args),
	})
	if not ok or type(res) ~= "table" then return false, "request failed" end
	local good = res.Success or (res.StatusCode and res.StatusCode >= 200 and res.StatusCode < 300)
	local decoded, data = pcall(HttpService.JSONDecode, HttpService, res.Body)
	if not good then return false, (decoded and type(data) == "table" and data.message) or ("HTTP " .. tostring(res.StatusCode)) end
	if not decoded then return false, "bad response" end
	return true, data
end

function Lib:_UpdateUsage()
	if #self.Windows == 0 then return end
	if not self._usage or self._usage.closed then
		self._usage = { session = HttpService:GenerateGUID(false), nextAt = 0, busy = false }
	end
	local state = self._usage
	if state.closed or state.busy or os.clock() < state.nextAt then return end
	state.busy, state.nextAt = true, os.clock() + 30
	task.spawn(function()
		local ok, data = self:_SupabaseRPC("library_heartbeat", { p_session = state.session, p_universe = tostring(game.GameId) })
		state.busy = false
		if state.closed then
			self:_SupabaseRPC("library_leave", { p_session = state.session })
		elseif ok and type(data) == "table" then
			state.executions, state.live = tonumber(data.executions), tonumber(data.live)
		end
	end)
end

function Library:RecordExecution(options)
    self:_UpdateUsage()
    task.spawn(function()
        pcall(function()
            local serverUrl = (options and options.CounterUrl) or self.CounterServerUrl
            if not serverUrl or serverUrl == "" then return end

            local reqFn = syn and syn.request or http and http.request or request or http_request
            if not reqFn then return end

            local HS = game:GetService("HttpService")
            reqFn({
                Url = serverUrl,
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = HS:JSONEncode({
                    Name     = options and options.Name or "Seisen Hub",
                    SubTitle = options and options.SubTitle or "",
                    Version  = options and options.Version or "",
                    PlaceId  = game.PlaceId,
                    JobId    = game.JobId,
                })
            })
        end)
    end)
end

function Library:AddToPlayerSettings(opts, elementType)
    if not self.PlayerSettings then
        warn("[SeisenUI] AddToPlayerSettings called before CreateWindow or ConfigSettings is false.")
        return
    end
    elementType = elementType or "Toggle"
    local method = "Add" .. elementType
    if self.PlayerSettings[method] then
        return self.PlayerSettings[method](self.PlayerSettings, opts)
    else
        warn("[SeisenUI] Unknown element type: " .. tostring(elementType))
    end
end

function Library:AddToUISettings(opts, elementType)
    if not self.UISettings then
        warn("[SeisenUI] AddToUISettings called before CreateWindow or ConfigSettings is false.")
        return
    end
    elementType = elementType or "Toggle"
    local method = "Add" .. elementType
    if self.UISettings[method] then
        return self.UISettings[method](self.UISettings, opts)
    else
        warn("[SeisenUI] Unknown element type: " .. tostring(elementType))
    end
end

-- Manager tab: the new theme / config managers (old file format, same folders)
function Lib:_BuildManagersTab(window, folderName)
	self:_EnsureBuiltInSection(window)
	local tab = window:AddTab("Manager", "settings", true)
	tab:AddLeftSection("Theme", "palette"):ThemeManager({})
	tab:AddRightSection("Configs", "save"):ConfigManager({})
	return tab
end

---------------------------------------------------------------- Trackstat (separate project; keys never enter configs)
do
	local url = "https://xsygxfeutjcwmqejslbv.supabase.co/rest/v1/rpc/"
	local publicKey = "sb_publishable_565kome-b7OZJPc7-kWSPQ_n_nwH8q5"
	local function newKey()
		return "sp_" .. (HttpService:GenerateGUID(false) .. HttpService:GenerateGUID(false)):gsub("%-", ""):lower()
	end
	local PET_SIMULATOR_99, STEAL_AN_EGG = 3317771874, 10563114921
	local function counts(gameId)
		if gameId == STEAL_AN_EGG then return { pets = 0, eggs = 0, gear = 0, items = 0 } end
		return { items = 0, huge = 0, titanic = 0, gargantuan = 0 }
	end

	local function httpRequest()
		return syn and syn.request or http and http.request or request or http_request
	end

	function Lib:_TrackstatRPC(name, args)
		local req = httpRequest()
		if not req then return false, "Executor HTTP is unavailable" end
		local ok, res = pcall(req, { Url = url .. name, Method = "POST", Headers = { apikey = publicKey, ["Content-Type"] = "application/json" }, Body = HttpService:JSONEncode(args) })
		if not ok or type(res) ~= "table" then return false, "Trackstat request failed; try again" end
		local decoded, data = pcall(HttpService.JSONDecode, HttpService, res.Body)
		if not res.StatusCode or res.StatusCode < 200 or res.StatusCode >= 300 then
			return false, decoded and type(data) == "table" and data.message or "Trackstat is temporarily unavailable"
		end
		return decoded, data
	end

	function Lib:_TrackstatSave()
		local s = self._trackstat
		if not HasFiles() then return false end
		return pcall(function()
			if not isfolder(ROOT_FOLDER) then makefolder(ROOT_FOLDER) end
			if not isfolder(ROOT_FOLDER .. "/Trackstat") then makefolder(ROOT_FOLDER .. "/Trackstat") end
			writefile(s.path, HttpService:JSONEncode({ key = s.key, pending = s.pending }))
		end)
	end

	function Lib:_TrackstatConnect()
		local s = self._trackstat
		local ok, data = self:_TrackstatRPC("trackstat_register", { p_key = s.key, p_roblox_id = tostring(LocalPlayer.UserId), p_username = LocalPlayer.Name })
		-- A staged key survives an interrupted reset without losing the account.
		if not ok and data == "Connection key was reset" and s.pending then
			s.key, s.pending = s.pending, nil
			self:_TrackstatSave()
			ok, data = self:_TrackstatRPC("trackstat_register", { p_key = s.key, p_roblox_id = tostring(LocalPlayer.UserId), p_username = LocalPlayer.Name })
		end
		s.registered = ok
		return ok, data
	end

	-- Positive inventory changes since the last read become session gains; returns the per-item rows for the website
	function Lib:_TrackstatDelta(s, current)
		for id, item in pairs(current) do
			local gain = s.previous and math.max(0, item.owned - ((s.previous[id] and s.previous[id].owned) or 0)) or 0
			s.gained[item.metric] += gain
			s.details[id] = s.details[id] or { name = item.name, kind = item.kind, gained = 0, owned = 0 }
			s.details[id].gained += gain
		end
		local details = {}
		for id, item in pairs(s.details) do
			item.owned = current[id] and current[id].owned or 0
			if item.owned > 0 or item.gained > 0 then table.insert(details, table.clone(item)) end
		end
		table.sort(details, function(a, b) return a.kind == b.kind and a.name < b.name or a.kind < b.kind end)
		while #details > 500 do table.remove(details) end
		s.previous = current
		return details
	end

	-- Steal An Egg keeps everything in the game's own save data (pets, eggs, gear, items, money, speed)
	function Lib:_TrackstatReadStealAnEgg()
		local s = self._trackstat
		if setthreadidentity then pcall(setthreadidentity, 2) end
		local data, owned, current, catalog, stacks, tools = s.save.Peek(), { pets = 0, eggs = 0, gear = 0, items = 0 }, {}, {}, {}, {}
		for _, tool in ipairs(LocalPlayer.Backpack:GetChildren()) do
			local uid = tool:GetAttribute("UID")
			if uid then tools[uid] = tool end
		end
		local function add(kind, key, amount, name, icon, rarity, description)
			if not catalog[key] then
				catalog[key] = { key = key, kind = kind, name = tostring(name):sub(1, 100), icon = tostring(icon or ""):match("%d+") or "", description = tostring(description or ""):sub(1, 300) }
				rarity = type(rarity) == "string" and s.rarities[rarity] or rarity
				if rarity then catalog[key].rarity, catalog[key].rarity_num, catalog[key].rarity_color = rarity.DisplayName, rarity.Rank, "#" .. rarity.Color:ToHex() end
			end
			local metric = ({ pet = "pets", egg = "eggs", gear = "gear", item = "items" })[kind]
			current[key] = current[key] or { name = catalog[key].name, kind = kind, metric = metric, owned = 0 }
			current[key].owned += amount
			owned[metric] += amount
		end
		local function mutationList(mutations)
			local list = {}
			for _, mutation in pairs(mutations or {}) do table.insert(list, mutation) end
			table.sort(list)
			return #list > 0 and list or nil
		end
		for uid, pet in pairs(data.Inventory) do
			local dir, tool = s.assets[pet.Category], tools[uid]
			local config = tool and tool:FindFirstChild("Configuration")
			local key = "pet:" .. pet.Category
			add("pet", key, 1, dir and dir.DisplayName or pet.Category, dir and dir.Icon, dir and dir.Rarity)
			table.insert(stacks, { k = key, a = 1, w = dir and dir.ModelWeight and dir.ModelWeight * (pet.Scale or 1) or nil, m = mutationList(pet.Mutations), p = config and config:GetAttribute("perSecond") or nil, f = tool and tool:GetAttribute("Favorite") or nil })
		end
		for _, egg in pairs(data.EggInventory) do
			local dir = s.assets[egg.AssetCategory]
			local info, key = dir and dir.Egg, "egg:" .. egg.AssetCategory
			add("egg", key, 1, info and info.DisplayName or egg.AssetCategory .. " Egg", info and info.Icon, dir and dir.Rarity)
			table.insert(stacks, { k = key, a = 1, w = info and info.WeightKg, m = mutationList(egg.Mutations), pl = egg.Placement and 1 or nil })
		end
		for id, amount in pairs(data.GearInventory) do
			local gear, key = s.gears[id], "gear:" .. id
			add("gear", key, amount, gear and gear.DisplayName or id, gear and gear.Icon, gear and gear.Rarity, gear and gear.Description)
			table.insert(stacks, { k = key, a = amount })
		end
		for _, item in ipairs({
			{ "BossTokens", data.BossTokens, s.currency.BossTokens },
			{ "SakuraCrystals", data.SakuraCrystals, s.currency.SakuraCrystals },
			{ "MutationConsumable", data.BossMastery and data.BossMastery.MutationConsumables, nil, "Mutation Consumable" },
			{ "NitroConsumable", data.RaceRally and data.RaceRally.MutationConsumables, nil, "Nitro Consumable" },
		}) do
			local amount, dir, key = item[2] or 0, item[3], "item:" .. item[1]
			if amount > 0 then
				add("item", key, amount, dir and dir.DisplayName or item[4], dir and dir.Icon, dir and dir.Rarity)
				table.insert(stacks, { k = key, a = amount })
			end
		end
		table.sort(stacks, function(a, b) return (a.p or 0) > (b.p or 0) end)
		while #stacks > 1000 do table.remove(stacks) end
		local leaderstats = LocalPlayer:FindFirstChild("leaderstats")
		local perSecond = leaderstats and leaderstats:FindFirstChild("Money/s")
		s.snapshot = { owned = owned, gained = table.clone(s.gained), details = self:_TrackstatDelta(s, current), inventory = stacks, money = data.Money, speed = data.SpeedPower, per_second = perSecond and perSecond.Value or 0 }
		if s.stopping or os.clock() >= s.uploadAt then s.catalog = catalog end
		s.summaryText = string.format("Money: %s · Speed: %s · %s/s\nOwned: %s pets · %s eggs · %s gear · %s items\nSession gains: %s pets · %s eggs · %s gear · %s items", FormatCount(data.Money), FormatCount(data.SpeedPower), FormatCount(s.snapshot.per_second), FormatCount(owned.pets), FormatCount(owned.eggs), FormatCount(owned.gear), FormatCount(owned.items), FormatCount(s.gained.pets), FormatCount(s.gained.eggs), FormatCount(s.gained.gear), FormatCount(s.gained.items))
	end

	function Lib:_TrackstatRead()
		local s = self._trackstat
		if not s.session then
			if setthreadidentity then pcall(setthreadidentity, 2) end
			local rs = game.ReplicatedStorage
			if s.gameId == STEAL_AN_EGG then
				s.save, s.assets, s.gears = require(rs.Shared.Save), require(rs.Data.Assets).Directory, require(rs.Data.Gears).Directory
				s.rarities, s.currency = require(rs.Data.Rarity).Rarities, require(rs.Data.Currency).Directory
				assert(s.save.IsLoaded(), "Inventory is not ready; retrying shortly")
			else
				s.inventory = require(rs.Library.Universal.Inventory)
			end
			s.previous, s.details, s.gained = nil, {}, counts(s.gameId)
			s.session, s.sequence, s.uploadAt = HttpService:GenerateGUID(false), 0, 0
		end
		if s.gameId == STEAL_AN_EGG then return self:_TrackstatReadStealAnEgg() end
		local current, owned = {}, counts()
		for _, item in pairs(s.inventory.Container(LocalPlayer):All()) do
			local kind = item.Class.Name
			local metric = kind ~= "Pet" and kind ~= "Currency" and "items" or nil
			if kind == "Pet" then
				metric = item:IsGargantuan() and "gargantuan" or item:IsTitanic() and "titanic" or item:IsHuge() and "huge" or nil
				kind = metric or kind
			end
			if metric then
				local name, amount = item:GetName(), item:GetAmount()
				local id = kind .. ":" .. item:GetId() .. ":" .. name
				current[id] = current[id] or { name = name, kind = kind, metric = metric, owned = 0 }
				current[id].owned += amount
				owned[metric] += amount
			end
		end
		s.snapshot = { owned = owned, gained = table.clone(s.gained), details = self:_TrackstatDelta(s, current) }
		if s.stopping or os.clock() >= s.uploadAt then s.stacks, s.catalog = self:_TrackstatInventory(s) end
		s.snapshot.inventory = s.stacks
		s.summaryText = string.format("Owned: %s items · %s Huge · %s Titanic · %s Gargantuan\nSession gains: %s items · %s Huge · %s Titanic · %s Gargantuan", FormatCount(owned.items), FormatCount(owned.huge), FormatCount(owned.titanic), FormatCount(owned.gargantuan), FormatCount(s.gained.items), FormatCount(s.gained.huge), FormatCount(s.gained.titanic), FormatCount(s.gained.gargantuan))
	end

	-- Full inventory stacks for the website; static icon/rarity/description go to the shared catalog once per key
	function Lib:_TrackstatInventory(s)
		local entries, catalog = {}, {}
		if setthreadidentity then pcall(setthreadidentity, 2) end -- lazily required item modules fail at the default identity
		for _, item in pairs(s.inventory.Container(LocalPlayer):All()) do
			pcall(function()
				local class, pet = item.Class.Name, item.Class.Name == "Pet"
				local variant = pet and (item:IsGolden() and "g" or "") .. (item:IsRainbow() and "r" or "") .. (item:IsShiny() and "s" or "") or ""
				local key = class .. ":" .. item:GetId() .. ":" .. (item:GetTier() or 0) .. ":" .. variant
				if not catalog[key] then
					local rarity = item:GetRarity()
					catalog[key] = { key = key, class = class, name = item:GetName():sub(1, 100), icon = tostring(item:GetIcon()):match("%d+") or "", rarity = rarity.DisplayName, rarity_num = rarity.RarityNumber, rarity_color = "#" .. rarity.Color:ToHex(), description = tostring(item:GetDesc() or ""):sub(1, 300) }
				end
				local charms = {}
				for _, charm in pairs(pet and item:GetCharms() or {}) do table.insert(charms, charm.dir._id) end
				table.insert(entries, { k = key, a = item:GetAmount(), r = item:GetRAP() or nil, x = item:GetExistCount() or nil, l = pet and item:GetXPLevel() or nil, f = item:IsLocked() or nil, e = pet and item:GetExclusiveLevel() or nil, cs = pet and item:GetCharmSlots() or nil, ch = #charms > 0 and charms or nil })
			end)
		end
		table.sort(entries, function(a, b) return (a.r or 0) * a.a > (b.r or 0) * b.a end)
		while #entries > 1000 do table.remove(entries) end
		return entries, catalog
	end

	-- Item pictures: some games' icons are private on Roblox's side, so the website cannot load them. The game can: each icon is
	-- captured once as a small PNG and stored in Supabase storage (existing files are never overwritten), and the website shows that copy.
	local crcTable
	local function crc32(data)
		if not crcTable then
			crcTable = {}
			for i = 0, 255 do
				local c = i
				for _ = 1, 8 do c = bit32.band(c, 1) == 1 and bit32.bxor(0xEDB88320, bit32.rshift(c, 1)) or bit32.rshift(c, 1) end
				crcTable[i] = c
			end
		end
		local c = 0xFFFFFFFF
		for i = 1, #data do c = bit32.bxor(crcTable[bit32.band(bit32.bxor(c, data:byte(i)), 255)], bit32.rshift(c, 8)) end
		return bit32.bxor(c, 0xFFFFFFFF)
	end
	local function adler32(data)
		local a, b = 1, 0
		for i = 1, #data do a = (a + data:byte(i)) % 65521; b = (b + a) % 65521 end
		return b * 65536 + a
	end
	local function pngChunk(kind, data)
		return string.pack(">I4", #data) .. kind .. data .. string.pack(">I4", crc32(kind .. data))
	end
	local function encodePng(size, rgba)
		local rows = {}
		for y = 0, size - 1 do rows[#rows + 1] = "\0" .. rgba:sub(y * size * 4 + 1, (y + 1) * size * 4) end
		local raw, blocks, pos = table.concat(rows), {}, 1
		while pos <= #raw do
			local len = math.min(65535, #raw - pos + 1)
			blocks[#blocks + 1] = string.pack("<BI2I2", pos + len > #raw and 1 or 0, len, 65535 - len) .. raw:sub(pos, pos + len - 1)
			pos += len
		end
		return "\137PNG\r\n\26\n" .. pngChunk("IHDR", string.pack(">I4I4BBBBB", size, size, 8, 6, 0, 0, 0)) .. pngChunk("IDAT", "\x78\x01" .. table.concat(blocks) .. string.pack(">I4", adler32(raw))) .. pngChunk("IEND", "")
	end
	local imagesUrl = "https://xsygxfeutjcwmqejslbv.supabase.co/storage/v1/object/"
	function Lib:_TrackstatImages(s, catalog)
		local req, budget, assets, identity = httpRequest(), 6, game:GetService("AssetService"), getthreadidentity and getthreadidentity()
		local folder = s.gameId == STEAL_AN_EGG and "stealanegg" or "petsimulator99"
		local icons = {}
		for _, item in pairs(catalog) do if item.icon ~= "" and not s.imaged[item.icon] then table.insert(icons, item.icon) end end
		if #icons == 0 or s.closed then return end
		local checked, stored = self:_TrackstatRPC("trackstat_image_manifest", { p_game = folder, p_icons = icons })
		if not checked then return end
		for _, icon in ipairs(stored) do s.imaged[icon] = true end
		if setthreadidentity then pcall(setthreadidentity, 8) end
		for _, item in pairs(catalog) do
			if s.closed then break end
			local icon = item.icon
			if icon ~= "" and not s.imaged[icon] and budget > 0 then
				budget -= 1
				s.imaged[icon] = true
				local finished, started = false, os.clock()
				task.spawn(function()
					local success = false
					pcall(function()
						local source = assets:CreateEditableImageAsync(Content.fromUri("rbxassetid://" .. icon))
						local target = assets:CreateEditableImage({ Size = Vector2.new(96, 96) })
						target:DrawImageTransformed(Vector2.new(48, 48), Vector2.new(96 / source.Size.X, 96 / source.Size.Y), 0, source, { CombineType = Enum.ImageCombineType.Overwrite })
						local png = encodePng(96, buffer.tostring(target:ReadPixelsBuffer(Vector2.zero, target.Size)))
						source:Destroy()
						target:Destroy()
						if s.closed then return end
						local result = req({ Url = imagesUrl .. "trackstats-images/" .. folder .. "/" .. icon .. ".png", Method = "POST", Headers = { apikey = publicKey, ["Content-Type"] = "image/png" }, Body = png })
						success = type(result) == "table" and result.StatusCode and (result.StatusCode >= 200 and result.StatusCode < 300 or result.StatusCode == 409)
					end)
					s.imaged[icon] = success or nil
					finished = true
				end)
				while not finished and os.clock() - started < 6 do task.wait(0.1) end
				if not finished then s.imaged[icon] = nil end
			end
		end
		if identity and setthreadidentity then pcall(setthreadidentity, identity) end
	end

	function Lib:_TrackstatCatalog(s)
		local catalog = s.catalog
		local keys = {}
		for key in pairs(catalog) do if not s.known[key] then table.insert(keys, key) end end
		if #keys > 0 then
			local prefix = s.gameId == STEAL_AN_EGG and "trackstats_stealanegg_catalog_" or "trackstat_catalog_"
			local ok, missing = self:_TrackstatRPC(prefix .. "missing", { p_keys = keys })
			if not ok then error(missing, 0) end
			if s.closed then return end
			for i = 1, #missing, 300 do
				if s.closed then return end
				local items = {}
				for j = i, math.min(i + 299, #missing) do table.insert(items, catalog[missing[j]]) end
				local added, reason = self:_TrackstatRPC(prefix .. "add", { p_key = s.key, p_items = items })
				if not added then error(reason, 0) end
			end
			for _, key in ipairs(keys) do s.known[key] = true end
		end
		self:_TrackstatImages(s, catalog)
		if s.catalog == catalog then s.catalog = nil end
	end

	function Lib:_TrackstatClose(s)
		if s.closed then return end
		s.enabled, s.closed = false, true
		if s.registered then s.presenceSession = s.presenceSession or HttpService:GenerateGUID(false) end
		task.spawn(function()
			if s.presenceSession then
				for attempt = 1, 3 do
					local sent = self:_TrackstatRPC("trackstat_presence", { p_key = s.key, p_session = s.presenceSession, p_game = tostring(s.gameId), p_active = false })
					if sent then break end
					if attempt < 3 then task.wait(1) end
				end
			end
			if s.snapshot and not s.busy then
				local sent, _, retry = self:_TrackstatSend(s)
				if not sent and retry then task.wait(retry); self:_TrackstatSend(s) end
			end
		end)
	end

	function Lib:_TrackstatHeartbeat()
		local s = self._trackstat
		if not s or s.closed or s.linking or not s.enabled or not s.registered or s.presenceBusy or os.clock() < (s.presenceAt or 0) then return end
		s.presenceSession = s.presenceSession or HttpService:GenerateGUID(false)
		s.presenceBusy, s.presenceAt = true, os.clock() + 15
		task.spawn(function()
			if not s.closed then
				self:_TrackstatRPC("trackstat_presence", { p_key = s.key, p_session = s.presenceSession, p_game = tostring(s.gameId), p_active = true })
			end
			s.presenceBusy = false
		end)
	end

	function Lib:_UpdateTrackstat()
		self:_TrackstatHeartbeat()
		local s = self._trackstat
		if not s or s.closed or s.busy or s.linking or not (s.enabled or s.stopping) or os.clock() < s.nextAt then return end
		s.busy, s.nextAt = true, os.clock() + 5
		task.spawn(function()
			local ok, err = pcall(function()
				if not s.registered then
					local connected, reason = self:_TrackstatConnect()
					if not connected then error(reason, 0) end
				end
				if s.closed then return end
				if s.enabled then
					local identity = getthreadidentity and getthreadidentity()
					local read, reason = pcall(self._TrackstatRead, self)
					if identity and setthreadidentity then pcall(setthreadidentity, identity) end
					if not read then error(reason, 0) end
					s.summary:SetText(s.summaryText)
				end
				if s.snapshot and (s.stopping or os.clock() >= s.uploadAt) then
					local sent, reason = self:_TrackstatSend(s)
					s.stopping = false
					if not sent then error(reason, 0) end
					s.uploadAt = os.clock() + 15
					if s.catalog and not s.catalogBusy then
						s.catalogBusy = true
						task.spawn(function()
							if not s.closed then pcall(self._TrackstatCatalog, self, s) end
							s.catalogBusy = false
						end)
					end
					if not s.closed then s.status:SetText((s.enabled and "Tracking" or "Stopped") .. " · synced " .. os.date("%X")) end
				end
			end)
			s.busy = false
			if not ok and not s.closed then s.status:SetText(tostring(err)); s.nextAt = os.clock() + 15 end
		end)
	end

	function Lib:_TrackstatSend(s)
		s.sequence += 1
		local ok, data = self:_TrackstatRPC("trackstat_push", { p_key = s.key, p_session = s.session, p_sequence = s.sequence, p_game = tostring(game.GameId), p_snapshot = s.snapshot })
		if ok and type(data) == "table" then
			if data.expired then s.session = nil; return false, "Starting a fresh session after history cleanup" end
			if data.rateLimited then return false, "Sync rate limited; retrying shortly", math.clamp(tonumber(data.retryAfter) or 15, 1, 15) end
		end
		return ok, data
	end

	-- A new device for a Roblox account that already has a history asks to join it; the owner approves once on the website,
	-- which hands this device the existing key. No answer within 15 minutes (or "start a new history") keeps a fresh key.
	function Lib:_TrackstatLink(s)
		s.linking = true
		task.spawn(function()
			local nonce = newKey():sub(4)
			local ok, res = self:_TrackstatRPC("trackstat_link_request", { p_nonce = nonce, p_roblox_id = tostring(LocalPlayer.UserId), p_username = LocalPlayer.Name })
			if ok and type(res) == "table" and res.status == "pending" and not s.closed then
				s.status:SetText("New device: approve it on seisen.vercel.app/trackstat to keep your history")
				s.skipLink:SetVisible(true)
				local deadline = os.clock() + 900
				while s.linking and not s.closed and os.clock() < deadline do
					task.wait(5)
					local got, answer = self:_TrackstatRPC("trackstat_link_pickup", { p_nonce = nonce })
					if got and type(answer) == "table" and answer.status ~= "pending" then
						if answer.status == "approved" and type(answer.key) == "string" and answer.key:match("^sp_%x+$") and #answer.key == 67 then
							s.key, s.registered = answer.key, false
							s.status:SetText("Linked to your existing history")
						else s.status:SetText("Starting a new history on this device") end
						break
					end
				end
			end
			s.linking = false
			if not s.closed then
				s.skipLink:SetVisible(false)
				self:_TrackstatSave()
			end
		end)
	end

	function Lib:_BuildTrackstatTab(win)
		local tab = win:AddTab("Trackstat", "activity", true)
		tab._entry.Button.LayoutOrder = 0 -- right below Home (-2) and Cloud (-1)
		local connection = tab:AddLeftSection("Account connection", "link")
		local stats = tab:AddRightSection("Pet Simulator 99", "chart-no-axes-combined")
		local path = ROOT_FOLDER .. "/Trackstat/" .. tostring(LocalPlayer.UserId) .. ".json"
		local saved = ReadJson(path) or {}
		local fresh = HasFiles() and next(saved) == nil -- a device that has never run Trackstat for this Roblox account
		if type(saved.key) ~= "string" or not saved.key:match("^sp_%x+$") or #saved.key ~= 67 then saved.key = newKey() end
		local s = self._trackstat
		if not s or s.closed then
			s = { key = saved.key, pending = saved.pending, path = path, gameId = game.GameId, enabled = game.GameId == PET_SIMULATOR_99 or game.GameId == STEAL_AN_EGG, busy = false, nextAt = 0, known = {}, imaged = {} }
			self._trackstat = s
		end
		connection:AddLabel({ Text = LocalPlayer.Name .. " · " .. tostring(LocalPlayer.UserId) })
		s.status = connection:AddLabel({ Text = s.enabled and "Detecting game - tracking starts automatically" or "This game is not supported by Trackstat" })
		connection:AddLabel({ Text = fresh and "Looking for your existing history…" or self:_TrackstatSave() and "Key saved for this Roblox account on this device." or "No file storage: copy your key before closing this session." })
		connection:AddButton({ Name = "Copy connection key", Callback = function()
			if s.busy or s.linking then return end
			s.busy = true
			local ok, err = self:_TrackstatConnect()
			s.busy = false
			if s.closed then return end
			if ok then
				local copy = setclipboard or toclipboard
				local copied = copy and pcall(copy, s.key)
				s.status:SetText(copied and "Key copied · paste it on the website Trackstat tab" or "Executor clipboard is unavailable")
			else s.status:SetText(tostring(err)) end
		end })
		connection:AddButton({ Name = "Reset connection key", ConfirmText = "Click again to revoke old key", Callback = function()
			if s.busy or s.linking then return end
			s.busy = true
			local ok, err = self:_TrackstatConnect()
			if ok then
				s.pending = newKey()
				local persisted = self:_TrackstatSave()
				if not HasFiles() or persisted then
					ok, err = self:_TrackstatRPC("trackstat_reset", { p_key = s.key, p_new_key = s.pending })
					if ok then s.key, s.pending = s.pending, nil; self:_TrackstatSave() end
				else ok, err = false, "Key file could not be saved; reset was not sent" end
			end
			s.busy = false
			if not s.closed then s.status:SetText(ok and "Key reset · copy the new key to reconnect your website" or tostring(err)) end
		end })
		connection:AddParagraph({ Title = "Website", Content = "Keep your key private. Reset revokes the old key but keeps history." })
		connection:AddButton({ Name = "Copy Website", Callback = function()
			win:CopyToClipboard("https://seisen.vercel.app/trackstat", "Website link copied")
		end })
		s.skipLink = connection:AddButton({ Name = "Start a new history instead", Callback = function() s.linking = false end })
		s.skipLink:SetVisible(false)
		local function addGame(section, gameId, about)
			local summary = section:AddLabel({ Text = game.GameId == gameId and "Tracks automatically in this game. Existing inventory is not counted as session gains." or "Not playing this game." })
			if game.GameId == gameId then s.summary = summary end
			section:AddParagraph({ Title = "What is tracked", Content = about })
			section:SetCollapsed(true)
		end
		addGame(stats, PET_SIMULATOR_99, "Items and Huge, Titanic, Gargantuan pets. Currency and regular pets are excluded. Inventory checks run every 5 seconds and sync every 15 seconds. Gains include trades and rewards, not only hatches. The website shows private history and anonymous community totals.")
		addGame(tab:AddRightSection("Steal an Egg", "egg"), STEAL_AN_EGG, "Money, speed, pets with their weight and mutations, eggs, gear and items. Checks run every 5 seconds and sync every 15 seconds. Gains include trades and rewards. The website shows private history and anonymous community totals.")
		if fresh then self:_TrackstatLink(s) end
	end
end

function Lib:_buildBuiltIns(win, o)
	pcall(function()
		self:RecordExecution(o)
	end)
	if o.ESPUrl then
		self.ESPUrl = o.ESPUrl
	end
	self:BuildKeybindPanel()
	self._builtInSectionCreated = false
	self:_EnsureBuiltInSection(win)
	win:AddSidebarSection("Config", true)
	if o.ConfigSettings ~= false then
		self:_BuildConfigTab(win)
	end
	if o.Manager ~= false then
		self:_BuildManagersTab(win, o.Folder or (o.Name or "SeisenHub"):gsub("%s+", ""))
	end
	win:AddSidebarSection("Extra", true)
	if o.SupportedGames ~= false then
		self:_BuildGamesTab(win)
	end
	self:_BuildESPTab(win)
	self:_BuildSuggestionsTab(win)
	if o.Trackstat ~= false then self:_BuildTrackstatTab(win) end
	if o.Cloud ~= false then
		task.defer(function()
			if win.Gui.Parent and not win._cloudConfigs then
				local options = Opts(type(o.Cloud) == "table" and o.Cloud or {})
				options.BuiltIn = options.BuiltIn ~= false
				win:CloudConfigs(options)
			end
		end)
	end
end


---------------------------------------------------------------- Cloud configs (Supabase)
-- Window:CloudConfigs({ Url = "https://<ref>.supabase.co", Key = "<anon key>", Game = optional, Tags = { ... }, PageSize = 20 })
-- Setup: supabase_library.sql (or cloud-only supabase_cloud.sql). Configs use library_cloud_configs.game_key; only the anon key is used here.
do
	local SORTS = { "Popular", "New", "Installs" }
	local SORT_NAMES = { Popular = "Popular", New = "Newest", Installs = "Most installed" }
	local FILTERS = { "All", "Favorites", "Mine", "Installed" }
	local EMPTY = { All = "No configs shared yet. Be the first!", Favorites = "No favorites yet", Mine = "You haven't published anything", Installed = "Nothing installed from the cloud yet" }


	local function Ago(iso)
		local ok, stamp = pcall(function()
			return DateTime.fromIsoDate(iso).UnixTimestamp
		end)
		if not ok then
			return ""
		end
		local d = os.time() - stamp
		if d < 60 then
			return "just now"
		elseif d < 3600 then
			return math.floor(d / 60) .. "m ago"
		elseif d < 86400 then
			return math.floor(d / 3600) .. "h ago"
		elseif d < 86400 * 7 then
			return math.floor(d / 86400) .. "d ago"
		end
		return math.floor(d / 86400 / 7) .. "w ago"
	end

	function Window:CloudConfigs(o)
		if self._cloudConfigs then return self._cloudConfigs end
		o = Opts(o, { Title = "Name", Description = "Desc" })
		local win = self
		local url = tostring(o.Url or Lib.Supabase.Url):gsub("/+$", "")
		local key = tostring(o.Key or Lib.Supabase.Key)
		local game_ = tostring(o.Game or game.GameId)
		local pageSize = math.max(math.floor(tonumber(o.PageSize) or 20), 1)
		local tagList = type(o.Tags) == "table" and o.Tags or { "Progression", "Bossing", "Exploration", "Challenges", "Balanced" }
		local maxTags = 3
		local entry, page = self:_addPage(o.Name or "Cloud", o.Icon or "cloud", false, o.BuiltIn)
		entry.Button.LayoutOrder = -1
		page:ClearAllChildren()
		page.AutomaticCanvasSize = Enum.AutomaticSize.None
		page.ScrollingEnabled = false
		page.ScrollBarThickness = 0
		Pad(page, 2, 2, 2, 2)

		local state = ReadJson(Dir("Cloud") .. "/_state.json") or {}
		state.tokens, state.favorites, state.installed = state.tokens or {}, state.favorites or {}, state.installed or {}
		local function save()
			WriteJson("Cloud", "_state", state)
		end
		local function has(list, id)
			return table.find(list, id) ~= nil
		end

		local function rpc(fn, args)
			return Lib:_SupabaseRPC(fn, args, url, key)
		end

		local query = { Search = "", Sort = "Popular", Filter = "All", Tag = nil, Offset = 0 }
		local cards, busy, serial = {}, false, 0
		local refresh, showBrowse, showPublish

		-- ---------------------------------------------------------- browse page
		local browse = New("Frame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = page })
		local publishPage = New("ScrollingFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 3, ScrollBarImageColor3 = Theme.Surface3, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, Visible = false, Parent = page })
		Pad(publishPage, 2, 2, 12, 16)
		List(publishPage, 8)

		local function button(parent, text, icon, primary, size, fn, pos)
			local b = New("TextButton", { Position = pos or UDim2.new(), Size = size, BackgroundColor3 = primary and Theme.Accent or Theme.Surface3, BackgroundTransparency = primary and 0.12 or 0.45, BorderSizePixel = 0, Text = "", AutoButtonColor = false, ClipsDescendants = true, Parent = parent })
			Round(b, 7)
			local st = Stroke(b, primary and Theme.Accent or Theme.Stroke, 1, primary and 0.4 or 0)
			local inner = New("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0, 1), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, Parent = b })
			List(inner, 6, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
			local img
			if icon then
				img = New("ImageLabel", { Size = UDim2.fromOffset(14, 14), BackgroundTransparency = 1, ImageColor3 = primary and Theme.AccentDark or Theme.Muted, ScaleType = Enum.ScaleType.Fit, LayoutOrder = 1, Parent = inner })
				Icon(img, icon)
			end
			local lbl
			if text and text ~= "" then
				lbl = Label({ Size = UDim2.new(0, 0, 1, 0), AutomaticSize = Enum.AutomaticSize.X, Text = text, TextSize = 12, TextColor3 = primary and Theme.AccentDark or Theme.Text, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 2, Parent = inner })
			end
			b.MouseEnter:Connect(function()
				Tween(b, { BackgroundTransparency = primary and 0 or 0.2 }, 0.12)
				Tween(st, primary and { Transparency = 0 } or { Color = Theme.StrokeHover }, 0.12)
				if img and not primary then
					Tween(img, { ImageColor3 = Theme.Accent }, 0.12)
				end
			end)
			b.MouseLeave:Connect(function()
				Tween(b, { BackgroundTransparency = primary and 0.12 or 0.45 }, 0.25)
				Tween(st, primary and { Transparency = 0.4 } or { Color = Theme.Stroke }, 0.25)
				if img and not primary then
					Tween(img, { ImageColor3 = Theme.Muted }, 0.25)
				end
			end)
			b.MouseButton1Click:Connect(function()
				Ripple(b)
				fn()
			end)
			return b, lbl, img
		end

		local intro = New("Frame", { Size = UDim2.new(1, 0, 0, 52), BackgroundTransparency = 1, Parent = browse })
		Label({ Size = UDim2.new(1, -108, 0, 28), Text = "Community presets", TextSize = 22, FontFace = Fonts.Bold, Parent = intro })
		Label({ Position = UDim2.fromOffset(0, 34), Size = UDim2.new(1, 0, 0, 16), Text = "Find your setup. Share your playstyle.", TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = intro })
		button(intro, "Publish", "plus", true, UDim2.fromOffset(96, 32), function()
			showPublish()
		end, UDim2.new(1, -96, 0, 0))

		-- search row
		local row1 = New("Frame", { Position = UDim2.fromOffset(0, 58), Size = UDim2.new(1, 0, 0, 38), BackgroundTransparency = 1, Parent = browse })
		local searchFrame = New("Frame", { Size = UDim2.new(1, -46, 1, 0), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row1 })
		Round(searchFrame, 8)
		local searchStroke = Stroke(searchFrame)
		NewIcon(searchFrame, "search", 14, Theme.Muted, UDim2.new(0, 10, 0.5, -7))
		local box = New("TextBox", { Position = UDim2.fromOffset(32, 0), Size = UDim2.new(1, -40, 1, 0), BackgroundTransparency = 1, Text = "", PlaceholderText = "Find a preset...  ( / )", PlaceholderColor3 = Theme.Muted, TextColor3 = Theme.Text, TextSize = 13, FontFace = Fonts.Regular, TextXAlignment = Enum.TextXAlignment.Left, ClearTextOnFocus = false, Parent = searchFrame })
		box.Focused:Connect(function()
			Tween(searchStroke, { Color = Theme.StrokeHover }, 0.15)
		end)
		box.FocusLost:Connect(function()
			Tween(searchStroke, { Color = Theme.Stroke }, 0.15)
			if query.Search ~= box.Text then
				query.Search = box.Text
				refresh(true)
			end
		end)
		win:_listen(UserInputService.InputBegan, function(input, processed)
			if not processed and input.KeyCode == Enum.KeyCode.Slash and page.Visible and win.Open then
				task.defer(function()
					box:CaptureFocus()
				end)
			end
		end)
		button(row1, nil, "refresh-cw", false, UDim2.fromOffset(32, 32), function()
			refresh(true)
		end, UDim2.new(1, -38, 0, 0))

		-- chip row
		local row2 = New("Frame", { Position = UDim2.fromOffset(0, 104), Size = UDim2.new(1, 0, 0, 32), BackgroundTransparency = 1, Parent = browse })
		local chipRow = New("ScrollingFrame", { Size = UDim2.new(1, -132, 1, 0), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, ScrollingDirection = Enum.ScrollingDirection.X, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, Parent = row2 })
		Pad(chipRow, 1, 1, 1, 1)
		local chipLayout = List(chipRow, 6, Enum.FillDirection.Horizontal)
		chipLayout.VerticalAlignment = Enum.VerticalAlignment.Center
		local topics = New("ScrollingFrame", { Position = UDim2.fromOffset(0, 140), Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 0, ScrollingDirection = Enum.ScrollingDirection.X, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.X, Parent = browse })
		Pad(topics, 1, 2, 1, 2)
		List(topics, 6, Enum.FillDirection.Horizontal)
		local chips = {}
		local function chip(name, order, fn)
			local face = New("TextButton", { Size = UDim2.fromOffset(0, 26), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Theme.Surface2, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = order, Parent = order > 10 and topics or chipRow })
			Round(face, 5)
			face.BackgroundTransparency = order > 10 and 0 or 1
			Pad(face, 12, 0)
			local stroke = Stroke(face, Theme.Stroke, 1, order > 10 and 0 or 1)
			local underline = New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 2), BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, Visible = false, Parent = face })
			local label = Label({ Size = UDim2.fromOffset(0, 26), AutomaticSize = Enum.AutomaticSize.X, Text = name, TextSize = 12, TextColor3 = Theme.Muted, TextTruncate = Enum.TextTruncate.None, Parent = face })
			chips[name] = { Face = face, Label = label, Stroke = stroke, Underline = underline, Topic = order > 10 }
			face.MouseButton1Click:Connect(fn)
		end
		local function paintChips()
			for name, c in pairs(chips) do
				local on = name == query.Filter or name == query.Tag
				Tween(c.Face, { BackgroundColor3 = on and c.Topic and Theme.Surface3 or Theme.Surface2 }, 0.15)
				Tween(c.Label, { TextColor3 = on and Theme.Text or Theme.Muted }, 0.15)
				Tween(c.Stroke, { Color = on and Theme.StrokeHover or Theme.Stroke }, 0.15)
				c.Underline.Visible = on and not c.Topic
			end
		end
		for i, name in ipairs(FILTERS) do
			chip(name, i, function()
				if query.Filter ~= name then
					query.Filter = name
					paintChips()
					refresh(true)
				end
			end)
		end
		for i, tag in ipairs(tagList) do
			chip(tostring(tag), 10 + i, function()
				query.Tag = query.Tag ~= tostring(tag) and tostring(tag) or nil
				paintChips()
				refresh(true)
			end)
		end
		local sortFace, sortLabel
		sortFace, sortLabel = button(row2, SORT_NAMES[query.Sort], "arrow-down-up", false, UDim2.fromOffset(124, 26), function()
			local i = table.find(SORTS, query.Sort) or 1
			query.Sort = SORTS[i % #SORTS + 1]
			sortLabel.Text = SORT_NAMES[query.Sort]
			refresh(true)
		end, UDim2.new(1, -1, 0, 1))
		sortFace.AnchorPoint = Vector2.new(1, 0)
		sortFace.BackgroundColor3 = Theme.Surface2
		sortFace.BackgroundTransparency = 0
		sortFace:FindFirstChildWhichIsA("ImageLabel", true).ImageColor3 = Theme.Accent
		Round(sortFace, 5)
		local function resizeSort()
			local width = sortLabel.AbsoluteSize.X / win.RootScale.Scale + 44
			sortFace.Size = UDim2.fromOffset(width, 26)
			chipRow.Size = UDim2.new(1, -(width + 8), 1, 0)
		end
		win:_listen(sortLabel:GetPropertyChangedSignal("AbsoluteSize"), resizeSort)
		task.defer(resizeSort)
		paintChips()

		local results = New("ScrollingFrame", { Position = UDim2.fromOffset(0, 180), Size = UDim2.new(1, 0, 1, -180), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 3, ScrollBarImageColor3 = Theme.Surface3, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, Parent = browse })
		Pad(results, 8, 4, 12, 12)
		List(results, 10)

		local countLabel = Label({ Size = UDim2.new(1, 0, 0, 16), Text = "", TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 0, Parent = results })
		local list = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = 1, Parent = results })
		local grid = New("UIGridLayout", { CellSize = UDim2.new(1, 0, 0, 136), CellPadding = UDim2.fromOffset(12, 12), SortOrder = Enum.SortOrder.LayoutOrder, Parent = list })
		local function resizeCards()
			local columns = results.AbsoluteSize.X / win.RootScale.Scale >= 720 and 2 or 1
			grid.CellSize = UDim2.new(1 / columns, -(columns - 1) * 12 / columns, 0, 136)
		end
		win:_listen(results:GetPropertyChangedSignal("AbsoluteSize"), resizeCards)
		task.defer(resizeCards)
		local empty = New("Frame", { Size = UDim2.new(1, 0, 0, 150), BackgroundTransparency = 1, LayoutOrder = 3, Visible = false, Parent = results })
		local emptyIcon = NewIcon(empty, "search-x", 26, Theme.Muted, UDim2.new(0.5, -13, 0, 24))
		local emptyText = Label({ Position = UDim2.fromOffset(0, 62), Size = UDim2.new(1, 0, 0, 36), Text = "", TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = true, TextTruncate = Enum.TextTruncate.None, Parent = empty })
		local clearBtn = button(empty, "Clear filters", nil, false, UDim2.fromOffset(104, 30), function()
			query.Filter, query.Tag, query.Search = "All", nil, ""
			box.Text = ""
			paintChips()
			refresh(true)
		end, UDim2.new(0.5, -52, 0, 104))
		local moreBtn = button(results, "Load more", "chevron-down", false, UDim2.new(1, 0, 0, 32), function()
			if not busy then
				refresh(false)
			end
		end)
		moreBtn.LayoutOrder = 2
		moreBtn.Visible = false

		local function clearCards()
			for _, c in ipairs(cards) do
				c:Destroy()
			end
			cards = {}
		end

		local function importRecord(rec)
			local ok, code = rpc("cloud_install", { p_game = game_, p_id = rec.id })
			if not ok or type(code) ~= "string" then
				return win:Notify({ Title = "Install failed", Content = tostring(ok and "Config not found" or code), Type = "Error", Duration = 3 })
			end
			local name = tostring(rec.name):gsub('[\\/:%*%?"<>|]', ""):gsub("^%s+", ""):gsub("%s+$", "")
			if name == "" then
				name = "Cloud config"
			end
			local base, n = name, 2
			while win:ConfigExists(name) do
				name = ("%s (%d)"):format(base, n)
				n += 1
			end
			local iok, ierr = win:ImportConfig(code, name)
			if not iok then
				return win:Notify({ Title = "Install failed", Content = tostring(ierr), Type = "Error", Duration = 3 })
			end
			if not has(state.installed, rec.id) then
				table.insert(state.installed, rec.id)
				save()
			end
			win:Notify({ Title = "Config installed", Content = name .. " (saved and applied)", Type = "Success", Duration = 3 })
		end

		local function makeCard(rec, order)
			local mine = state.tokens[rec.id] ~= nil
			local installed = has(state.installed, rec.id)
			local card = New("Frame", { Size = UDim2.new(1, 0, 0, 136), BackgroundColor3 = Theme.Surface2, BorderSizePixel = 0, LayoutOrder = order, Parent = list })
			Round(card, 10)
			local cardStroke = Stroke(card)
			Pad(card, 14, 12, 14, 12)
			local emblem = New("Frame", { Size = UDim2.fromOffset(32, 32), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = card })
			Round(emblem, 8)
			NewIcon(emblem, "sliders-horizontal", 16, Theme.Text, UDim2.fromOffset(8, 8))
			card.MouseEnter:Connect(function()
				Tween(cardStroke, { Color = Theme.StrokeHover }, 0.15)
			end)
			card.MouseLeave:Connect(function()
				Tween(cardStroke, { Color = Theme.Stroke }, 0.2)
			end)
			local head = New("Frame", { Position = UDim2.fromOffset(44, 0), Size = UDim2.new(1, -44, 0, 20), BackgroundTransparency = 1, Parent = card })
			Label({ Size = UDim2.new(1, -90, 1, 0), Text = rec.name, TextSize = 14, FontFace = Fonts.Bold, Parent = head })
			if mine then
				local badge = New("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, 0, 0.5, 0), Size = UDim2.fromOffset(0, 18), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Theme.Accent, BackgroundTransparency = 0.85, BorderSizePixel = 0, Parent = head })
				Round(badge, 5)
				Pad(badge, 7, 0)
				Label({ Size = UDim2.fromOffset(0, 18), AutomaticSize = Enum.AutomaticSize.X, Text = "YOURS", TextSize = 9, FontFace = Fonts.Bold, TextColor3 = Theme.Accent, TextTruncate = Enum.TextTruncate.None, Parent = badge })
			end
			local starred = has(state.favorites, rec.id)
			local star = New("TextButton", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, mine and -54 or 0, 0.5, 0), Size = UDim2.fromOffset(22, 22), BackgroundTransparency = 1, Text = "", AutoButtonColor = false, Parent = head })
			local starIcon = NewIcon(star, "star", 15, starred and Theme.Warning or Theme.Muted, UDim2.fromOffset(3, 3))
			star.MouseButton1Click:Connect(function()
				local i = table.find(state.favorites, rec.id)
				if i then
					table.remove(state.favorites, i)
				else
					table.insert(state.favorites, rec.id)
				end
				save()
				Tween(starIcon, { ImageColor3 = has(state.favorites, rec.id) and Theme.Warning or Theme.Muted }, 0.15)
			end)
			Label({ Position = UDim2.fromOffset(44, 22), Size = UDim2.new(1, -44, 0, 16), Text = ("%s  ·  %s"):format(tostring(rec.author), Ago(rec.updated_at or rec.created_at or "")), TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, Parent = card })
			if (rec.description or "") ~= "" then
				Label({ Position = UDim2.fromOffset(0, 46), Size = UDim2.new(1, 0, 0, 28), Text = rec.description, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextWrapped = true, TextTruncate = Enum.TextTruncate.AtEnd, TextYAlignment = Enum.TextYAlignment.Top, ClipsDescendants = true, Parent = card })
			end
			local foot = New("Frame", { AnchorPoint = Vector2.new(0, 1), Position = UDim2.fromScale(0, 1), Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1, Parent = card })
			local tags = New("Frame", { Size = UDim2.new(1, -190, 1, 0), BackgroundTransparency = 1, ClipsDescendants = true, Parent = foot })
			List(tags, 4, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
			for i, tag in ipairs(type(rec.tags) == "table" and rec.tags or {}) do
				if i > 3 then
					break
				end
				local t = New("Frame", { Size = UDim2.fromOffset(0, 18), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Theme.Surface3, BackgroundTransparency = 0.2, BorderSizePixel = 0, LayoutOrder = i, Parent = tags })
				Round(t, 5)
				Pad(t, 7, 0)
				Label({ Size = UDim2.fromOffset(0, 18), AutomaticSize = Enum.AutomaticSize.X, Text = tostring(tag), TextSize = 11, TextColor3 = Theme.Muted, TextTruncate = Enum.TextTruncate.None, Parent = t })
			end
			local right = New("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.fromOffset(0, 28), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, Parent = foot })
			local rl = List(right, 10, Enum.FillDirection.Horizontal)
			rl.VerticalAlignment = Enum.VerticalAlignment.Center
			rl.HorizontalAlignment = Enum.HorizontalAlignment.Right
			local stat = New("Frame", { Size = UDim2.fromOffset(0, 28), AutomaticSize = Enum.AutomaticSize.X, BackgroundTransparency = 1, LayoutOrder = 1, Parent = right })
			List(stat, 4, Enum.FillDirection.Horizontal).VerticalAlignment = Enum.VerticalAlignment.Center
			local dl = New("ImageLabel", { Size = UDim2.fromOffset(12, 12), BackgroundTransparency = 1, ImageColor3 = Theme.Muted, ScaleType = Enum.ScaleType.Fit, LayoutOrder = 1, Parent = stat })
			Icon(dl, "download")
			Label({ Size = UDim2.fromOffset(0, 28), AutomaticSize = Enum.AutomaticSize.X, Text = FormatCount(rec.installs), TextSize = 11, TextColor3 = Theme.Muted, TextTruncate = Enum.TextTruncate.None, LayoutOrder = 2, Parent = stat })
			if mine and query.Filter == "Mine" then
				local del = button(right, nil, "trash-2", false, UDim2.fromOffset(28, 28), function()
					win:Confirm({
						Title = "Delete from cloud",
						Content = "Remove " .. rec.name .. " from the cloud? People who installed it keep their copy.",
						Icon = "trash-2",
						ConfirmText = "Delete",
						Callback = function()
							task.spawn(function()
								local ok, res = rpc("cloud_delete", { p_game = game_, p_id = rec.id, p_token = state.tokens[rec.id] })
								if ok and res == true then
									state.tokens[rec.id] = nil
									save()
									card:Destroy()
									win:Notify({ Title = "Deleted", Content = rec.name, Type = "Success", Duration = 3 })
								else
									win:Notify({ Title = "Delete failed", Content = tostring(ok and "Not allowed" or res), Type = "Error", Duration = 3 })
								end
							end)
						end,
					})
				end)
				del.LayoutOrder = 2
			end
			local install = button(right, installed and "Installed" or "Install", nil, not installed, UDim2.fromOffset(84, 30), function()
				task.spawn(importRecord, rec)
			end)
			install.LayoutOrder = 3
			table.insert(cards, card)
		end

		function refresh(reset)
			if busy then
				return
			end
			busy = true
			serial += 1
			local mine = serial
			if reset then
				query.Offset = 0
				clearCards()
			end
			moreBtn.Visible = false
			empty.Visible = false
			countLabel.Text = "Loading..."
			task.spawn(function()
				local ids = query.Filter == "Favorites" and state.favorites or state.installed
				local ok, data = rpc("cloud_list", {
					p_game = game_, p_search = query.Search, p_sort = query.Sort, p_filter = query.Filter, p_tag = query.Tag,
					p_owner = LocalPlayer.UserId, p_ids = ids, p_limit = pageSize, p_offset = query.Offset,
				})
				if serial ~= mine then
					busy = false
					return
				end
				busy = false
				if not ok then
					countLabel.Text = ""
					emptyText.Text = "Could not load configs\n" .. tostring(data)
					empty.Visible = true
					return
				end
				for i, rec in ipairs(data) do
					makeCard(rec, query.Offset + i)
				end
				query.Offset += #data
				moreBtn.Visible = #data >= pageSize
				local n = #cards
				countLabel.Text = n .. (n == 1 and " config" or " configs") .. (query.Filter ~= "All" and (" in " .. query.Filter:lower()) or "")
				if n == 0 then
					emptyText.Text = (query.Search ~= "" or query.Tag) and "No configs match your search" or EMPTY[query.Filter]
					empty.Visible = true
				end
			end)
		end

		-- ---------------------------------------------------------- publish page
		local nameBox, descBox, descCount, note, chosen
		local function field(parent, labelText, placeholder, height, order)
			Label({ Size = UDim2.new(1, 0, 0, 14), Text = labelText, TextSize = 12, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = order, Parent = parent })
			local f = New("Frame", { Size = UDim2.new(1, 0, 0, height), BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, LayoutOrder = order + 1, Parent = parent })
			Round(f, 7)
			local st = Stroke(f)
			local tb = New("TextBox", { Position = UDim2.fromOffset(10, height > 40 and 8 or 0), Size = UDim2.new(1, -20, 1, height > 40 and -16 or 0), BackgroundTransparency = 1, Text = "", PlaceholderText = placeholder, PlaceholderColor3 = Theme.Muted, TextColor3 = Theme.Text, TextSize = 13, FontFace = Fonts.Regular, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = height > 40 and Enum.TextYAlignment.Top or Enum.TextYAlignment.Center, MultiLine = height > 40, TextWrapped = height > 40, ClearTextOnFocus = false, Parent = f })
			tb.Focused:Connect(function()
				Tween(st, { Color = Theme.StrokeHover }, 0.15)
			end)
			tb.FocusLost:Connect(function()
				Tween(st, { Color = Theme.Stroke }, 0.15)
			end)
			return tb, f
		end
		do
			local back = button(publishPage, "Back", nil, false, UDim2.fromOffset(60, 28), function()
				showBrowse()
			end)
			back.LayoutOrder = 1
			Label({ Size = UDim2.new(1, 0, 0, 22), Text = "Share your setup", TextSize = 22, FontFace = Fonts.Bold, LayoutOrder = 2, Parent = publishPage })
			nameBox = field(publishPage, "Name", "Name your preset", 38, 3)
			local d, df = field(publishPage, "Description", "What does it do, and how should people use it?", 100, 5)
			descBox = d
			descCount = Label({ AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -8, 1, -4), Size = UDim2.fromOffset(60, 12), Text = "0/300", TextSize = 10, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Right, Parent = df })
			descBox:GetPropertyChangedSignal("Text"):Connect(function()
				if #descBox.Text > 300 then
					descBox.Text = descBox.Text:sub(1, 300)
				end
				descCount.Text = #descBox.Text .. "/300"
			end)
			chosen = {}
			local tagTitle = Label({ Size = UDim2.new(1, 0, 0, 14), Text = ("Tags  (0/%d)"):format(maxTags), TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 7, Parent = publishPage })
			local tagRow = New("Frame", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = 8, Parent = publishPage })
			local tl = List(tagRow, 6, Enum.FillDirection.Horizontal)
			tl.Wraps = true
			local tagFaces = {}
			local function paintTags()
				local n = 0
				for tag, picked in pairs(chosen) do
					if picked then
						n += 1
					end
				end
				tagTitle.Text = ("Tags  (%d/%d)"):format(n, maxTags)
				for tag, c in pairs(tagFaces) do
					local on = chosen[tag]
					Tween(c.Face, { BackgroundColor3 = on and Theme.Accent or Theme.Surface2 }, 0.15)
					Tween(c.Label, { TextColor3 = on and Theme.AccentDark or Theme.Muted }, 0.15)
					Tween(c.Stroke, { Transparency = on and 1 or 0 }, 0.15)
				end
			end
			for i, tag in ipairs(tagList) do
				tag = tostring(tag)
				local face = New("TextButton", { Size = UDim2.fromOffset(0, 26), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Theme.Surface2, BorderSizePixel = 0, Text = "", AutoButtonColor = false, LayoutOrder = i, Parent = tagRow })
				Round(face, 5)
				Pad(face, 12, 0)
				local stroke = Stroke(face)
				local label = Label({ Size = UDim2.fromOffset(0, 26), AutomaticSize = Enum.AutomaticSize.X, Text = tag, TextSize = 12, TextColor3 = Theme.Muted, TextTruncate = Enum.TextTruncate.None, Parent = face })
				tagFaces[tag] = { Face = face, Label = label, Stroke = stroke }
				face.MouseButton1Click:Connect(function()
					local n = 0
					for _, picked in pairs(chosen) do
						if picked then
							n += 1
						end
					end
					if not chosen[tag] and n >= maxTags then
						return win:Notify({ Title = "Too many tags", Content = "Pick up to " .. maxTags, Type = "Error", Duration = 2 })
					end
					chosen[tag] = not chosen[tag] or nil
					paintTags()
				end)
			end
			Label({ Size = UDim2.new(1, 0, 0, 14), Text = "Settings to share", TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 9, Parent = publishPage })
			local shareChip = New("Frame", { Size = UDim2.fromOffset(0, 26), AutomaticSize = Enum.AutomaticSize.X, BackgroundColor3 = Theme.Accent, BorderSizePixel = 0, LayoutOrder = 10, Parent = publishPage })
			Round(shareChip, 5)
			Pad(shareChip, 12, 0)
			Label({ Size = UDim2.fromOffset(0, 26), AutomaticSize = Enum.AutomaticSize.X, Text = "Current settings", TextSize = 12, TextColor3 = Theme.AccentDark, TextTruncate = Enum.TextTruncate.None, Parent = shareChip })
			note = Label({ Size = UDim2.new(1, 0, 0, 14), Text = "", TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 11, Parent = publishPage })
			Label({ Size = UDim2.new(1, 0, 0, 14), Text = "You publish as " .. LocalPlayer.DisplayName, TextSize = 11, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 12, Parent = publishPage })
			local actions = New("Frame", { Size = UDim2.new(1, 0, 0, 32), BackgroundTransparency = 1, LayoutOrder = 13, Parent = publishPage })
			local working = false
			local function doPublish()
				if working then
					return
				end
				local code, err = win:ExportConfig()
				if not code then
					note.Text = tostring(err or "Nothing to publish")
					note.TextColor3 = Theme.Error
					return
				end
				local name = Trim(nameBox.Text)
				if name == "" then
					note.Text = "Give it a name first."
					note.TextColor3 = Theme.Error
					return
				end
				working = true
				note.Text = "Publishing..."
				note.TextColor3 = Theme.Muted
				local tags = {}
				for _, tag in ipairs(tagList) do
					if chosen[tostring(tag)] then
						table.insert(tags, tostring(tag))
					end
				end
				task.spawn(function()
					local ok, res = rpc("cloud_publish", {
						p_game = game_, p_name = name, p_description = Trim(descBox.Text), p_tags = tags, p_code = code,
						p_author = LocalPlayer.DisplayName, p_owner = LocalPlayer.UserId,
					})
					working = false
					if ok and type(res) == "table" and res.id then
						state.tokens[res.id] = res.token
						save()
						nameBox.Text, descBox.Text = "", ""
						chosen = {}
						paintTags()
						win:Notify({ Title = "Published", Content = name, Type = "Success", Duration = 3 })
						query.Filter, query.Tag = "Mine", nil
						paintChips()
						showBrowse()
						refresh(true)
					else
						note.Text = tostring(ok and "Could not publish" or res)
						note.TextColor3 = Theme.Error
					end
				end)
			end
			button(actions, "Publish", nil, true, UDim2.fromOffset(86, 32), doPublish)
			button(actions, "Cancel", nil, false, UDim2.fromOffset(86, 32), function()
				showBrowse()
			end, UDim2.fromOffset(94, 0))
		end

		function showBrowse()
			publishPage.Visible = false
			browse.Visible = true
			page.CanvasPosition = Vector2.zero
		end
		function showPublish()
			note.Text = ""
			browse.Visible = false
			publishPage.Visible = true
			publishPage.CanvasPosition = Vector2.zero
		end
		function win:_cloudPublish()
			showPublish()
		end

		refresh(true)
		self._cloudConfigs = { Refresh = function() refresh(true) end, Tab = entry }
		return self._cloudConfigs
	end
	Window.CreateCloudConfigs = Window.CloudConfigs
end


-- Additional charcoal components. Existing row, flag and cleanup systems are reused.
do
	local function panel(self, o, height, kind)
		local row, entry = self:_row(height > 0 and height + 8 or 0, o.Name or o.Title, kind)
		if height == 0 then row.AutomaticSize = Enum.AutomaticSize.Y end
		Pad(row, 12, 4, 12, 4)
		List(row, 0)
		local card = New("Frame", { Size = UDim2.new(1, 0, 0, height), AutomaticSize = height == 0 and Enum.AutomaticSize.Y or Enum.AutomaticSize.None, BackgroundColor3 = Theme.Surface, BorderSizePixel = 0, Parent = row })
		Round(card, 8)
		Stroke(card, Theme.Stroke)
		return row, entry, card
	end
	local function button(parent, text, callback, width)
		local b = New("TextButton", { Size = UDim2.fromOffset(width or 80, 28), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Text = text, TextSize = 11, FontFace = Fonts.Medium, TextColor3 = Theme.Text, AutoButtonColor = false, Parent = parent })
		Round(b, 5)
		local stroke = Stroke(b, Theme.Stroke)
		b.MouseEnter:Connect(function() Tween(stroke, { Color = Theme.Accent }, 0.12) end)
		b.MouseLeave:Connect(function() Tween(stroke, { Color = b:GetAttribute("Selected") and Theme.Accent or Theme.Stroke }, 0.15) end)
		b.MouseButton1Click:Connect(function() Safe(callback) end)
		return b
	end
	local function finish(self, o, obj, row, entry)
		Finish(self, o, obj, row)
		return Register(self, o, obj, entry, row)
	end
	local function clear(frame)
		for _, child in ipairs(frame:GetChildren()) do
			if child:IsA("GuiObject") then child:Destroy() end
		end
	end
	function Container:AddStatCard(o)
		o = Opt(o)
		local row, entry, card = panel(self, o, 100, "StatCard")
		Label({ Position = UDim2.fromOffset(12, 10), Size = UDim2.new(1, -48, 0, 16), Text = string.upper(o.Name or "Statistic"), TextSize = 10, FontFace = Fonts.Bold, TextColor3 = Theme.Muted, Parent = card })
		if o.Icon then NewIcon(card, o.Icon, 18, Theme.Accent, UDim2.new(1, -30, 0, 10)) end
		local value = Label({ Position = UDim2.fromOffset(12, 31), Size = UDim2.new(1, -24, 0, 32), TextSize = 27, FontFace = Fonts.Bold, Parent = card })
		local trend = Label({ Position = UDim2.fromOffset(12, 73), Size = UDim2.new(1, -24, 0, 16), Text = o.Trend or "", TextSize = 11, TextColor3 = o.TrendColor or Theme.Success, Parent = card })
		local obj = { Value = o.Value or o.Default or 0 }
		function obj:SetValue(v)
			self.Value = v
			value.Text = (o.Prefix or "") .. tostring(v) .. (o.Suffix or "")
		end
		function obj:Get() return self.Value end
		function obj:SetTrend(text, color) trend.Text = tostring(text) trend.TextColor3 = color or o.TrendColor or Theme.Success end
		obj.Set = obj.SetValue
		obj:SetValue(obj.Value)
		return finish(self, o, obj, row, entry)
	end

	function Container:AddAlertBanner(o)
		o = Opt(o)
		local row, entry, card = panel(self, o, 0, "AlertBanner")
		Pad(card, 12, 10, 12, 10)
		List(card, 7)
		local colors = { Info = Theme.Accent, Success = Theme.Success, Warning = Theme.Warning, Error = Theme.Error }
		local header = New("Frame", { Size = UDim2.new(1, 0, 0, 22), BackgroundTransparency = 1, LayoutOrder = 1, Parent = card })
		local icon = NewIcon(header, o.Icon or "info", 16, colors[o.Type] or Theme.Accent, UDim2.fromOffset(0, 3))
		local title = Label({ Position = UDim2.fromOffset(24, 0), Size = UDim2.new(1, -50, 1, 0), Text = o.Title or o.Name or "Notice", TextSize = 13, FontFace = Fonts.Bold, Parent = header })
		local content = Label({ Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, Text = o.Content or "", TextSize = 12, TextWrapped = true, TextTruncate = Enum.TextTruncate.None, TextYAlignment = Enum.TextYAlignment.Top, FontFace = Fonts.Regular, TextColor3 = Theme.Muted, LayoutOrder = 2, Parent = card })
		local obj = {}
		if o.Dismissible ~= false then
			local close = button(header, "x", function() obj:SetVisible(false) end, 22)
			close.Position, close.Size = UDim2.new(1, -22, 0, 0), UDim2.fromOffset(22, 22)
		end
		if o.ActionText then
			local action = button(card, o.ActionText, o.Callback, o.ActionWidth or 108)
			action.LayoutOrder = 3
		end
		function obj:SetText(text) content.Text = tostring(text) end
		function obj:SetTitle(text) title.Text = tostring(text) end
		function obj:SetType(kind) icon.ImageColor3 = colors[kind] or Theme.Accent end
		return finish(self, o, obj, row, entry)
	end


	function Container:AddStepIndicator(o)
		o = Opt(o)
		local row, entry, card = panel(self, o, 86, "StepIndicator")
		local steps, current = o.Steps or {}, tonumber(o.Default) or 1
		local obj = {}
		local function draw()
			clear(card)
			for i, text in ipairs(steps) do
				local b = New("TextButton", { Position = UDim2.new((i - 1) / #steps, 0, 0, 0), Size = UDim2.new(1 / #steps, 0, 1, 0), Text = "", BackgroundTransparency = 1, AutoButtonColor = false, Parent = card })
				local dot = Label({ AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 12), Size = UDim2.fromOffset(24, 24), BackgroundTransparency = 0, BackgroundColor3 = i <= current and Theme.Accent or Theme.Surface3, Text = tostring(i), TextColor3 = i <= current and Theme.AccentDark or Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, TextSize = 11, FontFace = Fonts.Bold, Parent = b })
				Round(dot, 12)
				Label({ Position = UDim2.fromOffset(3, 44), Size = UDim2.new(1, -6, 0, 30), Text = tostring(text), TextSize = 10, TextWrapped = true, TextColor3 = i == current and Theme.Text or Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, Parent = b })
				b.MouseButton1Click:Connect(function() obj:SetValue(i) end)
			end
		end
		function obj:SetValue(value, silent)
			local index = type(value) == "number" and value or table.find(steps, value)
			if not index or #steps == 0 then return end
			current = math.clamp(index, 1, #steps) draw()
			if not silent then Safe(o.Callback, current, steps[current]) end
		end
		function obj:Get() return current end
		function obj:Next() self:SetValue(current + 1) end
		function obj:Back() self:SetValue(current - 1) end
		function obj:SetSteps(values) steps = table.clone(values) current = math.clamp(current, 1, math.max(#steps, 1)) draw() end
		obj.Set = obj.SetValue
		draw()
		return finish(self, o, obj, row, entry)
	end

	function Container:AddEmptyState(o)
		o = Opt(o)
		local row, entry, card = panel(self, o, o.Height or (o.ActionText and 156 or 122), "EmptyState")
		NewIcon(card, o.Icon or "inbox", 28, Theme.Muted, UDim2.new(0.5, -14, 0, 14))
		local title = Label({ Position = UDim2.fromOffset(12, 53), Size = UDim2.new(1, -24, 0, 20), Text = o.Title or o.Name or "Nothing here yet", TextSize = 13, FontFace = Fonts.Bold, TextXAlignment = Enum.TextXAlignment.Center, Parent = card })
		local content = Label({ Position = UDim2.fromOffset(14, 80), Size = UDim2.new(1, -28, 0, 32), Text = o.Content or "", TextSize = 11, TextColor3 = Theme.Muted, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Center, Parent = card })
		if o.ActionText then
			local b = button(card, o.ActionText, o.Callback, o.ActionWidth or 112)
			b.AnchorPoint, b.Position = Vector2.new(0.5, 1), UDim2.new(0.5, 0, 1, -10)
		end
		local obj = {}
		function obj:SetText(text) content.Text = tostring(text) end
		function obj:SetTitle(text) title.Text = tostring(text) end
		return finish(self, o, obj, row, entry)
	end

	function Container:AddCircularProgress(o)
		o = Opt(o)
		local row, entry, card = panel(self, o, 128, "CircularProgress")
		local segments, maximum, value = {}, math.max(tonumber(o.Max) or 100, 0.001), tonumber(o.Default) or 0
		local ring = New("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 10), Size = UDim2.fromOffset(82, 82), BackgroundTransparency = 1, Parent = card })
		for i = 1, 40 do
			local angle = (i - 1) / 40 * math.pi * 2
			segments[i] = New("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromOffset(41 + math.sin(angle) * 36, 41 - math.cos(angle) * 36), Size = UDim2.fromOffset(3, 8), Rotation = (i - 1) * 9, BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = ring })
			Round(segments[i], 1)
		end
		local text = Label({ Size = UDim2.fromScale(1, 1), TextSize = 20, FontFace = Fonts.Bold, TextXAlignment = Enum.TextXAlignment.Center, Parent = ring })
		Label({ Position = UDim2.fromOffset(8, 100), Size = UDim2.new(1, -16, 0, 18), Text = o.Name or "Progress", TextSize = 11, TextColor3 = Theme.Muted, TextXAlignment = Enum.TextXAlignment.Center, Parent = card })
		local obj = {}
		function obj:SetValue(v)
			value = math.clamp(tonumber(v) or 0, 0, maximum)
			text.Text = tostring(math.floor(value / maximum * 100 + 0.5)) .. "%"
			for i, segment in ipairs(segments) do segment.BackgroundColor3 = i <= math.floor(value / maximum * #segments + 0.5) and (o.Color or Theme.Accent) or Theme.Surface3 end
		end
		function obj:Get() return value end
		obj.Set = obj.SetValue
		obj:SetValue(value)
		return finish(self, o, obj, row, entry)
	end





	function Container:AddSkeletonLoader(o)
		o = Opt(o)
		local row, entry, card = panel(self, o, o.Height or 112, "SkeletonLoader")
		local group = New("CanvasGroup", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = card })
		for i, width in ipairs(o.Widths or { 0.85, 0.6, 0.74 }) do
			local line = New("Frame", { Position = UDim2.fromOffset(12, 14 + (i - 1) * 28), Size = UDim2.new(width, -24, 0, 14), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Parent = group })
			Round(line, 4)
		end
		local animation = TweenService:Create(group, TweenInfo.new(0.9, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), { GroupTransparency = 0.65 })
		local obj = { Loading = false }
		function obj:SetLoading(value)
			self.Loading = value == true self:SetVisible(self.Loading)
			if self.Loading then animation:Play() else animation:Cancel() group.GroupTransparency = 0 end
		end
		finish(self, o, obj, row, entry)
		row.Destroying:Connect(function() animation:Cancel() end)
		obj:SetLoading(o.Loading ~= false)
		return obj
	end



	for _, name in ipairs({ "StatCard", "AlertBanner", "StepIndicator", "EmptyState", "CircularProgress", "SkeletonLoader" }) do
		Lib["Create" .. name] = function(self, parent, options)
			local host = self:_pseudo(parent)
			return host["Add" .. name](host, options)
		end
	end
	FeatureKinds.StepIndicator = "list"
end


function Container:AddAutomationStatus(o)
	o = Opt(o)
	local row, entry = self:_row(68, o.Name or "Automation", "AutomationStatus")
	Label({ Position = UDim2.fromOffset(14, 6), Size = UDim2.new(1, -100, 0, 18), Text = o.Name or "Automation", TextSize = 13, FontFace = Fonts.Bold, Parent = row })
	local status = Label({ Name = "AutomationState", Position = UDim2.fromOffset(14, 28), Size = UDim2.new(1, -100, 0, 32), TextSize = 11, TextWrapped = true, TextTruncate = Enum.TextTruncate.None, TextYAlignment = Enum.TextYAlignment.Top, Parent = row })
	local stop = New("TextButton", { Name = "StopAutomation", AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14, 0.5, 0), Size = UDim2.fromOffset(66, 28), BackgroundColor3 = Theme.Surface3, BorderSizePixel = 0, Text = "Stop", TextSize = 12, TextColor3 = Theme.Error, FontFace = Fonts.Medium, AutoButtonColor = false, Parent = row })
	Round(stop, 6)
	Stroke(stop, Theme.Stroke)
	local obj = { Running = false }
	function obj:SetStatus(text, running)
		self.Running = running == true
		status.Text, status.TextColor3 = tostring(text), self.Running and Theme.Success or Theme.Muted
		stop.Active, stop.TextTransparency = self.Running, self.Running and 0 or 0.6
	end
	function obj:Stop()
		if not self.Running or self._disabled then return end
		if o.Toggle then o.Toggle:SetValue(false) end
		self:SetStatus("Stopped", false)
		Safe(o.OnStop)
	end
	stop.MouseButton1Click:Connect(function() obj:Stop() end)
	obj:SetStatus(o.Status or "Idle", o.Running)
	Finish(self, o, obj, row)
	return Register(self, o, obj, entry, row)
end
function Lib:CreateAutomationStatus(parent, o)
	return self:_pseudo(parent):AddAutomationStatus(o)
end

do
 function Container:AddPriorityList(o)
  o=Opt(o)
  local order,values,views={}, {}, {}
  local conditions=o.Conditions~=false and (o.Conditions or {"Always","When idle","When ready"}) or nil
  for _,item in ipairs(o.Items or {}) do
   local id=tostring(type(item)=="table" and (item.Id or item.Name) or item)
   assert(not values[id],"Priority items require unique IDs")
   order[#order+1]=id
   values[id]={Id=id,Name=type(item)=="table" and (item.Name or id) or id,Enabled=type(item)~="table" or item.Enabled~=false,Condition=type(item)=="table" and item.Condition or (conditions and conditions[1])}
   if conditions and not table.find(conditions,values[id].Condition) then values[id].Condition=conditions[1] end
  end
  local stride=conditions and 78 or 40
  local height=math.max(math.min(#order,o.MaxVisible or 3),1)*stride-4
  local row,entry=self:_row(height+38,o.Name or "Priority","PriorityList")
  Label({Position=UDim2.fromOffset(14,2),Size=UDim2.new(1,-28,0,22),Text=o.Name or "Priority",TextSize=12,FontFace=Fonts.Bold,Parent=row})
  local list=New("ScrollingFrame",{Name="PriorityItems",Position=UDim2.fromOffset(12,30),Size=UDim2.new(1,-24,0,height),BackgroundTransparency=1,BorderSizePixel=0,ScrollBarThickness=3,ScrollBarImageColor3=Theme.StrokeHover,CanvasSize=UDim2.new(),AutomaticCanvasSize=Enum.AutomaticSize.Y,Parent=row})
  List(list,4)
  Pad(list,1,1,5,1)
  local obj={Type="PriorityList",Window=self.Window}
  local dragId,startY,startIndex
  local function draw()
   for i,id in ipairs(order) do
    local view=views[id]
    if view then
     view.Frame.LayoutOrder=i
     view.Label.Text=tostring(i)..". "..values[id].Name
     view.Label.TextColor3=values[id].Enabled and Theme.Text or Theme.Muted
     view.Check.ImageTransparency=values[id].Enabled and 0 or 1
     view.Enable.BackgroundColor3=values[id].Enabled and Theme.Accent or Theme.Surface3
     view.Up.ImageTransparency=i==1 and 0.7 or 0
     view.Down.ImageTransparency=i==#order and 0.7 or 0
     if view.Condition then view.Condition:Set(values[id].Condition,true) end
    end
   end
  end
  local function changed(silent)
   draw()
   if not silent then Safe(o.Callback,obj:Get()) Fire(obj) end
  end
  function obj:Get()
   local result={}
   for _,id in ipairs(order) do result[#result+1]={Id=id,Enabled=values[id].Enabled,Condition=values[id].Condition} end
   return result
  end
  function obj:GetOrder(enabledOnly)
   local result={}
   for _,id in ipairs(order) do if not enabledOnly or values[id].Enabled then result[#result+1]=id end end
   return result
  end
  function obj:SetValue(items,silent)
   if type(items)~="table" then return end
   local nextOrder,seen={},{}
   for _,item in ipairs(items) do
    local id=tostring(type(item)=="table" and item.Id or item)
    if values[id] and not seen[id] then
     nextOrder[#nextOrder+1],seen[id]=id,true
     if type(item)=="table" then
      if item.Enabled~=nil then values[id].Enabled=item.Enabled==true end
      if conditions and table.find(conditions,item.Condition) then values[id].Condition=item.Condition end
     end
    end
   end
   for _,id in ipairs(order) do if not seen[id] then nextOrder[#nextOrder+1]=id end end
   order=nextOrder
   changed(silent)
  end
  obj.Set=obj.SetValue
  function obj:Move(item,to)
   local from=type(item)=="number" and item or table.find(order,tostring(item))
   if not from or not order[from] then return false end
   to=math.clamp(math.floor(tonumber(to) or from),1,#order)
   if from==to then return false end
   table.insert(order,to,table.remove(order,from)) changed() return true
  end
  function obj:SetEnabled(id,enabled)
   id=tostring(id) if not values[id] then return false end
   values[id].Enabled=enabled==true changed() return true
  end
  function obj:SetCondition(id,condition)
   id=tostring(id)
   if not values[id] or not conditions or not table.find(conditions,condition) then return false end
   values[id].Condition=condition changed() return true
  end
  local function iconButton(parent,name,icon,position)
   local b=New("TextButton",{Name=name,Position=position,Size=UDim2.fromOffset(24,26),BackgroundTransparency=1,Text="",AutoButtonColor=false,Parent=parent})
   local image=NewIcon(b,icon,13,Theme.Muted,UDim2.fromOffset(5.5,6.5))
   b.MouseEnter:Connect(function() Tween(image,{ImageColor3=Theme.Accent},0.15) end)
   b.MouseLeave:Connect(function() Tween(image,{ImageColor3=Theme.Muted},0.15) end)
   return b,image
  end
  for _,id in ipairs(order) do
   local frame=New("Frame",{Name=id,Size=UDim2.new(1,0,0,stride-4),BackgroundColor3=Theme.Surface,BorderSizePixel=0,Parent=list})
   Round(frame,7)
   local border=Stroke(frame,Theme.Stroke)
   local grab=iconButton(frame,"DragHandle","grip-vertical",UDim2.fromOffset(0,4))
   local enable=New("TextButton",{Name="Enabled",Position=UDim2.fromOffset(24,8),Size=UDim2.fromOffset(18,18),BackgroundColor3=Theme.Surface3,Text="",BorderSizePixel=0,AutoButtonColor=false,Parent=frame})
   Round(enable,4)
   local check=NewIcon(enable,"check",12,Theme.AccentDark,UDim2.fromOffset(3,3))
   local title=Label({Position=UDim2.fromOffset(48,4),Size=UDim2.new(1,-100,0,26),TextSize=12,Parent=frame})
   local up,upIcon=iconButton(frame,"MoveUp","chevron-up",UDim2.new(1,-50,0,4))
   local down,downIcon=iconButton(frame,"MoveDown","chevron-down",UDim2.new(1,-26,0,4))
   views[id]={Frame=frame,Label=title,Enable=enable,Check=check,Up=upIcon,Down=downIcon,Border=border}
   if conditions then
    local host=New("Frame",{Position=UDim2.fromOffset(0,32),Size=UDim2.new(1,0,0,36),BackgroundTransparency=1,Parent=frame})
    local choice=Lib:_pseudo(host):Dropdown({Name="",Stacked=true,Options=conditions,Default=values[id].Condition,Searchable=false,AllowNone=false,Callback=function(value) obj:SetCondition(id,value) end})
    choice.Reset=nil
    views[id].Condition=choice
   end
   enable.MouseButton1Click:Connect(function() if not obj._disabled then obj:SetEnabled(id,not values[id].Enabled) end end)
   up.MouseButton1Click:Connect(function() if not obj._disabled then obj:Move(id,table.find(order,id)-1) end end)
   down.MouseButton1Click:Connect(function() if not obj._disabled then obj:Move(id,table.find(order,id)+1) end end)
   grab.InputBegan:Connect(function(input)
    if IsPress(input) and not obj._disabled then
     dragId,startY,startIndex=id,input.Position.Y,table.find(order,id)
     if self.Window._closePopup then self.Window._closePopup() end
     Tween(border,{Color=Theme.Accent},0.12)
    end
   end)
  end
  local move=UserInputService.InputChanged:Connect(function(input)
   if dragId and IsMove(input) and not obj._disabled then
    local delta=(input.Position.Y-startY)/math.max(self.Window.RootScale.Scale,0.05)
    obj:Move(dragId,startIndex+math.floor(delta/stride+0.5))
   end
  end)
  local release=UserInputService.InputEnded:Connect(function(input)
   if dragId and IsPress(input) then Tween(views[dragId].Border,{Color=Theme.Stroke},0.2) dragId=nil end
  end)
  table.insert(self.Window.Connections,move) table.insert(self.Window.Connections,release)
  row.Destroying:Connect(function() dragId=nil move:Disconnect() release:Disconnect() end)
  if o.Default then obj:SetValue(o.Default,true) else draw() end
  Finish(self,o,obj,row)
  local disable=obj.SetDisabled
  function obj:SetDisabled(value,reason)
   disable(self,value,reason)
   if self._disabled then dragId=nil end
   for _,view in pairs(views) do if view.Condition then view.Condition._disabled=self._disabled if self._disabled then view.Condition:SetOpen(false) end end end
  end
  return Register(self,o,obj,entry,row)
 end

 local function settings(self,o,fields)
  o=Opt(o)
  local obj={Controls={}}
  local updating=true
  function obj:Get()
   local result={}
   for _,field in ipairs(fields) do
    local control=self.Controls[field.Key]
    result[field.Key]=field.Multi and table.clone(control.Value) or control:Get()
   end
   return result
  end
  local function changed()
   if not updating then Safe(o.Callback,obj:Get()) end
  end
  for _,field in ipairs(fields) do
   local options={Name=field.Name,Default=o.Default and o.Default[field.Key] or field.Default,Flag=o.Flag and (o.Flag.."_"..field.Key),Callback=changed}
   for _,key in ipairs({"Options","Multi","Min","Max","Suffix","GetOptions"}) do options[key]=field[key] end
   obj.Controls[field.Key]=field.Options and self:AddSearchableDropdown(options) or self:AddSlider(options)
  end
  updating=false
  local defaults=obj:Get()
  function obj:SetValue(value)
   if type(value)~="table" then return end
   updating=true
   for _,field in ipairs(fields) do if value[field.Key]~=nil then self.Controls[field.Key]:SetValue(value[field.Key]) end end
   updating=false changed()
  end
  obj.Set=obj.SetValue
  function obj:Reset() self:SetValue(defaults) end
  function obj:SetDisabled(value,reason) for _,control in pairs(self.Controls) do control:SetDisabled(value,reason) end end
  function obj:SetVisible(value) for _,control in pairs(self.Controls) do control:SetVisible(value) end end
  return obj
 end
 function Container:AddMovementSettings(o)
  o=Opt(o)
  local methods=o.Methods or {"Walk","Tween","Teleport"}
  return settings(self,o,{
   {Key="Method",Name="Move method",Options=methods,Default=methods[1]},
   {Key="Speed",Name="Move speed",Min=o.MinSpeed or 1,Max=o.MaxSpeed or 250,Default=50, Suffix=" studs/s"},
   {Key="Distance",Name="Stand-off distance",Min=0,Max=o.MaxDistance or 50,Default=6,Suffix=" studs"},
  })
 end
 function Container:AddTargetRules(o)
  o=Opt(o)
  local modes=o.Modes or {"Nearest","Lowest health","Selected order","Bosses first"}
  return settings(self,o,{
   {Key="Priority",Name="Target priority",Options=modes,Default=modes[1]},
   {Key="Targets",Name="Allowed targets",Options=o.Targets or {},Multi=true,Default=o.Targets or {},GetOptions=o.GetTargets},
   {Key="Range",Name="Detection range",Min=1,Max=o.MaxRange or 500,Default=100,Suffix=" studs"},
  })
 end
 for _,name in ipairs({"PriorityList","MovementSettings","TargetRules"}) do
  Lib["Create"..name]=function(self,parent,o) local host=self:_pseudo(parent) return host["Add"..name](host,o) end
 end
 FeatureKinds.PriorityList="list"
end

return Lib
