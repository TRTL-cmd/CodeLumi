# Benchmarks

This folder stores benchmark outputs produced by `scripts/benchmark.js`.

## Run

```
node scripts/benchmark.js
```

## Output

- `baseline.json` is generated/overwritten on each run.
- The script reports:
  - LLM response time (tokens/sec) using local Ollama if available.
  - KB search speed using the TF-IDF RAG retriever.
  - Merge decision accuracy on a small synthetic test set.
  - Memory usage during a short search workload.
  - Startup proxy based on KB index time (cold vs warm).
  - Self-learning rate from recent `selflearn_store.jsonl` entries.

If Ollama is not running or data files are missing, the related metrics are marked with `ok: false` and an error string.
