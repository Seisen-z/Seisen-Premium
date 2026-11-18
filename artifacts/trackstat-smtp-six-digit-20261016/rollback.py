from pathlib import Path
import json,sys
p=Path(__file__).resolve().parent;root=Path(sys.argv[1]).resolve();assert root!=Path(root.anchor)
for rel in json.loads((p/'manifest.json').read_text(encoding='utf-8')):
 f=(root/rel).resolve();assert f.is_relative_to(root);f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes((p/'baseline'/(rel+'.bak')).read_bytes())
for rel in json.loads((p/'added.json').read_text(encoding='utf-8')):
 f=(root/rel).resolve();assert f.is_relative_to(root)
 if f.exists():f.unlink()
print('ROLLBACK: prior login and email service restored; six-digit component and SMTP route removed')
