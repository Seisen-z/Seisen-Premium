import asyncio
import hashlib
import hmac
import math
import os
import re
import shutil
import time
from collections import deque
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv
from pydantic import BaseModel, Field

import store
import thumbnails

load_dotenv()
SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SITE_TOKEN = os.environ.get('SITE_TOKEN', '')
BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
DB_PATH = os.environ.get('DB_PATH', 'data/trackstat.db')
RETENTION_DAYS = 7
MAX_BODY = 1_000_000
MIN_PUSH_SECONDS = 10
UUID = re.compile(r'^[0-9a-f-]{36}$')

os.makedirs(os.path.dirname(DB_PATH) or '.', exist_ok=True)
db = store.connect(DB_PATH)
http = httpx.AsyncClient(timeout=10)
keys: dict[str, tuple[str | None, bool, float]] = {}  # hash of connection key -> (account id, connected on the website, expiry)
last_push: dict[tuple[str, str], float] = {}
stats_cache: tuple[float, dict] = (0, {})
KEY = re.compile(r'sp_[0-9a-f]{64}')
LOOKUPS_PER_CLIENT, LOOKUPS_TOTAL = 60, 600  # Supabase key checks allowed per minute
lookups: dict[str, deque] = {}
all_lookups: deque = deque()


async def existing(ids: list[str]) -> set[str] | None:
    """Which of these accounts Supabase still has, or None if it could not answer."""
    response = await http.post(
        f'{SUPABASE_URL}/rest/v1/rpc/trackstat_existing_accounts',
        json={'p_ids': ids},
        headers={'apikey': SUPABASE_ANON_KEY, 'Authorization': f'Bearer {SUPABASE_ANON_KEY}'},
    )
    found = response.json() if response.status_code == 200 else None
    return set(found) if isinstance(found, list) else None


async def superseded(ids: list[str]) -> set[str] | None:
    """Which of these accounts are an old key of a Roblox account that has a newer key, or None if it could not answer."""
    response = await http.post(
        f'{SUPABASE_URL}/rest/v1/rpc/trackstat_superseded_accounts',
        json={'p_ids': ids},
        headers={'apikey': SUPABASE_ANON_KEY, 'Authorization': f'Bearer {SUPABASE_ANON_KEY}'},
    )
    found = response.json() if response.status_code == 200 else None
    return set(found) if isinstance(found, list) else None


async def reconcile() -> int:
    """Removes inventories of accounts Supabase no longer has (key reset, cleanup of inactive accounts)
    and of old keys that a newer key for the same Roblox account has replaced."""
    mine = store.accounts(db)
    gone: list[str] = []
    for start in range(0, len(mine), 200):
        batch = mine[start:start + 200]
        alive = await existing(batch)
        if alive is None:
            return 0
        gone += [a for a in batch if a not in alive]
        old = await superseded([a for a in batch if a in alive])
        if old is None:
            return 0  # without the answer, nothing is removed
        gone += list(old)
    if len(mine) > 20 and len(gone) > len(mine) / 2:
        print(f'reconcile skipped: {len(gone)} of {len(mine)} accounts look gone')
        return 0
    for account in gone:
        store.forget(db, account)
    return len(gone)


async def sweeper():
    tick = 0
    while True:
        # One failing step must never end this loop, or cleanup would silently stop for good
        try:
            await asyncio.to_thread(store.prune, db, RETENTION_DAYS)
            # Hourly, so a key reset removes the inventory here within the hour, as the library promises
            removed = await reconcile()
            if removed:
                print('removed accounts:', removed)
            if tick % 24 == 0:
                await asyncio.to_thread(store.compact, db, DB_PATH)
        except Exception as error:
            print('hourly job failed:', error)
        tick += 1
        now = time.time()
        for digest in [d for d, v in keys.items() if v[2] < now]:
            keys.pop(digest, None)
        for pair in [p for p, at in last_push.items() if at < now - 3600]:
            last_push.pop(pair, None)
        for client in [c for c, window in lookups.items() if not window or window[-1] < now - 60]:
            lookups.pop(client, None)
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(_: FastAPI):
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(DB_PATH)), 'backups')
    if os.path.isdir(backup_dir) and not os.path.islink(backup_dir):
        await asyncio.to_thread(shutil.rmtree, backup_dir)
    task = asyncio.create_task(sweeper())
    images = asyncio.create_task(thumbnails.run(db, http, SUPABASE_URL, SUPABASE_ANON_KEY))
    try:
        yield
    finally:
        task.cancel()
        images.cancel()
        await asyncio.gather(task, images, return_exceptions=True)
        await http.aclose()


