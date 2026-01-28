const fs = require('fs');
const acorn = require('acorn');
const s = fs.readFileSync('dist/temp_script.js','utf8');
try{
  acorn.parse(s, {ecmaVersion:2023, sourceType:'script'});
  console.log('ACORN_OK');
}catch(e){
  console.error('ACORN_ERR', e.message);
  if(e.loc) console.error('loc', e.loc);
  process.exitCode = 2;
}
