import { promises as fs } from 'fs';
import * as path from 'path';
import * as Threat from '../../security/threat_detection';
import * as Sanitizer from '../../security/sanitizer';
import { getLumiPaths } from '../paths';

type StagingItem = any;

// Convert to functions instead of constants to use centralized paths
function getStagingPath(): string {
  return getLumiPaths().stagingFile; // PROJECT_ROOT/userData/staging.jsonl
}

function getKBPath(): string {
  return getLumiPaths().knowledgeBase; // PROJECT_ROOT/training/lumi_knowledge.json
}

export class StagingManager {
  static async loadStaging(): Promise<StagingItem[]> {
    try {
      const raw = await fs.readFile(getStagingPath(), 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const out: StagingItem[] = [];
      for (const line of lines) {
        try {
          out.push(JSON.parse(line));
        } catch (_e) {
          // skip malformed lines to avoid breaking curator loading
        }
      }
      return out;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        try {
          await fs.mkdir(path.dirname(getStagingPath()), { recursive: true });
          await fs.writeFile(getStagingPath(), '', 'utf8');
        } catch (_e) { /* ignore */ }
        return [];
      }
      throw err;
    }
  }

  static async saveStaging(items: StagingItem[]): Promise<void> {
    const data = items.map(i => JSON.stringify(i)).join('\n') + (items.length ? '\n' : '');
    await fs.mkdir(path.dirname(getStagingPath()), { recursive: true });
    await fs.writeFile(getStagingPath(), data, 'utf8');
  }

  static async listPending(): Promise<StagingItem[]> {
    const items = await this.loadStaging();
    // Only return items that are quarantined or have no status, deduplicated by normalized QA (keep latest by timestamp)
    const pending = (items || []).filter(i => !i.status || i.status === 'quarantined');
    const bySig = new Map<string, StagingItem>();
    function normalizeText(x: any) {
      try {
        if (!x) return '';
        return String(x).replace(/\s+/g, ' ').trim().toLowerCase();
      } catch (_e) { return '' }
    }
    let i = 0;
    for (const it of pending) {
      const qn = normalizeText(it.q);
      const an = normalizeText(it.a);
      const msg = normalizeText(it.message || it.suggestion || it.title || it.note);
      const id = (it.id !== undefined && it.id !== null) ? String(it.id) : '';
      const sig = (qn || an) ? `${qn}||${an}` : (id || msg || `item_${i}`);
      i += 1;
      const existing = bySig.get(sig);
      const tNew = (it.timestamp || it.ts || it.t || 0);
      const tOld = (existing && (existing.timestamp || existing.ts || existing.t)) || 0;
      if (!existing || (tNew >= tOld)) bySig.set(sig, it);
    }
    return Array.from(bySig.values()).sort((a, b) => ((a.timestamp || a.ts || a.t || 0) - (b.timestamp || b.ts || b.t || 0)));
  }

