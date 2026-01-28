#!/usr/bin/env node
// Create a daily log file under docs/logs/daily/YYYY-MM-DD.md with a template.
// Usage: node tools/log_daily.js [optional short note]

const fs = require('fs');
const path = require('path');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive:true}); }

const note = process.argv.slice(2).join(' ');
const d = new Date();
const yyyy = d.getFullYear();
const mm = String(d.getMonth()+1).padStart(2,'0');
const dd = String(d.getDate()).padStart(2,'0');
const dir = path.join('docs','logs','daily');
ensureDir(dir);
const filename = path.join(dir, `${yyyy}-${mm}-${dd}.md`);
if(fs.existsSync(filename)){
  console.log('Daily log exists:', filename);
  if(note){ fs.appendFileSync(filename, '\n' + note + '\n'); console.log('Appended note'); }
  process.exit(0);
}

const template = `# Daily Log — ${yyyy}-${mm}-${dd}

## Summary

- Work completed:

- Files changed:

- Decisions made:

- Blockers / Risks:

- Next actions:

## Notes

${note||''}
`;
fs.writeFileSync(filename, template);
console.log('Created daily log:', filename);
