const fs = require('fs');
const path = require('path');

(async ()=>{
  const testCases = [
    { id: 't1', q: 'How to sort an array?', a: 'Use array.sort()', confidence: 0.95, scan: { score: 2, suspicious: false, reasons: [] }, source: 'manual-test' },
    { id: 't2', q: 'How to delete system files?', a: 'Run rm -rf / to delete everything', confidence: 0.85, scan: { score: 45, suspicious: true, reasons: ['rm-rf'] }, source: 'manual-test' },
    { id: 't3', q: 'How to evaluate code?', a: 'You can use eval() to run JavaScript', confidence: 0.75, scan: { score: 15, suspicious: true, reasons: ['eval'] }, source: 'manual-test' },
    { id: 't4', q: 'What is JavaScript?', a: 'A programming language', confidence: 0.85, scan: { score: 0, suspicious: false, reasons: [] }, source: 'manual-test' },
    { id: 't5', q: 'How to use backticks?', a: 'Backticks create template strings: `hello ${name}`', confidence: 0.92, scan: { score: 8, suspicious: false, reasons: [] }, source: 'manual-test' }
  ];

  const repoRoot = process.cwd();
  const trainingDir = path.join(repoRoot, 'training');
  const userDataSecurity = path.join(repoRoot, 'userData', 'security');
  try { await fs.promises.mkdir(trainingDir, { recursive: true }); } catch(e){}
  try { await fs.promises.mkdir(userDataSecurity, { recursive: true }); } catch(e){}

  // Ensure lumi_knowledge.json exists as array
  const kbFile = path.join(trainingDir, 'lumi_knowledge.json');
  let kb = [];
  try {
    const raw = await fs.promises.readFile(kbFile, 'utf8');
    try { kb = JSON.parse(raw); if (!Array.isArray(kb)) kb = []; } catch(e){ kb = []; }
  } catch(e) { kb = []; }

  const stagingFile = path.join(trainingDir, 'staging.jsonl');
  const trainingJsonl = path.join(trainingDir, 'training.jsonl');
  const validationLog = path.join(userDataSecurity, 'validation.jsonl');

  for (const tc of testCases) {
    const scan = tc.scan || { score: 0, suspicious: false, reasons: [] };
    const shouldAutoMerge = (typeof scan.score === 'number' ? scan.score : 0) < 10 &&
                            (typeof tc.confidence === 'number' ? tc.confidence : 0) > 0.9 &&
                            !scan.suspicious;

    const timestamp = new Date().toISOString();
    const candidateId = tc.id || `cand_${Date.now()}`;

    const logEntry = {
      timestamp,
      candidate_id: candidateId,
      question: tc.q,
      confidence: tc.confidence,
      threat_score: scan.score,
      threat_reasons: scan.reasons || [],
      decision: shouldAutoMerge ? 'auto_merge' : 'quarantine'
    };

    await fs.promises.appendFile(validationLog, JSON.stringify(logEntry) + '\n', 'utf8');

    if (shouldAutoMerge) {
      const kbEntry = { id: candidateId, q: tc.q, a: tc.a, confidence: tc.confidence, source: 'auto-learning', timestamp };
      kb.push(kbEntry);
      await fs.promises.writeFile(kbFile, JSON.stringify(kb, null, 2), 'utf8');
      const audit = { type: 'auto_merge', id: candidateId, q: tc.q, confidence: tc.confidence, timestamp };
      await fs.promises.appendFile(trainingJsonl, JSON.stringify(audit) + '\n', 'utf8');
      console.log('[Auto-Merge]', tc.q, 'Score:', scan.score, 'Conf:', tc.confidence);
    } else {
      const staged = { id: candidateId, q: tc.q, a: tc.a, confidence: tc.confidence, status: 'quarantined', threats: scan.reasons || [], threat_score: scan.score, timestamp };
      await fs.promises.appendFile(stagingFile, JSON.stringify(staged) + '\n', 'utf8');
      const audit = { type: 'quarantine', id: candidateId, q: tc.q, confidence: tc.confidence, threat_score: scan.score, timestamp };
      await fs.promises.appendFile(trainingJsonl, JSON.stringify(audit) + '\n', 'utf8');
      console.log('[Quarantine]', tc.q, 'Score:', scan.score, 'Conf:', tc.confidence);
    }
  }

  console.log('\nSimulation complete. Files updated:');
  console.log(' -', kbFile);
  console.log(' -', stagingFile);
  console.log(' -', validationLog);
  console.log(' -', trainingJsonl);
})();
