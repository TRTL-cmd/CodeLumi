Security Architecture — Lumi

Purpose
-------
This document summarizes CodeLumi's security architecture at a high level for IP and filing purposes. Detailed implementation and secrets are intentionally omitted from public records and should be treated as trade secrets.

Scope
-----
- Covers components related to self-learning, signal processing, memory, staging/curation, and inter-process boundaries.
- Excludes low-level OS/network configuration and secrets storage locations (these are confidential).

High-level summary
------------------
Lumi is structured as an Electron desktop application with a hardened renderer process and a privileged main process. Key security-focused components:

- Signal Processor: ingests external signals (clipboard, user actions, integrations), normalizes and sanitizes inputs, extracts candidate knowledge.
- Knowledge Processor: validates, deduplicates, and formats candidate entries before persisting to the knowledge base (KB).
- Self-learning Agent: orchestrates scheduled scans, candidate selection, reranking, and interacts with the Staging Manager for human-in-the-loop curation.
- Staging Manager & Curator: workspace where suggested KB entries are reviewed, approved, rejected, or edited. Exposes narrow IPC endpoints for curator actions.
- MemoryStore: file-backed storage for memory entries and KB, accessed only via controlled APIs; supports encryption-at-rest when enabled.
- IPC / Preload Boundary: renderer-to-main communication is restricted via `preload` (contextBridge) APIs exposing only specific methods (e.g., `lumi.selflearn.*`, `lumi.memory*`).

Security controls (high level)
-----------------------------
- Input validation and sanitization: all external inputs run through `security/input_validation` and `security/threat_detection` modules before ingestion.
- Least-privilege IPC: renderer cannot access Node APIs directly; all file or system access is mediated by the main process APIs.
- Staging & curation workflow: learning outputs are staged and require explicit approval to enter the canonical KB.
- Audit logging: learning events, staging actions, and curator approvals are logged to a tamper-evident log in `userData`.
- Optional encryption: MemoryStore supports encrypted storage for sensitive user data (configure per deployment).
- Secrets handling: private keys, external API credentials, and model weights must never be committed to the public repo; store in secure vaults or OS-protected keystores.

Data flow (simplified)
----------------------
1. Signal ingestion → Signal Processor (sanitize, extract candidates)
2. Candidates → Knowledge Processor (normalize, dedupe, score)
3. Top candidates → Staging Manager (await curator review)
4. Curator approves → persisted to MemoryStore / KB
5. KB used by Brain modules and self-learning agent for future inference

Trade-secret and public disclosure guidance
-----------------------------------------
- Keep detailed threat models, exact heuristics, scoring weights, and training data confidential.
- For IP filings: include high-level architecture diagrams and descriptive manifest entries (see `docs/IP_ACTIONS.md`) but do not publish sensitive algorithms or secret storage locations.
- If necessary to include more detailed code for copyright deposit, keep the public-facing deposit minimal or arrange a confidential deposit with counsel.

Operational recommendations
---------------------------
- Rotate API keys and credentials regularly; do not commit them to VCS.
- Run periodic dependency scans and SCA (software composition analysis).
- Harden Electron configuration: enable contextIsolation, disable nodeIntegration in renderer, validate any remote content, and lock CSP headers.
- Limit telemetry and external network calls by default; require opt-in for external uploads.

Contact
-------
For security-related IP handling and licensing, contact: Tortolcoin@gmail.com
