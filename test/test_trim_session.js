const Session = require('../dist/core/memory/session.js').default || require('../dist/core/memory/session.js').SessionManager;
const path = require('path');

(async () => {
  try {
    const userData = path.join(process.cwd(), 'userData');
    const s = new Session(userData);
    s.start();

    // Add 30 entries of ~1000 chars each (~250 tokens each by heuristic)
    const largeText = 'x'.repeat(1000);
    for (let i = 0; i < 30; i++) {
      s.add({ role: i % 2 === 0 ? 'user' : 'assistant', text: `entry-${i} ` + largeText, t: Date.now() + i });
    }

    console.log('Entries before trim:', s.all().length);

    // Use small token budget to force trimming
    const budget = 1000; // tokens
    const res = s.trimToTokenBudget(budget);
    console.log('Trim result:', res);
    console.log('Entries after trim:', s.all().length);

    // Print first and last kept entries (timestamps)
    const kept = s.all();
    if (kept.length) {
      console.log('Kept first t:', kept[0].t, 'last t:', kept[kept.length - 1].t);
    }
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(2);
  }
})();