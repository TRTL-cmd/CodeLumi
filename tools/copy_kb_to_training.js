#!/usr/bin/env node
// Copy a downloaded or existing lumi_knowledge.json into workspace/training/
// and run the exporters to produce training JSONL files.

const fs = require('fs');
const path = require('path');
const child = require('child_process');

function usage() {
  console.log('Usage: node tools/copy_kb_to_training.js <path-to-lumi_knowledge.json>');
  process.exit(2);
}

const src = process.argv[2];
if (!src) usage();
if (!fs.existsSync(src)) {
  console.error('Source file not found:', src);
  process.exit(2);
}

const outDir = path.join(process.cwd(), 'training');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const dest = path.join(outDir, 'lumi_knowledge.json');
fs.copyFileSync(src, dest);
console.log('Copied KB to', dest);

// Run exporters (if present) to create training data
try {
  const kbArg = dest;
  const trainOut = path.join(outDir, 'training.jsonl');
  const plansOut = path.join(outDir, 'plans.jsonl');

  console.log('Running exporters...');
  child.execFileSync('node', ['tools/export_kb_for_training.js', kbArg, trainOut], { stdio: 'inherit' });
  child.execFileSync('node', ['tools/export_plans_for_training.js', kbArg, plansOut], { stdio: 'inherit' });
  console.log('Exported training files to', outDir);
} catch (e) {
  console.warn('Exporters failed or not present. You can run them manually.');
}
