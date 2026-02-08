const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runNodeScript(scriptPath, args = []) {
  if (!fs.existsSync(scriptPath)) {
    console.warn('Script not found, skipping:', scriptPath);
    return { status: 0 };
  }
  return spawnSync(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });
}

const arg = process.argv[2];
const projectRoot = process.cwd();
console.log('Running bundler (if present) then copying model...');

const bundler = path.join(projectRoot, 'scripts', 'bundle-three.js');
const copyScript = path.join(projectRoot, 'scripts', 'copy-model.js');

try {
  const bRes = runNodeScript(bundler);
  if (bRes && bRes.error) console.error('Bundler failed:', bRes.error.message);
} catch (e) {
  console.warn('Bundler invocation failed', e.message);
}

const cRes = runNodeScript(copyScript, arg ? [arg] : []);
if (cRes && cRes.status !== 0) {
  console.error('Copy script exited with status', cRes.status);
  process.exit(cRes.status || 1);
}

console.log('Done.');
