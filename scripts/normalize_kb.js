/**
 * normalize_kb.js
 *
 * Normalizes and deduplicates `training/lumi_knowledge.json` entries.
 * - Unifies schema to { id, input, output, confidence?, source, date }
 * - Deduplicates by normalized input text (case/whitespace-insensitive)
 * - Prefers non-`renderer-feedback` sources (e.g. `auto-learning`, `curator`) when duplicates exist
 * - Writes cleaned file back to `training/lumi_knowledge.json` and emits a `training/normalize_report.json`
 */

const fs = require('fs');
const path = require('path');

function normalizeText(s) {
  if (!s) return '';
  return String(s).replace(/\s+/g, ' ').trim().toLowerCase();
}

async function loadJson(p) {
  try {
    const raw = await fs.promises.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function run() {
  const repoTraining = path.join(process.cwd(), 'training');
  const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
  const reportFile = path.join(repoTraining, 'normalize_report.json');

  const rawLoaded = await loadJson(kbFile);
  let arr = [];
  if (Array.isArray(rawLoaded)) {
    arr = rawLoaded;
  } else if (rawLoaded && typeof rawLoaded === 'object') {
    // If file contains a single object or wrapped structure, attempt to extract an array
    if (Array.isArray(rawLoaded.items)) arr = rawLoaded.items;
    else if (Array.isArray(rawLoaded.data)) arr = rawLoaded.data;
    else arr = [rawLoaded];
  } else {
    arr = [];
  }
  const map = new Map();
  const report = { originalCount: arr.length, kept: 0, removed: 0, replacements: [] };

  for (const raw of arr) {
    // Support legacy shapes: { input, output } or { q, a }
    const input = raw.input || raw.q || '';
    const output = raw.output || raw.a || '';
    const id = raw.id || raw._id || (`learned_${Date.now()}`);
    const source = raw.source || raw.source || (raw.user_id === 'system' ? 'seed' : (raw.source || 'renderer-feedback'));
    const date = raw.date || raw.t || raw.createdAt || new Date().toISOString();
    const confidence = raw.confidence || raw.conf || null;

    const key = normalizeText(input);
    if (!key) continue;

    const entry = { id, input: String(input), output: String(output), source, date, confidence };

    if (!map.has(key)) {
      map.set(key, entry);
    } else {
      const existing = map.get(key);
      // Prefer non-renderer-feedback over renderer-feedback
      const preferNew = (() => {
        if (existing.source === 'renderer-feedback' && entry.source !== 'renderer-feedback') return true;
        if (existing.source !== 'renderer-feedback' && entry.source === 'renderer-feedback') return false;
        // Prefer higher confidence if available
        const eConf = Number(existing.confidence || 0);
        const nConf = Number(entry.confidence || 0);
        if (nConf && eConf) return nConf > eConf;
        // Prefer more recent
        try { return new Date(entry.date) > new Date(existing.date); } catch (_) { return false; }
      })();

      if (preferNew) {
        report.replacements.push({ key, replaced: existing.id, with: entry.id });
        map.set(key, entry);
        report.removed += 1;
      } else {
        report.removed += 1;
      }
    }
  }

  const cleaned = Array.from(map.values()).sort((a,b)=> new Date(a.date) - new Date(b.date));
  try {
    await fs.promises.mkdir(repoTraining, { recursive: true });
    await fs.promises.writeFile(kbFile, JSON.stringify(cleaned, null, 2), 'utf8');
    report.kept = cleaned.length;
    report.generatedAt = new Date().toISOString();
    await fs.promises.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log('Normalization complete:', report);
  } catch (e) {
    console.error('Failed to write normalized KB:', e);
    process.exitCode = 2;
  }
}

if (require.main === module) run();

module.exports = { run };
