"""Local checks: run `python test_server.py`. Uses a temporary database and a fake key check, so nothing touches Supabase."""
import os
import tempfile

os.environ.update(DB_PATH=os.path.join(tempfile.mkdtemp(), 't.db'), SITE_TOKEN='site-secret', BOT_TOKEN='bot-secret')

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
import store  # noqa: E402

ACCOUNT, GAME = '11111111-2222-3333-4444-555555555555', '3317771874'
KEY = 'sp_' + 'a' * 64


KEY2, ACCOUNT2 = 'sp_' + 'e' * 64, '66666666-2222-3333-4444-555555555555'


async def fake_account(key):
    if key == KEY:
        return ACCOUNT, True
    if key == KEY2:
        return ACCOUNT2, False  # runs the library but was never used on the website
    raise main.HTTPException(401, 'Invalid connection key')


main.account_of = fake_account
main.MIN_PUSH_SECONDS = 0
client = TestClient(main.app)
site = {'Authorization': 'Bearer site-secret'}


def push(stacks, key=KEY):
    return client.post('/v1/inventory', json={'game': GAME, 'inventory': stacks}, headers={'X-Connection-Key': key})


assert client.get('/health').json() == {'ok': True}
assert push([{'k': 'a', 'a': 1}], key='sp_' + 'b' * 64).status_code == 401
r = push([{'k': 'a', 'a': 1}], key=KEY2)
assert r.status_code == 200 and r.json() == {'ok': True, 'stored': False}
assert store.load(main.db, ACCOUNT2, GAME) is None  # nothing is kept for an account that is not connected
r = push([{'k': 'a', 'a': 1}, {'k': 'b', 'a': 5}]).json()
assert r['baseline'] and r['added'] == 0, r  # first save is a baseline, not 2 "gains"
r = push([{'k': 'a', 'a': 1}, {'k': 'b', 'a': 5}]).json()
assert (r['added'], r['changed'], r['removed']) == (0, 0, 0), r  # nothing new: nothing stored
r = push([{'k': 'a', 'a': 3}, {'k': 'c', 'a': 2}]).json()
assert (r['added'], r['changed'], r['removed']) == (1, 1, 1), r
got = client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers=site).json()
assert sorted(s['k'] for s in got['inventory']) == ['a', 'c'], got
history = client.get('/v1/changes', params={'account': ACCOUNT, 'game': GAME}, headers={'Authorization': 'Bearer bot-secret'}).json()['changes']
assert sorted((c['k'], c['kind']) for c in history) == [('a', 'change'), ('b', 'remove'), ('c', 'add')], history
assert client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}).status_code == 401
assert client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers={'Authorization': 'Bearer nope'}).status_code == 401
assert client.get('/v1/inventory', params={'account': 'x', 'game': GAME}, headers=site).status_code == 400
assert push([{'k': 'a'}]).status_code == 400
other = '99999999-2222-3333-4444-555555555555'
assert store.save(main.db, other, GAME, [{'k': 'z', 'a': 9}], 1700000000)['baseline']
assert client.get('/v1/inventory', params={'account': other, 'game': GAME}, headers=site).json()['updated'] == 1700000000
assert client.post('/v1/import', json={'account': other, 'game': GAME, 'updated': 1, 'inventory': []}, headers=site).status_code in (404, 405)  # the one-time import is gone
# Pets of the same type are different stacks; identical ones are kept too; market numbers move without counting as changes
pets = [{'k': 'pet:Centaur', 'a': 1, 'm': ['Nitro'], 'w': 5.5, 'p': 10}, {'k': 'pet:Centaur', 'a': 1, 'm': ['Scrambled'], 'w': 3.1}, {'k': 'pet:Cat', 'a': 1}, {'k': 'pet:Cat', 'a': 1}]
twin = '77777777-2222-3333-4444-555555555555'
assert store.save(main.db, twin, GAME, pets)['baseline']
assert len(store.load(main.db, twin, GAME)['inventory']) == 4
repriced = [dict(pets[0], p=99), *pets[1:]]
assert store.save(main.db, twin, GAME, repriced) == {'added': 0, 'changed': 0, 'removed': 0, 'baseline': False}
assert any(s.get('p') == 99 for s in store.load(main.db, twin, GAME)['inventory'])
assert store.save(main.db, twin, GAME, repriced[:3])['removed'] == 1
# Amounts beyond SQLite's integer range must not crash the history
big = '88888888-2222-3333-4444-555555555555'
assert store.save(main.db, big, GAME, [{'k': 'money', 'a': 5}])['baseline']
assert store.save(main.db, big, GAME, [{'k': 'money', 'a': 10 ** 30}])['changed'] == 1
assert store.save(main.db, big, GAME, [{'k': 'money', 'a': 10 ** 31}])['changed'] == 1
assert store.save(main.db, big, GAME, [])['removed'] == 1
# Reads and writes from many threads at once share one connection
from concurrent.futures import ThreadPoolExecutor  # noqa: E402
with ThreadPoolExecutor(16) as pool:
    jobs = [pool.submit(store.save, main.db, big, GAME, [{'k': f'i{n}', 'a': n}]) if n % 2 else pool.submit(store.load, main.db, big, GAME) for n in range(400)]
    [j.result() for j in jobs]
# Daily jobs: accounts Supabase no longer has are removed; no database copies are created.
import asyncio  # noqa: E402
keepers = {ACCOUNT, other}
async def fake_existing(ids):
    return {i for i in ids if i in keepers}
