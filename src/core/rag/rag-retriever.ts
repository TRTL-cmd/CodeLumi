import * as fs from 'fs/promises';
import * as path from 'path';
import { getLumiPaths } from '../paths';

type KBEntry = {
  q: string;
  a: string;
  source?: string;
  file?: string;
  confidence?: number;
  learned?: string;
};

function tokenize(s: string) {
  return (s || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter(t => t.length > 1 && !/^[0-9]+$/.test(t));
}

class RAGRetriever {
  private entries: KBEntry[] = [];
  private docs: string[] = [];
  private df: Record<string, number> = {};
  private tfidfDocs: Array<Record<string, number>> = [];
  private indexedAt: number = 0;

  async indexKnowledge(_userDataPath: string) {
    try {
      const lumiPaths = getLumiPaths();
      const filesToTry = [
        lumiPaths.knowledgeBase,
        path.join(lumiPaths.trainingDir, 'codelumi_knowledge.json'),
      ];

      let merged: KBEntry[] = [];
      for (const f of filesToTry) {
        try {
          const raw = await fs.readFile(f, 'utf8');
          const parsed = JSON.parse(raw || '[]');
          if (Array.isArray(parsed)) merged = merged.concat(parsed as any[]);
        } catch (_e) {
          // ignore missing or invalid
        }
      }

      // Deduplicate by q + a
      const seen = new Set<string>();
      const uniq: KBEntry[] = [];
      for (const it of merged) {
        const key = (it.q || '') + '||' + (it.a || '');
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(it as KBEntry);
      }

      this.entries = uniq;
      this.docs = this.entries.map(e => `${e.q} \n ${e.a}`);
      this.buildIndex();
      this.indexedAt = Date.now();
      return { ok: true, indexed: this.entries.length };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }

  private buildIndex() {
    this.df = {};
    this.tfidfDocs = [];
    const docTerms: string[][] = this.docs.map(d => tokenize(d));
    for (const terms of docTerms) {
      const seen = new Set<string>();
      for (const t of terms) {
        if (!seen.has(t)) { this.df[t] = (this.df[t] || 0) + 1; seen.add(t); }
      }
    }

    const N = this.docs.length || 1;
    for (const terms of docTerms) {
      const tf: Record<string, number> = {};
      for (const t of terms) tf[t] = (tf[t] || 0) + 1;
      // convert to tf-idf
      const tfidf: Record<string, number> = {};
      let norm = 0;
      for (const t of Object.keys(tf)) {
        const tfv = tf[t];
        const idf = Math.log(1 + N / (1 + (this.df[t] || 0)));
        const w = tfv * idf;
        tfidf[t] = w;
        norm += w * w;
      }
      // normalize
      norm = Math.sqrt(norm) || 1;
      for (const k of Object.keys(tfidf)) tfidf[k] = tfidf[k] / norm;
      this.tfidfDocs.push(tfidf);
    }
  }

  private vectorizeQuery(q: string) {
    const terms = tokenize(q);
    const tf: Record<string, number> = {};
    for (const t of terms) tf[t] = (tf[t] || 0) + 1;
    const N = this.docs.length || 1;
    const tfidf: Record<string, number> = {};
    let norm = 0;
    for (const t of Object.keys(tf)) {
      const idf = Math.log(1 + N / (1 + (this.df[t] || 0)));
      const w = tf[t] * idf;
      tfidf[t] = w;
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const k of Object.keys(tfidf)) tfidf[k] = tfidf[k] / norm;
    return tfidf;
  }

  async search(query: string, topK = 5) {
    try {
      if (!this.entries || !this.entries.length) return { ok: true, results: [] };
      const qv = this.vectorizeQuery(query);
      const scores: Array<{ idx: number; score: number }> = [];
      for (let i = 0; i < this.tfidfDocs.length; i++) {
        const docv = this.tfidfDocs[i];
        // dot product
        let dot = 0;
        // iterate over smaller map
        const keys = Object.keys(qv.length <= Object.keys(docv).length ? qv : docv);
        for (const k of keys) {
          const a = qv[k] || 0;
          const b = docv[k] || 0;
          if (a && b) dot += a * b;
        }
        if (dot > 0) scores.push({ idx: i, score: dot });
      }
      scores.sort((a, b) => b.score - a.score);
      const out = scores.slice(0, topK).map(s => ({ score: s.score, entry: this.entries[s.idx] }));
      return { ok: true, results: out };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }
}

const retriever = new RAGRetriever();

export async function indexKnowledge(userDataPath: string) {
  return retriever.indexKnowledge(userDataPath);
}

export async function searchKnowledge(query: string, topK = 5) {
  return retriever.search(query, topK);
}

export default retriever;
