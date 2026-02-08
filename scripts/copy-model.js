const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetsModels = path.join(root, 'assets', 'models');
const personaHint = path.join(root, 'assets', 'persona_from_copy.json');

function log(...args) { console.log(...args); }
function err(...args) { console.error(...args); }

function isModelFile(p) {
  return /\.glb$|\.gltf$/i.test(p);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function searchDirForModels(dir, depth = 3) {
  try {
    if (depth < 0) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isFile() && isModelFile(e.name)) return full;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        const found = searchDirForModels(full, depth - 1);
        if (found) return found;
      }
    }
  } catch (_e) { }
  return null;
}

function tryVariants(input) {
  const candidates = [];
  const base = String(input || '').trim();
  if (!base) return candidates;
  const p = path.resolve(base);
  candidates.push(p);
  candidates.push(path.join(p, 'Lumi.glb'));
  candidates.push(path.join(p, 'Codelumi', 'Lumi.glb'));
  candidates.push(path.join(p, 'lumi', 'lumi.glb'));
  candidates.push(path.join(p, 'Codelumi', 'Codelumi.glb'));
  candidates.push(path.join(process.cwd(), base));
  candidates.push(path.join(process.cwd(), 'lumi', 'lumi.glb'));
  candidates.push(path.join(process.cwd(), 'assets', 'models', base));
  candidates.push(path.join(process.cwd(), 'assets', 'models', 'lumi.glb'));
  return candidates;
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function main() {
  const arg = process.argv[2];
  log('copy-model.js starting; searching for GLB...');

  let found = null;
  if (arg) {
    const variants = tryVariants(arg);
    for (const c of variants) {
      try {
        if (fs.existsSync(c) && fs.statSync(c).isFile() && isModelFile(c)) {
          found = c;
          break;
        }
      } catch (_e) { }
    }
    try {
      if (!found && fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
        found = searchDirForModels(arg, 4);
      }
    } catch (_e) { }
  }

  if (!found) {
    const cwd = process.cwd();
    const common = ['Lumi.glb', 'lumi.glb', 'Codelumi.glb', 'model.glb', 'default.glb'];
    for (const name of common) {
      const candidate = path.join(cwd, name);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { found = candidate; break; }
      const sub = path.join(cwd, 'lumi', name);
      if (fs.existsSync(sub) && fs.statSync(sub).isFile()) { found = sub; break; }
      const am = path.join(cwd, 'assets', 'models', name);
      if (fs.existsSync(am) && fs.statSync(am).isFile()) { found = am; break; }
    }
  }

  if (!found) {
    try { found = searchDirForModels(process.cwd(), 4); } catch (_e) { }
  }

  if (!found) {
    err('No .glb/.gltf model found. Provide a path or place lumi.glb in the repo.');
    process.exit(2);
  }

  log('Found model:', found);
  try {
    ensureDir(assetsModels);
    const dest = path.join(assetsModels, 'Codelumi' + path.extname(found));
    copyFile(found, dest);
    log('Copied model to', dest);
    const hint = { name: 'Codelumi', model: '/assets/models/' + path.basename(dest), tone: 'playful, curious, helpful' };
    fs.writeFileSync(personaHint, JSON.stringify(hint, null, 2));
    log('Wrote persona hint to', personaHint);
    process.exit(0);
  } catch (e) {
    err('Copy failed:', e);
    process.exit(3);
  }
}

main();
