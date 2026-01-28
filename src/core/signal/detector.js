// Lightweight signal detector for Lumi
// Exports: extractSignalsFromText(text), extractSignalsFromEvent(event), scoreSignals(signals)
const SIGNAL_PATTERNS = [
  {type: 'positive_feedback', re: /\b(thanks|thank you|awesome|nice|good job|well done|great)\b/i, conf: 0.9},
  {type: 'negative_feedback', re: /\b(no|incorrect|that's wrong|bad|not right|don't|dont)\b/i, conf: 0.9},
  {type: 'manual_edit', re: /\b(updated|fixed|changed|edited|modified|refactor)\b/i, conf: 0.8},
  {type: 'copy_event', re: /\b(copied|copied to clipboard|copy)\b/i, conf: 0.8},
  {type: 'test_pass', re: /\b(test(s)? passed|all tests passed|ok\b)\b/i, conf: 0.95},
  {type: 'test_fail', re: /\b(test(s)? failed|failing tests|error:|traceback)\b/i, conf: 0.95},
  {type: 'undo', re: /\b(undo|revert(ed)?|rolled back)\b/i, conf: 0.85},
  {type: 'approval', re: /\b(approve(d)?|looks good|LGTM|ship it)\b/i, conf: 0.9}
];

function extractSignalsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const found = [];
  for (const p of SIGNAL_PATTERNS) {
    if (p.re.test(text)) {
      found.push({type: p.type, confidence: p.conf, evidence: text.match(p.re)[0]});
    }
  }
  return found;
}

function extractSignalsFromEvent(event) {
  // Event is expected to be {type: 'copy'|'ui_action'|'message'|'test_result', payload: any}
  if (!event || typeof event !== 'object') return [];
  const t = event.type;
  const payload = event.payload || '';
  const out = [];
  if (t === 'copy') out.push({type: 'copy_event', confidence: 0.95, evidence: payload});
  if (t === 'user_feedback' && payload === 'positive') out.push({type: 'positive_feedback', confidence: 0.9, evidence: 'user_feedback:positive'});
  if (t === 'user_feedback' && payload === 'negative') out.push({type: 'negative_feedback', confidence: 0.9, evidence: 'user_feedback:negative'});
  if (t === 'test_result' && payload && payload.passed === true) out.push({type: 'test_pass', confidence: 0.99, evidence: 'test_result.passed'});
  if (t === 'test_result' && payload && payload.passed === false) out.push({type: 'test_fail', confidence: 0.99, evidence: 'test_result.failed'});
  if (t === 'file_change' && payload && payload.reason === 'manual') out.push({type: 'manual_edit', confidence: 0.9, evidence: 'file_change:manual'});
  return out;
}

function scoreSignals(signals) {
  // Aggregate by type and compute simple weighted score
  const agg = {};
  for (const s of signals || []) {
    if (!agg[s.type]) agg[s.type] = {count: 0, sumConfidence: 0};
    agg[s.type].count += 1;
    agg[s.type].sumConfidence += (s.confidence || 0.5);
  }
  const results = [];
  for (const [type, v] of Object.entries(agg)) {
    results.push({type, count: v.count, avgConfidence: v.sumConfidence / v.count});
  }
  return results;
}

module.exports = { extractSignalsFromText, extractSignalsFromEvent, scoreSignals };
