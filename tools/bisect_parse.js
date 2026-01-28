const fs = require('fs');
const vm = require('vm');
const s = fs.readFileSync('dist/temp_script.js','utf8');
let lo = 0, hi = s.length;
let ok = 0;
while(lo <= hi){
  const mid = Math.floor((lo+hi)/2);
  const slice = s.slice(0, mid);
  try{ new vm.Script(slice); ok = mid; lo = mid+1; }catch(e){ hi = mid-1; }
}
console.log('largest ok prefix length:', ok);
const context = s.slice(Math.max(0, ok-120), Math.min(s.length, ok+120));
console.log('\n--- context around break ---\n');
console.log(context);
console.log('\n--- hex of next bytes ---\n');
const next = s.slice(ok, ok+40).split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
console.log(next);
