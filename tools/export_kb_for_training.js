#!/usr/bin/env node
// Export KB QA pairs from a Codelumi KB JSON file into JSONL for training.
// Usage: node tools/export_kb_for_training.js path/to/lumi_knowledge.json [out.jsonl]

const fs = require('fs');
const path = require('path');

function usage(){
  console.log('Usage: node tools/export_kb_for_training.js path/to/lumi_knowledge.json [out.jsonl]');
  console.log('');
}

async function main(){
  const infile = process.argv[2];
  const outfile = process.argv[3] || null;
  if(!infile){ usage(); process.exit(1); }
  if(!fs.existsSync(infile)){ console.error('Input file not found:', infile); process.exit(2); }
  const raw = fs.readFileSync(infile, 'utf8');
  let kb = null;
  try{ kb = JSON.parse(raw); }catch(e){ console.error('Invalid JSON:', e.message); process.exit(3); }
  const qa = (kb && kb.qa && Array.isArray(kb.qa)) ? kb.qa : [];
  const out = outfile ? fs.createWriteStream(outfile, {flags:'w'}) : process.stdout;
  let count = 0;
  for(const e of qa){
    const q = (e.q || '').toString();
    const a = (e.a || '').toString();
    if(!q || !a) continue;
    const obj = { input: q, output: a };
    out.write(JSON.stringify(obj) + '\n');
    count++;
  }
  if(outfile) out.end();
  console.log('\nExported', count, 'QA pairs');
}

main().catch(e=>{ console.error(e); process.exit(10); });
