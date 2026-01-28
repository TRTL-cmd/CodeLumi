---
# Safety, Ethics & Sandboxing Plan — Comprehensive (2026-01-23)

Purpose
- Provide a thorough, actionable, and conservative plan to safely enable on-device automation, plan execution, and learning for Lumi's Brain while preserving user privacy, control, and reversibility. This document combines Safety, Ethics, Sandboxing, and Autonomy roadmap concerns into a single, developer-facing reference.

Scope
- Applies to any runtime component that executes or authorizes programmatic actions (the Brain planner, Executor, Autonomy Controller, retrainers, and any background jobs that may mutate files or communicate externally).
- Excludes: purely read-only analytics that run entirely locally unless the user opts into export.

Core Principles
- Consent-first: explicit, contextual consent for every potentially impactful action; consent must be informed (UI shows side-effects and options).
- Least privilege: prefer narrow, explicit action sets; deny-by-default for unknown or high-risk operations.
- Auditability & Provenance: every generated plan, simulated run, and executed step must be logged with provenance (model prompt, model version, confidence, user decision, timestamp, environment).
- Reversibility: every mutating action must produce an undo artifact (diff, patch, backup) and be reversible with a single user command where possible.
- Transparency & Explainability: present a human-readable plan preview, reasons for each step, and confidence/risks before execution.
- Opt-in, Minimally-Invasive Telemetry: only export data for training when users explicitly opt in; exports must be anonymized, sampled, and reviewable.

Threat Model (detailed)
- Accidental destructive writes: bad prompts or mistaken approval leading to data loss or corruption.
- Malicious model outputs: compromised or hallucinating LLM suggesting harmful commands.
- Privilege escalation: an executed process gains higher privileges or accesses sensitive parts of the system.
- Data exfiltration: plans that cause secrets to be transmitted or logged to external systems.
- Supply-chain attacks: executing downloaded artifacts or using third-party images without verification.

Risk Controls
1) Action Classification & Triage
  - Tag all potential actions with a risk level: LOW (read-only, UI-only), MEDIUM (file writes with backup), HIGH (execution of shell commands/network calls), CRITICAL (privileged operations, external data access).
  - Define mandatory gating per risk level: MEDIUM requires single-step confirmation + backup; HIGH requires per-step confirmation + sandbox + policy check; CRITICAL requires offline/manual approval.

2) Allowed Action Set (privileged list)
  - `readFile(path)` — read-only; must include checksum and detected sensitive patterns flag.
  - `listFiles(dir, opts)` — read-only listing; sandbox-limited path scope.
  - `writeFile(path, content, opts)` — requires backup, signed audit entry, and optional dry-run preview of diff.
  - `createKBEntry(entry)` — append-only local KB writes; no network.
  - `runCommand(cmd, opts)` — only allowed in heavy sandbox with whitelist and resource limits; returns structured result and logs.
  - `openURL(url, opts)` — requires preview and explicit confirmation; block redirects and auto-downloads.
  - `networkRequest(req)` — wrapper for controlled network egress; defaults to blocked unless allowed by policy.

3) Sandboxing Model
  - Lightweight sandbox (JS VM): for text processing, plan simulation, and verifier code. No filesystem or network access. Strict CPU and timeouts (e.g., 1 s per task by default).
  - Heavy sandbox (container/VM): for running commands or code that needs OS-level execution. Characteristics:
    - Immutable container images signed/verified against a known manifest.
    - Ephemeral writable volume mounted only for intended paths; default: write to an ephemeral workspace and capture diffs to `userData/backups` on successful completion before exposing to the host.
    - Network egress controlled via host-level policy; default: blocked. Explicit allow-list per operation.
    - Resource caps: CPU shares, memory limit (e.g., 512–2048 MB), disk quota (e.g., 100 MB), and enforced wall-timeouts.
    - Minimal capabilities; do not run as root.

4) Executor Policy Engine
  - Evaluate each step against: whitelist/blacklist rules, file path policies (disallow system paths), command safety heuristics, and data sensitivity checks.
  - Produce a decision object: { allowed: bool, requiredConsent: [list], reason, mitigations }.
  - If disallowed, return an explainable denial and suggested safer alternatives.

