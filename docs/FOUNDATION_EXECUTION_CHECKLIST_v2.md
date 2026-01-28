# LUMI: COMPLETE EXECUTION CHECKLIST (VERSION 2.0)

Date: 2026-01-24 (provided)

This file is a workspace copy of the detailed multi-week/month execution checklist provided by the developer. It captures the plan for Phase 0..Phase 5 and ongoing routines.

NOTE: The original checklist is extensive and lives in the issue/planning notes. This file mirrors it so it is version-controlled and easy to reference.

---

(Checklist content abbreviated here. See the in-repo logs for the full copy.)

Key items copied into the repo:

- `src/core/learning/processor.ts` — processes high-confidence signals into candidate KB updates; minimal append-to-training implementation included.
- `src/core/learning/extractor.ts` — extracts candidate Q/A pairs from signals or memory entries.
- `src/core/learning/validator.ts` — validates candidate quality and runs simple PII heuristics.


Next actions (recommended) — updated 2026-01-25 (work stopped tonight)

Status snapshot
- Completed today:
	- Learning scaffolds (`processor.ts`, `extractor.ts`, `validator.ts`) implemented and wired into `Brain` call sites.
	- Simple `updateKB()` auto-merge implemented with exact-match dedupe and `training/training.jsonl` audit logging.
	- Renderer UX for acceptance (`Mark helpful`) implemented and hooked to `lumi-log-assistant`.

- Paused/Not implemented (critical before aggressive auto-merge):
	- Embedding or fuzzy deduplication (paraphrase detection).
	- Human review queue UI (staging/approve/deny flows).
	- Batch merge orchestration + retraining pipeline integration.

Immediate next actions (high confidence)

1) Deduplication & provenance metadata (2 days)
	 - Implement `src/core/learning/dedupe.ts` which provides:
		 - `findNearDuplicates(candidate, kbEntries) -> [{matchId,score}]`
		 - `mergeCandidate(candidate, matches) -> mergedEntry` that populates `merged_from` with `{id,score}` and timestamps.
	 - Add tests using representative paraphrase sets (use `training/fixtures/paraphrases.jsonl`).

2) Human review queue (2 days)
	 - Staging area: write new candidates to `training/staging.jsonl` instead of direct canonical merge.
	 - Add renderer review UI (`renderer/review.html` or React component) to list staging entries with accept/reject/annotate actions.
	 - IPC endpoints: `lumi-review-list`, `lumi-review-act` to fetch and apply curator decisions.

3) Implicit feedback detectors (1 day)
	 - Implement heuristics: no-followup window (X minutes), long dwell on reply, quick-close event.
	 - Log implicit signals to `training/training.jsonl` for review and potential auto-accept rules.

4) Nightly merge + retrain pipeline (2 days)
	 - Create `scripts/nightly_merge.js` to run on a scheduler (or GitHub Actions locally) to:
		 - Load staging entries, dedupe/merge with KB, write canonical updates and `merged_from` metadata.
		 - Trigger `train_reranker.py` with new positive/negative samples and write a new `reranker.joblib` artifact.

Operational notes
- Until dedupe+review are in place, keep merge thresholds conservative and require explicit `Mark helpful` for automatic canonical inserts.
- Keep `training/training.jsonl` as the single audit log — every candidate and every curator decision must be append-only and timestamped.

Acceptance criteria for 'done' on this checklist
- Deduplication reduces paraphrase duplicates by >90% on synthetic paraphrase test set.
- Review UI allows curator to process at least 200 staging entries/hour in the UI mock.
- Nightly merge completes without data loss and retriggering training produces a new `reranker.joblib` in `models/` (or `models/retrains/` with version tags).

