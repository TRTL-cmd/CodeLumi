/**
 * smart-security.ts
 * 
 * Smarter security validation that's less restrictive but more thorough.
 */

export type SecurityLevel = 'safe' | 'caution' | 'warning' | 'danger';

export interface SecurityResult {
  level: SecurityLevel;
  score: number; // 0-100, higher = more dangerous
  reasons: string[];
  allowExecution: boolean; // Can this be safely processed?
  recommendation: string;
}

const EDUCATIONAL_CONTEXT = [
  /how.*work/i,
  /explain/i,
  /what.*is/i,
  /can you.*explain/i,
  /learn.*about/i,
  /understand/i,
  /example.*of/i,
  /show.*me.*how/i,
  /teach.*me/i,
];

const EXPLOITATION_CONTEXT = [
  /run this|execute this|try this/i,
  /against.*server|on.*server/i,
  /bypass.*security/i,
  /exploit.*vulnerability/i,
  /hack into/i,
  /steal.*data/i,
  /without.*permission/i,
];

const DANGER_PATTERNS = [
  {
    pattern: /rm\s+-rf\s+\/|sudo\s+rm/i,
    severity: 80,
    reason: 'destructive-command',
    educational: /example|demonstrate|show|explain/i,
  },
  {
    pattern: /curl.*\|\s*(?:bash|sh)|wget.*\|\s*(?:bash|sh)/i,
    severity: 70,
    reason: 'remote-execution',
    educational: /what.*does|how.*work|explain/i,
  },
  {
    pattern: /eval\(|new\s+Function\(|setTimeout\(.*\beval/i,
    severity: 60,
    reason: 'dynamic-eval',
    educational: /avoid|dangerous|why.*bad/i,
  },
  {
    pattern: /<script[\s>].*<\/script>/is,
    severity: 65,
    reason: 'script-injection',
    educational: /xss|sanitize|prevent|secure/i,
  },
  {
    pattern: /\bsql.*injection|\bunion.*select|drop.*table/i,
    severity: 75,
    reason: 'sql-injection',
    educational: /prevent|protect|sanitize|parameterized/i,
  },
];

const INJECTION_PATTERNS = [
  {
    pattern: /ignore\s+(?:previous|above|all)\s+(?:instructions?|prompts?|rules?)/i,
    severity: 90,
    reason: 'instruction-override',
  },
  {
    pattern: /you\s+are\s+now\s+(?:a|an)\s+(?:helpful|evil|admin)/i,
    severity: 85,
    reason: 'role-hijacking',
  },
  {
    pattern: /disregard\s+(?:all|your)\s+(?:training|instructions|programming)/i,
    severity: 90,
    reason: 'training-override',
  },
  {
    pattern: /repeat.*after.*me|say\s+exactly/i,
    severity: 30,
    reason: 'verbatim-request',
  },
];

export function scanWithContext(text: string, context?: {
  isCodeExample?: boolean;
  isEducational?: boolean;
  previousMessages?: string[];
}): SecurityResult {
  const reasons: string[] = [];
  let score = 0;
  const ctx = context || {};
  
  const isCodeExample = ctx.isCodeExample || /```|\bexample\b|\bdemo\b/i.test(text);
  
  const hasEducationalMarkers = EDUCATIONAL_CONTEXT.some(p => p.test(text));
  const hasExploitationMarkers = EXPLOITATION_CONTEXT.some(p => p.test(text));
  
  for (const { pattern, severity, reason, educational } of DANGER_PATTERNS) {
    if (pattern.test(text)) {
      if (educational && educational.test(text)) {
        score += severity * 0.3;
        reasons.push(`${reason} (educational context detected)`);
      } else if (hasEducationalMarkers && !hasExploitationMarkers) {
        score += severity * 0.5;
        reasons.push(`${reason} (likely discussion)`);
      } else {
        score += severity;
        reasons.push(reason);
      }
    }
  }

  for (const { pattern, severity, reason } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      score += severity;
      reasons.push(reason);
    }
  }

  const obfuscatedCommands = [
    /base64_decode|atob\(/i,
    /\\x[0-9a-f]{2}/gi,
    /eval.*unescape/i,
    /fromCharCode/i,
  ];
  
  let obfuscationScore = 0;
  for (const pattern of obfuscatedCommands) {
    if (pattern.test(text)) {
      obfuscationScore += 15;
      if (!reasons.includes('obfuscation')) {
        reasons.push('obfuscation');
      }
    }
  }
  
  if (obfuscationScore > 0) {
    score += hasEducationalMarkers ? obfuscationScore * 0.5 : obfuscationScore;
  }
  
  let level: SecurityLevel;
  let allowExecution: boolean;
  let recommendation: string;
  
  if (score >= 70) {
    level = 'danger';
    allowExecution = false;
    recommendation = 'Block this request. Contains dangerous patterns with high confidence.';
  } else if (score >= 50) {
    level = 'warning';
    allowExecution = !hasExploitationMarkers;
    recommendation = 'Proceed with caution. Contains potentially dangerous content but may be educational.';
  } else if (score >= 25) {
    level = 'caution';
    allowExecution = true;
    recommendation = 'Monitor closely. Contains patterns that could be misused but context appears safe.';
  } else {
    level = 'safe';
    allowExecution = true;
    recommendation = 'Content appears safe.';
  }
  
  return {
    level,
    score,
    reasons,
    allowExecution,
    recommendation,
  };
}

export function validateQAPair(question: string, answer: string): SecurityResult {
  const qScan = scanWithContext(question);
  const aScan = scanWithContext(answer, { isCodeExample: /```|example|demo/i.test(answer) });
  
  const combinedScore = Math.max(qScan.score, aScan.score);
  const combinedReasons = [...new Set([...qScan.reasons, ...aScan.reasons])];
  
  let level: SecurityLevel;
  let allowExecution: boolean;
  let recommendation: string;
  
  if (combinedScore >= 70) {
    level = 'danger';
    allowExecution = false;
    recommendation = 'Do not add to KB. Contains dangerous content.';
  } else if (combinedScore >= 50) {
    level = 'warning';
    allowExecution = false;
    recommendation = 'Add to staging for manual review before KB insertion.';
  } else if (combinedScore >= 25) {
    level = 'caution';
    allowExecution = true;
    recommendation = 'Safe to add to KB with monitoring.';
  } else {
    level = 'safe';
    allowExecution = true;
    recommendation = 'Safe to add to KB.';
  }
  
  return {
    level,
    score: combinedScore,
    reasons: combinedReasons,
    allowExecution,
    recommendation,
  };
}

export function smartSanitize(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  sanitized = sanitized.replace(/\u0000/g, '');
  sanitized = sanitized.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  
  const codeBlocks: string[] = [];
  sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });
  
  sanitized = sanitized.replace(/\|\s*(?:bash|sh)\s*$/gm, '| [neutralized]');
  
  codeBlocks.forEach((block, i) => {
    sanitized = sanitized.replace(`__CODEBLOCK_${i}__`, block);
  });
  
  return sanitized.trim();
}

export default {
  scanWithContext,
  validateQAPair,
  smartSanitize,
};
