import { PGlite } from '../trackstat-account-20261016/harness/node_modules/@electric-sql/pglite/dist/index.js';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const mode=process.argv[2],db=new PGlite(),base='supabase/migrations/';
try {
const old=readFileSync('artifacts/trackstat-account-20261016/database-test.mjs','utf8');
const setup=old.slice(old.indexOf('await db.exec(`')+15,old.indexOf('`);'));
await db.exec(setup);
await db.exec(readFileSync(base+'20261028_trackstat_email_reset.sql','utf8'));
await db.exec(`drop function trackstat_user_accounts_read();create function trackstat_user_accounts_read(p_skip_keys text[]) returns jsonb language sql as $$select '[]'::jsonb$$;`);
await db.exec(readFileSync(base+'20261033_trackstat_slim_reads.sql','utf8'));
await db.exec(readFileSync(base+'20261044_trackstat_sync_keeps_live.sql','utf8'));
if(mode==='modified'||mode==='rollback')await db.exec(readFileSync('artifacts/trackstat-status-20261021/MODIFIED_FILE/'+base+'20261052_trackstat_reset_status.sql','utf8'));
if(mode==='rollback')await db.exec(readFileSync('artifacts/trackstat-status-20261021/ROLLBACK_DATABASE.sql','utf8'));
const key='sp_'+'a'.repeat(64),next='sp_'+'b'.repeat(64),bad='sp_'+'c'.repeat(64),u='11111111-1111-4111-8111-111111111111',v='22222222-2222-4222-8222-222222222222';
const query=async(sql,args=[]) => (await db.query(sql,args)).rows[0];
await db.query('insert into auth.users values($1),($2)',[u,v]);
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);
const {id}=await query("insert into trackstat_accounts(key_hash,roblox_id,username)values(encode(extensions.digest($1,'sha256'),'hex'),'100','Fixture') returning id",[key]);
await db.query('select trackstat_user_account_save($1)',[key]);
await db.query("insert into trackstat_sessions(account_id,game_id,snapshot)values($1,'3317771874','{\"gained\":{\"items\":5},\"details\":[]}')",[id]);
const read=async(k=key)=>(await query('select trackstat_private($1,true) data',[k])).data;
assert.deepEqual((await read()).activeGames,['3317771874']);console.log('PASS running library is connected');
await db.query("update trackstat_sessions set updated_at=now()-interval '5 minutes' where account_id=$1",[id]);
assert.deepEqual((await read()).activeGames,[]);console.log('PASS stopped library becomes offline after presence timeout');
const before=(await query('select trackstat_version(array[$1]) v',[key])).v;
await db.query('select trackstat_reset_and_wipe($1,$2)',[key,next]);
if(mode!=='modified'){await assert.rejects(read());console.log('REPRODUCED: reset drops old connection instead of a reset status');console.log('RESULT BASELINE/ROLLBACK reproduced missing reset status');}
else {
const marker=await read();assert.equal(marker.connectionStatus,'reset');assert.deepEqual(marker.sessions,[]);assert.deepEqual(marker.activeGames,[]);assert.deepEqual(marker.daily,[]);console.log('PASS reset keeps only reset status and label');
assert.equal((await query('select count(*)::int n from trackstat_accounts where id=$1',[id])).n,0);assert.equal((await query('select count(*)::int n from trackstat_sessions where account_id=$1',[id])).n,0);assert.deepEqual((await read(next)).sessions,[]);console.log('PASS reset still deletes old identity and tracking data; new key is empty');
assert.notEqual((await query('select trackstat_version(array[$1]) v',[key])).v,before);console.log('PASS reset invalidates page fingerprint');
assert.equal((await query("select trackstat_user_accounts_read('{}',true) data")).data[0].connectionStatus,'reset');assert.deepEqual((await query('select trackstat_user_accounts_read(array[$1],true) data',[key])).data,[]);console.log('PASS email-only read retains reset marker and cookie read does not duplicate it');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[v]);assert.deepEqual((await query("select trackstat_user_accounts_read('{}',true) data")).data,[]);await db.query('select trackstat_user_account_remove($1)',[id]);await db.exec('set role authenticated');await assert.rejects(db.query('select * from trackstat_reset_connections'));await db.exec('reset role');console.log('PASS other user cannot read or detach marker and direct table access denied');
await assert.rejects(read(bad));await assert.rejects(db.query('select trackstat_user_account_save($1)',[key]));console.log('PASS invalid key is not a reset and old key cannot save new ownership');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);const rv=(await query("select trackstat_version('{}') v")).v;await db.query('select trackstat_user_account_remove($1)',[id]);assert.deepEqual((await query("select trackstat_user_accounts_read('{}',true) data")).data,[]);assert.notEqual((await query("select trackstat_version('{}') v")).v,rv);console.log('PASS owner removes reset marker and email cache invalidates');
console.log('RESULT 9 database cases passed');
}
} catch(e){console.error(e);process.exitCode=1;}finally{await db.close();}
