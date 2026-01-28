const fs = require('fs').promises;
const path = require('path');

async function countLines(file) {
  try { const raw = await fs.readFile(file, 'utf8'); return raw.split(/\r?\n/).filter(Boolean).length; } catch (e) { return 0; }
}

async function main() {
  const repoTraining = path.join(process.cwd(), 'training');
  const t1 = path.join(repoTraining, 'training.jsonl');
  const s = path.join(repoTraining, 'staging.jsonl');
  const dedup = path.join(repoTraining, 'lumi_knowledge.deduped.json');
  const results = {
    training_lines: await countLines(t1),
    staging_lines: await countLines(s),
    dedup_exists: (await (async () => { try { await fs.access(dedup); return true; } catch (_) { return false; } })())
  };
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => { console.error(err); process.exit(2); });
