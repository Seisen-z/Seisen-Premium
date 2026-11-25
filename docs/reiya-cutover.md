# Move Reiya Premium to Seisen Premium

The import maps Reiya Premium records into the Seisen Supabase project. It carries purchase and consent history, PayPal subscription IDs, existing license and profile IDs, device allocations, valid desktop sessions, encrypted backups, linked account metadata, and refund requests. Browser sessions expire at the domain boundary. In-flight buyers can recover an existing key through Seisen support using their PayPal purchase details.

The website reuses Seisen’s Supabase, Resend, and PayPal app credentials when configured as described in the [website setup](../README.md#reiya-downloads). Reiya uses its own plan IDs and webhook ID.

The import verifies the existing key pepper and wrapping key against stored encrypted keys. It preserves backup ciphertext and profile IDs, which the Windows app needs to decrypt backups. Refund requests already in progress need review through Seisen support. The legacy records and refund consents remain available to service administrators.

This transfer covers Reiya Premium. The desktop ratings and online presence currently use the legacy Supabase project. Keep that project online until those functions and anonymous installation identities have their own migration.

## Rehearse

1. Keep the original checkout in service during the rehearsal. Apply the Seisen Reiya Premium SQL migration to a staging database and configure a staging deployment with checkout paused.
2. Securely load REIYA_SOURCE_DATABASE_URL and REIYA_TARGET_DATABASE_URL into the migration process. Use the PostgreSQL direct or session-pooler connection strings, and a trusted database certificate. Database account access tokens and Supabase API keys are separate from the PostgreSQL connection credentials used by the importer.
3. Load the existing PREMIUM_KEY_PEPPER and PREMIUM_WRAPPING_KEY values from Reiya into REIYA_PREMIUM_KEY_PEPPER and REIYA_PREMIUM_WRAPPING_KEY. Provide the same values to the Seisen server. Keep both private.
4. From the Seisen Premium repo, run npm ci with development dependencies and then node scripts/migrate-reiya-premium.mjs. The command validates the import, reports row counts, and rolls back all writes. The destination Reiya tables must be empty.
5. Run an applied import only on disposable staging with synthetic fixtures first. Verify existing-key activation, returning-device recognition, backup restore, status, and refund state. Exercise PayPal Sandbox separately using sandbox credentials and subscriptions.

## Switch production

1. Prepare the Seisen deploy, review open refunds and pending checkouts, and verify the signed Windows installer and updater are available on the Seisen release. Configure the Seisen server with the destination Supabase project and the original crypto values. Keep checkout paused.
2. Take restorable backups of both databases. Pause legacy Reiya checkout and mutation routes, including old desktop writes and any payout or refund processing. Keep PayPal events queued or record them for replay. Finish in-flight checkouts first or reconcile their PayPal records during cutover.
3. Run the rehearsal against the production destination while legacy writes are stopped. Review its totals. Run node scripts/migrate-reiya-premium.mjs --apply against the same database connections. It commits all mapped tables together after validation. Leave both checkouts paused if verification fails.
4. Configure the Reiya webhook in the existing PayPal app and environment. Point it to https://seisen.store/api/reiya/webhook. Use the webhook ID assigned to that endpoint and subscribe to PAYMENT.SALE.COMPLETED, PAYMENT.SALE.REFUNDED, PAYMENT.SALE.REVERSED and CUSTOMER.DISPUTE.CREATED. Reconcile PayPal events from the pause and verify delivery to Seisen before retiring the old handler.
5. Confirm an existing subscription and key can activate in the new signed Windows build, restore a known backup, and receive a renewal or refund in the correct order. Verify the Seisen download, email delivery, and billing plan configuration. Re-enable checkout on Seisen after those checks.
6. Direct users to https://seisen.store/reiya for the new installer. Windows builds pinned to the old domain need the new installer. The new build reuses the saved activation and device ID on the same Windows profile. Retain the legacy database backup through reconciliation and rollback sign-off.

If a check fails before Seisen begins accepting writes, return traffic and webhook processing to the legacy service while investigating. After Seisen accepts writes, reconcile any new or changed subscriptions, refunds, and backups before returning traffic.
