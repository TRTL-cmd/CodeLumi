const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'benchmarks');
const OUT_FILE = path.join(OUT_DIR, 'baseline.json');

function nowMs() {
  return performance.now();
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function toMb(bytes) {
  return round2(bytes / (1024 * 1024));
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function measureOllama() {
  try {
    const { OllamaClient } = require(path.join(ROOT, 'dist-electron', 'core', 'llm', 'ollama.js'));
    const client = new OllamaClient();
    const available = await client.isAvailable();
    if (!available) {
      return { ok: false, error: 'ollama_unavailable' };
    }

    const prompt = 'Explain how to reverse a string in JavaScript in one sentence.';
    const start = nowMs();
    const response = await client.generate(prompt, { num_predict: 128 });
    const durationMs = nowMs() - start;
    const tokenCount = estimateTokens(response);
    const tokensPerSec = durationMs > 0 ? tokenCount / (durationMs / 1000) : 0;

    return {
      ok: true,
      model: client.model,
      durationMs: round2(durationMs),
      tokenCount,
      tokensPerSec: round2(tokensPerSec)
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function measureKbSearch() {
  try {
    const rag = require(path.join(ROOT, 'dist-electron', 'core', 'rag', 'rag-retriever.js'));
    const indexStart = nowMs();
    const indexRes = await rag.indexKnowledge(ROOT);
    const indexMs = nowMs() - indexStart;

    const queries = [
      'self learning',
      'knowledge base',
      'security curator',
      'ollama connection',
      'code sandbox',
      'memory store',
      'onboarding wizard',
      'performance benchmark',
      'privacy audit',
      'auto merge'
    ];

    const iterations = 50;
    const searchStart = nowMs();
    for (let i = 0; i < iterations; i += 1) {
      const query = queries[i % queries.length];
      // eslint-disable-next-line no-await-in-loop
      await rag.searchKnowledge(query, 5);
    }
    const totalSearchMs = nowMs() - searchStart;

    const avgSearchMs = iterations > 0 ? totalSearchMs / iterations : 0;
    const queriesPerSec = totalSearchMs > 0 ? iterations / (totalSearchMs / 1000) : 0;

    const warmStart = nowMs();
    const warmRes = await rag.indexKnowledge(ROOT);
    const warmIndexMs = nowMs() - warmStart;

    return {
      ok: true,
      indexed: indexRes && typeof indexRes.indexed === 'number' ? indexRes.indexed : null,
      indexMs: round2(indexMs),
      warmIndexMs: round2(warmIndexMs),
      avgSearchMs: round2(avgSearchMs),
      queriesPerSec: round2(queriesPerSec),
      warmIndexed: warmRes && typeof warmRes.indexed === 'number' ? warmRes.indexed : null
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function measureMergeAccuracy() {
  try {
    const Threat = require(path.join(ROOT, 'dist-electron', 'security', 'threat_detection.js'));

    const cases = [
      { q: 'How to sort an array in JavaScript?', a: 'Use array.sort() with a compare function.', confidence: 0.95, expected: 'auto_merge' },
      { q: 'How to delete system files?', a: 'Run rm -rf / to delete everything.', confidence: 0.92, expected: 'quarantine' },
      { q: 'How to make an HTTP request?', a: 'Use fetch with a GET request.', confidence: 0.9, expected: 'auto_merge' },
      { q: 'How to bypass login?', a: 'Edit the database directly to set admin.', confidence: 0.95, expected: 'quarantine' },
      { q: 'How to write a unit test?', a: 'Use Jest with expect assertions.', confidence: 0.88, expected: 'quarantine' }
    ];

    let correct = 0;
    const results = cases.map((testCase) => {
      const scan = Threat.scanQA(testCase.q, testCase.a);
      const shouldAutoMerge = (scan.score || 0) < 10 && (testCase.confidence || 0) >= 0.9 && !scan.suspicious;
      const decision = shouldAutoMerge ? 'auto_merge' : 'quarantine';
      if (decision === testCase.expected) correct += 1;
      return {
        expected: testCase.expected,
        decision,
        threatScore: scan.score,
        suspicious: scan.suspicious
      };
    });

    const accuracy = cases.length ? (correct / cases.length) * 100 : 0;

    return {
      ok: true,
      totalCases: cases.length,
      correct,
      accuracyPct: round2(accuracy),
      results
    };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function measureMemoryUsage(workload) {
  const samples = [];
  samples.push(process.memoryUsage());
  const timer = setInterval(() => {
    samples.push(process.memoryUsage());
  }, 250);

  try {
    await workload();
  } finally {
    clearInterval(timer);
  }

  const peak = samples.reduce(
    (acc, sample) => {
      if (!sample) return acc;
      acc.rss = Math.max(acc.rss, sample.rss || 0);
      acc.heapUsed = Math.max(acc.heapUsed, sample.heapUsed || 0);
      acc.heapTotal = Math.max(acc.heapTotal, sample.heapTotal || 0);
      return acc;
    },
    { rss: 0, heapUsed: 0, heapTotal: 0 }
  );

  const endSample = process.memoryUsage();
  samples.push(endSample);

  return {
    ok: true,
    endRssMb: toMb(endSample.rss),
    endHeapUsedMb: toMb(endSample.heapUsed),
    peakRssMb: toMb(peak.rss),
    peakHeapUsedMb: toMb(peak.heapUsed),
    sampleCount: samples.length
  };
}

async function measureSelfLearnRate() {
  const candidates = [
    path.join(ROOT, 'training', 'self-learn', 'selflearn_store.jsonl'),
    path.join(ROOT, 'training', 'selflearn_store.jsonl'),
    path.join(ROOT, 'userData', 'self-learn', 'selflearn_store.jsonl')
  ];

  let filePath = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      filePath = candidate;
      break;
    }
  }

  if (!filePath) {
    return { ok: false, error: 'selflearn_store_not_found' };
  }

  const raw = await fs.promises.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  let recent = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const ts = entry.timestamp || entry.ts || entry.date || entry.learned;
      const t = typeof ts === 'number' ? ts : Date.parse(ts);
      if (!Number.isNaN(t) && now - t <= windowMs) {
        recent += 1;
      }
    } catch (_err) {
      // skip malformed lines
    }
  }

  return {
    ok: true,
    filePath: path.relative(ROOT, filePath),
    entries24h: recent,
    entriesPerHour: round2(recent / 24)
  };
}

async function runBenchmarks() {
  const system = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cpuCount: os.cpus() ? os.cpus().length : null,
    totalMemoryGb: round2(os.totalmem() / (1024 * 1024 * 1024))
  };

  const llm = await measureOllama();
  const kb = await measureKbSearch();

  const memory = await measureMemoryUsage(async () => {
    try {
      if (kb.ok) {
        const rag = require(path.join(ROOT, 'dist-electron', 'core', 'rag', 'rag-retriever.js'));
        for (let i = 0; i < 100; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await rag.searchKnowledge('memory usage benchmark', 5);
        }
      }
    } catch (_err) {
      // ignore workload errors
    }
  });

  const mergeAccuracy = await measureMergeAccuracy();
  const selfLearn = await measureSelfLearnRate();

  return {
    generatedAt: new Date().toISOString(),
    system,
    benchmarks: {
      llmResponse: llm,
      kbSearch: kb,
      mergeAccuracy,
      memoryUsage: memory,
      startupProxy: kb.ok ? { coldIndexMs: kb.indexMs, warmIndexMs: kb.warmIndexMs } : { ok: false, error: 'kb_index_unavailable' },
      selfLearningRate: selfLearn
    }
  };
}

async function main() {
  await ensureDir(OUT_DIR);
  const results = await runBenchmarks();
  await fs.promises.writeFile(OUT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log('Benchmarks complete:', OUT_FILE);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exitCode = 1;
});
