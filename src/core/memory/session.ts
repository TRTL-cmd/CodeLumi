import * as fs from 'fs/promises';
import * as path from 'path';

export interface SessionEntry {
  id?: string;
  role?: 'user' | 'assistant' | string;
  text: string;
  meta?: Record<string, any>;
  t?: number;
}

export class SessionManager {
  baseDir: string;
  sessionId: string;
  entries: SessionEntry[] = [];
  startedAt: number;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.sessionId = `session-${Date.now()}`;
    this.startedAt = Date.now();
  }

  start() {
    this.startedAt = Date.now();
    this.entries = [];
  }

  // basic sanitizer to avoid persisting file paths or local absolute paths
  sanitizeText(txt: string) {
    if (!txt || typeof txt !== 'string') return '';
    // Windows drive paths (redact any absolute drive prefix)
    txt = txt.replace(/[A-Za-z]:\\[^\s"'<>]*/g, '[REDACTED_PATH]');
    // Unix-like absolute paths /usr/local/bin or /home/user/file.txt
    txt = txt.replace(/\/(?:[^\s"'<>]+\/?)+/g, '[REDACTED_PATH]');
    return txt;
  }

  add(entry: Partial<SessionEntry>) {
    const rawText = (entry.text !== undefined && entry.text !== null) ? String(entry.text) : '';
    const e: SessionEntry = {
      id: entry.id as string | undefined,
      role: entry.role as any || 'user',
      text: this.sanitizeText(rawText),
      meta: entry.meta as any || {},
      t: entry.t || Date.now()
    };
    this.entries.push(e);
    return e;
  }

  all(): SessionEntry[] {
    // return a shallow copy
    return this.entries.slice();
  }

  clear() {
    this.entries = [];
  }

  async ensureDir() {
    const dir = path.join(this.baseDir, 'sessions');
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
    return dir;
  }

  async persistArchive(): Promise<string> {
    const dir = await this.ensureDir();
    const file = path.join(dir, `${this.sessionId}.jsonl`);
    const data = this.entries.map(e => JSON.stringify(e)).join('\n') + (this.entries.length ? '\n' : '');
    await fs.writeFile(file, data, 'utf8');
    return file;
  }

  async end(options?: { persistArchive?: boolean }): Promise<{ archived?: string }> {
    const result: { archived?: string } = {};
    if (options?.persistArchive) {
      result.archived = await this.persistArchive();
    }
    // clear in-memory session by default (session closes on app exit)
    this.clear();
    return result;
  }

  // Simple in-memory query (string includes). For more advanced recall use KB search.
  query(q: string, limit = 50): SessionEntry[] {
    if (!q) return [];
    const low = q.toLowerCase();
    const matches = this.entries.filter(e => (e.text || '').toLowerCase().includes(low) || JSON.stringify(e.meta || '').toLowerCase().includes(low));
    matches.sort((a, b) => (b.t || 0) - (a.t || 0));
    return matches.slice(0, limit);
  }

  // Trim oldest entries to fit an approximate token budget. Returns summary of removed/kept.
  trimToTokenBudget(maxTokens: number, estimator?: (text: string) => number) {
    try {
      const est = typeof estimator === 'function' ? estimator : (txt: string) => Math.ceil((String(txt||'').length || 0) / 4);
      let acc = 0;
      const kept: SessionEntry[] = [];
      // iterate from newest to oldest and accumulate tokens until budget
      for (let i = this.entries.length - 1; i >= 0; i--) {
        const e = this.entries[i];
        const t = Number(est(String(e.text || '')) || 0);
        if (acc + t > maxTokens) break;
        acc += t;
        kept.push(e);
      }
      const keptReversed = kept.reverse();
      const removedCount = Math.max(0, this.entries.length - keptReversed.length);
      this.entries = keptReversed.slice();
      return { ok: true, removedCount, kept: this.entries.length, tokenCount: acc };
    } catch (e) {
      return { ok: false, error: String(e) } as any;
    }
  }
}

export default SessionManager;
