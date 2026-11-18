from pathlib import Path
import sys,subprocess
p=Path(__file__).parent;source=Path(sys.argv[1]);s=source.read_text(encoding="utf-8")
compiler=Path(r"E:\Seisen Hub\.libtest\artifacts\newui-home-2026-10-15\compiler")
r=subprocess.run([str(compiler/"luau-compile.exe"),"--null",str(source)],capture_output=True,text=True);assert r.returncode==0,r.stderr
a=s.index('Name = "Reset connection key"');a=s.index('Callback = function()',a)+len('Callback = ');b=s.index('\n\t\tend })',a)+len('\n\t\tend')
fn=s[a:b]
mock=r'''local s;local calls;local connects;local saves;local fileMode=false;local persisted=true;local remote=true
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
'''
tests=r'''local passed=0
local function test(name,fn)setup();fn();passed+=1;print("PASS "..name)end
test("reset uses destructive RPC and clears old in-memory upload",function()reset();assert(calls[1].name=="trackstat_reset_and_wipe");assert(s.key=="new-key"and not s.session and not s.snapshot and not s.previous);assert(s.presenceSession=="new-presence"and s.presenceAt==0);assert(not s.busy)end)
test("failed reset keeps old key and snapshot",function()remote=false;reset();assert(s.key=="old-key"and s.session=="old-session"and s.snapshot.gained==50);assert(s.message=="fixture failure")end)
test("failed file persistence prevents destructive RPC",function()fileMode=true;persisted=false;reset();assert(#calls==0 and s.key=="old-key")end)
test("busy or linking blocks reset",function()s.busy=true;reset();assert(connects==0);s.busy=false;s.linking=true;reset();assert(connects==0)end)
print("RESULT "..passed.." library reset tests passed")
'''
f=p/"library-tests.luau";f.write_text(mock+"local reset="+fn+"\n"+tests,encoding="utf-8");r=subprocess.run([str(compiler/"luau.exe"),str(f)],capture_output=True,text=True);print(r.stdout+r.stderr);sys.exit(r.returncode)
