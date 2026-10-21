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
- `POST /v1/import` - website token only. Copies an inventory that already exists elsewhere, keeping its saved time (used once to move inventories over from Supabase).
- `GET /v1/stats` - same auth. Totals per game, change-history size and file size (admin page).
- `GET /health`.

## Daily jobs (start-up, then every 24 h)
- Reconcile: asks Supabase `trackstat_existing_accounts` which accounts still exist and deletes the rest here (covers key reset and inactive-account cleanup). Never deletes if Supabase cannot answer or if over half of the accounts look gone.
- Automatic database backups are disabled. Cleanup still runs; the service does not create or delete a backups folder.

## Rules
- The library never gets `SITE_TOKEN` or `BOT_TOKEN`. The bot only reads.
- Inventory stack shape is `InventoryStack` in `lib/trackstat.ts`; `k` identifies a stack and `a` is the amount. Do not invent other fields.
- Games: PS99 `3317771874`, Steal an Egg `10563114921`, Anime Dice `10708913337`.
- Do not store anything that identifies a login (email, key). Only the account UUID.

## Status
Built and tested locally. Not deployed. Deployed at https://seisentrack.wisp.uno. Inventories were copied from Supabase, the library sends changed inventories here, and the website reads from here (Supabase copy is the fallback). Still to do: stop saving inventories in Supabase and remove the old copies (ask the user first).
