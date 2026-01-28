# Codelumi Brain Roadmap â€” Planner & Cognitive Architecture

This document separates the planner/brain design from the main Codelumi roadmap and lays out an actionable prototype for a local, safe, explainable planning and reasoning layer (the "Brain"). It focuses on components, APIs, data flow, evaluation, timelines, and integration points with the existing UI, KB and model/runtime.

## Goals
- Provide multi-step planning and execution capabilities (task decomposition, step ordering, verification).
- Keep all operations privacy-first and reversible; require explicit user consent for actions that change files or run commands.
- Integrate with the KB, memory (episodic + semantic), and inference runtimes (TFJS/ONNX) for retrieval-augmented reasoning.
- Expose a small, testable API so the frontend can ask for plans, simulate steps, and execute them under user control.

## Recent updates (2026-01-24)

- Implemented offline KB-first support: `thinkLocal` (KB-only synthesis) and `lumi-think-local` IPC to let Lumi answer from local knowledge without Ollama.
- Added runtime KB reload support (`lumi-kb-reload`) and a renderer `Reload KB` button to refresh the in-memory KB cache without restarting Electron.
- BM25 retrieval and a reranker wrapper were integrated; added decision-layer design `searchKBWithDecision()` to combine BM25 and reranker scores (tunable weights and threshold).
 - BM25 retrieval and a reranker wrapper were integrated; added decision-layer design `searchKBWithDecision()` to combine BM25 and reranker scores (tunable weights and threshold).
 - Implemented decision logic in `src/core/memory/kb.ts` (BM25 + lightweight reranker fallback). Default `DECISION_CONFIG.threshold` set to `0.60` during calibration. Added test scripts: `scripts/test_search_decision.js`, `scripts/extract_candidates.js`, and `scripts/telemetry_dashboard.js` for validation and extraction workflows.
- Patched packaged `dist-electron` preload/main to avoid instructing users to "Start Ollama" and to prefer neutral KB fallback outputs.
- Merged user-provided KB (`lumi_knowledge.json`) into `training/training.jsonl` (153 entries appended) and added inspection/merge scripts.

These changes prioritize offline robustness and safer UX when Ollama is unavailable. Next steps: threshold calibration, telemetry aggregation, and human-review pipeline for KB updates.

## High-level Architecture

- Planner: produces ordered plan steps for a given goal using heuristics + optional LLM assists.
- Executor: executes an approved step, runs bounded actions (read file, run tests, open URL) in a sandboxed environment, reports results.
- Working Memory (WM): ephemeral context for a single task (short-term state, last outputs, pending steps).
- Episodic Memory: time-stamped events and action outcomes stored in IndexedDB (searchable by embedding similarity).
- Semantic Memory / KB: existing knowledge-base and embedding index used to inform planning.
- Verifier / Critic: checks step preconditions and postconditions; optionally reranks candidate plans.
- Safety & Consent Layer: user prompts, action gating, and undo logs.

## Core APIs (proposed)

- `brain.plan(goal: string, opts?): Promise<Plan>`
  - Returns a `Plan = { id, steps: [{id, action, args, description}], score, provenance }`.
- `brain.simulate(planId): Promise<SimulationResult>`
  - Runs a dry-run (no side-effects) and returns predicted outcomes and confidence.
- `brain.execute(planId, options): Promise<ExecutionResult>`
  - Executes approved steps sequentially; emits events `onStepStart/onStepComplete/onError`.
- `brain.memorize(event)` / `brain.recall(query, opts)`
  - Integrates with the memory store for learning and retrieval.
- `brain.explain(planId, stepId): string`
  - Returns provenance/explanation for why a step was chosen (references KB/memory/clips).

## Planner Prototype Design

- Input: user goal (free text) + optional constraints (time, allowed actions).
- Phase 1 planner (prototype): symbolic/heuristic planner with rule templates and retrieval-augmented step generation.
  - Use KB to fetch relevant patterns; convert patterns into candidate steps.
  - Apply greedy refinement and lightweight cost heuristics (estimated time, required files, safety score).
