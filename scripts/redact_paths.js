
/**
 * Redact PII from files (simple, safe implementation)
 * Usage:
 *   node scripts/redact_paths.js <file1> [file2...] [--dry-run]
 *   node scripts/redact_paths.js --all
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');

const projectRoot = process.cwd();
console.log(`Starting redaction${dryRun ? ' (DRY RUN)' : ''} from ${projectRoot}`);

// Redaction patterns
const redactions = [
  { 
    pattern: /C:\\Users\\[^\\]+/g, 
    replacement: 'C:\\Users\\[REDACTED]',
    name: 'Windows user path'
  },
  { 
    pattern: /\\\\[A-Za-z0-9.-]+\\[^\s"',;]+/g, 
    replacement: '\\\\[SERVER_REDACTED]\\share',
    name: 'UNC path'
  },
  { 
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
    replacement: '[EMAIL_REDACTED]',
    name: 'Email'
  },
  { 
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g, 
    replacement: '***-**-****',
    name: 'SSN'
  }
];

let filesProcessed = 0;
let filesModified = 0;
let totalRedactions = 0;

function redactFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileRedactions = 0;

  for (const { pattern, replacement, name } of redactions) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fileRedactions += matches.length;
      console.log(`  ✏️  ${name}: ${matches.length} instances`);
    }
  }

  filesProcessed++;

  if (fileRedactions > 0) {
    filesModified++;
    totalRedactions += fileRedactions;

    if (!dryRun) {
      // Create backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, originalContent, 'utf-8');
      }

      // Write redacted content
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Redacted ${fileRedactions} instances in ${path.basename(filePath)}`);
    } else {
      console.log(`  🔍 Would redact ${fileRedactions} instances in ${path.basename(filePath)}`);
    }
  }
}

function scanDirectory(dir, extensions = ['.json', '.jsonl', '.log', '.txt']) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip certain directories
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.venv'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, extensions);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        console.log(`\nProcessing: ${fullPath}`);
        redactFile(fullPath);
      }
    }
  }
}

// Main execution
if (all) {
  const dirs = ['training', 'userData'];
  dirs.forEach(dir => {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`\n📁 Scanning ${dir}/...`);
      scanDirectory(dirPath);
    }
  });
} else {
  // Redact specific files
  const files = args.filter(arg => !arg.startsWith('--'));
  if (files.length === 0) {
    console.log('Usage: node scripts/redact_paths.js <file1> [file2...] [--dry-run] [--all]');
    process.exit(1);
  }

  files.forEach(file => {
    const candidate = path.isAbsolute(file) ? file : path.join(projectRoot, file);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      console.log(`\n📁 Scanning ${candidate}...`);
      scanDirectory(candidate);
    } else {
      console.log(`\nProcessing: ${candidate}`);
      redactFile(candidate);
    }
  });
}

console.log(`\n${'='.repeat(70)}`);
console.log(`📊 SUMMARY`);
console.log(`${'='.repeat(70)}`);
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total redactions: ${totalRedactions}`);
if (dryRun) {
  console.log('\n⚠️  DRY RUN - No files were actually modified');
}
console.log();
