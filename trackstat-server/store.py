import hashlib
import json
import os
import sqlite3
import threading
import time

GAMES = {'3317771874', '10563114921', '10708913337'}
MAX_STACKS = 1000
# Fields that move on their own (amount, market numbers, income). They are saved but never decide which stack is which.
VOLATILE = {'a', 'x', 'r', 'p'}

_lock = threading.Lock()


def connect(path: str) -> sqlite3.Connection:
    db = sqlite3.connect(path, check_same_thread=False)
    db.execute('pragma journal_mode=wal')
    db.execute('pragma synchronous=normal')
    if db.execute("select 1 from pragma_table_info('stacks') where name='k'").fetchone():
        # First version keyed stacks by item type only, which merged different pets. It only ever held a test import.
        db.executescript('drop table stacks; drop table meta; drop table changes;')
    db.executescript('''
        create table if not exists stacks(account text not null, game text not null, id text not null, data text not null, primary key(account, game, id)) without rowid;
        create table if not exists meta(account text not null, game text not null, updated integer not null, primary key(account, game)) without rowid;
        create table if not exists changes(id integer primary key, account text not null, game text not null, k text not null, kind text not null, old_a real, new_a real, at integer not null);
        create index if not exists changes_by_account on changes(account, game, at);
    ''')
    return db


def identify(stacks: list[dict]) -> dict[str, dict]:
    """A stack is identified by everything that makes it that exact thing; identical stacks get a counter so none are merged."""
    seen: dict[str, int] = {}
    out: dict[str, dict] = {}
    for s in stacks:
        base = json.dumps({k: v for k, v in s.items() if k not in VOLATILE}, sort_keys=True, separators=(',', ':'))
        n = seen.get(base, 0)
        seen[base] = n + 1
        out[hashlib.md5(base.encode()).hexdigest() + (f'#{n}' if n else '')] = s
    return out


def save(db: sqlite3.Connection, account: str, game: str, stacks: list[dict], at: int | None = None) -> dict:
    """Stores only what differs from the saved inventory. New, removed and amount changes are recorded once in the history."""
    now = at or int(time.time())
    incoming = identify(stacks)
    log = 'insert into changes(account,game,k,kind,old_a,new_a,at) values(?,?,?,?,?,?,?)'
    with _lock, db:
        known = {i: json.loads(d) for i, d in db.execute('select id, data from stacks where account=? and game=?', (account, game))}
        first = db.execute('select 1 from meta where account=? and game=?', (account, game)).fetchone() is None
        added = changed = removed = 0
        touched = first
        for ident, s in incoming.items():
            old = known.get(ident)
            if old == s:
                continue
            touched = True
            db.execute('insert into stacks values(?,?,?,?) on conflict(account,game,id) do update set data=excluded.data', (account, game, ident, json.dumps(s, sort_keys=True, separators=(',', ':'))))
            if first:
                continue
            if old is None:
                added += 1
                db.execute(log, (account, game, s['k'], 'add', None, float(s['a']), now))
            elif old['a'] != s['a']:
                changed += 1
                db.execute(log, (account, game, s['k'], 'change', float(old['a']), float(s['a']), now))
        for ident, old in known.items():
            if ident in incoming:
                continue
            touched = True
            removed += 1
            db.execute('delete from stacks where account=? and game=? and id=?', (account, game, ident))
            db.execute(log, (account, game, old['k'], 'remove', float(old['a']), None, now))
        if touched:
            db.execute('insert into meta values(?,?,?) on conflict(account,game) do update set updated=excluded.updated', (account, game, now))
    return {'added': added, 'changed': changed, 'removed': removed, 'baseline': first}


def matches(db: sqlite3.Connection, account: str, game: str, stacks: list[dict]) -> bool:
    with _lock:
        if db.execute('select 1 from meta where account=? and game=?', (account, game)).fetchone() is None:
            return False
        known = {i: json.loads(d) for i, d in db.execute('select id, data from stacks where account=? and game=?', (account, game))}
    return known == identify(stacks)


def load(db: sqlite3.Connection, account: str, game: str) -> dict | None:
    with _lock:  # one connection is shared by every request thread
        meta = db.execute('select updated from meta where account=? and game=?', (account, game)).fetchone()
        rows = db.execute('select data from stacks where account=? and game=?', (account, game)).fetchall() if meta else []
    if meta is None:
        return None
    return {'updated': meta[0], 'inventory': [json.loads(r[0]) for r in rows]}


def history(db: sqlite3.Connection, account: str, game: str, since: int, limit: int) -> list[dict]:
    with _lock:
        rows = db.execute('select k, kind, old_a, new_a, at from changes where account=? and game=? and at>=? order by at desc, id desc limit ?', (account, game, since, limit)).fetchall()
    return [{'k': k, 'kind': kind, 'from': o, 'to': n, 'at': at} for k, kind, o, n, at in rows]


def prune(db: sqlite3.Connection, retention_days: int) -> int:
    with _lock, db:
        return db.execute('delete from changes where at<?', (int(time.time()) - retention_days * 86400,)).rowcount


def stats(db: sqlite3.Connection, path: str) -> dict:
    """Totals for the admin page: what is stored, per game, and how big the files are."""
    with _lock:
        games = {g: {'accounts': a, 'stacks': s, 'last_update': u} for g, a, s, u in db.execute(
            'select m.game, count(*), coalesce(sum((select count(*) from stacks k where k.account=m.account and k.game=m.game)),0), max(m.updated) from meta m group by m.game')}
        accounts = db.execute('select count(distinct account) from meta').fetchone()[0]
        changes = db.execute('select count(*), min(at) from changes').fetchone()
    size = sum(os.path.getsize(p) for p in (path, path + '-wal', path + '-shm') if os.path.exists(p))
    return {'accounts': accounts, 'games': games, 'changes': changes[0], 'oldest_change': changes[1], 'bytes': size}


def accounts(db: sqlite3.Connection) -> list[str]:
    with _lock:
        return [r[0] for r in db.execute('select distinct account from meta')]


def backup(db: sqlite3.Connection, folder: str, keep: int = 7) -> str:
    """Copies the whole database to a dated file and keeps only the newest few."""
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, time.strftime('trackstat-%Y-%m-%d.db', time.gmtime()))
    if os.path.exists(path):
        os.remove(path)
    copy = sqlite3.connect(path)
    with _lock:
        db.backup(copy)
    copy.close()
    for old in sorted(f for f in os.listdir(folder) if f.startswith('trackstat-') and f.endswith('.db'))[:-keep]:
        os.remove(os.path.join(folder, old))
    return path


def forget(db: sqlite3.Connection, account: str) -> None:
    with _lock, db:
        for table in ('stacks', 'meta', 'changes'):
            db.execute(f'delete from {table} where account=?', (account,))
