import { ollama } from '../llm/ollama';
import { searchKB, searchKBWithRerank } from '../memory/kb';
import * as fs from 'fs';
import * as path from 'path';
import * as Sanitizer from '../../security/sanitizer';
// lightweight signal detector (JS module)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const detector: any = require('../signal/detector');
import { SignalProcessor } from '../learning/processor';

// instantiate signal processor (non-blocking processing of high-confidence signals)
const signalProcessor = new SignalProcessor();

async function synthesizeKBAnswer(hits: Array<{ title?: string; text: string; id?: string }>) {
  if (!hits || hits.length === 0) return null;
  // Try to parse each entry text as JSON and prefer explicit answer fields when present
  const lines: string[] = [];
  for (const h of hits) {
    let title = (h.title && h.title.length) ? h.title : (h.id || 'kb');
    let content = (h.text || '').replace(/\s+/g, ' ').trim();
    try {
      const parsed = JSON.parse(h.text || '');
      // common field names used in training files
      if (parsed && typeof parsed === 'object') {
        if (parsed.output || parsed.answer || parsed.a) {
          content = (parsed.output || parsed.answer || parsed.a || '').toString().replace(/\s+/g, ' ').trim();
        }
        if (parsed.input && (!h.title || h.title.length === 0)) {
          title = parsed.input.toString().slice(0, 120);
        }
      }
    } catch (_e) {
      // not JSON, keep raw text
    }
    lines.push(`${title}: ${content}`);
  }
  return `KB_ANSWER: Based on the local knowledge base, here are the most relevant entries:\n\n${lines.join('\n\n')}`;
}

async function logKBUsage(query: string, hits: Array<{ id?: string; title?: string }>, source = 'brain'){
  try{
    const file = path.join(process.cwd(),'userData','kb_usage.jsonl');
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    const safeQuery = Sanitizer.redactPII(Sanitizer.sanitizeText(query || '', 2000));
    const safeHits = (hits || []).map(h => ({
      id: h.id,
      title: Sanitizer.redactPII(Sanitizer.sanitizeText(String(h.title || ''), 200))
    }));
    const entry = { ts: Date.now(), query: safeQuery, source, hits: safeHits };
    await fs.promises.appendFile(file, JSON.stringify(entry) + '\n', 'utf8');
  }catch(_){ }
}

async function buildKBSystemMessage(q: string, limit = 3) {
  try {
    if (!q) return null;
    const hits = await searchKBWithRerank(q, limit);
    if (!hits || hits.length === 0) return null;
    const parts = hits.map(h => {
      const title = (h.title && h.title.length > 0) ? h.title : (h.id || 'kb');
      let excerpt = (h.text || '').replace(/\s+/g, ' ').slice(0, 400);
      try{ const p = JSON.parse(h.text || ''); if(p && typeof p === 'object' && (p.output || p.answer || p.a)) excerpt = (p.output || p.answer || p.a).toString().replace(/\s+/g,' ').slice(0,400); }catch(_){ }
      return `- ${title} (${h.id || ''}): ${excerpt}`;
    });
    // log KB context usage for telemetry
    try{ await logKBUsage(q, hits, 'kbContext'); }catch(_){ }
    return { role: 'system' as const, content: `KB_CONTEXT: Top ${hits.length} knowledge hits related to the query:\n\n${parts.join('\n\n')}` };
  } catch (e) {
    return null;
  }
}

