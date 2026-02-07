# ARCHIVE: CODELUMI_ROADMAP.md

This roadmap has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/roadmaps/CODELUMI_ROADMAP.md

**Current Progress:** ~55% Complete (Step ~70 of 130)  
**Last Updated:** Jan 24, 2026

## Recent completions (2026-01-24)

- Implemented decision logic for KB-first: `searchKBWithDecision()` in `src/core/memory/kb.ts` (BM25 + reranker fallback).
- Added `thinkLocal` (KB-only synth) and `lumi-think-local` IPC for offline KB answers.
- Added runtime `Reload KB` (`lumi-kb-reload`) and a `Reload KB` UI hook to refresh in-memory KB.
- Added test and utility scripts: `scripts/test_search_decision.js`, `scripts/extract_candidates.js`, and `scripts/telemetry_dashboard.js`.
- Merged `training/lumi_knowledge.json` into `training/training.jsonl` (153 entries) and added safe merge tooling.


---

## OVERVIEW

| Phase | Steps | Duration | Status |
|-------|-------|----------|--------|
| Phase 1: Local MVP | 1-48 | 8 weeks | 🟢 70% |
| Phase 2: Cloud Backend | 49-72 | 8 weeks | ⬜ 0% |
| Phase 3: Web Frontend | 73-92 | 6 weeks | ⬜ 0% |
| Phase 4: Federated | 93-110 | 6 weeks | ⬜ 0% |
| Phase 5: Production | 111-130 | 8 weeks | ⬜ 0% |

---

## PHASE 1: LOCAL MVP
## Goal: Desktop app with real AI that works offline
## Status: 🟢 70% Complete (in-progress)

---

### Sprint 1: Ollama Integration (Steps 1-12) ⬅️ CURRENT

**Goal:** Give Codelumi real intelligence

```
Week 1: Setup & Connection
─────────────────────────────────────────────────────────────

[ ] Step 1: Install Ollama
    Download from https://ollama.ai and install

[ ] Step 2: Pull a model
    ollama pull llama3
    (or: ollama pull codellama for coding focus)

[ ] Step 3: Test Ollama works
    ollama run llama3 "What color is the sky?"
    
[ ] Step 4: Start Ollama server
    ollama serve
    (Keep this running in background)

Week 1: Create Ollama Client
─────────────────────────────────────────────────────────────

[ ] Step 5: Create folder structure
    mkdir src\core\llm
    mkdir src\core\brain

[ ] Step 6: Create src/core/llm/ollama.ts
    - generate(prompt) method
    - chat(messages) method
    - isAvailable() method
    - generateStream() for streaming

[ ] Step 7: Test ollama.ts works
    - Write a simple test
    - Verify can connect to Ollama

[ ] Step 8: Add error handling
    - Handle Ollama not running
    - Handle network errors

Week 2: Create Brain Module
─────────────────────────────────────────────────────────────

[ ] Step 9: Create src/core/brain/index.ts
    - think(message) method
    - Conversation history array
    - System prompt for Codelumi's personality

[ ] Step 10: Add IPC handler in main.ts
    ipcMain.handle('lumi-think', ...)

[ ] Step 11: Update preload.ts
    think: (msg) => ipcRenderer.invoke('lumi-think', msg)

[ ] Step 12: Wire UI to new brain
    Update generateResponse in Codelumibegin.tsx

✓ MILESTONE: Codelumi answers "What color is the sky?" intelligently
```

---

### Sprint 2: Memory System (Steps 13-24)

**Goal:** Codelumi remembers conversations and context

```
Week 3: IndexedDB Setup
─────────────────────────────────────────────────────────────

[ ] Step 13: Install dependencies
    npm install dexie uuid

[ ] Step 14: Create src/core/memory/db.ts
    - Define Dexie database
    - Episodes table (conversations)
    - Knowledge table (learned patterns)

[ ] Step 15: Create memory schema
    interface Episode {
      id: string;
      type: 'conversation' | 'event';
      content: string;
      timestamp: number;
      embedding?: number[];
    }

[ ] Step 16: Test database operations
    - Add episode
    - Retrieve episodes
    - Search by time

Week 4: Memory Integration
─────────────────────────────────────────────────────────────

[ ] Step 17: Create memory.remember(event) method

[ ] Step 18: Create memory.recall(query) method

[ ] Step 19: Wire brain to use memory
    - Load recent history on start
    - Save conversations automatically

[ ] Step 20: Add context to prompts
    Include relevant past conversations in LLM context

[ ] Step 21: Test memory persistence
    - Restart app
    - Verify conversations remembered

[ ] Step 22: Add conversation search
    - Search by keyword
    - Search by date

[ ] Step 23: Implement memory limits
    - Cap stored episodes
    - Prune old data

[ ] Step 24: Test context retrieval
    Ask about something from previous conversation

✓ MILESTONE: Codelumi remembers past conversations
```

---

### Sprint 3: Signal Detection (Steps 25-36)

**Goal:** Codelumi learns automatically without prompts

