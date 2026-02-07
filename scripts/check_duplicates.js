const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
const content = fs.readFileSync(mainPath, 'utf8');

// Find all ipcMain.handle calls
const handlePattern = /ipcMain\.handle\(['"]([^'\"]+)['"]/g;
const handlers = [];
let match;

while ((match = handlePattern.exec(content)) !== null) {
  handlers.push({
    name: match[1],
    line: content.substring(0, match.index).split('\n').length
  });
}

// Find duplicates
const counts = {};
handlers.forEach(h => {
  counts[h.name] = counts[h.name] || [];
  counts[h.name].push(h.line);
});

const duplicates = Object.entries(counts).filter(([_, lines]) => lines.length > 1);

if (duplicates.length === 0) {
  console.log('✅ No duplicate IPC handlers found!');
  process.exit(0);
} else {
  console.log('❌ Found duplicate IPC handlers:\n');
  duplicates.forEach(([name, lines]) => {
    console.log(`  "${name}" registered ${lines.length} times:`);
    lines.forEach(line => console.log(`    - Line ${line}`));
  });
  console.log('\n⚠️  Remove duplicates before testing!');
  process.exit(1);
}
