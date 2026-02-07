#!/usr/bin/env node
(function(){
  const fs = require('fs');
  const path = require('path');

  const root = path.resolve(__dirname, '..');
  const assetsModels = path.join(root, 'assets', 'models');
  const personaHint = path.join(root, 'assets', 'persona_from_copy.json');

  function log(...a){ console.log(...a); }
  function err(...a){ console.error(...a); }

  function isModelFile(p){ return /\.glb$|\.gltf$/i.test(p); }

  function searchDirForModels(dir, depth=3){
    try{
      if(depth<0) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for(const e of entries){
        const full = path.join(dir, e.name);
        if(e.isFile() && isModelFile(e.name)) return full;
      }
      for(const e of entries){
        const full = path.join(dir, e.name);
        if(e.isDirectory()){
          const found = searchDirForModels(full, depth-1);
          if(found) return found;
        }
      }
    }catch(e){}
    return null;
  }

  function tryVariants(input){
    const candidates = [];
    const base = String(input || '').trim();
    if(!base) return candidates;
    const p = path.resolve(base);
    candidates.push(p);
      candidates.push(path.join(p, 'Lumi.glb'));
      candidates.push(path.join(p, 'Codelumi', 'Lumi.glb'));
    candidates.push(path.join(p, 'lumi', 'lumi.glb'));
    candidates.push(path.join(p, 'Codelumi', 'Codelumi.glb'));
    // try assets relative
    candidates.push(path.join(process.cwd(), base));
    candidates.push(path.join(process.cwd(), 'lumi', 'lumi.glb'));
    candidates.push(path.join(process.cwd(), 'assets', 'models', base));
    candidates.push(path.join(process.cwd(), 'assets', 'models', 'lumi.glb'));
    return candidates;
  }

  function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

  function copyFile(src, dest){ ensureDir(path.dirname(dest)); fs.copyFileSync(src, dest); }

  (function main(){
    const arg = process.argv[2];
    log('copy-model.js starting; searching for GLB...');

    let found = null;
    if(arg){
      // check direct file
      const variants = tryVariants(arg);
      for(const c of variants){ try{ if(fs.existsSync(c) && fs.statSync(c).isFile() && isModelFile(c)){ found = c; break; } }catch(e){} }
      // if arg is directory, search inside
      try{ if(!found && fs.existsSync(arg) && fs.statSync(arg).isDirectory()){ found = searchDirForModels(arg, 4); } }catch(e){}
    }

    // if still not found, do a workspace-wide shallow search for common names
    if(!found){
      const cwd = process.cwd();
        const common = ['Lumi.glb','lumi.glb','Codelumi.glb','model.glb','default.glb'];
      for(const name of common){
        const candidate = path.join(cwd, name); if(fs.existsSync(candidate) && fs.statSync(candidate).isFile()){ found = candidate; break; }
        const sub = path.join(cwd, 'lumi', name); if(fs.existsSync(sub) && fs.statSync(sub).isFile()){ found = sub; break; }
        const am = path.join(cwd, 'assets','models', name); if(fs.existsSync(am) && fs.statSync(am).isFile()){ found = am; break; }
      }
    }

    // last resort: recursive search up to depth 4
    if(!found){
      try{ found = searchDirForModels(process.cwd(), 4); }catch(e){}
    }

    if(!found){ err('No .glb/.gltf model found. Provide a path or place lumi.glb in the repo.'); process.exit(2); }

    log('Found model:', found);
    try{
      ensureDir(assetsModels);
      const dest = path.join(assetsModels, 'Codelumi' + path.extname(found));
      copyFile(found, dest);
      log('Copied model to', dest);
      // write persona hint
      const hint = { name: 'Codelumi', model: '/assets/models/' + path.basename(dest), tone: 'playful · curious · helpful' };
      fs.writeFileSync(personaHint, JSON.stringify(hint, null, 2));
      log('Wrote persona hint to', personaHint);
      process.exit(0);
    }catch(e){ err('Copy failed:', e); process.exit(3); }
  })();
})();
;(function(){
  const fs = require('fs');
  const path = require('path');

  function usage(){
    console.log('Usage: node scripts/copy-model.js <path-to-file-or-directory>');
    process.exit(1);
  }

  const arg = process.argv[2];
  if(!arg) return usage();

  const resolved = path.resolve(arg);
  if(!fs.existsSync(resolved)){
    console.error('Path does not exist:', resolved);
    process.exit(2);
  }

  let candidateFile = null;
  try{
    const stat = fs.statSync(resolved);
    if(stat.isFile()) candidateFile = resolved;
    else if(stat.isDirectory()){
      const entries = fs.readdirSync(resolved);
      const exts = ['.glb','.gltf','.glb.bin','.glb.zip'];
      for(const name of entries){ const low = name.toLowerCase(); if(exts.some(e=>low.endsWith(e))){ candidateFile = path.join(resolved,name); break; } }
    }
  }catch(err){ console.error('Error accessing path:', err.message); process.exit(3); }

  if(!candidateFile){ console.error('No model file found at path or inside directory. Provide a file or directory containing .glb/.gltf'); process.exit(4); }

  const assetsDir = path.join(process.cwd(),'assets','models');
  try{ fs.mkdirSync(assetsDir,{recursive:true}); }catch(e){}

  const destName = 'Codelumi' + path.extname(candidateFile).toLowerCase();
  const destPath = path.join(assetsDir,destName);
  try{ fs.copyFileSync(candidateFile,destPath); console.log('Copied model to', destPath); }catch(err){ console.error('Failed to copy model:', err.message); process.exit(5); }

  const persona = { name:'Codelumi', model:`/assets/models/${destName}`, tone:'friendly', interests:['coding','learning','helping'], createdAt:new Date().toISOString() };
  const personaPath = path.join(process.cwd(),'assets','persona_from_copy.json');
  try{ fs.writeFileSync(personaPath, JSON.stringify(persona,null,2),'utf8'); console.log('Wrote persona hint to', personaPath); }catch(err){ console.error('Failed to write persona hint:', err.message); }

  console.log('Done. Restart the app or open the persona editor to load the model.');
})();
const fs = require('fs');
const path = require('path');

