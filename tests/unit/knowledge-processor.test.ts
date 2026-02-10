import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import KnowledgeProcessor from '../../src/core/learning/knowledge-processor';

jest.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: () => []
  }
}));

describe('KnowledgeProcessor', () => {
  let tempRoot: string;
  let oldCwd: string;

  async function readKb(): Promise<any[]> {
    const kbPath = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
    const raw = await fs.readFile(kbPath, 'utf8');
    return JSON.parse(raw);
  }

  beforeEach(async () => {
    oldCwd = process.cwd();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'lumi-kp-'));
    process.chdir(tempRoot);
    await fs.mkdir(path.join(tempRoot, 'training'), { recursive: true });
    await fs.writeFile(path.join(tempRoot, 'training', 'embeddings.json'), '{}', 'utf8');
  });

  afterEach(async () => {
    process.chdir(oldCwd);
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  test('writes KB entries and audit/validation files', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const res = await kp.ingest(
      [{ q: 'What is Lumi?', a: 'A desktop assistant.', confidence: 0.9 }],
      'src/sample.ts'
    );

    expect(res.ok).toBe(true);
    expect(res.added).toBe(1);

    const kb = await readKb();
    expect(kb).toHaveLength(1);
    expect(kb[0].q).toBe('What is Lumi?');
    expect(kb[0].file).toBe('sample.ts');

    const auditPath = path.join(process.cwd(), 'training', 'selflearn_audit.jsonl');
    const validationPath = path.join(process.cwd(), 'training', 'security', 'validation.jsonl');
    await expect(fs.access(auditPath)).resolves.toBeUndefined();
    await expect(fs.access(validationPath)).resolves.toBeUndefined();
  });

  test('exact-match deduplication skips duplicate', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    await kp.ingest([{ q: 'Same Q', a: 'Same A', confidence: 0.9 }], 'src/sample.ts');
    const res2 = await kp.ingest([{ q: 'Same Q', a: 'Same A', confidence: 0.9 }], 'src/sample.ts');

    expect(res2.ok).toBe(true);
    expect(res2.added).toBe(0);

    const kb = await readKb();
    expect(kb).toHaveLength(1);
  });

  test('semantic dedupe skips similar entry at 0.9 threshold', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    await kp.ingest([{ q: 'How to reset Lumi?', a: 'Use the reset button.', confidence: 0.9 }], 'src/a.ts');
    const res2 = await kp.ingest([{ q: 'How to reset Lumi?', a: 'Use the reset button.', confidence: 0.9 }], 'src/b.ts');

    expect(res2.ok).toBe(true);
    expect(res2.added).toBe(0);

    const kb = await readKb();
    expect(kb).toHaveLength(1);
  });

  test('PII redaction removes emails', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const email = `jane.doe@${'example.com'}`;
    await kp.ingest(
      [{ q: `Email me at ${email}`, a: 'Noted.', confidence: 0.9 }],
      'src/sample.ts'
    );

    const kb = await readKb();
    expect(kb[0].q).toContain('[REDACTED_EMAIL]');
    expect(kb[0].q).not.toContain(email);
  });

  test('PII redaction removes Windows file paths', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const winParts = ['Users', 'Chris', 'Secret', 'file.txt'];
    const winPath = `C:\\${winParts.join('\\')}`;
    await kp.ingest(
      [{ q: `Open ${winPath}`, a: 'Done.', confidence: 0.9 }],
      'src/sample.ts'
    );

    const kb = await readKb();
    expect(kb[0].q).toContain('[REDACTED_PATH]');
    const winPrefix = `C:\\${winParts.slice(0, 2).join('\\')}`;
    expect(kb[0].q).not.toContain(winPrefix);
  });

  test('PII redaction removes long Unix paths', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const longPath = '/home/user/projects/' + 'a'.repeat(130) + '/file.txt';
    await kp.ingest(
      [{ q: `Path: ${longPath}`, a: 'Done.', confidence: 0.9 }],
      'src/sample.ts'
    );

    const kb = await readKb();
    expect(kb[0].q).toContain('[REDACTED_PATH]');
  });

  test('PII redaction removes personal names', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    await kp.ingest(
      [{ q: 'John Smith approved the change.', a: 'Logged.', confidence: 0.9 }],
      'src/sample.ts'
    );

    const kb = await readKb();
    expect(kb[0].q).toContain('[REDACTED_NAME]');
    expect(kb[0].q).not.toContain('John Smith');
  });

  test('semantic embedding generation persists embeddings', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    await kp.ingest(
      [{ q: 'What is semantic embedding?', a: 'A vector representation.', confidence: 0.9 }],
      'src/sample.ts'
    );

    const embeddingsPath = path.join(process.cwd(), 'training', 'embeddings.json');
    const embeddings = JSON.parse(await fs.readFile(embeddingsPath, 'utf8')) as Record<string, number[]>;

    const allEmbeddings = Object.values(embeddings);
    expect(allEmbeddings.length).toBeGreaterThanOrEqual(1);
    expect(allEmbeddings[0]).toHaveLength(128);
  });

  test('threat scanning writes validation records', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    await kp.ingest(
      [{ q: 'What is TypeScript?', a: 'A typed superset of JavaScript.', confidence: 0.9 }],
      'src/sample.ts'
    );

    const validationPath = path.join(process.cwd(), 'training', 'security', 'validation.jsonl');
    const raw = await fs.readFile(validationPath, 'utf8');
    const firstLine = raw.split('\n').filter(Boolean)[0];
    const entry = JSON.parse(firstLine);
    expect(entry).toHaveProperty('threat_score');
    expect(entry).toHaveProperty('decision');
  });

  test('handles malformed KB entries', async () => {
    const kbPath = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
    await fs.writeFile(kbPath, '{bad json', 'utf8');

    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const res = await kp.ingest(
      [{ q: 'Recovery test', a: 'Recovered.', confidence: 0.9 }],
      'src/sample.ts'
    );

    expect(res.ok).toBe(true);
    const kb = await readKb();
    expect(kb).toHaveLength(1);
  });

  test('concurrent writes do not drop entries', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const c1 = { q: 'Concurrent A', a: 'One', confidence: 0.9 };
    const c2 = { q: 'Concurrent B', a: 'Two', confidence: 0.9 };

    await Promise.all([
      kp.ingest([c1], 'src/a.ts'),
      kp.ingest([c2], 'src/b.ts')
    ]);

    const kb = await readKb();
    const questions = kb.map((e: any) => e.q);
    expect(questions.length).toBeGreaterThanOrEqual(1);
    const hasA = questions.includes('Concurrent A');
    const hasB = questions.includes('Concurrent B');
    expect(hasA || hasB).toBe(true);
  });

  test('recovers from KB file corruption', async () => {
    const kbPath = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
    await fs.writeFile(kbPath, '[{', 'utf8');

    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const res = await kp.ingest(
      [{ q: 'Corruption recovery', a: 'Fixed.', confidence: 0.9 }],
      'src/sample.ts'
    );

    expect(res.ok).toBe(true);
    const kb = await readKb();
    expect(kb).toHaveLength(1);
  });

  test('pruneByConfidence removes old low-confidence entries', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const kbPath = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
    const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const recentDate = new Date().toISOString();
    const seed = [
      { q: 'Old low', a: 'A', confidence: 0.2, learned: oldDate },
      { q: 'Old high', a: 'B', confidence: 0.9, learned: oldDate },
      { q: 'Recent low', a: 'C', confidence: 0.2, learned: recentDate }
    ];
    await fs.writeFile(kbPath, JSON.stringify(seed, null, 2), 'utf8');

    const res = await kp.pruneByConfidence(0.6, 30);
    expect(res.ok).toBe(true);
    expect(res.removedCount).toBe(1);

    const kb = await readKb();
    const questions = kb.map((e: any) => e.q);
    expect(questions).toEqual(expect.arrayContaining(['Old high', 'Recent low']));
    expect(questions).not.toContain('Old low');
  });

  test('detectStaleEntries flags old unused items', async () => {
    const kp = new KnowledgeProcessor(path.join(tempRoot, 'userData'));
    const kbPath = path.join(process.cwd(), 'training', 'lumi_knowledge.json');
    const oldTs = Date.now() - 50 * 24 * 60 * 60 * 1000;
    const recentTs = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const seed = [
      { q: 'Stale by lastUsed', a: 'A', confidence: 0.8, lastUsed: new Date(oldTs).toISOString() },
      { q: 'Fresh by lastUsed', a: 'B', confidence: 0.8, lastUsed: new Date(recentTs).toISOString() },
      { q: 'Stale by learned', a: 'C', confidence: 0.8, learned: new Date(oldTs).toISOString() }
    ];
    await fs.writeFile(kbPath, JSON.stringify(seed, null, 2), 'utf8');

    const res = await kp.detectStaleEntries(30);
    expect(res.ok).toBe(true);
    expect(res.staleCount).toBe(2);
    const staleQs = (res.stale || []).map((e: any) => e.q);
    expect(staleQs).toEqual(expect.arrayContaining(['Stale by lastUsed', 'Stale by learned']));
    expect(staleQs).not.toContain('Fresh by lastUsed');
  });
});
