const fs = require('fs');
const path = require('path');

async function run() {
  const repoTraining = path.join(process.cwd(), 'training');
  const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
  const backupFile = path.join(repoTraining, `lumi_knowledge.backup.${Date.now()}.json`);
  const reportFile = path.join(repoTraining, 'repair_report.json');
  try {
    const raw = await fs.promises.readFile(kbFile, 'utf8');
    let parsed = JSON.parse(raw || '[]');
    let arr = null;
    if (Array.isArray(parsed)) arr = parsed;
    else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.qa)) arr = parsed.qa;
    else {
      console.error('KB file root is not an array and no qa[] found; aborting');
      process.exit(2);
    }

    await fs.promises.copyFile(kbFile, backupFile);

    const report = { originalCount: arr.length, repaired: 0, skipped: 0, changes: [] };

    function fix(s) {
      try {
        if (!s || typeof s !== 'string') return s;
        if (/[âÃ]/.test(s)) {
          try { s = Buffer.from(s, 'latin1').toString('utf8'); } catch (e) { }
        }
        try { s = s.normalize ? s.normalize('NFKC') : s; } catch (e) {}
        s = s.replace(/[^\x09\x0A\x0D\x20-\x7E\x80-\xFF]/g, '');
        return s;
      } catch (e) { return s; }
    }

    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      const beforeQ = it.input || it.q || '';
      const beforeA = it.output || it.a || '';
      const afterQ = fix(String(beforeQ));
      const afterA = fix(String(beforeA));
      if (afterQ !== String(beforeQ) || afterA !== String(beforeA)) {
        report.repaired++;
        report.changes.push({ id: it.id || i, before: { q: beforeQ, a: beforeA }, after: { q: afterQ, a: afterA } });
        if (it.input !== undefined) it.input = afterQ; else it.q = afterQ;
        if (it.output !== undefined) it.output = afterA; else it.a = afterA;
      } else report.skipped++;
    }

    // write back into original structure
    if (Array.isArray(parsed)) {
      await fs.promises.writeFile(kbFile, JSON.stringify(arr, null, 2), 'utf8');
    } else {
      parsed.qa = arr;
      await fs.promises.writeFile(kbFile, JSON.stringify(parsed, null, 2), 'utf8');
    }
    report.generatedAt = new Date().toISOString();
    await fs.promises.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log('Repair complete:', report);
  } catch (e) {
    console.error('Repair failed:', e);
    process.exit(1);
  }
}

if (require.main === module) run();
module.exports = { run };