```
Week 5: Build Signal Detectors
─────────────────────────────────────────────────────────────

[ ] Step 25: Create src/core/learning/signals.ts

[ ] Step 26: Implement detectCodeExecution()
    - Extract code blocks from response
    - Run code (sandboxed)
    - Check for errors

[ ] Step 27: Implement detectUserCorrection()
    - Detect "wrong", "incorrect", "not right"
    - Detect "actually, it should be..."

[ ] Step 28: Implement detectRepeatQuestion()
    - Compare new question to recent questions
    - Flag if similarity > 70%

[ ] Step 29: Implement detectSentiment()
    - Detect "thanks", "perfect", "great"
    - Detect "wrong", "doesn't work"

[ ] Step 30: Add copy event detection
    document.addEventListener('copy', ...)

Week 6: Signal Storage & Processing
─────────────────────────────────────────────────────────────

[ ] Step 31: Create signal storage schema
    interface Signal {
      id: string;
      type: 'positive' | 'negative';
      source: string;
      confidence: number;
      timestamp: number;
    }

[ ] Step 32: Store signals with interactions

[ ] Step 33: Create signal analysis
    - Calculate success rate
    - Track improvement over time

[ ] Step 34: Wire signals to memory
    - Update knowledge quality scores
    - Adjust retrieval weights

[ ] Step 35: Implement correction handling
    brain.handleCorrection(wrong, correct)

[ ] Step 36: Test signal detection
    - Verify all signals detected
    - Check confidence scores

✓ MILESTONE: Codelumi learns from behavior automatically
```

---

### Sprint 4: Polish & Release (Steps 37-48)

**Goal:** Release Local MVP v1.0

```
Week 7: UI Improvements
─────────────────────────────────────────────────────────────

[ ] Step 37: Add "Ollama not running" warning
    - Check on startup
    - Show helpful message

[ ] Step 38: Add loading/thinking states
    - Show indicator while LLM generates
    - Stream response tokens

[ ] Step 39: Improve code block rendering
    - Syntax highlighting
    - Language detection

[ ] Step 40: Add copy button for code
    - One-click copy
    - Record copy signal

[ ] Step 41: Add conversation management
    - Clear history button
    - Export conversation

[ ] Step 42: Settings panel
    - Choose model (llama3, mistral, codellama)
    - Adjust parameters

Week 8: Testing & Release
─────────────────────────────────────────────────────────────

[ ] Step 43: Write unit tests
    - Brain tests
    - Memory tests
    - Signal tests

[ ] Step 44: Write integration tests
    - Full conversation flow
    - Signal detection flow

[ ] Step 45: Bug fixes

[ ] Step 46: Performance optimization
    - Memory usage
    - Response time

[ ] Step 47: Update documentation

[ ] Step 48: Package and release v1.0
    npm run package

✓ MILESTONE: Local MVP v1.0 Released
```

---

# PHASE 2: CLOUD BACKEND
## Goal: API for web service and federated learning
## Status: ⬜ Not Started

---

### Sprint 5-6: API Foundation (Steps 49-60)

```
[ ] Step 49: Create services/api/ directory
[ ] Step 50: Initialize FastAPI project
[ ] Step 51: Create Pydantic models (User, Conversation, Message)
[ ] Step 52: Set up PostgreSQL database
[ ] Step 53: Create SQLAlchemy ORM models
[ ] Step 54: Implement /auth/register endpoint
[ ] Step 55: Implement /auth/login endpoint (JWT)
[ ] Step 56: Create /chat POST endpoint
[ ] Step 57: Add WebSocket for streaming
[ ] Step 58: Implement conversation history
[ ] Step 59: Add rate limiting (Redis)
[ ] Step 60: Write API tests

✓ MILESTONE: Basic API working
```

---

### Sprint 7-8: Vector Store & Infra (Steps 61-72)

```
[ ] Step 61: Set up Qdrant (Docker)
[ ] Step 62: Create embedding service
[ ] Step 63: Implement semantic search
[ ] Step 64: Add RAG to /chat
[ ] Step 65: Index knowledge base
[ ] Step 66: Test retrieval quality
[ ] Step 67: Optimize performance (<200ms)
[ ] Step 68: Add caching
[ ] Step 69: Create Dockerfile
[ ] Step 70: Create docker-compose.yml
[ ] Step 71: Deploy to staging
[ ] Step 72: Set up monitoring (Sentry)

✓ MILESTONE: Cloud backend ready
```

---

# PHASE 3: WEB FRONTEND
## Goal: Web interface like claude.ai
## Status: ⬜ Not Started

---

### Sprint 9-10: Core UI (Steps 73-84)

```
[ ] Step 73: Create apps/web/ with Next.js
[ ] Step 74: Build chat message component
[ ] Step 75: Implement streaming display
[ ] Step 76: Add syntax highlighting
[ ] Step 77: Create conversation sidebar
[ ] Step 78: Implement dark/light theme
[ ] Step 79: Make responsive (mobile)
[ ] Step 80: Connect to backend API
[ ] Step 81: Create login/signup pages
[ ] Step 82: Implement OAuth (Google, GitHub)
[ ] Step 83: Create settings page
[ ] Step 84: Add conversation management

✓ MILESTONE: Web UI working
```

