import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const dir='artifacts/feature-import-2026-10-10'; fs.mkdirSync(dir,{recursive:true});
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:rows,error}=await db.from('script_metadata').select('*').order('script_name'); if(error) throw error;
fs.writeFileSync(`${dir}/BASELINE_FILE.json`,JSON.stringify(rows,null,2)+'\n');
const {data:config,error:ce}=await db.from('github_config').select('*').single(); if(ce)throw ce;
const catalog=[];
for(const [type,url] of [['Free',config.free_url],['Premium',config.premium_url]]){
const r=await fetch(url);if(!r.ok)throw Error(r.status);const code=await r.text();fs.writeFileSync(`${dir}/${type}-gamelist.lua`,code);
let comment='';for(const line of code.split('\n')){const c=line.match(/--\s*(.+)/);if(c)comment=c[1].trim();const e=line.match(/\["(\d+)"\]\s*=\s*"([^"]+)"/);if(e){catalog.push({name:comment,id:e[1],url:e[2],type});comment='';}}
}
fs.writeFileSync(`${dir}/catalog.json`,JSON.stringify(catalog,null,2));
console.log('METADATA',rows.map(r=>({name:r.script_name,features:r.features?.length})));console.log('CATALOG',catalog);
