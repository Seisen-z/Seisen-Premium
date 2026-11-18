from pathlib import Path
import subprocess,os,json,shutil,hashlib,difflib,zipfile
A=Path(__file__).resolve().parent
R=A.parents[1]
stage=A/'MODIFIED_FILES'
core=A/'MODIFIED_CORE'
core_names=['ast.lua','enums.lua','parser.lua','unparser.lua','visitast.lua','compiler/compiler.lua']
for name in core_names:
 target=stage/'lib/prometheus/src/prometheus'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(core/'src/prometheus'/name,target)
files=sorted(str(p.relative_to(stage)).replace('\\','/') for p in stage.rglob('*') if p.is_file())
manifest=json.loads((A/'ORIGINAL_HASHES.json').read_text())
env=os.environ.copy();env['SEISEN_PROJECT_ROOT']=str(R);env['LUAU_BIN']=r'E:\Seisen Hub\.codex-transactions\BloxFruits-remaining-2026-10-11\compiler\luau.exe'
runner=stage/'scripts/test-prometheus.cjs'
records=[]
def run(label,args,env_extra={},expected=0):
 e=env.copy();e.update(env_extra)
 q=subprocess.run(args,cwd=R,env=e,capture_output=True,text=True,encoding='utf-8')
 record=label+'\nCOMMAND: '+subprocess.list2cmdline(args)+'\nENV: '+json.dumps({k:e[k] for k in ['SEISEN_PROJECT_ROOT','LUAU_BIN','PROMETHEUS_CORE'] if k in e})+'\nINPUT: scripts/fixtures/prometheus-luau.luau or explicitly named complete hub input.\nOUTPUT:\n'+q.stdout+q.stderr+'EXIT STATUS: '+str(q.returncode)+'\n'
 (A/(label.replace(' ','_')+'.log')).write_text(record,encoding='utf-8');records.append(record);print(label, 'exit',q.returncode);assert q.returncode==expected,q.stderr[-1600:]
run('BASELINE',['node',str(runner)],{'PROMETHEUS_CORE':str(A/'BASELINE_CORE')},1)
run('MODIFIED',['node',str(runner)],{'PROMETHEUS_CORE':str(core)})
hub=r'E:\Seisen Hub\Scripts\Free script\StealAnEgg\StealAnEgg_2026-10-18_07.lua'
run('ORIGINAL HUB BASELINE',['node',str(runner),'--script',hub],{'PROMETHEUS_CORE':str(A/'BASELINE_CORE')},1)
run('ORIGINAL HUB MODIFIED',['node',str(runner),'--script',hub,'--preset','Minify','--out',str(A/'ORIGINAL_HUB_Minify.lua')],{'PROMETHEUS_CORE':str(core)})
(A/'ROLLBACK.sh').write_text('#!/bin/sh\nset -eu\nDIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\npython "$DIR/rollback.py" "${1:-$DIR/../..}"\n',encoding='utf-8',newline='\n');(A/'ROLLBACK.sh').chmod(0o755)
rollback=A/'ROLLBACK_TARGET'
assert not rollback.exists()
shutil.copytree(core,rollback/'lib/prometheus')
for relative in files:
 target=rollback/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(stage/relative,target)
run('ROLLBACK RESTORE',[r'C:\Program Files\Git\bin\sh.exe',str(A/'ROLLBACK.sh'),str(rollback)])
run('ROLLBACK',['node',str(runner)],{'PROMETHEUS_CORE':str(rollback/'lib/prometheus')},1)
diff=[]
for relative in files:
 before=A/'BASELINE_FILES'/relative
 old=before.read_text(encoding='utf-8') if before.exists() else ''
 new=(stage/relative).read_text(encoding='utf-8')
 diff.extend(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='a/'+relative,tofile='b/'+relative))
(A/'DIFF_FILE.diff').write_text(''.join(diff),encoding='utf-8')
with zipfile.ZipFile(A/'MODIFIED_FILE.zip','w',zipfile.ZIP_DEFLATED) as z:
 for relative in files:z.write(stage/relative,relative)
with zipfile.ZipFile(A/'MODIFIED_FILE.zip') as z:assert z.testzip() is None
for relative,expected in manifest.items():
 assert hashlib.sha256((R/relative).read_bytes()).hexdigest()==expected,'Live file changed externally: '+relative
for relative in files:
 target=R/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(stage/relative,target)
run('INSTALLED NPM TEST',['npm.cmd','test'])
report='''Changed syntax fields: native IfElseExpression AST/parser/visitor/unparser/VM branches and FloorDivExpression AST/token/precedence/parser/visitor/unparser/VM binary operation. Lua51 mode remains strict. VM packing/unpacking now records explicit result counts to preserve nil branches and varargs.
Preserved lazy selection, false/nil, single-result conditionals, nested elseif, side effects, upvalues, floor-division precedence, negatives and __idiv metamethods. No and/or ternary lowering, no regex input rewriting. Supported continue and compound assignment behavior retained.
Added reusable actual-core regression command, fixture corpus, npm test integration, future-agent regression instructions, README and changelog. No promise of universal future syntax support. No deployment or Git push performed.
FOUR PATHS:
'''+str(A/'MODIFIED_FILE.zip')+'\n'+str(A/'DIFF_FILE.diff')+'\n'+str(A/'VERIFICATION.txt')+'\n'+str(A/'ROLLBACK.sh')+'\nORIGINAL HASHES:\n'+json.dumps(manifest,indent=2)+'\n\n'+'\n'.join(records)+'''
Rollback restored original source hashes and original rejection of the reproducing fixture; separate rollback target used. Live core retains native support. Generated full original hub output compiled, not gameplay-executed. All four presets were runtime-tested using standalone fixtures against official Luau reference behavior.
Review: six core files changed; one shared VM pack/unpack mechanism is needed for nil-count correctness. No unrelated application logic or authentication changed.
'''
(A/'VERIFICATION.txt').write_text(report,encoding='utf-8')
for name in ['MODIFIED_FILE.zip','DIFF_FILE.diff','VERIFICATION.txt','ROLLBACK.sh']:
 assert (A/name).read_bytes();print('Reopened:',A/name)
print('PASS: staged support installed, npm tests passed, rollback verified')
