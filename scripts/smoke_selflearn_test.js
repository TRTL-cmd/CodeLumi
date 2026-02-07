const fs = require('fs');
const path = require('path');
const http = require('http');

const repo = path.resolve(__dirname, '..');
const userData = path.join(repo, 'userData');
const selfDir = path.join(userData, 'self-learn');
const secDir = path.join(userData, 'security');

function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
ensureDir(selfDir); ensureDir(secDir);

function appendJsonl(filePath, obj){ fs.appendFileSync(filePath, JSON.stringify(obj) + '\n', 'utf8'); }

async function checkOllama(){
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  return new Promise((res)=>{
    try{
      const u = new URL(host);
      const opts = { method: 'GET', hostname: u.hostname, port: u.port || 80, path: '/', timeout: 2000 };
      const req = http.request(opts, r=>{ res({ ok: true, status: r.statusCode }); });
      req.on('error', ()=>res({ ok: false }));
      req.on('timeout', ()=>{ req.destroy(); res({ ok:false }); });
      req.end();
    }catch(e){ res({ ok: false }); }
  });
}

(async ()=>{
  console.log('Smoke test: verifying write paths and simple artifacts');
  const ol = await checkOllama();
  console.log('Ollama reachable:', ol.ok ? 'yes' : 'no (recommended to run for full features)');

  const auditFile = path.join(selfDir, 'selflearn_audit.jsonl');
  const suggFile = path.join(selfDir, 'selflearn_suggestions.jsonl');
  const valFile = path.join(secDir, 'validation.jsonl');

  const beforeAudit = fs.existsSync(auditFile) ? fs.readFileSync(auditFile,'utf8').split('\n').filter(Boolean).length : 0;
  appendJsonl(auditFile, {timestamp:new Date().toISOString(), note:'smoke-test-audit', test:true});
  appendJsonl(suggFile, {timestamp:new Date().toISOString(), suggestion:'smoke-test-suggestion', file:'<test>'});
  appendJsonl(valFile, {timestamp:new Date().toISOString(), candidate_id:'smoke_test', decision:'auto_merge', confidence:0.99});

  const afterAudit = fs.readFileSync(auditFile,'utf8').split('\n').filter(Boolean).length;
  console.log(`Audit lines before: ${beforeAudit}, after: ${afterAudit}`);
  console.log('Appended sample lines to:');
  console.log(' -', auditFile);
  console.log(' -', suggFile);
  console.log(' -', valFile);
  console.log('Smoke test complete — these files simulate expected runtime writes and help verify file permissions.');
})();
