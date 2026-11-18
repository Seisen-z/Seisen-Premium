from pathlib import Path
A=Path(__file__).resolve().parent
p=A/'MODIFIED_CORE/src/prometheus/compiler/compiler.lua'
s=p.read_bytes().decode('utf-8').replace('\r\n','\n')
def edit(old,new,count=1):
 global s
 assert s.count(old)==count,(old,s.count(old));s=s.replace(old,new)
edit('    self.unpackVar = self.scope:addVariable();','    self.unpackVar = self.scope:addVariable();\n    self.packVar = self.scope:addVariable();')
edit('function Compiler:unpack(scope)','''function Compiler:pack(scope, entries)
    scope:addReferenceToHigherScope(self.scope, self.packVar);
    local args = {};
    for i, entry in ipairs(entries) do args[i] = entry.value; end
    return Ast.FunctionCallExpression(Ast.VariableExpression(self.scope, self.packVar), args);
end

function Compiler:unpack(scope)''')
edit('self:setReturn(scope, Ast.TableConstructorExpression(entries))','self:setReturn(scope, self:pack(scope, entries))')
for reg in ('baseReg','tmpReg'):
 old='Ast.TableConstructorExpression{Ast.TableEntry(Ast.FunctionCallExpression(self:register(scope, '+reg+'), args))}'
 count=2
 edit(old,'self:pack(scope, {Ast.TableEntry(Ast.FunctionCallExpression(self:register(scope, '+reg+'), args))})',count)
edit('Ast.TableConstructorExpression({Ast.TableEntry(Ast.VarargExpression())})','self:pack(createClosureSubScope, {Ast.TableEntry(Ast.VarargExpression())})')
edit('self:setRegister(scope, self.varargReg, Ast.TableConstructorExpression({','self:setRegister(scope, self.varargReg, self:pack(scope, {')
edit('    -- Emit Code\n    local functionNode =','''    -- Explicit counts preserve a selected nil value through VM returns and varargs.
    local rawUnpack = self.scope:addVariable();
    local unpackScope, packScope = Scope:new(self.scope), Scope:new(self.scope);
    local values, first, last = unpackScope:addVariable(), unpackScope:addVariable(), unpackScope:addVariable();
    unpackScope:addReferenceToHigherScope(self.scope, rawUnpack);
    packScope:addReferenceToHigherScope(self.scope, self.selectVar);
    local packBody = Ast.Block({Ast.ReturnStatement({Ast.TableConstructorExpression({
        Ast.KeyedTableEntry(Ast.StringExpression("n"), Ast.FunctionCallExpression(Ast.VariableExpression(self.scope, self.selectVar), {Ast.StringExpression("#"), Ast.VarargExpression()})),
        Ast.TableEntry(Ast.VarargExpression()),
    })})}, packScope);
    local unpackBody = Ast.Block({Ast.ReturnStatement({Ast.FunctionCallExpression(Ast.VariableExpression(self.scope, rawUnpack), {
        Ast.VariableExpression(unpackScope, values),
        Ast.OrExpression(Ast.VariableExpression(unpackScope, first), Ast.NumberExpression(1)),
        Ast.OrExpression(Ast.VariableExpression(unpackScope, last), Ast.OrExpression(
            Ast.IndexExpression(Ast.VariableExpression(unpackScope, values), Ast.StringExpression("n")),
            Ast.LenExpression(Ast.VariableExpression(unpackScope, values)))),
    })})}, unpackScope);

    -- Emit Code
    local functionNode =''')
edit('        Ast.AssignmentStatement(assignmentStatLhs, assignmentStatRhs);','''        Ast.LocalVariableDeclaration(self.scope, {rawUnpack}, {Ast.VariableExpression(self.scope, self.unpackVar)});
        Ast.AssignmentStatement({Ast.AssignmentVariable(self.scope, self.unpackVar)}, {Ast.FunctionLiteralExpression({
            Ast.VariableExpression(unpackScope, values), Ast.VariableExpression(unpackScope, first), Ast.VariableExpression(unpackScope, last),
        }, unpackBody)});
        Ast.LocalVariableDeclaration(self.scope, {self.packVar}, {Ast.FunctionLiteralExpression({Ast.VarargExpression()}, packBody)});
        Ast.AssignmentStatement(assignmentStatLhs, assignmentStatRhs);''')
p.write_bytes(s.replace('\n','\r\n').encode('utf-8'))
print('Staged VM result-count preservation for conditional nil and varargs')
