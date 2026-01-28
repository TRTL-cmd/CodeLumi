 # Brain Roadmap — High-level (started 2026-01-28)

 Goal
 - Build a self-hosted, privacy-first pipeline for embeddings, vector search, and iterative model improvement for Lumi Desktop. Priorities: user privacy, reproducible training, modest infra cost, and safe incremental learning from curated user approvals.

 Phases

 Phase 1 — Local-first embeddings & vector store (MVP)
 - Deliverables:
	 - Embedding extractor module (local or optional remote): `src/core/embeddings/` with pluggable backends (OpenAI/CLI, local LLM embedder, or CPU fallback).
	 - On-disk vector store: embedded product using SQLite + FAISS (or Annoy) adapter under `userData/embeddings/` and SDK plumbing `src/core/vecdb/adapter.ts`.
	 - Import/export tooling: deterministic JSONL export of embeddings + metadata for reproducible offline training and safe sharing.
	 - Retrieval API: simple k-NN search with MMR (diversity) and recency weighting; integrated into `KnowledgeProcessor`.
 - Success criteria:
	 - End-to-end flow: new documents → embeddings → stored vectors → retrieval used by assistant proposals.
	 - Unit tests for vector store and retrieval correctness.

 Phase 2 — Curated self-learn pipeline + dedupe and quarantine
 - Deliverables:
	 - Curator UI for grouped duplicates and per-group apply/reject (already started in per-group apply UI).
	 - Quarantine/staging improvements: `appendStagingUnique()` (already implemented) with smarter fuzzy dedupe and TTL-based pruning.
	 - Curator review queue persisted in `userData/self-learn/curator_queue.jsonl` with metadata for provenance, confidence, timestamps, and origin.
	 - Safe-apply worker that applies curated changes atomically to `training/lumi_knowledge.json` with a replace-or-merge strategy and audit log.
 - Success criteria:
	 - Curator workflow allows approving only high-quality proposals; false-accepts < 1% on sampled tests.

 Phase 3 — Private retraining + evaluation harness
 - Deliverables:
	 - Local retraining harness (scripts/train_local.sh or `tools/train_local.py`) that can create fine-tuned models on user-approved pairs with restrictions (size caps, opt-in only).
	 - Offline evaluation suite: holdout split tooling, automatic metrics (ROUGE, BLEU, BLEURT if available), and human-sampled QA checks.
	 - Model versioning with checksums and storage in `userData/models/` and optional remote backup (user-controlled).
 - Success criteria:
	 - Re-train jobs reproduceable from exported artifacts; automated evaluation reports generated.

 Phase 4 — Scalable infra + optional cloud sync
 - Deliverables:
	 - Optional remote vector DB connector (Milvus/Weaviate) and sync tooling for users who opt into cloud sync.
	 - CI/PR pipeline checks that run `node scripts/privacy_audit.js` and `npm test` to prevent accidental absolute-path/PII commits.
	 - Backup/restore and export policies to ensure distribution builds do not include `userData/` contents.
 - Success criteria:
	 - Cloud sync is opt-in and encrypts user artifacts; packaged builds are free of `userData` artifacts.

 Cross-cutting requirements
 - Privacy & Safety:
	 - All persisted user artifacts must be sanitized by default (no absolute paths, emails redaction unless explicitly permitted), and core `KnowledgeProcessor` must apply sanitization on any write path.
	 - Audit logging for all apply/accept operations in `userData/audit/` with rollback hooks.
 - Testing & CI:
	 - Add unit tests for embedding adapters, retrieval ranking, dedupe heuristics, and privacy audit checks.
	 - CI job: `privacy-audit` that runs `node scripts/privacy_audit.js` on PRs and fails if any absolute paths or emails are found in tracked training files.
 - UX:
	 - Curator experience must minimize accidental accepts: show provenance, source text, similarity score, and a one-click apply with preview.

 Implementation notes & immediate next tasks (2026-01-28)
 - Wire embedding adapter interface: `src/core/embeddings/adapter.ts` (pluggable backends).
 - Implement lightweight on-disk vector adapter backed by SQLite + binary index (FAISS/Annoy fallback) under `src/core/vecdb/`.
 - Harden `KnowledgeProcessor` to always sanitize writes (already partially implemented — verify all code paths). Add unit tests.
 - Add a CI workflow to run `node scripts/privacy_audit.js` on PRs and enforce pre-commit husky checks added today.

 Risks & mitigations
 - Risk: accidental inclusion of absolute paths or PII in training artifacts — mitigations: pre-commit hook, CI privacy audit, and runtime sanitization.
 - Risk: local retraining may cause model degradation — mitigations: require curator approval, small incremental updates, and evaluation harness.

 Milestones (quarterly)
 - Q1: MVP embeddings + vector store, local retrieval integrated into assistant.
 - Q2: Curator UI + quarantine workflow + dedupe improvements.
 - Q3: Private retraining harness + evaluation suite.
 - Q4: Optional cloud sync connectors + CI protections + packaging readiness.

 If you'd like, I will now:
	- Create `src/core/embeddings/adapter.ts` and an initial `src/core/vecdb/sqlite-adapter.ts` (MVP implementation), or
	- Add the CI privacy-audit workflow to `.github/workflows/privacy-audit.yml` to run `node scripts/privacy_audit.js` on PRs.

 Choose one and I'll implement it next.