main.existing = fake_existing
old_key = 'cccccccc-2222-3333-4444-555555555555'
keepers.add(old_key)
async def fake_superseded(ids):
    return {i for i in ids if i == old_key}
main.superseded = fake_superseded
store.save(main.db, old_key, GAME, [{'k': 'old', 'a': 1}])
store.save(main.db, 'aaaaaaaa-2222-3333-4444-555555555555', GAME, [{'k': 'x', 'a': 1}])
expected = len(set(store.accounts(main.db)) - keepers) + 1  # accounts Supabase lost, plus the old key
assert expected >= 3 and asyncio.run(main.reconcile()) == expected
assert store.load(main.db, other, GAME) is not None and store.load(main.db, 'aaaaaaaa-2222-3333-4444-555555555555', GAME) is None
assert store.load(main.db, old_key, GAME) is None  # an old key replaced by a newer one is dropped, even though Supabase still has it
async def failing(ids):
    return None
main.existing = failing
store.save(main.db, 'bbbbbbbb-2222-3333-4444-555555555555', GAME, [{'k': 'x', 'a': 1}])
assert asyncio.run(main.reconcile()) == 0 and store.load(main.db, 'bbbbbbbb-2222-3333-4444-555555555555', GAME) is not None  # an outage never deletes
main.existing = fake_existing
store.save(main.db, old_key, GAME, [{'k': 'old', 'a': 1}])
main.superseded = failing
assert asyncio.run(main.reconcile()) == 0 and store.load(main.db, old_key, GAME) is not None  # no answer about old keys: nothing removed
main.superseded = fake_superseded
st = client.get('/v1/stats', headers=site).json()
assert st['accounts'] >= 1 and GAME in st['games'] and st['games'][GAME]['stacks'] >= 1 and st['bytes'] > 0
assert client.get('/v1/stats').status_code == 401
assert client.delete(f'/v1/account/{ACCOUNT}', headers=site).json() == {'ok': True}
assert client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers=site).json()['inventory'] is None
# Duplicate uploads are idempotent during the limit; changed uploads keep a per-account/game limit.
main.MIN_PUSH_SECONDS = 10
main.last_push.clear()
assert push([{'k': 'rate-test', 'a': 1}]).status_code == 200
before = store.load(main.db, ACCOUNT, GAME)
assert push([{'k': 'rate-test', 'a': 1}]).json() == {'ok': True, 'unchanged': True}
assert store.load(main.db, ACCOUNT, GAME) == before
assert store.history(main.db, ACCOUNT, GAME, 0, 100) == []
limited = push([{'k': 'rate-test', 'a': 2}])
assert limited.status_code == 429 and 1 <= int(limited.headers['Retry-After']) <= 10
main.last_push[(ACCOUNT, GAME)] -= 11
assert push([{'k': 'rate-test', 'a': 2}]).status_code == 200
assert store.history(main.db, ACCOUNT, GAME, 0, 100)[0]['kind'] == 'change'
# Startup plus the next daily run keep cleanup, but never make a backups folder.
async def no_backup_jobs():
    original_sleep = main.asyncio.sleep
    ticks = 0
    async def advance(seconds):
        nonlocal ticks
        assert seconds == 3600
        ticks += 1
        if ticks == 25:
            raise asyncio.CancelledError
    main.asyncio.sleep = advance
    try:
        await main.sweeper()
    except asyncio.CancelledError:
        pass
    finally:
        main.asyncio.sleep = original_sleep
    assert ticks == 25
asyncio.run(no_backup_jobs())
assert not hasattr(store, 'backup')
assert not os.path.exists(os.path.join(os.path.dirname(main.DB_PATH), 'backups'))
assert os.path.isfile(main.DB_PATH)
print('all checks passed')

# Seven-day activity cleanup must leave the current inventory intact, including old inactive accounts.
import time  # noqa: E402
cutoff = int(time.time()) - 7 * 86400
store.save(main.db, other, GAME, [{'k': 'retained', 'a': 1}], at=cutoff-100)
store.save(main.db, other, GAME, [{'k': 'retained', 'a': 2}], at=cutoff-2)
store.save(main.db, other, GAME, [{'k': 'retained', 'a': 3}], at=cutoff+10)
before = store.load(main.db, other, GAME)
assert main.RETENTION_DAYS == 7
store.prune(main.db, main.RETENTION_DAYS)
assert store.load(main.db, other, GAME) == before
assert all(row['at'] >= cutoff for row in store.history(main.db, other, GAME, 0, 100))
store.save(main.db, other, GAME, [{'k': 'retained', 'a': 4}, {'k': 'new', 'a': 1}])
assert len(store.load(main.db, other, GAME)['inventory']) == 2
# Remove legacy backups at actual application startup, never the adjacent live database.
backup_dir = os.path.join(os.path.dirname(main.DB_PATH), 'backups')
os.makedirs(backup_dir)
with open(os.path.join(backup_dir, 'old.db'), 'wb') as f:
    f.write(b'legacy backup')
before = store.load(main.db, other, GAME)
with TestClient(main.app):
    assert not os.path.exists(backup_dir)
    assert store.load(main.db, other, GAME) == before
assert os.path.isfile(main.DB_PATH)
print('PASS seven-day retention, retained inventory, new items, removed legacy backups, no new backups')
