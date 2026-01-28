#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

function getStagedFiles() {
  const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function getStagedContent(file) {
  try {
    // Use git show to get staged version
    return execSync(`git show :"${file.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  } catch (err) {
    return '';
  }
}

function findIssues(content) {
  const issues = [];
  const windowsAbsRe = /[A-Za-z]:\\[\\\S]*/g;
  const uncRe = /\\\\[^\s\\]+\\[^\s\\]+/g;
  let m;
  while ((m = windowsAbsRe.exec(content))) issues.push({ type: 'windows-abs', match: m[0] });
  while ((m = uncRe.exec(content))) issues.push({ type: 'unc', match: m[0] });
  return issues;
}

function main() {
  const staged = getStagedFiles();
  if (!staged.length) process.exit(0);

  const report = [];

  for (const f of staged) {
    const ext = path.extname(f).toLowerCase();
    // Only scan textual files
    if (['.png', '.jpg', '.jpeg', '.gif', '.zip', '.exe', '.dat', '.bin'].includes(ext)) continue;
    const content = getStagedContent(f);
    if (!content) continue;
    const issues = findIssues(content);
    if (issues.length) report.push({ file: f, issues });
  }

  if (report.length) {
    console.error('\nCommit blocked: detected absolute Windows/UNC paths in staged files.');
    for (const r of report) {
      console.error('\n' + r.file + ':');
      for (const i of r.issues) console.error(`  - [${i.type}] ${i.match}`);
    }
    console.error('\nPlease remove or redact absolute paths (use basenames/placeholders) before committing.');
    process.exit(1);
  }

  process.exit(0);
}

main();
