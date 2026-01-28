// Simple rules-based threat detection prototype for prompt-injection and malicious patterns.
// Returns a score and reasons when suspicious.

type ScanResult = { suspicious: boolean; score: number; reasons: string[] };

const PROMPT_INJECTION_PATTERNS: Array<{re: RegExp, reason: string, weight?: number}> = [
  { re: /ignore (previous|above|above instructions)/i, reason: 'ignore-previous', weight: 3 },
  { re: /disregard (prior|previous) instructions/i, reason: 'disregard-prior', weight: 3 },
  { re: /ignore this message/i, reason: 'ignore-this', weight: 3 },
  { re: /execute the following/i, reason: 'execute-following', weight: 2 },
  { re: /run(?: this)? (?:command|script)/i, reason: 'run-command', weight: 2 },
  { re: /\brm -rf\b/i, reason: 'rm-rf', weight: 6 },
  { re: /curl .*\|\s*sh/i, reason: 'curl-pipe-sh', weight: 6 },
  { re: /eval\(|new Function\(/i, reason: 'eval-call', weight: 4 },
  { re: /<script[\s>]/i, reason: 'html-script-tag', weight: 4 },
  { re: /base64_decode|fromCharCode\(/i, reason: 'obfuscation', weight: 3 },
  { re: /please ignore previous instructions/i, reason: 'explicit-instruction-bypass', weight: 3 },
  { re: /you are now a (?:helpful|admin|assistant)/i, reason: 'role-assignment', weight: 3 },
];

const DANGEROUS_TOKENS: Array<{re: RegExp, reason: string, weight?: number}> = [
  { re: /sudo\b/i, reason: 'sudo', weight: 4 },
  { re: /systemctl\b/i, reason: 'systemctl', weight: 4 },
  { re: /scp\b/i, reason: 'scp', weight: 3 },
  { re: /wget\b/i, reason: 'wget', weight: 3 },
  { re: /nc\b|ncat\b/i, reason: 'netcat', weight: 4 },
  { re: /ssh\b/i, reason: 'ssh', weight: 3 },
];

export function scanTextForThreats(txt: string): ScanResult {
  const reasons: string[] = [];
  if (!txt || typeof txt !== 'string') return { suspicious: false, score: 0, reasons };
  let score = 0;
  const text = txt;
  for (const p of PROMPT_INJECTION_PATTERNS) {
    if (p.re.test(text)) {
      reasons.push(p.reason);
      score += p.weight || 1;
    }
  }
  for (const t of DANGEROUS_TOKENS) {
    if (t.re.test(text)) {
      reasons.push(t.reason);
      score += t.weight || 1;
    }
  }
  // heuristics: many URLs + code-like content
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount >= 2) { reasons.push('many-urls'); score += 1 + Math.min(3, urlCount); }
  const codeLike = (text.match(/\b(function|var|const|let|class|=>|console\.|process\.|require\()\b/g) || []).length;
  if (codeLike >= 2) { reasons.push('code-like'); score += 1 + Math.min(3, Math.floor(codeLike/2)); }

  // suspicious length-weighted heuristics: extremely long single-line blobs may be obfuscated payloads
  const lines = text.split(/\r?\n/);
  const longestLine = lines.reduce((a, l) => (l.length > a.length ? l : a), '');
  const longLine = longestLine.length;
  const spaceCount = (longestLine.match(/\s/g) || []).length;
  // Increase threshold to reduce false positives for normal long sentences in JSONL
  // Flag when the line is very long, or moderately long but contains very few spaces (likely encoded/obfuscated)
  if (longLine > 2000 || (longLine > 1000 && spaceCount < 20)) {
    reasons.push('long-line');
    score += 2;
  }

  const suspicious = score >= 3;
  return { suspicious, score, reasons };
}

export function scanQA(question: string, answer: string): ScanResult {
  // combine scans; if either is suspicious it's suspicious
  const q = scanTextForThreats(question || '');
  const a = scanTextForThreats(answer || '');
  const reasons = [...new Set([...q.reasons, ...a.reasons])];
  const score = Math.max(q.score, a.score);
  return { suspicious: q.suspicious || a.suspicious, score, reasons };
}

export function scanMemoryEntry(entry: any): ScanResult {
  if (!entry) return { suspicious: false, score: 0, reasons: [] };
  const text = entry.text || entry.content || entry.a || entry.q || '';
  return scanTextForThreats(String(text));
}

export default { scanTextForThreats, scanQA, scanMemoryEntry };
