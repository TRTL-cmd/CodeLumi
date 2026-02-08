Onboarding — Lumi Desktop Beta (Phase 1)

Quick start
1. Install (Windows): run the NSIS installer built by `electron-builder` or run locally via:

   ```bash
   npm install
   npm run dev:electron
   ```

2. First run: the app creates a `userData/` folder for persistent artifacts.

3. Settings: enable `Self-learn` only if you want the app to collect proposed training candidates. Telemetry is off by default.

Curator workflow
- When `Self-learn` is enabled, the system collects candidates and writes them to `userData/self-learn/staging.jsonl` (quarantine, sanitized paths).
- Use the Curator UI (Menu → Curator) to review candidates. Approve to apply changes to the knowledge base; reject to discard.

Exporting & support
- To export training artifacts for offline review:

   ```bash
   node tools/export_kb_for_training.js --out exports/training_export.jsonl
   ```

- If you need to share an artifact with support, run the sanitizer script first and attach the sanitized export.

Rollback
- Redaction and apply operations may create backups under `userData/backups/` on the local machine. If an apply introduced bad content, restore from the most recent backup and re-run the sanitizer.
- Repo-side redaction backups should be kept off-repo for beta to avoid accidental disclosure.

Privacy & tips
- Avoid importing or pasting regulated PII into the app.
- If you see absolute local paths in artifacts, run `node scripts/preprocess_export.js` or contact support for removal guidance.

Support
- See `docs/privacy_statement_phase1.md` for privacy guarantees.
- For urgent help, use the contact listed in `COPYRIGHT.md`.