---

### Sprint 11: Marketing (Steps 85-92)

```
[ ] Step 85: Create landing page
[ ] Step 86: Create pricing page
[ ] Step 87: Set up documentation (Docusaurus)
[ ] Step 88: Write getting started guide
[ ] Step 89: SEO optimization
[ ] Step 90: Set up analytics
[ ] Step 91: Pre-launch checklist
[ ] Step 92: Alpha launch

✓ MILESTONE: Web alpha live
```

---

# PHASE 4: FEDERATED LEARNING
## Goal: Connect local users to cloud
## Status: ⬜ Not Started

---

### Sprint 12-13: Contribution System (Steps 93-104)

```
[ ] Step 93: Design contribution API
[ ] Step 94: Create anonymization pipeline
[ ] Step 95: Build quality filter
[ ] Step 96: Add contribution toggle in local app
[ ] Step 97: Show contribution preview
[ ] Step 98: Create privacy dashboard
[ ] Step 99: Test local → cloud flow
[ ] Step 100: Write privacy policy
[ ] Step 101: Set up GPU training
[ ] Step 102: Create aggregation job
[ ] Step 103: Implement weekly retraining
[ ] Step 104: Build evaluation pipeline

✓ MILESTONE: Contribution system working

---

## Autonomy Roadmap (summary)

The Brain Autonomy Roadmap defines a conservative, phased approach to introduce limited autonomy while preserving user control and privacy. See `docs/roadmaps/BRAIN_ROADMAP.md` for the detailed autonomy plan.

High-level phases:
- Foundations (auditability, plan provenance, dry-run simulation)
- Controlled Autonomy (Autonomy Controller, executor sandbox, undo/backup)
- Learning Loop & Aggregation (opt-in telemetry, export for retrain)
- Autonomous Assistants (opt-in assistant modes with strict consent and logging)

Next steps:
- Link Brain autonomy sections into release notes and README.
- Add a short 'Autonomy' entry to the project's top-level README and settings UX.

```

---

### Sprint 14: Distribution (Steps 105-110)

```
[ ] Step 105: Create model update API
[ ] Step 106: Implement differential updates
[ ] Step 107: Add update notification
[ ] Step 108: Test full cycle
[ ] Step 109: Monitor quality
[ ] Step 110: Launch private beta

✓ MILESTONE: Federated learning working
```

---

# PHASE 5: PRODUCTION
## Goal: Public launch
## Status: ⬜ Not Started

---

### Sprint 15-16: Scale (Steps 111-120)

```
[ ] Step 111: Set up GPU cluster
[ ] Step 112: Deploy vLLM
[ ] Step 113: Implement auto-scaling
[ ] Step 114: Add load balancer
[ ] Step 115: Optimize latency
[ ] Step 116: Cost optimization
[ ] Step 117: Integrate Stripe
[ ] Step 118: Create subscriptions
[ ] Step 119: Build billing dashboard
[ ] Step 120: Add team features

✓ MILESTONE: Production infrastructure ready
```

---

### Sprint 17-18: Launch (Steps 121-130)

```
[ ] Step 121: Build mobile app (Capacitor)
[ ] Step 122: Test iOS/Android
[ ] Step 123: Submit to app stores
[ ] Step 124: Final security audit
[ ] Step 125: Performance optimization
[ ] Step 126: Create launch materials
[ ] Step 127: Press outreach
[ ] Step 128: Migrate beta users
[ ] Step 129: Final checks
[ ] Step 130: 🚀 PUBLIC LAUNCH

✓ MILESTONE: Codelumi is live!
```

---

# IMMEDIATE NEXT ACTIONS

## Today

```powershell
# Install Ollama
# Download from https://ollama.ai and install

# Pull a model
ollama pull llama3

# Test it works
ollama run llama3 "What color is the sky?"

# Start the server (keep running)
ollama serve
```

## This Week

```
1. Create src/core/llm/ollama.ts
2. Create src/core/brain/index.ts
3. Update main.ts with IPC handler
4. Update preload.ts
5. Test: Ask "What color is the sky?"
```

## This Month

```
Week 1-2: Ollama integration complete
Week 3-4: Memory system
Week 5-6: Signal detection
Week 7-8: Polish and release v1.0
```

---

# COST REFERENCE

| Phase | Infrastructure | Notes |
|-------|----------------|-------|
| Local MVP | $0/mo | Users run locally |
| Cloud Backend | $50-200/mo | API + DB |
| Web Frontend | $50-100/mo | Hosting |
| Federated | $200-500/mo | GPU training |
| Production | $500-5000/mo | Scale with users |

**Total to launch:** ~$10K infrastructure (Year 1)

---

**Check off steps as you complete them. You've got this! 🚀**
