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

function now() { return Date.now(); }

export class DeepLearningAgent {
  private userDataPath: string;
  private watchPaths: string[];
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private stopping: boolean = false;
  private activeOps: number = 0;
  private paused = false;
  private running = false;
  private seen: Record<string, number> = {};
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

    // ensure a dedicated self-learn folder under userData
    try { const base = path.join(this.userDataPath, 'self-learn'); fs.mkdir(base, { recursive: true }).catch(() => {}); } catch (_e) { }

    if (this.progressTracking) {
      const pf = path.join(this.userDataPath, 'selflearn_progress.json');
      fs.readFile(pf, 'utf8').then(raw => { try { this.progress = JSON.parse(raw || '{}'); } catch (_e) { this.progress = {}; } }).catch(() => { this.progress = {}; });
    }
  }

  status() { return { running: this.running, paused: this.paused, tokens: this.tokens, capacity: this.capacity, deepMode: this.deepMode } }

  start(sendEvent?: (payload: any) => void) {
    if (this.running) return { ok: false, error: 'already-running' };
    this.running = true; this.paused = false; this.stopping = false;
    this.timer = setInterval(() => this.tick(sendEvent).catch(() => {}), this.intervalMs) as any;
    // initial delayed warm-up so UI can settle
    setTimeout(() => { this.tick(sendEvent).catch(() => {}); }, 5000);
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
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  pause() { this.paused = true; return { ok: true }; }
  resume() { this.paused = false; return { ok: true }; }

  setRatePerMinute(rpm: number) { this.capacity = Math.max(1, Math.floor(rpm)); this.tokens = Math.min(this.tokens, this.capacity); return { ok: true, capacity: this.capacity }; }

  async getProgress() {
    try {
      if (!this.progressTracking) return { ok: false, error: 'progress-disabled' };
      const pf = path.join(this.userDataPath, 'selflearn_progress.json');
      const raw = await fs.readFile(pf, 'utf8');
      return { ok: true, progress: JSON.parse(raw || '{}') };
    } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
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
      // ensure inside project
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

      const ext = path.extname(pth).toLowerCase();
      if (!this.deepMode && !['.md', '.txt', '.js', '.ts', '.json', '.py', '.html', '.css'].includes(ext)) return;
      if (this.deepMode && !this.deepExtensions.includes(ext)) return;

      const mtime = stat.mtimeMs || stat.mtime.getTime();
      if (this.seen[pth] && this.seen[pth] >= mtime) return;
      if (this.tokens < 1 || this.stopping) return;
      this.tokens = Math.max(0, this.tokens - 1);

      let raw = await fs.readFile(pth, 'utf8');
      if (!this.readFullFile && raw.length > 64 * 1024) raw = raw.slice(0, 64 * 1024);

      // sanitize
      const redacted = raw.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]')
        .replace(new RegExp(path.resolve(this.projectRoot).replace(/\\/g,'\\\\'), 'g'), '[PROJECT_ROOT]')
        .replace(/\\\\[^\s\\/]+\\[^\s]+/g, '[REDACTED_PATH]')
        .replace(/[A-Z]:\\[\\\S\s]*/g, '[REDACTED_PATH]')
        .replace(/\/(Users|home)\/[^\s/]+\/[^\s]*/g, '/[REDACTED_PATH]');

      const excerpt = redacted.slice(0, 8000);
      const entry = { id: `deep_${Date.now()}_${Math.random().toString(16).slice(2,8)}`, path: pth.replace(this.projectRoot, '[PROJECT_ROOT]'), excerpt, mtime, date: new Date().toISOString() };

      const base = path.join(this.userDataPath, 'self-learn');
      const auditFile = path.join(base, 'selflearn_audit.jsonl');
      const storeFile = path.join(base, 'selflearn_store.jsonl');
      await fs.appendFile(auditFile, JSON.stringify(entry) + '\n', 'utf8');
      await fs.appendFile(storeFile, JSON.stringify(entry) + '\n', 'utf8');

      // progress
      if (this.progressTracking) {
        try { this.progress[pth] = Object.assign(this.progress[pth] || {}, { lastRead: Date.now(), completed: true, analyzed: true });
          const pf = path.join(this.userDataPath, 'self-learn', 'selflearn_progress.json');
          await fs.writeFile(pf, JSON.stringify(this.progress, null, 2), 'utf8'); } catch (_e) { }
      }

      this.seen[pth] = mtime;

      // deeper analysis placeholder (AST hooks, complexity analysis)
      let suggestions: any[] = [];
      try {
        suggestions = this.analyzeDeep(raw, pth, ext);
      } catch (_e) { suggestions = []; }

      // Attempt knowledge extraction using LLM and persist into memory/KB
      try {
        if (this.stopping) return;
        this.activeOps++;
        await this.generateKnowledge(raw, pth, ext);
        try { if (!this.stopping) await this.generateSuggestions(raw, pth); } catch (_e) { }
      } catch (_e) { /* don't block learning on KB failures */ }
      finally { this.activeOps = Math.max(0, this.activeOps - 1); }

      if (suggestions && suggestions.length) {
        const sugFile = getLumiPaths().stagingFile;
        await fs.mkdir(path.dirname(sugFile), { recursive: true }).catch(() => {});
        for (const s of suggestions) {
          const out = Object.assign({ id: `sug_${Date.now()}_${Math.random().toString(16).slice(2,6)}`, path: pth, date: new Date().toISOString() }, s);
          try {
            const { appendStagingUnique } = await import('../core/security/staging-utils.js');
            await appendStagingUnique(sugFile, out, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
          } catch (_e) {
            await fs.appendFile(sugFile, JSON.stringify({ id: out.id, path: out.path, date: out.date, line: out.line || null, message: out.message || out.suggestion || '[no-message]', severity: out.severity || out.priority || 'info' }) + '\n', 'utf8');
          }
        }
        if (typeof sendEvent === 'function') sendEvent({ type: 'suggestion', path: pth, suggestions });
      }

      if (typeof sendEvent === 'function') sendEvent({ type: 'learned', entry });

    } catch (_e) { /* ignore */ }
  }

  // Generate suggestions (improvements/enhancements) using LLM and persist as suggestions
  private async generateSuggestions(raw: string, pth: string): Promise<void> {
    try {
      if (this.stopping) return;
      const excerpt = raw.slice(0, 2400);
      const prompt = `Analyze this code and suggest 2-3 improvements or enhancements. Return ONLY a JSON array:\n[{"suggestion":"brief suggestion","priority":"high|medium|low","reasoning":"why"}]\n\nCode from ${path.basename(pth)}:\n${excerpt}`;

      const response = await think(prompt, { maxTokens: 600 });
      if (this.stopping) return;
      // Parse suggestions
      let suggestions: any[] = [];
      try {
        let jsonStr = String(response || '').trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) jsonStr = arrayMatch[0];
        suggestions = JSON.parse(jsonStr);
      } catch (e) {
        console.warn(`[DeepAgent] Failed to parse suggestions JSON for ${path.basename(pth)}`);
        return;
      }

      if (!Array.isArray(suggestions) || suggestions.length === 0) return;

      const suggestionsFile = getLumiPaths().stagingFile;
      await fs.mkdir(path.dirname(suggestionsFile), { recursive: true }).catch(() => {});
      for (const s of suggestions) {
        const entry = { id: `sug_${Date.now()}_${Math.random().toString(36).substring(7)}`, timestamp: new Date().toISOString(), file: pth, suggestion: s.suggestion || '', priority: s.priority || 'medium' };
        try {
          const { appendStagingUnique } = await import('../core/security/staging-utils.js');
          await appendStagingUnique(suggestionsFile, entry, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
        } catch (_e) {
          try { await fs.appendFile(suggestionsFile, JSON.stringify({ id: entry.id, path: entry.file || '', date: entry.timestamp || new Date().toISOString(), line: null, message: entry.suggestion || '[no-message]', severity: entry.priority || 'info' }) + '\n', 'utf8'); } catch (_e2) { }
        }
      }

      console.log(`[DeepAgent] 💡 Generated ${suggestions.length} suggestions for ${path.basename(pth)}`);
      try {
        const bw = BrowserWindow.getAllWindows()[0];
        if (bw?.webContents) bw.webContents.send('lumi-learning-event', { type: 'suggestions', file: pth, suggestions });
      } catch (_e) { }
    } catch (e: any) {
      console.error(`[DeepAgent] Suggestion generation failed:`, e?.message || e);
    }
  }

  // richer heuristics for deep analysis (placeholder - extend with AST parsers if desired)
  private analyzeDeep(raw: string, pth: string, ext: string) {
    const suggestions: any[] = [];
    const lines = raw.split(/\r?\n/);
    lines.forEach((ln, i) => {
      const lnum = i + 1;
      if (/TODO|FIXME/.test(ln)) suggestions.push({ line: lnum, message: 'Found TODO/FIXME', severity: 'info' });
      if (/console\.log\(/.test(ln)) suggestions.push({ line: lnum, message: 'console.log detected', severity: 'info' });
      if (ln.length > 300) suggestions.push({ line: lnum, message: 'Very long line (>300 chars)', severity: 'info' });
    });
    if (ext === '.json') { try { JSON.parse(raw); } catch (e: any) { suggestions.push({ line: 1, message: 'JSON parse error: ' + e?.message, severity: 'warning' }); } }
    return suggestions;
  }

  // Use LLM to extract Q/A knowledge from a file. Persist to memory store or fallback files.
  private async generateKnowledge(raw: string, pth: string, ext: string) {
    console.log(`[DeepAgent] generateKnowledge called for: ${pth}`);
    try {
      if (this.stopping) return;
      const prompt = `Extract up to 3 concise Q/A pairs that capture the important responsibilities and behavior of the following file. Return ONLY a JSON array of objects with keys: q, a, confidence (0-1). File path: ${pth}\n\n----\n\n${raw.slice(0, 64_000)}`;
      const out = await think(prompt, { maxTokens: 800 });
      if (this.stopping) return;
      console.log(`[DeepAgent] Ollama returned length=${String(out || '').length}`);

      // Try several parsing strategies
      let parsed: any = null;
      try { parsed = JSON.parse(out); } catch (_e) { parsed = null; }
      if (!Array.isArray(parsed)) {
        const fenced = out.match(/```json\s*([\s\S]*?)\s*```/i);
        if (fenced && fenced[1]) {
          try { parsed = JSON.parse(fenced[1]); } catch (_e) { parsed = null; }
        }
      }
      if (!Array.isArray(parsed)) {
        const first = out.indexOf('[');
        const last = out.lastIndexOf(']');
        if (first !== -1 && last !== -1 && last > first) {
          const sub = out.slice(first, last + 1);
          try { parsed = JSON.parse(sub); } catch (_e) { parsed = null; }
        }
      }

      if (!Array.isArray(parsed) || !parsed.length) {
        console.warn('[DeepAgent] No valid JSON array parsed from model output');
        return;
      }

      const candidates = parsed.slice(0, 3).map((it: any) => ({ q: String(it.q || '').trim(), a: String(it.a || '').trim(), confidence: typeof it.confidence === 'number' ? it.confidence : 0.8 }));
      console.log(`[DeepAgent] Parsed ${candidates.length} candidate(s)`);

      const valid = candidates.filter(c => c.q && c.a);
      if (!valid.length) { console.warn('[DeepAgent] No non-empty Q/A candidates'); return; }

      // Store via KnowledgeProcessor if available
      try {
        if (this.stopping) return;
        const kp: any = (global as any).lumiKnowledgeProcessor;
        if (kp && typeof kp.ingest === 'function') {
          console.log('[DeepAgent] Calling KnowledgeProcessor.ingest with', valid.length, 'candidates');
          const res = await kp.ingest(valid, pth);
          if (res && res.ok) {
            console.log(`[DeepAgent] ✅ Stored ${res.added} entries from ${path.basename(pth)}`);
            return;
          } else {
            console.warn('[DeepAgent] KnowledgeProcessor.ingest returned error', res && res.error);
          }
        } else {
          console.warn('[DeepAgent] KnowledgeProcessor not available on global');
        }
      } catch (e: any) {
        console.error('[DeepAgent] Error calling KnowledgeProcessor.ingest:', e?.message || e);
      }

      // Fallback: write into userData/self-learn and top-level files
      try {
        const kbFile = getLumiPaths().knowledgeBase;
        try { await fs.mkdir(path.dirname(kbFile), { recursive: true }); } catch (_e) { }
        let arr: any[] = [];
        try { const rawKb = await fs.readFile(kbFile, 'utf8'); arr = JSON.parse(rawKb || '[]'); } catch (_e) { arr = []; }
        for (const item of valid) {
          if (!item.q || !item.a) continue;
          const q = Sanitizer.redactPII(Sanitizer.sanitizeText(String(item.q || '')));
          const a = Sanitizer.redactPII(Sanitizer.sanitizeText(String(item.a || '')));
          arr.push({ q, a, source: 'deep-learning', file: pth.replace(this.projectRoot, '[PROJECT_ROOT]'), confidence: item.confidence, learned: new Date().toISOString() });
        }
        await fs.writeFile(kbFile, JSON.stringify(arr, null, 2), 'utf8');
        try { const repoTraining = getLumiPaths().trainingDir; await fs.mkdir(repoTraining, { recursive: true }); const trainingFile = path.join(repoTraining, 'lumi_knowledge.json'); await fs.writeFile(trainingFile, JSON.stringify(arr, null, 2), 'utf8'); } catch (_e) { }
        console.log(`[DeepAgent] Fallback wrote ${valid.length} entries to ${kbFile}`);
      } catch (e:any) { console.error('[DeepAgent] Fallback KB write failed:', e?.message || e); }

    } catch (e: any) {
      console.error('[DeepAgent] generateKnowledge failed:', e?.message || e);
    }
  }
}

export default DeepLearningAgent;
