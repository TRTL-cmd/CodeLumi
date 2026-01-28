const fs = require('fs').promises;
const path = require('path');

async function main() {
  const auditFile = path.join(process.cwd(), 'docs', 'privacy_audit_results.json');
  let audit;
  try {
    const raw = await fs.readFile(auditFile, 'utf8');
    audit = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read audit results:', e.message);
    process.exit(2);
  }

  const findings = audit.findings || [];
  for (const f of findings) {
    try {
      const hasPaths = (f.windowsAbs && f.windowsAbs.length) || (f.unc && f.unc.length);
      if (!hasPaths) continue;
      const file = f.file;
      // Skip if file missing
      try { await fs.access(file); } catch (_) { console.warn('Missing file, skipping', file); continue; }

      const raw = await fs.readFile(file, 'utf8');
      const backup = `${file}.backup.redact.${Date.now()}.bak`;
      await fs.copyFile(file, backup);

      // Patterns
      const windowsAbsRe = /[A-Za-z]:\\[^"\r\n]*/g;
      const uncRe = /\\\\[^\\\s]+\\[^\\\s]+/g;

      let sanitized = raw.replace(windowsAbsRe, '[REDACTED_PATH]');
      sanitized = sanitized.replace(uncRe, '[REDACTED_UNC]');

      await fs.writeFile(file, sanitized, 'utf8');
      console.log('Sanitized', file, '-> backup at', backup);
    } catch (e) {
      console.error('Error processing', f.file, e.message);
    }
  }
  console.log('Redaction pass complete.');
}

main().catch(err => { console.error(err); process.exit(3); });
