from pathlib import Path
import shutil
A=Path(__file__).resolve().parent
ROOT=A/'MODIFIED_CORE/src/prometheus'
for name in ['ast.lua','enums.lua','parser.lua','unparser.lua','visitast.lua','compiler/compiler.lua']:
 shutil.copyfile(A/'BASELINE_CORE/src/prometheus'/name,ROOT/name)
def edit(name,old,new,count=1):
 p=ROOT/name;s=p.read_bytes().decode('utf-8')
 if '\r\n' in s: old=old.replace('\n','\r\n');new=new.replace('\n','\r\n')
 assert s.count(old)==count,(name,old,s.count(old));p.write_bytes(s.replace(old,new).encode('utf-8'))
edit('enums.lua','"+=", "-=", "/=", "%=", "^=", "..=", "*=",','"+=", "-=", "/=", "%=", "^=", "..=", "*=", "//",')
edit('ast.lua','\tDivExpression = "DivExpression";','\tDivExpression = "DivExpression";\n\tFloorDivExpression = "FloorDivExpression";\n\tIfElseExpression = "IfElseExpression";')
edit('ast.lua','\t[AstKind.DivExpression] = 7;','\t[AstKind.DivExpression] = 7;\n\t[AstKind.FloorDivExpression] = 7;\n\t[AstKind.IfElseExpression] = 13;')
edit('ast.lua','function Ast.ModExpression(lhs, rhs, simplify)','''function Ast.FloorDivExpression(lhs, rhs)
	return {
		kind = AstKind.FloorDivExpression,
		lhs = lhs,
		rhs = rhs,
		isConstant = false,
	}
end

function Ast.IfElseExpression(condition, ifTrue, ifFalse)
	return {
		kind = AstKind.IfElseExpression,
		condition = condition,
		ifTrue = ifTrue,
		ifFalse = ifFalse,
		isConstant = false,
	}
end

function Ast.ModExpression(lhs, rhs, simplify)''')
edit('parser.lua','\t\tif(consume(self, TokenKind.Symbol, "%")) then\n\t\t\tlocal rhs = self:expressionUnary(scope);','''		if(self.luaVersion == LuaVersion.LuaU and consume(self, TokenKind.Symbol, "//")) then
			local rhs = self:expressionUnary(scope);
			curr = Ast.FloorDivExpression(curr, rhs);
			found = true;
		end

		if(consume(self, TokenKind.Symbol, "%")) then
			local rhs = self:expressionUnary(scope);''')
edit('parser.lua','function Parser:tableOrFunctionLiteral(scope)\n','''function Parser:tableOrFunctionLiteral(scope)
	if(self.luaVersion == LuaVersion.LuaU and is(self, TokenKind.Keyword, "if")) then
		return self:expressionIfElse(scope);
	end
''')
edit('parser.lua','function Parser:expressionFunctionLiteral(parentScope)','''function Parser:expressionIfElse(scope, isElseIf)
	expect(self, TokenKind.Keyword, isElseIf and "elseif" or "if");
	local condition = self:expression(scope);
	expect(self, TokenKind.Keyword, "then");
	local ifTrue = self:expression(scope);
	local ifFalse;
	if(is(self, TokenKind.Keyword, "elseif")) then
		ifFalse = self:expressionIfElse(scope, true);
	else
		expect(self, TokenKind.Keyword, "else");
		ifFalse = self:expression(scope);
	end
	return Ast.IfElseExpression(condition, ifTrue, ifFalse);
end

function Parser:expressionFunctionLiteral(parentScope)''')
edit('visitast.lua','\tAstKind.DivExpression,','\tAstKind.DivExpression,\n\tAstKind.FloorDivExpression,')
edit('visitast.lua','\tif(binaryExpressions[expression.kind]) then','''	if(expression.kind == AstKind.IfElseExpression) then
		expression.condition = visitExpression(expression.condition, previsit, postvisit, data);
		expression.ifTrue = visitExpression(expression.ifTrue, previsit, postvisit, data);
		expression.ifFalse = visitExpression(expression.ifFalse, previsit, postvisit, data);
	end

	if(binaryExpressions[expression.kind]) then''')
