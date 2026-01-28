IP Action Plan — CodeLumi (Copyright & Trademark)

Purpose: concise action list and suggested deposit contents to protect core code and the automated self-learning components.

1) Which parts to prioritize for registration

- Automated self-learning subsystem: `src/selflearning/`, `src/core/learning/processor.ts`, `src/core/learning/knowledge-processor.ts`, `src/selflearning/safe-agent-deep.ts`.
- Core brain and orchestration: `src/core/brain/`, `src/core/llm/`.
- Memory and data pipelines: `src/core/memory/`, `src/core/security/` (if proprietary logic present).
- Key UI and expressive assets: `assets/models/`, `docs/branding/`, persona files.
 - Security architecture: add `docs/SECURITY_ARCHITECTURE.md` to the manifest as a high-level overview. Keep detailed threat models, secret-storage design, and encryption keys confidential (treat as trade secrets).

Third-party integrations (exclude from deposit)
------------------------------------------------
Be explicit about excluding third-party connectors, wrappers, or vendor-provided models from your copyright deposit and trademark claims. For example, the `src/core/llm/ollama.ts` file is a thin client for the external Ollama LLM and should be treated as a third-party integration.

Recommended handling:
- Do not claim third-party code or models as your original work. Exclude the actual third-party model weights, binaries, or licensed SDKs from your deposit.
- In the deposit ZIP, either remove or replace third-party connector code with a short stub file that documents the dependency and points to the upstream license (e.g., `THIRD_PARTY_NOTICE.txt`).
- Keep a `THIRD_PARTY_NOTICES.md` listing all third-party components and their licenses (e.g., Ollama client, GLTFLoader, npm packages). Include this file in the public repo and in the deposit package to show you are not claiming ownership of those parts.
- If a third-party component is lightly modified, document the modifications explicitly and keep the original license intact.

This approach ensures your registration focuses on original CodeLumi code (self-learning, core brain, memory, UI, assets) while avoiding claiming ownership over third-party systems.

2) Suggested deposit package for copyright registration

- A ZIP archive with:
  - `src/` (all source files)
  - `assets/` (models and persona assets)
  - `docs/` (README, brand, COPYRIGHT.md)
  - A short `manifest.txt` listing important files and a brief description of the automated self-learning module.
 
 Notes on security docs: include `docs/SECURITY_ARCHITECTURE.md` in the deposit to document high-level design, but exclude or redact specific secret-handling details and exact keys. Keep a private copy of the full security design for counsel.

3) Suggested manifest entry (sample text you can paste into registration form)

Title: CodeLumi — Automated self-learning and assistant software

Description: CodeLumi is a desktop assistant application combining a runtime orchestration layer, an automated self-learning pipeline (signal processing, knowledge extraction, staging/curation, and incremental KB updates), and a 3D persona. The automated self-learning subsystem (files under `src/selflearning/` and `src/core/learning/`) implements signal processing, candidate extraction, reranking, and staged curation for controlled knowledge ingestion and incremental updates to the application's knowledge base.

Authors: Tortol studios
Year: 2026

4) Practical steps to register (US example)

- Create the deposit ZIP and manifest.
- Use the U.S. Copyright Office online registration portal. Choose the category "Literary Work" or "Computer Program" depending on the system.
- For software, include source code where possible (or portions if you prefer partial deposits) and indicate the date of first publication (if applicable).

5) Trademark support (for `CodeLumi` and logo)

- Do a clearance search. If clear, prepare specimens (website screenshots, app listing) and file an application in desired jurisdictions.
- Work with an attorney for international coverage and enforcement strategy.

6) Patents (if applicable)

- If you believe the self-learning pipeline includes a novel, non-obvious technical invention (specific algorithmic approach), document it and contact a patent attorney before public disclosure.

7) Enforcement & monitoring

- Keep copies of releases and dated screenshots. Use watch services for trademark and copyright monitoring.
