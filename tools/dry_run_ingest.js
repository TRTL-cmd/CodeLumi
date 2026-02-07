const fs = require('fs');
const path = require('path');

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || 'null');
  } catch (e) { return null; }
}

function readJsonl(p) {
  try {
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, 'utf8');
    return raw.split(/\r?\n/).filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch (_) { return null; }
    }).filter(Boolean);
  } catch (e) { return []; }
}

function normalize(s) {
  if (!s) return '';
  return String(s).replace(/\s+/g, ' ').trim().toLowerCase();
}

function suspiciousReasons(q, a) {
  const reasons = [];
  const txt = (q || '') + '\n' + (a || '');
  const low = txt.toLowerCase();
  const patterns = [
    /password|passwd|pwd|secret_key|api[_-]?key|access[_-]?token|private key|BEGIN RSA PRIVATE KEY|aws_secret/i,
    /ssh-rsa|ssh-ed25519/,
    /-----BEGIN PRIVATE KEY-----/i,
    /https?:\/\/.+@/ // credentials in URL
  ];
  for (const p of patterns) if (p.test(low)) reasons.push('sensitive_pattern');
  if (low.split('\n').length > 200) reasons.push('very_long_text');
  return reasons;
}

function findDuplicateInArray(arr, input) {
  if (!Array.isArray(arr)) return false;
  const n = normalize(input);
  return arr.find(it => {
    if (!it) return false;
    const cand = it.input || it.q || it.question || '';
    return normalize(cand) === n;
  }) !== undefined;
}

function report() {
  const repoRoot = process.cwd();
  const selfFile = path.join(repoRoot, 'userData', 'self-learn', 'lumi_knowledge.json');
  const trainingKb = path.join(repoRoot, 'training', 'lumi_knowledge.json');
  const trainingAudit = path.join(repoRoot, 'training', 'training.jsonl');

  const self = readJson(selfFile) || [];
  const kb = readJson(trainingKb) || [];
  const audit = readJsonl(trainingAudit) || [];

  if (!self.length) {
    console.log('No self-learn entries found at', selfFile);
    return;
  }

  const out = [];
  for (const item of self) {
    const q = item.q || item.input || item.question || '';
    const a = item.a || item.output || item.answer || '';
    const confidence = typeof item.confidence === 'number' ? item.confidence : (typeof item.conf === 'number' ? item.conf : 0.0);

    const reasons = [];
    if (!q || !a) reasons.push('empty_q_or_a');
    if ((q || '').length < 5 || (a || '').length < 5) reasons.push('too_short');

    const dupInKb = findDuplicateInArray(kb, q);
    const dupInAudit = findDuplicateInArray(audit, q);
    if (dupInKb || dupInAudit) reasons.push('duplicate_in_training');

    const susp = suspiciousReasons(q, a);
    if (susp.length) reasons.push(...susp);

    const wouldAutoMerge = (confidence >= 0.9) && reasons.filter(r => r !== 'duplicate_in_training').length === 0 && !dupInKb && !dupInAudit;

    out.push({
      id: item.id || item.candidate_id || '(no-id)',
      q: String(q).slice(0, 200),
      confidence,
      duplicateInTraining: dupInKb || dupInAudit,
      suspicious: susp.length > 0,
      suspiciousReasons: susp,
      reasons,
      decision: wouldAutoMerge ? 'would_auto_merge' : 'would_quarantine_or_skip'
    });
  }

  const reportFile = path.join(repoRoot, 'training', `dry_run_ingest_report.${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(out, null, 2), 'utf8');
  console.log('Dry-run report written to', reportFile);
  console.log('Summary: total:', out.length, 'would_auto_merge:', out.filter(i=>i.decision==='would_auto_merge').length);
}

if (require.main === module) report();

module.exports = { report };
