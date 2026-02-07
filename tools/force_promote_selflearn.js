const fs = require('fs');
const path = require('path');

function readJsonFile(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || 'null');
  } catch (e) {
    console.error('Failed to read JSON', p, e.message);
    return null;
  }
}

function writeJsonFile(p, data) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to write JSON', p, e.message);
    return false;
  }
}

function eqEntry(a, b) {
  if (!a || !b) return false;
  return (a.q === b.q && a.a === b.a) || (a.input === b.input && a.output === b.output);
}

function promote({ force = true } = {}) {
  const repoRoot = process.cwd();
  const selfLearnFile = path.join(repoRoot, 'userData', 'self-learn', 'lumi_knowledge.json');
  const trainingFile = path.join(repoRoot, 'training', 'lumi_knowledge.json');
  const userKbFile = path.join(repoRoot, 'userData', 'lumi_knowledge.json');

  const self = readJsonFile(selfLearnFile) || [];
  if (!self.length) {
    console.log('No self-learn entries found at', selfLearnFile);
    return;
  }

  const training = readJsonFile(trainingFile) || [];
  const userKb = readJsonFile(userKbFile) || [];

  let addedToTraining = 0;
  let addedToUserKb = 0;

  for (const item of self) {
    const normalized = Object.assign({}, item);
    // normalize fields for older/newer formats
    if (normalized.q && normalized.a) {
      normalized.input = normalized.q;
      normalized.output = normalized.a;
    }

    // Training
    const existsTraining = training.some(t => eqEntry(t, normalized));
    if (!existsTraining || force) {
      // ensure an id and date
      if (!normalized.id) normalized.id = `prom_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      if (!normalized.date && normalized.learned) normalized.date = normalized.learned;
      training.push(normalized);
      addedToTraining++;
    }

    // User KB
    const existsUser = userKb.some(u => eqEntry(u, normalized));
    if (!existsUser || force) {
      userKb.push(normalized);
      addedToUserKb++;
    }
  }

  writeJsonFile(trainingFile, training);
  writeJsonFile(userKbFile, userKb);

  console.log(`Promoted ${addedToTraining} entries to ${trainingFile}`);
  console.log(`Promoted ${addedToUserKb} entries to ${userKbFile}`);
}

// Simple CLI parsing (no external deps)
const rawArgs = process.argv.slice(2);
let force = true;
for (const a of rawArgs) {
  if (a === '--no-force' || a === '--force=false') force = false;
  if (a === '--force=false') force = false;
  if (a === '--force=true' || a === '--force') force = true;
  if (a.startsWith('--force=')) {
    const v = a.split('=')[1];
    force = (v === 'true');
  }
}

promote({ force });

module.exports = { promote };
