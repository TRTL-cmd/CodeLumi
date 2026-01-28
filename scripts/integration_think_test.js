const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { execFileSync } = require('child_process');
const detector = require('../src/core/signal/detector');
const executor = require('../src/brain/executor_stub');

function loadJSONL(p){ if(!fs.existsSync(p)) return []; const raw = fs.readFileSync(p,'utf8'); const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); return lines.map(l=>{ try{return JSON.parse(l);}catch(e){return null;} }).filter(Boolean); }
function normalize(entries){ return entries.map((d,i)=>({ id: d.id || `kb-${i}`, title: d.q || d.title || d.prompt || '', text: d.a || d.answer || d.text || JSON.stringify(d) })); }
function tokenize(text){ return (text||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
function bm25Search(entries, q, limit=5){ const k1=1.5,b=0.75; const qTokens=tokenize(q); if(qTokens.length===0) return []; const docsTokens=entries.map(e=>tokenize((e.title||'')+' '+(e.text||''))); const docLens=docsTokens.map(t=>t.length||1); const avgdl=docLens.reduce((a,b)=>a+b,0)/docLens.length; const N=entries.length; const df={}; for(const toks of docsTokens){ const seen=new Set(); for(const t of toks){ if(!seen.has(t)){ seen.add(t); df[t]=(df[t]||0)+1; } } } function idf(term){ const freq=df[term]||0; return Math.log(1 + (N - freq + 0.5) / (freq + 0.5)); }
  const scores = [];
  for(let i=0;i<entries.length;i++){ const toks=docsTokens[i]; const dl=docLens[i]; const tf={}; for(const t of toks) tf[t]=(tf[t]||0)+1; let sc=0; for(const qt of qTokens){ const termIdf=idf(qt); const freq=tf[qt]||0; const denom = freq + k1*(1 - b + b*(dl/avgdl)); sc += termIdf * ((freq*(k1+1))/(denom||1)); const titleTokens=tokenize(entries[i].title||''); const titleCount = titleTokens.filter(t=>t===qt).length; if(titleCount) sc += termIdf * titleCount * 0.6; } if(sc>0) sc = sc * (1 + 0.1 * (1 - (dl/Math.max(avgdl,1)))); scores.push({entry: entries[i], score: sc}); }
  scores.sort((a,b)=>b.score-a.score); if(!scores.some(s=>s.score>0)){ const subs=[]; const qlow=q.toLowerCase(); for(const e of entries){ let s=0; if((e.title||'').toLowerCase().indexOf(qlow)!==-1) s+=3; if((e.text||'').toLowerCase().indexOf(qlow)!==-1) s+=2; for(const t of qTokens){ if((e.title||'').toLowerCase().indexOf(t)!==-1) s+=1; if((e.text||'').toLowerCase().indexOf(t)!==-1) s+=0.5; } if(s>0) subs.push({entry:e,score:s}); } subs.sort((a,b)=>b.score-a.score); return subs.slice(0,limit).map(s=>s.entry); }
  return scores.slice(0,limit).map(s=>s.entry);
}

async function appendMemory(entry){ const file = path.join(process.cwd(),'userData','lumi_memory.jsonl'); await fsp.mkdir(path.dirname(file), { recursive: true }); const e = Object.assign({}, entry, { t: entry.t || Date.now() }); await fsp.appendFile(file, JSON.stringify(e) + '\n', 'utf8'); return e; }

async function run(){
  // Load KB
  const tryPaths = [path.join(process.cwd(),'training','training.jsonl'), path.join(process.cwd(),'training.jsonl'), path.join(process.cwd(),'training','lumi_knowledge.json'), path.join(process.cwd(),'training','codelumi_knowledge.json')];
  let raw = [];
  for(const p of tryPaths){ if(fs.existsSync(p)){ if(p.endsWith('.jsonl')) raw = loadJSONL(p); else { try{ raw = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){} } if(raw && raw.length) { console.log('Loaded KB from', p); break; } }
  }
  const entries = normalize(raw);

  const query = 'how to fix a missing semicolon in JavaScript';

  console.log('\n--- ONLINE SIMULATION (mocked Ollama response) ---');
  // Simulate Ollama producing an answer
  const onlineOut = "Try adding a semicolon at the end of the line. Also check for unmatched brackets. Thanks!";
  console.log('Assistant output:', onlineOut);
  const signalsOnline = detector.extractSignalsFromText(onlineOut);
  console.log('Signals detected:', signalsOnline);
  await appendMemory({ role: 'assistant', text: onlineOut, meta: { signals: signalsOnline, source: 'integration_online' } });

  console.log('\n--- OFFLINE KB-FIRST SIMULATION ---');
  const top = bm25Search(entries, query, 5);
  console.log('Top KB hits:', top.map(t=>t.id || t.title).slice(0,5));
  // try rerank via Python if available
  const rerankScript = path.join(process.cwd(),'scripts','rerank_candidates.py');
  let reranked = null;
  if(fs.existsSync(rerankScript)){
    try{
      const payload = JSON.stringify({ query, candidates: top.map(t=> (t.title||'') + '\n' + (t.text||'')) });
      const out = execFileSync('python', [rerankScript, payload], { input: payload, encoding: 'utf8', maxBuffer: 10*1024*1024 });
      const parsed = JSON.parse(out);
      if(parsed && parsed.scores){ const paired = top.map((t,i)=>({t,score: parsed.scores[i]||0})).sort((a,b)=>b.score-a.score); reranked = paired.map(p=>p.t); console.log('Reranked top ids:', reranked.map(x=>x.id)); }
    }catch(e){ console.log('Rerank failed:', e.message || e); }
  }
  const use = (reranked && reranked.length) ? reranked : top;
  const synthesized = 'KB_ANSWER: ' + use.slice(0,3).map(u => ((u.title||u.id||'kb') + ': ' + ((u.text||'').slice(0,300)))).join('\n\n');
  console.log('Synthesized KB answer:\n', synthesized);
  const signalsOffline = detector.extractSignalsFromText(synthesized);
  console.log('Signals detected (offline):', signalsOffline);
  await appendMemory({ role: 'assistant', text: synthesized, meta: { signals: signalsOffline, source: 'integration_kb' } });

  console.log('\n--- EXECUTOR SIMULATION ---');
  const tmpFile = path.join(process.cwd(),'tmp','integration_executor_test.txt');
  const sim = await executor.simulateChange(tmpFile, 'console.log("hello world");\n');
  console.log('Simulation:', sim);
  const execRes = await executor.executeChange(sim);
  console.log('Execute result:', execRes);
  const revert = await executor.revertBackup(execRes.runDir);
  console.log('Revert result:', revert);

  console.log('\n--- MEMORY SNAPSHOT (last 5 entries) ---');
  const memRaw = loadJSONL(path.join(process.cwd(),'userData','lumi_memory.jsonl'));
  console.log(memRaw.slice(-5));
}

run().catch(e=>{ console.error('Integration test failed:', e); process.exit(2); });
