import * as fs from 'fs/promises';
import * as path from 'path';
import MemoryStore from '../memory/store';
import * as crypto from 'crypto';
import { BrowserWindow } from 'electron';
import * as Threat from '../../security/threat_detection';
import { getLumiPaths, LumiPaths } from '../paths';

type Candidate = { q: string; a: string; confidence?: number };

export default class KnowledgeProcessor {
  private userDataPath: string;
  private kbFile: string;
  private baseDir: string;
  private kbFileInFolder: string;
  private repoTrainingDir: string;
  private memory: MemoryStore | null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(userDataPathOrPaths?: string | LumiPaths) {
    // Support both old API (userDataPath string) and new API (LumiPaths object)
    if (typeof userDataPathOrPaths === 'string') {
      // Legacy: keep old behavior for backward compatibility
      this.userDataPath = userDataPathOrPaths;
      this.kbFile = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
      this.baseDir = path.join(this.userDataPath, 'self-learn');
      this.kbFileInFolder = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
      this.repoTrainingDir = path.join(process.cwd(), 'training');
      try { this.memory = new MemoryStore(this.userDataPath); } catch (_e) { this.memory = null as any; }
    } else {
      // New: use centralized paths
      const lumiPaths = userDataPathOrPaths || getLumiPaths();
      this.userDataPath = lumiPaths.appDataPath;
      this.kbFile = lumiPaths.knowledgeBase;
      this.baseDir = path.join(lumiPaths.projectUserDataDir, 'self-learn');
      this.kbFileInFolder = lumiPaths.knowledgeBase;
      this.repoTrainingDir = lumiPaths.trainingDir;
      try { this.memory = new MemoryStore(); } catch (_e) { this.memory = null as any; }
    }
  }

  // sanitize file path for logging to avoid leaking user home or drive-prefixed paths
  private redactPathForLog(p: string) {
    try{
      if(!p) return p;
      const replaced = String(p).replace(new RegExp(process.cwd().replace(/\\/g,'\\\\'),'g'), '[PROJECT_ROOT]').replace(/[A-Za-z]:\\\\[^"\n\r]*/g, '[REDACTED_PATH]');
      return replaced;
    }catch(_){ return p; }
  }

  // sanitize/redact PII before persisting
  private redact(text: string) {
    if (!text || typeof text !== 'string') return text;
    let t = text;
    // redact emails
    t = t.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]');
    // redact absolute Windows paths
    t = t.replace(/[A-Za-z]:\\[\\\S\s]*/g, '[REDACTED_PATH]');
    // redact unix-like absolute paths
    t = t.replace(/\/(?:[\w\-.]+\/)*[\w\-.]+/g, (m) => m.length > 120 ? '[REDACTED_PATH]' : m);
    // redact probable personal names (Two capitalized words)
    t = t.replace(/\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/g, '[REDACTED_NAME]');
    return t;
  }

  // Simple local embedding: hashed-token bag-of-words into fixed-size numeric vector
  private async computeEmbedding(text: string, dim = 128): Promise<number[]> {
    const vec = new Array(dim).fill(0);
    if (!text) return vec;
    const toks = String(text).toLowerCase().split(/\W+/).filter(Boolean);
    for (const t of toks) {
      const h = crypto.createHash('sha1').update(t).digest();
      const idx = h.readUInt16BE(0) % dim;
      vec[idx] += 1;
    }
    let sum = 0;
    for (let i = 0; i < dim; i++) sum += vec[i] * vec[i];
    if (sum > 0) {
      const norm = Math.sqrt(sum);
      for (let i = 0; i < dim; i++) vec[i] = vec[i] / norm;
    }
    return vec;
  }

  private cosineSim(a: number[], b: number[]) {
    if (!a || !b || a.length !== b.length) return 0;
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0);
    return s;
  }

