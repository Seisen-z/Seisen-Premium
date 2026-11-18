import { PGlite } from './harness/node_modules/@electric-sql/pglite/dist/index.js';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
let db;
try {
 db = new PGlite();
const mode=process.argv[2]||'modified';
await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function extensions.digest(text,text) returns bytea language sql immutable as $$select decode(md5($1),'hex')$$;
create table public.trackstat_accounts(id uuid primary key default gen_random_uuid(),key_hash text unique not null,roblox_id text,username text,created_at timestamptz default now(),presence jsonb default '{}',presence_sessions jsonb default '{}',push_at jsonb default '{}');
create table public.trackstat_revoked_keys(key_hash text primary key,revoked_at timestamptz default now());
create table public.trackstat_sessions(id uuid primary key default gen_random_uuid(),account_id uuid references public.trackstat_accounts(id),game_id text,sequence bigint default 1,started_at timestamptz default now(),updated_at timestamptz default now(),snapshot jsonb default '{"gained":{"items":5}}',daily_checkpoint jsonb);
create table public.trackstat_daily_gains(account_id uuid references public.trackstat_accounts(id) on delete cascade,game_id text,day date,gained jsonb);
create table public.trackstat_pruned_sessions(id uuid primary key default gen_random_uuid(),account_id uuid references public.trackstat_accounts(id) on delete cascade);
create table public.trackstat_link_requests(id uuid primary key default gen_random_uuid(),account_id uuid references public.trackstat_accounts(id) on delete cascade);
create function public.trackstat_active_games(uuid,jsonb,jsonb) returns jsonb language sql as $$select '[]'::jsonb$$;`);
if(mode==='baseline'){
 const old=readFileSync('supabase/migrations/20261015_trackstat.sql','utf8');
 await db.exec(old.slice(old.indexOf('create function public.trackstat_reset('),old.indexOf('create function public.trackstat_push(')));
}else await db.exec(readFileSync('supabase/migrations/20261028_trackstat_email_reset.sql','utf8'));
const key='sp_'+'a'.repeat(64), next='sp_'+'b'.repeat(64),other='sp_'+'c'.repeat(64);
const a=(await db.query("insert into trackstat_accounts(key_hash,roblox_id,username) values(encode(extensions.digest($1,'sha256'),'hex'),'123','Fixture') returning id",[key])).rows[0].id;
const b=(await db.query("insert into trackstat_accounts(key_hash,roblox_id,username) values(encode(extensions.digest($1,'sha256'),'hex'),'456','Untouched') returning id",[other])).rows[0].id;
await db.query("insert into trackstat_sessions(account_id,game_id) values($1,'3317771874')",[a]);
await db.query("insert into trackstat_daily_gains values($1,'3317771874',current_date,'{\"items\":5}')",[a]);
await db.query('insert into trackstat_link_requests(account_id)values($1)',[a]);await db.query('insert into trackstat_pruned_sessions(account_id)values($1)',[a]);
const u='11111111-1111-4111-8111-111111111111',v='22222222-2222-4222-8222-222222222222';
let passed=0;
async function test(name,fn){await fn();console.log('PASS '+name);passed++;}
if(mode!=='baseline'){
 await db.query('insert into auth.users values($1),($2)',[u,v]);
 await test('anonymous saved-account access rejected',async()=>{await assert.rejects(db.query('select trackstat_user_accounts_read()'))});
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);
 await test('invalid connection key cannot be linked',async()=>{await assert.rejects(db.query('select trackstat_user_account_save($1)',['sp_'+'0'.repeat(64)]))});
 await db.query('select trackstat_user_account_save($1)',[key]);await db.query('select trackstat_user_account_save($1)',[key]);
 await test('verified owner gets one saved history, without storing raw key',async()=>{const r=(await db.query('select trackstat_user_accounts_read() as data')).rows[0].data;assert.equal(r.length,1);assert.equal(r[0].account.id,a);assert(!JSON.stringify(r).includes(key));assert.equal((await db.query('select count(*)::int n from trackstat_user_accounts')).rows[0].n,1)});
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[v]);
 await test('other user cannot read or remove first users connection',async()=>{assert.deepEqual((await db.query('select trackstat_user_accounts_read() as data')).rows[0].data,[]);await db.query('select trackstat_user_account_remove($1)',[a]);assert.equal((await db.query('select count(*)::int n from trackstat_user_accounts')).rows[0].n,1)});
 await test('internal private reader and tables have no public access',async()=>{await db.exec('set role authenticated');await assert.rejects(db.query('select * from trackstat_user_accounts'));await assert.rejects(db.query('select trackstat_private_data($1)',[a]));await db.exec('reset role')});
 await test('new-key collision rejects reset without data loss',async()=>{await assert.rejects(db.query('select trackstat_reset_and_wipe($1,$2)',[key,other]));assert.equal((await db.query('select count(*)::int n from trackstat_sessions')).rows[0].n,1)});
}
await db.query(`select ${mode==='baseline'?'trackstat_reset':'trackstat_reset_and_wipe'}($1,$2)`,[key,next]);
await test('reset deletes old account identity and its sessions',async()=>{assert.equal((await db.query('select count(*)::int n from trackstat_accounts where id=$1',[a])).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from trackstat_sessions where account_id=$1',[a])).rows[0].n,0)});
await test('daily gains device requests and tombstoned sessions removed',async()=>{for(const name of ['trackstat_daily_gains','trackstat_link_requests','trackstat_pruned_sessions'])assert.equal((await db.query(`select count(*)::int n from ${name} where account_id=$1`,[a])).rows[0].n,0)});
await test('old key revoked, new account empty, unrelated account preserved',async()=>{assert.equal((await db.query("select count(*)::int n from trackstat_revoked_keys where key_hash=encode(extensions.digest($1,'sha256'),'hex')",[key])).rows[0].n,1);assert.equal((await db.query('select count(*)::int n from trackstat_accounts where id=$1',[b])).rows[0].n,1);const r=(await db.query('select trackstat_private($1) as data',[next])).rows[0].data;assert.deepEqual(r.sessions,[]);assert.deepEqual(r.daily,[]);assert.notEqual(r.account.id,a);await assert.rejects(db.query('select trackstat_private($1)',[key]))});
await test('reset detaches email ownership and requires new key',async()=>{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);assert.deepEqual((await db.query('select trackstat_user_accounts_read() as data')).rows[0].data,[]);await db.query('select trackstat_user_account_save($1)',[next]);assert.equal((await db.query('select trackstat_user_accounts_read() as data')).rows[0].data.length,1);await db.query('select trackstat_user_account_remove($1)',[(await db.query('select trackstat_private($1) as data',[next])).rows[0].data.account.id]);assert.deepEqual((await db.query('select trackstat_user_accounts_read() as data')).rows[0].data,[])});
console.log('RESULT '+passed+' database tests passed');await db.close();

} catch (error) { console.error("DATABASE ASSERTION: "+error.message); if(db) await db.close(); process.exitCode=1; }