app = FastAPI(title='Trackstat server', lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


class BodyLimit:
    """Refuses bodies over MAX_BODY whether or not the client announced a size; a chunked body has no Content-Length."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        announced = next((value for name, value in scope['headers'] if name == b'content-length'), b'0')
        if announced.isdigit() and int(announced) > MAX_BODY:
            return await JSONResponse({'detail': 'Too large'}, status_code=413)(scope, receive, send)
        received = 0

        async def limited():
            nonlocal received
            message = await receive()
            if message['type'] == 'http.request':
                received += len(message.get('body', b''))
                if received > MAX_BODY:
                    raise HTTPException(413, 'Too large')
            return message

        await self.app(scope, limited, send)


app.add_middleware(BodyLimit)


def same(token: str, secret: str) -> bool:
    return bool(secret) and hmac.compare_digest(token.encode(), secret.encode())  # bytes, so any character in the header is safe


def reader(authorization: str = Header('')):
    token = authorization.removeprefix('Bearer ')
    if not token or not (same(token, SITE_TOKEN) or same(token, BOT_TOKEN)):
        raise HTTPException(401, 'Unauthorized')


def client_of(request: Request) -> str:
    forwarded = request.headers.get('x-forwarded-for', '').split(',')[0].strip()
    return request.headers.get('cf-connecting-ip') or forwarded or (request.client.host if request.client else '')


def needs_lookup(key: str) -> bool:
    """True when answering this key would cost a Supabase request, which only a real, unseen key does."""
    if not KEY.fullmatch(key):
        return False
    hit = keys.get(hashlib.sha256(key.encode()).hexdigest())
    return hit is None or hit[2] < time.time()


def allow_lookup(client: str) -> bool:
    """Caps Supabase key checks per caller and overall, so random keys sent by strangers cannot burn the quota."""
    now = time.time()
    mine = lookups.setdefault(client, deque())
    for window in (mine, all_lookups):
        while window and window[0] < now - 60:
            window.popleft()
    if len(mine) >= LOOKUPS_PER_CLIENT or len(all_lookups) >= LOOKUPS_TOTAL:
        return False
    mine.append(now)
    all_lookups.append(now)
    return True


def valid_inventory(stacks: list[dict]) -> bool:
    for s in stacks:
        amount = s.get('a')
        if not isinstance(s.get('k'), str) or isinstance(amount, bool) or not isinstance(amount, (int, float)):
            return False
        if any(isinstance(v, float) and not math.isfinite(v) for v in s.values()):
            return False
        try:
            float(amount)
        except OverflowError:
            return False
    return True


async def account_of(key: str) -> tuple[str, bool]:
    """Supabase owns the connection keys; a key is checked there once and remembered for a few minutes.
    The second value says whether the account is connected on the website, which is what decides if its data is stored."""
    if not re.fullmatch(r'sp_[0-9a-f]{64}', key):
        raise HTTPException(401, 'Invalid connection key')
    digest = hashlib.sha256(key.encode()).hexdigest()
    hit = keys.get(digest)
    if hit is None or hit[2] < time.time():
        response = await http.post(
            f'{SUPABASE_URL}/rest/v1/rpc/trackstat_key_status',
            json={'p_key': key},
            headers={'apikey': SUPABASE_ANON_KEY, 'Authorization': f'Bearer {SUPABASE_ANON_KEY}'},
        )
        status = response.json() if response.status_code == 200 else None
        account = status.get('account') if isinstance(status, dict) else None
        valid = isinstance(account, str) and bool(UUID.match(account))
        connected = valid and status.get('connected') is True
        # A key that is not connected yet is asked again after a minute, so storing starts soon after it is used on the website
        hit = (account if valid else None, connected, time.time() + (600 if connected else 60))
        keys[digest] = hit
    if hit[0] is None:
        raise HTTPException(401, 'Invalid connection key')
    return hit[0], hit[1]


class Push(BaseModel):
    game: str
    inventory: list[dict] = Field(max_length=store.MAX_STACKS)


@app.get('/health')
def health():
    return {'ok': True}


@app.post('/v1/inventory')
async def push(body: Push, request: Request, x_connection_key: str = Header('')):
    if needs_lookup(x_connection_key) and not allow_lookup(client_of(request)):
        raise HTTPException(429, 'Slow down', headers={'Retry-After': '30'})
    account, connected = await account_of(x_connection_key)
    if not connected:
        return {'ok': True, 'stored': False}
    if body.game not in store.GAMES or not valid_inventory(body.inventory):
        raise HTTPException(400, 'Invalid inventory')
    now = time.time()
    retry = MIN_PUSH_SECONDS - (now - last_push.get((account, body.game), 0))
    # The database calls wait on a lock, so they run off the event loop and never freeze other requests
    if retry > 0:
        if await asyncio.to_thread(store.matches, db, account, body.game, body.inventory):
            return {'ok': True, 'unchanged': True}
        raise HTTPException(429, 'Slow down', headers={'Retry-After': str(math.ceil(retry))})
    last_push[(account, body.game)] = now
    return {'ok': True, **await asyncio.to_thread(store.save, db, account, body.game, body.inventory)}


def site_only(authorization: str = Header('')):
    if not same(authorization.removeprefix('Bearer '), SITE_TOKEN):
        raise HTTPException(401, 'Unauthorized')


def checked(account: str, game: str):
    if not UUID.match(account) or game not in store.GAMES:
        raise HTTPException(400, 'Invalid request')


@app.get('/v1/inventory', dependencies=[Depends(reader)])
def inventory(account: str, game: str, if_none_match: str = Header('')):
    checked(account, game)
    found = store.load(db, account, game, if_none_match)
    if not found:
        return JSONResponse({'updated': None, 'inventory': None}, headers={'Cache-Control': 'private, no-cache'})
    etag = found.pop('etag')
    headers = {'ETag': etag, 'Cache-Control': 'private, no-cache'}
    return Response(status_code=304, headers=headers) if found.get('not_modified') else JSONResponse(found, headers=headers)


@app.get('/v1/stats', dependencies=[Depends(reader)])
def stats():
    global stats_cache
    if not stats_cache[1] or time.monotonic() - stats_cache[0] >= 30:
        stats_cache = (time.monotonic(), store.stats(db, DB_PATH))
    return stats_cache[1]


class ThumbnailBatch(BaseModel):
    game: str
    icons: list[str] = Field(max_length=2000)


@app.post('/v1/thumbnails', dependencies=[Depends(site_only)])
def queue_thumbnails(body: ThumbnailBatch):
    if body.game not in thumbnails.FOLDERS or any(not re.fullmatch(r'[1-9][0-9]{0,19}', icon) for icon in body.icons):
        raise HTTPException(400, 'Invalid thumbnail')
    store.enqueue_thumbnails(db, body.game, body.icons)
    return {'ok': True}


@app.get('/v1/thumbnail', dependencies=[Depends(reader)])
async def thumbnail(game: str, icon: str):
    if game not in thumbnails.FOLDERS or not re.fullmatch(r'[1-9][0-9]{0,19}', icon):
        raise HTTPException(400, 'Invalid thumbnail')
    if await asyncio.to_thread(store.thumbnail_pending, db, game, icon):
        return Response(status_code=202, headers={'Retry-After': '3', 'Cache-Control': 'no-store'})
    response = await http.get(f'{SUPABASE_URL}/storage/v1/object/public/trackstats-images/{game}/{icon}.png')
    if not response.is_success or not response.content.startswith(thumbnails.PNG) or len(response.content) > 1024 * 1024:
        raise HTTPException(404, 'Thumbnail unavailable')
    return Response(response.content, media_type='image/png', headers={'Cache-Control': 'public, max-age=31536000, immutable'})


@app.get('/v1/changes', dependencies=[Depends(reader)])
def changes(account: str, game: str, since: int = 0, limit: int = 100):
    checked(account, game)
    return {'changes': store.history(db, account, game, since, min(max(limit, 1), 500))}


@app.delete('/v1/account/{account}', dependencies=[Depends(site_only)])
def forget(account: str):
    if not UUID.match(account):
        raise HTTPException(400, 'Invalid request')
    store.forget(db, account)
    return {'ok': True}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', '8080')))
