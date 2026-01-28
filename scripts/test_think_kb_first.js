const fs = require('fs');
const path = require('path');

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
function bm25Search(entries, q, limit=5){
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
  if(!scores.some(s=>s.score>0)){
    const subs=[]; const qlow=q.toLowerCase(); for(const e of entries){ let s=0; if((e.title||'').toLowerCase().indexOf(qlow)!==-1) s+=3; if((e.text||'').toLowerCase().indexOf(qlow)!==-1) s+=2; for(const t of qTokens){ if((e.title||'').toLowerCase().indexOf(t)!==-1) s+=1; if((e.text||'').toLowerCase().indexOf(t)!==-1) s+=0.5; } if(s>0) subs.push({entry:e,score:s}); } subs.sort((a,b)=>b.score-a.score); return subs.slice(0,limit).map(s=>s.entry);
  }
  return scores.slice(0,limit).map(s=>s.entry);
}

function synth(hits){
  if(!hits||hits.length===0) return null;
  const parts = hits.map(h=>`${(h.title||h.id||'kb')}: ${(h.text||'').replace(/\s+/g,' ').slice(0,800)}`);
  return `KB_ANSWER: Based on the local knowledge base, here are the top ${hits.length} matches:\n\n${parts.join('\n\n')}`;
}

const tryPaths = [path.join(process.cwd(),'training','training.jsonl'), path.join(process.cwd(),'training.jsonl'), path.join(process.cwd(),'training','lumi_knowledge.json')];
let rawEntries = [];
for(const p of tryPaths){ if(fs.existsSync(p)){ if(p.endsWith('.jsonl')) rawEntries = loadJSONL(p); else { try{ rawEntries = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){} } if(rawEntries && rawEntries.length) { console.log('Loaded KB from', p); break; } }
}
if(!rawEntries || rawEntries.length===0){ console.log('No training KB found in training/*.jsonl'); process.exit(0); }
const entries = normalize(rawEntries);
console.log('KB entries loaded:', entries.length);

const q = process.argv[2] || 'how do I fix a syntax error in JavaScript';
console.log('\nQuery:', q);
const hits = bm25Search(entries, q, 5);
for(const h of hits) console.log('-', h.id || '', '|', (h.title||'').slice(0,60), '|', (h.text||'').slice(0,120).replace(/\n/g,' '));
console.log('\nSynthesized answer:\n');
console.log(synth(hits));

console.log('\nDone.');
