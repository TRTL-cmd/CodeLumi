const fs = require('fs').promises;
const path = require('path');

const file = path.join(process.cwd(), 'userData', 'lumi_memory.jsonl');

async function ensure(){ try{ await fs.mkdir(path.dirname(file), { recursive: true }); await fs.access(file).catch(()=>fs.writeFile(file,'','utf8')); }catch(e){} }

async function add(entry){ await ensure(); const e = Object.assign({}, entry, { t: entry.t || Date.now() }); await fs.appendFile(file, JSON.stringify(e) + '\n', 'utf8'); return e; }

async function all(){ await ensure(); const raw = await fs.readFile(file, 'utf8').catch(()=>''); if(!raw) return []; const lines = raw.split('\n').filter(Boolean); return lines.map(l=>{ try{return JSON.parse(l);}catch(e){return null;} }).filter(Boolean); }

async function query(q, limit=50){ if(!q) return []; const arr = await all(); const low = q.toLowerCase(); const matches = arr.filter(e => (e.text||'').toLowerCase().includes(low) || JSON.stringify(e.meta||'').toLowerCase().includes(low)); matches.sort((a,b)=> (b.t||0) - (a.t||0)); return matches.slice(0,limit); }

(async ()=>{
  console.log('Testing memory file:', file);
  await add({ role: 'user', text: 'This is a test memory about JavaScript promises', meta: { source: 'test' } });
  await add({ role: 'signal', text: 'positive feedback: thanks', meta: { signals: [{type:'positive_feedback', confidence:0.9}] } });
  const allEntries = await all();
  console.log('All entries count:', allEntries.length);
  const qres = await query('thanks');
  console.log('Query thanks ->', qres.length, 'entries');
  console.log(qres.slice(0,3));
})().catch(e=>{ console.error(e); process.exit(2); });
