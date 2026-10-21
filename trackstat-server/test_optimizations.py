"""Offline optimization checks; all databases and HTTP responses are fixtures."""
import asyncio
import os
import sqlite3
import tempfile
import time
from pathlib import Path
from types import SimpleNamespace

import httpx
from fastapi.testclient import TestClient

temp = tempfile.TemporaryDirectory()
os.environ.update(DB_PATH=str(Path(temp.name) / 'live.db'), SITE_TOKEN='site-secret', BOT_TOKEN='bot-secret')
import main  # noqa: E402
import store  # noqa: E402

ACCOUNT, GAME = '11111111-2222-3333-4444-555555555555', '3317771874'
site = {'Authorization': 'Bearer site-secret'}
client = TestClient(main.app)
store.save(main.db, ACCOUNT, GAME, [{'k': 'pet', 'a': 1}], at=123)
first = client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers=site)
if not hasattr(store, 'thumbnail_slot'):
    assert not first.headers.get('ETag')
    assert client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers=site).status_code == 200
    print('BASELINE cleanup plan:', main.db.execute('explain query plan delete from changes where at<?', (0,)).fetchall()[0][3])
    print('BASELINE: unchanged inventories are serialized again; no global thumbnail queue or cleanup timestamp index')
    main.db.close()
    temp.cleanup()
    raise SystemExit(0)

tag = first.headers['ETag']
not_changed = client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers={**site, 'If-None-Match': tag})
assert not_changed.status_code == 304 and not not_changed.content
store.save(main.db, ACCOUNT, GAME, [{'k': 'pet', 'a': 2}], at=123)
changed = client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers={**site, 'If-None-Match': tag})
assert changed.status_code == 200 and changed.headers['ETag'] != tag and changed.json()['inventory'][0]['a'] == 2
print('PASS empty 304 responses; real same-second inventory changes invalidate ETag')
tag = changed.headers['ETag']
store.forget(main.db, ACCOUNT)
store.save(main.db, ACCOUNT, GAME, [{'k': 'pet', 'a': 3}], at=123)
assert client.get('/v1/inventory', params={'account': ACCOUNT, 'game': GAME}, headers={**site, 'If-None-Match': tag}).status_code == 200
print('PASS deleting/reimporting an account never reuses its old inventory ETag')

calls = []
original_stats = store.stats
def counted(*args):
    calls.append(1)
    return original_stats(*args)
store.stats = counted
main.stats_cache = (0, {})
assert client.get('/v1/stats', headers=site).status_code == 200
assert client.get('/v1/stats', headers=site).status_code == 200 and len(calls) == 1
main.stats_cache = (time.monotonic()-31, main.stats_cache[1])
client.get('/v1/stats', headers=site)
assert len(calls) == 2
store.stats = original_stats
plan = main.db.execute('explain query plan delete from changes where at<?', (0,)).fetchall()
assert any('changes_by_time' in row[3] and 'SEARCH' in row[3] for row in plan)
print('PASS 30-second statistics cache and indexed timestamp cleanup:', plan[0][3])

assert client.post('/v1/thumbnails', json={'game': 'petsimulator99', 'icons': ['1']}).status_code == 401
assert client.post('/v1/thumbnails', json={'game': 'petsimulator99', 'icons': ['01']}, headers=site).status_code == 400
assert client.post('/v1/thumbnails', json={'game': 'petsimulator99', 'icons': ['1', '1']}, headers=site).status_code == 200
assert main.db.execute('select count(*) from thumbnail_jobs').fetchone()[0] == 1
assert client.get('/v1/thumbnail', params={'game': 'petsimulator99', 'icon': '1'}, headers=site).status_code == 202
main.db.execute('delete from thumbnail_jobs')
main.db.commit()
print('PASS authenticated queue, icon validation, deduplication and pending response')

import thumbnails  # noqa: E402
png = b'\x89PNG\r\n\x1a\nfixture'
remote = {'1'}
starts, lookups, uploads = [], [], []
clock = [1000.0]
active = [0, 0]
outage = [False]
async def handler(request):
    if request.url.path.endswith('trackstat_image_manifest'):
        import json
        ids = json.loads(request.content)['p_icons']
        if outage[0] == 'invalid':
            return httpx.Response(200, json={'error': 'storage unavailable'})
        return httpx.Response(503) if outage[0] else httpx.Response(200, json=[icon for icon in ids if icon in remote])
    if request.url.host == 'thumbnails.roblox.com':
        ids = request.url.params['assetIds'].split(',')
        lookups.extend(ids)
        return httpx.Response(200, json={'data': [{'targetId': int(icon), 'state': 'Completed', 'imageUrl': f'https://tr.rbxcdn.com/{icon}.png'} for icon in ids]})
    if request.url.host == 'tr.rbxcdn.com':
        starts.append(clock[0]); active[0] += 1; active[1] = max(active)
        await asyncio.sleep(0)
        active[0] -= 1
        return httpx.Response(200, content=b'not a PNG' if request.url.path == '/1000.png' else png)
    if '/storage/v1/object/' in request.url.path:
        icon = request.url.path.rsplit('/', 1)[1].removesuffix('.png')
        if icon == '1001':
            return httpx.Response(503)
        assert request.content == png
        remote.add(icon); uploads.append(icon)
        return httpx.Response(201)
    raise AssertionError(str(request.url))

