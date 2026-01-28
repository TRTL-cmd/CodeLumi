Lumi Desktop — Privacy Statement (Phase 1 Beta)

Scope
- This statement describes data collection, storage, and sharing behaviors for the Phase 1 beta release of Lumi Desktop (local-first assistant and self-learn pipeline).

Data Collection & Storage
- Local-only by default: user data, training artifacts, and embeddings are stored under the local application data directory (`userData/`).
- Self-learn is opt-in: automatic candidate collection and curator apply require explicit user opt-in.
- Runtime logs may include anonymized metrics; any telemetry is explicit opt-in and documented in settings.

Privacy Guarantees
- No automatic upload: by default Lumi does not upload userData to remote services.
- Sanitization: all persisted training artifacts are run through a sanitization step that removes absolute local filesystem paths and redacts obvious PII (emails, UNC paths) unless the user explicitly permits inclusion for support/troubleshooting.
- Backups: redaction operations create timestamped backups to allow rollback; backups may contain original text and are stored locally. We recommend users review backups before sharing.

Export/Share
- Export utilities are provided to create sanitized JSONL/JSON exports for sharing or offline training (`tools/export_kb_for_training.js`). Exports run an automatic sanitization pass.

User Controls
- Opt-in toggles for self-learn and telemetry in the Settings UI.
- Curator review: all proposed training changes go to a curator queue and require approval before affecting the local knowledge base.
- Data deletion: users can delete `userData/` or use the built-in reset option (documented in `docs/onboarding_beta.md`).

Support & Contact
- For privacy questions or to request assistance removing specific artifacts, contact the project maintainer listed in `COPYRIGHT.md`.

Security note
- Phase 1 is an early beta; users should avoid importing sensitive, regulated PII into the training pipeline until enterprise-grade controls are added.
