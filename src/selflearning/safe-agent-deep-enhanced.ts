import * as fs from 'fs/promises';
import * as path from 'path';
import { think } from '../core/brain/index';
import { BrowserWindow } from 'electron';
import { getLumiPaths } from '../core/paths';
import * as Sanitizer from '../security/sanitizer';

type DeepAgentOptions = {
  userDataPath: string;
  watchPaths?: string[];
  intervalMs?: number;
  ratePerMinute?: number;
  deepMode?: boolean;
  readFullFile?: boolean;
  deepExtensions?: string[];
  excludeDirs?: string[];
  progressTracking?: boolean;
};

const PASSES = ['basic', 'relationships', 'edge_cases', 'architecture', 'optimization'];

function now() { return Date.now(); }

export class EnhancedDeepLearningAgent {
  private userDataPath: string;
  private watchPaths: string[];
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private stopping: boolean = false;
  private activeOps: number = 0;
  private paused = false;
  private running = false;
  private progress: Record<string, any> = {};
  private projectRoot: string;
  private capacity: number;
  private tokens: number;
  private lastRefill: number;
  private deepMode: boolean;
  private readFullFile: boolean;
  private deepExtensions: string[];
  private excludeDirs: string[];
  private progressTracking: boolean;

  constructor(opts: DeepAgentOptions) {
    this.userDataPath = opts.userDataPath;
    this.watchPaths = opts.watchPaths && opts.watchPaths.length ? opts.watchPaths : [process.cwd()];
    this.intervalMs = opts.intervalMs || (opts.deepMode ? 60_000 : 30_000);
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

    try { const base = path.join(this.userDataPath, 'self-learn'); fs.mkdir(base, { recursive: true }).catch(() => {}); } catch (_e) { }

    if (this.progressTracking) {
      const pf = path.join(this.userDataPath, 'self-learn', 'selflearn_progress.json');
      fs.readFile(pf, 'utf8').then(raw => { this.progress = this.parseProgress(raw); }).catch(() => { this.progress = {}; });
    }
  }

  status() { return { running: this.running, paused: this.paused, tokens: this.tokens, capacity: this.capacity, deepMode: this.deepMode } }

  start(sendEvent?: (payload: any) => void) {
    if (this.running) return { ok: false, error: 'already-running' };
    this.running = true; this.paused = false; this.stopping = false;
    this.timer = setInterval(() => this.tick(sendEvent).catch(() => {}), this.intervalMs) as any;
    setTimeout(() => { this.tick(sendEvent).catch(() => {}); }, 3000);
    return { ok: true };
  }

  async stop() {
    try {
      // Stop immediately: no new work, cancel timer, and exit fast.
      this.stopping = true;
      this.paused = true;
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      this.running = false;
      return { ok: true, stopped: true };
    } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
  }

  pause() { this.paused = true; return { ok: true }; }
  resume() { this.paused = false; return { ok: true }; }

  setRatePerMinute(rpm: number) { this.capacity = Math.max(1, Math.floor(rpm)); this.tokens = Math.min(this.tokens, this.capacity); return { ok: true, capacity: this.capacity }; }

  private toProgressKey(pth: string): string {
    const rel = path.relative(this.projectRoot, pth);
    const isInside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
    if (isInside) return `lumi/${rel.split(path.sep).join('/')}`;
    return `external/${path.basename(pth)}`;
  }

  private toDisplayPath(pth: string): string {
    const rel = path.relative(this.projectRoot, pth);
    const isInside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
    if (isInside) return `lumi/${rel.split(path.sep).join('/')}`;
    return `external/${path.basename(pth)}`;
  }

  private fromProgressKey(key: string): string {
    if (key.startsWith('lumi/')) {
      const rel = key.slice('lumi/'.length).split('/').join(path.sep);
      return path.join(this.projectRoot, rel);
    }
    return key;
  }

  private parseProgress(raw: string): Record<string, any> {
    try {
      const parsed = JSON.parse(raw || '{}');
      if (!parsed || typeof parsed !== 'object') return {};
      const mapped: Record<string, any> = {};
      for (const [key, value] of Object.entries(parsed)) {
        mapped[this.fromProgressKey(String(key))] = value;
      }
      return mapped;
    } catch (_e) {
      return {};
    }
  }