  static async approve(id: string, opts?: { editor?: string }): Promise<StagingItem | null> {
    const items = await this.loadStaging();
    const idx = items.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return null;
    const item = items[idx];
    item.status = 'approved';
    item.approvedAt = Date.now();
    if (opts?.editor) item.approvedBy = opts.editor;

    // append to canonical KB (lumi_knowledge.json) — keep it as an array file
    let kbRawParsed: any = null;
    try {
      const kbRaw = await fs.readFile(getKBPath(), 'utf8');
      kbRawParsed = JSON.parse(kbRaw || 'null');
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }

    // append item (but remove staging-only fields)
    const toAppend = { ...item };
    delete toAppend.status;
    delete toAppend.approvedAt;
    delete toAppend.approvedBy;

    // If canonical-only staging entry, attempt to recover q/a from message
    try {
      const hasQA = !!(toAppend.q || toAppend.a || toAppend.question || toAppend.answer || toAppend.input || toAppend.output);
      if (!hasQA && typeof toAppend.message === 'string' && toAppend.message.includes(' -> ')) {
        const parts = String(toAppend.message).split(' -> ');
        if (parts.length >= 2) {
          toAppend.q = parts.shift() || '';
          toAppend.a = parts.join(' -> ');
        }
      }
    } catch (_e) { }

    // redact PII and absolute paths before persisting to KB
    try {
      const scrub = (key: string) => {
        if (typeof (toAppend as any)[key] === 'string') {
          (toAppend as any)[key] = Sanitizer.redactPII(Sanitizer.sanitizeText((toAppend as any)[key]));
        }
      };
      scrub('q');
      scrub('a');
      scrub('question');
      scrub('answer');
      scrub('input');
      scrub('output');
      scrub('message');
      scrub('suggestion');
      scrub('title');
      scrub('note');
      if (toAppend.path || toAppend.file) {
        const p = String(toAppend.path || toAppend.file || '');
        const root = getLumiPaths().projectRoot;
        const sanitized = p.includes(root)
          ? p.replace(root, '[PROJECT_ROOT]')
          : path.basename(p);
        (toAppend as any).path = sanitized;
        delete (toAppend as any).file;
      }
    } catch (_e) { }

    // If the KB file is an array, just push.
    if (Array.isArray(kbRawParsed)) {
      kbRawParsed.push(toAppend);
      await fs.mkdir(path.dirname(getKBPath()), { recursive: true });
      await fs.writeFile(getKBPath(), JSON.stringify(kbRawParsed, null, 2), 'utf8');
    }
    else if (kbRawParsed && typeof kbRawParsed === 'object') {
      // Support legacy 'qa' root object containing an array of entries
      if (Array.isArray(kbRawParsed.qa)) {
        kbRawParsed.qa.push(toAppend);
        await fs.mkdir(path.dirname(getKBPath()), { recursive: true });
        await fs.writeFile(getKBPath(), JSON.stringify(kbRawParsed, null, 2), 'utf8');
      }
      else {
        // Unknown object shape: convert to an array preserving existing object as first element
        const newArr = [] as any[];
        if (Object.keys(kbRawParsed).length > 0) newArr.push(kbRawParsed);
        newArr.push(toAppend);
        await fs.mkdir(path.dirname(getKBPath()), { recursive: true });
        await fs.writeFile(getKBPath(), JSON.stringify(newArr, null, 2), 'utf8');
      }
    }
    else {
      // File did not exist or was empty — create an array file with the new item
      const arr = [toAppend];
      await fs.mkdir(path.dirname(getKBPath()), { recursive: true });
      await fs.writeFile(getKBPath(), JSON.stringify(arr, null, 2), 'utf8');
    }

    // persist updated staging
    items[idx] = item;
    await this.saveStaging(items);
    // After approving, always run a safety scan. If suspicious:
    // - If a human curator approved (`approvedBy`), record a waiver and
    //   annotate the KB/staging entry with safety_review metadata (do NOT delete).
    // - Otherwise, proceed with the existing auto-removal behavior except when
    //   the only reason is 'long-line'.
    try {
      const qText = toAppend.q || toAppend.input || toAppend.question || '';
      const aText = toAppend.a || toAppend.output || toAppend.answer || '';
      const scan = Threat.scanQA(String(qText), String(aText));
      const reasons = Array.isArray(scan.reasons) ? scan.reasons : (scan.reasons ? [scan.reasons] : []);
      const nonLongReasons = reasons.filter(r => r !== 'long-line');

      if (scan.suspicious) {
        // If curator manually approved, record a waiver instead of removing.
        if (item.approvedBy) {
          try {
            const logDir = path.join(process.cwd(), 'userData', 'security');
            await fs.mkdir(logDir, { recursive: true });
            const waivedFile = path.join(logDir, 'waived.jsonl');
            const waivedEntry = {
              id: toAppend.id || `waived_${Date.now()}`,
              q: qText,
              a: aText,
              approvedBy: item.approvedBy,
              approvedAt: item.approvedAt || Date.now(),
              threat_score: scan.score,
              threat_reasons: scan.reasons || [],
              waivedAt: Date.now()
            };
            await fs.appendFile(waivedFile, JSON.stringify(waivedEntry) + '\n', 'utf8');
          } catch (_e) { /* best-effort logging */ }

          // Annotate entry in KB with safety_review metadata where possible
          try {
            let kbRaw2: any = null;
            try {
              const kbRaw = await fs.readFile(getKBPath(), 'utf8');
              kbRaw2 = JSON.parse(kbRaw || 'null');
            } catch (_e) { kbRaw2 = null; }
            const attach = { safety_review: { waived: true, waivedBy: item.approvedBy, waivedAt: Date.now(), score: scan.score, reasons: scan.reasons || [] } };
            if (Array.isArray(kbRaw2)) {
              for (let i = 0; i < kbRaw2.length; i++) {
                if (String(kbRaw2[i].id) === String(toAppend.id)) {
                  kbRaw2[i] = Object.assign({}, kbRaw2[i], attach);
                }
              }
              await fs.writeFile(getKBPath(), JSON.stringify(kbRaw2, null, 2), 'utf8');
            } else if (kbRaw2 && typeof kbRaw2 === 'object' && Array.isArray(kbRaw2.qa)) {
              for (let i = 0; i < kbRaw2.qa.length; i++) {
                if (String(kbRaw2.qa[i].id) === String(toAppend.id)) {
                  kbRaw2.qa[i] = Object.assign({}, kbRaw2.qa[i], attach);
                }
              }
              await fs.writeFile(getKBPath(), JSON.stringify(kbRaw2, null, 2), 'utf8');
            }
          } catch (_e) { /* best-effort annotation */ }

          // Update staging item with waiver metadata
          try {
            item.safetyReview = { waived: true, waivedBy: item.approvedBy, waivedAt: Date.now(), score: scan.score, reasons: scan.reasons || [] };
            items[idx] = item;
            await this.saveStaging(items);
          } catch (_e) { /* ignore save failures */ }
        }
        else {
          // Not curator-approved: only auto-remove if there are reasons beyond 'long-line'
          if (nonLongReasons.length > 0) {
            try {
              // remove appended item from KB by id
              let kbRaw2: any = null;
              try {
                const kbRaw = await fs.readFile(getKBPath(), 'utf8');
                kbRaw2 = JSON.parse(kbRaw || 'null');
              } catch (_e) { kbRaw2 = null; }
              if (Array.isArray(kbRaw2)) {
                const filtered = kbRaw2.filter((it: any) => String(it.id) !== String(toAppend.id));
                await fs.writeFile(getKBPath(), JSON.stringify(filtered, null, 2), 'utf8');
              } else if (kbRaw2 && typeof kbRaw2 === 'object' && Array.isArray(kbRaw2.qa)) {
                kbRaw2.qa = kbRaw2.qa.filter((it: any) => String(it.id) !== String(toAppend.id));
                await fs.writeFile(getKBPath(), JSON.stringify(kbRaw2, null, 2), 'utf8');
              }
              // log removal to userData/security/removed.jsonl
              const logDir = path.join(process.cwd(), 'userData', 'security');
              await fs.mkdir(logDir, { recursive: true });
              const removedFile = path.join(logDir, 'removed.jsonl');
              const removedEntry = {
                id: toAppend.id || `removed_${Date.now()}`,
                q: qText,
                a: aText,
                confidence: toAppend.confidence,
                source: toAppend.source || 'staging-auto-approve',
                threat_score: scan.score,
                threat_reasons: scan.reasons || [],
                removedAt: Date.now(),
                removedBy: 'auto-safety'
              };
              await fs.appendFile(removedFile, JSON.stringify(removedEntry) + '\n', 'utf8');
            } catch (_e) { /* best-effort logging */ }

            // mark staging item as rejected/removed and persist
            try {
              item.status = 'rejected';
              item.rejectedAt = Date.now();
              item.rejectionReason = 'auto_safety';
              items[idx] = item;
              await this.saveStaging(items);
            } catch (_e) { }
          }
        }
      }
    } catch (_e) { /* ignore scan failures */ }

    return item;
  }

  static async reject(id: string, reason?: string): Promise<StagingItem | null> {
    const items = await this.loadStaging();
    const idx = items.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return null;
    const item = items[idx];
    item.status = 'rejected';
    item.rejectedAt = Date.now();
    if (reason) item.rejectionReason = reason;
    items[idx] = item;
    await this.saveStaging(items);
    return item;
  }
}

export default StagingManager;

// NOTE: Integration
// - Wire `StagingManager.listPending`, `.approve`, `.reject` to IPC handlers in `src/main.ts` or an express admin endpoint.
// - Preload can expose `window.lumi.curator` helpers for renderer to call.