  private async loadKbEntries(): Promise<any[]> {
    try {
      const raw = await fs.readFile(this.kbFile, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.qa)) return parsed.qa;
      return [];
    } catch (_e) {
      return [];
    }
  }

  private async writeKbEntries(entries: any[]) {
    await fs.writeFile(this.kbFile, JSON.stringify(entries, null, 2), 'utf8');

    try {
      const repoKb = path.join(this.repoTrainingDir, 'lumi_knowledge.json');
      await fs.mkdir(this.repoTrainingDir, { recursive: true });
      await fs.writeFile(repoKb, JSON.stringify(entries, null, 2), 'utf8');
    } catch (_e) { }

    try {
      const repoTraining = path.join(process.cwd(), 'training');
      await fs.mkdir(repoTraining, { recursive: true });
      const trainingFile = path.join(repoTraining, 'lumi_knowledge.json');
      const sanitized = (entries || []).map((e: any) => {
        const copy: any = Object.assign({}, e);
        try { copy.file = copy.file ? path.basename(String(copy.file)) : '[REDACTED]'; } catch (_){ copy.file = '[REDACTED]'; }
        try { copy.q = this.redact(String(copy.q || '')); } catch (_){ }
        try { copy.a = this.redact(String(copy.a || '')); } catch (_){ }
        return copy;
      });
      await fs.writeFile(trainingFile, JSON.stringify(sanitized, null, 2), 'utf8');
    } catch (_e) { }
  }

  private parseEntryTimestamp(entry: any, keys: string[]): number | null {
    for (const key of keys) {
      const v = entry ? entry[key] : null;
      if (!v) continue;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const t = Date.parse(v);
        if (!Number.isNaN(t)) return t;
      }
    }
    return null;
  }

  async pruneByConfidence(threshold: number, daysOld: number) {
    try {
      const minConfidence = Number.isFinite(threshold) ? threshold : 0.6;
      const ageDays = Math.max(1, Number(daysOld) || 30);
      const cutoff = Date.now() - ageDays * 24 * 60 * 60 * 1000;

      const existing = await this.loadKbEntries();
      const kept: any[] = [];
      const removed: any[] = [];

      for (const entry of existing) {
        const conf = typeof entry?.confidence === 'number' ? entry.confidence : 1;
        const learnedAt = this.parseEntryTimestamp(entry, ['learned', 'date', 'timestamp', 'createdAt']);
        const isOld = learnedAt ? learnedAt <= cutoff : false;
        if (conf < minConfidence && isOld) removed.push(entry);
        else kept.push(entry);
      }

      await this.writeKbEntries(kept);

      try {
        const auditFile = path.join(this.repoTrainingDir, 'selflearn_audit.jsonl');
        const auditEntry = {
          timestamp: new Date().toISOString(),
          type: 'kb-prune',
          removedCount: removed.length,
          remaining: kept.length,
          threshold: minConfidence,
          daysOld: ageDays
        };
        await fs.appendFile(auditFile, JSON.stringify(auditEntry) + '\n', 'utf8');
      } catch (_e) { }

      return { ok: true, removedCount: removed.length, remaining: kept.length };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  async detectStaleEntries(unusedDays: number) {
    try {
      const ageDays = Math.max(1, Number(unusedDays) || 30);
      const cutoff = Date.now() - ageDays * 24 * 60 * 60 * 1000;
      const existing = await this.loadKbEntries();

      const stale = existing.map((entry, index) => {
        const lastUsed = this.parseEntryTimestamp(entry, [
          'lastUsed', 'last_used', 'usedAt', 'used_at', 'accessedAt', 'updatedAt'
        ]);
        const learnedAt = this.parseEntryTimestamp(entry, ['learned', 'date', 'timestamp', 'createdAt']);
        const isStale = lastUsed ? lastUsed <= cutoff : (learnedAt ? learnedAt <= cutoff : false);
        if (!isStale) return null;
        return {
          index,
          q: entry?.q,
          a: entry?.a,
          confidence: entry?.confidence,
          learned: entry?.learned || entry?.date || null,
          lastUsed: entry?.lastUsed || entry?.usedAt || entry?.accessedAt || null,
          reason: lastUsed ? 'last-used-old' : 'no-usage-data'
        };
      }).filter(Boolean) as any[];

      return { ok: true, staleCount: stale.length, stale, days: ageDays };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e), stale: [] };
    }
  }

  scheduledCleanup(opts?: { threshold?: number; daysOld?: number; unusedDays?: number; intervalMs?: number }) {
    if (this.cleanupTimer) return { ok: true, running: true };
    const threshold = typeof opts?.threshold === 'number' ? opts?.threshold : 0.6;
    const daysOld = typeof opts?.daysOld === 'number' ? opts?.daysOld : 30;
    const intervalMs = typeof opts?.intervalMs === 'number' ? opts?.intervalMs : 7 * 24 * 60 * 60 * 1000;

    const run = async () => {
      try { await this.pruneByConfidence(threshold, daysOld); } catch (_e) { }
      try { await this.detectStaleEntries(opts?.unusedDays ?? 45); } catch (_e) { }
    };

    setTimeout(run, 2000);
    this.cleanupTimer = setInterval(run, intervalMs);
    return { ok: true, running: true };
  }

  // idempotent ingest: avoids duplicate Qs (simple dedupe by question text+file)
  async ingest(candidates: Candidate[], filePath: string) {
    console.log(`[KnowledgeProcessor] 📥 Starting ingest for ${path.basename(filePath || '')} with ${candidates.length} candidates`);
    
    try {
      let existing: any[] = [];
      try {
        const raw = await fs.readFile(this.kbFile, 'utf8');
        console.log(`[KnowledgeProcessor] 📖 Read existing KB, length: ${raw.length}`);
        const parsed = JSON.parse(raw || '[]');
        // Handle both old format {"qa": [...]} and new format [...]
        if (Array.isArray(parsed)) existing = parsed;
        else if (parsed && Array.isArray(parsed.qa)) existing = parsed.qa;
        else existing = [];
        console.log(`[KnowledgeProcessor] 📚 Existing entries: ${existing.length}`);
      } catch (e: any) {
        console.log(`[KnowledgeProcessor] ℹ️ No existing KB file (${e.code}), starting fresh`);
        existing = [];
      }

      // ensure self-learn folder exists
      try {
        await fs.mkdir(this.baseDir, { recursive: true });
        console.log(`[KnowledgeProcessor] 📁 Created directory: ${this.redactPathForLog(this.baseDir)}`);
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Failed to create directory:`, e.message);
      }

      const normalizedFile = String(filePath || '').replace(/\\/g, '/');
      // produce a safe display path: prefer project-relative (no user home), else basename
      let displayFile = normalizedFile;
      try {
        const rel = path.relative(process.cwd(), normalizedFile).replace(/\\/g, '/');
        if (rel && !rel.startsWith('..')) displayFile = rel;
        else displayFile = path.basename(normalizedFile);
      } catch (_e) { displayFile = path.basename(normalizedFile); }
      const out: any[] = [];
      // Load embeddings index (optional). Prefer repo training folder for shared artifacts
      const embeddingsPath = path.join(this.repoTrainingDir, 'embeddings.json');
      let embeddingsIndex: Record<string, number[]> = {};
      try {
        const rawEmb = await fs.readFile(embeddingsPath, 'utf8');
        embeddingsIndex = JSON.parse(rawEmb || '{}');
        console.log(`[KnowledgeProcessor] 🧠 Loaded embeddings index, keys: ${Object.keys(embeddingsIndex).length}`);
      } catch (_e) {
        embeddingsIndex = {};
      }
      
      for (const c of candidates) {
        const qRaw = (c.q || '').trim();
        const aRaw = (c.a || '').trim();
        const q = this.redact(qRaw);
        const a = this.redact(aRaw);
        
        if (!q || !a) {
          console.warn(`[KnowledgeProcessor] ⚠️ Skipping empty Q or A`);
          continue;
        }
        
        const exists = existing.find(e => String(e.q || '').trim() === q && String(e.file || '').trim() === normalizedFile);
        if (exists) {
          console.log(`[KnowledgeProcessor] 🔄 Exact duplicate skipped: "${q.substring(0, 50)}..."`);
          continue;
        }

        // Semantic dedupe: compute embedding and compare to existing embeddings index
        try {
          const emb = await this.computeEmbedding(q + '\n' + a);
          let bestSim = 0;
          let bestKey: string | null = null;
          for (const [k, v] of Object.entries(embeddingsIndex)) {
            const sim = this.cosineSim(emb, v);
            if (sim > bestSim) { bestSim = sim; bestKey = k; }
          }
          const SIM_THRESHOLD = 0.9; // conservative threshold; tune later
          if (bestSim >= SIM_THRESHOLD) {
            console.log(`[KnowledgeProcessor] 🔍 Semantic duplicate skipped (sim=${bestSim.toFixed(3)}): "${q.substring(0,50)}..." -> ${bestKey}`);
            continue;
          }
          // attach embedding for persistence after write
          (c as any).__embedding = emb;
        } catch (e: any) {
          console.warn(`[KnowledgeProcessor] ⚠️ Embedding compute failed:`, e?.message || e);
        }
        
        const entry = { 
          q, a, 
          source: 'deep-learning', 
          file: displayFile, 
          confidence: typeof c.confidence === 'number' ? c.confidence : 0.8, 
          learned: new Date().toISOString() 
        };
        existing.push(entry);
        out.push(entry);
      }

      console.log(`[KnowledgeProcessor] ✨ Adding ${out.length} new entries (${existing.length} total)`);

      // Write canonical userData KB
      try {
        await fs.writeFile(this.kbFile, JSON.stringify(existing, null, 2), 'utf8');
        console.log(`[KnowledgeProcessor] ✅ Wrote main KB: ${this.redactPathForLog(this.kbFile)}`);
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Failed to write main KB:`, e.message);
        throw e; // Don't continue if main write fails
      }

      // Write a copy into the repo training folder for curator/CI visibility
      try {
        const repoKb = path.join(this.repoTrainingDir, 'lumi_knowledge.json');
        await fs.mkdir(this.repoTrainingDir, { recursive: true });
        await fs.writeFile(repoKb, JSON.stringify(existing, null, 2), 'utf8');
        console.log(`[KnowledgeProcessor] ✅ Wrote repo training KB: ${this.redactPathForLog(repoKb)}`);
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Failed to write repo training KB:`, e.message);
      }

      // Also attempt to write to repo training folder (but sanitize file paths / PII before writing)
      try {
        const repoTraining = path.join(process.cwd(), 'training');
        await fs.mkdir(repoTraining, { recursive: true });
        const trainingFile = path.join(repoTraining, 'lumi_knowledge.json');
        // sanitize copy: replace file path with basename and redact Q/A
        const sanitized = (existing || []).map((e: any) => {
          const copy: any = Object.assign({}, e);
          try { copy.file = copy.file ? path.basename(String(copy.file)) : '[REDACTED]'; } catch (_){ copy.file = '[REDACTED]'; }
          try { copy.q = this.redact(String(copy.q || '')); } catch (_){ /* ignore */ }
          try { copy.a = this.redact(String(copy.a || '')); } catch (_){ /* ignore */ }
          return copy;
        });
        await fs.writeFile(trainingFile, JSON.stringify(sanitized, null, 2), 'utf8');
        console.log(`[KnowledgeProcessor] ✅ Wrote sanitized training KB: ${this.redactPathForLog(trainingFile)}`);
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Failed to write training KB:`, e.message);
      }

      // Write to audit file (selflearn_audit.jsonl)
      try {
        const auditFile = path.join(this.repoTrainingDir, 'selflearn_audit.jsonl');
        for (const it of out) {
          const auditEntry = {
            timestamp: new Date().toISOString(),
            type: 'knowledge-added',
            file: it.file || displayFile,
            question: it.q,
            confidence: it.confidence
          };
          await fs.appendFile(auditFile, JSON.stringify(auditEntry) + '\n', 'utf8');
        }
        console.log(`[KnowledgeProcessor] ✅ Wrote audit entries: ${this.redactPathForLog(auditFile)}`);
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Failed to write audit:`, e.message);
      }

      // Also add to memory store so the assistant "remembers" learned items
      try {
        if (this.memory && typeof this.memory.add === 'function') {
          for (const it of out) {
            try {
              const mem = {
                role: 'assistant',
                text: `${it.q}\n\n${it.a}`,
                meta: { source: it.source, file: it.file, confidence: it.confidence }
              };
              await this.memory.add(mem as any);
            } catch (e: any) {
              console.warn(`[KnowledgeProcessor] ⚠️ Memory add failed:`, e.message);
            }
          }
          console.log(`[KnowledgeProcessor] ✅ Added ${out.length} entries to memory`);
        } else {
          console.warn(`[KnowledgeProcessor] ⚠️ MemoryStore not available`);
        }
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Memory storage failed:`, e.message);
      }

      // Append validation records for security auditing
      try {
        const valDir = path.join(this.repoTrainingDir, 'security');
        await fs.mkdir(valDir, { recursive: true });
        const valFile = path.join(valDir, 'validation.jsonl');
        
        for (const it of out) {
          try {
            const scan = Threat.scanQA(it.q || '', it.a || '');
            const rec = {
              timestamp: new Date().toISOString(),
              candidate_id: `learned_${Date.now()}`,
              question: it.q,
              confidence: it.confidence || 0.8,
              threat_score: scan.score || 0,
              threat_reasons: scan.reasons || [],
              decision: scan.suspicious ? 'quarantine' : 'auto_merge',
              file: it.file || displayFile
            };
            await fs.appendFile(valFile, JSON.stringify(rec) + '\n', 'utf8');
          } catch (e: any) {
            console.warn(`[KnowledgeProcessor] ⚠️ Validation write failed:`, e.message);
          }
        }
        console.log(`[KnowledgeProcessor] ✅ Wrote ${out.length} validation records: ${this.redactPathForLog(valFile)}`);
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Validation storage failed:`, e.message);
      }

      // Emit a learning event so renderer can update UI live
      try {
        const bw = BrowserWindow.getAllWindows()[0];
        if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
          try {
            bw.webContents.send('lumi-learning-event', { type: 'kb-added', items: out });
            console.log(`[KnowledgeProcessor] 📡 Emitted learning event to renderer`);
          } catch (e: any) {
            console.warn(`[KnowledgeProcessor] ⚠️ Event emit failed:`, e.message);
          }
        }
      } catch (e: any) {
        console.error(`[KnowledgeProcessor] ❌ Event emission failed:`, e.message);
      }

      // persist new embeddings for entries added
      try {
        for (let i = 0; i < out.length; i++) {
          const it = out[i];
          const key = crypto.createHash('sha1').update(`${it.q}||${it.file}`).digest('hex');
          const foundCand = candidates.find(x => this.redact((x.q||'').trim()) === it.q && this.redact((x.a||'').trim()) === it.a) as any;
          const emb = foundCand && foundCand.__embedding ? foundCand.__embedding : null;
          if (emb) {
            embeddingsIndex[key] = emb;
            try { it.semantic_id = key; } catch (_) {}
          }
        }
        await fs.writeFile(embeddingsPath, JSON.stringify(embeddingsIndex, null, 2), 'utf8');
        console.log(`[KnowledgeProcessor] 🧾 Persisted embeddings: ${this.redactPathForLog(embeddingsPath)}`);
      } catch (e: any) {
        console.warn(`[KnowledgeProcessor] ⚠️ Failed to persist embeddings:`, e.message);
      }

      console.log(`[KnowledgeProcessor] 🎉 Ingest complete: ${out.length} added, ${existing.length} total`);
      return { ok: true, added: out.length, addedItems: out };
      
    } catch (e: any) {
      console.error(`[KnowledgeProcessor] ❌ INGEST FAILED:`, e.message, e.stack?.substring(0, 300));
      return { ok: false, error: e?.message || String(e) };
    }
  }
}