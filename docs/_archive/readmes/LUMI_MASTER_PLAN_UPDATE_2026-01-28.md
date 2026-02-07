# LUMI MASTER PLAN - Production Snapshot

**Date:** 2026-01-28
**Snapshot:** Phase 1 (near-complete) — autonomous learning live, privacy-first

---

## 1) One-line summary

Lumi now runs a production-grade, local autonomous learning pipeline that learns from a developer's codebase, extracts Q&A and suggestions, persistently stores knowledge, enforces privacy redaction at write-time, and provides a conservative autonomy / execution scaffold. Key safety, governance, and CI checks are in place.

## 2) Production capabilities (current)

- Autonomous learning: local scanner + Ollama analyses producing KB entries and suggestions (running at ~10–12 entries/hour).
- KnowledgeProcessor: validation, confidence scoring, deduplication and PII redaction applied before persistence.
- Single-active PersonalityManager: only the main process may change tone/persona; renderer is read-only.
- Staging dedupe: `appendStagingUnique()` prevents repeated quarantined candidates.
- Privacy audit & redaction pipeline: `scripts/privacy_audit.js` and `scripts/redact_audit_findings.js` executed; findings remediated with timestamped backups.
- Commit- and CI-level safeguards: `.husky/pre-commit` path checks block absolute Windows/UNC paths; `.github/workflows/privacy-audit.yml` runs audits on PRs.
- Tests & build: TypeScript compile and unit tests (appendStagingUnique) passed locally.

## 3) Memory, persistence & KB behavior

- Primary artifact locations:
  - Training KB: `training/training.jsonl` and `training/lumi_knowledge.json` (canonical learning records)
  - Staging/quarantine: `training/staging.jsonl`
  - Runtime self-learn: `userData/self-learn/`
- Persistence semantics:
  - Knowledge entries are JSONL append-only with provenance (`id`, `source`, `file`, `confidence`, `timestamp`).
  - Deduplication performed during append (exact-match window + lookback) and a separate planned semantic-clustering pass.
  - Backups: every redaction or bulk operation creates a timestamped `.backup` and `.backup.redact.<ts>.bak` file (preserved until explicit final-redaction approval).

## 4) Privacy & security measures implemented

- Audit pipeline: `scripts/privacy_audit.js` scans for emails and absolute paths; outputs `docs/privacy_audit_results.json` and markdown reports.
- Targeted redaction: `scripts/redact_audit_findings.js` sanitizes flagged artifacts and writes timestamped backups.
- Pre-commit guard: `scripts/precommit_check_paths.js` + Husky prevents committing absolute paths or UNC shares.
- CI guard: `.github/workflows/privacy-audit.yml` runs the audit on PRs and fails the check on findings.
- Runtime protections: KnowledgeProcessor redacts PII during runtime writes; suspicious entries are quarantined for curator review.

## 5) Key engineering changes (where to look)

- PersonalityManager (single-author): `src/core/personality/manager.ts`
- IPC / preload read-only exposure: `src/preload.ts`
- Staging dedupe helper: `src/core/security/staging-utils.ts` (contains `appendStagingUnique`)
- Privacy scripts and audit: `scripts/privacy_audit.js`, `scripts/redact_training_kb.js`, `scripts/redact_audit_findings.js`
- Pre-commit / Husky: `.husky/pre-commit`, `scripts/precommit_check_paths.js`, `package.json` (`prepare` script)
- CI workflow: `.github/workflows/privacy-audit.yml`

## 6) Tests & verification

- TypeScript compile: `npx tsc` — clean (no errors).
- Unit test: `scripts/unit_test_appendStagingUnique.js` — passed locally.
- Interactive staging test: manual test triggering quarantined candidate & dedupe — verified.
- Privacy audit: run post-redaction; primary KB and runtime writes show no Windows absolute paths; limited backups still contain original paths (pending explicit final-redaction).

## 7) Operational notes & current blockers

- Backups: `.backup.redact.*.bak` files still contain original absolute paths by design (safe backups). If final irreversible redaction is required, we will run a final-pass redaction across backups (requires explicit approval).
- Nightly packaged-artifact audits: not yet scheduled — recommended to add CI job to scan packaged installers.
- Long-tail runtime logs: we recommend tailing app logs for 48–72 hours post-release to monitor anomalous learning or false positives.

## 8) Immediate next steps (recommended)

1. Approve or decline final redaction of `.backup.redact.*.bak` files (I can run this if you'd like).
2. Add nightly packaged-artifact privacy audit to CI (recommended).
3. Implement semantic dedupe (embedding-based clustering) to reduce duplicate knowledge entries (2–3 days).
4. Add packaging checks to ensure `userData/` isn't bundled with releases.
5. Tail app logs for 48 hours to confirm steady-state behavior.

## 9) Owner & contact

- Engineering lead: `Lumi Core` (repo owner). For help running redaction or CI changes, ask me and I will apply them.

---

Generated automatically by the workspace assistant on 2026-01-28.
