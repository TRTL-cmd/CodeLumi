;(function(){
  const { spawnSync } = require('child_process');
  const path = require('path');
  const fs = require('fs');

  function runNodeScript(scriptPath, args=[]){
    if(!fs.existsSync(scriptPath)){ console.warn('Script not found, skipping:', scriptPath); return { status:0 }; }
    return spawnSync(process.execPath, [scriptPath, ...args], { stdio:'inherit' });
  }

  const arg = process.argv[2];
  const projectRoot = process.cwd();
  console.log('Running bundler (if present) then copying model...');

  const bundler = path.join(projectRoot,'scripts','bundle-three.js');
  const copyScript = path.join(projectRoot,'scripts','copy-model.js');

  try{
    const bRes = runNodeScript(bundler);
    if(bRes && bRes.error) console.error('Bundler failed:', bRes.error.message);
  }catch(e){ console.warn('Bundler invocation failed', e.message); }

  const cRes = runNodeScript(copyScript, arg? [arg] : []);
  if(cRes && cRes.status !== 0){ console.error('Copy script exited with status', cRes.status); process.exit(cRes.status || 1); }

  console.log('Done.');
})();
const { spawnSync } = require('child_process');
const path = require('path');

if(process.argv.length < 3){
  console.error('Usage: node scripts/copy-and-bundle.js <path-to-model> [dest-filename]');
  process.exit(2);
}

const src = process.argv[2];
const dest = process.argv[3];
const root = process.cwd();

console.log('1) Bundling vendor files...');
let r = spawnSync(process.execPath, [path.join(root, 'scripts', 'bundle-three.js')], { stdio: 'inherit' });
if(r.error || r.status !== 0){ console.error('Bundling vendor files failed'); process.exit(3); }

console.log('2) Copying model...');
r = spawnSync(process.execPath, [path.join(root, 'scripts', 'copy-model.js'), src, dest], { stdio: 'inherit' });
if(r.error || r.status !== 0){ console.error('Copy failed'); process.exit(4); }

console.log('\nDone.');
