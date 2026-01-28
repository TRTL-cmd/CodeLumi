import * as fs from 'fs/promises';
import * as path from 'path';

type AgentOptions = {
  userDataPath: string;
  watchPaths?: string[];
  intervalMs?: number;
  ratePerMinute?: number;
  // deep mode options
  deepMode?: boolean;
  readFullFile?: boolean;
  deepExtensions?: string[];
  excludeDirs?: string[];
  progressTracking?: boolean;
};

function now() { return Date.now(); }

export class SelfLearningAgent {
  private userDataPath: string;
  private watchPaths: string[];
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private paused = false;
  private running = false;
  private seen: Record<string, number> = {};
  private progress: Record<string, any> = {};
  private projectRoot: string;
  private deepMode: boolean;
  private readFullFile: boolean;
  private deepExtensions: string[];
  private excludeDirs: string[];
  private progressTracking: boolean;

  // simple token-bucket
  private capacity: number;
  private tokens: number;
  private lastRefill: number;

  constructor(opts: AgentOptions) {
    this.userDataPath = opts.userDataPath;
    this.watchPaths = opts.watchPaths && opts.watchPaths.length ? opts.watchPaths : [process.cwd()];
    this.intervalMs = opts.intervalMs || 30_000;
    // deep mode defaults
    this.deepMode = !!opts.deepMode;
    this.readFullFile = opts.readFullFile !== undefined ? !!opts.readFullFile : !!this.deepMode;
    this.deepExtensions = opts.deepExtensions || ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json'];
    this.excludeDirs = opts.excludeDirs || ['node_modules', '.git', 'dist', 'build', 'release', 'vendor'];
    this.progressTracking = !!opts.progressTracking;

    const rpm = opts.ratePerMinute || (this.deepMode ? 6 : 60);
    this.capacity = Math.max(1, rpm);
    this.tokens = this.capacity;
    this.lastRefill = now();
    this.projectRoot = path.resolve(process.cwd());

    // load progress if present
    if (this.progressTracking) {
      const pf = path.join(this.userDataPath, 'selflearn_progress.json');
      try {
        fs.readFile(pf, 'utf8').then(raw => { try { this.progress = JSON.parse(raw || '{}'); } catch (_e) { this.progress = {}; } }).catch(() => { this.progress = {}; });
      } catch (_e) { this.progress = {}; }
    }
  }

  status() {
    return { running: this.running, paused: this.paused, tokens: this.tokens, capacity: this.capacity };
  }

  start(sendEvent?: (payload: any) => void) {
    if (this.running) return { ok: false, error: 'already-running' };
    this.running = true;
    this.paused = false;
    this.timer = setInterval(() => this.tick(sendEvent).catch(() => {}), this.intervalMs) as any;
    // initial run
    this.tick(sendEvent).catch(() => {});
    return { ok: true };
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.running = false;
    return { ok: true };
  }

  pause() {
    this.paused = true;
    return { ok: true };
  }

  resume() {
    this.paused = false;
    return { ok: true };
  }

  setRatePerMinute(rpm: number) {
    this.capacity = Math.max(1, Math.floor(rpm));
    this.tokens = Math.min(this.tokens, this.capacity);
    return { ok: true, capacity: this.capacity };
  }

  async undo(count = 1) {
    try {
      const audit = path.join(this.userDataPath, 'selflearn_audit.jsonl');
      const raw = await fs.readFile(audit, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean);
      if (lines.length === 0) return { ok: false, error: 'nothing-to-undo' };
      const removed: any[] = [];
      for (let i = 0; i < count && lines.length; i++) {
        const last = lines.pop();
        if (!last) break;
        try { removed.push(JSON.parse(last)); } catch (_e) { }
      }
      await fs.writeFile(audit, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
      // record undo audit
      const undoFile = path.join(this.userDataPath, 'selflearn_undo.jsonl');
      for (const r of removed) await fs.appendFile(undoFile, JSON.stringify({ undoneAt: new Date().toISOString(), item: r }) + '\n', 'utf8');
      return { ok: true, removedCount: removed.length };
    } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
  }

  async reset() {
    try {
      const audit = path.join(this.userDataPath, 'selflearn_audit.jsonl');
      const store = path.join(this.userDataPath, 'selflearn_store.jsonl');
      await fs.unlink(audit).catch(() => {});
      await fs.unlink(store).catch(() => {});
      this.seen = {};
      return { ok: true };
    } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
  }

  private refillTokens() {
    const nowTs = now();
    const elapsedSec = Math.max(0, (nowTs - this.lastRefill) / 1000);
    const perSec = this.capacity / 60;
    const add = elapsedSec * perSec;
    if (add > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + add);
      this.lastRefill = nowTs;
    }
  }

  private async tick(sendEvent?: (payload: any) => void) {
    if (!this.running || this.paused) return;
    this.refillTokens();
    // simple scan: for each watchPath, recursively list files and process eligible ones
    for (const wp of this.watchPaths) {
      try {
        await this.scanPath(wp, sendEvent);
      } catch (e) { /* ignore per-path errors */ }
    }
  }

