# CODELUMI — Daily Progress Log

This file is your “single source of truth” journal. Keep it lightweight but consistent.

## How to use
- Create a new entry each day under a dated header.
- If you do multiple sessions in one day, add multiple time-stamped sections.
- Always end with “Next actions (top 3)”.

---

# YYYY-MM-DD (Day N)

## Session info
- Date:
- Start time:
- End time:
- Focus:

## Today’s goal
- (1–3 bullets)

## What I changed
- Code:
  - 
- Docs:
  - 
- Scripts/Tooling:
  - 

## What works now
- 

## What’s broken / blocked
- 

## Decisions made
- 

## Metrics (optional, but useful)
- Tests passing? (y/n)
- Build/package works? (y/n)
- Ollama model used:
- Memory size / episode count:
- Notes on latency / perf:

## Next actions (top 3)
1.
2.
3.

---

# 2026-01-19 (starter entry)

## Session info
- Date: 2026-01-19
- Focus: Documentation consolidation + add Neural Link + Online clarity

## Today’s goal
- Merge roadmap/docs into a few canonical files
- Make Neural Link first-class (not an afterthought)
- Add a daily log template

## What I changed
- Docs:
  - Created consolidated master documentation
  - Created consolidated master roadmap
  - Created consolidated runbook
  - Created daily log template

## Next actions (top 3)
1. Implement `src/core/llm/ollama.ts` and wire IPC
2. Implement Dexie schema + `remember/recall`
3. Add signal detection skeleton and persist signals

---

# 2026-01-23

## Session info
- Date: 2026-01-23
- Start time: (developer session)
- End time: (in-progress)
- Focus: Rename to Lumi; persona persistence; memory, streaming, and roadmap updates

## Today’s goal
- Complete Kira→Lumi rename in active sources and persist persona JSON
- Implement file-backed memory store and Ollama streaming parser
- Update roadmaps, README, and daily logs; draft Safety/Ethics & Sandboxing plan

## What I changed
- Code:
  - `src/core/llm/ollama.ts` — added robust streaming/NDJSON `chatStream()` parser
  - `src/core/brain/index.ts` — identity injection and streaming wrapper updates
  - `src/core/memory/store.ts` — new file-backed JSONL MemoryStore with IPC handlers
  - `src/main.ts` / `src/preload.ts` — memory IPC and renderer exposure
  - `index.html` — renderer wiring for persona persistence, memory writes, migration, and UI viewers
- Docs:
  - `docs/roadmaps/BRAIN_ROADMAP.md` — added Autonomy Roadmap section
  - `docs/roadmaps/CODELUMI_ROADMAP.md` — added Autonomy summary
  - `docs/readmes/README.md` — updated to Lumi and added guidance
  - `docs/designs/SAFETY_SANDBOX_PLAN.md` — expanded Safety/Ethics & Sandboxing plan
  - `docs/designs/EXECUTOR.md` — Executor README and API guidance
  - `docs/logs/daily/2026-01-23-extended.md` — detailed session log
- Assets:
  - `assets/persona_from_copy.json` — inserted user-provided persona JSON

## What works now
- Local persona persistence (renderer localStorage + persona history)
- Ollama streaming parsing implemented in `ollama.ts` (needs Ollama server to test)
- File-backed memory store and IPC endpoints wired (main + preload + renderer)
- Migration layer for legacy `codelumi_*` keys implemented

## What’s broken / blocked
- End-to-end interactive validation requires running dev + electron (dev machine). If dependencies already installed, `npm run dev` + `npm run dev:electron` will start that testing loop.
- Executor/dry-run not yet implemented (scheduled 2026-01-24)

## Decisions made
- Rename active codebase branding to `Lumi` and migrate keys non-destructively.
- Auto-personalize enabled but conservative: auto changes recorded as `origin: 'auto'` and require explicit user accept/reject.
- Autonomy roadmap will be opt-in, auditable, and require per-action consent by default.

## Metrics (optional)
- Tests passing? (partial; unit/integration tests not run)
- Build/package works? (not validated locally)
- Ollama model used: local Ollama endpoints (developer choice)
- Memory size / episode count: N/A (new store)

## Next actions (top 3)
1. Executor scaffold + dry-run simulate/backup/audit (2026-01-24)
2. Run interactive dev + electron smoke-tests locally and validate streaming and memory IPC
3. Review Safety/Ethics & Sandboxing plan and finalize policy checklist

---

# 2026-01-24

## Session info
- Date: 2026-01-24
- Focus: Offline KB reliability, KB ingestion, reranker integration, packaged fallback UX

## Today’s goal
- Make Lumi answer from local KB when Ollama is unavailable and add tooling to merge and inspect KB entries.

## What I changed
- Code:
  - Added KB-first and KB-fallback logic across brain and main process handlers.
  - Implemented `thinkLocal` (KB-only) and `lumi-think-local` IPC.
  - Added `lumi-kb-reload` IPC and UI `Reload KB` button to refresh KB cache at runtime.
  - Patched packaged `dist-electron` preload/main to prefer local KB fallback messages.
- Docs:
  - Updated daily logs and added `docs/self_learning_pipeline.md`.
  - Updated `docs/roadmaps/BRAIN_ROADMAP.md` to include recent autonomy and KB notes.
- Scripts/Tooling:
  - `scripts/merge_lumi_to_training.js` (safe merge + backup), `scripts/inspect_kb.js` (diagnostics), decision test harnesses.

## What works now
- Lumi responds using local KB entries for many identity and QA queries without Ollama.
- KB merging and inspection scripts can append and count entries; `training/training.jsonl` updated with user-supplied content (153 entries).

## What’s broken / blocked
- Some edits to packaged files may be out-of-sync in builds; restart or rebuild Electron to pick up changes.
- Reranker threshold tuning and decision policy require telemetry and calibration.

## Next actions (top 3)
1. Restart app and run manual offline tests; confirm KB-first and `thinkLocal` flows.
2. Calibrate `searchKBWithDecision` thresholds using representative queries and reranker outputs.
3. Implement `scripts/extract_candidates.js` and a minimal human review workflow for staging KB updates.

---

# 2026-01-26 (afternoon update)

## Session info
- Date: 2026-01-26
- Focus: Build, preload updates, and Electron startup verification

## What I changed
- Ran `vite build` to regenerate `dist/` assets (web bundle and `dist/preload.js`).
- Confirmed `src/preload.ts` includes `selflearn` APIs and `runSelflearnNow` but observed runtime preload mismatch: Electron was loading an older compiled preload, so the renderer lacked the new keys.

## What works now
- `dist/preload.js` regenerated and ready.

## What’s broken / blocked
- Electron failed to start in this environment due to a terminal limitation during an automated start attempt. Also, `package.json` `main` currently points to `dist/main.js` while Electron-related files were output to `dist-electron/main.js`, causing a startup "cannot find module dist/main.js" error until corrected.

## Next actions (top 3)
1. Locally run `npm run start` or `npm run dev:electron` to reload preload and verify `window.lumi.selflearn` is present.
2. If startup fails with "cannot find module dist/main.js", update `package.json` `main` to `dist-electron/main.js` or copy `dist-electron/main.js` into `dist/`.
3. Start the self-learn agent and run `runSelflearnNow()` to produce persisted `selflearn_*.jsonl` files and confirm suggestions/audit entries.
