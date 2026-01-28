Phase 1 Ship Checklist — Lumi Desktop (v0.x) — Prepared 2026-01-28

Purpose
- Ensure a minimal, auditable, privacy-respecting release (Phase 1) that includes local embeddings, curator workflow, and safe apply mechanics. This checklist covers packaging, privacy, testing, docs, and release verification steps required before distributing a Phase‑1 beta.

Mandatory checks

1) Code & build
- Run: `npx tsc -p tsconfig.json --noEmit` — no TypeScript errors.
- Run: `npm run build` and verify `dist/` and `release/` contents include expected assets.
- Ensure `postbuild` copies model assets (existing `scripts/copy_models_postbuild.js` or `scripts/copy_models_postbuild.ts`).

2) Privacy & data hygiene
- Run privacy audit: `node scripts/privacy_audit.js` -> `docs/privacy_audit_results.json`.
- Ensure no absolute Windows/UNC paths or unexpected emails in tracked training/staging files.
- Redact or remove any findings. Backups may exist; ensure backups are either redacted or moved out of repo.
- Confirm `userData/` is not checked into Git and `build`/`release` artifacts do not contain `userData/`.

3) Pre-commit & CI protections
- Husky pre-commit hook installed and enabled (run `npm run prepare`) to block absolute-path commits (`scripts/precommit_check_paths.js`).
- Create a GitHub Actions workflow `privacy-audit.yml` to run `node scripts/privacy_audit.js` on PRs and fail on findings.

4) Functional tests
- Unit tests: run any existing tests. Add/verify tests for:
  - `appendStagingUnique()` behavior.
  - `KnowledgeProcessor` write sanitization.
  - Embedding adapter (mocked) → vector store insert and retrieval.
- Manual smoke tests:
  - Start app locally (`npm run dev:electron`) and verify curator/staging flows, that the renderer cannot set tone, and that local writes are sanitized.

5) Documentation & user-facing artifacts
- Add `docs/privacy_statement_phase1.md` targeted at beta users describing what is collected, opt-ins, and export/import behavior.
- Add `docs/export_import.md` describing how to export/import training artifacts and how to redact sensitive data prior to sharing.
- Add `docs/onboarding_beta.md` with steps to install, enable self-learn, review curator queue, export KB, and rollback.

6) Packaging & installer
- Build platform-specific installers (Windows NSIS) and verify the installer does not include `userData/`.
- Verify runtime first-run creates `userData/` in expected location and that files are writable and sandboxed.

7) Release notes & audit trail
- Create release notes enumerating privacy changes, behavior of self-learn, and curator controls.
- Attach `docs/privacy_audit_results.json` and markdown audit summary to release assets.

Optional but recommended
- Add an automated nightly audit job for packaged artifacts.
- Provide a `tools/sanitize_for_export.js` script to produce sanitized export artifacts (removes absolute paths, strips emails unless approved).

Acceptance criteria
- All mandatory checks pass, privacy audit shows no findings in tracked training files, Husky and CI protections are in place, and documentation is included in `docs/`.