  private async scanPath(pth: string, sendEvent?: (payload: any) => void) {
    try {
      // safety: only operate within project root (robust check)
      try {
        const rootReal = (await fs.realpath(this.projectRoot).catch(() => path.resolve(this.projectRoot))).toString();
        const resolvedReal = (await fs.realpath(pth).catch(() => path.resolve(pth))).toString();
        const root = path.resolve(rootReal);
        const resolved = path.resolve(resolvedReal);
        const rel = path.relative(root, resolved);
        if (rel === '') {
          // same path — allowed
        } else if (rel.split(path.sep)[0] === '..') {
          return; // escapes project root
        }
      } catch (_e) { return; }
      const stat = await fs.stat(pth);
      if (stat.isDirectory()) {
        const names = await fs.readdir(pth);
        for (const name of names) {
          // skip configured exclude dirs
          if (this.excludeDirs.includes(name)) continue;
          await this.scanPath(path.join(pth, name), sendEvent);
        }
        return;
      }
      if (!stat.isFile()) return;
      // only process allowed extensions (deep vs quick)
      const ext = path.extname(pth).toLowerCase();
      const allowedQuick = ['.md', '.txt', '.js', '.ts', '.json', '.py', '.html', '.css'];
      const allowed = this.deepMode ? this.deepExtensions : allowedQuick;
      if (!allowed.includes(ext)) return;
      const mtime = stat.mtimeMs || stat.mtime.getTime();
      const key = `${pth}:${mtime}`;
      if (this.seen[pth] && this.seen[pth] >= mtime) return; // already processed

      if (this.tokens < 1) return; // rate limit
      // consume a token
      this.tokens = Math.max(0, this.tokens - 1);

      // read file (full if deepMode/readFullFile, else up to 64KB)
      let raw = await fs.readFile(pth, 'utf8');
      if (!this.readFullFile && raw.length > 64 * 1024) raw = raw.slice(0, 64 * 1024);
      // sanitize excerpt: redact emails and absolute paths
      const redacted = raw.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]')
            .replace(new RegExp(path.resolve(this.projectRoot).replace(/\\/g,'\\\\'), 'g'), '[PROJECT_ROOT]')
            .replace(/[A-Z]:\\[\\\S\s]*/g, '[REDACTED_PATH]');
      const excerpt = redacted.slice(0, 2000);
      const entry = { id: `selflearn_${Date.now()}_${Math.random().toString(16).slice(2,8)}`, path: pth.replace(this.projectRoot, '[PROJECT_ROOT]'), excerpt, mtime, date: new Date().toISOString() };
      // append to audit and store
      const auditFile = path.join(this.userDataPath, 'selflearn_audit.jsonl');
      const storeFile = path.join(this.userDataPath, 'selflearn_store.jsonl');
      await fs.appendFile(auditFile, JSON.stringify(entry) + '\n', 'utf8');
      await fs.appendFile(storeFile, JSON.stringify(entry) + '\n', 'utf8');
      // update progress tracking
      if (this.progressTracking) {
        try {
          this.progress[pth] = Object.assign(this.progress[pth] || {}, { lastRead: Date.now(), completed: true, analyzed: true });
          const pf = path.join(this.userDataPath, 'selflearn_progress.json');
          await fs.writeFile(pf, JSON.stringify(this.progress, null, 2), 'utf8');
        } catch (_e) { }
      }
      this.seen[pth] = mtime;
      // generate passive suggestions (no automatic changes)
      try {
        const suggestions = this.analyzeFile(raw, pth, path.extname(pth).toLowerCase());
        if (suggestions && suggestions.length) {
          const sugFile = path.join(this.userDataPath, 'selflearn_suggestions.jsonl');
          const outs: any[] = [];
          for (const s of suggestions) {
            const maskedPath = pth.replace(this.projectRoot, '[PROJECT_ROOT]');
            const out = Object.assign({ id: `sug_${Date.now()}_${Math.random().toString(16).slice(2,6)}`, path: maskedPath, date: new Date().toISOString() }, s);
            outs.push(out);
            await fs.appendFile(sugFile, JSON.stringify(out) + '\n', 'utf8');
          }
          if (typeof sendEvent === 'function') {
            try { sendEvent({ type: 'suggestion', path: pth, suggestions: outs }); } catch (_e) { }
          }
        }
      } catch (e) { /* suggestion generation shouldn't block learning */ }
      if (typeof sendEvent === 'function') {
        try { sendEvent({ type: 'learned', entry }); } catch (_e) { }
      }
    } catch (e) { /* ignore file errors */ }
  }

  // Lightweight heuristic analyzer that returns passive suggestions.
  private analyzeFile(raw: string, pth: string, ext: string) {
    const suggestions: any[] = [];
    const lines = raw.split(/\r?\n/);
    // common patterns
    lines.forEach((ln, i) => {
      const lnum = i + 1;
      if (/TODO|FIXME/.test(ln)) suggestions.push({ line: lnum, message: 'Found TODO/FIXME comment', severity: 'info' });
      if (/console\.log\(/.test(ln)) suggestions.push({ line: lnum, message: 'console.log found — consider removing or using logger', severity: 'info' });
      if (/\bvar\s+\w+/.test(ln)) suggestions.push({ line: lnum, message: 'Uses var — prefer let/const', severity: 'info' });
      if (/==[^=]/.test(ln)) suggestions.push({ line: lnum, message: 'Use === instead of ==', severity: 'info' });
      if (ext === '.ts' && /:\s*any\b/.test(ln)) suggestions.push({ line: lnum, message: 'Uses `any` type — consider stronger typing', severity: 'info' });
      if (ln.length > 240) suggestions.push({ line: lnum, message: 'Long line (>240 chars) — consider wrapping', severity: 'info' });
    });

    // file-level checks
    if (ext === '.js' || ext === '.ts') {
      if (/\/\*\s*eslint-disable/.test(raw)) suggestions.push({ line: 1, message: 'ESLint disabled in file — review', severity: 'info' });
    }
    if (ext === '.json') {
      try { JSON.parse(raw); } catch (e: any) { suggestions.push({ line: 1, message: `JSON parse error: ${e?.message}`, severity: 'warning' }); }
    }

    return suggestions;
  }
}

export default SelfLearningAgent;