- Phase 2 planner: incorporate local LLM or reranker to refine step wording and ordering.

## Detailed Brain Roadmap & Tasks

This expands the planner prototype into concrete tasks, documents, and QA steps required to reach a production-ready Brain.

- Core tasks (High priority):
  - Formalize Plan & Simulation schema (see `docs/designs/KB_SCHEMA.md`).
  - Implement `brain.plan(goal, opts)` with deterministic rule/template generator and unit tests for canonical goals.
  - Implement `brain.simulate(plan)` that returns expected outcomes and confidence estimates without side-effects.
  - Persist plans and simulations into `kb.meta.plans` (already implemented).

- Memory & Retrieval (High):
  - Implement IndexedDB episodic memory with a small API: `memorize(event)` and `recall(query, opts)`.
  - Build an embedding pipeline (TF/PyTorch) for offline embedding generation; prototype in `tools/train_reranker.py` and plan ONNX export.
  - Add an ANN index for fast retrieval (e.g., HNSWlib or approximations) and a JS fallback for small datasets.

- Training & Reranker (High):
  - Create retrain automation: exporter (done), trainer (prototype exists), and artifact packaging (joblib/onnx).
  - Add `npm run retrain` that runs exporter â†’ trainer and writes an artifact to `models/`.
  - Add versioning and reproducibility flags to training (seed, dataset hash, hyperparams).

- Executor & Safety (High â†’ Med):
  - Define allowed action set and formal safety rules in `docs/designs/EXECUTOR.md`.
  - Implement executor stubs that require explicit user confirmation for destructive actions; add undo log.
  - Build a sandbox for running tests/commands safely; prefer containerized or VM-based isolation for heavier tasks.

- UX & Tools (Med):
  - Plan History Viewer and Feedback Review UI for curating training data.
  - Plan Preview modal (done) + improvements: step expansion, expected side-effects, required permissions per step.
  - Daily documentation UI / quick logs accessible from the app (link to `docs/logs`).

- Infrastructure (Med â†’ Low):
  - CI for training and artifact publishing (GitHub Actions), including reproducible retrain test jobs.
  - ONNX runtime integration: test `onnxruntime-web` in renderer and `onnxruntime-node` in main process.

## Test Plan & Metrics

- Unit tests:
  - Planner rule outputs for canonical goals.
  - Simulate outputs deterministic under fixed seed.
  - Executor safety gating (no side-effects when simulation flag set).

- Integration tests:
  - Export â†’ Train â†’ Load reranker checks.
  - Plan execution in sandboxed environment with mock confirmations.

- Metrics to track:
  - Plan precision/recall against human-labeled gold plans.
  - Improvement after retrain: reranker accuracy or human-A/B preference.
  - Autonomy safety metrics: number of blocked unsafe actions, undo frequency.

## Deliverables & Timeline (short)

- Week 1: stabilize planner & simulate (unit tests), Plan Preview UX improvements, exporter tested end-to-end.
- Week 2: retrain automation + simple reranker artifact; add `npm run retrain` and document workflow.
- Week 3: memory indexing + plan history viewer; feedback review UIs.
- Week 4: executor gating + sandbox tests; initial ONNX conversion test for a small reranker.

I'll add the required `docs/designs/*.md` and `docs/training/*.md` files next, plus a `tools/log_daily.js` helper to create daily logs if you'd like me to proceed.

## Executor Design

- Provide a limited action set (safe-by-design): `readFile`, `writeFile` (with backup), `runCommand` (sandboxed), `openURL`, `createKBEntry`.
- Each action must be explicit and require user confirmation before mutating local files or running arbitrary commands.
- Execution logs and diff backups retained so every action is reversible.

## Memory & Retrieval Integration

- Use IndexedDB for episodic memory and a small ANN index for semantic retrieval. Store embeddings produced by the runtime (TFJS/ONNX).
- APIs:
  - `memorize({type:'event'|'result', text, embedding, meta})`
  - `recall(query, {maxResults, timeWindow})`

