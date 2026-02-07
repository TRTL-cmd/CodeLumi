import { CandidateExtractor } from './extractor.js';
import { CandidateValidator } from './validator.js';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow } from 'electron';
import * as Threat from '../../security/threat_detection';
import * as Sanitizer from '../../security/sanitizer';
import { getLumiPaths } from '../paths';

// Attempt to fix common mojibake where UTF-8 bytes were interpreted as latin1
function fixEncodingAndNormalize(s: string): string {
  try {
    if (!s || typeof s !== 'string') return s;
    // Heuristic: presence of common mojibake markers
    if (/[âÃ]/.test(s)) {
      try {
        s = Buffer.from(s, 'latin1').toString('utf8');
      } catch (_e) { /* ignore conversion failures */ }
    }
    // Normalize Unicode and strip C0/C1 control characters
    try { s = s.normalize ? s.normalize('NFKC') : s; } catch (_e) { }
    s = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    return s;
  } catch (_e) { return s; }
}

export interface Signal {
  type: string;
  confidence: number;
  payload?: any;
}

export interface Candidate {
  id?: string;
  q: string;
  a: string;
  confidence: number;
  source?: string;
  date?: string;
}

export class SignalProcessor {
  private extractor: CandidateExtractor;
  private validator: CandidateValidator;

  constructor() {
    this.extractor = new CandidateExtractor();
    this.validator = new CandidateValidator();
  }

