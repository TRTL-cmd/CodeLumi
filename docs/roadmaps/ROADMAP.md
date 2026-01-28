Lumi Roadmap (snapshot: 2026-01-25)

Goal: ship a reliable local assistant that learns from interactions and can optionally aggregate patterns for centralized improvement.

Milestones

1) Local MVP (Core) — DONE / In progress
- Local KB (localStorage + userData file) — done
- Basic retrieval (TF/IDF + embedding reranker) — done
- Offline fallback + seed persona — done
- Signal detection + auto-merge pipeline — implemented (validation + merge)

2) Developer UX — In progress
- TypeScript alignment and editor diagnostics — fixed
- IPC bridge and preload APIs — done
- Metrics dashboard (basic) — done
- Learning toasts + mark-helpful UX — done

3) Quality & Curation — next
- Deduplication & merge heuristics (embedding + fuzzy) — planned
- Human review UI / review queue — planned
- Implicit feedback detectors (dwell, no-followup) — planned

4) Training & Retraining — planned
- Batch merge schedule (nightly) — planned
- Wire into `train_reranker.py` and reranker pipeline — planned
- Produce `reranker.joblib` updates and versioning — planned

5) Federated / Cloud Coordination — future
- Opt-in aggregation of anonymized patterns — future
- Central retraining and model distribution — future

Short-term roadmap (next 7 days)
Stopped tonight
- Work paused at: conservative auto-merge implemented; explicit `Mark helpful` flows working; exact-match dedup only.
- Reasons to pause: embedding dedup and review queue required before increasing auto-merge aggressiveness; developer time ended for the day.

Updated short-term roadmap (next 7 days)
1) Implement deduplication & merge metadata (embedding + fuzzy) — 2 days (high priority)
	- Goal: prevent paraphrase duplicates and capture `merged_from` provenance.
	- Deliverable: `src/core/learning/dedupe.ts` + unit tests; maintain `merged_from` array on merged entries.
2) Add Review Queue UI (staging) — 2 days (high priority)
	- Goal: provide curator workflow (accept/reject/annotate) for candidates before they become canonical.
	- Deliverable: `renderer/review.html` + IPC endpoints `lumi-review-list`, `lumi-review-act`.
3) Implicit feedback detectors & heuristics — 1 day (medium priority)
	- Goal: flag likely-accepted answers automatically (dwell/no-followup/quick-close heuristics).
	- Deliverable: simple detector module and logging to `training/training.jsonl` for review.
4) Nightly batch merge + retrain orchestration — 2 days (medium priority)
	- Goal: create scheduled job to merge staging-approved candidates and trigger `train_reranker.py` when enough data accumulates.
	- Deliverable: `scripts/nightly_merge_and_retrain.sh` or Node task with logging and versioned reranker artifacts.

How to prioritize (context)
- If we must choose one next task: implement deduplication first — it prevents new classes of errors and enables safe review/merge flows.
- Review queue is second: curators lower downstream noise and are essential if dedupe/merge will not be perfect immediately.

How to run dev (unchanged)

How to run (dev)

Start Ollama (if used):

```powershell
ollama serve
```

Start renderer/dev server and electron:

```powershell
npm run dev
npm run dev:electron
```

Notes
- Use `--user-data-dir` or `--disable-gpu` to avoid Chromium disk/gpu cache warnings in dev when running from synced folders (OneDrive)."