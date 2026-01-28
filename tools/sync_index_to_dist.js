const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root,'index.html'),'utf8');
const distp = path.join(root,'dist','index.html');
const m = src.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
if(!m) { console.error('no script in index.html'); process.exit(2); }
const script = m[0];
let dist = fs.readFileSync(distp,'utf8');
// replace first <script>...</script> in dist with script from index.html
const newdist = dist.replace(/<script[^>]*>[\s\S]*?<\/script>/i, script);
fs.writeFileSync(distp, newdist,'utf8');
console.log('synced script to', distp);
