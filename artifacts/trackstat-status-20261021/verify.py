from pathlib import Path
import sys,subprocess,shutil,json
here=Path(__file__).resolve().parent
root=here.parent.parent
mode=sys.argv[1]
assert mode in ('baseline','modified','rollback')
if mode=='rollback':
 target=here/'ROLLBACK_COPY'
 for item in json.loads((here/'manifest.json').read_text()):
  p=target/item['path'];p.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(root/item['path'],p)
 for name in json.loads((here/'new-files.json').read_text()):
  p=target/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/name,p)
 result=subprocess.run([r'C:\Program Files\Git\bin\sh.exe',str(here/'ROLLBACK.sh'),str(target)],capture_output=True,text=True)
 (here/'rollback-restore.txt').write_text(result.stdout+result.stderr)
 assert result.returncode==0,result.stderr
 # Artifact source suffix prevents Next from compiling test copies.
 for p in target.rglob('*'):
  if p.suffix in ('.ts','.tsx'):p.rename(p.with_name(p.name+'.bak'))
for script in ('test-api.cjs','test-db.mjs'):
 result=subprocess.run(['node',str(here/script),mode],cwd=root,capture_output=True,text=True)
 (here/(mode+'-'+script+'.txt')).write_text(result.stdout+result.stderr)
 assert result.returncode==0,result.stdout+result.stderr
if mode=='modified':
 result=subprocess.run(['node',str(here/'test-ui.cjs')],cwd=root,capture_output=True,text=True)
 (here/'modified-ui.txt').write_text(result.stdout+result.stderr)
 assert result.returncode==0,result.stdout+result.stderr
print({'baseline':'BASELINE: removal 503 and missing reset status reproduced','modified':'MODIFIED: 7 API + 9 database cases + status rendering PASS','rollback':'ROLLBACK: baseline hashes and original behavior restored'}[mode])
