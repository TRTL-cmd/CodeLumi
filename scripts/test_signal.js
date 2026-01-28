const { extractSignalsFromText, extractSignalsFromEvent, scoreSignals } = require('../src/core/signal/detector');

function runTests() {
  const samples = [
    'Thanks, that fixed it! Great work.',
    'No, that is incorrect and does not handle edge cases.',
    'I copied the snippet to clipboard.',
    'All tests passed.',
    'Error: uncaught exception in test suite',
    'I updated the README and refactor some code.'
  ];

  for (const s of samples) {
    const signals = extractSignalsFromText(s);
    console.log('TEXT:', s);
    console.log('  signals ->', signals);
    console.log('  scores ->', scoreSignals(signals));
  }

  const events = [
    {type: 'copy', payload: 'file://path/to/snippet'},
    {type: 'user_feedback', payload: 'positive'},
    {type: 'user_feedback', payload: 'negative'},
    {type: 'test_result', payload: {passed: true}},
    {type: 'test_result', payload: {passed: false}},
    {type: 'file_change', payload: {reason: 'manual'}}
  ];

  for (const e of events) {
    const signals = extractSignalsFromEvent(e);
    console.log('EVENT:', e.type, e.payload);
    console.log('  signals ->', signals);
    console.log('  scores ->', scoreSignals(signals));
  }
}

try {
  runTests();
  console.log('Signal detector test completed.');
  process.exit(0);
} catch (err) {
  console.error('Test failed:', err);
  process.exit(2);
}
