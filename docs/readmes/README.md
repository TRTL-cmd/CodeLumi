# README moved

This README has been consolidated into the single organized docs folder.

See: docs/organized/readmes/README.md

## The Vision

```
┌─────────────────────────────────────────────────────────────┐
│                    THE CODELUMI ECOSYSTEM                        │
│                                                              │
│                      MAIN LUMI (Cloud)                       │
│                    ┌───────────────────┐                     │
│                    │  Aggregates all   │                     │
│                    │  learning patterns│                     │
│                    │  Fine-tunes model │                     │
│                    └─────────┬─────────┘                     │
│                              │                               │
│              ┌───────────────┼───────────────┐               │
│              ▼               ▼               ▼               │
│         LOCAL LUMI      LOCAL LUMI      LOCAL LUMI           │
│         (User A)        (User B)        (User C)             │
│              │               │               │               │
│              └───────────────┴───────────────┘               │
│                              │                               │
│                    Patterns flow UP (opt-in)                 │
│                    Improvements flow DOWN                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**The Learning Loop:**
1. Thousands of Local Codelumis collect usage patterns
2. Patterns flow to Main Codelumi (opt-in, anonymized)
3. Main Codelumi aggregates: "When users ask X, Y works best"
4. Main Codelumi fine-tunes the model
5. Improved model pushed to all Local Codelumis
6. Everyone gets smarter
7. **Repeat forever**

---

## Quick Start

```powershell
# 1. Install Ollama (download from https://ollama.ai)
ollama pull llama3

# 2. Start Ollama
ollama serve

# 3. In another terminal, start Codelumi
cd C:\Users\Chris\OneDrive\Desktop\Codelumi
npm install
npm run dev          # Terminal 2
npm run dev:electron # Terminal 3
```

**Test it:** Ask Codelumi "What color is the sky?" — she should respond intelligently.

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[CODELUMI_MASTER_PLAN.md](CODELUMI_MASTER_PLAN.md)** | Complete architecture and vision |
| **[CODELUMI_ROADMAP.md](CODELUMI_ROADMAP.md)** | Timeline, milestones, and checklist |
| **[CODELUMI_ARCHITECTURE.md](CODELUMI_ARCHITECTURE.md)** | Technical architecture details |
| **[CODELUMI_DEVELOPMENT.md](CODELUMI_DEVELOPMENT.md)** | Development workflow and commands |

---

## Current Progress: ~50% Complete (snapshot: Jan 23, 2026)

```
Phase 1 - Local MVP:     ████████████████░░░░ 70%  (in-progress)
Phase 2 - Cloud Backend: ░░░░░░░░░░░░░░░░░░░░  0%
Phase 3 - Web Frontend:  ░░░░░░░░░░░░░░░░░░░░  0%
Phase 4 - Federated:     ░░░░░░░░░░░░░░░░░░░░  0%
Phase 5 - Production:    ░░░░░░░░░░░░░░░░░░░░  0%
```

**Update (2026-01-24):** Offline reliability improvements added — Lumi can now answer from a local KB when Ollama is unavailable (`thinkLocal` + `lumi-think-local` IPC). A runtime `Reload KB` action and merge/inspection scripts were added to manage KB entries without restarting the app. Next steps: threshold calibration and UI offline indicator.

**Decision logic (2026-01-24):** BM25 + reranker decision layer implemented in `src/core/memory/kb.ts`. Threshold calibrated to `0.60` for initial testing. Added helper scripts: `scripts/test_search_decision.js`, `scripts/extract_candidates.js`, and `scripts/telemetry_dashboard.js` to validate behavior and extract learning candidates.

---

## Project Structure

```
lumi/
├── src/
│   ├── main.ts              # Electron main process
# README moved

This README has been consolidated into the single organized docs folder. The project name is now "Lumi" (local assistant) — formerly Codelumi/Kira.

See: docs/organized/readmes/README.md

## The Vision

```
┌─────────────────────────────────────────────────────────────┐
│                        THE LUMI ECOSYSTEM                    │
│                                                              │
│                      MAIN LUMI (Cloud)                       │
│                    ┌───────────────────┐                     │
│                    │  Aggregates all   │                     │
│                    │  learning patterns│                     │
│                    │  Fine-tunes model │                     │
│                    └─────────┬─────────┘                     │
│                              │                               │
│              ┌───────────────┼───────────────┐               │
│              ▼               ▼               ▼               │
│         LOCAL LUMI      LOCAL LUMI      LOCAL LUMI           │
│         (User A)        (User B)        (User C)             │
│              │               │               │               │
│              └───────────────┴───────────────┘               │
│                              │                               │
│                    Patterns flow UP (opt-in)                 │
│                    Improvements flow DOWN                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**The Learning Loop:**
1. Thousands of Local Lumis collect usage patterns
2. Patterns flow to Main Lumi (opt-in, anonymized)
3. Main Lumi aggregates: "When users ask X, Y works best"
4. Main Lumi fine-tunes the model
5. Improved model pushed to all Local Lumis
6. Everyone gets smarter
7. **Repeat with consent**

---

## Quick Start

```powershell
# 1. Install Ollama (download from https://ollama.ai)
ollama pull llama3

# 2. Start Ollama
ollama serve

# 3. In another terminal, start Lumi
cd C:\Users\Chris\OneDrive\Desktop\Lumi
npm install
npm run dev
# Terminal 2
npm run dev:electron # Terminal 3
```

**Test it:** Ask Lumi "What color is the sky?" — she should respond intelligently.

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[CODELUMI_MASTER_PLAN.md](CODELUMI_MASTER_PLAN.md)** | Complete architecture and vision |
| **[CODELUMI_ROADMAP.md](CODELUMI_ROADMAP.md)** | Timeline, milestones, and checklist (includes Autonomy summary) |
| **[CODELUMI_ARCHITECTURE.md](CODELUMI_ARCHITECTURE.md)** | Technical architecture details |
| **[CODELUMI_DEVELOPMENT.md](CODELUMI_DEVELOPMENT.md)** | Development workflow and commands |

---

## Current Progress: ~50% Complete (snapshot: Jan 23, 2026)

```
Phase 1 - Local MVP:     ████████████████░░░░ 70%  (in-progress)
Phase 2 - Cloud Backend: ░░░░░░░░░░░░░░░░░░░░  0%
Phase 3 - Web Frontend:  ░░░░░░░░░░░░░░░░░░░░  0%
Phase 4 - Federated:     ░░░░░░░░░░░░░░░░░░░░  0%
Phase 5 - Production:    ░░░░░░░░░░░░░░░░░░░░  0%
```

---

## Project Structure

```
lumi/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   ├── renderer.tsx         # Main UI (was Codelumibegin)
│   ├── core/                # Core modules
│   │   ├── llm/ollama.ts    # Ollama client
│   │   ├── brain/index.ts   # Brain orchestrator
│   │   └── learning/        # Signal detection
│   └── brain/index.js       # Planner prototype
├── models/                  # Trained models
├── training/                # Training data
├── tools/                   # Build/train scripts
└── docs/                    # Documentation
```

---

## License

MIT License

**Built with ❤️ for developers who value privacy and community.**
