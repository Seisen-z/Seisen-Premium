import { createDecipheriv, createHmac, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// All SQL identifiers and statements come from this fixed mapping.
const tables = [
  ['orders', `SELECT o.id, o.plan, o.claim_hash, o.legal_consent, o.paypal_subscription_id,
    lower(o.payer_email) AS payer_email, o.payer_id, o.key_ciphertext, o.email_delivery_status,
    o.delivered_at, o.refunded_at,
    CASE WHEN l.revoked OR o.refunded_at IS NOT NULL THEN coalesce(o.refunded_at, now()) END AS revoked_at,
    o.created_at, o.local_wipe_requested, l.key_hash AS verification_hash
    FROM public.reiya_premium_orders o LEFT JOIN public.reiya_premium_licenses l ON l.order_id = o.id`,
    'id,plan,claim_hash,legal_consent,paypal_subscription_id,payer_email,payer_id,key_ciphertext,email_delivery_status,delivered_at,refunded_at,revoked_at,created_at,local_wipe_requested'],
  ['licenses', `SELECT l.id, l.order_id, l.profile_id, l.key_hash, p.cloud_key_ciphertext,
    p.display_name, l.expires_at, l.revoked OR o.refunded_at IS NOT NULL AS revoked,
    l.status <> 'active' AS billing_inactive, l.max_devices
    FROM public.reiya_premium_licenses l JOIN public.reiya_premium_profiles p ON p.id = l.profile_id
    JOIN public.reiya_premium_orders o ON o.id = l.order_id`,
    'id,order_id,profile_id,key_hash,cloud_key_ciphertext,display_name,expires_at,revoked,billing_inactive,max_devices'],
  ['devices', 'SELECT license_id, device_hash FROM public.reiya_premium_devices', 'license_id,device_hash'],
  ['sessions', `SELECT s.token_hash, s.license_id, s.device_hash, s.expires_at
    FROM public.reiya_premium_sessions s
    JOIN public.reiya_premium_devices d USING (license_id, device_hash)
    WHERE s.expires_at > now()`, 'token_hash,license_id,device_hash,expires_at'],
  ['backups', `SELECT b.id, l.id AS license_id, b.ciphertext, b.metadata, b.created_at
    FROM public.reiya_premium_backups b JOIN public.reiya_premium_licenses l USING (profile_id)`,
    'id,license_id,ciphertext,metadata,created_at'],
  ['account_metadata', `SELECT l.id AS license_id, a.ownership_hash, a.username,
    coalesce(a.display_name, '') AS display_name, coalesce(a.robux, 0)::text AS robux,
    coalesce(a.synced_at, a.added_at, link.created_at) AS updated_at
    FROM public.reiya_profile_account_links link JOIN public.reiya_premium_licenses l USING (profile_id)
    JOIN public.roblox_accounts a ON a.id = link.account_id`,
    'license_id,ownership_hash,username,display_name,robux,updated_at'],
  ['refund_requests', `SELECT id, order_id, email, reason, status, created_at, resolved_at, refund_id, sale_id,
    erase_local_data, erase_consent_at, erase_consent_version FROM public.reiya_refund_requests`,
    'id,order_id,email,reason,status,created_at,resolved_at,refund_id,sale_id,erase_local_data,erase_consent_at,erase_consent_version'],
];

class MigrationError extends Error {}

export async function migrateReiya(source, target, { pepper, wrappingKey, apply = false }) {
  if (!pepper || !/^[a-f0-9]{64}$/i.test(wrappingKey ?? '')) {
    throw new MigrationError('Set the original key pepper and wrapping key in the local environment.');
  }
  const key = Buffer.from(wrappingKey, 'hex');
  const digest = (purpose, value) => createHmac('sha256', pepper).update(purpose + ':' + value).digest('hex');
  function unwrap(ciphertext, context) {
    try {
      const bytes = Buffer.from(ciphertext, 'base64');
      const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
      cipher.setAAD(Buffer.from(context));
      cipher.setAuthTag(bytes.subarray(-16));
      return Buffer.concat([cipher.update(bytes.subarray(12, -16)), cipher.final()]).toString('utf8');
    } catch {
      throw new MigrationError('A legacy encrypted key could not be verified. Check the original wrapping key and source integrity.');
    }
  }

  function prepare(name, rows) {
    if (name === 'orders') {
      for (const row of rows) {
        if (!row.key_ciphertext) continue;
        const licenseKey = unwrap(row.key_ciphertext, 'delivery:' + row.id);
        if (!/^REIYA-P-[0-9A-F]{64}$/.test(licenseKey)
          || !/^[0-9a-f]{64}$/.test(row.verification_hash ?? '')
          || !timingSafeEqual(Buffer.from(digest('license', licenseKey), 'hex'), Buffer.from(row.verification_hash, 'hex'))) {
          throw new MigrationError('A legacy license hash did not match. Check the original key pepper and source integrity.');
        }
      }
    }
    if (name === 'licenses') {
      for (const row of rows) {
        if (row.revoked && row.cloud_key_ciphertext === '') continue;
        const cloudKey = unwrap(row.cloud_key_ciphertext, 'cloud');
        if (!/^[A-Za-z0-9+/]{43}=$/.test(cloudKey)) throw new MigrationError('A legacy cloud key is invalid.');
      }
    }
    if (name === 'account_metadata') {
      for (const row of rows) {
        if (!/^[0-9a-f]{64}$/.test(row.ownership_hash ?? '')) {
          throw new MigrationError('A linked legacy account has invalid ownership metadata.');
        }
        row.ownership_hash = digest('account', row.ownership_hash);
      }
    }
  }

  let sourceOpen = false;
  let targetOpen = false;
  let stage = 'opening transactions';
  try {
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    sourceOpen = true;
    await target.query('BEGIN');
    targetOpen = true;
    await target.query("SET LOCAL lock_timeout = '5s'");
    await target.query('LOCK TABLE ' + tables.map(([name]) => 'public.seisen_reiya_' + name).join(', ') + ' IN SHARE ROW EXCLUSIVE MODE');

    stage = 'checking source relationships';
    const { rows: [sourceCheck] } = await source.query(`SELECT
      EXISTS (SELECT 1 FROM public.reiya_premium_orders o
        LEFT JOIN public.reiya_premium_licenses l ON l.order_id = o.id
        WHERE o.license_id IS DISTINCT FROM l.id
           OR (l.id IS NOT NULL AND o.paypal_subscription_id IS DISTINCT FROM l.paypal_subscription_id))
      OR EXISTS (SELECT 1 FROM public.reiya_premium_profiles p
        LEFT JOIN public.reiya_premium_licenses l ON l.profile_id = p.id
        GROUP BY p.id HAVING count(l.id) <> 1) AS inconsistent`);
    if (sourceCheck.inconsistent) throw new MigrationError('Legacy order, license, and profile references need review before import.');

    const counts = {};
    for (const [name, select, columns] of tables) {
      stage = 'copying ' + name;
      const table = 'public.seisen_reiya_' + name;
      const { rows: [before] } = await target.query('SELECT count(*)::text AS count FROM ' + table);
      if (before.count !== '0') throw new MigrationError('Destination already contains ' + name + '. Review those records before merging.');
      await source.query('DECLARE transfer_rows NO SCROLL CURSOR FOR SELECT row_to_json(entry)::text AS payload FROM (' + select + ') entry');
      let count = 0;
      while (true) {
        const { rows } = await source.query('FETCH FORWARD 25 FROM transfer_rows');
        if (!rows.length) break;
        const needsPreparation = name === 'orders' || name === 'licenses' || name === 'account_metadata';
        let batch = '[' + rows.map(row => row.payload).join(',') + ']';
        if (needsPreparation) {
          const records = rows.map(row => JSON.parse(row.payload));
          prepare(name, records);
          // Keep original JSON for orders and licenses, including legal records.
          if (name === 'account_metadata') batch = JSON.stringify(records);
        }
        const result = await target.query(
          'INSERT INTO ' + table + ' (' + columns + ') SELECT ' + columns
          + ' FROM jsonb_populate_recordset(NULL::' + table + ', $1::jsonb)',
          [batch],
        );
        if (result.rowCount !== rows.length && result.affectedRows !== rows.length) {
          throw new MigrationError('Imported row count did not match for ' + name + '.');
        }
        count += rows.length;
      }
      await source.query('CLOSE transfer_rows');
      const { rows: [after] } = await target.query('SELECT count(*)::text AS count FROM ' + table);
      if (after.count !== String(count)) throw new MigrationError('Destination row count did not match for ' + name + '.');
      counts[name] = count;
    }
    stage = apply ? 'committing the destination' : 'rolling back the rehearsal';
    await target.query(apply ? 'COMMIT' : 'ROLLBACK');
    targetOpen = false;
    return counts;
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    const code = /^[A-Z0-9]{5}$/.test(error?.code ?? '') ? ' (SQLSTATE ' + error.code + ')' : '';
    throw new MigrationError('Migration stopped while ' + stage + code + '.');
  } finally {
    if (targetOpen) await target.query('ROLLBACK').catch(() => {});
    if (sourceOpen) await source.query('ROLLBACK').catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== '--apply')) {
    throw new MigrationError('Usage: node scripts/migrate-reiya-premium.mjs [--apply]');
  }
  const sourceUrl = process.env.REIYA_SOURCE_DATABASE_URL;
  const targetUrl = process.env.REIYA_TARGET_DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    throw new MigrationError('Set REIYA_SOURCE_DATABASE_URL and REIYA_TARGET_DATABASE_URL in the local environment.');
  }
  const { Client } = await import('pg');
  function connect(connectionString) {
    let url;
    try {
      url = new URL(connectionString);
    } catch {
      throw new MigrationError('Set valid PostgreSQL connection URLs.');
    }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new MigrationError('Set valid PostgreSQL connection URLs.');
    for (const name of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'ssl', 'uselibpqcompat']) {
      if (url.searchParams.has(name)) throw new MigrationError('Use a PostgreSQL connection URL without TLS parameters.');
    }
    return new Client({
      connectionString: url.toString(), connectionTimeoutMillis: 15000, ssl: { rejectUnauthorized: true },
      application_name: 'seisen-reiya-migration',
    });
  }
  const source = connect(sourceUrl);
  const target = connect(targetUrl);
  try {
    await source.connect();
    await target.connect();
    const apply = args[0] === '--apply';
    const counts = await migrateReiya(source, target, {
      pepper: process.env.REIYA_PREMIUM_KEY_PEPPER,
      wrappingKey: process.env.REIYA_PREMIUM_WRAPPING_KEY,
      apply,
    });
    console.log(apply ? 'Committed Reiya Premium import.' : 'Rehearsal passed and was rolled back.');
    console.table(counts);
  } finally {
    await Promise.allSettled([source.end(), target.end()]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof MigrationError ? error.message : 'Migration could not start. Check database access, TLS, and installed dependencies.');
    process.exitCode = 1;
  });
}
