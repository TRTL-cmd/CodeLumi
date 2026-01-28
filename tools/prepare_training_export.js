#!/usr/bin/env node
// Prepare a JSONL training file from a Codelumi KB JSON export.
// Usage: node prepare_training_export.js lumi_knowledge.json out.jsonl

const fs = require('fs');
const path = require('path');

function clean(s){ if(!s) return ''; return String(s).replace(/\s+/g,' ').trim(); }

async function main(){
  const args = process.argv.slice(2);
  if(args.length < 1){ console.error('Usage: node prepare_training_export.js <kb.json> [out.jsonl]'); process.exit(2); }
  const inFile = args[0];
  const outFile = args[1] || (path.basename(inFile, path.extname(inFile)) + '.jsonl');
  if(!fs.existsSync(inFile)){ console.error('Input file not found:', inFile); process.exit(2); }
  const raw = fs.readFileSync(inFile, 'utf8');
  let kb;
  try{ kb = JSON.parse(raw); }catch(e){ console.error('Invalid JSON:', e); process.exit(2); }
  const qa = kb.qa || [];
  const out = fs.createWriteStream(outFile, {flags:'w'});
  for(const e of qa){
    const q = clean(e.q || '');
    const a = clean(e.a || '');
    if(!q || !a) continue;
    const prompt = `Q: ${q}\nA:`;
    const completion = ` ${a}`;
    out.write(JSON.stringify({prompt, completion}) + '\n');
  }
  out.end();
  console.log('Wrote', outFile, 'with', qa.length, 'entries');
}

main();
