const fs = require('fs');
const path = require('path');

function findMatches(content, regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

const repoRoot = path.resolve(__dirname, '..');
// allowlist for approved contact email
const emailAllowlist = new Set(['tortolcoin@gmail.com']);

const checks = [
  {
    file: path.join(repoRoot, 'training', 'lumi_knowledge.json'),
    patterns: [ /C:\\Users\\/i ],
  },
  {
    file: path.join(repoRoot, 'training', 'training.jsonl'),
    patterns: [ /C:\\Users\\/i, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g ],
  },
];

let failed = false;

for (const check of checks) {
  if (!fs.existsSync(check.file)) continue;
  const content = fs.readFileSync(check.file, 'utf8');
  for (const pattern of check.patterns) {
    let matches = findMatches(content, pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g'));
    // filter out allowlisted example emails
    try{
      if (pattern instanceof RegExp && pattern.source && pattern.source.includes('@')){
        matches = matches.map(m => m.toLowerCase()).filter(m => !emailAllowlist.has(m));
      }
    }catch(_){ }
    if (matches.length) {
      console.error(`Found ${matches.length} matches for ${pattern} in ${check.file}`);
      console.error(matches.slice(0, 20).join('\n'));
      failed = true;
    }
  }
}

if (failed) {
  console.error('basic_checks failed: sensitive patterns found');
  process.exit(1);
}

console.log('basic_checks: OK');
process.exit(0);
