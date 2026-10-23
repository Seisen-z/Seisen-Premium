"""Checks for the review fixes: run `python test_hardening.py`. Temporary database, fake Supabase answers, nothing leaves this machine."""
import asyncio
import os
import tempfile

os.environ.update(DB_PATH=os.path.join(tempfile.mkdtemp(), 't.db'), SITE_TOKEN='site-secret', BOT_TOKEN='bot-secret', SUPABASE_URL='http://127.0.0.1:9', SUPABASE_ANON_KEY='x')

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
import store  # noqa: E402

ACCOUNT, GAME = '11111111-2222-3333-4444-555555555555', '3317771874'
calls = {'n': 0}


class Answer:
    status_code = 200

    def json(self):
        return {'account': ACCOUNT, 'connected': True}


async def fake_post(url, **kwargs):
    calls['n'] += 1
    return Answer()


main.http.post = fake_post
main.MIN_PUSH_SECONDS = 0
client = TestClient(main.app, raise_server_exceptions=False)
site, bot = {'Authorization': 'Bearer site-secret'}, {'Authorization': 'Bearer bot-secret'}


def key(i: int) -> str:
    return 'sp_' + format(i, '064x')


def push(inventory, k=None, headers=None):
    return client.post('/v1/inventory', json={'game': GAME, 'inventory': inventory}, headers={'X-Connection-Key': k or key(1), **(headers or {})})


def reset():
    main.keys.clear()
    main.lookups.clear()
    main.all_lookups.clear()
    calls['n'] = 0


# The bot token only reads: it cannot delete an account, the website token can
store.save(main.db, ACCOUNT, GAME, [{'k': 'a', 'a': 1}])
assert client.delete(f'/v1/account/{ACCOUNT}', headers=bot).status_code == 401
assert store.load(main.db, ACCOUNT, GAME) is not None
assert client.get('/v1/stats', headers=bot).status_code == 200
assert client.delete(f'/v1/account/{ACCOUNT}', headers=site).status_code == 200
assert store.load(main.db, ACCOUNT, GAME) is None

# A token with a character outside ASCII is refused, not a server error
assert client.get('/v1/stats', headers={'Authorization': 'Bearer café'.encode('latin-1')}).status_code == 401
assert client.delete(f'/v1/account/{ACCOUNT}', headers={'Authorization': 'Bearer café'.encode('latin-1')}).status_code == 401

# Bodies over 1 MB are refused, with or without a Content-Length
def chunks():
    yield b'{"game":"x' + b'x' * 65536
    for _ in range(80):
        yield b'y' * 65536
    yield b'"}'


r = client.post('/v1/inventory', content=chunks(), headers={'X-Connection-Key': key(1), 'Content-Type': 'application/json'})
assert r.status_code == 413, r.status_code
r = client.post('/v1/inventory', content=b'x' * (main.MAX_BODY + 10), headers={'X-Connection-Key': key(1), 'Content-Type': 'application/json'})
assert r.status_code == 413, r.status_code
assert push([{'k': 'a', 'a': 1}]).status_code == 200  # a normal push still works

# Strangers cannot make the server ask Supabase without limit
reset()
statuses = [push([], k=key(1000 + i), headers={'cf-connecting-ip': '9.9.9.9'}).status_code for i in range(70)]
assert calls['n'] == main.LOOKUPS_PER_CLIENT and statuses.count(429) == 70 - main.LOOKUPS_PER_CLIENT, (calls, statuses.count(429))
assert push([], k=key(5000), headers={'cf-connecting-ip': '8.8.8.8'}).status_code == 200  # another caller has its own budget
before = calls['n']
for _ in range(30):
    assert push([{'k': 'a', 'a': 1}], k=key(5000), headers={'cf-connecting-ip': '8.8.8.8'}).status_code == 200
assert calls['n'] == before  # a key that is already known costs no Supabase request
reset()
main.LOOKUPS_TOTAL = 5
codes = [push([], k=key(2000 + i), headers={'cf-connecting-ip': f'7.7.7.{i}'}).status_code for i in range(12)]
assert calls['n'] == 5 and codes.count(429) == 7, (calls, codes)
main.LOOKUPS_TOTAL = 600
assert client.post('/v1/inventory', json={'game': GAME, 'inventory': []}, headers={'X-Connection-Key': 'not-a-key'}).status_code == 401
assert calls['n'] == 5  # a malformed key never reaches Supabase

# Amounts that cannot be stored are refused; very large game numbers are still fine
reset()
body = '{"game":"%s","inventory":[{"k":"a","a":%s}]}'
send = lambda amount: client.post('/v1/inventory', content=body % (GAME, amount), headers={'X-Connection-Key': key(1), 'Content-Type': 'application/json'}).status_code
assert send('1e999') == 400
assert send('9' * 400) == 400
assert send('true') == 400
assert send(10 ** 30) == 200
assert send('5.5e20') == 200
assert client.post('/v1/import', json={'account': ACCOUNT, 'game': GAME, 'updated': 1, 'inventory': []}, headers=site).status_code in (404, 405)  # no way to write an inventory except with a connection key

# One failing step does not end the hourly job
async def run_sweeper():
    original_prune, original_sleep = main.store.prune, main.asyncio.sleep
    seen = {'sleeps': 0}

    def broken(*args):
        raise RuntimeError('boom')

    async def one_loop(_seconds):
        seen['sleeps'] += 1
        raise asyncio.CancelledError

    main.store.prune, main.asyncio.sleep = broken, one_loop
    try:
        await main.sweeper()
    except asyncio.CancelledError:
        pass
    finally:
        main.store.prune, main.asyncio.sleep = original_prune, original_sleep
    return seen['sleeps']


assert asyncio.run(run_sweeper()) == 1  # the loop reached its sleep after the failure instead of dying
# A picture Roblox never has stops being retried; an early failure is retried later with a growing wait
import thumbnails  # noqa: E402
import time  # noqa: E402
store.enqueue_thumbnails(main.db, 'stealanegg', ['123456'])
store.claim_thumbnails(main.db, time.time())
thumbnails.retry(main.db, 'stealanegg', '123456', 2)
due = main.db.execute("select due from thumbnail_jobs where icon='123456'").fetchone()[0]
assert 200 < due - time.time() <= 260, due - time.time()  # 60 * 2**2 seconds
thumbnails.retry(main.db, 'stealanegg', '123456', thumbnails.MAX_ATTEMPTS)
assert main.db.execute("select count(*) from thumbnail_jobs where icon='123456'").fetchone()[0] == 0
print('all hardening checks passed')
