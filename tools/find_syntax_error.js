const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '..', 'dist', 'temp_script.js');
const s = fs.readFileSync(p,'utf8');
const lines = s.split('\n');
for(let i=1;i<=lines.length;i++){
  const prefix = lines.slice(0,i).join('\n');
  try{ new Function(prefix); }
  catch(e){ console.error('FAIL at line', i, '->', e.message); process.exit(1); }
}
console.log('No syntax error detected when testing line-by-line (strange)');