  async processSignals(signals: Signal[], prompt?: string, response?: string): Promise<void> {
    try {
      try {
        console.log('═'.repeat(80));
        console.log('🚨 PROCESSOR.PROCESSSIGNALS CALLED!');
        try { console.log('Signals:', JSON.stringify(signals)); } catch(_){ }
        try { console.log('Prompt:', String(prompt || '').substring(0, 200)); } catch(_){ }
        try { console.log('Response:', String(response || '').substring(0, 200)); } catch(_){ }
        console.log('═'.repeat(80));
      } catch (_){ }
    } catch (_){ }
    // Attach conversational context to signals when payload is missing
    try {
      if ((prompt || response) && Array.isArray(signals)) {
        for (const s of signals) {
          if (!s.payload) {
            s.payload = { question: prompt || null, answer: response || null };
          }
        }
      }
    } catch (_){ }

    // Keep moderately high-confidence signals by default (lowered to be more inclusive)
    // basic dedupe: collapse identical payloads to avoid double-processing
    const sigMap = new Map<string, Signal>();
    for (const s of (signals || [])) {
      try { sigMap.set(JSON.stringify(s.payload || s), s); } catch (_e) { sigMap.set(String(Math.random()), s); }
    }
    const dedupedSignals = Array.from(sigMap.values());
    const highConf = dedupedSignals.filter(s => (s.confidence ?? 0) >= 0.6);

    for (const signal of highConf) {
      try {
        const candidates = await this.extractor.extractCandidatesFromSignal(signal);
        try { console.log('[Learning] candidate extraction for signal:', signal.type, '=>', JSON.stringify(candidates)); } catch(_){ }
        for (const c of candidates) {
          // sanitize candidate text first
          try {
            c.q = Sanitizer.sanitizeText(c.q || '');
            c.a = Sanitizer.sanitizeText(c.a || '');
          } catch (_e) { }

          // Avoid creating staged candidates from Lumi's own assistant reply outputs.
          // When `response` is provided, candidates extracted from that response
          // are considered Lumi system replies and should not be quarantined/tagged.
          if (response && c.a && String(c.a).trim() === String(response).trim()) {
            try { console.log('[Learning] skipping candidate derived from Lumi reply'); } catch(_){}
            continue;
          }

          // Threat scan and auto-merge decision
          try {
            const scan = Threat.scanQA(c.q || '', c.a || '');

            // Conservative auto-merge: ONLY very safe items (score < 10, conf > 0.9)
            const shouldAutoMerge = (
              (typeof scan.score === 'number' ? scan.score : 0) < 10 &&
              (typeof c.confidence === 'number' ? c.confidence : 0) >= 0.9 &&
              !scan.suspicious
            );

            // Log decision for validation (skip rapid duplicate logs)
            try {
              const logEntry = {
                timestamp: new Date().toISOString(),
                candidate_id: c.id || `cand_${Date.now()}`,
                question: c.q,
                confidence: c.confidence,
                threat_score: scan.score,
                threat_reasons: scan.reasons || [],
                decision: shouldAutoMerge ? 'auto_merge' : 'quarantine'
              };
              const logDir = path.join(process.cwd(), 'userData', 'security');
              await fs.promises.mkdir(logDir, { recursive: true });
              const logFile = path.join(logDir, 'validation.jsonl');
              // simple in-process dedupe to avoid writing the same candidate multiple times rapidly
              const recentMapKey = logEntry.candidate_id;
              try {
                (SignalProcessor as any)._recentLogged = (SignalProcessor as any)._recentLogged || new Map();
                const recent: Map<string, number> = (SignalProcessor as any)._recentLogged;
                const now = Date.now();
                const prev = recent.get(recentMapKey) || 0;
                if (now - prev > (60 * 1000)) {
                  // log and record time
                  await fs.promises.appendFile(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
                  recent.set(recentMapKey, now);
                }
              } catch (_e) {
                // fallback: append anyway
                await fs.promises.appendFile(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
              }
            } catch (_e) { /* ignore log failures */ }

            if (shouldAutoMerge) {
              // AUTO-MERGE: Safe to add directly to KB
              try { console.log('[Auto-Merge] ✅', c.q, 'Score:', scan.score, 'Conf:', c.confidence); } catch(_){ }
              const validation = await this.validator.validate(c);
              if (validation.valid) {
                // Attempt to fix encoding issues before merging
                try { c.q = fixEncodingAndNormalize(c.q || ''); c.a = fixEncodingAndNormalize(c.a || ''); } catch(_){ }
                await this.updateKB(c);
              }
            } else {
              // If threat is very high, remove it entirely (log removal) instead of quarantining
              try { console.log('[Quarantine] ⚠️', c.q, 'Score:', scan.score, 'Conf:', c.confidence); } catch(_){ }
              const scoreNum = (typeof scan.score === 'number' ? scan.score : 0);
              if (scoreNum > 30) {
                try { console.log('[Removal] 🔥 High-threat candidate removed:', c.id || '(no-id)', 'score:', scoreNum); } catch(_){ }
                try {
                  const logDir = path.join(process.cwd(), 'userData', 'security');
                  await fs.promises.mkdir(logDir, { recursive: true });
                  const removedFile = path.join(logDir, 'removed.jsonl');
                  const removedEntry = {
                    id: c.id || `removed_${Date.now()}`,
                    q: c.q,
                    a: c.a,
                    confidence: c.confidence,
                    source: c.source || 'signal',
                    threat_score: scan.score,
                    threat_reasons: scan.reasons || [],
                    removedAt: Date.now()
                  };
                  await fs.promises.appendFile(removedFile, JSON.stringify(removedEntry) + '\n', 'utf8');
                } catch (_e) { }
                continue; // do not stage or merge
              }

              // QUARANTINE: Needs manual review
              try {
                const stagingFile = getLumiPaths().stagingFile;
                await fs.promises.mkdir(path.dirname(stagingFile), { recursive: true });
                const staged = {
                  id: c.id || `staged_${Date.now()}`,
                  q: c.q,
                  a: c.a,
                  confidence: c.confidence,
                  status: 'quarantined',
                  threats: scan.reasons || [],
                  threat_score: scan.score,
                  timestamp: Date.now(),
                  source: c.source || 'signal'
                };
                  try {
                  const { appendStagingUnique } = await import('../../core/security/staging-utils.js');
                  const res = await appendStagingUnique(stagingFile, staged, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
                  if (res && res.ok) {
                    // Already appended to repo staging via appendStagingUnique; do not write sanitized copies to OS userData
                    try {
                      const bw = BrowserWindow.getAllWindows()[0];
                      if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
                        bw.webContents.send('lumi-learning-event', { type: 'staging-updated', action: 'append' });
                      }
                    } catch (_e) { }
                  }
                } catch (_e) {
                  try { await fs.promises.appendFile(stagingFile, JSON.stringify(staged) + '\n', 'utf8'); } catch (_e2) { }
                  try {
                    const bw = BrowserWindow.getAllWindows()[0];
                    if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
                      bw.webContents.send('lumi-learning-event', { type: 'staging-updated', action: 'append' });
                    }
                  } catch (_e3) { }
                }
              } catch (_e) { }
              continue; // Skip validation for quarantined items
            }
          } catch (_e) {
            // If threat detection fails, be conservative and quarantine
            try { console.log('[Quarantine] ⚠️ Error in threat scan, quarantining:', c.q); } catch(_){ }
              try {
                const stagingFile = getLumiPaths().stagingFile;
                await fs.promises.mkdir(path.dirname(stagingFile), { recursive: true });
                const staged = Object.assign({}, c, { id: c.id || `staged_${Date.now()}`, quarantined: true, threat: { error: 'scan-failed' }, date: new Date().toISOString() });
                  try {
                  const { appendStagingUnique } = await import('../../core/security/staging-utils.js');
                  const res = await appendStagingUnique(stagingFile, staged, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
                  if (res && res.ok) {
                      // Already appended to repo staging via appendStagingUnique; skip writing to OS userData
                        try {
                          const bw = BrowserWindow.getAllWindows()[0];
                          if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
                            bw.webContents.send('lumi-learning-event', { type: 'staging-updated', action: 'append' });
                          }
                        } catch (_e) { }
                  }
                } catch (_e) {
                  try { await fs.promises.appendFile(stagingFile, JSON.stringify(staged) + '\n', 'utf8'); } catch (_e2) { }
                  try {
                    const bw = BrowserWindow.getAllWindows()[0];
                    if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
                      bw.webContents.send('lumi-learning-event', { type: 'staging-updated', action: 'append' });
                    }
                  } catch (_e3) { }
                }
            } catch (_e) { }
            continue;
          }
        }
      } catch (err) {
        // swallow errors for now; caller may log
      }
    }
  }

