const fs = require('fs');
const path = require('path');

function tryLoad() {
  const tryPaths = [
    path.join(process.cwd(), 'training', 'lumi_knowledge.json'),
    path.join(process.cwd(), 'training', 'codelumi_knowledge.json'),
    path.join(process.cwd(), 'assets', 'persona_from_copy.json')
  ];
  for (const p of tryPaths) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p,'utf8');
      const data = JSON.parse(raw);
      console.log('Loaded KB from', p);
      let entries = [];
      if (Array.isArray(data)) {
        entries = data.map((d,i)=>({ id: d.id || `kb-${i}`, title: d.title || d.q || d.prompt || '', text: d.text || d.a || d.answer || JSON.stringify(d) }));
      } else if (typeof data === 'object') {
        if (Array.isArray(data.qa)) {
          entries = data.qa.map((d,i)=>({ id: d.id || `kb-${i}`, title: d.q||d.title||'', text: d.a||d.text||JSON.stringify(d) }));
        } else if (data.entries && Array.isArray(data.entries)){
          entries = data.entries.map((d,i)=>({ id: d.id || `kb-${i}`, title: d.title||'', text: d.text||JSON.stringify(d) }));
        } else {
          entries = [{ id: 'kb-0', title: data.title || Object.keys(data)[0] || 'kb', text: JSON.stringify(data)}];
        }
      }
      return entries;
    } catch(e) {
      // try next
    }
  }
  return [];
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

const entries = tryLoad();
console.log('KB entries:', entries.length);
if(entries.length===0){ console.log('No KB found.'); process.exit(0); }

const queries = [
  'what is a function',
  'who created you',
  'async await',
  'what is a variable',
  'Lumi name'
];
for(const q of queries){
  console.log('\nQuery:', q);
  const res = bm25Search(entries, q, 5);
  for(const r of res){
    console.log('-', r.id || '', '|', (r.title||'').slice(0,60), '|', (r.text||'').slice(0,140).replace(/\n/g,' '));
  }
}

console.log('\nDone.');
