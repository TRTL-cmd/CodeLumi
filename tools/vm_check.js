const fs = require('fs');
const vm = require('vm');
const s = fs.readFileSync('dist/temp_script.js','utf8');
try{
  new vm.Script(s, {filename: 'temp_script.js'});
  console.log('PARSE_OK');
}catch(e){ console.error('PARSE_FAIL', e.message); console.error(e.stack); process.exitCode=2; }
