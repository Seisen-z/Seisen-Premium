from pathlib import Path
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
