const { execSync } = require('child_process');

// Smart pre-commit checker for PII/absolute paths with allow-list for false positives
function getStagedFiles() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function getStagedContent(file) {
  try {
    return execSync(`git show :"${file.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  } catch (err) {
    return null;
  }
}

const patterns = {
  windowsAbsPath: /[A-Z]:\\(?:Users|Documents|Desktop|OneDrive|AppData)\\[^\s"',;]+/g,
  uncPath: /\\\\[A-Za-z0-9.-]+\\[^\s"',;]+/g
};

// Check if line is likely a false positive
function isFalsePositive(line, file) {
  // Allow already-redacted paths
  if (/\[REDACTED|PROJECT_ROOT|USER\]/.test(line)) return true;

  // Allow regex patterns (code that does redaction)
  if (/\.replace\(|pattern:|new RegExp|\/.*\/g/.test(line)) return true;

  // Allow example paths in documentation
  if (file.startsWith('docs/') || file.endsWith('.md')) {
    if (/echo|Example:|^\s*[-*]|```|`.*`/.test(line)) return true;
  }

  // Allow test files with example paths and pattern definitions
  if (file.includes('test') || file.includes('scripts/')) {
    if (/test|example|sample|patterns:|\/.*\/i/.test(line.toLowerCase())) return true;
  }

  // Allow .venv virtualenv paths (project-relative, not user-specific)
  if (/\.venv\\Scripts/.test(line) || /venv.*python\.exe/.test(line)) return true;

  // Allow JSON data with [PROJECT_ROOT] prefix
  if (/"path":"?\[PROJECT_ROOT\]/.test(line)) return true;

  // Allow escaped path separators in code (regex literals)
  if (/\\\\[snrt]|\\\\\\\\/.test(line)) return true;

  return false;
}

function main() {
  let stagedFiles = [];
  try { stagedFiles = getStagedFiles(); } catch (e) { process.exit(0); }
  if (stagedFiles.length === 0) return;

  const violations = [];
  for (const file of stagedFiles) {
    if (file.includes('node_modules/') || file.includes('.git/')) continue;
    const content = getStagedContent(file);
    if (!content) continue;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip false positives
      if (isFalsePositive(line, file)) continue;

      for (const [type, pattern] of Object.entries(patterns)) {
        const m = line.match(pattern);
        if (m && m.length) violations.push({ file, line: i + 1, type, sample: line.slice(0, 200) });
      }
    }
  }

  if (violations.length) {
    console.error('\n❌ COMMIT BLOCKED: PII/Absolute paths detected in staged files!\n');
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line} - ${v.type}`);
      console.error(`    ${v.sample}\n`);
    }
    console.error('\nRun: node scripts/redact_paths.js <file>  then stage and commit.');
    process.exit(1);
  }
}

main();
