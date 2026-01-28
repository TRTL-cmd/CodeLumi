const fs = require('fs').promises;
const path = require('path');

async function appendUniqueTo(file, entry, opts) {
  const lookbackLines = (opts && opts.lookbackLines) ? opts.lookbackLines : 200;
  const windowMs = (opts && opts.windowMs) ? opts.windowMs : 2 * 60 * 1000;
  try { await fs.mkdir(path.dirname(file), { recursive: true }); } catch (_) {}
  let exists = true;
  try { await fs.access(file); } catch (_) { exists = false; }
  if (exists) {
    try {
      const raw = await fs.readFile(file, 'utf8');
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
  await fs.appendFile(file, JSON.stringify(entry) + '\n', 'utf8');
  return { ok: true };
}

async function runTests() {
  const tmpDir = path.join(process.cwd(), 'tmp', 'test-append');
  const testFile = path.join(tmpDir, 'staging.jsonl');
  try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch (_) {}
  await fs.mkdir(tmpDir, { recursive: true });

  const now = Date.now();
  const e1 = { id: 'u1', q: 'Q1', a: 'A1', timestamp: now };
  const r1 = await appendUniqueTo(testFile, e1, { windowMs: 60_000 });
  if (!r1.ok) { console.error('Test1 failed: expected append'); process.exit(2); }

  // immediate duplicate should be blocked
  const r2 = await appendUniqueTo(testFile, { id: 'u2', q: 'Q1', a: 'A1', timestamp: now + 10 }, { windowMs: 60_000 });
  if (r2.ok) { console.error('Test2 failed: expected duplicate blocked'); process.exit(3); }

  // different content should append
  const r3 = await appendUniqueTo(testFile, { id: 'u3', q: 'QDIFF', a: 'ADIFF', timestamp: now + 20 }, { windowMs: 60_000 });
  if (!r3.ok) { console.error('Test3 failed: expected append for different content'); process.exit(4); }

  console.log('All appendStagingUnique unit tests passed');
}

runTests().catch(err => { console.error(err); process.exit(10); });
