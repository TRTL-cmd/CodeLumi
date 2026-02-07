# ARCHIVE: CODELUMI_QUICK_REFERENCE.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/CODELUMI_QUICK_REFERENCE.md

---

## What is Codelumi?

**Autonomous, self-learning AI coding assistant** that:
- Runs **locally** (100% private)
- Uses **real LLM** (Ollama/Llama)
- Learns **automatically** (no "was I helpful?" prompts)
- Gets **smarter** via federated learning (opt-in)

---

## The Architecture

```
┌────────────────────────────────────────────────────────┐
│  USER INPUT                                            │
│       │                                                │
│       ▼                                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │  CODELUMI'S BRAIN (Your Code)                       │  │
│  │  • Retrieves context from memory                │  │
│  │  • Constructs optimal prompt                    │  │
│  │  • Manages conversation history                 │  │
│  │  • Detects learning signals                     │  │
│  └──────────────────────┬──────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │  OLLAMA (Base Intelligence)                     │  │
│  │  • Llama 3 / Mistral / CodeLlama               │  │
│  │  • Already knows everything                     │  │
│  │  • Runs 100% locally                           │  │
│  └──────────────────────┬──────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  RESPONSE + AUTOMATIC SIGNAL DETECTION                │
└────────────────────────────────────────────────────────┘
```

---

## Key Insight

**You don't build intelligence.** You build the system around existing intelligence.

| Component | Source | Your Effort |
|-----------|--------|-------------|
| Core intelligence | Llama/Mistral | 0 |
| Memory system | Your code | Medium |
| Signal detection | Your code | Medium |
| Federated learning | Your code | High |

---

## Automatic Learning

No "was I helpful?" prompts. Detect signals automatically:

| Signal | Detection | Confidence |
|--------|-----------|------------|
| Code ran | Execute it | 85% |
| User copied | Clipboard event | 80% |
| User thanked | Text detection | 70% |
| User repeated question | Similarity check | 90% |
| User said "wrong" | Text detection | 95% |

---

## Current Progress: ~20%

```
Phase 1 (Local MVP):  ████████████░░░░░░░░ 60%
Phase 2 (Cloud):      ░░░░░░░░░░░░░░░░░░░░  0%
Phase 3 (Web):        ░░░░░░░░░░░░░░░░░░░░  0%
Phase 4 (Federated):  ░░░░░░░░░░░░░░░░░░░░  0%
Phase 5 (Launch):     ░░░░░░░░░░░░░░░░░░░░  0%
```

**Next:** Integrate Ollama

---

## Quick Start

```powershell
# 1. Install Ollama (ollama.ai)
ollama pull llama3

# 2. Start Ollama
ollama serve

# 3. Start Codelumi
npm run dev          # Terminal 2
npm run dev:electron # Terminal 3
```

---

## Files to Create

```
src/core/llm/ollama.ts     ← Ollama client
src/core/brain/index.ts    ← Brain orchestrator
+ Update main.ts           ← IPC handlers
+ Update preload.ts        ← Expose methods
```

---

## Timeline

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 1 | 8 weeks | Local MVP v1.0 |
| Phase 2 | 8 weeks | Cloud API |
| Phase 3 | 6 weeks | Web UI |
| Phase 4 | 6 weeks | Federated |
| Phase 5 | 8 weeks | 🚀 Launch |

**Total:** ~9 months

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CODELUMI_MASTER_PLAN.md` | Full vision and architecture |
| `CODELUMI_ROADMAP.md` | Step-by-step checklist |
| `CODELUMI_ARCHITECTURE.md` | Technical details |
| `CODELUMI_DEVELOPMENT.md` | Dev workflow |

---

## Do This Today

```powershell
ollama pull llama3
ollama serve
# Create src/core/llm/ollama.ts
# Create src/core/brain/index.ts
# Test: "What color is the sky?"
```

---

**Once Ollama works, Codelumi has real intelligence. Build from there.**
