# Lumi Repository Audit — 2026-01-29

Summary
- Project: Electron + TypeScript app with local self-learning, curator, session memory, and training KB.
- Status: Core features present and wired: session manager, curator UI, auto-promote, self-learn agent, privacy redaction, and CI hooks. Token-meter and Settings UI implemented in this update.

Top-level structure (what matters)
- `src/` — Application source (main, preload, renderer, core, selflearning, components, etc.). Primary work happens here.
  - `src/main.ts` — Electron main process, IPC handlers, wiring for `SessionManager`, `KnowledgeProcessor`, `SignalProcessor`, and self-learn agent.
  - `src/preload.ts` — Exposes `window.lumi` safe APIs to renderer.
  - `src/renderer.tsx` — DOM-based renderer UI; self-learn panel, Curator, Settings modal, token meter.
  - `src/core/` — core logic: `memory/` (`session.ts`, `store`), `learning/`, `personality/`, `security/` modules.
  - `src/core/tokenizer.ts` — lightweight token estimator (added).

- `training/` — training KB artifacts and audit logs (`training.jsonl`, `lumi_knowledge.json`, `staging.jsonl`).
- `test/` — simulator and tests (`simulate_sessions.js`, `test_tokenizer.js`, `test_session_manager.js`).
- `scripts/` — helper scripts for KB operations, privacy audit, packaging helpers.
- `docs/` — documentation, roadmaps, daily logs, master plan snapshot.

What works now (high confidence)
- Electron app boots, `SessionManager` inits and archives sessions under `userData/sessions`.
- Curator UI lists archives, reads entries, and supports accept/reject/delete/promotion.
- `promoteSelected` and `promoteArchive` append to `training/training.jsonl` with backups.
- Sanitization: `SessionManager.sanitizeText()` redacts Windows drives and Unix absolute paths on write.
- Token-meter: `src/core/tokenizer.ts` + UI meter in renderer; `session:trimNow` IPC trims session to budget.
- Simulator: `test/simulate_sessions.js` writes archives to `userData/sessions` and exercised promote flow.

Outstanding or recommended work
- Settings tab polish: fields exist and persist; UX could surface current values more clearly and support revert/undo.
- Token accuracy: current estimator is heuristic (words * 1.3). Recommend integrating a tokenizer matching target LLM (e.g., tiktoken or local model tokenizer) for exact token budgets.
- Tests & CI: add CI job to run `npx tsc` and Node tests (`node test/*.js`). Add unit tests for `SessionManager.trimToTokenBudget` (JS/TS test). Already added tokenizer test.
- Packaging: ensure `userData/` is excluded from packaged artifacts. Add CI audit step to scan built installers.
- Docs: add explicit Ollama/local-model install steps, model names, and health-check commands.

Short next steps (PRs/Tasks)
1. Add a deterministic tokenizer or wrapper to call the chosen model's tokenizer (1–2 days).
2. Add CI pipeline with `npx tsc` + `node test/*.js` and packaging audits (1 day).
3. Add more unit tests for `SessionManager` and integration tests for promote/trimming flows (1–2 days).
4. UX polish: settings layout, token meter tooltip, and a disk-usage indicator for `userData/sessions`.

Key commands

```powershell
npm install
npx tsc
node test/test_tokenizer.js
node test/simulate_sessions.js
```

Conclusion
- The repo is in a good state for a local MVP: core runtime, session memory, curator, and privacy controls are implemented. Remaining work is QA, tokenizer accuracy, CI/tests, and packaging steps to make the experience reproducible for other developers.