5) Backup, Undo & Diffs
  - Before `writeFile`, create: a timestamped backup of the original file and a unified diff stored in `userData/backups/<plan-id>/<step-id>/`.
  - For multi-file changes, produce a single archive snapshot and a JSON manifest describing changes. Provide UI revert to restore the archive.
  - Maintain a retention policy (configurable) and an option to pin backups.

6) Authentication, Signing & Tamper Detection
  - Sign audit records and backups using an HMAC key stored in `userData/` (secure storage recommended). Record hashing algorithm, key id, and key rotation metadata.
  - Expose a verification UI that validates signatures for backup artifacts.

7) Data Leakage Protections
  - Scan commands, file contents, and generated outputs for API keys, tokens, and PII patterns. If detected, prompt the user and require explicit allow.
  - Block exports containing detected secrets unless the user redacts or consents.

8) Telemetry & Training Exports
  - Provide curated export pipeline: user reviews candidate records before export, supports redaction, and sampling options.
  - All exports must include provenance metadata except where redaction is applied.

Autonomy Roadmap (embedded)
- Phase 0 — Policy & Audit (0–2 weeks)
  - Finalize action taxonomy and risk levels, implement audit log schema, and plan preview UI.
- Phase 1 — Safe Execution Primitives (2–6 weeks)
  - Implement backup/undo, lightweight JS sandbox, executor policy engine, and dry-run mode.
- Phase 2 — Controlled Autonomy (6–12 weeks)
  - Build heavy sandboxing (container orchestration), Autonomy Controller (scheduling, throttles), per-step consent flows, and activity viewer.
- Phase 3 — Learning Loop (12–20 weeks)
  - Add opt-in telemetry funnels, export filters, retrain pipeline integration, and CI for retrain validation.
- Phase 4 — Optional Assistants (20+ weeks)
  - Offer explicit opt-in autonomous assistant modes with time-limited sessions, comprehensive audit, and rollback capabilities.

Research Agenda (concise)
- Safety evaluation metrics: false-positive/negative rate for policy engine, undo success rate, mean time-to-revert.
- Human factors: optimal consent UX, minimizing prompt fatigue while preserving safety.
- Adversarial testing: fuzzing model-output suggestions, testing sandbox escapes, and injection attacks.

Testing & Validation Plan
- Unit tests: executor policy checks, risk-level tagging, backup creation.
- Integration tests: run simulated plans where steps include read/write/run and verify dry-run vs. real-run behavior.
- Autonomy Test Suite: scenarios where malicious or harmful plans are proposed; ensure system blocks them and logs rationale.
- Penetration tests: sandbox escape attempts, resource exhaustion, and supply-chain artifact verification.

Rollout & Opt-in Strategy
- Developer preview: internal opt-in with verbose logging and manual review of audit logs.
- Early users: enable dry-run default and require per-step online consent for any write/exec.
- Wider release: add policy automation for trusted operations and clearer consent defaults.

Developer Guidance (implementation notes)
- Keep executor API small and well-typed. Centralize policy checks so all paths pass through the same validator.
- Prefer declarative plan descriptions (JSON) vs. executable shell strings.
- Make backups and diffs machine-readable and human-readable for easy review.

Open questions
- Choice of heavy sandbox runtime (Docker vs Windows containers vs OS-native sandbox). Recommend Docker for cross-platform reproducibility, but provide OS-native fallbacks.
- HMAC key protection strategy and rotation policy (local KDF vs platform secure storage).
- Export redaction defaults and retention policy for backups.

References & Links
- See `docs/roadmaps/BRAIN_ROADMAP.md` for planner and autonomy high-level milestones.
- See `docs/roadmaps/CODELUMI_ROADMAP.md` for project-level dependencies and release phases.

Next immediate tasks
- Implement `docs/designs/EXECUTOR.md` with API surface and developer usage (I will add this file now).
- Create `src/brain/executor_stub.ts` for local testing and integrate with policy engine.

---


