const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

async function computeEmbedding(text, dim = 128) {
  const vec = new Array(dim).fill(0);
  if (!text) return vec;
  const toks = String(text).toLowerCase().split(/\W+/).filter(Boolean);
  for (const t of toks) {
    const h = crypto.createHash('sha1').update(t).digest();
    const idx = h.readUInt16BE(0) % dim;
    vec[idx] += 1;
  }
  let sum = 0;
  for (let i = 0; i < dim; i++) sum += vec[i] * vec[i];
  if (sum > 0) {
    const norm = Math.sqrt(sum);
    for (let i = 0; i < dim; i++) vec[i] = vec[i] / norm;
  }
  return vec;
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] || 0) * (b[i] || 0);
  return s;
}

function shaKey(q, file) {
  return crypto.createHash('sha1').update(`${q}||${file || ''}`).digest('hex');
}

async function run() {
  try {
    const repoRoot = process.cwd();
    const trainingDir = path.join(repoRoot, 'training');
    const kbFile = path.join(trainingDir, 'lumi_knowledge.json');
    if (!fsSync.existsSync(kbFile)) return console.log('No KB file found at', kbFile);

    const raw = await fs.readFile(kbFile, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.qa) ? parsed.qa : []);
    console.log('Loaded entries:', arr.length);

    const retained = [];
    const duplicates = [];
    const embeddingsIndex = {};
    const DIM = 128;
    const SIM_THRESHOLD = 0.9;

    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      const q = (it.q || it.input || it.question || '').toString().trim();
      const a = (it.a || it.output || it.answer || '').toString().trim();
      const file = it.file || '';
      if (!q || !a) {
        duplicates.push({ reason: 'empty', index: i });
        continue;
      }
      const text = q + '\n' + a;
      const emb = await computeEmbedding(text, DIM);
      let bestSim = 0;
      let bestKey = null;
      for (const [k, v] of Object.entries(embeddingsIndex)) {
        const sim = cosineSim(emb, v);
        if (sim > bestSim) { bestSim = sim; bestKey = k; }
      }
      if (bestSim >= SIM_THRESHOLD) {
        duplicates.push({ reason: 'semantic', index: i, similar_to: bestKey, sim: bestSim });
        continue;
      }
      const key = shaKey(q, file);
      embeddingsIndex[key] = emb;
      it.semantic_id = key;
      retained.push(it);
    }

    console.log(`Retained: ${retained.length}, Duplicates: ${duplicates.length}`);

    // backup original
    const backupFile = path.join(trainingDir, `lumi_knowledge.backup.${Date.now()}.json`);
    await fs.copyFile(kbFile, backupFile);
    console.log('Backup written to', backupFile);

    // write deduped
    const dedupFile = path.join(trainingDir, 'lumi_knowledge.deduped.json');
    await fs.writeFile(dedupFile, JSON.stringify({ qa: retained }, null, 2), 'utf8');
    console.log('Wrote deduped KB:', dedupFile);

    // write migration log
    const migFile = path.join(trainingDir, 'lumi_knowledge.dedupe.log.jsonl');
    const lines = duplicates.map(d => JSON.stringify(d));
    await fs.writeFile(migFile, lines.join('\n') + '\n', 'utf8');
    console.log('Wrote migration log:', migFile);

    // persist embeddings to userData/self-learn
    const userDataSelf = path.join(repoRoot, 'userData', 'self-learn');
    await fs.mkdir(userDataSelf, { recursive: true });
    const embPath = path.join(userDataSelf, 'embeddings.json');
    await fs.writeFile(embPath, JSON.stringify(embeddingsIndex, null, 2), 'utf8');
    console.log('Wrote embeddings index:', embPath);

    console.log('Dedupe pass complete.');
  } catch (err) {
    console.error('dedupe_kb failed', err);
    process.exit(1);
  }
}

run();
 
