local calls = 0
local function choose(value)
    calls += 1
    return value, "extra"
end
assert((if true then false else error("eager else")) == false, "fixture line 6")
assert((if false then error("eager then") else nil) == nil, "fixture line 7")
assert((if false then 1 elseif false then 2 elseif true then 3 else 4) == 3, "fixture line 8")
assert((if true then if false then 1 else 2 else 3) == 2, "fixture line 9")
assert((if false then 1 else if true then 2 else 3) == 2, "fixture line 10")
assert((if 0 then "zero is truthy" else false) == "zero is truthy", "fixture line 11")
local a,b = if true then choose(false) else choose(true)
assert(a == false and b == nil and calls == 1, "fixture line 13")
local function result(...) return if true then ... else 99 end
local packed = table.pack(result(nil, 7))
assert(packed.n == 1 and packed[1] == nil, "fixture line 16")
local function forward(...) return ... end
local forwarded = table.pack(forward(nil, 2, nil))
assert(forwarded.n == 3 and forwarded[1] == nil and forwarded[2] == 2 and forwarded[3] == nil, "nil vararg counts")
local offset = 10
local f = function(x) return if x then offset else offset + 1 end
assert(f(true) == 10 and f(false) == 11, "fixture line 19")
offset = 12
assert(f(true) == 12 and f(false) == 13, "captured upvalue changes")
local pair = {if true then choose(8) else choose(9)}
assert(#pair == 1 and pair[1] == 8 and calls == 2, "fixture line 21")
local total = 0
for i=1,4 do
    if if i == 2 then true else false then continue end
    total += if i == 1 then 10 else i
end
assert(total == 17, "fixture line 27")
assert(7 // 2 == 3 and -7 // 2 == -4 and 7 // -2 == -4, "fixture line 28")
assert(20 // 3 // 2 == 3 and 2 + 9 // 2 * 3 == 14, "fixture line 29")
assert((if true then 17 else 1) // 4 == 4, "fixture line 30")
assert(16 // (if false then 1 else 3) == 5, "fixture line 31")
local metatableCalls = 0
local divisor = setmetatable({}, {__idiv=function(_, rhs) metatableCalls += 1;return rhs + 100 end})
assert(divisor // 2 == 102 and metatableCalls == 1, "fixture line 34")
local shadow = function()
    local math = {floor=function() error("shadowed math.floor") end}
    return 9 // 2
end
assert(shadow() == 4, "fixture line 39")
local lazy = 0
local v = if choose(false) then error("bad") else choose("chosen")
assert(v == "chosen" and calls == 4 and lazy == 0, "fixture line 42")
print("PASS: Luau conditional and floor-division semantics")
