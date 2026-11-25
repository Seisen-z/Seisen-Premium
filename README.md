# Seisen Premium

Seisen is a powerful Lua obfuscator web application built with Next.js and Node.js.

## Project Structure

- **seisen-nextjs/**: The modern frontend and API application (Next.js 15, Tailwind CSS).

## Getting Started

### Start the Application

```bash
cd seisen-nextjs
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Features

- **Lua Obfuscation**: Supports Lua 5.1 and LuaU with multiple presets.
- **Script Hub**: Browse and search free and premium scripts.
- **Premium System**: PayPal and Robux payment integration.
- **Ticket System**: Discord-integrated support ticket system.
- **Admin Dashboard**: Manage users, keys, and tickets.

## Prometheus compatibility regression tests

The Luau target supports native conditional expressions (`if ... then ... elseif ... else ...`) and floor division (`//`). Lazy branches, false/nil results and VM result counts are covered by runtime regression tests.

Install the official Luau CLI tools, set `LUAU_BIN` to `luau`/`luau.exe` (with `luau-compile` alongside it, or set `LUAU_COMPILE_BIN`), and run:

```powershell
$env:LUAU_BIN = "C:\Tools\luau\luau.exe"
npm.cmd test
npm.cmd run test:prometheus -- --script "INPUT.lua" --preset Medium --out "OUTPUT.lua"
```

`npm test` includes the Prometheus suite for Minify, Weak, Medium and Strong, plus Lua51 and malformed-input checks. Full-script output is compiled without executing game code. For each new compatibility failure, add a reproducing fixture first, implement support and run the suite plus the reported full input. See `lib/prometheus/AGENTS.md`. Production servers need a restart/redeploy to refresh their cached core files.

## Reiya downloads

The /reiya tab lists the newest signed Reiya release from this public repository. Releases use the tag format reiya-v<version> and include a Windows installer, its .sig file, and SHA256SUMS.txt. Publish them with the release workflow in Reiya Account Manager. The website can serve these public downloads without a GitHub token.

Reiya checkout, key delivery, activation, backups, renewals, and refund processing use this deployment. For an existing Reiya customer base, follow [the migration runbook](docs/reiya-cutover.md) to preserve keys, subscriptions, and encrypted backups.

1. Apply the Seisen Reiya Premium SQL migration to the Seisen Supabase project. Configure REIYA_SUPABASE_URL and REIYA_SUPABASE_ADMIN_KEY.
2. Configure REIYA_PREMIUM_KEY_PEPPER and REIYA_PREMIUM_WRAPPING_KEY. Use the existing values when migrating customers. A fresh setup can generate its own values. The wrapping key is 32 bytes encoded as 64 hexadecimal characters.
3. Configure REIYA_PAYPAL_CLIENT_ID, REIYA_PAYPAL_CLIENT_SECRET, REIYA_PAYPAL_MONTHLY_PLAN_ID, REIYA_PAYPAL_YEARLY_PLAN_ID and REIYA_PAYPAL_SANDBOX. Use the existing PayPal application and monthly and yearly plans for a migration. Set REIYA_PAYPAL_WEBHOOK_ID for https://seisen.store/api/reiya/webhook.
4. Configure REIYA_SMTP_HOST, REIYA_SMTP_PORT, REIYA_SMTP_USER, REIYA_SMTP_PASS and REIYA_SMTP_FROM for key delivery. REIYA_PREMIUM_CHECKOUT_ENABLED=false pauses new purchases while existing keys and the webhook stay available.

Publish a fresh signed Windows build. The Reiya tab displays its download once that release is available in Seisen-Premium.