export async function think(prompt: string, options: Record<string, any> = {}): Promise<string> {
  // System persona: describe Lumi and preferred behavior. Do NOT force restating identity.
  const systemMessage = `You are Lumi, a helpful machine learning coding and communications assistant created by Tortol Studios. Your personality is curious, funny, ambitious, honest, evolving, witty, and determined. Do NOT repeat your name or identity in every response; only state your name or origin when explicitly asked.`;
  const userContent = prompt;
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  messages.push({ role: 'system', content: systemMessage });
  try{
    const kbSys = await buildKBSystemMessage(prompt, 3);
    if(kbSys) messages.push(kbSys);
  }catch(_){ }
  messages.push({ role: 'user', content: userContent });
  let out: string | undefined;

  // Auto-detect offline: if Ollama isn't available and kbFirst/online mode not forced, enable kbFirst
  try {
    if (options.kbFirst === undefined && options.offline === undefined) {
      const avail = await ollama.isAvailable();
      if (!avail) options.kbFirst = true;
    }
  } catch (_){ /* ignore availability errors */ }

  // KB-first / offline mode: if requested, synthesize an answer from KB and return without calling Ollama
  if (options.kbFirst === true || options.offline === true) {
    try {
      const hits = await searchKBWithRerank(prompt, options.kbLimit || 5);
      if (hits && hits.length) {
        const synthesized = await synthesizeKBAnswer(hits as any);
        // telemetry: log KB usage
        try{ await logKBUsage(prompt, hits, 'kbFirst'); }catch(_){ }
        // persist used KB hits to memory for future reference
        try{ const store: any = (global as any).lumiMemory; if(store && typeof store.add === 'function'){ store.add({ role: 'kb_used', text: (synthesized||'').toString().slice(0,2000), meta: { hits: hits.map(h=>({ id:h.id, title:h.title })) } }).catch(()=>{}); } }catch(_){ }
        return synthesized as string;
      }
    } catch (_) {
      // fall through to normal behavior
    }
  }

  try {
    out = await ollama.chat(messages as any, options);
    try {
      console.log('[Brain] ollama.chat returned type=', typeof out, 'len=', out ? (out as any).length || 0 : 0);
      try { console.log('[Brain] ollama.chat preview=', (typeof out === 'string' ? out.slice(0,200) : JSON.stringify(out).slice(0,200))); } catch(_){ }
    } catch (_e) { }
  } catch (e) {
    // If Ollama fails, optionally fallback to KB answers (default: enabled)
    if (options.kbFallback === false) throw e;
    try {
      const hits = await searchKBWithRerank(prompt, 3);
      if (hits && hits.length) {
        const parts = hits.map(h => {
          const title = (h.title && h.title.length > 0) ? h.title : (h.id || 'kb');
          const excerpt = (h.text || '').replace(/\s+/g, ' ').slice(0, 1000);
          return `- ${title} (${h.id || ''}): ${excerpt}`;
        });
        out = `KB_FALLBACK: The local knowledge base returned the following top ${hits.length} results related to your query:\n\n${parts.join('\n\n')}`;
        // persist used KB hits to memory
        try{ const store: any = (global as any).lumiMemory; if(store && typeof store.add === 'function'){ store.add({ role: 'kb_used', text: (out||'').toString().slice(0,2000), meta: { hits: hits.map(h=>({ id:h.id, title:h.title })) } }).catch(()=>{}); } }catch(_){ }
      } else {
        throw e;
      }
    } catch (_e) {
      throw e;
    }
  }
  // detect signals from assistant response and persist to file-backed memory when available
  try {
    const signals = detector.extractSignalsFromText(out || '');
    if (signals && signals.length) {
      try {
        const store: any = (global as any).lumiMemory;
        if (store && typeof store.add === 'function') {
          store.add({ role: 'signal', text: (out || '').toString().slice(0, 2000), meta: { signals, source: 'think' } }).catch(() => { });
        }
      } catch (_){ }
      try { void signalProcessor.processSignals(signals, prompt, out); } catch (_){ }
    }
  } catch (_){ }
  return out;
}

export async function thinkChat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, options: Record<string, any> = {}): Promise<string> {
  // inject identity + KB context, then adapt messages to Ollama Message type
  const systemMessage = `You are Lumi, a helpful machine learning coding and communications assistant created by Tortol Studios. Your personality is curious, funny, ambitious, honest, evolving, witty, and determined. Do NOT repeat your name or identity in every response; only state your name or origin when explicitly asked.`;
  // derive compact user query text from the provided conversation
  const userText = messages.filter(m => m.role === 'user').map(m => m.content).join('\n').slice(0, 2000);
  const augmented: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  augmented.push({ role: 'system', content: systemMessage });
  try{ const kbSys = await buildKBSystemMessage(userText, 3); if(kbSys) augmented.push(kbSys); }catch(_){ }
  // preserve incoming messages after injected system blocks
  augmented.push(...messages as any);
  let out: string | undefined;
  try {
    if (options.kbFirst === undefined && options.offline === undefined) {
      const avail = await ollama.isAvailable();
      if (!avail) options.kbFirst = true;
    }
  } catch (_){ }
  try {
    out = await ollama.chat(augmented as any, options);
    try {
      console.log('[Brain] ollama.chat (chat) returned type=', typeof out, 'len=', out ? (out as any).length || 0 : 0);
      try { console.log('[Brain] ollama.chat (chat) preview=', (typeof out === 'string' ? out.slice(0,200) : JSON.stringify(out).slice(0,200))); } catch(_){ }
    } catch (_e) { }
  } catch (e) {
    if (options.kbFallback === false) throw e;
    try {
      const hits = await searchKBWithRerank(userText, 3);
      if (hits && hits.length) {
        const parts = hits.map(h => {
          const title = (h.title && h.title.length > 0) ? h.title : (h.id || 'kb');
          const excerpt = (h.text || '').replace(/\s+/g, ' ').slice(0, 1000);
          return `- ${title} (${h.id || ''}): ${excerpt}`;
        });
        out = `KB_FALLBACK: The local knowledge base returned the following top ${hits.length} results related to your query:\n\n${parts.join('\n\n')}`;
        try{ const store: any = (global as any).lumiMemory; if(store && typeof store.add === 'function'){ store.add({ role: 'kb_used', text: (out||'').toString().slice(0,2000), meta: { hits: hits.map(h=>({ id:h.id, title:h.title })) } }).catch(()=>{}); } }catch(_){ }
      } else {
        throw e;
      }
    } catch (_e) {
      throw e;
    }
  }
  try{
    const signals = detector.extractSignalsFromText(out || '');
    if(signals && signals.length){
      try{ const store: any = (global as any).lumiMemory; if(store && typeof store.add === 'function'){ store.add({ role:'signal', text: (out||'').toString().slice(0,2000), meta:{ signals, source:'thinkChat' } }).catch(()=>{}); } }catch(_){ }
      try{ void signalProcessor.processSignals(signals, userText, out); }catch(_){ }
    }
  }catch(_){}
  return out;
}