## Brain: Reasoning & Planning (longer-term)

- Goal: layer a planner/reasoner that turns retrieved memories and KB items into step-by-step plans and actions.

## Safety, Consent & UX

- Add clear UX for plan creation and execution: a plan preview dialog that shows each step, required permissions, and expected outcomes.
- Default to read-only simulations. Any destructive or outbound action requires explicit user confirmation and an undo guard.
- Provide an audit log and a one-click "revert" when file changes are made by the brain.

## Testing & Metrics

- Unit tests for planner heuristics and executor sandbox.
- Integration tests that run sample goals and verify expected plan structure and simulated outcomes.
- Metrics: plan success rate, steps executed per plan, average user confirmations, recovery/undo usage, false positives (unsafe actions prevented).

## Milestones & Timeline (suggested)

- M1 (1 week): Prototype Planner v0 â€” rule/template-based planner that generates step lists for 5 canonical goals (open file, run tests, fix lint, add KB entry, summarize project).
- M2 (2 weeks): Executor v0 â€” implement safe action set + simulated dry-run mode + UI plan preview dialog.
- M3 (2 weeks): Memory & Retrieval â€” IndexedDB episodic store and embedding pipeline; integrate retrieval into planner.
- M4 (2â€“4 weeks): LLM-assisted planner + verifier + explainability traces.
- M5 (ongoing): Autonomy gating UX and controlled agent workflows (opt-in) once safety review passes.

## Autonomy Roadmap (New)

This section outlines a phased plan to evolve the Brain into a conservative, auditable, and opt-in autonomous assistant. The focus is safety, explainability, and incremental automation.

Phase A — Foundations (0-4 weeks)
- Goal: make all learning, execution, and plan generation auditable and reversible.
- Tasks:
  - Formalize plan/provenance schema and wire full auditing on `brain.plan()` and `brain.execute()`.
  - Persist simulated dry-runs and execution outcomes to `kb.meta.plans` with versioning and user approvals.
  - Expose explicit user consent toggles (per-action and global) in settings.

Phase B — Controlled Autonomy (4-10 weeks)
- Goal: allow the Brain to perform multi-step tasks under strong gating and human-in-the-loop confirmation.
- Tasks:
  - Implement Autonomy Controller: schedules tasks, enforces throttles, and logs all actions.
  - Build Executor sandbox: limit actions to a safe set (`readFile`, `writeFile` with backup, `runCommand` in sandboxed environment, `createKBEntry`).
  - Add undo/backup system that stores diffs and supports one-click revert.

Phase C — Learning Loop & Aggregation (10-20 weeks)
- Goal: safely collect opt-in signals and improve local rerankers/recipes.
- Tasks:
  - Create opt-in telemetry pipelines (local aggregation, anonymization, opt-in consent screens).
  - Export curated plan/simulation records for retraining rerankers and planners.
  - Add retrain CI job that builds, validates, and publishes artifacts to `models/` with signed metadata.

Phase D — Autonomous Assistants (20+ weeks)
- Goal: deliver optional assistant modes that can run routine maintenance tasks and triage issues with minimal supervision.
- Constraints:
  - Mode is opt-in, time-limited, and fully auditable.
  - All outbound network or file operations require explicit allow-lists and user confirmation policies.

Safety & Evaluation for Autonomy
- Human-in-the-loop rate: default require explicit confirmation for any file mutation or network call.
- Auditability: every automated action must include provenance, confidence, and revert metadata.
- Testing: create an Autonomy Test Suite simulating common flows and verifying that no destructive actions occur without consent.

Integration Notes
- The Autonomy Controller will be implemented as a small service inside `src/brain/` and will reuse `src/core/memory/store.ts` for persistent logs and `kb.meta.plans` as the canonical provenance store.
- UI changes: add an "Autonomy" settings panel, an Autonomy activity viewer, and explicit per-action consent UX.

