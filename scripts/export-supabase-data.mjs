// Exports every row from every known table in the old Supabase project to JSON files.
// Run with:  node --env-file=.env.local scripts/export-supabase-data.mjs
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TABLES = [
  'admin_credentials',
  'github_config',
  'license_keys',
  'payments',
  'premium_stock',
  'reviews',
  'script_metadata',
  'ticket_replies',
  'tickets',
  'verification_codes',
  'visitors',
];

const OUT_DIR = path.join(process.cwd(), 'scripts', 'backup');
const PAGE_SIZE = 1000;

async function exportTable(table) {
  let allRows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select('*').range(from, to);

    if (error) {
      console.error(`  ERROR fetching ${table} (rows ${from}-${to}):`, error.message);
      return { table, error: error.message };
    }

    allRows = allRows.concat(data);

    if (!data.length || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const filePath = path.join(OUT_DIR, `${table}.json`);
  await writeFile(filePath, JSON.stringify(allRows, null, 2), 'utf-8');
  console.log(`  ${table}: ${allRows.length} rows -> ${filePath}`);
  return { table, count: allRows.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Exporting from ${SUPABASE_URL} ...\n`);

  const results = [];
  for (const table of TABLES) {
    results.push(await exportTable(table));
  }

  console.log('\nDone.');
  const failed = results.filter((r) => r.error);
  if (failed.length) {
    console.log(`\n${failed.length} table(s) failed:`);
    failed.forEach((f) => console.log(`  - ${f.table}: ${f.error}`));
    process.exit(1);
  }
}

main();
