/**
 * Beta Cleanup Script for Lumi
 * 
 * Prepares Lumi for beta release by:
 * - Deleting development backups
 * - Deleting personal logs
 * - Running privacy audit
 * - Updating .gitignore
 * - Verifying pre-commit hook
 * 
 * Usage: node scripts/beta-cleanup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(70));
console.log('🚀 LUMI BETA CLEANUP');
console.log('='.repeat(70) + '\n');

let cleaned = 0;
let warnings = 0;

// 1. Delete backups
console.log('1️⃣  Deleting development backups...');
try {
  const backupPath = path.join(process.cwd(), 'userData', 'backups');
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
    console.log('   ✅ Deleted userData/backups/');
    cleaned++;
  } else {
    console.log('   ℹ️  No backups found (already clean)');
  }
} catch (e) {
  console.log(`   ⚠️  Failed to delete backups: ${e.message}`);
  warnings++;
}

// 2. Delete logs
console.log('\n2️⃣  Deleting development logs...');
try {
  const logsPath = path.join(process.cwd(), 'userData', 'logs');
  if (fs.existsSync(logsPath)) {
    fs.rmSync(logsPath, { recursive: true, force: true });
    console.log('   ✅ Deleted userData/logs/');
    cleaned++;
  } else {
    console.log('   ℹ️  No logs found (already clean)');
  }
} catch (e) {
  console.log(`   ⚠️  Failed to delete logs: ${e.message}`);
  warnings++;
}

// 3. Delete .backup files
console.log('\n3️⃣  Deleting .backup files...');
try {
  let backupsDeleted = 0;
  
  function deleteBackups(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
        deleteBackups(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.backup')) {
        fs.unlinkSync(fullPath);
        backupsDeleted++;
      }
    }
  }
  
  deleteBackups(path.join(process.cwd(), 'userData'));
  deleteBackups(path.join(process.cwd(), 'training'));
  
  if (backupsDeleted > 0) {
    console.log(`   ✅ Deleted ${backupsDeleted} .backup files`);
    cleaned++;
  } else {
    console.log('   ℹ️  No .backup files found');
  }
} catch (e) {
  console.log(`   ⚠️  Failed to delete .backup files: ${e.message}`);
  warnings++;
}

// 4. Update .gitignore
console.log('\n4️⃣  Updating .gitignore...');
try {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignore = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf-8');
  }
  
  const entries = [
    '# User data (generated at runtime)',
    'userData/backups/',
    'userData/logs/',
    '',
    '# Privacy tool backups',
    '*.backup'
  ];
  
  let added = false;
  for (const entry of entries) {
    if (!gitignore.includes(entry)) {
      gitignore += '\n' + entry;
      added = true;
    }
  }
  
  if (added) {
    fs.writeFileSync(gitignorePath, gitignore.trim() + '\n', 'utf-8');
    console.log('   ✅ Updated .gitignore');
    cleaned++;
  } else {
    console.log('   ℹ️  .gitignore already up to date');
  }
} catch (e) {
  console.log(`   ⚠️  Failed to update .gitignore: ${e.message}`);
  warnings++;
}

// 5. Run privacy audit
console.log('\n5️⃣  Running privacy audit...');
try {
  const auditScript = path.join(process.cwd(), 'scripts', 'privacy_audit.js');
  if (fs.existsSync(auditScript)) {
    execSync(`node "${auditScript}"`, { stdio: 'inherit' });
    console.log('   ✅ Privacy audit complete');
  } else {
    console.log('   ⚠️  privacy_audit.js not found');
    warnings++;
  }
} catch (e) {
  console.log(`   ⚠️  Privacy audit failed: ${e.message}`);
  warnings++;
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Cleanup actions: ${cleaned}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (warnings === 0) {
  console.log('\n🎉 BETA CLEANUP COMPLETE!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review privacy audit results above');
  console.log('   2. Test pre-commit hook: echo "C:\\Bad\\Path" > test.txt && git add test.txt && git commit -m "test"');
  console.log('   3. Commit changes: git add . && git commit -m "Beta cleanup complete"');
  console.log('   4. Push to GitHub: git push origin main');
  console.log('\n🚀 Ready for beta launch!');
} else {
  console.log('\n⚠️  Some warnings occurred. Review above and fix manually.');
}

console.log('\n' + '='.repeat(70) + '\n');

process.exit(warnings > 0 ? 1 : 0);
