import asyncio
import re
import time

import store

FOLDERS = {'petsimulator99', 'stealanegg', 'animedice'}
PNG = b'\x89PNG\r\n\x1a\n'
MAX_ATTEMPTS = 8


def retry(db, game: str, icon: str, attempt: int) -> None:
    """Waits longer after each failure and gives up after MAX_ATTEMPTS; the job is queued again whenever an inventory needs the picture."""
    if attempt >= MAX_ATTEMPTS:
        store.finish_thumbnail(db, game, icon)
    else:
        store.finish_thumbnail(db, game, icon, time.time() + min(60 * 2 ** min(attempt, 6), 3600))


async def process(db, http, url: str, key: str) -> None:
    jobs = store.claim_thumbnails(db, time.time())
    semaphore = asyncio.Semaphore(4)
    headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

    async def download(game, icon, attempt, source):
        async with semaphore:
            try:
                if not re.fullmatch(r'https://[a-z0-9-]+\.rbxcdn\.com/[^\s]+', source, re.I):
                    raise ValueError('Invalid image source')
                while True:
                    delay = store.thumbnail_slot(db, time.time())
                    if not delay:
                        break
                    await asyncio.sleep(delay)
                response = await http.get(source)
                data = response.content
                if not response.is_success or not data.startswith(PNG) or len(data) > 1024 * 1024:
                    raise ValueError('Invalid PNG')
                saved = await http.post(f'{url}/storage/v1/object/trackstats-images/{game}/{icon}.png', content=data, headers={**headers, 'Content-Type': 'image/png'})
                if not saved.is_success and saved.status_code != 409:
                    raise ValueError('Image storage failed')
                store.finish_thumbnail(db, game, icon)
            except Exception:
                retry(db, game, icon, attempt)

    for game in {job[0] for job in jobs}:
        batch = [job for job in jobs if job[0] == game]
        try:
            manifest = await http.post(f'{url}/rest/v1/rpc/trackstat_image_manifest', json={'p_game': game, 'p_icons': [job[1] for job in batch]}, headers=headers)
            manifest.raise_for_status()
            cached = manifest.json()
            if not isinstance(cached, list) or any(not isinstance(icon, str) for icon in cached):
                raise ValueError('Invalid storage manifest')
            cached = set(cached)
            missing = []
            for job in batch:
                if job[1] in cached:
                    store.finish_thumbnail(db, game, job[1])
                else:
                    missing.append(job)
            if not missing:
                continue
            response = await http.get('https://thumbnails.roblox.com/v1/assets', params={'assetIds': ','.join(job[1] for job in missing), 'size': '150x150', 'format': 'Png', 'returnPolicy': 'PlaceHolder'})
            response.raise_for_status()
            images = {str(item['targetId']): item['imageUrl'] for item in response.json().get('data', []) if item.get('state') == 'Completed' and item.get('imageUrl') and '/PrivateImage/' not in item['imageUrl']}
            tasks = []
            for folder, icon, attempt in missing:
                if icon in images:
                    tasks.append(download(folder, icon, attempt, images[icon]))
                else:
                    retry(db, folder, icon, attempt)
            await asyncio.gather(*tasks)
        except Exception:
            # An unavailable storage manifest is not proof that an image is missing.
            for folder, icon, attempt in batch:
                retry(db, folder, icon, attempt)


async def run(db, http, url: str, key: str) -> None:
    while True:
        started = time.monotonic()
        try:
            await process(db, http, url, key)
        except Exception:
            pass
        await asyncio.sleep(max(0.05, 3 - (time.monotonic() - started)))
