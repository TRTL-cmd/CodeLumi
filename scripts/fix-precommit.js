const fs = require('fs');
const path = require('path');

function removeShebang(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (raw.startsWith('#!')) {
    const lines = raw.split(/\r?\n/);
    lines.shift();
    const newText = lines.join('\n');
    fs.copyFileSync(file, file + '.backup');
    fs.writeFileSync(file, newText, 'utf8');
    console.log('Fixed shebang in', file);
    return true;
  }
  return false;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
    } else if (stat.isFile() && p.endsWith('.js')) {
      removeShebang(p);
    }
  }
}

// Fix scripts/ and .husky hooks
try {
  const repo = process.cwd();
  const scriptsDir = path.join(repo, 'scripts');
  if (fs.existsSync(scriptsDir)) walk(scriptsDir);
  const husky = path.join(repo, '.husky');
  if (fs.existsSync(husky)) {
    for (const f of fs.readdirSync(husky)) {
      const p = path.join(husky, f);
      if (fs.statSync(p).isFile()) {
        removeShebang(p);
      }
    }
  }
  console.log('Pre-commit fixer complete.');
} catch (e) {
  console.error('Error fixing precommit:', e.message);
  process.exit(1);
}
