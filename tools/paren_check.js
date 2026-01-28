const fs = require('fs');
const p = 'dist/temp_script.js';
const s = fs.readFileSync(p,'utf8');
let line=1; let col=0;
let pc=0, bc=0, qc=0; // paren, brace, bracket
for(let i=0;i<s.length;i++){
  const ch = s[i];
  if(ch==='\n'){ line++; col=0; continue; }
  col++;
  if(ch==='(') pc++;
  else if(ch===')') { pc--; if(pc<0){ console.error('Extra ) at', line+':'+col); process.exit(2);} }
  else if(ch==='{') bc++;
  else if(ch==='}') { bc--; if(bc<0){ console.error('Extra } at', line+':'+col); process.exit(2);} }
  else if(ch==='[') qc++;
  else if(ch===']') { qc--; if(qc<0){ console.error('Extra ] at', line+':'+col); process.exit(2);} }
}
console.log('paren:',pc,'brace:',bc,'bracket:',qc);
if(pc!==0 || bc!==0 || qc!==0) process.exitCode=3; else process.exitCode=0;
