// Verifies deterministic memory-check behavior: brain.think should return first user question
const path = require('path');
try {
  const brain = require('../dist/core/brain/index.js');
  const Session = require('../dist/core/memory/session.js').default || require('../dist/core/memory/session.js').SessionManager;

  (async () => {
    const sess = new Session(path.join(process.cwd(), 'userData'));
    sess.start();
    sess.add({ role: 'user', text: 'first question: what is the capital of France?' });
    sess.add({ role: 'assistant', text: 'Paris' });
    // expose session so think() can access it deterministically
    global.lumiSession = sess;

    const q = 'do you remember what I asked first?';
    try {
      const out = await brain.think(q, {});
      console.log('Brain reply:', String(out || '').slice(0, 400));
      if (String(out || '').toLowerCase().includes('what is the capital of france') || String(out || '').toLowerCase().includes('capital of france')) {
        console.log('OK: memory-check passed');
        process.exit(0);
      } else {
        console.error('FAIL: unexpected reply');
        process.exit(2);
      }
    } catch (e) {
      console.error('FAIL: think() threw', e);
      process.exit(2);
    }
  })();
} catch (e) {
  console.error('Test setup failed:', e);
  process.exit(2);
}
