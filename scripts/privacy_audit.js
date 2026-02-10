const fs = require('fs').promises;
const path = require('path');

const scanDirs = [path.join(process.cwd(), 'training'), path.join(process.cwd(), 'userData')];

const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const windowsAbsRe = /[A-Za-z]:\\[\\\S]*/g; // simple heuristic
const uncRe = /\\\\[^\\\s]+\\[^\\\s]+/g;

function redactPathValue(value) {
  if (!value || typeof value !== 'string') return value;
  return value
    .replace(windowsAbsRe, '[REDACTED_PATH]')
    .replace(uncRe, '[REDACTED_PATH]');
}

function redactReport(report) {
  report.scanned = report.scanned.map((s) => ({
    ...s,
    dir: redactPathValue(s.dir)
  }));
  report.findings = report.findings.map((f) => ({
    ...f,
    file: redactPathValue(f.file),
    windowsAbs: (f.windowsAbs || []).map(redactPathValue),
    unc: (f.unc || []).map(redactPathValue)
  }));
  return report;
}

async function walk(dir) {
  const results = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const it of items) {
      const p = path.join(dir, it.name);
      if (it.isDirectory()) results.push(...await walk(p));
      else results.push(p);
    }
  } catch (e) {
    // ignore
  }
  return results;
}

async function scanFile(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const emails = raw.match(emailRe) || [];
    const winAbs = raw.match(windowsAbsRe) || [];
    const unc = raw.match(uncRe) || [];
    return { file, emails: Array.from(new Set(emails)), windowsAbs: Array.from(new Set(winAbs)), unc: Array.from(new Set(unc)) };
  } catch (e) {
    return null;
  }
}

async function main() {
  const report = { scanned: [], findings: [], timestamp: new Date().toISOString() };
  for (const d of scanDirs) {
    const files = await walk(d);
    report.scanned.push({ dir: d, count: files.length });
    for (const f of files) {
      const r = await scanFile(f);
      if (!r) continue;
      report.findings.push(r);
      if (r.emails.length || r.windowsAbs.length || r.unc.length) {
        // write to console summary
        console.log(`Found in ${path.relative(process.cwd(), f)}: emails=${r.emails.length}, windowsAbs=${r.windowsAbs.length}, unc=${r.unc.length}`);
      }
    }
  }
  // redact before writing results to disk
  redactReport(report);

  // write results
  await fs.mkdir(path.join(process.cwd(), 'docs'), { recursive: true });
  const outJson = path.join(process.cwd(), 'docs', 'privacy_audit_results.json');
  await fs.writeFile(outJson, JSON.stringify(report, null, 2), 'utf8');

  // generate short markdown summary
  const mdLines = [];
  mdLines.push('# Privacy Audit — 2026-01-28');
  mdLines.push('Generated: ' + report.timestamp);
  mdLines.push('');
  mdLines.push('## Scanned directories');
  for (const s of report.scanned) mdLines.push(`- ${s.dir} — ${s.count} files`);
  mdLines.push('');
  mdLines.push('## Key findings (files with potential PII or absolute paths)');
  for (const f of report.findings) {
    if (f.emails.length || f.windowsAbs.length || f.unc.length) {
      mdLines.push(`- ${path.relative(process.cwd(), f.file)}`);
      if (f.emails.length) mdLines.push(`  - emails: ${f.emails.slice(0,5).join(', ')}${f.emails.length>5?', ...':''}`);
      if (f.windowsAbs.length) mdLines.push(`  - windows paths: ${f.windowsAbs.slice(0,3).join(' | ')}${f.windowsAbs.length>3?', ...':''}`);
      if (f.unc.length) mdLines.push(`  - UNC paths: ${f.unc.slice(0,3).join(' | ')}${f.unc.length>3?', ...':''}`);
    }
  }
  mdLines.push('');
  mdLines.push('## Recommendations');
  mdLines.push('- Replace discovered absolute paths with basenames where possible; redact or pseudonymize emails.');
  mdLines.push('- Ensure runtime writes are sanitized before persisting to `userData`.');
  mdLines.push('- Add CI check to fail on committed files containing `<WINDOWS_PATH>` or email patterns in `training/`.');

  const mdOut = path.join(process.cwd(), 'docs', 'privacy_audit_2026-01-28.md');
  await fs.writeFile(mdOut, mdLines.join('\n'), 'utf8');
  console.log('\nAudit complete. Results written to docs/privacy_audit_results.json and docs/privacy_audit_2026-01-28.md');
}

main().catch(err => { console.error(err); process.exit(2); });
