const fs = require('fs');
const path = require('path');

function loadJSONL(p){ if(!fs.existsSync(p)) return []; const raw = fs.readFileSync(p,'utf8'); return raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{ try{return JSON.parse(l);}catch(e){return null} }).filter(Boolean); }

console.log('🔍 Extracting learning candidates...');
const memPath = path.join(process.cwd(),'userData','lumi_memory.jsonl');
const mem = loadJSONL(memPath);
console.log('Loaded memory entries:', mem.length);
const signals = mem.filter(e=>e && e.role === 'signal');
console.log('Loaded KB usage / signal entries:', signals.length);

const candidates = [];
for(const s of signals){ try{ const text = (s.text||'').toString(); if(!text || text.length<40) continue; // skip tiny
    // only pick signals that look like positive feedback or copy events
    const meta = s.meta || {};
    if(meta && (meta.signals || meta.type)){
      candidates.push({ ts: s.ts || Date.now(), text: text.slice(0,2000), meta });
    }
  }catch(e){}
}

// simple dedupe by text prefix
const seen = new Set();
const dedup = [];
for(const c of candidates){ const k = c.text.slice(0,200); if(seen.has(k)) continue; seen.add(k); dedup.push(c); }

const outDir = path.join(process.cwd(),'training','staging');
fs.mkdirSync(outDir, { recursive: true });
const date = new Date().toISOString().slice(0,10);
const outFile = path.join(outDir, `candidates_${date}.jsonl`);
const summaryFile = path.join(outDir, `summary_${date}.md`);
for(const d of dedup) fs.appendFileSync(outFile, JSON.stringify(d) + '\n', 'utf8');

const summary = [`# Candidate extraction ${date}`, `Total memory entries: ${mem.length}`, `Signals found: ${signals.length}`, `Total candidates: ${candidates.length}`, `After deduplication: ${dedup.length}`, ``, `Review file: ${path.relative(process.cwd(), outFile)}`].join('\n');
fs.writeFileSync(summaryFile, summary, 'utf8');

console.log('\n✅ Extraction complete!');
console.log('   Total candidates:', candidates.length);
console.log('   After deduplication:', dedup.length);
console.log('   Review candidates in:', summaryFile);
