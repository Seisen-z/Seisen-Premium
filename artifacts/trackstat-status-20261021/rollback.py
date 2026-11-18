from pathlib import Path
import json,shutil,sys,hashlib
here=Path(__file__).resolve().parent
target=Path(sys.argv[1]).resolve()
for item in json.loads((here/'manifest.json').read_text()):
 p=(target/item['path']).resolve()
 assert p.is_relative_to(target)
 p.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(here/'BASELINE_FILE'/(item['path']+'.bak'),p)
 assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256']
for name in json.loads((here/'new-files.json').read_text()):
 p=(target/name).resolve()
 assert p.is_relative_to(target)
 if p.exists(): p.unlink()
print('RESTORED: 6 baseline hashes; new migration removed')
