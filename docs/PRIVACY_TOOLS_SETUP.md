# Privacy Tools Setup

This document describes the lightweight privacy tooling included in the repo and how to enable it.

Included scripts (in `scripts/`):

- `privacy_audit.js` — scans a small set of folders (training, userData) for obvious PII and absolute Windows/UNC paths. Writes results to `docs/privacy_audit_results.json` and `docs/privacy_audit_YYYY-MM-DD.md`.
- `precommit_check_paths.js` — intended for use as a Husky pre-commit hook; it blocks commits that include absolute Windows paths or UNC paths in staged text files.
- `redact_paths.js` — a helper that can perform a conservative redaction pass over repository files (creates backups with `.redactbak`).
- `setup_privacy_tools.js` — convenience script to install Husky hooks and wire the pre-commit check.

Quick start

1. Install dev dependencies (if needed):

```powershell
npm install
```

2. Install Husky hooks and enable the pre-commit check:

```powershell
node scripts/setup_privacy_tools.js
```

3. Run an audit manually:

```powershell
node scripts/privacy_audit.js
```

Notes

- These tools are intentionally conservative and use simple heuristics; review findings manually before redacting.
- Always create a backup or commit before running bulk redaction.
