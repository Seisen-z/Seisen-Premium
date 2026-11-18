from pathlib import Path
import json,zipfile,hashlib
W=Path('D:/Website/Seisen Premium');A=W/'artifacts/homepage-hero-20261010';b=json.loads((A/'BASELINE_MANIFEST.json').read_text());assert hashlib.sha256((W/'app/getkey/page.tsx').read_bytes()).hexdigest()==b['unrelated_getkey_sha256'];rows=json.loads((A/'MODIFIED_MANIFEST.json').read_text());assert all(hashlib.sha256((W/x['file']).read_bytes()).hexdigest()==x['sha256'] for x in rows)
report='''Seisen homepage hero integration — 2026-10-10
Target: D:\\Website\\Seisen Premium, homepage app/page.tsx from the user's screenshot. Not the Reiya desktop Home screen.
Changed branch/fields: homepage hero now uses next/image src=/script-hub-hero.png with priority and sizes=100vw. Terminal illustration and cream split removed. Original heading, Browse Scripts /scripts and Go Premium /premium actions, social proof, working-count data, header/navigation, and all sections after the hero preserved. Desktop uses full-width artwork with a dark readability gradient; <=1023px stacks text and artwork. Mobile working badge sits left to avoid floating theme button.
Additional minimal correction: existing Discord JSON mapper any -> existing DiscordMember type, resolving baseline eslint error without data/behavior changes. No authentication/payment/backend edits. Existing unrelated app/getkey/page.tsx modification hash unchanged.
Artifacts:
MODIFIED_FILE: D:\\Website\\Seisen Premium\\artifacts\\homepage-hero-20261010\\MODIFIED_FILE.zip
DIFF_FILE: D:\\Website\\Seisen Premium\\artifacts\\homepage-hero-20261010\\DIFF_FILE.patch
VERIFICATION: D:\\Website\\Seisen Premium\\artifacts\\homepage-hero-20261010\\VERIFICATION.txt
ROLLBACK: D:\\Website\\Seisen Premium\\artifacts\\homepage-hero-20261010\\ROLLBACK.sh
Original homepage copied before edits; original hash in BASELINE_MANIFEST.json. New module CSS/artwork were absent; current file hashes in MODIFIED_MANIFEST.json.

BASELINE browser command (cwd D:\\Website\\Seisen Premium): node artifacts/homepage-hero-20261010/baseline-ui.mjs
Input: original localhost:3000 homepage before source edits, 1848x914 browser viewport.
Literal output/result: BASELINE PASS: localhost homepage HTTP 200; original heading and terminal illustration rendered
Exit status: 0. Original heading/nav link structure saved in baseline-ui.json.
BASELINE lint command: npx.cmd eslint app/page.tsx
Input: preserved original homepage.
Literal output/result: Unexpected any. Specify a different type
4 problems (1 error, 3 warnings)
Exit status: 1. This baseline failure was pre-existing, not counted as a pass.

MODIFIED lint command: npx.cmd eslint app/page.tsx
Input: illustrated homepage; explicit DiscordMember mapper type.
Literal output/result: 3 problems (0 errors, 3 warnings)
Exit status: 0. Existing warnings remain: unused Button, unused ScriptShowcase and existing external Discord avatar img element. Hero artwork itself uses Next image optimization.
MODIFIED build command: npm.cmd run build
Input: final homepage and scoped CSS, including mobile badge position.
Literal output/result: Compiled successfully in 20.9s
Static prerendered and dynamic route build completed.
Exit status: 0; see build.log. TypeScript stage passed. No deploy/push performed.
MODIFIED browser command: node artifacts/homepage-hero-20261010/ui-test.mjs
Input: real local Next app; wait for existing loading screen to finish; decode optimized hero artwork, compare heading/nav with baseline, verify CTA targets, asset HTTP 200, viewport overflow and JS errors.
Literal output/result: MODIFIED PASS: real localhost homepage HTTP 200; optimized hero image decoded; terminal removed; original header, heading and CTA routes retained
PASS responsive checks at 1848/1440/1024/768/390px; mobile artwork and CTA visible; no page JS errors
Exit status: 0. Screenshots modified-desktop.png and modified-390.png; intermediate screenshots initially sampled existing startup fade, so final browser run waits for seisen_loading_shown. Badge moved left after visual review to avoid fixed theme control.

ROLLBACK command: "C:\\Program Files\\Git\\bin\\sh.exe" "D:/Website/Seisen Premium/artifacts/homepage-hero-20261010/ROLLBACK.sh" "D:/Website/Seisen Premium/artifacts/homepage-hero-20261010/rollback-copy"
Input: isolated extracted modified source copy. Rollback only accepts the explicit isolated target; path resolution is checked before each operation.
Literal output/result: ROLLBACK PASS: isolated homepage restored to original hash and terminal illustration; new asset/CSS absent; actual illustrated homepage unchanged
Exit status: 0. Restored behavior/status: isolated original page hash matches baseline; terminal string returned, module import removed and new files absent. Original existing lint issue would also be restored. Actual modified homepage, module CSS and public artwork remain changed/present. First rollback check encountered a Windows text-decoding error after byte restoration; explicit UTF-8 corrected the check, then it passed.

Final source paths:
D:\\Website\\Seisen Premium\\app\\page.tsx
D:\\Website\\Seisen Premium\\app\\home-hero.module.css
D:\\Website\\Seisen Premium\\public\\script-hub-hero.png
View: http://localhost:3000 . Existing local Next dev server retained. Header component/source not edited; current user Get Key changes preserved. No production deployment, new release or Git push performed for this homepage change.
'''
(A/'VERIFICATION.txt').write_text(report,encoding='utf-8')
for f in ['MODIFIED_FILE.zip','DIFF_FILE.patch','VERIFICATION.txt','ROLLBACK.sh']:
 p=A/f;assert p.read_bytes();print('REOPENED',f,p.stat().st_size,'bytes')
with zipfile.ZipFile(A/'MODIFIED_FILE.zip') as z:assert z.testzip() is None
print('PASS current source matches archive; all four artifacts reopened; illustrated homepage remains changed')
