# Trackstat server - notes for AI coding assistants

The root `AGENTS.md` rules of the Seisen Hub repository still apply (listen to the user, smallest correct change, no AI attribution in commits). This file only describes this folder.

## What this is
A small standalone Python service (FastAPI + SQLite) that stores Trackstat **inventories** off Supabase, on its own Wispbyte server (Tier 1: 0.5 GB RAM, 1 vCore, 8 GB NVMe). It is separate from the Discord bot server.

Supabase keeps: logins, accounts, connection keys, sessions, gains, samples, live status.
This server keeps: each account's inventory per game, plus a history of only what changed.

## Files
- `main.py` - HTTP API, key check, auth, rate limit.
- `store.py` - SQLite storage. `save()` writes only items that are new or changed and logs each difference once. The first save for an account and game is a baseline (no change rows).
- `test_server.py` - local checks, run `python test_server.py`. Fake key check, temporary database.
- `.env.example` - settings. Real values go in the panel or a local `.env`, never in the repo or in chat.

## Endpoints
- `POST /v1/inventory` - the library. Header `X-Connection-Key`. Body `{game, inventory:[{k, a, ...}]}`. Key is checked against Supabase `trackstat_key_account` and cached 10 min (60 s if invalid).
- `GET /v1/inventory?account&game` - website and bot. `Authorization: Bearer SITE_TOKEN` or `BOT_TOKEN`.
- `GET /v1/changes?account&game&since&limit` - same auth.
- `DELETE /v1/account/{account}` - same auth. Must run when a key reset deletes an account's data on the website.
- `GET /v1/stats` - same auth. Totals per game, change-history size and file size (admin page).
- `GET /health`.
- `POST /v1/thumbnails` - website token only; `{game: folder, icons: [...]}` queues confirmed storage misses.
- `GET /v1/thumbnail?game&icon` - reader token; returns stored PNG or 202/Retry-After: 3 while queued, never fetches Roblox itself.
- Inventory GET supports ETag/If-None-Match; unchanged responses are empty 304s. Versions change on real changes, including same-second changes.

## Shared thumbnail worker
- Upload `thumbnails.py` alongside `main.py` and `store.py`. A lifecycle-managed task checks shared storage before Roblox, deduplicates jobs in SQLite, and persists every successful PNG to existing shared object storage.
- The SQLite ledger enforces a shared rolling maximum of 20 uncached PNG downloads per 3 seconds; the worker uses at most four concurrent downloads.
- Storage lookup failures never count as missing. Failed jobs back off; leases survive restarts. Pending work expires after 7 days and is capped at 10,000 game/icon pairs.
- No local PNG copies or backup directories are created. Private model icons beginning with zero remain library-captured.

## Maintenance (hourly cleanup; daily reconciliation/compaction checks)
- Reconcile: asks Supabase `trackstat_existing_accounts` which accounts still exist and deletes the rest here (covers key reset and inactive-account cleanup). Also drops old keys replaced by a newer key, and accounts not connected on the website while `only_connected` is on. Never deletes if Supabase cannot answer or if over half of the accounts look gone.
- Automatic database backups are disabled. Changes older than 7 days are pruned hourly; current inventory never expires. Startup deletes only the old backups directory beside DB_PATH; no new backups are created.
- Admin statistics are cached for 30 seconds. Timestamp cleanup uses `changes_by_time`.
- Compaction runs only if at least 16 MiB and 25 percent of pages are free and temporary disk headroom is sufficient. It reuses the daily job and creates no persistent backup file.

## Rules
- The library never gets `SITE_TOKEN` or `BOT_TOKEN`. The bot only reads.
- Inventory stack shape is `InventoryStack` in `lib/trackstat.ts`; `k` identifies a stack and `a` is the amount. Do not invent other fields.
- Games: PS99 `3317771874`, Tap Simulator `10629695169`, Anime Dice `10708913337`.
- Do not store anything that identifies a login (email, key). Only the account UUID.

## Status
Deployed at https://seisentrack.wisp.uno. Inventories were copied from Supabase, the library sends changed inventories here, and the website reads from here (Supabase copy is the fallback). Still to do: stop saving inventories in Supabase and remove the old copies (ask the user first).

## Protections (do not remove)
- Only `SITE_TOKEN` can write or delete (`/v1/thumbnails`, `DELETE /v1/account`); `BOT_TOKEN` is read-only.
- A key the server has not seen costs one Supabase request, capped at 60 per minute per caller and 600 overall; known keys cost none. Over the cap answers 429, which the library already backs off from.
- Request bodies over 1 MB are refused even when sent in chunks. Amounts must be finite numbers.
- The hourly job survives a failing step. There are no automatic database backups on purpose (they filled the disk); download one from the Wispbyte panel when needed.
