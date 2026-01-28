// Fetch sample glb models into assets/models
// Usage: node tools/fetch_sample_models.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const samples = [
  { name: 'Fox.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb' },
  { name: 'CesiumMan.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb' },
  { name: 'Monster.glb', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Monster/glTF-Binary/Monster.glb' }
];

const outDir = path.join(__dirname, '..', 'assets', 'models');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function download(s){
  return new Promise((resolve, reject)=>{
    const file = fs.createWriteStream(path.join(outDir, s.name));
    console.log('Downloading', s.url);
    https.get(s.url, (res)=>{
      if(res.statusCode !== 200){ reject(new Error('HTTP ' + res.statusCode)); return; }
      res.pipe(file);
      file.on('finish', ()=>{ file.close(()=>resolve()); });
    }).on('error', (e)=>{ try{ fs.unlinkSync(path.join(outDir, s.name)); }catch(_){} reject(e); });
  });
}

(async ()=>{
  for(const s of samples){
    try{ await download(s); console.log('Saved', s.name); }catch(e){ console.warn('Failed', s.name, e.message); }
  }
  console.log('Done.');
})();
