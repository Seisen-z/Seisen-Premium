local a=setmetatable({}, {__idiv=function(_,b) return 123 end})
print(a // 2)
