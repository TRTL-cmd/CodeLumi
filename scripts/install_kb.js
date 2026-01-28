const fs = require('fs').promises;
const path = require('path');

(async ()=>{
  try{
    const src = path.join(process.env.USERPROFILE || process.cwd(), 'Downloads', 'lumi_knowledge_1000_qa.json');
    const destDir = path.join(process.cwd(), 'training');
    const dest = path.join(destDir, 'lumi_knowledge.json');
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(src, dest);
    console.log('Copied KB from', src, 'to', dest);
    const raw = await fs.readFile(dest, 'utf8');
    const data = JSON.parse(raw);
    let count = 0;
    if(Array.isArray(data)) count = data.length;
    else if(data.qa && Array.isArray(data.qa)) count = data.qa.length;
    else if(data.entries && Array.isArray(data.entries)) count = data.entries.length;
    else count = 1;
    console.log('KB entries detected:', count);
  }catch(e){ console.error('Install failed:', e && e.message); process.exit(2); }
})();
