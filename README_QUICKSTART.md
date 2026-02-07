# Lumi — Quick Start (Local MVP)

Prerequisites
- Node.js >=16
- npm
- Local LLM runtime (recommended: Ollama) with required models installed and available.

Install

```powershell
npm install
npx tsc
```

Run (development)

```powershell
npm run dev:electron
# or start the packaged app if available
npm start
```

Simulator (sanity checks)

```powershell
# runs the session simulator which writes archives to userData/sessions
node test/simulate_sessions.js

# run tokenizer unit test after building
node test/test_tokenizer.js
```

Notes
- The app uses `userData/` to persist session archives and config (`session_config.json`).
- Ensure your local LLM server (Ollama) is running and reachable if you rely on the `think()` backend.
- Curator UI is in the renderer: open the floating Self-Learn panel and click `Curator`.
