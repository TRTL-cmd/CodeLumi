const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '..', 'dist', 'temp_script.js');
try{
  const s = fs.readFileSync(p, 'utf8');
  // Wrap in Function to parse without executing top-level code
  new Function(s);
  console.log('SYNTAX_OK');
}catch(e){
  console.error('SYNTAX_ERROR');
  console.error(e && e.stack ? e.stack : String(e));
  process.exitCode = 2;
}
