export interface RawSignal { [key: string]: any }

export class CandidateExtractor {
  // Extracts simple QA candidates from a signal. Returns empty array if none.
  async extractCandidatesFromSignal(signal: RawSignal): Promise<Array<any>> {
    try {
      if (!signal) return [];
      const payload = signal.payload || {};
      let q = payload.question || payload.q || null;
      let a = payload.answer || payload.a || null;

      // try common meta locations
      if (!a && payload.assistant) a = payload.assistant;
      if (!a && signal.meta && signal.meta.assistant) a = signal.meta.assistant;

      if (!q || !a) return [];

      const candidate = {
        id: `cand_${Date.now()}`,
        q: String(q).trim(),
        a: String(a).trim(),
        confidence: (signal.confidence || 0.95),
        source: signal.source || 'signal-extractor',
        date: new Date().toISOString()
      };
      return [candidate];
    } catch (e) {
      return [];
    }
  }

  // Optional helper: extract from array of memory entries
  async extractCandidatesFromMemoryEntries(entries: any[]): Promise<any[]> {
    const out: any[] = [];
    for (const e of entries || []) {
      try {
        if (e && e.role === 'signal') {
          const s = (typeof e.text === 'string') ? (() => { try { return JSON.parse(e.text); } catch { return e; } })() : e;
          const cs = await this.extractCandidatesFromSignal(s);
          out.push(...cs);
        }
      } catch (_){ }
    }
    return out;
  }
}

export default CandidateExtractor;