edit('unparser.lua','\tk = AstKind.ModExpression;','''	k = AstKind.FloorDivExpression;
	if(expression.kind == k) then
		local lhs = self:unparseExpression(expression.lhs, tabbing);
		if(Ast.astKindExpressionToNumber(expression.lhs.kind) >= Ast.astKindExpressionToNumber(k)) then
			lhs = "(" .. lhs .. ")";
		end
		local rhs = self:unparseExpression(expression.rhs, tabbing);
		if(Ast.astKindExpressionToNumber(expression.rhs.kind) >= Ast.astKindExpressionToNumber(k)) then
			rhs = "(" .. rhs .. ")";
		end
		return lhs .. self:optionalWhitespace() .. "//" .. self:optionalWhitespace() .. rhs;
	end

	if(expression.kind == AstKind.IfElseExpression) then
		return "(if " .. self:unparseExpression(expression.condition, tabbing)
			.. " then " .. self:unparseExpression(expression.ifTrue, tabbing)
			.. " else " .. self:unparseExpression(expression.ifFalse, tabbing) .. ")";
	end

	k = AstKind.ModExpression;''')
edit('compiler/compiler.lua','            AstKind.DivExpression,','            AstKind.DivExpression,\n            AstKind.FloorDivExpression,')
edit('compiler/compiler.lua','    -- Binary Operations\n','''    -- A conditional evaluates exactly one branch and produces one value, including false/nil.
    if(expression.kind == AstKind.IfElseExpression) then
        local posState = self.registers[self.POS_REGISTER];
        self.registers[self.POS_REGISTER] = self.VAR_REGISTER;
        local regs = {};
        for i = 1, math.max(1, numReturns) do
            regs[i] = self:allocRegister();
            if i > 1 then
                self:addStatement(self:setRegister(scope, regs[i], Ast.NilExpression()), {regs[i]}, {}, false);
            end
        end
        local savedPos;
        if posState then
            savedPos = self:allocRegister(false);
            self:addStatement(self:copyRegisters(scope, {savedPos}, {self.POS_REGISTER}), {savedPos}, {self.POS_REGISTER}, false);
        end
        local conditionReg = self:compileExpression(expression.condition, funcDepth, 1)[1];
        local trueBlock, falseBlock, joinBlock = self:createBlock(), self:createBlock(), self:createBlock();
        scope = self.activeBlock.scope;
        self:addStatement(self:setRegister(scope, self.POS_REGISTER,
            Ast.OrExpression(Ast.AndExpression(self:register(scope, conditionReg), Ast.NumberExpression(trueBlock.id)), Ast.NumberExpression(falseBlock.id))),
            {self.POS_REGISTER}, {conditionReg}, false);
        self:freeRegister(conditionReg, false);
        for _, branch in ipairs({{trueBlock, expression.ifTrue}, {falseBlock, expression.ifFalse}}) do
            self:setActiveBlock(branch[1]);
            local valueReg = self:compileExpression(branch[2], funcDepth, 1)[1];
            scope = self.activeBlock.scope;
            self:addStatement(self:copyRegisters(scope, {regs[1]}, {valueReg}), {regs[1]}, {valueReg}, false);
            self:freeRegister(valueReg, false);
            self:addStatement(self:setRegister(scope, self.POS_REGISTER, Ast.NumberExpression(joinBlock.id)), {self.POS_REGISTER}, {}, false);
        end
        self.registers[self.POS_REGISTER] = posState;
        self:setActiveBlock(joinBlock);
        if savedPos then
            self:addStatement(self:copyRegisters(joinBlock.scope, {self.POS_REGISTER}, {savedPos}), {self.POS_REGISTER}, {savedPos}, false);
            self:freeRegister(savedPos, false);
        end
        if numReturns == 0 then
            self:freeRegister(regs[1], false);
            return {};
        end
        return regs;
    end

    -- Binary Operations
''')
print('Staged native LuaU conditional-expression and floor-division support')
