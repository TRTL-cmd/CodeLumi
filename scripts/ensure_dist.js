const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const root = process.cwd();
const distMain = path.join(root, 'dist', 'main.js');

function existsAndNonEmpty(p){ try{ const st = fs.statSync(p); return st && st.isFile() && st.size > 0;}catch(e){return false;} }

if (existsAndNonEmpty(distMain)){
  console.log('[ensure_dist] OK: dist/main.js present');
  process.exit(0);
}

console.log('[ensure_dist] dist/main.js missing or empty — attempting to build...');

// Run vite build
console.log('[ensure_dist] Running: npm run build');
let r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build'], { stdio: 'inherit' });
if (r.status !== 0) { console.error('[ensure_dist] npm run build failed'); process.exit(r.status || 1); }

// Try tsc to produce dist/main.js if missing
if (!existsAndNonEmpty(distMain)){
  console.log('[ensure_dist] Running: npx tsc');
  r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc'], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('[ensure_dist] npx tsc failed'); process.exit(r.status || 1); }
}

if (!existsAndNonEmpty(distMain)){
  console.error('[ensure_dist] Still missing dist/main.js after build. Please ensure build completes and OneDrive has synced files locally.');
  process.exit(2);
}

console.log('[ensure_dist] dist/main.js is ready');
process.exit(0);
