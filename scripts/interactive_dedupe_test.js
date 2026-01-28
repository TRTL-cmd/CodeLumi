const fs = require('fs').promises;
const path = require('path');

async function readTail(file, lines = 10) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const arr = raw.split(/\r?\n/).filter(Boolean);
    return arr.slice(-lines);
  } catch (e) { return []; }
}

async function appendUnique(stagingFile, entry, opts) {
  const lookbackLines = (opts && opts.lookbackLines) ? opts.lookbackLines : 200;
  const windowMs = (opts && opts.windowMs) ? opts.windowMs : 2 * 60 * 1000;
  try { await fs.mkdir(path.dirname(stagingFile), { recursive: true }); } catch (_) {}
  let exists = true;
  try { await fs.access(stagingFile); } catch (_) { exists = false; }
  if (exists) {
    try {
      const raw = await fs.readFile(stagingFile, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const tail = lines.slice(-lookbackLines);
      const now = Date.now();
      for (const ln of tail.reverse()) {
        try {
          const obj = JSON.parse(ln);
          if (!obj) continue;
          if (String(obj.q || '') === String(entry.q || '') && String(obj.a || '') === String(entry.a || '')) {
            const ts = Number(obj.timestamp || obj.t || obj.date || obj.time || 0);
            if (ts && Math.abs(now - Number(ts)) <= windowMs) {
              return { ok: false, reason: 'recent-duplicate' };
            }
          }
        } catch (_e) { continue; }
      }
    } catch (_e) {}
  }
  await fs.appendFile(stagingFile, JSON.stringify(entry) + '\n', 'utf8');
  return { ok: true };
}

async function main() {
  const repoTraining = path.join(process.cwd(), 'training');
  const stagingFile = path.join(repoTraining, 'staging.jsonl');
  console.log('Reading tail before test...');
  console.log(await readTail(stagingFile, 5));

  const entry = {
    id: `itest_${Date.now()}`,
    q: 'INTERACTIVE_DEDUPE_TEST_Q',
    a: 'INTERACTIVE_DEDUPE_TEST_A',
    confidence: 0.5,
    status: 'quarantined',
    timestamp: Date.now()
  };

  console.log('\nAppending first time...');
  console.log(await appendUnique(stagingFile, entry));
  console.log('\nAppending second time (should dedupe)...');
  console.log(await appendUnique(stagingFile, entry));

  console.log('\nReading tail after test...');
  console.log(await readTail(stagingFile, 8));
}

main().catch(err => { console.error(err); process.exit(2); });
