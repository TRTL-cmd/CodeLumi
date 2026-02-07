const assert = require('assert');
const os = require('os');
const path = require('path');
const fs = require('fs');
let SessionManager;
try {
  // prefer compiled JS if tsc has been run
  SessionManager = require('../dist/core/memory/session').default;
} catch (e) {
  SessionManager = require('../src/core/memory/session').default;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lumi-session-test-'));
  const sm = new SessionManager(tmp);
  sm.start();
  const e1 = sm.add({ role: 'user', text: 'Hello' });
  assert(e1.text === 'Hello');
  const e2 = sm.add({ role: 'assistant', text: 'Hi' });
  const all = sm.all();
  assert(all.length === 2);
  const q = sm.query('hello');
  assert(q.length >= 1);
  const file = await sm.persistArchive();
  assert(fs.existsSync(file));
  await sm.end({ persistArchive: false });
  console.log('SessionManager tests passed');
})();
