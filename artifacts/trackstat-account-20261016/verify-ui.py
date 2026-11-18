from pathlib import Path
import sys
r=Path(sys.argv[1]);f=r/'app/trackstat/AccountPopover.tsx';login=r/'app/trackstat/login/page.tsx'
if not f.exists() or not login.exists():print('BASELINE: Account summary and dedicated email-code page absent');sys.exit(1)
s=f.read_text(encoding='utf-8');l=login.read_text(encoding='utf-8')
assert '>Account</span>' in s and 'Connected Roblox accounts' in s and '{count}' in s
assert '<input' not in s and '<form' not in s and 'Save your Trackstat' not in s
assert 'href="/trackstat/login"' in s
assert 'signInWithOtp' in l and 'verifyOtp' in l and 'one-time-code' in l
assert 'trackstatFetch' in (r/'app/trackstat/StealAnEggView.tsx').read_text(encoding='utf-8')
print('PASS: Account summary/count only; separate email-code page; authenticated catalog access')
