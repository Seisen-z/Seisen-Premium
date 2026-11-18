const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(process.env.SEISEN_PROJECT_ROOT || path.join(__dirname, '..'));
const CORE = path.resolve(process.env.PROMETHEUS_CORE || path.join(ROOT, 'lib/prometheus'));
const LUAU = process.env.LUAU_BIN || 'luau';
const LUAU_COMPILE = process.env.LUAU_COMPILE_BIN || (path.dirname(LUAU) === '.'
  ? 'luau-compile' : path.join(path.dirname(LUAU), 'luau-compile' + path.extname(LUAU)));
const { LuaFactory } = require(path.join(ROOT, 'node_modules/wasmoon'));

async function engine() {
  const factory = new LuaFactory(path.join(CORE, 'glue.wasm'));
  const lua = await factory.createEngine();
  async function mount(dir, base = '') {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name), relative = path.posix.join(base, entry.name);
      if (entry.isDirectory()) await mount(file, relative);
      else if (entry.name.endsWith('.lua')) await factory.mountFile(relative, await fs.readFile(file, 'utf8'));
    }
  }
  await mount(CORE);
  await lua.doString('_G.arg={[0]="cli.lua"};package.path="./?.lua;./src/?.lua;"..package.path;require("prometheus")');
  return { lua, factory };
}

async function transform(source, preset, version = 'LuaU') {
  const { lua, factory } = await engine();
  try {
    await factory.mountFile('input.lua', source + '\n');
    return await lua.doString(`
      local f=assert(io.open("input.lua","r"));local source=f:read("*a");f:close()
      local config=require("presets")[${JSON.stringify(preset)}]
      config.LuaVersion=${JSON.stringify(version)};config.Seed=182610
      return require("prometheus.pipeline"):fromConfig(config):apply(source,"regression.lua")
    `);
  } finally { lua.global.close(); }
}

async function parse(source, version = 'LuaU') {
  const { lua, factory } = await engine();
  try {
    await factory.mountFile('input.lua', source + '\n');
    await lua.doString(`local f=assert(io.open("input.lua","r"));local s=f:read("*a");f:close();require("prometheus.parser"):new({LuaVersion=${JSON.stringify(version)}}):parse(s)`);
  } finally { lua.global.close(); }
}

async function execute(source, file) {
  await fs.writeFile(file, source);
  const result = spawnSync(LUAU, [file], { encoding: 'utf8', timeout: 30000 });
  if (result.error) throw new Error(`Luau runtime required; set LUAU_BIN. ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Luau execution failed (${result.status}): ${result.stdout}${result.stderr}`);
  return result.stdout.replace(/\r\n/g, '\n');
}

async function main() {
  const scriptIndex = process.argv.indexOf('--script');
  if (scriptIndex !== -1) {
    const input = path.resolve(process.argv[scriptIndex + 1]);
    const source = await fs.readFile(input, 'utf8');
    await parse(source);
    const presetIndex = process.argv.indexOf('--preset');
    if (presetIndex !== -1) {
      const preset = process.argv[presetIndex + 1];
      if (!['Minify','Weak','Medium','Strong'].includes(preset)) throw new Error('Invalid preset');
      const output = await transform(source, preset);
      const outputIndex = process.argv.indexOf('--out');
      if (outputIndex === -1) throw new Error('--out is required with --preset');
      const outputFile = path.resolve(process.argv[outputIndex + 1]);
      await fs.writeFile(outputFile, output);
      const compiled = spawnSync(LUAU_COMPILE, ['--null', outputFile], { encoding: 'utf8', timeout: 30000 });
      if (compiled.error || compiled.status !== 0) throw new Error('Generated script failed Luau compilation: ' + (compiled.error || compiled.stderr));
      console.log('PASS: generated full script compiles without executing it');
    }
    console.log('PASS: actual Prometheus pipeline: ' + input);
    return;
  }
  const fixture = await fs.readFile(path.join(ROOT, 'scripts/fixtures/prometheus-luau.luau'), 'utf8');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'seisen-prometheus-'));
  try {
    const expected = await execute(fixture, path.join(temp, 'reference.luau'));
    for (const preset of ['Minify', 'Weak', 'Medium', 'Strong']) {
      const output = await transform(fixture, preset);
      await parse(output);
      const actual = await execute(output, path.join(temp, preset + '.luau'));
      if (actual !== expected) throw new Error(preset + ' changed fixture behavior');
      console.log('PASS: ' + preset + ' LuaU parse, compile and runtime equivalence');
    }
    for (const source of ['local x=if true then 1', 'local x=if true then else 2', 'local x=1 //']) {
      let rejected = false;
      try { await parse(source); } catch { rejected = true; }
      if (!rejected) throw new Error('Malformed syntax was accepted: ' + source);
    }
    for (const source of ['local x=if true then 1 else 2', 'local x=1 // 2']) {
      let rejected = false;
      try { await parse(source, 'Lua51'); } catch { rejected = true; }
      if (!rejected) throw new Error('Lua51 mode accepted LuaU-only syntax');
    }
    const legacy = 'local a=3;local function f(x)return x+a end;print(f(4))';
    const legacyOutput = await transform(legacy, 'Minify', 'Lua51');
    if (await execute(legacyOutput, path.join(temp, 'legacy.lua')) !== '7\n') throw new Error('Lua51 regression');
    console.log('PASS: malformed-input rejection and Lua51 compatibility');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
