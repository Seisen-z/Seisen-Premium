# Prometheus compatibility changes

- Reproduce each reported failure with this repository's actual `wasmoon`, `glue.wasm`, parser, CLI options and presets.
- Add the smallest valid Luau regression to `scripts/fixtures/prometheus-luau.luau` before changing the core. Confirm it fails against the previous core.
- Preserve lazy branches, false/nil values, single-result conditional semantics, varargs, upvalues, operator precedence and metamethods. Do not use `condition and value or other` to represent a conditional with a false/nil branch.
- Set `LUAU_BIN` to the official Luau interpreter and run `npm test`; all four presets must parse, compile and execute the regression with reference-equivalent output. Keep Lua51 compatibility and malformed-input rejection tests passing.
- Test the full reported input using `npm run test:prometheus -- --script INPUT --preset PRESET --out OUTPUT`. This compiles generated output without executing a Roblox hub outside Roblox.
- Keep changes focused. Add future reported syntax to the regression suite, then implement and re-test it; do not promise support for every future Luau construct.
- Distinguish parser success, generated-code compilation, fixture runtime equivalence and actual connected-game execution in completion reports. Restart/redeploy the server to refresh production's cached Prometheus files.
