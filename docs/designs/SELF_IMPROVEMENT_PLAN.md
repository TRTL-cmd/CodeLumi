# Self-Improvement & Safe Self-Modification Plan — Lumi (Draft)

Purpose
- Provide a practical, auditable, and safety-first roadmap to enable Lumi to propose, test, and (optionally) apply improvements to her own code and configuration while preserving user control, privacy, and reversibility.
- Focus on an incremental prototype that emphasizes simulation, rigorous testing, and staged automation (human-in-loop → supervised automation → opt-in autonomous modes).

Scope
- Covers the end-to-end pipeline: proposal generation (what to change), patch generation (diffs/PRs), simulation & testing (dry-run in sandbox), CI gating (validation), audit/backup, and controlled application (merge/commit/rollback).
- Excludes: any non-reversible or privileged changes unless explicitly approved by a human and subject to strict policy checks.

High-level Goals
1. Allow Lumi to identify areas for improvement (tests failing, performance hotspots, refactor suggestions).
2. Let Lumi propose minimal, well-scoped patches expressed as diffs or PRs.
3. Provide a safe test harness that runs proposals in an isolated environment and produces deterministic test results and artifacts.
4. Produce human-reviewable audit artifacts and an easy revert path for any applied change.
5. Iteratively reduce human overhead under strict safety signals and measurable improvement.

Key Principles
- Conservative by default: everything starts as a proposal and dry-run. No automatic code mutations in user environment without explicit policy and opt-in.
- Small, testable patches: prefer many small, atomic changes with clear test coverage rather than large sweeping edits.
- Reproducible test harness: all tests run in isolated, reproducible environments (container images or dedicated runners).
- Audit & provenance: every proposal includes the prompt, model version, confidence, change diff, expected effects, and test outputs.
- Revertability: backups and diffs stored and signed so any applied change can be reverted with a single command.

Architecture Overview

Components:
- Proposal Generator (PG): identifies candidate improvements and generates a human-readable plan + patch.
- Patch Synthesizer (PS): converts plan into a focused diff/PR with tests or test updates when required.
- Simulator/Test Runner (STR): executes the patch in a lightweight sandbox (JS VM) and heavy sandbox (container) to run unit/integration tests.
- Policy Engine (PE): evaluates risk, sensitive paths, secrets, and gating rules; returns required consent levels.
- Autonomy Controller (AC): schedules self-improvement tasks, enforces throttles, and records activity; supports manual/automatic modes.
- Executor (EX): applies approved changes (creates backups, writes files, and records audits) or publishes PRs to remote repo.
- CI Gate (CI): separate runner(s) that validate patch across platforms and produce signed artifacts.
- Audit Store (AS): file-backed JSONL store for all proposals, decisions, tests, and backups (use `src/core/memory/store.ts` + `userData/backups`).

Data Flows (summary):
1. PG discovers issue or improvement opportunity.
2. PG creates Plan + rationale and calls PS to produce diff/patch.
3. PS stores patch and calls STR to simulate and run tests in sandboxes.
4. STR returns results; PE evaluates risk and required consents.
5. If risk low and user-configured auto-apply allowed, AC may queue for CI Gate; otherwise produce a PR and request human review.
6. Once approved, EX applies patch (or merges PR), produces backups, signs audit record, and monitors post-change telemetry.

Prototype: Minimal Safe Workflow (MVP)
Phase 0 — Visibility & Proposals
- Task: Implement PG that scans codebase for low-risk suggestions (typo fixes, missing docstrings, lint fixes).
- Output: structured proposals with a one-line summary, diff, rationale, and suggested test(s).

Phase 1 — Patch Synth + Dry-Run
- Task: Implement PS that writes patch to ephemeral workspace and STR that runs unit tests in a JS VM (no FS/Network) for quick validation.
- Output: test logs, coverage diffs, and a dry-run report stored in AS.

Phase 2 — Heavy Validation & CI
- Task: Run approved patches in containers with full test matrix via CI Gate; produce signed artifacts if tests pass.
- Output: signed validation artifact plus a candidate PR (or local apply if policy allows).

