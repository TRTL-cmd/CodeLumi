const fs = require('fs').promises;
const path = require('path');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function run() {
  const cwd = process.cwd();
  const userData = path.join(cwd, 'userData');
  const tmp = path.join(cwd, 'tmp');
  await ensureDir(userData);
  await ensureDir(tmp);

  console.log('Running dry-run test');

  // KB offline test
  const kbPath = path.join(cwd, 'training', 'lumi_knowledge.json');
  if (await fileExists(kbPath)) {
    try {
      const raw = await fs.readFile(kbPath, 'utf8');
      const data = JSON.parse(raw);
      const q = 'Lumi';
      let hits = [];
      if (Array.isArray(data)) {
        hits = data.filter(x => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
      } else if (typeof data === 'object') {
        const s = JSON.stringify(data);
        if (s.toLowerCase().includes(q.toLowerCase())) hits = [data];
      }
      console.log(`KB offline: found ${hits.length} matching entries for '${q}'.`);
    } catch (e) {
      console.log('KB offline: error reading KB', String(e));
    }
  } else {
    console.log('KB offline: no KB file at', kbPath);
  }

  // Prepare test file
  const testFile = path.join(tmp, 'dryrun_test.txt');
  if (!await fileExists(testFile)) {
    await fs.writeFile(testFile, 'original content\n', 'utf8');
  }

  // Proposal -> Step
  const stepId = 'dryrun-' + Date.now();
  const newContent = 'Updated by Lumi dry-run at ' + new Date().toISOString() + '\n';
  console.log('Simulating writeFile to', testFile);

  // Simulate (preview)
  const before = await fs.readFile(testFile, 'utf8');
  console.log('--- PREVIEW ---');
  console.log('BEFORE (first 200 chars):\n', before.substring(0,200));
  console.log('AFTER (first 200 chars):\n', newContent.substring(0,200));
  console.log('--- END PREVIEW ---');

  // Execute (create backup, write file, audit)
  const backupDir = path.join(userData, 'backups', stepId);
  await ensureDir(backupDir);
  const origPath = path.join(backupDir, path.basename(testFile) + '.orig');
  try {
    if (await fileExists(testFile)) {
      const orig = await fs.readFile(testFile);
      await fs.writeFile(origPath, orig);
    }
    await fs.writeFile(testFile, newContent, 'utf8');
    const audit = { stepId, action: 'writeFile', path: testFile, ts: Date.now() };
    const auditPath = path.join(userData, 'audit_' + Date.now() + '.json');
    await fs.writeFile(auditPath, JSON.stringify(audit, null, 2), 'utf8');
    console.log('Execute: wrote file, backup at', origPath, 'audit at', auditPath);
  } catch (e) {
    console.log('Execute error', String(e));
  }

  // Verify
  const wrote = await fs.readFile(testFile, 'utf8');
  console.log('New file contents (first 200 chars):\n', wrote.substring(0,200));

  // Revert
  try {
    if (await fileExists(origPath)) {
      const orig = await fs.readFile(origPath);
      await fs.writeFile(testFile, orig, 'utf8');
      console.log('Revert: restored original from', origPath);
    } else {
      console.log('Revert: no backup found to restore');
    }
  } catch (e) {
    console.log('Revert error', String(e));
  }

  const final = await fs.readFile(testFile, 'utf8');
  console.log('Final file contents (first 200 chars):\n', final.substring(0,200));

  console.log('Dry-run complete. Check userData/backups and userData/audit_*.json for artifacts.');
}

run().catch(e => { console.error('Dry-run failed', e); process.exit(1); });
