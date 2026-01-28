import * as fs from 'fs/promises';
import * as path from 'path';

export async function appendStagingUnique(stagingFile: string, entry: any, opts?: { lookbackLines?: number; windowMs?: number }) {
  try {
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
            // consider duplicate if q and a exact match and within time window
            if (String(obj.q || '') === String(entry.q || '') && String(obj.a || '') === String(entry.a || '')) {
              const ts = Number(obj.timestamp || obj.t || obj.date || obj.time || 0);
              if (ts && Math.abs(now - Number(ts)) <= windowMs) {
                return { ok: false, reason: 'recent-duplicate' };
              }
            }
          } catch (_e) { continue; }
        }
      } catch (_e) { /* ignore read errors and append anyway */ }
    }

    await fs.appendFile(stagingFile, JSON.stringify(entry) + '\n', 'utf8');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