  private async writeProgress(pf: string): Promise<void> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(this.progress)) {
      out[this.toProgressKey(String(key))] = value;
    }
    await fs.writeFile(pf, JSON.stringify(out, null, 2), 'utf8');
  }

  private refillTokens() {
    const nowTs = now();
    const elapsedSec = Math.max(0, (nowTs - this.lastRefill) / 1000);
    const perSec = this.capacity / 60;
    const add = elapsedSec * perSec;
    if (add > 0) { this.tokens = Math.min(this.capacity, this.tokens + add); this.lastRefill = nowTs; }
  }

  private async tick(sendEvent?: (payload: any) => void) {
    if (!this.running || this.paused || this.stopping) return;
    this.refillTokens();
    for (const wp of this.watchPaths) {
      try { await this.scanPath(wp, sendEvent); } catch (_e) { }
    }
  }

  private async scanPath(pth: string, sendEvent?: (payload: any) => void) {
    try {
      if (this.stopping) return;
      try {
        const rootReal = (await fs.realpath(this.projectRoot).catch(() => path.resolve(this.projectRoot))).toString();
        const resolvedReal = (await fs.realpath(pth).catch(() => path.resolve(pth))).toString();
        const root = path.resolve(rootReal);
        const resolved = path.resolve(resolvedReal);
        const rel = path.relative(root, resolved);
        if (rel.split(path.sep)[0] === '..') return;
      } catch (_e) { return; }

      const stat = await fs.stat(pth);
      if (stat.isDirectory()) {
        const names = await fs.readdir(pth);
        for (const name of names) {
          if (this.excludeDirs.includes(name)) continue;
          await this.scanPath(path.join(pth, name), sendEvent);
        }
        return;
      }
      if (!stat.isFile()) return;

      // Skip Lumi's own knowledge/data files to avoid learning loop
      const fileName = path.basename(pth).toLowerCase();
      const EXCLUDED_FILES = [
        'lumi_knowledge.json',
        'codelumi_knowledge.json',
        'lumi_knowledge_backup.json',
        'Lumi_knowledge.json',
        'selflearn_suggestions.jsonl',
        'selflearn_audit.jsonl',
        'selflearn_store.jsonl',
        'staging.jsonl',
        'training.jsonl',
        'embeddings.json',
        'selflearn_progress.json',
        'securitycurator.tsx',
        'securitycurator.js'
      ];
      if (EXCLUDED_FILES.includes(fileName)) return;

      const ext = path.extname(pth).toLowerCase();
      if (!this.deepMode && !['.md', '.txt', '.js', '.ts', '.json', '.py', '.html', '.css'].includes(ext)) return;
      if (this.deepMode && !this.deepExtensions.includes(ext)) return;

      const mtime = stat.mtimeMs || stat.mtime.getTime();
      const key = pth;
      const prog = this.progress[key] || { mtime: 0, completedPasses: [] };
      // reset progress if file changed
      if (prog.mtime && prog.mtime < mtime) {
        prog.completedPasses = [];
      }
      if (prog.completedPasses && prog.completedPasses.length >= PASSES.length && prog.mtime >= mtime) return;
      if (this.tokens < 1 || this.stopping) return;
      this.tokens = Math.max(0, this.tokens - 1);

      let raw = await fs.readFile(pth, 'utf8');
      if (!this.readFullFile && raw.length > 64 * 1024) raw = raw.slice(0, 64 * 1024);

      // sanitize
      const redactedBase = Sanitizer.redactPII(raw);
      const redacted = redactedBase.replace(new RegExp(path.resolve(this.projectRoot).replace(/\\/g, '\\\\'), 'g'), '[PROJECT_ROOT]');

      // ensure progress object
      this.progress[key] = Object.assign(this.progress[key] || {}, { mtime, lastRead: Date.now(), completedPasses: prog.completedPasses || [] });

      // run passes sequentially but only one pass per file per tick to spread work
      const nextPass = PASSES.find(p => !this.progress[key].completedPasses.includes(p));
      if (!nextPass) {
        // nothing to do
        await this.persistProgress().catch(() => {});
        return;
      }

      // perform analysis for this pass
      this.activeOps++;
      try {
        const results = await this.performPass(nextPass, redacted, pth, ext);
        // store results
        if (results && results.length) {
          // attempt KnowledgeProcessor ingest
          try {
            const kp: any = (global as any).lumiKnowledgeProcessor;
            if (kp && typeof kp.ingest === 'function') {
              await kp.ingest(results, pth).catch(() => {});
            } else {
              // fallback write
              const kbFile = getLumiPaths().knowledgeBase;
              try { await fs.mkdir(path.dirname(kbFile), { recursive: true }); } catch (_e) { }
              let arr: any[] = [];
              try { const rawKb = await fs.readFile(kbFile, 'utf8'); arr = JSON.parse(rawKb || '[]'); } catch (_e) { arr = []; }
              for (const item of results) {
                const q = Sanitizer.redactPII(Sanitizer.sanitizeText(String(item.q || '')));
                const a = Sanitizer.redactPII(Sanitizer.sanitizeText(String(item.a || '')));
                arr.push({ q, a, source: 'deep-learning-multipass', file: this.toDisplayPath(pth), confidence: item.confidence || 0.7, learned: new Date().toISOString() });
              }
              await fs.writeFile(kbFile, JSON.stringify(arr, null, 2), 'utf8');
            }
          } catch (_e) { }
        }
        // mark pass complete
        this.progress[key].completedPasses.push(nextPass);
        this.progress[key].mtime = mtime;
        await this.persistProgress().catch(() => {});
        // emit event
        try { if (typeof sendEvent === 'function') sendEvent({ type: 'learned', file: this.toDisplayPath(pth), pass: nextPass, added: (results && results.length) || 0 }); } catch (_e) { }
      } finally { this.activeOps = Math.max(0, this.activeOps - 1); }

    } catch (_e) { /* ignore per-file errors */ }
  }

  private async performPass(pass: string, raw: string, pth: string, ext: string) {
    try {
      const baseName = path.basename(pth);
      let prompt = '';
      switch (pass) {
        case 'basic':
          prompt = `Extract up to 3 concise Q/A pairs that summarize what ${baseName} does. Return ONLY a JSON array of {q,a,confidence}.\n\nFile content:\n${raw.slice(0, 64000)}`;
          break;
        case 'relationships':
          prompt = `Identify relationships or interactions between this file and other modules. For each relationship produce a Q/A pair describing how it interacts. Return ONLY a JSON array of {q,a,confidence}.\n\nFile content:\n${raw.slice(0, 64000)}`;
          break;
        case 'edge_cases':
          prompt = `List important edge cases and error conditions for ${baseName}. For each produce a Q/A pair describing the case and how it's handled. Return ONLY a JSON array of {q,a,confidence}.\n\nFile content:\n${raw.slice(0, 64000)}`;
          break;
        case 'architecture':
          prompt = `Describe architecture, patterns, and notable design choices in ${baseName}. Return 1-3 Q/A pairs as a JSON array {q,a,confidence}.\n\nFile content:\n${raw.slice(0, 64000)}`;
          break;
        case 'optimization':
          prompt = `Suggest 2-3 concrete improvements, optimizations, or refactors for ${baseName}. Return as JSON array of {q,a,confidence}.\n\nFile content:\n${raw.slice(0, 64000)}`;
          break;
        default:
          prompt = `Extract Q/A pairs for ${baseName}. Return ONLY a JSON array.`;
      }

      let out: any = null;
      try {
        out = await think(prompt, { maxTokens: 800 });
      } catch (_e) { out = null; }

      // parse JSON array from model output
      let parsed: any = null;
      if (out && typeof out === 'string') {
        try { parsed = JSON.parse(out); } catch (_e) { parsed = null; }
        if (!Array.isArray(parsed)) {
          const fenced = String(out).match(/```json\s*([\s\S]*?)\s*```/i);
          if (fenced && fenced[1]) {
            try { parsed = JSON.parse(fenced[1]); } catch (_e) { parsed = null; }
          }
        }
        if (!Array.isArray(parsed)) {
          const first = String(out).indexOf('[');
          const last = String(out).lastIndexOf(']');
          if (first !== -1 && last !== -1 && last > first) {
            try { parsed = JSON.parse(String(out).slice(first, last + 1)); } catch (_e) { parsed = null; }
          }
        }
      }

      let candidates: any[] = [];
      if (Array.isArray(parsed) && parsed.length) {
        candidates = parsed.slice(0, 6).map((it: any) => ({ q: String(it.q || '').trim(), a: String(it.a || '').trim(), confidence: typeof it.confidence === 'number' ? it.confidence : 0.7 }));
      }

      // Fallback to heuristics
      if (!candidates.length) {
        try {
          // minimal local heuristic: look for headings, docstrings, TODOs
          const local: any[] = [];
          const lines = raw.split(/\r?\n/);
          const h = lines.find(l => /^#\s+/.test(l) || /^\/\*\*/.test(l));
          if (h) local.push({ q: `What is ${baseName} about?`, a: h.replace(/^#\s+/, '').slice(0, 400), confidence: 0.45 });
          const todo = lines.find(l => /TODO|FIXME/.test(l));
          if (todo) local.push({ q: `Are there TODOs in ${baseName}?`, a: todo.trim().slice(0, 400), confidence: 0.35 });
          candidates = local.slice(0, 3);
        } catch (_e) { candidates = []; }
      }

      return candidates.filter((c: any) => c.q && c.a);
    } catch (e: any) { return []; }
  }

  private async persistProgress() {
    if (!this.progressTracking) return;
    try {
      const pf = path.join(this.userDataPath, 'self-learn', 'selflearn_progress.json');
      await fs.mkdir(path.dirname(pf), { recursive: true }).catch(() => {});
      await this.writeProgress(pf);
    } catch (_e) { }
  }
}

export default EnhancedDeepLearningAgent;
