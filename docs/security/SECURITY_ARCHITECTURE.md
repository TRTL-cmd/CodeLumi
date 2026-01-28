---
title: COMPLETE SECURITY ARCHITECTURE
date: 2026-01-25
---

# COMPLETE SECURITY ARCHITECTURE for CodeLumi

Purpose
- Provide a hardened, actionable security architecture for CodeLumi's local runtime (Electron), learning pipeline, IPC, storage, and optional web-fetching. This document maps the 7-layer design into concrete controls, developer guidance, and implementation tasks.

High-level design (defense in depth)
- Layer 1 — Input Validation: canonicalize inputs; enforce length/format/charset and reject out-of-spec content.
- Layer 2 — Threat Detection: run prompt-injection scanner, regex-based malicious-patterns, and anomaly detectors on signals and web content.
- Layer 3 — Content Sanitization: remove code, shell tokens, and suspicious sequences; escape or neutralize dangerous constructs.
- Layer 4 — Rate Limiting & Quotas: per-source and per-window limits; throttles for web fetches and learning events.
- Layer 5 — Sandboxing & Isolation: perform risky operations (fetch, parse, execute) in isolated processes or containers without FS/network access unless explicitly allowed.
- Layer 6 — Integrity Checks & Backups: verify KB checksums, maintain append-only audit logs with signed entries, and run periodic integrity tests.
- Layer 7 — Audit Logging & Monitoring: centralize logs, keep tamper-evident records, alert on anomalies, and provide operator safe-mode.

Per-component controls

- Brain / Conversation
  - Validate input tokens and lengths in renderer before IPC.
  - Sanitize messages before passing to LLM or learning pipeline.
  - Rate-limit per-session and global query frequency.
  - Maintain an audit entry for every conversation turn with `id,ts,user_id,origin,hash`.

- IPC Layer (renderer <-> preload <-> main)
  - Enforce origin and context checks in `preload.ts` (expose minimal API surface).
  - Validate messages in main process; all IPC handlers perform schema validation using strict JSON schemas.
  - Reject unknown message types; log rejected attempts with metadata.

- Knowledge Base (KB) and Learning
  - Stage new candidates in `training/staging.jsonl` with full metadata: `id, input, output, confidence, source, provenance, fetch_ts, fetch_url, hash, validator_score`.
  - Do not auto-merge web-sourced candidates; require curator accept or high-confidence implicit+explicit signals combined.
  - Implement `merged_from` metadata on canonical merges.

- Memory / userData
  - Limit entry size (e.g., 8KB per entry by default) and cap total memory size per user.
  - Maintain append-only `training/training.jsonl` audit log; rotate and back up daily.
  - Store sensitive fields encrypted at rest (see Key Management below).

- Web Fetcher (opt-in)
  - Only enabled with explicit user opt-in and a per-session domain allowlist.
  - Use a separate sandboxed process with no default filesystem access; restrict network to allowed domains via host firewall rules or process-level allowlist.
  - Rate-limit outgoing requests and follow robots/TOS checks; capture raw response headers and text, then run content sanitizer and threat detectors before creating staging candidates.

Implementation details and recommended libraries

- Validation & Schemas
  - Use JSON Schema for IPC payloads (AJV in Node). Validate at `preload` and again in `main` for defense-in-depth.

- Prompt-injection & Threat detection
  - Implement a ruleset-based scanner plus anomaly detection:
    - Regex rules for common prompt-injection patterns (e.g., instructions to "ignore previous" or to execute code/sample payloads).
    - Blacklist sequences (e.g., `<script>`, `eval(`, `rm -rf`, backticks with shell tokens).
    - Heuristics: sudden change in instruction style, high ratio of code-like tokens, or external URLs in answers.
  - Keep rules modular and updateable from `docs/security/rules/`.

