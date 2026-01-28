# Checkpoints & Checklist (state as of 2026-01-26)

Completed
- Compile `src/main.ts` and `src/preload.ts` to `dist` so Electron runs updated main. (done)
- Add conservative `SignalProcessor` and route renderer feedback through it (done)
- Add `src/core/signal/detector.ts` shim (done)
- Add `scripts/normalize_kb.js` to normalize and deduplicate KB entries (done)

In-progress / Pending
- Verify live end-to-end in packaged app and CI (requires ensuring `dist-electron/main.js` uses compiled main or packaging step adjusted).
- Curator authentication and gating for staging (planned).
- Replace detector shim with full detector implementation (planned).

Next actions
- Run `node scripts/normalize_kb.js` and inspect `training/normalize_report.json`.
- Consider adding a CI task to compile main and preload during build.
- Add curator auth for `staging:approve` and protect auto-merge with operator flag if desired.
