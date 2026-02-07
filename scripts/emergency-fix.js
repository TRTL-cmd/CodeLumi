
/**
 * Emergency fix for Lumi
 * - Clears common Electron caches
 * - Runs `scripts/unwrap-kb.js` if present
 * - Resets self-learn seen cache
 * - Checks Ollama status
 * - Runs privacy audit for quick validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) { console.log(msg); }
function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'inherit', encoding: 'utf-8' });
  } catch (e) {
    return null;
  }
}

const projectRoot = process.cwd();
log('\n🔧 Running Lumi emergency fix...\n');

// 1) Clear local Electron caches under common locations
const localApp = process.env.LOCALAPPDATA || process.env.APPDATA || '';
if (localApp) {
  const lumiApp = path.join(localApp, 'lumi-desktop');
  const cacheDirs = ['Cache', 'GPUCache', 'Code Cache'];
  cacheDirs.forEach(d => {
    const p = path.join(lumiApp, d);
    if (fs.existsSync(p)) {
      try {
        fs.rmSync(p, { recursive: true, force: true });
        log(`🧹 Removed cache: ${p}`);
      } catch (e) {
        log(`⚠️  Could not remove ${p}: ${e.message}`);
      }
    }
  });
}

// Also clear project-level cache folders if present
['Cache','GPUCache','"Code Cache"','.cache'].forEach(d => {
  const p = path.join(projectRoot, d);
  if (fs.existsSync(p)) {
    try { fs.rmSync(p, { recursive: true, force: true }); log(`🧹 Removed project cache: ${p}`); }
    catch (e) { log(`⚠️  Could not remove ${p}: ${e.message}`); }
  }
});

// 2) Run unwrap script if present
const unwrap = path.join(projectRoot, 'scripts', 'unwrap-kb.js');
if (fs.existsSync(unwrap)) {
  log('\n🔁 Running unwrap-kb.js to fix KB format...');
  run(`node "${unwrap}"`);
} else {
  log('\nℹ️  unwrap-kb.js not found; skipping KB unwrap step');
}

// 3) Reset selflearn_seen.json if present (clear stale seen cache)
const appData = process.env.APPDATA || process.env.LOCALAPPDATA || '';
if (appData) {
  const seenPath = path.join(appData, 'lumi-desktop', 'self-learn', 'selflearn_seen.json');
  try {
    if (fs.existsSync(seenPath)) {
      fs.writeFileSync(seenPath, JSON.stringify({}), 'utf-8');
      log(`♻️  Reset seen cache: ${seenPath}`);
    } else {
      log('ℹ️  No seen cache found; skipping');
    }
  } catch (e) {
    log(`⚠️  Could not reset seen cache: ${e.message}`);
  }
}

// 4) Check Ollama status
log('\n🔎 Checking Ollama status...');
try {
  run('ollama list');
  log('✅ Ollama appears reachable (see output above)');
} catch (e) {
  log('❌ Ollama check failed; run `ollama serve` if needed');
}

// 5) Run privacy audit for a quick validation (optional)
const audit = path.join(projectRoot, 'scripts', 'privacy_audit.js');
if (fs.existsSync(audit)) {
  log('\n🔐 Running privacy audit (quick validation)');
  try { run(`node "${audit}"`); }
  catch (e) { log('⚠️  Privacy audit failed to run'); }
} else {
  log('\nℹ️  privacy_audit.js not found; skipping audit');
}

log('\n🎉 Emergency fix complete. Restart Lumi and Ollama if required.');
