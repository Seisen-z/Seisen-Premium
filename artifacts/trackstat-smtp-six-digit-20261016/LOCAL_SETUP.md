# Local SMTP / six-digit verification test

- Only local source files changed. No commit, push, Vercel environment change or deployment.
- Local `.env.local` has the server-only Trackstat project's `TRACKSTAT_SUPABASE_SERVICE_ROLE_KEY`. Existing website SMTP_* settings are reused. Keep this value out of NEXT_PUBLIC_* and out of Git.
- `/api/trackstat/auth/send-code` uses Supabase Admin generateLink only to create the identity/sign-in OTP (no provider email is sent), then calls the existing EmailService.sendVerificationCode(..., 'trackstat') through your SMTP.
- Verification/session creation still uses Supabase Auth. Configure Email OTP length to6 in the Trackstat project's Email provider; a non-six-digit provider code is rejected rather than truncated into an invalid code. No Supabase SMTP or email-template changes are needed.
- Open `/trackstat/login` locally: enter an email, then enter/paste the code into six separate numeric boxes. Full-code paste/autofill, leading zero, Backspace and arrow-key navigation are supported. All six digits are required before Verify becomes available.
- Sending is limited using the existing server limiter: 5/IP/minute and 1/email/minute, process-local like the site's other limits. Supabase still applies verification/expiry rules.
- Prior Trackstat account SQL migration remains required for saving/restoring account ownership. This follow-up adds no new database migration.
- Local admin credentials and SMTP handshake are checked without listing recipient data or sending mail. Real inbox delivery and verification still require a user test.

Official custom-provider API reference: https://supabase.com/docs/reference/javascript/auth-admin-generatelink
