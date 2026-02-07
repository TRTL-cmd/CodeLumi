# Lumi Troubleshooting Guide

This document collects common failures, quick fixes, and prevention steps for Lumi.

## Quick Emergency Fix (one command)
If Lumi breaks (KB format, cache corruption, or self-learning stops):

```bash
node scripts/emergency-fix.js
```

What this does:
- Clears common Electron caches (Cache, GPUCache, Code Cache)
- Runs `scripts/unwrap-kb.js` (if present) to fix wrapped KB files
- Resets the `selflearn_seen.json` cache so files are re-scanned
- Checks `ollama` connectivity
- Runs `scripts/privacy_audit.js` for quick validation

## Common Problems & Fixes

- KB format wrapped (file changed from `[...]` to `{ "qa": [...] }`)
  - Fix: `node scripts/unwrap-kb.js` or run the emergency fix above

- Electron cache corruption
  - Fix: Close Lumi. Run `node scripts/emergency-fix.js`. Restart Lumi.

- Seen cache blocking scans
  - Fix: Remove or reset `selflearn_seen.json` (the emergency fix resets it)

- Pre-commit hook not running
  - Ensure Husky is installed and `.husky/pre-commit` contains:

```
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

node scripts/precommit_check_paths.js
```

  - On Git Bash/WSL make it executable: `chmod +x .husky/pre-commit`
  - Test manually: `node scripts/precommit_check_paths.js`

## Data Cleaning (PII)

- Preview redactions:
  - `node scripts/redact_paths.js --dry-run --all`
- Apply redactions (creates `.backup` files):
  - `node scripts/redact_paths.js --all`

## Prevention Checklist

- Run the quick health check before starting Lumi (PowerShell snippet in docs).
- Add tests or runtime assertions for KB write paths to prevent old-format writes.
- Keep backups (`.backup`) and add them to `.gitignore` if appropriate.

## Diagnostics Commands

- Run privacy audit:
  - `node scripts/privacy_audit.js`
- Test pre-commit hook:
  - `echo "C:\\Users\\Test\\file.txt" > test.txt`
  - `git add test.txt`
  - `git commit -m "test"`  # should be blocked

## Where to Look

- KB files: `training/`, `userData/`
- Logs: `userData/logs/`, `logs/`
- Electron caches: `%LOCALAPPDATA%/lumi-desktop/Cache`, `GPUCache`, `Code Cache`

If problems persist, gather logs and open an issue including:
- Output of `node scripts/privacy_audit.js` (attach `docs/privacy_audit_results.json`)
- Last 200 lines of `userData/logs/lumi.log`