- Sanitization
  - Remove or escape control characters and shell metacharacters before staging.
  - Strip or neutralize HTML/script tags and embedded JS.
  - For code snippets, store as inert text; never execute unless explicitly sandboxed and vetted.

- Sandboxing & Isolation
  - Preferred approach: spawn a dedicated child process (no Node integration, no home dir) for web-fetching and heavy parsing. Use OS-level restrictions (Windows Job Objects / AppContainer or Linux seccomp + user namespaces) where possible.
  - Do NOT run untrusted code in the renderer or main process.
  - Consider using a small headless container (e.g., gVisor or Firecracker) for more aggressive isolation if available.

- Rate limiting
  - Implement token-bucket per source (renderer session, web-fetcher, external connectors) with configurable limits.
  - Enforce global daily caps for auto-learning merges and web fetches.

- Cryptography & Key Management
  - Encrypt sensitive files in `userData` (KB fragments, web fetch raw content) using a local key stored in OS-provided key storage (Windows DPAPI / macOS Keychain / Linux libsecret). If absent, derive key from user passphrase with argon2 and store KDF parameters.
  - Use HMAC for audit log integrity (append HMAC per-line) so tampering is detectable.

- Audit logging & monitoring
  - All candidate events must include: `id, ts, actor, source, origin, action, payload_hash, signature_or_hmac`.
  - Expose a developer-only endpoint that summarizes anomalies (e.g., sudden spike in merges, many web-sourced candidates blocked by threat detection).

- Emergency / Safe Mode
  - Safe-mode can be triggered automatically by thresholds (e.g., >N suspicious events in T minutes) or manually via admin UI.
  - In safe-mode: disable `lumi-log-assistant` merges, disable web-fetcher, stop scheduled merges, and require curator-only acceptance for staging.

Operational policies and UX

- Opt-in model
  - Separate toggles for: (A) Auto-learning (passive capture), (B) Web access. Default OFF for both.
  - Provide clear consent dialog and a short privacy summary describing what will be stored, for how long, and where.

- Transparency in UI
  - Show provenance badge on answers that came from KB / web / assistant.
  - Allow user to inspect raw source (URL, fetch snippet, validator score) before accepting to canonical KB.

Testing, verification, and CI

- Unit tests
  - Tests for `input_validation`, `threat_detection`, and `sanitizer` modules with known-malicious and benign inputs.

- Fuzzing
  - Fuzz IPC payloads, web fetch responses, and file imports to find parsing and injection bugs.

- Pen testing
  - Periodic pen tests and red-team exercises focusing on prompt-injection, IPC spoofing, and web-fetch abuses.

Developer checklist (practical tasks)

1. Create `docs/security/` with ruleset and examples. (task created)
2. Implement `src/security/input_validation.ts` and integrate into all IPC handlers. (task created)
3. Implement `src/security/threat_detection.ts` (rules + heuristics). (task created)
4. Implement `src/security/sanitizer.ts`. (task created)
5. Build sandboxed web-fetch worker as a child process; do not allow FS access. (task created)
6. Add HMAC-per-line to `training/training.jsonl` and verify on startup.
7. Add Safe-mode toggle + admin actions in `src/main.ts` and a secure UI surface in renderer.
8. Add monitoring alerts for spikes and automated safe-mode triggers.

Appendices

- Example IPC schema (JSON Schema) — place under `docs/security/schemas/`.
- Example audit-line format (JSONL):
  {"id":"uuid","ts":"2026-01-25T12:00:00Z","actor":"renderer","source":"user_mark_helpful","payload_hash":"sha256:...","hmac":"...","meta":{...}}

References & further reading
- OWASP ASVS, OWASP Top 10 for Web and Mobile
- NIST SP 800-53 control set (select controls for local apps)
- Chrome/Electron security guides (CSP, contextIsolation, disableRemoteModule)

---
Document created: 2026-01-25 — recommended next step: implement `input_validation` and `threat_detection` prototypes and wire them into IPC handlers.
