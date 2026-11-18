import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const dir=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/,'$1'));
const file=n=>path.join(dir,n); const read=n=>JSON.parse(fs.readFileSync(file(n),'utf8').replace(/^\uFEFF/,''));
const write=(n,v)=>fs.writeFileSync(file(n),JSON.stringify(v,null,2)+'\n');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read('BASELINE_FILE.json');
const db=()=>createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const get=async()=>{const {data,error}=await db().from('script_metadata').select('*').order('script_name');if(error)throw error;return data;};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const mode=process.argv[2];
if(mode==='prepare'){
 const source='E:/Seisen Hub/.dontsearch/feature-list.md';fs.copyFileSync(source,file('SOURCE_FEATURES.md'));
 const sections=[];let current;
 for(const line of fs.readFileSync(source,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){
 const h=line.match(/^# (.+)$/);if(h){current={source:h[1].trim(),features:[]};sections.push(current);continue;}
 const f=line.match(/^>\s*•\s*(.+)$/);if(f){assert(current);current.features.push(f[1].trim());}
 }
 assert.equal(sections.length,34);assert(sections.every(s=>s.features.length));
 const aliases={'AnimeRanger':['Anime Re:Ranger X','Anime Ranger X'],'Build a Soccer Squad':['Build a Soccer Team'],'GrowAGarden':['Grow a Garden 2'],'SmileSeas':['Slime Seas'],'Raft 101 Survive':['Raft 101 Survival'],'AnimeDice':['Anime Dice'],'RollAnimeToFight':['Roll Anime to Fight']};
 const catalog=read('catalog.json'); const norm=s=>s.toLowerCase().replace(/[^a-z0-9+]/g,'');
 const changes=[];
 for(const s of sections){const targets=aliases[s.source]||[...new Set(catalog.filter(c=>norm(c.name)===norm(s.source)).map(c=>c.name))];assert(targets.length,`Unmatched ${s.source}`);
 for(const name of targets){assert(!changes.some(c=>c.script_name===name));const existing=baseline.find(r=>r.script_name===name);changes.push({source:s.source,script_name:name,features:s.features,before:existing||null,in_catalog:catalog.some(c=>c.name===name)});}}
 write('CHANGES.json',changes);
 const modified=baseline.map(r=>({...r}));for(const c of changes){const r=modified.find(r=>r.script_name===c.script_name);if(r)r.features=c.features;else modified.push({script_name:c.script_name,description:'',features:c.features});}write('MODIFIED_FILE.json',modified);
 fs.writeFileSync(file('DIFF_FILE.diff'),changes.map(c=>`@@ ${c.source} -> ${c.script_name} @@\n-${JSON.stringify(c.before?.features||[])}\n+${JSON.stringify(c.features)}\n`).join('\n'));
 write('HASHES.json',{source:hash(source),baseline:hash(file('BASELINE_FILE.json')),modified:hash(file('MODIFIED_FILE.json'))});
 console.log(`PREPARE PASS: ${sections.length} sections; ${sections.reduce((n,s)=>n+s.features.length,0)} source features; ${changes.length} target rows; ${changes.filter(c=>!c.before).length} inserts; ${changes.filter(c=>c.before).length} updates`);
}else if(mode==='baseline'){
 assert.equal(hash(file('BASELINE_FILE.json')),read('HASHES.json').baseline);assert.deepEqual(await get(),baseline);console.log(`BASELINE PASS: ${baseline.length} live rows match backup`);
}else if(mode==='apply'){
 const changes=read('CHANGES.json');assert.deepEqual(await get(),baseline,'Database changed since snapshot');
 const payload=changes.map(c=>({script_name:c.script_name,description:c.before?.description??'',features:c.features,updated_at:new Date().toISOString()}));
 const {data,error}=await db().from('script_metadata').upsert(payload,{onConflict:'script_name'}).select('*');if(error)throw error;
 assert.equal(data.length,changes.length);write('APPLIED_ROWS.json',data);console.log(`APPLY PASS: ${data.length} rows written`);
}else if(mode==='verify'){
 const changes=read('CHANGES.json');const live=await get();
 for(const c of changes){const r=live.find(r=>r.script_name===c.script_name);assert(r);assert.deepEqual(r.features,c.features);if(c.before){for(const k of ['id','script_name','description','created_at'])assert.deepEqual(r[k],c.before[k]);}}
 const untouched=baseline.filter(r=>!changes.some(c=>c.script_name===r.script_name));for(const r of untouched)assert.deepEqual(live.find(l=>l.id===r.id),r);
 assert.equal(live.length,baseline.length+changes.filter(c=>!c.before).length);write('LIVE_VERIFIED.json',live);
 console.log(`MODIFIED PASS: ${changes.length} target rows; ${changes.reduce((n,c)=>n+c.features.length,0)} stored features exact; ${untouched.length} unrelated rows unchanged; ${live.length} total live rows`);
}else if(mode==='rollback-check'){
 assert.equal(hash(process.argv[3]),read('HASHES.json').baseline);assert.deepEqual(JSON.parse(fs.readFileSync(process.argv[3],'utf8')),baseline);console.log(`ROLLBACK PASS: separate copy restored; SHA256 matches baseline; ${baseline.length} original rows restored; live database remains updated`);
}else if(mode==='rollback-live'){
 const changes=read('CHANGES.json');const applied=read('APPLIED_ROWS.json');const live=await get();for(const r of applied)assert.deepEqual(live.find(l=>l.id===r.id),r,'Target changed since import');
 for(const c of changes){const q=c.before?db().from('script_metadata').update({features:c.before.features,updated_at:c.before.updated_at}).eq('id',c.before.id):db().from('script_metadata').delete().eq('script_name',c.script_name);const {error}=await q;if(error)throw error;}
 assert.deepEqual(await get(),baseline);console.log('LIVE ROLLBACK PASS: original database restored');
}else throw Error('Unknown mode');

