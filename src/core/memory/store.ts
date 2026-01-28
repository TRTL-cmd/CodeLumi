import * as fs from 'fs/promises';
import * as path from 'path';

export interface MemoryEntry {
  id?: string;
  role?: 'user' | 'assistant' | string;
  text: string;
  meta?: Record<string, any>;
  t?: number;
}

export class MemoryStore {
  file: string;

  constructor(baseDir: string) {
    this.file = path.join(baseDir, 'lumi_memory.jsonl');
  }

  async ensureFile() {
    try {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.access(this.file).catch(async () => { await fs.writeFile(this.file, '', 'utf8'); });
    } catch (e) {
      // ignore
    }
  }

  async add(entry: MemoryEntry) {
    await this.ensureFile();
    const e = Object.assign({}, entry, { t: entry.t || Date.now() });
    await fs.appendFile(this.file, JSON.stringify(e) + '\n', 'utf8');
    return e;
  }

  async all(): Promise<MemoryEntry[]> {
    await this.ensureFile();
    const raw = await fs.readFile(this.file, 'utf8').catch(() => '');
    if (!raw) return [];
    const lines = raw.split('\n').filter(Boolean);
    return lines.map(l => {
      try { return JSON.parse(l); } catch (e) {
        // Fallback: line is plain text (legacy or corrupted entry) — wrap into MemoryEntry
        try { return { text: l, t: Date.now() } as MemoryEntry; } catch (_e) { return null; }
      }
    }).filter(Boolean) as MemoryEntry[];
  }

  async query(q: string, limit = 50): Promise<MemoryEntry[]> {
    if (!q) return [];
    const all = await this.all();
    const low = q.toLowerCase();
    const matches = all.filter(e => (e.text||'').toLowerCase().includes(low) || JSON.stringify(e.meta||'').toLowerCase().includes(low));
    // return most recent first
    matches.sort((a,b) => (b.t||0) - (a.t||0));
    return matches.slice(0, limit);
  }

  async export(): Promise<MemoryEntry[]> {
    return await this.all();
  }
}

export default MemoryStore;
