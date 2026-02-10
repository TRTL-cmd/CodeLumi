// Simple Node test for tokenizer utilities (uses compiled dist files)
const path = require('path');
try {
  const tk = require('../dist-electron/core/tokenizer');
  const { estimateTokens, trimEntriesToTokenBudget } = tk;
  console.log('Tokenizer module loaded:', !!estimateTokens);
  const sample = 'This is a simple test sentence with several words to estimate tokens.';
  const t = estimateTokens(sample);
  console.log('Estimate tokens for sample:', t);
  if (t <= 0) throw new Error('estimateTokens returned non-positive');

  // test trimEntriesToTokenBudget
  const entries = [];
  for (let i = 0; i < 30; i++) entries.push({ text: 'entry number ' + i + ' ' + sample });
  const budget = 20; // tokens
  const res = trimEntriesToTokenBudget(entries, budget);
  console.log('Trim result:', res.removedCount, 'removed, tokenCount:', res.tokenCount);
  process.exit(0);
} catch (e) {
  console.error('Tokenizer test failed:', e);
  process.exit(2);
}
