const fs = require('fs');
const path = require('path');

function loadJSONL(p){ if(!fs.existsSync(p)) return []; const raw = fs.readFileSync(p,'utf8'); return raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{ try{return JSON.parse(l);}catch(e){return null} }).filter(Boolean); }

const mem = loadJSONL(path.join(process.cwd(),'userData','lumi_memory.jsonl'));
const kbUsage = loadJSONL(path.join(process.cwd(),'userData','kb_usage.jsonl'));
const now = Date.now();
const times = mem.map(m=>m.ts||now).sort();
const timespanDays = times.length > 1 ? Math.max(1, (times[times.length-1]-times[0])/(1000*60*60*24)) : 1;

const byRole = {};
for(const m of mem){ const r = m.role || 'unknown'; byRole[r] = (byRole[r]||0)+1; }

console.log('📊 Lumi Telemetry Dashboard');
console.log('\n📈 OVERALL STATISTICS');
console.log('   Memory Entries:', mem.length);
console.log('   KB Queries:', kbUsage.length);
console.log('   Timespan (days):', timespanDays.toFixed(2));
console.log('   Avg entries/day:', (mem.length / timespanDays).toFixed(1));

console.log('\n💾 MEMORY BREAKDOWN');
Object.keys(byRole).sort().forEach(r=>{ console.log(`   ${r.padEnd(14)} ${byRole[r]} (${((byRole[r]/mem.length)*100).toFixed(1)}%)`); });

console.log('\n📚 KB USAGE ANALYSIS');
const queriesWithHits = kbUsage.filter(k=>k.hits && k.hits.length>0).length;
console.log(`   Queries with hits: ${queriesWithHits}/${kbUsage.length} (${kbUsage.length?((queriesWithHits/kbUsage.length)*100).toFixed(1):0}%)`);
const avgHits = kbUsage.length? (kbUsage.reduce((s,k)=>s + (k.hits? k.hits.length:0),0)/kbUsage.length).toFixed(2) : 0;
console.log(`   Avg hits/query: ${avgHits}`);

console.log('\nDone.');
