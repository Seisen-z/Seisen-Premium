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
