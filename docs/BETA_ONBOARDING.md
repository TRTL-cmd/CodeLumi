# Lumi Beta Onboarding (Quick Start)

This guide prepares a machine to run Lumi's autonomous learning and collect useful logs for beta testing.

Prerequisites
- Node.js (16+)
- npm
- Ollama (recommended for extraction): https://ollama.ai

Steps

1. Install Ollama (recommended)
   - Download from https://ollama.ai and install.
   - Pull a model (example):

```powershell
ollama pull qwen2.5-coder:7b
```

2. Start Ollama server

```powershell
ollama serve
```

Default host: `http://localhost:11434`. If running elsewhere, set `OLLAMA_HOST` env var.

3. Install dependencies and build

```bash
npm install
npx tsc -p tsconfig.json
```

4. Run Lumi (development)

```bash
npm run dev:electron
```

5. Toggle Self-Learn in the UI
- Open the app UI and click the `Self‑Learn` toggle to `On`.
- Or edit `userData/selflearn_config.json` and set `enabled: true` then restart the app.

6. Run a one-off self-learn now (developer console)
- In DevTools console or via preload API: `window.lumi.selflearn.runNow()`

7. Collect logs for debugging
- App logs: terminal where `npm run dev:electron` was started.
- User data artifacts: `userData/self-learn/*`, `userData/security/*`, and `userData/lumi_knowledge.json`.

Disabling Self-Learn
- Use the UI toggle, or set `userData/selflearn_config.json` `enabled: false` and restart.

Privacy & Backup Files
- Some `.backup.redact.*.bak` files may contain original absolute paths for forensic backup. Decide whether to finalize redaction before wide beta. See `docs/readmes/LUMI_MASTER_PLAN_UPDATE.md` for policy.

Reporting Issues
- When reporting a bug, attach:
  - Terminal logs from the app run
  - `userData/self-learn/selflearn_audit.jsonl` and `userData/security/validation.jsonl`
  - The zipped output of `scripts/collect_logs.ps1` if available

Contact
- Provide feedback to the engineering lead or open issues in the repo.
