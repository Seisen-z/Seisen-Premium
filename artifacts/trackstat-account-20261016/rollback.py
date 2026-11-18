from pathlib import Path
import json,sys
here=Path(__file__).resolve().parent
root=Path(sys.argv[1]).resolve();library=Path(sys.argv[2]).resolve()
assert root!=Path(root.anchor) and library.suffix=='.lua'
root.mkdir(parents=True,exist_ok=True)
for rel in json.loads((here/'manifest.json').read_text(encoding='utf-8')):
 target=(root/rel).resolve();assert target.is_relative_to(root)
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((here/'baseline'/(rel+'.bak')).read_bytes())
for rel in json.loads((here/'new-files.json').read_text(encoding='utf-8')):
 target=(root/rel).resolve();assert target.is_relative_to(root)
 if target.exists():target.unlink()
library.parent.mkdir(parents=True,exist_ok=True);library.write_bytes((here/'BASELINE_LIBRARY.lua').read_bytes())
(library.parent/'CHANGELOG.md').write_bytes((here/'BASELINE_LIBRARY_CHANGELOG.md').read_bytes())
print('ROLLBACK: original website and library source restored; added feature files removed')