async def checks():
    real_time, real_asyncio = thumbnails.time, thumbnails.asyncio
    async def advance(seconds):
        clock[0] += seconds
        await asyncio.sleep(0)
    thumbnails.time = SimpleNamespace(time=lambda: clock[0])
    thumbnails.asyncio = SimpleNamespace(Semaphore=asyncio.Semaphore, gather=asyncio.gather, sleep=advance)
    try:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
            store.enqueue_thumbnails(main.db, 'petsimulator99', [str(i) for i in range(1, 62)] * 2)
            for _ in range(4): await thumbnails.process(main.db, http, 'https://storage.fixture', 'fixture-key')
            assert len(uploads) == 60 and len(starts) == 60 and len(remote) == 61
            assert active[1] <= 4
            assert all(sum(t-3 < other <= t for other in starts) <= 20 for t in starts)
            assert main.db.execute('select count(*) from thumbnail_jobs').fetchone()[0] == 0
            count = len(lookups), len(starts)
            store.enqueue_thumbnails(main.db, 'petsimulator99', [str(i) for i in range(1, 62)])
            for _ in range(4): await thumbnails.process(main.db, http, 'https://storage.fixture', 'fixture-key')
            assert count == (len(lookups), len(starts))
            outage[0] = True
            store.enqueue_thumbnails(main.db, 'petsimulator99', ['999'])
            await thumbnails.process(main.db, http, 'https://storage.fixture', 'fixture-key')
            assert count == (len(lookups), len(starts)) and store.thumbnail_pending(main.db, 'petsimulator99', '999')
            outage[0] = 'invalid'
            store.enqueue_thumbnails(main.db, 'petsimulator99', ['998'])
            await thumbnails.process(main.db, http, 'https://storage.fixture', 'fixture-key')
            assert count == (len(lookups), len(starts))
            outage[0] = False
            store.enqueue_thumbnails(main.db, 'petsimulator99', ['1000', '1001'])
            await thumbnails.process(main.db, http, 'https://storage.fixture', 'fixture-key')
            assert '1000' not in remote and '1001' not in remote
            assert store.thumbnail_pending(main.db, 'petsimulator99', '1000') and store.thumbnail_pending(main.db, 'petsimulator99', '1001')
    finally:
        thumbnails.time, thumbnails.asyncio = real_time, real_asyncio
asyncio.run(checks())
print('PASS shared queue stores ALL 60 new PNGs; rolling 20/3s and four concurrent; stored hits/outages make ZERO Roblox requests')
print('PASS malformed storage manifests, invalid PNGs and failed uploads back off without caching bad data')

other = store.connect(main.DB_PATH)
main.db.execute('delete from thumbnail_starts'); main.db.commit()
assert all(store.thumbnail_slot(main.db, 0) == 0 for _ in range(20))
assert store.thumbnail_slot(other, 0) == 3
assert store.thumbnail_slot(other, 3) == 0
other.close()
print('PASS rate ledger persists across connections/restarts')

before = store.load(main.db, ACCOUNT, GAME)
main.db.execute('create table padding(value blob)')
main.db.executemany('insert into padding values(zeroblob(1048576))', [() for _ in range(24)])
main.db.execute('delete from padding'); main.db.commit()
size = main.db.execute('pragma page_count').fetchone()[0]
assert store.compact(main.db, main.DB_PATH)['compacted']
assert main.db.execute('pragma page_count').fetchone()[0] < size
assert store.load(main.db, ACCOUNT, GAME) == before
assert not store.compact(main.db, main.DB_PATH)['compacted']
assert not (Path(temp.name) / 'backups').exists()
print('PASS measured compaction reclaims pages, preserves inventory and creates no backup; small free space skips compaction')
legacy_path = str(Path(temp.name) / 'legacy.db')
legacy = sqlite3.connect(legacy_path)
legacy.executescript('create table stacks(account text,game text,id text,data text,primary key(account,game,id));create table meta(account text,game text,updated integer,primary key(account,game));')
legacy.execute('insert into stacks values(?,?,?,?)', (ACCOUNT, GAME, 'legacy', '{"k":"old-pet","a":7}'))
legacy.execute('insert into meta values(?,?,?)', (ACCOUNT, GAME, 123))
legacy.commit(); legacy.close()
upgraded = store.connect(legacy_path)
assert store.load(upgraded, ACCOUNT, GAME)['inventory'] == [{'k': 'old-pet', 'a': 7}]
etag = store.load(upgraded, ACCOUNT, GAME, '')['etag']
upgraded.close(); upgraded = store.connect(legacy_path)
assert store.load(upgraded, ACCOUNT, GAME, etag)['not_modified']
upgraded.close()
print('PASS existing SQLite schema upgrades without losing inventory; ETag survives restart')
main.db.close()
temp.cleanup()