  // Placeholder: update the KB (append to training/training.jsonl or call central KB writer)
  private async updateKB(candidate: Candidate): Promise<void> {
    // Append validated candidate to an audit jsonl and also merge into the repo training KB
    try {
      const repoTrainingDir = getLumiPaths().trainingDir;
      await fs.promises.mkdir(repoTrainingDir, { recursive: true });

      const safeQ = Sanitizer.redactPII(Sanitizer.sanitizeText(candidate.q || ''));
      const safeA = Sanitizer.redactPII(Sanitizer.sanitizeText(candidate.a || ''));

      // 1) Append audit line to training/training.jsonl
      try {
        const auditFile = path.join(repoTrainingDir, 'training.jsonl');
        const auditEntry = Object.assign({ id: candidate.id || `learned_${Date.now()}`, source: candidate.source || 'auto-learning', date: candidate.date || new Date().toISOString() }, candidate);
        await fs.promises.appendFile(auditFile, JSON.stringify(auditEntry) + '\n', 'utf8');
      } catch (_) { /* ignore audit failures */ }

      // 2) Merge into training/lumi_knowledge.json (array) so searchKB picks it up
      try {
        const kbFile = getLumiPaths().knowledgeBase;
        let arr: any[] = [];
        try {
          const raw = await fs.promises.readFile(kbFile, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) arr = parsed;
        } catch (_e) { /* treat as empty */ }

        const kbEntry = {
          id: candidate.id || `learned_${Date.now()}`,
          input: safeQ,
          output: safeA,
          confidence: candidate.confidence,
          source: candidate.source || 'auto-learning',
          date: candidate.date || new Date().toISOString()
        };

        // Avoid exact duplicates by simple check on input text
        const exists = arr.find((it: any) => it && it.input && String(it.input).trim() === String(kbEntry.input).trim());
        if (!exists) {
          arr.push(kbEntry);
          await fs.promises.writeFile(kbFile, JSON.stringify(arr, null, 2), 'utf8');
          try { console.log('[KB] merged entry:', kbEntry.id || '(no-id)', kbEntry.input); } catch(_){ }
          // notify any renderer that learning occurred
          try {
            const bw = BrowserWindow.getAllWindows()[0];
            if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
              bw.webContents.send('lumi-learning-event', { entry: kbEntry, confidence: candidate.confidence });
            }
          } catch (_e) { /* ignore notify failures */ }
        }
      } catch (_) { /* ignore kb merge failures */ }
    } catch (_) {
      // swallow top-level errors
    }
  }
}