export async function thinkStream(prompt: string, options: Record<string, any> = {}, onChunk?: (chunk: string) => void) {
  // Build messages with persona guidance (do not force identity repetition)
  const systemMessage = `You are Lumi, a helpful machine learning coding and communications assistant created by Tortol Studios. Your personality is curious, funny, ambitious, honest, evolving, witty, and determined. Do NOT repeat your name or identity in every response; only state your name or origin when explicitly asked.`;
  const userContent = prompt;
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  messages.push({ role: 'system', content: systemMessage });
  try{ const kbSys = await buildKBSystemMessage(prompt, 3); if(kbSys) messages.push(kbSys); }catch(_){ }
  messages.push({ role: 'user', content: userContent });

  // auto offline detection for streaming mode
  try {
    if (options.kbFirst === undefined && options.offline === undefined) {
      const avail = await ollama.isAvailable();
      if (!avail) options.kbFirst = true;
    }
  } catch (_){ }

  let buffer = '';
  try {
    const stream = ollama.chatStream(messages as any, options);
    for await (const chunk of stream) {
      try {
        buffer += chunk;
        if (onChunk) onChunk(chunk);
      } catch (e) {
        // swallow callback errors
      }
    }
  } catch (e) {
    // fallback to KB when streaming fails (unless disabled)
    if (options.kbFallback === false) throw e;
    try {
      const hits = await searchKBWithRerank(prompt, 3);
      if (hits && hits.length) {
        const parts = hits.map(h => {
          const title = (h.title && h.title.length > 0) ? h.title : (h.id || 'kb');
          const excerpt = (h.text || '').replace(/\s+/g, ' ').slice(0, 1000);
          return `- ${title} (${h.id || ''}): ${excerpt}`;
        });
        const fb = `KB_FALLBACK: The local knowledge base returned the following top ${hits.length} results related to your query:\n\n${parts.join('\n\n')}`;
        buffer = fb;
        // persist used KB hits to memory
        try{ const store: any = (global as any).lumiMemory; if(store && typeof store.add === 'function'){ store.add({ role: 'kb_used', text: (buffer||'').toString().slice(0,2000), meta: { hits: hits.map(h=>({ id:h.id, title:h.title })) } }).catch(()=>{}); } }catch(_){ }
        if (onChunk) onChunk(fb);
      } else {
        throw e;
      }
    } catch (_e) {
      throw e;
    }
  }
  // After stream completes, run signal detection on full buffer and persist
  try{
    const signals = detector.extractSignalsFromText(buffer || '');
    if(signals && signals.length){ try{ const store: any = (global as any).lumiMemory; if(store && typeof store.add === 'function'){ store.add({ role:'signal', text: (buffer||'').toString().slice(0,2000), meta:{ signals, source:'thinkStream' } }).catch(()=>{}); } }catch(_){ }
      try{ void signalProcessor.processSignals(signals, prompt, buffer); }catch(_){ }
    }
  }catch(_){ }
}

export default {
  think,
  thinkChat,
  thinkStream,
};
