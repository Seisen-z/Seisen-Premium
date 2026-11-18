from pathlib import Path
import json,hashlib,shutil,zipfile,difflib,subprocess
W=Path('D:/Website/Seisen Premium');A=W/'artifacts/homepage-hero-20261010';files=['app/page.tsx','app/home-hero.module.css','public/script-hub-hero.png'];base=json.loads((A/'BASELINE_MANIFEST.json').read_text());assert hashlib.sha256((W/'app/getkey/page.tsx').read_bytes()).hexdigest()==base['unrelated_getkey_sha256'];rows=[]
with zipfile.ZipFile(A/'MODIFIED_FILE.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in files:
  p=W/f;z.write(p,f);rows.append({'file':f,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(A/'MODIFIED_MANIFEST.json').write_text(json.dumps(rows,indent=2))
b=(A/'baseline/page.tsx').read_text(encoding='utf-8');m=(W/'app/page.tsx').read_text(encoding='utf-8');diff=''.join(difflib.unified_diff(b.splitlines(True),m.splitlines(True),fromfile='before/app/page.tsx',tofile='after/app/page.tsx'));diff+=''.join(difflib.unified_diff([], (W/'app/home-hero.module.css').read_text(encoding='utf-8').splitlines(True),fromfile='/dev/null',tofile='after/app/home-hero.module.css'));diff+='\nAdded public/script-hub-hero.png; SHA256 '+rows[2]['sha256']+'\n';(A/'DIFF_FILE.patch').write_text(diff,encoding='utf-8')
(A/'rollback.py').write_text('''from pathlib import Path
import sys,json,hashlib,shutil
A=Path(__file__).resolve().parent;T=Path(sys.argv[1]).resolve();assert T==A/'rollback-copy' and T.is_dir(), 'Use the explicit isolated rollback-copy target'
M=json.loads((A/'BASELINE_MANIFEST.json').read_text())
for f in ['app/page.tsx','app/home-hero.module.css','public/script-hub-hero.png']:
 p=(T/f).resolve();assert T in p.parents
 if f=='app/page.tsx':shutil.copy2(A/'baseline/page.tsx',p);assert hashlib.sha256(p.read_bytes()).hexdigest()==M['page_sha256']
 elif p.exists():p.unlink()
assert 'seisen_loader.lua' in (T/'app/page.tsx').read_text(encoding='utf-8')
assert 'home-hero.module.css' not in (T/'app/page.tsx').read_text(encoding='utf-8')
print('ROLLBACK PASS: isolated homepage restored to original hash and terminal illustration; new asset/CSS absent; actual illustrated homepage unchanged')
''',encoding='utf-8');(A/'ROLLBACK.sh').write_text('#!/bin/sh\nset -eu\nA=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\npython "$A/rollback.py" "${1:?Explicit isolated rollback-copy directory required}"\n',encoding='utf-8',newline='\n');(A/'ROLLBACK.sh').chmod(0o755);T=A/'rollback-copy';T.mkdir(exist_ok=True)
with zipfile.ZipFile(A/'MODIFIED_FILE.zip') as z:z.extractall(T)
r=subprocess.run(['C:/Program Files/Git/bin/sh.exe',str(A/'ROLLBACK.sh'),str(T)],capture_output=True,text=True);assert r.returncode==0,r.stderr;(A/'rollback-tests.log').write_text(r.stdout+'Exit status: 0\n');print(r.stdout.strip())
with zipfile.ZipFile(A/'MODIFIED_FILE.zip') as z:assert z.testzip() is None
print('PASS original/modified hashes and rollback tested; unrelated Get Key edits preserved')
