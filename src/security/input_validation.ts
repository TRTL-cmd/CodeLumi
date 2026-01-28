// Lightweight input validation utilities for IPC handlers.
// Keep strict, fast, and dependency-free so main/preload can use them without extra packages.

function isString(v: any): v is string { return typeof v === 'string'; }
function isObject(v: any): v is Record<string, any> { return v && typeof v === 'object' && !Array.isArray(v); }

export function sanitizeString(s: string): string {
  if (s == null) return '';
  // remove null chars and trim
  return String(s).replace(/\u0000/g, '').trim();
}

export function validateQuery(q: any, maxLen = 1000): { ok: boolean; error?: string } {
  if (!isString(q)) return { ok: false, error: 'query-must-be-string' };
  const s = sanitizeString(q);
  if (s.length === 0) return { ok: false, error: 'query-empty' };
  if (s.length > maxLen) return { ok: false, error: 'query-too-large' };
  return { ok: true };
}

export function validateLimit(n: any, min = 1, max = 200): { ok: boolean; error?: string } {
  const num = Number(n);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return { ok: false, error: 'limit-invalid' };
  if (num < min) return { ok: false, error: 'limit-too-small' };
  if (num > max) return { ok: false, error: 'limit-too-large' };
  return { ok: true };
}

export function validateMemoryEntry(entry: any): { ok: boolean; error?: string } {
  if (!isObject(entry)) return { ok: false, error: 'memory-entry-must-be-object' };
  const text = entry.text || entry.t || entry.content || '';
  if (typeof text !== 'string') return { ok: false, error: 'memory-text-must-be-string' };
  const s = sanitizeString(text);
  if (s.length === 0) return { ok: false, error: 'memory-text-empty' };
  if (s.length > 8 * 1024) return { ok: false, error: 'memory-text-too-large' };
  // meta should be object if present
  if (entry.meta != null && !isObject(entry.meta)) return { ok: false, error: 'memory-meta-invalid' };
  return { ok: true };
}

export function validateQA(question: any, answer: any, confidence: any): { ok: boolean; error?: string } {
  if (!isString(question)) return { ok: false, error: 'question-must-be-string' };
  if (!isString(answer)) return { ok: false, error: 'answer-must-be-string' };
  const q = sanitizeString(question);
  const a = sanitizeString(answer);
  if (q.length === 0) return { ok: false, error: 'question-empty' };
  if (q.length > 2000) return { ok: false, error: 'question-too-large' };
  if (a.length === 0) return { ok: false, error: 'answer-empty' };
  if (a.length > 64 * 1024) return { ok: false, error: 'answer-too-large' };
  const conf = Number(confidence);
  if (!Number.isFinite(conf) || conf < 0 || conf > 1) return { ok: false, error: 'confidence-invalid' };
  return { ok: true };
}

export default {
  sanitizeString,
  validateQuery,
  validateLimit,
  validateMemoryEntry,
  validateQA,
};
