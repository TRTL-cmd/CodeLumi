const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'assets', 'models');
const dest = path.join(root, 'dist', 'assets', 'models');

async function copyDir(s, d) {
  await fs.promises.mkdir(d, { recursive: true });
  const entries = await fs.promises.readdir(s, { withFileTypes: true });
  for (const e of entries) {
    const sPath = path.join(s, e.name);
    const dPath = path.join(d, e.name);
    if (e.isDirectory()) {
      await copyDir(sPath, dPath);
    } else {
      await fs.promises.copyFile(sPath, dPath);
    }
  }
}

(async function main(){
  try {
    if (!fs.existsSync(src)) {
      console.log('[postbuild] No models to copy;', src);
      return;
    }
    // Prefer native fs.cp when available
    if (fs.promises.cp) {
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.cp(src, dest, { recursive: true });
      console.log('[postbuild] Copied models (fs.cp) to', dest);
      return;
    }
    await copyDir(src, dest);
    console.log('[postbuild] Copied models to', dest);
  } catch (err) {
    console.error('[postbuild] Failed to copy models:', err);
    process.exit(1);
  }
})();
