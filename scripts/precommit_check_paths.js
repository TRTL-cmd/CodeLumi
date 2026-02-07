const { execSync } = require('child_process');
const fs = require('fs');

// Pre-commit hook: Block commits containing PII
function getStagedFiles() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
function getStagedContent(file) {
  try {
    return execSync(`git show :"${file.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
// PII patterns
const patterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  windowsAbsPath: /[A-Z]:\\(?:Users|Documents|Desktop|OneDrive|AppData)\\[^\s"',;]+/g,
  uncPath: /\\\\[A-Za-z0-9.-]+\\[^\s"',;]+/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
};

function main() {
  let stagedFiles = [];
  try {
    stagedFiles = getStagedFiles();
  } catch (e) {
    console.error('Error getting staged files:', e.message);
    process.exit(0); // Allow commit if can't check
  if (stagedFiles.length === 0) {
    process.exit(0);
  }
  const violations = [];

  for (const file of stagedFiles) {
    if (
      file.includes('node_modules/') ||
      file.includes('.git/') ||
      file.match(/\.(jpg|jpeg|png|gif|pdf|exe|dll|so|dylib|zip|tar|gz)$/i)
    ) {
      continue;
  const content = getStagedContent(file);
  if (!content) continue;

  const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const [type, pattern] of Object.entries(patterns)) {
        const matches = line.match(pattern);
        if (matches && matches.length > 0) {
          violations.push({ file, line: i + 1, type, sample: line.slice(0, 200) });
  if (violations.length > 0) {
    console.error('\n❌ COMMIT BLOCKED: PII detected in staged files!\n');
    violations.forEach(v => {
      console.error(`  ${v.file}:${v.line} - ${v.type}`);
      console.error(`    Sample: ${v.sample}\n`);
    });
    console.error('\nTo fix: run: node scripts/redact_paths.js <file>  then stage and commit.');
    process.exit(1);
  }
  process.exit(0);
}

main();
const { execSync } = require('child_process');
const fs = require('fs');

// Pre-commit hook: Block commits containing PII

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

// PII patterns
const patterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  windowsAbsPath: /[A-Z]:\\(?:Users|Documents|Desktop|OneDrive|AppData)\\[^\s"',;]+/g,
  uncPath: /\\\\[A-Za-z0-9.-]+\\[^\s"',;]+/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
};

function main() {
  let stagedFiles = [];
  try {
    main();
      try {
        // Get staged content (not working tree)
        content = execSync(`git show :${file}`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (e) {
        continue; // Skip if can't read
      }

      const lines = content.split('\n');
  
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
    
        for (const [type, pattern] of Object.entries(patterns)) {
          const matches = line.match(pattern);
          if (matches && matches.length > 0) {
            violations.push({
              file,
              line: lineNum + 1,
              type,
              sample: line.substring(0, 100)
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      console.error('\n❌ COMMIT BLOCKED: PII detected in staged files!\n');
      console.error('Violations found:\n');
  
      violations.forEach(v => {
        console.error(`  ${v.file}:${v.line} - ${v.type}`);
        console.error(`    Sample: ${v.sample}\n`);
      });
  
      console.error('\nTo fix:');
      console.error('  1. Run: node scripts/redact_paths.js <file>');
      console.error('  2. Review changes');
      console.error('  3. Stage fixed files');
      console.error('  4. Commit again\n');
      console.error('Or bypass (NOT recommended): git commit --no-verify\n');
  
      process.exit(1);
    }

    console.log('✅ No PII detected in staged files.\n');
    process.exit(0);
