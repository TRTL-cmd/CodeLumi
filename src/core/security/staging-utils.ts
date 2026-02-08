import * as fs from 'fs/promises';
import * as path from 'path';
import * as Sanitizer from '../../security/sanitizer';

export function canonicalizeStagingEntry(entry: any): { id: string; path: string; date: string; line: number | null; message: string; severity: string } | null {
  try {
    const normalizePath = (v: any) => {
      try {
        if (!v) return v;
        let s = String(v);
        s = s.replace(/\//g, '\\');
        if (s.startsWith('lumi\\')) return s.replace(/\\/g, '/');
        if (s.startsWith('lumi/')) return s;
        if (s.includes('[PROJECT_ROOT]')) return s;
        const proj = process.cwd().replace(/\//g, '\\');
        if (s.includes(proj)) {
          const rel = s.split(proj).slice(1).join(proj) || '';
          const r = rel.replace(/^\\+/, '');
          return `lumi/${r.replace(/\\/g, '/')}`;
        }
        return path.basename(s);
      } catch (_e) { return '[REDACTED_PATH]'; }
    };

    const rawPath = entry?.path || entry?.file || '';
    const normalizedPath = normalizePath(rawPath) || '[UNKNOWN]';

    const cand = entry?.date || entry?.timestamp || entry?.ts || entry?.t || entry?.time;
    let date = new Date().toISOString();
    if (typeof cand === 'number' && cand > 0) date = new Date(Number(cand)).toISOString();
    else if (typeof cand === 'string' && /^[0-9]+$/.test(cand)) date = new Date(Number(cand)).toISOString();
    else if (typeof cand === 'string' && cand.trim()) date = cand;

    const lineRaw = entry?.line ?? entry?.lineno ?? entry?.lineNumber ?? null;
    const lineNum = (typeof lineRaw === 'number') ? lineRaw : (typeof lineRaw === 'string' && lineRaw.trim() ? Number(lineRaw) : null);
    const line = Number.isFinite(lineNum as number) ? Number(lineNum) : null;

    const rawMessage = entry?.message || entry?.suggestion || entry?.msg || entry?.title || entry?.note || (entry?.q && entry?.a ? `${String(entry.q).slice(0,160)} -> ${String(entry.a).slice(0,160)}` : '[no-message]');
    const message = Sanitizer.redactPII(Sanitizer.sanitizeText(String(rawMessage || '[no-message]')));

    const severity = String(entry?.severity || entry?.level || entry?.priority || 'info');
    const id = String(entry?.id || entry?._id || `sug_${Date.now()}_${Math.random().toString(16).slice(2,8)}`);

    return { id, path: normalizedPath, date, line, message, severity };
  } catch (_e) {
    return null;
  }
}

export async function appendStagingUnique(stagingFile: string, entry: any, opts?: { lookbackLines?: number; windowMs?: number }) {
  try {
    // sanitize entry fields to avoid writing full absolute paths or PII
    try {
      const sanitize = (obj: any) => {
        const copy: any = Object.assign({}, obj || {});
        if ('file' in copy) copy.file = String(copy.file || '');
        if ('path' in copy) copy.path = String(copy.path || '');
        // redact obvious paths/emails inside text fields
        try {
          if (typeof copy.q === 'string') copy.q = Sanitizer.redactPII(copy.q);
          if (typeof copy.a === 'string') copy.a = Sanitizer.redactPII(copy.a);
          if (typeof copy.message === 'string') copy.message = Sanitizer.redactPII(copy.message);
          if (typeof copy.suggestion === 'string') copy.suggestion = Sanitizer.redactPII(copy.suggestion);
          if (typeof copy.title === 'string') copy.title = Sanitizer.redactPII(copy.title);
          if (typeof copy.note === 'string') copy.note = Sanitizer.redactPII(copy.note);
        } catch (_e) { }
        return copy;
      };
      entry = sanitize(entry);
    } catch (_e) { }
    const canonicalNew = canonicalizeStagingEntry(entry);
    if (!canonicalNew) return { ok: false, error: 'invalid-entry' };

    const lookbackLines = (opts && opts.lookbackLines) ? opts.lookbackLines : 200;
    const windowMs = (opts && opts.windowMs) ? opts.windowMs : 2 * 60 * 1000; // 2 minutes

    // ensure folder exists
    try { await fs.mkdir(path.dirname(stagingFile), { recursive: true }); } catch (_e) { }

    // if file doesn't exist, append directly
    let exists = true;
    try { await fs.access(stagingFile); } catch (_e) { exists = false; }

    if (exists) {
      try {
        const raw = await fs.readFile(stagingFile, 'utf8');
        const lines = raw.split(/\r?\n/).filter(Boolean);
        const tail = lines.slice(-lookbackLines);
        const now = Date.now();
        for (const ln of tail.reverse()) {
          try {
            const obj = JSON.parse(ln);
            if (!obj) continue;
            // consider duplicate if message matches within time window
            const msgOld = String(obj.message || obj.suggestion || obj.msg || '').trim();
            const msgNew = String(canonicalNew.message || '').trim();
            const pathOld = String(obj.path || obj.file || '').trim();
            const pathNew = String(canonicalNew.path || '').trim();
            const lineOld = String(obj.line ?? '').trim();
            const lineNew = String(canonicalNew.line ?? '').trim();
            if (msgOld && msgNew && msgOld === msgNew && pathOld === pathNew && lineOld === lineNew) {
              const ts = Number(obj.timestamp || obj.t || obj.date || obj.time || 0);
              if (ts && Math.abs(now - Number(ts)) <= windowMs) return { ok: false, reason: 'recent-duplicate' };
            }
          } catch (_e) { continue; }
        }
      } catch (_e) { /* ignore read errors and append anyway */ }
    }

    // produce canonical shape required by Security Curator
    try {
      await fs.appendFile(stagingFile, JSON.stringify(canonicalNew) + '\n', 'utf8');
    } catch (e: any) {
      // fallback: append canonical shape only
      await fs.appendFile(stagingFile, JSON.stringify(canonicalNew) + '\n', 'utf8');
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