Phase 3 — Controlled Apply & Monitor
- Task: Apply changes to user workspace only after explicit consent or after passing strict automated policy and health checks; create backups and enable revert shortcut.
- Output: applied patch, audit entry, and automated monitoring for regressions (alerts/logs).

Safety Controls & Policy Engine
- Path Whitelists/Blacklists: prevent edits to system files, credentials, or configured sensitive directories.
- Secret Detection: scan diffs and patch context for tokens, keys, passwords; block auto-apply if present.
- Risk Scoring: compute a numeric risk based on action type, modified files, test coverage, and presence of external execution. Map to gating rules.
- Consent Levels:
  - Level 0: informational (no code change) — auto-logged.
  - Level 1: low-risk (lint, docs) — optional auto-apply with user opt-in preference.
  - Level 2: medium-risk (logic changes, file writes) — require human approval or 2-step auto-apply with CI signed artifact.
  - Level 3: high/critical (run commands, privileged file changes) — manual approval only.

Testing & CI Integration
- Local STR runs quick tests in JS VM; CI Gate runs full test matrix in container runners.
- For reproducibility, use base container images pinned by digest and record environment metadata in AS.
- If tests produce flakiness, mark proposals as needing manual triage.

Backup & Revert Strategy
- For each applied patch: store pre-change snapshot (full file for binary or unified diff for text) under `userData/backups/<timestamp>/<plan-id>`.
- Create an audit record linking patch -> backups -> signatures -> appliedBy.
- Provide `lumi revert <plan-id>` CLI that restores snapshots and records revert action in AS.

Human-in-the-Loop UX
- Proposal card: summary, rationale, diff preview, affected files, tests run, risk score, and required consent.
- Actions: Accept (apply), Create PR, Edit proposal, Reject, or Defer.
- For auto-apply flows, UI shows upcoming scheduled merges and allows cancellation before apply window.

Metrics & Monitoring
- Proposal success rate (accepted/merged vs. rejected)
- Post-apply regression rate (failures traced to applied proposals)
- Mean time to revert
- Number of auto-applies vs manual applies
- Audit volume and size of backups

Research Agenda & Open Problems
- Automatic test generation quality: generating meaningful unit tests for proposed logic changes.
- Safe code synthesis: minimizing hallucinations and ensuring syntactic+semantic correctness.
- Self-evaluation: building robust metrics that reliably predict whether a patch improves correctness.
- Long-term: mechanisms for online continual learning without catastrophic forgetting or data leakage.

Ethics & Governance
- Default: opt-in for any training data export; explicit consent required for any telemetry sent off-device.
- Provide a clear privacy policy and explain what is stored locally vs what is shareable for improving central models.
- Maintain a local-only mode where no artifacts leave the user's machine.

Timeline & Next Steps (practical)
- Day 0–2: Create `SELF_IMPROVEMENT_PLAN.md` (this file), add proposal generator skeleton, and design patch format.
- Day 3–7: Implement PS + STR (ephemeral workspace, JS VM dry-run) and store results in AS.
- Week 2: Wire simple UI for proposals and reviews; implement backup/revert primitives.
- Week 3–4: Add CI Gate integration and signed artifact production; conduct limited internal tests.
- Month 2+: Extend to larger changes, add automated monitoring, and consider supervised auto-apply experiments behind feature flags.

Immediate actions I will take if you confirm:
1. Scaffold `src/brain/proposal_generator.ts` (skeleton) and `src/brain/executor_stub.ts` for dry-run flows.
2. Add a small STR test harness that runs unit tests inside a VM-based sandbox and records outputs to AS.
3. Add policy engine checks for sensitive paths and secrets.

Notes/Constraints
- This plan favors safety and reversibility; full autonomous self-modification is staged and gated.
- Achieving truly autonomous, reliable self-improvement is research-grade work—expect iterative cycles, human oversight, and rigorous testing.

