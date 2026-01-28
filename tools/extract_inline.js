const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '..', 'dist', 'index.html');
const out = path.resolve(__dirname, '..', 'dist', 'temp_script.js');
const s = fs.readFileSync(p, 'utf8');
const m = s.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
if(m){ fs.writeFileSync(out, m[1], 'utf8'); console.log('wrote', out); } else { console.error('no <script> found'); process.exitCode=2; }
