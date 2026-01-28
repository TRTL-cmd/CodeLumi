#!/usr/bin/env node
// bundle-three.js — copy three and GLTFLoader into ./vendor for offline use
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const nodeModules = path.join(projectRoot, 'node_modules');
const vendorDir = path.join(projectRoot, 'vendor');

function ensureVendor(){ if(!fs.existsSync(vendorDir)) fs.mkdirSync(vendorDir, { recursive: true }); }

function copyIfExists(src, dest){
  if(!fs.existsSync(src)) return false;
  fs.copyFileSync(src, dest);
  console.log('Copied', src, '->', dest);
  return true;
}

ensureVendor();

const threeCandidates = [
  path.join(nodeModules, 'three', 'build', 'three.min.js'),
  path.join(nodeModules, 'three', 'build', 'three.js'),
  path.join(nodeModules, 'three', 'build', 'three.module.js')
];

const loaderCandidates = [
  path.join(nodeModules, 'three', 'examples', 'js', 'loaders', 'GLTFLoader.js'),
  path.join(nodeModules, 'three', 'examples', 'jsm', 'loaders', 'GLTFLoader.js')
];

let threeOk = false;
for(const s of threeCandidates){
  if(copyIfExists(s, path.join(vendorDir, 'three.min.js'))){ threeOk = true; break; }
}
if(!threeOk) console.error('Failed to copy three build — run `npm install three` and retry.');

let loaderOk = false;
for(const l of loaderCandidates){
  if(copyIfExists(l, path.join(vendorDir, 'GLTFLoader.js'))){ loaderOk = true; break; }
}
if(!loaderOk) console.error('Failed to copy GLTFLoader — check three examples paths.');

if(threeOk && loaderOk){
  console.log('\nVendor bundle prepared in ./vendor. Update index.html to load /vendor/three.min.js and /vendor/GLTFLoader.js');
  process.exit(0);
} else {
  process.exit(1);
}
