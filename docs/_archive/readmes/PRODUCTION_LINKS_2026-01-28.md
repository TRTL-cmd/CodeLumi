# Lumi Production Links (2026-01-28)

Quick references for the changes made and artifacts to review:

- Master plan snapshot: docs/readmes/LUMI_MASTER_PLAN_UPDATE_2026-01-28.md
- Production snapshot (roadmap): docs/roadmaps/PRODUCTION_SNAPSHOT_2026-01-28.md
- Privacy audit: scripts/privacy_audit.js → docs/privacy_audit_results.json
- Targeted redaction: scripts/redact_audit_findings.js
- Training KB: training/training.jsonl, training/lumi_knowledge.json
- Staging utils (dedupe): src/core/security/staging-utils.ts
- Personality manager: src/core/personality/manager.ts
- Pre-commit path check: scripts/precommit_check_paths.js, .husky/pre-commit
- CI privacy audit: .github/workflows/privacy-audit.yml

If you want me to run the final-pass redaction on `.backup.redact.*.bak` files, say "Please redact backups" and I will proceed (will create additional timestamped backups first).
