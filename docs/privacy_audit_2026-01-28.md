# Privacy Audit — 2026-01-28
Generated: 2026-02-10T01:49:47.369Z

## Scanned directories
- [REDACTED_PATH] — 11 files
- [REDACTED_PATH] — 38 files

## Key findings (files with potential PII or absolute paths)
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - UNC paths: [REDACTED_PATH]
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
  - UNC paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH]
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
  - UNC paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
  - UNC paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
  - UNC paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
- [REDACTED_PATH]
  - windows paths: [REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...
  - UNC paths: \\_ANSWE[REDACTED_PATH] | [REDACTED_PATH] | [REDACTED_PATH], ...

## Recommendations
- Replace discovered absolute paths with basenames where possible; redact or pseudonymize emails.
- Ensure runtime writes are sanitized before persisting to `userData`.
- Add CI check to fail on committed files containing `<WINDOWS_PATH>` or email patterns in `training/`.