# ARCHIVE: CODELUMI_COMPLETE_MASTER_PLAN.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/CODELUMI_COMPLETE_MASTER_PLAN.md

**Last Updated:** January 2026  
**Status:** Phase 1 In Progress (~20% Complete)

---

# TABLE OF CONTENTS

1. [Vision & Goals](#part-1-vision--goals)
2. [Core Architecture](#part-2-core-architecture)
3. [How Intelligence Works](#part-3-how-intelligence-works)
4. [How Learning Works](#part-4-how-learning-works)
5. [Federated Learning](#part-5-federated-learning)
6. [Products & Revenue](#part-6-products--revenue)
7. [Competitive Position](#part-7-competitive-position)
8. [Risks & Mitigations](#part-8-risks--mitigations)
9. [Timeline & Phases](#part-9-timeline--phases)
10. [Technology Stack](#part-10-technology-stack)

---

# PART 1: VISION & GOALS

## The End State

Codelumi is a fully autonomous, self-learning AI coding assistant where:

```
USER: "Build me a full-stack React app with authentication"

CODELUMI:
├── Understands the request
├── Plans the steps
├── Generates working code
├── Tests it automatically
├── Learns from the result
└── Gets better at similar tasks

NO MANUAL FEEDBACK NEEDED.
```

## Core Principles

### 1. Local First, Cloud Optional
- Everything works offline
- Cloud features are opt-in
- Users control their data

### 2. Real Intelligence, Not a Toy
- Uses production LLMs (Llama 3, Mistral)
- Can answer any question
- Can code in any language

### 3. Learns Automatically
- Detects quality signals from behavior
- No annoying feedback prompts
- Improves continuously

### 4. Community-Powered Improvement
- Federated learning from all users
- Everyone benefits from collective knowledge
- Privacy preserved through anonymization

---

# PART 2: CORE ARCHITECTURE

## The Key Insight

**You don't build intelligence from scratch. You build the system around existing intelligence.**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CODELUMI = TWO PARTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PART 1: Base Intelligence (NOT your code)                      │
│  ─────────────────────────────────────────                      │
│  Source: Llama 3 / Mistral / CodeLlama via Ollama               │
│                                                                  │
│  Already knows:                                                  │
│  • How to code in every programming language                    │
│  • General knowledge (what color is the sky)                    │
│  • How to reason and explain                                    │
│  • How to follow instructions                                   │
│                                                                  │
│  Cost: $0 (open source, runs locally)                           │
│  Effort: 0 (download and run)                                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PART 2: Codelumi's Brain (YOUR code)                               │
│  ────────────────────────────────                               │
│                                                                  │
│  You build:                                                      │
│  • Orchestration layer (calls LLM with context)                 │
│  • Memory system (remembers conversations)                      │
│  • Signal detection (automatic learning)                        │
│  • Federated learning (contribution to Main Codelumi)               │
│  • Personality and specialization                               │
│  • UI and user experience                                        │
│                                                                  │
│  This is where YOUR value is.                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## System Flow

```
USER INPUT
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CODELUMI'S BRAIN                              │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   Context    │   │    Prompt    │   │   Response   │        │
│  │  Retriever   │──▶│  Constructor │──▶│  Processor   │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│         │                                      │                 │
│         │          ┌──────────────┐           │                 │
│         └─────────▶│    Memory    │◀──────────┘                 │
│                    │    System    │                              │
│                    └──────────────┘                              │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OLLAMA (LLM Runtime)                        │
│                                                                  │
│                 Llama 3 / Mistral / CodeLlama                   │
│              Runs 100% locally on your machine                   │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                        RESPONSE
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SIGNAL DETECTION                             │
│                                                                  │
│  Automatic checks (no user prompts):                            │
│  ✓ Did code execute successfully?                               │
│  ✓ Did user copy the response?                                  │
│  ✓ Did user say "thanks" or "wrong"?                           │
│  ✓ Did user ask the same question again?                       │
│                                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING PIPELINE                             │
│                                                                  │
│  Positive signal → Store as good pattern                        │
│  Negative signal → Flag for improvement                         │
│  If opted in → Queue for federated contribution                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

| Component | Location | Purpose |
|-----------|----------|---------|
| Ollama Client | `src/core/llm/ollama.ts` | Communicate with local LLM |
| Brain | `src/core/brain/index.ts` | Orchestrate everything |
| Memory | `src/core/memory/db.ts` | Store conversations, knowledge |
| Signal Detector | `src/core/learning/signals.ts` | Detect quality automatically |
| Planner | `src/brain/index.js` | Multi-step task planning |
| UI | `src/Codelumibegin.tsx` | User interface |

---

# PART 3: HOW INTELLIGENCE WORKS

## Where Intelligence Comes From

| What | Source | Your Effort |
|------|--------|-------------|
| Knows how to code | Base LLM (Llama/Mistral) | 0 |
| Knows general facts | Base LLM | 0 |
| Can reason | Base LLM | 0 |
| Remembers conversations | Your memory system | Medium |
| Learns user preferences | Your signal detection | Medium |
| Gets smarter over time | Federated learning | High |
| Has personality | Your prompts | Low |

## What the Base LLM Already Knows (Day 1)

```
✓ "What color is the sky?" → "The sky appears blue..."
✓ "Write Python to reverse a string" → def reverse(s): return s[::-1]
✓ "Explain React hooks" → "Hooks are functions that let you..."
✓ "Build me a todo app" → [Complete working code]
✓ "Debug this error" → [Analyzes and fixes]

Codelumi can do ALL of this immediately with Ollama.
No training needed. No data collection. Just works.
```

## What Your Code Adds

```
CONTEXT AWARENESS:
"You asked about React yesterday, so I'll frame this in React terms"

PERSONALIZATION:
"You prefer concise answers, so I'll keep it brief"

MEMORY:
"Your project uses TypeScript, so I'll use TypeScript"

LEARNING:
"Last time I explained this poorly, let me try differently"

PERSONALITY:
"Here's your code! 💜 Let me know if you need changes!"
```

---

# PART 4: HOW LEARNING WORKS

## The Problem with Manual Feedback

```
TRADITIONAL APPROACH (Bad):
┌──────────────────────────────────┐
│ Was this response helpful?       │
│                                  │
│     👍 Yes    👎 No              │
│                                  │
└──────────────────────────────────┘

PROBLEMS:
• Annoying to users (fatigue)
• Low response rate (~5%)
• Biased (only strong opinions respond)
• Interrupts flow
```

## Codelumi's Approach: Automatic Signal Detection

```
CODELUMI'S APPROACH (Good):
┌──────────────────────────────────────────────────────────────┐
│                    INVISIBLE DETECTION                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  POSITIVE SIGNALS (Learn from these):                        │
│  ────────────────────────────────────                        │
│  ✓ Code executed without errors → 85% confidence             │
│  ✓ User copied the response → 80% confidence                 │
│  ✓ User said "thanks" or "perfect" → 70% confidence          │
│  ✓ No follow-up question needed → 60% confidence             │
│  ✓ Tests passed → 90% confidence                             │
│                                                               │
│  NEGATIVE SIGNALS (Learn to avoid):                          │
│  ──────────────────────────────────                          │
│  ✗ User repeated the same question → 90% confidence          │
│  ✗ User said "wrong" or "doesn't work" → 95% confidence      │
│  ✗ Code threw an error → 85% confidence                      │
│  ✗ User corrected Codelumi → 95% confidence (GOLD)               │
│  ✗ User immediately left → 40% confidence                    │
│                                                               │
│  NO PROMPTS. NO INTERRUPTIONS. 100% COVERAGE.                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## What Can Be Automated vs What Can't

| Category | Automatable? | How |
|----------|--------------|-----|
| Code syntax valid | ✅ Yes | Parse/compile |
| Code executes | ✅ Yes | Run it |
| Tests pass | ✅ Yes | Run tests |
| User copied code | ✅ Yes | Clipboard event |
| User sentiment | ✅ Mostly | Text detection |
| Repeat question | ✅ Yes | Similarity check |
| "Was this clear?" | ⚠️ Partially | Infer from follow-ups |
| "Was this helpful?" | ⚠️ Partially | Infer from behavior |
| Code is correct (no tests) | ❌ Hard | Need verification |
| Response is appropriate | ❌ Hard | Context-dependent |

**Key insight:** ~40% of learning can be fully automated. The rest comes from behavioral inference.

---

# PART 5: FEDERATED LEARNING

## The Improvement Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEEKLY IMPROVEMENT CYCLE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WEEK 1: Collection                                              │
│  ─────────────────                                               │
│  • 10,000 Local Codelumis are used daily                            │
│  • Each detects signals automatically                           │
│  • Patterns extracted: "Question type X → Answer style Y"       │
│                                                                  │
│  WEEK 2: Contribution (opt-in only)                              │
│  ──────────────────────────────────                              │
│  • Users who opted in: patterns sent to Main Codelumi               │
│  • Anonymized: no raw code, no PII, no file paths               │
│  • Quality filtered: only high-confidence patterns              │
│                                                                  │
│  WEEK 3: Aggregation & Training                                  │
│  ──────────────────────────────                                  │
│  • Main Codelumi combines patterns from thousands of users          │
│  • Discovers: "For React hooks questions, approach X works"     │
│  • Fine-tunes model using LoRA (efficient)                      │
│                                                                  │
│  WEEK 4: Distribution                                            │
│  ────────────────────                                            │
│  • Improved model pushed to all Local Codelumis                     │
│  • Even non-contributors benefit                                 │
│  • Cycle repeats forever                                         │
│                                                                  │
│  RESULT: Codelumi gets smarter every week.                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Privacy Tiers

Users choose their level:

| Tier | Name | Shares | Receives | Perks |
|------|------|--------|----------|-------|
| 0 | Isolated | Nothing | Nothing | Full privacy |
| 1 | Receiver | Nothing | Updates | Free updates |
| 2 | Anonymous | Signals only | Priority updates | Badge |
| 3 | Full | Q&A patterns | Early access | Voting rights |

## What Gets Shared (Tier 3)

```
SAFE TO SHARE:
✓ "Question about React hooks" → "Explanation approach that worked"
✓ "Code execution: success/failure"
✓ "User sentiment: positive/negative"
✓ Generic programming patterns (anonymized)

NEVER SHARED:
✗ Raw user code
✗ File paths
✗ API keys or credentials
✗ Personally identifiable information
✗ Proprietary business logic
```

---

# PART 6: PRODUCTS & REVENUE

## Product Lineup

| Product | Description | Price | Platform |
|---------|-------------|-------|----------|
| **Codelumi Local Free** | Desktop app, offline, community model | $0 | Win/Mac/Linux |
| **Codelumi Local Pro** | + Priority updates, premium models | $10/mo or $100 once | Desktop |
| **Codelumi Cloud Free** | Web interface, 50 msgs/day | $0 | Web |
| **Codelumi Cloud Plus** | 1000 msgs/day, history | $20/mo | Web |
| **Codelumi Cloud Pro** | Unlimited, API access | $50/mo | Web |
| **Codelumi API** | For developers | Usage-based | API |

## Revenue Projections

| Year | Users | Monthly Revenue | Annual Revenue |
|------|-------|-----------------|----------------|
| Year 1 | 10K | $20K | $240K |
| Year 2 | 50K | $150K | $1.8M |
| Year 3 | 200K | $500K | $6M |

## Cost Structure

| Phase | Infrastructure | Notes |
|-------|----------------|-------|
| Local MVP | $0/mo | Users run locally |
| Cloud Backend | $100-500/mo | API server + DB |
| Production | $2K-10K/mo | GPU inference |

---

# PART 7: COMPETITIVE POSITION

## vs ChatGPT/Claude

| Aspect | ChatGPT/Claude | Codelumi |
|--------|----------------|------|
| Privacy | Your data on their servers | Local first |
| Cost | $20/mo minimum | Free tier + local |
| Customization | Same for everyone | Learns your style |
| Improvement | Closed, opaque | Community-driven |
| Offline | No | Yes |
| Data ownership | Theirs | Yours |

## Competitive Advantages

### 1. Privacy Moat
Big tech **cannot** offer true local-first. Their business model requires your data.

### 2. Community Network Effect
More users → More patterns → Better model → More users  
But users own their data and choose to contribute.

### 3. Cost Structure
Users pay for their own local compute. You only pay for cloud users.

### 4. Trust
Open about what's collected. Users see exactly what's shared.

---

# PART 8: RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Ollama too slow | Low | Medium | Cloud fallback, prompt optimization |
| Bad training data | Medium | High | Quality filters, human sampling |
| Privacy breach | Low | Critical | No raw code, aggressive anonymization |
| Competition | Medium | Medium | Focus on privacy niche |
| Solo dev burnout | Medium | High | Ship MVP first, strict scope |
| User acquisition | Medium | High | Community building, content |
| Legal/compliance | Medium | Medium | Clear terms, GDPR compliance |

---

# PART 9: TIMELINE & PHASES

## Overview

| Phase | Duration | Goal | Status |
|-------|----------|------|--------|
| Phase 1 | 8 weeks | Local MVP | 🟡 60% |
| Phase 2 | 8 weeks | Cloud Backend | ⬜ 0% |
| Phase 3 | 6 weeks | Web Frontend | ⬜ 0% |
| Phase 4 | 6 weeks | Federated Learning | ⬜ 0% |
| Phase 5 | 8 weeks | Production Launch | ⬜ 0% |
| **Total** | **~9 months** | **Public Launch** | **~20%** |

## Current Status

```
COMPLETED:
✅ Electron app shell
✅ React UI with chat and avatar
✅ IPC persistence (save/load)
✅ Brain stubs (plan/simulate/execute)
✅ Training data export pipeline
✅ Python reranker trained
✅ Dev workflow (Vite + Electron)

IN PROGRESS:
🔄 Ollama integration (PRIORITY)
🔄 Real memory system

NEXT:
⬜ Signal detection
⬜ Full brain with LLM
⬜ Polish and release v1.0
```

---

# PART 10: TECHNOLOGY STACK

## Local App

| Layer | Technology |
|-------|------------|
| Framework | Electron |
| UI | React + TypeScript |
| Build | Vite |
| 3D Avatar | Three.js |
| Storage | IndexedDB (Dexie) |
| LLM | Ollama |

## Cloud (Future)

| Layer | Technology |
|-------|------------|
| API | FastAPI (Python) |
| Database | PostgreSQL |
| Cache | Redis |
| Vector Store | Qdrant |
| GPU Inference | vLLM or TGI |

## Training

| Component | Technology |
|-----------|------------|
| Framework | PyTorch |
| Fine-tuning | LoRA / QLoRA |
| Embeddings | sentence-transformers |

---

# NEXT IMMEDIATE STEP

```powershell
# Do this TODAY:
ollama pull llama3
ollama serve

# Then create:
# src/core/llm/ollama.ts
# src/core/brain/index.ts

# Once working, Codelumi has REAL intelligence.
```

---

**The vision is clear. The architecture is sound. Now execute.**
