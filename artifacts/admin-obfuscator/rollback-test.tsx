'use client';

import { useState, useEffect, useRef, useCallback, useDeferredValue } from 'react';
import { Lock, FileCode, CheckCircle, AlertCircle, Copy, Download, RefreshCw, Upload, RotateCcw, Github, X, Folder, ChevronLeft, File, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/utils';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-lua';
import 'prismjs/themes/prism-tomorrow.css';

type Preset      = 'Minify' | 'Weak' | 'Medium' | 'Strong';
type LuaVersion  = 'lua51' | 'luau';

const PRESETS: { id: Preset; label: string; desc: string }[] = [
  { id: 'Minify', label: 'Minify', desc: 'Strip whitespace & comments' },
  { id: 'Weak',   label: 'Weak',   desc: 'Basic rename & encode' },
  { id: 'Medium', label: 'Medium', desc: 'Balanced protection' },
  { id: 'Strong', label: 'Strong', desc: 'Maximum security + VM' },
];

const MAX_HL = 20_000; // disable highlighting above this char count
const WATERMARK = '--[[ Seisen Obfuscator v1.0 | Protected by Seisen ]]\n';

// Inject editor syntax colours once
const EDITOR_CSS = `
  .ob-editor .token.comment    { color: #6a9955; font-style: italic; }
  .ob-editor .token.string     { color: #ce9178; }
  .ob-editor .token.keyword    { color: #c586c0; font-weight: bold; }
  .ob-editor .token.function   { color: #dcdcaa; }
  .ob-editor .token.number     { color: #b5cea8; }
  .ob-editor .token.operator   { color: #d4d4d4; }
  .ob-editor .token.punctuation{ color: #808080; }
  .ob-editor .token.boolean    { color: #569cd6; }
  .ob-editor .token.builtin    { color: #4ec9b0; }
  .ob-editor .token.constant   { color: #4fc1ff; }
  .ob-editor textarea          { outline: none !important; caret-color: white; }
`;

export default function ObfuscatorPage() {
  const [code, setCode]                 = useState('');
  const [output, setOutput]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [preset, setPreset]             = useState<Preset>('Medium');
  const [luaVersion, setLuaVersion]     = useState<LuaVersion>('luau');
  const [fileName, setFileName]         = useState('obfuscated_script');
  const [copied, setCopied]             = useState(false);

  /* GitHub */
  const [showGithub, setShowGithub]     = useState(false);
  const [ghToken, setGhToken]           = useState('');
  const [ghRepos, setGhRepos]           = useState<any[]>([]);
  const [ghRepo, setGhRepo]             = useState<any>(null);
  const [ghPath, setGhPath]             = useState('scripts/obfuscated.lua');
  const [ghCommit, setGhCommit]         = useState('Update obfuscated script');
  const [dirPath, setDirPath]           = useState('');
  const [dirItems, setDirItems]         = useState<any[]>([]);
  const [loadingDir, setLoadingDir]     = useState(false);
  const [pushing, setPushing]           = useState(false);
  const [pushStatus, setPushStatus]     = useState<string | null>(null);

  /* Refs */
  const inputWrapRef  = useRef<HTMLDivElement>(null);
  const inputGutRef   = useRef<HTMLDivElement>(null);
  const outputAreaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Performance: defer syntax highlighting so typing never lags ── */
  const deferredCode = useDeferredValue(code);
  const highlight = useCallback((src: string) =>
    src.length < MAX_HL ? Prism.highlight(src, Prism.languages.lua, 'lua') : src,
  []);

  const inputLines  = code.split('\n').length;
  const outputLines = output.split('\n').length;

  /* Inject CSS once */
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = EDITOR_CSS;
    document.head.appendChild(el);
    return () => { document.head.contains(el) && document.head.removeChild(el); };
  }, []);

  /* Persist GitHub token */
  useEffect(() => {
    const t = localStorage.getItem('seisen_github_pat');
    if (t) setGhToken(t);
  }, []);
  useEffect(() => {
    if (ghToken) localStorage.setItem('seisen_github_pat', ghToken);
  }, [ghToken]);

  /* Sync gutter scroll */
  const syncGutter = useCallback(() => {
    if (inputWrapRef.current && inputGutRef.current)
      inputGutRef.current.scrollTop = inputWrapRef.current.scrollTop;
  }, []);

  /* Reset repo explorer on repo change */
  useEffect(() => {
    if (ghRepo) { setDirPath(''); fetchDir(ghRepo, ''); }
  }, [ghRepo]);

  /* ── Actions ── */
  const handleReset = () => { setCode(''); setOutput(''); setError(null); };

  const handleObfuscate = async () => {
    if (!code.trim()) { setError('Please enter some Lua code first'); return; }
    setLoading(true); setError(null); setOutput('');
    try {
      const res  = await fetch('/api/obfuscate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, version: luaVersion, preset }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.line) throw new Error(`Syntax error at line ${data.line}: ${data.details}`);
        throw new Error(data.error || data.details || 'Obfuscation failed');
      }
      if (data.obfuscated) setOutput(WATERMARK + data.obfuscated);
      else throw new Error('Invalid response from server');
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([output], { type: 'text/plain' }));
    a.download = fileName.endsWith('.lua') ? fileName : fileName + '.lua';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File too large (max 5MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => { if (typeof ev.target?.result === 'string') { setCode(ev.target.result); setError(null); } };
    reader.readAsText(file);
  };

  /* GitHub helpers */
  const fetchRepos = async () => {
    if (!ghToken) return;
    setLoading(true);
    try {
      const res  = await fetch('/api/github/repos', { headers: { Authorization: `Bearer ${ghToken}` } });
      const data = await res.json();
      if (res.ok) setGhRepos(data.repos); else setError(data.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchDir = async (repo: any, path: string) => {
    if (!ghToken || !repo) return;
    setLoadingDir(true);
    try {
      const owner = repo.full_name.split('/')[0];
      const res   = await fetch(`/api/github/tree?owner=${owner}&repo=${repo.name}&path=${encodeURIComponent(path)}`, {
        headers: { Authorization: `Bearer ${ghToken}` },
      });
      const data  = await res.json();
      if (res.ok) setDirItems(data.items || []);
    } catch {}
    finally { setLoadingDir(false); }
  };

  const handleNavigate = (path: string) => { setDirPath(path); fetchDir(ghRepo, path); };
  const handleGoBack   = () => {
    const parts  = dirPath.split('/');
    parts.pop();
    handleNavigate(parts.join('/'));
  };

  const handlePush = async () => {
    if (!ghToken || !ghRepo || !ghPath || !output) return;
    setPushing(true); setPushStatus('Preparing…');
    try {
      const owner  = ghRepo.full_name.split('/')[0];
      const branch = ghRepo.default_branch || 'main';
      const apiUrl = `https://api.github.com/repos/${owner}/${ghRepo.name}/contents/${ghPath}`;
      const hdrs   = { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };

      let sha: string | undefined;
      const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers: hdrs });
      if (getRes.ok) sha = (await getRes.json()).sha;

      setPushStatus('Pushing…');
      const putRes  = await fetch(apiUrl, { method: 'PUT', headers: hdrs, body: JSON.stringify({ message: ghCommit || `Update ${ghPath}`, content: btoa(unescape(encodeURIComponent(output))), branch, sha }) });
      const putData = await putRes.json();
      if (putRes.ok) { setPushStatus('Pushed!'); setTimeout(() => { setShowGithub(false); setPushStatus(null); }, 1500); }
      else throw new Error(putData.message || 'Push failed');
    } catch (e: any) { setPushStatus(`Error: ${e.message}`); }
    finally { setPushing(false); }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── Toolbar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 gap-4"
        style={{ height: '2.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'var(--bg-secondary)' }}
      >
        {/* Left: logo + version + presets */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold text-white tracking-tight">Obfuscator</span>
          </div>

          <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

          {/* Lua version */}
          <div className="flex items-center gap-1 p-0.5 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {(['lua51', 'luau'] as const).map(v => (
              <button
                key={v}
                onClick={() => setLuaVersion(v)}
                className="px-2.5 py-1 rounded text-[10px] font-bold transition-all"
                style={{ backgroundColor: luaVersion === v ? 'rgba(255,255,255,0.1)' : 'transparent', color: luaVersion === v ? 'white' : 'var(--text-muted)' }}
              >
                {v === 'lua51' ? 'Lua 5.1' : 'LuaU'}
              </button>
            ))}
          </div>

          <div className="w-px h-4 hidden md:block" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

          {/* Presets */}
          <div className="hidden md:flex items-center gap-1 p-0.5 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                title={p.desc}
                className="px-2.5 py-1 rounded text-[10px] font-bold transition-all"
                style={{ backgroundColor: preset === p.id ? 'var(--accent)' : 'transparent', color: preset === p.id ? '#000' : 'var(--text-muted)' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: reset + protect */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <Button size="sm" onClick={handleObfuscate} disabled={loading}>
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <><Lock className="w-3 h-3" /> Protect</>}
          </Button>
        </div>
      </div>

      {/* ── Editor split ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Input panel */}
        <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Tab bar */}
          <div className="shrink-0 flex items-center justify-between px-3 h-9" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <FileCode className="w-3.5 h-3.5 text-orange-400" />
              <span>input.lua</span>
              {code.length > MAX_HL && (
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308' }}>Low Latency</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCode('local msg = "Hello, Seisen!"\nprint(msg)\n\nfor i = 1, 5 do\n  print("Count: " .. i)\nend')}
                className="text-[10px] font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                Try example
              </button>
              <label className="cursor-pointer transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                <Upload className="w-3.5 h-3.5" />
                <input type="file" className="hidden" accept=".lua,.txt" onChange={handleUpload} />
              </label>
            </div>
          </div>

          {/* Editor + gutter */}
          <div className="flex flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
            <div
              ref={inputGutRef}
              className="w-10 shrink-0 pt-4 overflow-hidden select-none text-right pr-2"
              style={{ backgroundColor: '#1e1e1e', color: '#555', fontFamily: '"Fira Code", monospace', fontSize: 12, lineHeight: '20px' }}
            >
              {Array.from({ length: Math.max(inputLines, 30) }, (_, i) => (
                <div key={i} style={{ height: 20 }}>{i + 1}</div>
              ))}
            </div>
            <div
              ref={inputWrapRef}
              onScroll={syncGutter}
              className="flex-1 overflow-auto ob-editor"
            >
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={highlight}
                padding={16}
                style={{ fontFamily: '"Fira Code", monospace', fontSize: 13, lineHeight: '20px', minHeight: '100%', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
              />
            </div>
          </div>

          {/* Error toast */}
          {error && (
            <div
              className="shrink-0 flex items-start gap-2.5 px-4 py-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-400 leading-relaxed flex-1">{error}</p>
              <button onClick={() => setError(null)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Tab bar */}
          <div className="shrink-0 flex items-center justify-between px-3 h-9" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: output ? 'white' : 'var(--text-muted)' }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: output ? 'var(--accent)' : 'var(--text-muted)' }} />
              <span>obfuscated.lua</span>
            </div>
            {output && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: copied ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <div className="flex items-center rounded overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <input
                    type="text"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    className="bg-transparent text-[10px] px-2 py-1 w-28 focus:outline-none"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <button
                    onClick={handleDownload}
                    className="px-2 py-1 text-[10px] font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                  >
                    Save
                  </button>
                </div>
                <button
                  onClick={() => setShowGithub(true)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                  style={{ backgroundColor: 'rgba(45,164,78,0.15)', color: '#2da44e' }}
                >
                  <Github className="w-3 h-3" /> Push
                </button>
              </div>
            )}
          </div>

          {/* Output — plain textarea, no syntax highlighting (obfuscated = unreadable, no perf cost) */}
          <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ backgroundColor: '#1e1e1e' }}>
            <div
              className="w-10 shrink-0 pt-4 overflow-hidden select-none text-right pr-2"
              style={{ backgroundColor: '#1e1e1e', color: '#555', fontFamily: '"Fira Code", monospace', fontSize: 12, lineHeight: '20px' }}
            >
              {Array.from({ length: Math.max(outputLines, 30) }, (_, i) => (
                <div key={i} style={{ height: 20 }}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={outputAreaRef}
              readOnly
              value={output}
              className="flex-1 resize-none focus:outline-none p-4"
              style={{ fontFamily: '"Fira Code", monospace', fontSize: 13, lineHeight: '20px', backgroundColor: '#1e1e1e', color: '#d4d4d4', overflowY: 'auto' }}
            />
            {!output && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2" style={{ opacity: 0.15 }}>
                <Lock className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Output will appear here</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Obfuscating…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4"
        style={{ height: '1.5rem', backgroundColor: 'var(--accent)', color: '#000' }}
      >
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
          <span>{loading ? '⏳ Processing…' : '✓ Ready'}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
          <span>{preset}</span>
          <span>{luaVersion === 'lua51' ? 'Lua 5.1' : 'LuaU'}</span>
          <span>Ln {inputLines}</span>
        </div>
      </div>

      {/* ── GitHub Modal ── */}
      {showGithub && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Push to GitHub</span>
              </div>
              <button onClick={() => setShowGithub(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Token */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Personal Access Token</label>
                  <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noreferrer" className="text-[10px]" style={{ color: 'var(--accent)' }}>Get token ↗</a>
                </div>
                <div className="flex gap-2">
                  <input type="password" value={ghToken} onChange={e => setGhToken(e.target.value)} placeholder="ghp_…"
                    className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
                  <button onClick={fetchRepos} disabled={!ghToken || loading}
                    className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' }}>
                    {loading ? '…' : 'Connect'}
                  </button>
                </div>
              </div>

              {/* Repo select */}
              {ghRepos.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Repository</label>
                  <select onChange={e => setGhRepo(ghRepos.find(r => r.id === parseInt(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                    <option value="">Select repository…</option>
                    {ghRepos.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                  </select>
                </div>
              )}

              {/* File browser */}
              {ghRepo && (
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', height: 160 }}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      {dirPath && <button onClick={handleGoBack}><ChevronLeft className="w-3.5 h-3.5" /></button>}
                      <span className="font-mono">/{dirPath}</span>
                    </div>
                    <div className="overflow-y-auto p-1 space-y-0.5" style={{ height: 'calc(160px - 2rem)' }}>
                      {loadingDir ? (
                        <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</div>
                      ) : dirItems.length === 0 ? (
                        <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Empty</div>
                      ) : dirItems.map(item => (
                        <div key={item.path} onClick={() => item.type === 'dir' ? handleNavigate(item.path) : setGhPath(item.path)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors"
                          style={{ backgroundColor: item.path === ghPath ? 'rgba(var(--accent-rgb),0.12)' : 'transparent', color: item.path === ghPath ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {item.type === 'dir' ? <Folder className="w-3.5 h-3.5 text-yellow-500/70" /> : <File className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Target path</label>
                    <input type="text" value={ghPath} onChange={e => setGhPath(e.target.value)} placeholder="scripts/script.lua"
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Commit message</label>
                    <input type="text" value={ghCommit} onChange={e => setGhCommit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} />
                  </div>
                </div>
              )}

              {pushStatus && (
                <div className="px-3 py-2 rounded-lg text-xs font-mono break-all"
                  style={pushStatus.startsWith('Pushed') ? { backgroundColor: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)' } : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {pushStatus}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowGithub(false)} className="px-4 py-2 rounded-lg text-xs font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>Cancel</button>
              <Button size="sm" onClick={handlePush} disabled={!ghRepo || pushing}>
                {pushing && <RefreshCw className="w-3 h-3 animate-spin" />}
                {pushing ? 'Pushing…' : 'Push to GitHub'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