Next immediate items (I will implement):
- Add an Autonomy Roadmap subsection to `docs/roadmaps/CODELUMI_ROADMAP.md` linking here.
- Append a detailed daily log for 2026-01-23 summarizing these autonomy decisions and current code changes.

## Implementation Notes & Integration Points

- The prototype should be implemented as a small JS module under `src/brain/` exposing the `brain` API.
- Integrate with `src/Codelumibegin.tsx` for UI flows: Plan creation, plan preview modal, execution controls, and audit log viewer.
- Keep the initial action set small and explicit; expand iteratively.

## Next Immediate Tasks (I can start now)
- Create `src/brain/` scaffolding and the `brain.plan()` prototype that returns sample plans for canonical goals.
- Add a UI plan preview modal and wire a simple `simulate` flow that shows expected results without side-effects.
- Add tests under `test/` to validate planner output.

### Plan export & training (new)

- Export plan and simulation records to a training-friendly JSONL format. Use `kb.meta.plans` as the canonical source of plan records (goal, steps, simulation summary, timestamp, accepted flag).
- Script: `tools/export_plans_for_training.js` â€” reads a `codelumi_knowledge.json` file and writes newline-delimited JSON records for each plan. This file is suitable for downstream reranker/training utilities.
- Recommended next steps: create a small retrainer that consumes the exported JSONL, trials a lightweight TF-IDF + classifier reranker (prototype under `tools/train_reranker.py`), and iterate on labeling/sampling.

### ONNX inference note

- When moving beyond prototypes, convert trained models to ONNX for local inference performance and portability. Plan:
  1. Train small reranker or embedding model in Python/PyTorch.
 2. Export to ONNX and add a small runtime loader in the Electron main process or renderer using `onnxruntime` / `onnxruntime-web`.
 3. Add a switch in settings to select runtime (TFJS / ONNX / remote API).


### Summary of what's done vs. what's needed (concise)

- Done: planner scaffold (`src/brain/index.js`), Plan Preview modal UI, simulation plumbing and persistence to `kb.meta.plans`, basic KB schema migration, feedback capture, exporter script (tools/export_plans_for_training.js).
- Needed (near-term): retrain pipeline automation (export â†’ train â†’ model artifact), plan history viewer UI, embedding pipeline (offline), on-device inference integration (ONNX), executor with sandbox and undo, CI for training reproducibility.

- Self-learning pipeline: detailed plan authored at [docs/self_learning_pipeline.md](docs/self_learning_pipeline.md#L1). Next concrete action: implement `scripts/extract_candidates.js` to produce `candidates/` JSONL for human review and staging.

I will keep this doc updated each sprint; we should run this review periodically (weekly or per-sprint) to adjust priorities and record progress.

---

## Updated Plan & Priorities

This document is extended to align with the CODELUMI roadmap immediate plan (A â†’ D).

Priority 1 (Sprint A): Brain scaffold
- Implement `src/brain/index.js` exposing `brain.plan(goal)`, `brain.simulate(planId)`, `brain.execute(planId, opts)` stubs.
- `brain.plan()` should return structured, explainable `Plan` objects: {id, steps:[{id,action,description,args}], score, provenance}.

Priority 2 (Sprint B): Plan UI & Simulation
- Add a Plan Preview modal in the UI that accepts a goal, calls `brain.plan(goal)`, displays steps, and allows a simulated dry-run.

Priority 3 (Sprint C): Memory integration & retrain
- Wire planner to query the KB and episodic memory for patterns that inform plans.
- Export training examples and integrate the local retrain prototype.

Priority 4 (Sprint D): Safe executor and background autonomy
- Implement a small Executor with a tightly controlled action set and an Autonomy Controller that schedules background learning tasks with user opt-in.

Deliverables for Sprint A
- `src/brain/index.js` module
- Simple plan generation rules for canonical goals
- UI hook in `index.html` to request a plan and preview it

We will iterate the planner to add retrieval-augmented step generation in later sprints.