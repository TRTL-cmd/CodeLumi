import * as fs from 'fs/promises';
import * as path from 'path';
import { think } from './index';
import retriever, { indexKnowledge, searchKnowledge } from '../rag/rag-retriever';
import PersonalityEngine from '../personality/PersonalityEngine';
import { enhancePromptWithExpertise, getCodeInstructions, detectLanguagesInQuery } from '../../brain/lumi-expertise';

let userDataRoot: string | null = null;
let lastIndexCount = 0;
let lastIndexedAt: number | null = null;
let initializing = false;

export async function initializeRAG(userDataPath: string) {
  try {
    if (initializing) return { ok: false, error: 'initializing' };
    initializing = true;
    userDataRoot = userDataPath;
    const res = await indexKnowledge(userDataPath);
    if (res && res.ok) {
      lastIndexCount = res.indexed || 0;
      lastIndexedAt = Date.now();
    }
    initializing = false;
    // Attach a simple personality instance to the global RAG surface so UI and main can access it
    const personality = new PersonalityEngine();
    (global as any).lumiRAG = {
      clearCache: async () => { const r = await indexKnowledge(userDataPath); lastIndexCount = r.indexed || 0; lastIndexedAt = Date.now(); return r; },
      getStats: async () => ({ ok: true, stats: { totalEntries: lastIndexCount, lastIndexedAt, personality: personality.getStats() } }),
      getPersonality: () => personality
    };
    return res;
  } catch (e: any) {
    initializing = false;
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function thinkWithRAG(prompt: string, options?: any) {
  try {
    // detect code-related requests and adapt token allocation
    const isCode = /write|create|implement|build|generate|show.*how|parse/i.test(prompt || '');
    const languages = typeof detectLanguagesInQuery === 'function' ? detectLanguagesInQuery(prompt || '') : [];
    let maxTokens = options?.num_predict || options?.maxTokens || 1000;
    if (isCode) {
      if (languages.includes('Haskell')) maxTokens = 3500;
      else if (languages.includes('Rust') || languages.includes('C++')) maxTokens = 2800;
      else maxTokens = 2200;
      options = { ...(options || {}), num_predict: maxTokens };
      console.log(`[RAG] Code request for ${languages.join(', ') || 'unknown'}, using ${maxTokens} tokens`);
    }
    const topK = options?.ragTopK || 5;
    // ensure KB is loaded at least once
    if (!userDataRoot && (global as any)?.getUserDataPath) {
      try { userDataRoot = (global as any).getUserDataPath(); } catch (_e) { /* ignore */ }
    }

    // perform search
    const startSearch = Date.now();
    const searchRes = await searchKnowledge(prompt, topK);
    const searchMs = Date.now() - startSearch;

    let context = '';
    let resultsCount = 0;
    if (searchRes && searchRes.ok && Array.isArray(searchRes.results) && searchRes.results.length) {
      resultsCount = searchRes.results.length;
      const items = searchRes.results.map((r: any, i: number) => `Entry ${i + 1} (score=${(r.score||0).toFixed(3)}):\nQ: ${r.entry.q}\nA: ${r.entry.a}\nsource: ${r.entry.source || r.entry.file || 'unknown'}`).join('\n\n---\n\n');
      context = `Context from Lumi's knowledge base (top ${resultsCount}):\n\n${items}\n\n`;
    }

    // limit context size
    if (context.length > 3000) context = context.slice(0, 3000) + '\n\n';

    // enhance user prompt with language expertise context
    const enhancedPrompt = typeof enhancePromptWithExpertise === 'function' ? enhancePromptWithExpertise(prompt) : prompt;
    const augmented = (context ? context : '') + `User Prompt:\n${enhancedPrompt}\n\n` + (typeof getCodeInstructions === 'function' ? getCodeInstructions() : '');

    const startThink = Date.now();
    const out = await think(augmented, options);
    const thinkMs = Date.now() - startThink;

    // log performance
    try {
      if (userDataRoot) {
        const perfFile = path.join(userDataRoot, 'rag_performance.jsonl');
        const perf = { timestamp: new Date().toISOString(), query: String(prompt).slice(0, 300), ragMs: searchMs, ragHits: resultsCount, thinkMs };
        await fs.appendFile(perfFile, JSON.stringify(perf) + '\n', 'utf8').catch(() => {});
      }
    } catch (_e) { /* ignore */ }

    return out;
  } catch (e: any) {
    try { return await think(prompt, options); } catch (_err) { return { ok: false, error: e?.message || String(e) }; }
  }
}

export async function getRAGStats() {
  try{
    const p: any = (global as any).lumiRAG && (global as any).lumiRAG.getPersonality ? (global as any).lumiRAG.getPersonality() : null;
    const personStats = p ? (typeof p.getStats === 'function' ? p.getStats() : null) : null;
    return { ok: true, stats: { totalEntries: lastIndexCount, lastIndexedAt, personality: personStats } };
  }catch(e){ return { ok: true, stats: { totalEntries: lastIndexCount, lastIndexedAt } }; }
}

export async function clearRAGCache() {
  if (!userDataRoot) return { ok: false, error: 'not-initialized' };
  const res = await indexKnowledge(userDataRoot);
  lastIndexCount = res.indexed || 0;
  lastIndexedAt = Date.now();
  return res;
}

export default {
  initializeRAG,
  thinkWithRAG,
  getRAGStats,
  clearRAGCache,
};
