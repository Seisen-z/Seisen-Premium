from pathlib import Path
import shutil,sys,json,hashlib
A=Path(__file__).resolve().parent
root=Path(sys.argv[1]).resolve()
manifest=json.loads((A/'ORIGINAL_HASHES.json').read_text())
for relative,expected in manifest.items():
 target=(root/relative).resolve()
 assert target.is_relative_to(root)
 target.parent.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(A/'BASELINE_FILES'/relative,target)
 assert hashlib.sha256(target.read_bytes()).hexdigest()==expected
for relative in ['scripts/test-prometheus.cjs','scripts/fixtures/prometheus-luau.luau','lib/prometheus/AGENTS.md']:
 target=(root/relative).resolve();assert target.is_relative_to(root)
 if target.exists():target.unlink()
print('PASS: original hashes restored; added test/instruction files removed')
