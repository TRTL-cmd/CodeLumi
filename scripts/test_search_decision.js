const fs = require('fs');
const path = require('path');

function loadJSONL(p){ if(!fs.existsSync(p)) return []; const raw = fs.readFileSync(p,'utf8'); return raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{ try{return JSON.parse(l);}catch(e){return null} }).filter(Boolean); }
function normalize(entries){ return entries.map((d,i)=>({ id: d.id || `kb-${i}`, title: d.q || d.title || d.prompt || '', text: d.a || d.answer || d.text || JSON.stringify(d) })); }
function tokenize(text){ return (text||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }
function bm25Scores(entries, q){ const k1=1.5,b=0.75; const qTokens=tokenize(q); if(qTokens.length===0) return entries.map(e=>({entry:e,score:0})); const docsTokens = entries.map(e=>tokenize((e.title||'')+' '+(e.text||''))); const docLens = docsTokens.map(t=>t.length||1); const avgdl = docLens.reduce((a,b)=>a+b,0)/docLens.length; const N=entries.length; const df={}; for(const toks of docsTokens){ const seen=new Set(); for(const t of toks){ if(!seen.has(t)){ seen.add(t); df[t]=(df[t]||0)+1; } } } function idf(term){ const freq=df[term]||0; return Math.log(1 + (N - freq + 0.5)/(freq + 0.5)); } const scores=[]; for(let i=0;i<entries.length;i++){ const toks=docsTokens[i]; const dl=docLens[i]; const tf={}; for(const t of toks) tf[t]=(tf[t]||0)+1; let sc=0; for(const qt of qTokens){ const termIdf=idf(qt); const freq=tf[qt]||0; const denom = freq + k1*(1 - b + b*(dl/avgdl)); sc += termIdf * ((freq*(k1+1))/(denom||1)); const titleTokens = tokenize(entries[i].title||''); const titleCount = titleTokens.filter(t=>t===qt).length; if(titleCount) sc += termIdf * titleCount * 0.6; } if(sc>0) sc = sc * (1 + 0.1 * (1 - (dl / Math.max(avgdl,1)))); scores.push({entry: entries[i], score: sc}); } scores.sort((a,b)=>b.score-a.score); return scores; }
function rerankOverlap(query, candidates){ const qTok=new Set(tokenize(query)); return candidates.map(c=>{ const t = tokenize((c.title||'')+' '+(c.text||'')); if(t.length===0) return 0; let common=0; for(const w of t) if(qTok.has(w)) common++; return Math.min(1, common/Math.sqrt(qTok.size * t.length)); }); }

const tryPaths = [path.join(process.cwd(),'training','training.jsonl'), path.join(process.cwd(),'training.jsonl'), path.join(process.cwd(),'training','lumi_knowledge.json')];
let raw=[];
for(const p of tryPaths){ if(fs.existsSync(p)){ if(p.endsWith('.jsonl')) raw=loadJSONL(p); else { try{ raw = JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){} } if(raw && raw.length) { console.log('Loaded KB from', p); break;} } }
if(!raw || raw.length===0){ console.log('No KB found in training locations'); process.exit(0); }
const entries = normalize(raw);
const q = process.argv[2] || 'how to sort an array in javascript';
console.log('\nQuery:', q);
const scored = bm25Scores(entries, q);
const top = scored.slice(0,10).map(s=>({entry:s.entry, bm25: s.score}));
const reranks = rerankOverlap(q, top.map(t=>t.entry));
const merged = top.map((t,i)=>({ id: t.entry.id, title: t.entry.title, bm25: t.bm25, rerank: reranks[i], final: (Math.tanh(t.bm25/3)*0.4) + (reranks[i]*0.6) }));
merged.sort((a,b)=>b.final-a.final);
console.log('\nTop decision output:');
if(merged.length===0) console.log('  (no hits)');
else for(const m of merged.slice(0,5)) console.log(` - ${m.id} | ${m.title.slice(0,80)} | final:${m.final.toFixed(3)} bm25:${m.bm25.toFixed(3)} rerank:${m.rerank.toFixed(3)}`);
console.log('\nRecommended action:', (merged[0] && merged[0].final >= 0.65 && (merged[0].bm25 || 0) >= 0.1) ? 'kb' : 'ollama');
