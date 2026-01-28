const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function loadJSONL(p){
  if(!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p,'utf8');
  const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const out = [];
  for(const L of lines){ try{ out.push(JSON.parse(L)); }catch(e){} }
  return out;
}

function normalize(entries){
  return entries.map((d,i)=>({ id: d.id || `kb-${i}`, title: d.q || d.title || d.prompt || '', text: d.a || d.answer || d.text || JSON.stringify(d) }));
}

function tokenize(text){ return (text||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
function bm25Search(entries, q, limit=10){
  const k1 = 1.5, b=0.75;
  const qTokens = tokenize(q);
  if(qTokens.length===0) return [];
  const docsTokens = entries.map(e=>tokenize((e.title||'') + ' ' + (e.text||'')));
  const docLens = docsTokens.map(t=>t.length||1);
  const avgdl = docLens.reduce((a,b)=>a+b,0)/docLens.length;
  const N = entries.length;
  const df = {};
  for(const toks of docsTokens){ const seen=new Set(); for(const t of toks){ if(!seen.has(t)){ seen.add(t); df[t]=(df[t]||0)+1; } }}
  function idf(term){ const freq = df[term]||0; return Math.log(1 + (N - freq + 0.5) / (freq + 0.5)); }
  const scores = [];
  for(let i=0;i<entries.length;i++){
    const toks = docsTokens[i]; const dl = docLens[i]; const tf={}; for(const t of toks) tf[t]=(tf[t]||0)+1;
    let sc=0;
    for(const qt of qTokens){ const termIdf = idf(qt); const freq = tf[qt]||0; const denom = freq + k1 * (1 - b + b * (dl / avgdl)); sc += termIdf * ((freq * (k1 + 1)) / (denom||1)); const titleTokens = tokenize(entries[i].title||''); const titleCount = titleTokens.filter(t=>t===qt).length; if(titleCount) sc += termIdf * titleCount * 0.6; }
    if(sc>0) sc = sc * (1 + 0.1 * (1 - (dl / Math.max(avgdl,1))));
    scores.push({entry: entries[i], score: sc});
  }
  scores.sort((a,b)=>b.score-a.score);
  return scores.slice(0,limit).map(s=>s.entry);
}

// load KB
const tryPaths = [path.join(process.cwd(),'training','training.jsonl'), path.join(process.cwd(),'training.jsonl'), path.join(process.cwd(),'training','lumi_knowledge.json'), path.join(process.cwd(),'training','codelumi_knowledge.json')];
let rawEntries = [];
for(const p of tryPaths){ if(fs.existsSync(p)){ if(p.endsWith('.jsonl')) rawEntries = loadJSONL(p); else { try{ rawEntries = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){} } if(rawEntries && rawEntries.length) { console.log('Loaded KB from', p); break; } } }
if(!rawEntries || rawEntries.length===0){ console.error('No training KB found'); process.exit(1); }
const entries = normalize(rawEntries);

const query = process.argv[2] || 'how to fix a missing semicolon';
console.log('Query:', query);
const top = bm25Search(entries, query, 10);
console.log('\nTop BM25 candidates:');
top.forEach((t,i)=> console.log(i+1, t.id || '', (t.title||'').slice(0,60)));

// call python reranker
const script = path.join(process.cwd(),'scripts','rerank_candidates.py');
if(!fs.existsSync(script)){ console.error('Reranker script missing:', script); process.exit(0); }
const payload = JSON.stringify({ query, candidates: top.map(t => ((t.title || '') + '\n' + (t.text || ''))) });
try{
  const out = execFileSync('python', [script, payload], { input: payload, encoding: 'utf8', maxBuffer: 10*1024*1024 });
  const parsed = JSON.parse(out);
  if(parsed.error){ console.error('Reranker error:', parsed.error); process.exit(0); }
  const scores = parsed.scores;
  const paired = top.map((t,i)=>({entry:t, score: scores[i]||0})).sort((a,b)=>b.score-a.score);
  console.log('\nReranked candidates:');
  paired.forEach((p,i)=> console.log(i+1, p.entry.id||'', p.score.toFixed(4), (p.entry.title||'').slice(0,60)));
}catch(e){
  console.error('Failed to run python reranker:', e.message || e);
}
