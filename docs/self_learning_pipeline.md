# Self-Learning Pipeline for CodeLumi

Purpose
- Define a safe, auditable, and incremental pipeline for CodeLumi to learn from user interactions, KB usage, memory entries, and other sources.
- Ensure human-in-the-loop (HITL) gateways, strict validation, versioning, and rollback to prevent accidental model drift or data poisoning.

Principles
- Safety-first: require human review for any data used to change KB distribution or retrain models.
- Traceability: every candidate item must include provenance (source file, timestamp, original assistant output, user signal/feedback).
- Incremental: prefer small, frequent retraining or re-ranking updates in controlled batches.
- Testable: require automated evaluation on held-out QA and human spot-checks before deployment.
- Reversible: versioned artifacts and an easy rollback path.

Key Components
1. Data Sources
  - `training/*.jsonl` and `training/*.json`: canonical KB/training artifacts.
  - `userData/lumi_memory.jsonl`: user interactions and memory entries.
  - `userData/kb_usage.jsonl`: records of KB hits used in responses.
  - Signal detector outputs: `src/core/signal/detector.js` signals (positive/negative/feedback).
  - Executor audit logs: any state changes attempted/executed by executor.

2. Candidate Extraction
  - Periodically (daily or weekly), run a job to extract high-quality candidates from memory and KB usage where:
    - A user provided *positive_feedback* signal, or
    - A KB hit was used repeatedly and accepted by the user, or
    - A memory entry has high-frequency relevance to queries.
  - Produce `candidates/YYYY-MM-DD.jsonl` with fields:
    - `id`, `source`, `timestamp`, `query`, `assistant_output`, `user_feedback`, `confidence_metrics` (BM25 score, reranker score if available), `author`.

3. Automated Filtering
  - Reject candidates that:
    - Contain PII/Sensitive content as detected by a content-safety scanner.
    - Are short/uninformative (< 50 chars or fewer than X tokens).
    - Appear to be hallucinations (no provenance or contradictory assertions) — flagged for human review.
  - Enrich candidates with metadata: token counts, passage context, proximate memory entries.

4. Human Review (HITL)
  - A simple review UI (or Git-friendly PR) where human reviewers can `accept`, `reject`, `edit`, or `flag` candidates.
  - Review checklist includes:
    - Factuality check & source citation.
    - Non-PII and non-sensitive confirmation.
    - Clarity and canonicalization (question/answer normalization).
  - Accepted candidates are moved to `staging_kb/YYYY-MM-DD/accepted.jsonl`.

5. Validation Suite
  - Before adding to production KB or retraining, run automated tests:
    - Run accepted candidates through the reranker and compare score distributions.
    - Evaluate against a holdout evaluation dataset (accuracy, precision@k, MRR) and a small human-annotated sample.
    - Run integration tests (think(), thinkChat()) to verify no regressions in prompt formatting or system messages.

6. Versioning & Deployment
  - All KB snapshots are versioned with semantic timestamps: `kb_snapshot_YYYYMMDD_HHMM.jsonl`.
  - Retraining jobs (reranker or other models) are run in isolated environments and output a candidate model `reranker.joblib.v{semver}`.
  - Deploy with a staged rollout: `canary` → `beta` → `prod`. Each stage has traffic splitting and monitoring.
  - Keep old models and KB snapshots for immediate rollback.

7. Monitoring & Telemetry
  - Track: `kb_usage.jsonl`, model drift metrics (score distribution drift), query coverage, memory growth, and user feedback signals.
  - Alert on anomalies: sudden drop in reranker scores, rapid rise in rejected candidates, or increase in negative feedback.

8. Retraining Cadence & Policies
  - Reranker: retrain monthly or when candidate volume reaches X new accepted items (configurable).
  - KB snapshot updates: apply incremental accepted changes weekly after pass/fail metrics are green.
  - Emergency hotfixes allowed via small accepted PRs with 2 reviewers.

9. Security & Privacy
  - Scan all candidate data for PII and redact or discard candidate entries with detected PII.
  - Ensure storage access to `userData/` and `training/` is restricted and audited.

10. Rollback & Recovery
  - Maintain a deployment registry: models → KB snapshot mappings.
  - Rolling back involves: revert to previous KB snapshot and previous reranker artifact, then run smoke tests.

11. Minimal Implementation Plan (MVP)
  - Step 1: Candidate extractor job (daily cron) that writes `candidates/` JSONL.
  - Step 2: Simple review UI or Git PR process for human accept/reject (could be manual for MVP).
  - Step 3: Staging KB snapshot generator and validation tests.
  - Step 4: Versioned deployment and canary release for reranker.

12. Recommended Tooling & Paths
  - Candidate extractor: `scripts/extract_candidates.js` (Node) reading `userData/lumi_memory.jsonl` and `userData/kb_usage.jsonl`.
  - Review flow: Git-based PRs under `training/staging/` or a tiny Express UI at `tools/review-ui`.
  - Retraining: `scripts/train_reranker.py` (already present; extend to accept `staging_kb/`).
  - Model artifacts: `models/reranker.joblib` with version suffixes.

13. Acceptance Criteria
  - Each accepted candidate has provenance + human reviewer signature.
  - Retrained reranker improves precision@10 on validation set or preserves baseline within tolerance.
  - No PII present in accepted KB entries.

14. Next Steps (short-term)
  - Implement `scripts/extract_candidates.js` to produce candidates for review.
  - Create `training/staging/` and `staging_kb/` folders with a PR process.
  - Add a small manual review checklist and onboarding doc for reviewers.

Appendix: Example candidate JSONL entry
{
  "id": "candidate-20260124-0001",
  "source": "user_memory",
  "timestamp": "2026-01-24T12:03:00Z",
  "query": "How to reset CodeLumi settings?",
  "assistant_output": "To reset CodeLumi, open settings → advanced → reset...",
  "user_feedback": "positive_feedback",
  "confidence_metrics": {"bm25": 3.21, "reranker": 0.58},
  "author": "codelumi-system"
}


---
Document created: 2026-01-24
Reviewer: TBD