if(process.argv.length < 3){
  console.error('Usage: node scripts/copy-model.js <path-to-model> [dest-filename]');
  process.exit(2);
}

let src = process.argv[2];
const destName = process.argv[3] || path.basename(src);
const projectRoot = process.cwd();
const destDir = path.join(projectRoot, 'assets', 'models');

function findSource(p){
  if(!p) return null;
  // exact match
  if(fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  // if p is a directory, search for candidate files inside
  if(fs.existsSync(p) && fs.statSync(p).isDirectory()){
    const files = fs.readdirSync(p);
    const cand = files.find(f=>/\.gltf?$|\.glb$|\.glbits$/i.test(f));
    if(cand) return path.join(p,cand);
    return null;
  }
  // try common extensions and case variations
  const exts = ['.glb','.gltf','.glbits'];
  const base = p.replace(/\.(glb|gltf|glbits)$/i,'');
  for(const e of exts){
    const t = base + e;
    if(fs.existsSync(t) && fs.statSync(t).isFile()) return t;
  }
  // try parent directory search for files with same basename
  const dir = path.dirname(p);
  if(fs.existsSync(dir)){
    const files = fs.readdirSync(dir);
    const bn = path.basename(base).toLowerCase();
    const cand = files.find(f=> f.toLowerCase().startsWith(bn) && /\.gltf?$|\.glb$|\.glbits$/i.test(f));
    if(cand) return path.join(dir,cand);
  }
  return null;
}

const found = findSource(src);
if(found) src = found;
if(!fs.existsSync(src)){
  console.error('Source file not found:', src);
  process.exit(3);
}
if(!fs.existsSync(destDir)){
  fs.mkdirSync(destDir, { recursive: true });
}
const dest = path.join(destDir, destName);
try{
  fs.copyFileSync(src, dest);
  console.log('Copied', src, '->', dest);
  console.log('\nNow open the app and set the Model URL to /assets/models/' + destName + ' or click Use Workspace Model in the Personality Editor.');
  // write a small persona hint file so the app can auto-load this model
    try{
      const hint = { model: '/assets/models/' + destName, name: 'Codelumi', tone: 'playful · curious · helpful', interests: 'coding,cats,learning' };
      const hintPath = path.join(projectRoot, 'assets', 'persona_from_copy.json');
      fs.writeFileSync(hintPath, JSON.stringify(hint, null, 2));
      console.log('Wrote persona hint to', hintPath);
    }catch(e){ console.warn('Failed to write persona hint file:', e.message); }
}catch(e){
  console.error('Copy failed:', e.message);
  process.exit(4);
}
