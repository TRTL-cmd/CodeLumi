const fs = require('fs');
const path = require('path');

// Files to sanitize relative to training/
const TARGET_FILES = ['lumi_knowledge.json', 'lumi_knowledge.deduped.json'];

function isWindowsPathLike(s){
  return /[A-Za-z]:\\/.test(s) || /\\\\/.test(s);
}

function redactString(s){
  if(!s || typeof s !== 'string') return s;
  // replace Windows absolute paths
  let out = s.replace(/[A-Za-z]:\\\\[^\n\r"]*/g, '[REDACTED_PATH]');
  // replace UNC paths
  out = out.replace(/\\\\[\w\d._-]+(\\[^\n\r"]*)*/g, '[REDACTED_PATH]');
  // replace emails
  out = out.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  return out;
}

function sanitizeValue(key, value){
  if(typeof value === 'string'){
    if(key === 'file' || key === 'path' || key === 'filepath'){
      try{ return path.basename(value); }catch(_){ return '[REDACTED_PATH]'; }
    }
    return redactString(value);
  }
  if(Array.isArray(value)) return value.map((v)=>sanitizeValue(key, v));
  if(value && typeof value === 'object') return sanitizeObject(value);
  return value;
}

function sanitizeObject(obj){
  const out = Array.isArray(obj) ? [] : {};
  for(const k of Object.keys(obj)){
    try{
      out[k] = sanitizeValue(k, obj[k]);
    }catch(e){
      out[k] = '[REDACTED]';
    }
  }
  return out;
}

(async ()=>{
  try{
    const repoTraining = path.join(process.cwd(),'training');
    if(!fs.existsSync(repoTraining)){
      console.warn('training folder not found at', repoTraining); process.exit(0);
    }

    for(const fname of TARGET_FILES){
      const file = path.join(repoTraining, fname);
      if(!fs.existsSync(file)) continue;
      const bak = path.join(repoTraining, `${fname}.backup.redact.${Date.now()}.json`);
      fs.copyFileSync(file, bak);
      const raw = fs.readFileSync(file,'utf8');
      let parsed;
      try{ parsed = JSON.parse(raw || '[]'); }catch(e){ console.warn('failed parse', file); continue; }

      // Some KB formats store { qa: [...] }
      let payload = parsed;
      if(parsed && parsed.qa && Array.isArray(parsed.qa)) payload = parsed.qa;

      let out;
      if(Array.isArray(payload)){
        out = payload.map(it=>sanitizeObject(it));
      }else if(payload && typeof payload === 'object'){
        out = sanitizeObject(payload);
      }else{
        out = sanitizeValue('', payload);
      }

      // if original had top-level { qa: [...] }, preserve wrapper
      if(parsed && parsed.qa && Array.isArray(parsed.qa)){
        parsed.qa = out;
        fs.writeFileSync(file, JSON.stringify(parsed, null, 2), 'utf8');
      }else{
        fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');
      }
      console.log('Sanitized', fname, 'Backup at', bak);
    }

    console.log('Redaction complete. Reviewed files in training/.');
  }catch(e){ console.error('redact failed', e); process.exit(2); }
})();
