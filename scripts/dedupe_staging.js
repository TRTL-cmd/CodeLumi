const fs = require('fs');
const path = require('path');
(async ()=>{
  try {
    const repoTraining = path.join(process.cwd(), 'training');
    const stagingFile = path.join(repoTraining, 'staging.jsonl');
    if(!fs.existsSync(stagingFile)) return console.log('No staging file found');
    const raw = fs.readFileSync(stagingFile, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const items = lines.map(l=>{ try{ return JSON.parse(l); }catch(e){ return null; } }).filter(Boolean);
    // map by normalized QA signature -> keep the latest by timestamp
    const bySig = new Map();
    function normalize(x){ try{ return (x||'').toString().replace(/\s+/g,' ').trim().toLowerCase(); }catch(e){return ''} }
    for(const it of items){
      const sig = normalize(it.q) + '||' + normalize(it.a);
      if(!sig) continue;
      const existing = bySig.get(sig);
      if(!existing) bySig.set(sig, it);
      else {
        const tNew = (it.timestamp||it.ts||it.t||Date.now());
        const tOld = (existing.timestamp||existing.ts||existing.t||0);
        if(tNew >= tOld) bySig.set(sig, it);
      }
    }
    const deduped = Array.from(bySig.values()).sort((a,b)=> (a.timestamp||a.ts||0) - (b.timestamp||b.ts||0));
    // write backup
    const bak = path.join(repoTraining, `staging.backup.${Date.now()}.jsonl`);
    fs.copyFileSync(stagingFile, bak);
    // write new file
    const out = deduped.map(i=>JSON.stringify(i)).join('\n') + (deduped.length? '\n':'');
    fs.writeFileSync(stagingFile, out, 'utf8');
    console.log('Dedupe complete:', { original: lines.length, deduped: deduped.length, backup: bak });
  }catch(e){
    console.error('dedupe failed', e);
    process.exit(1);
  }
})();
