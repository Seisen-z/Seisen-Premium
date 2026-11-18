local s;local calls;local connects;local saves;local fileMode=false;local persisted=true;local remote=true
local HttpService={GenerateGUID=function()return "new-presence"end}
local function newKey()return "new-key"end
local function HasFiles()return fileMode end
local self={_trackstat=nil}
function self:_TrackstatConnect()connects+=1;return true end
function self:_TrackstatSave()saves+=1;return persisted end
function self:_TrackstatRPC(name,args)table.insert(calls,{name=name,args=args});return remote,remote and {wiped=true}or "fixture failure"end
local function setup()
 s={key="old-key",session="old-session",snapshot={gained=50},previous={old=true},presenceSession="old-presence",presenceAt=99,nextAt=99}
 s.status={SetText=function(_,v)s.message=v end};self._trackstat=s;calls={};connects=0;saves=0;fileMode=false;persisted=true;remote=true
end
local reset=function()
			if s.busy or s.linking then return end
			s.busy = true
			local ok, err = self:_TrackstatConnect()
			if ok then
				s.pending = newKey()
				local persisted = self:_TrackstatSave()
				if not HasFiles() or persisted then
					ok, err = self:_TrackstatRPC("trackstat_reset_and_wipe", { p_key = s.key, p_new_key = s.pending })
					if ok then
						s.key, s.pending = s.pending, nil
						s.session, s.snapshot, s.previous = nil, nil, nil
						s.presenceSession, s.presenceAt, s.nextAt = HttpService:GenerateGUID(false), 0, 0
						self:_TrackstatSave()
					end
				else ok, err = false, "Key file could not be saved; reset was not sent" end
			end
			s.busy = false
			if not s.closed then s.status:SetText(ok and "Data deleted · copy the new key to reconnect your website" or tostring(err)) end
		end
local passed=0
local function test(name,fn)setup();fn();passed+=1;print("PASS "..name)end
test("reset uses destructive RPC and clears old in-memory upload",function()reset();assert(calls[1].name=="trackstat_reset_and_wipe");assert(s.key=="new-key"and not s.session and not s.snapshot and not s.previous);assert(s.presenceSession=="new-presence"and s.presenceAt==0);assert(not s.busy)end)
test("failed reset keeps old key and snapshot",function()remote=false;reset();assert(s.key=="old-key"and s.session=="old-session"and s.snapshot.gained==50);assert(s.message=="fixture failure")end)
test("failed file persistence prevents destructive RPC",function()fileMode=true;persisted=false;reset();assert(#calls==0 and s.key=="old-key")end)
test("busy or linking blocks reset",function()s.busy=true;reset();assert(connects==0);s.busy=false;s.linking=true;reset();assert(connects==0)end)
print("RESULT "..passed.." library reset tests passed")
