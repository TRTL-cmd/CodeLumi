import KnowledgeProcessor from '../src/core/learning/knowledge-processor';

// Simple smoke test stub — run with your test runner after TS setup.
async function smoke() {
  const tmp = './userData_test';
  const kp = new KnowledgeProcessor(tmp);
  const cand = [{ q: 'What does function X do?', a: 'It computes Y', confidence: 0.9 }];
  const res = await kp.ingest(cand, 'src/example/file.ts');
  console.log('Smoke ingest result:', res);
}

if (require.main === module) {
  smoke().catch(e => { console.error(e); process.exit(1); });
}
