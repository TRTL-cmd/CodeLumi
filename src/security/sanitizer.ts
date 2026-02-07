// Lightweight sanitizer for candidate text and fetched content.
// Intentionally conservative: remove/neutralize constructs that may lead to execution or injection.

export function removeControlChars(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, '');
}

export function stripHtmlScripts(s: string): string {
  // remove <script>...</script> blocks and inline on* attributes
  return s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export function neutralizeShell(s: string): string {
  // neutralize common shell metacharacters by escaping them or removing piped execution
  // replace pipes and redirection with a safe marker
  return s.replace(/\|\s*sh/gi, '[neutralized-pipe-sh]').replace(/\b(rm|sudo|wget|curl|scp|ssh)\b/gi, '[neutralized]');
}

export function escapeBackticks(s: string): string {
  // replace literal backtick with an HTML entity so no raw backtick char remains
  return s.replace(/`/g, '&#96;');
}

export function sanitizeText(s: string, maxLen = 64 * 1024): string {
  if (s == null) return '';
  let out = String(s);
  out = removeControlChars(out);
  out = stripHtmlScripts(out);
  out = neutralizeShell(out);
  out = escapeBackticks(out);
  // collapse excessive whitespace
  out = out.replace(/\s{2,}/g, ' ').trim();
  if (out.length > maxLen) out = out.slice(0, maxLen);
  return out;
}

// Redact emails, absolute paths, and other obvious personal identifiers.
export function redactPII(s: string): string {
  if (s == null) return '';
  let out = String(s);
  // emails
  out = out.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]');
  // Windows drive paths
  out = out.replace(/[A-Za-z]:\\[^\n\r]*/g, '[REDACTED_PATH]');
  // UNC paths
  out = out.replace(/\\\\[^\\\s]+\\[^\\\s]+(?:\\[^\\\s]+)*/g, '[REDACTED_PATH]');
  // Common unix-style home paths
  out = out.replace(/\/(Users|home|var|opt|etc|private|Volumes)\/[\w\-. ]+(?:\/[\w\-. ]+)*/g, '[REDACTED_PATH]');
  return out;
}

export default { removeControlChars, stripHtmlScripts, neutralizeShell, escapeBackticks, sanitizeText, redactPII };
