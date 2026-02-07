const os = require('os');
const path = require('path');
const fs = require('fs');
let SessionManager;
try {
  SessionManager = require('../dist/core/memory/session').default;
} catch (e) {
  SessionManager = require('../src/core/memory/session').default;
}
let brain;
try {
  brain = require('../dist/core/brain').default;
} catch (e) {
  brain = require('../src/core/brain').default;
}

async function runSession(tmpdir, label, question, answer) {
  const sm = new SessionManager(tmpdir);
  sm.start();
  console.log(`\n--- ${label} START ---`);
  // Attach session store so brain functions can persist signals into session memory
  const oldStore = (global).lumiMemory;
  const oldSession = (global).lumiSession;
  (global).lumiMemory = {
    add: (entry) => Promise.resolve(sm.add(entry)),
    query: (q, lim) => Promise.resolve(sm.query(q, lim)),
  };
  // expose in-memory session so brain.think and main wrappers can access session history
  (global).lumiSession = sm;

  // 1) ask: what is 2+2?
  sm.add({ role: 'user', text: 'what is 2+2?' });
  let reply1;
  try { reply1 = await brain.think('what is 2+2?'); } catch (e) { reply1 = `ERROR: ${String(e)}`; }
  sm.add({ role: 'assistant', text: String(reply1 || '') });

  // 2) another question
  sm.add({ role: 'user', text: 'tell me a short joke' });
  let reply2;
  try { reply2 = await brain.think('tell me a short joke'); } catch (e) { reply2 = `ERROR: ${String(e)}`; }
  sm.add({ role: 'assistant', text: String(reply2 || '') });

  // 3) ask again (recall the first question) -- simulate a user prompt that requests recall
  sm.add({ role: 'user', text: 'do you remember what I asked first?' });
  let reply3;
  try { reply3 = await brain.think('do you remember what I asked first?'); } catch (e) { reply3 = `ERROR: ${String(e)}`; }
  sm.add({ role: 'assistant', text: String(reply3 || '') });

  // detach temporary global store and restore previous session
  (global).lumiMemory = oldStore;
  (global).lumiSession = oldSession;

  console.log('Entries in session:', sm.all().length);
  console.log('Lumi reply to recall request:', reply3);
  // archive and end
  const file = await sm.persistArchive();
  console.log('Archived to:', file);
  // optional auto-promote for testing
  if (process.env.AUTO_PROMOTE) {
    try {
      const repoTraining = path.join(process.cwd(), 'training');
      const trainFile = path.join(repoTraining, 'training.jsonl');
      try { if (!fs.existsSync(repoTraining)) fs.mkdirSync(repoTraining, { recursive: true }); } catch (_e) {}
      try { const bak = path.join(repoTraining, `training.jsonl.backup.${Date.now()}.bak`); if (fs.existsSync(trainFile)) fs.copyFileSync(trainFile, bak); } catch (_e) {}
      const raw = fs.readFileSync(file, 'utf8'); const lines = raw.split(/\r?\n/).filter(Boolean);
      const out = [];
      for (const ln of lines) {
        try { const obj = JSON.parse(ln); const candidate = { input: (obj.role === 'user' ? obj.text : undefined) || obj.text, output: (obj.role === 'assistant' ? obj.text : ''), meta: { promotedFrom: file, t: obj.t } }; out.push(JSON.stringify(candidate)); } catch (_e) { }
      }
      if (out.length) fs.appendFileSync(trainFile, out.join('\n') + '\n', 'utf8');
      console.log('Auto-promoted archive to training:', trainFile);
    } catch (e) { console.error('Auto-promote failed', e); }
  }
  await sm.end({ persistArchive: false });
  console.log(`--- ${label} END ---\n`);
  return { sm, archive: file, lumiReply: reply3 };
}

(async () => {
  // By default write archives into the app `userData` folder so the renderer can list them.
  const defaultBase = path.join(process.cwd(), 'userData');
  if (!fs.existsSync(defaultBase)) fs.mkdirSync(defaultBase, { recursive: true });
  const baseTmp = process.env.SIM_BASE || defaultBase;
  console.log('Base temp dir:', baseTmp);
  // three separate sessions (simulate three app opens)
  const s1 = await runSession(baseTmp, 'Session 1', 'What is my project name?', "I don't know yet.");
  const s2 = await runSession(baseTmp, 'Session 2', 'How to fix bug X?', 'Try checking the stack trace.');
  const s3 = await runSession(baseTmp, 'Session 3', 'Remember my project name?', 'You asked about your project, not its name.');

  console.log('Simulation complete. Archives created:');
  console.log(s1.archive);
  console.log(s2.archive);
  console.log(s3.archive);
})();
