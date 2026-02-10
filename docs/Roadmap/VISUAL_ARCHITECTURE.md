# 🎨 LUMI - COMPLETE VISUAL ARCHITECTURE

**Last Updated:** February 10, 2026  
**Current Status:** Phase 1 complete (monitoring ongoing)  
**Vision:** From Desktop App to AGI

---

## 📑 TABLE OF CONTENTS

1. [Current State Architecture](#current-state-architecture)
2. [System Components](#system-components)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Future State (AGI)](#future-state-agi)
5. [Evolution Timeline](#evolution-timeline)
6. [Component Dependency Map](#component-dependency-map)

---

## 🏗️ CURRENT STATE ARCHITECTURE

### High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LUMI DESKTOP APP                             │
│                         (Electron)                                  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   RENDERER PROCESS (React + Vite)          │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │   Chat UI    │  │  Monaco Code │  │  Security    │    │   │
│  │  │   (DOM)      │  │   Sandbox    │  │  Curator     │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │  3D Avatar   │  │  Self-Learn  │  │  Settings    │    │   │
│  │  │  (Three.js)  │  │    Panel     │  │  & Memory    │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  │                                                            │   │
│  │  IPC API (window.lumi, window.codeSandbox)                │   │
│  └────────────────────────────┬───────────────────────────────┘   │
│                               │                                   │
│                    IPC BRIDGE (preload.ts)                        │
│                    contextBridge & ipcRenderer                    │
│                               │                                   │
│  ┌────────────────────────────┴───────────────────────────────┐   │
│  │                   MAIN PROCESS (Node.js)                   │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │              BRAIN ENGINE                        │     │   │
│  │  │  (src/core/brain/index.ts)                       │     │   │
│  │  │                                                  │     │   │
│  │  │  • think(prompt, options)                        │     │   │
│  │  │  • thinkChat(messages, options)                  │     │   │
│  │  │  • thinkStream(prompt, options, onChunk)         │     │   │
│  │  │  • KB context injection                          │     │   │
│  │  │  • Code context injection                        │     │   │
│  │  │  • Personality-tier-aware prompts                │     │   │
│  │  └────────────────────┬─────────────────────────────┘     │   │
│  │                       │                                   │   │
│  │  ┌────────────────────┴─────────────────────────────┐     │   │
│  │  │          PERSONALITY ENGINE                      │     │   │
│  │  │  (src/core/personality/PersonalityEngine.ts)     │     │   │
│  │  │                                                  │     │   │
│  │  │  • Sentiment analysis (3-tier weighted lexicon)  │     │   │
│  │  │  • Rapport tracking (-1.0 to +1.0)               │     │   │
│  │  │  • 5-tier quality system (0-4)                   │     │   │
│  │  │  • Mood management (6 moods)                     │     │   │
│  │  │  • Tone application (post-processing)            │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │          MEMORY SYSTEM                           │     │   │
│  │  │                                                  │     │   │
│  │  │  ┌────────────────┐  ┌────────────────────┐     │     │   │
│  │  │  │ MemoryStore    │  │ KnowledgeBase      │     │     │   │
│  │  │  │ (store.ts)     │  │ (kb.ts)            │     │     │   │
│  │  │  │                │  │                    │     │     │   │
│  │  │  │ • JSONL files  │  │ • BM25 search      │     │     │   │
│  │  │  │ • Conversations│  │ • Reranking        │     │     │   │
│  │  │  │ • Events       │  │ • Top-K retrieval  │     │     │   │
│  │  │  └────────────────┘  └────────────────────┘     │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │          SELF-LEARNING SYSTEM                    │     │   │
│  │  │                                                  │     │   │
│  │  │  ┌────────────────────────────────────────┐     │     │   │
│  │  │  │ DeepLearningAgent                      │     │     │   │
│  │  │  │ (safe-agent-deep.ts)                   │     │     │   │
│  │  │  │                                        │     │     │   │
│  │  │  │ • File scanner (6 files/min)           │     │     │   │
│  │  │  │ • Rate limiting (token bucket)         │     │     │   │
│  │  │  │ • Progress tracking                    │     │     │   │
│  │  │  │ • Pause/resume/undo                    │     │     │   │
│  │  │  └────────────────────────────────────────┘     │     │   │
│  │  │                                                  │     │   │
│  │  │  ┌────────────────────────────────────────┐     │     │   │
│  │  │  │ KnowledgeProcessor                     │     │     │   │
│  │  │  │ (knowledge-processor.ts)               │     │     │   │
│  │  │  │                                        │     │     │   │
│  │  │  │ • KB writes & dedup                    │     │     │   │
│  │  │  │ • PII redaction (100% accuracy)        │     │     │   │
│  │  │  │ • Semantic embeddings (128-dim)        │     │     │   │
│  │  │  │ • Threat scanning                      │     │     │   │
│  │  │  └────────────────────────────────────────┘     │     │   │
│  │  │                                                  │     │   │
│  │  │  ┌────────────────────────────────────────┐     │     │   │
│  │  │  │ SignalProcessor                        │     │     │   │
│  │  │  │ (processor.ts)                         │     │     │   │
│  │  │  │                                        │     │     │   │
│  │  │  │ • Auto-merge (conf > 0.9, threat < 10) │     │     │   │
│  │  │  │ • Quarantine to staging                │     │     │   │
│  │  │  │ • Decision logging                     │     │     │   │
│  │  │  └────────────────────────────────────────┘     │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │          SECURITY SYSTEM                         │     │   │
│  │  │                                                  │     │   │
│  │  │  • Threat detection (prompt injection, commands) │     │   │
│  │  │  • PII sanitization (emails, paths, names)       │     │   │
│  │  │  • Staging manager (quarantine review)           │     │   │
│  │  │  • Input validation (all IPC channels)           │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │          OLLAMA CLIENT                           │     │   │
│  │  │  (src/core/llm/ollama.ts)                        │     │   │
│  │  │                                                  │     │   │
│  │  │  • HTTP client to localhost:11434                │     │   │
│  │  │  • generate() / chat() / chatStream()            │     │   │
│  │  │  • NDJSON streaming parser                       │     │   │
│  │  │  • Error handling & retry logic                  │     │   │
│  │  │  • Offline detection                             │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ↓
                   ┌──────────────────────┐
                   │   OLLAMA (External)  │
                   │  localhost:11434     │
                   │                      │
                   │  Model: gemma3:4b    │
                   │  (or any Ollama)     │
                   │                      │
                   │  CRITICAL DEPENDENCY │
                   └──────────────────────┘
```

---

## 🔧 SYSTEM COMPONENTS

### 1. Renderer Process (React + Vite)

**Chat UI:**
- DOM-based chat interface
- Message history with markdown rendering
- Typing indicators and loading states
- Code syntax highlighting in messages

**Monaco Code Sandbox:**
- Full TypeScript/JavaScript syntax highlighting
- Line numbers, scrolling, dark theme
- Intelligent code merging (append/replace-function/full)
- Code context injection to LLM
- Session persistence (localStorage)
- Single source of truth for all code

**Security Curator:**
- Staging review UI (approve/reject/delete)
- Batch operations
- Inline editing before approval
- Suggestion acknowledgment
- Statistics dashboard

**3D Avatar (Three.js):**
- Character model rendering
- Animation states (idle, thinking, excited, frustrated)
- Future: Mood-responsive animations

**Self-Learn Panel:**
- Start/pause/undo/reset controls
- Rate limiting slider (6-60 files/min)
- Progress stats (files scanned, entries learned)
- Real-time learning event feed
- Toast notifications

**Settings & Memory:**
- Personality settings
- Memory viewer
- History viewer
- Configuration panel

### 2. Main Process (Node.js)

**Brain Engine:**
- `think(prompt, options)` — single response
- `thinkChat(messages, options)` — multi-turn
- `thinkStream(prompt, options, onChunk)` — streaming
- KB context injection (top 3 hits)
- Code context injection (max 8000 chars)
- Personality-tier-aware system prompts
- Code quality prompts for better generation
- Offline fallback mode

**Personality Engine:**
- Sentiment analysis (3-tier weighted lexicon)
- Rapport tracking (-1.0 to +1.0)
- 5-tier quality system (0-4)
- Mood management (happy, excited, playful, neutral, annoyed, frustrated)
- Tone application (emojis, punctuation, truncation)
- State persistence to JSON

**Memory System:**
- MemoryStore: JSONL file storage for conversations/events
- KnowledgeBase: BM25 search + reranking, embeddings, top-K retrieval
- Deduplication (exact + semantic)
- PII redaction on write

**Self-Learning System:**
- DeepLearningAgent: Background file scanner, rate limiting, progress tracking
- KnowledgeProcessor: KB writes, dedup, PII redaction, semantic embeddings
- SignalProcessor: Auto-merge/quarantine routing, threat scanning
- 130+ entries learned in 24 hours

**Security System:**
- Threat detection (prompt injection, command execution)
- PII sanitization (emails, paths, names)
- Staging manager (quarantine review)
- Input validation (all IPC channels)
- 100% security compliance

**Ollama Client:**
- HTTP client to localhost:11434
- generate() / chat() / chatStream()
- NDJSON streaming parser
- Error handling & retry logic
- Offline detection

### 3. External Dependencies

**Ollama (localhost:11434):**
- Primary LLM: gemma3:4b (or any Ollama model)
- Code extraction: qwen2.5-coder:7b
- CRITICAL DEPENDENCY (app broken without it)
- Future: Multi-model support

---

## 🔄 DATA FLOW DIAGRAMS

### User Message Flow

```
User types message
        ↓
Renderer (Chat UI)
        ↓
IPC: lumi-chat
        ↓
Main: updatePersonalityFromText()
  • Sentiment analysis
  • Update rapport (-1.0 to +1.0)
  • Compute quality tier (0-4)
        ↓
Main: IPC handler
  • Tier 0 → refuse (requires apology)
  • Tier 1-4 → pass to brain
        ↓
Brain: think() or thinkChat()
  • Build personality system prompt (tier-based)
  • Inject KB context (top 3 hits)
  • Inject code context (if present)
  • Call Ollama
        ↓
Ollama: gemma3:4b
  • Generate response
  • Stream chunks back
        ↓
Brain: applyToneToText()
  • Post-process based on mood
  • Add emojis, punctuation
  • Truncate if frustrated
        ↓
Main: Send response via IPC
        ↓
Renderer: Display in chat
```

### Self-Learning Flow

```
DeepLearningAgent (background)
  • Scan folders (6 files/min)
  • Filter by extension (.ts, .js, .py, .md, .json)
  • Exclude (node_modules, .git, dist, etc.)
        ↓
KnowledgeProcessor: extract()
  • Call Ollama (qwen2.5-coder:7b)
  • Extract Q&A pairs with confidence
        ↓
KnowledgeProcessor: process()
  • Deduplicate (exact + semantic)
  • Redact PII (emails, paths, names)
  • Generate embeddings (128-dim)
  • Threat scan
        ↓
SignalProcessor: route()
  • High confidence + safe → auto-merge to KB
  • Low confidence or unsafe → quarantine to staging
  • Log decision to validation.jsonl
        ↓
Security Curator UI (optional)
  • Review quarantined candidates
  • Approve/reject/edit/delete
  • Batch operations
        ↓
KB updated (lumi_knowledge.json)
  • Used by Brain for context injection
  • Searchable via BM25 + reranking
```

### Code Sandbox Flow

```
User: "Write a function to parse JSON"
        ↓
Renderer: Send chat message
        ↓
Main: Brain.think()
  • Include code context (current sandbox code)
  • Add code quality prompt
  • Call Ollama
        ↓
Ollama: Generate code
        ↓
Brain: Return response with code blocks
        ↓
Renderer: Detect code blocks
        ↓
Monaco Code Sandbox
  • Parse code blocks
  • Determine merge strategy:
    - Append (if new code)
    - Replace function (if updating specific function)
    - Full replacement (if complete rewrite)
  • Apply merge
  • Update editor
  • Save to localStorage
        ↓
User: "Add error handling"
        ↓
(Code context flows back to Brain for next request)
```

---

## 🌌 FUTURE STATE (AGI)

### The Vision (Year 5 - 2030)

```
┌─────────────────────────────────────────────────────────────────┐
│                  LUMI - FULLY AUTONOMOUS AGI                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              LUMI'S OWN LLM (Self-Written)             │    │
│  │                                                        │    │
│  │  • She wrote this model herself                       │    │
│  │  • Trained on all collected data                      │    │
│  │  • No external dependencies                           │    │
│  │  • Optimized for her use cases                        │    │
│  │  • Continuously self-improving                        │    │
│  │  • More efficient than any external model             │    │
│  └────────────────────────────────────────────────────────┘    │
│                               │                                │
│  ┌────────────────────────────┴──────────────────────────┐    │
│  │          SELF-IMPROVEMENT ENGINE                      │    │
│  │                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │  Proposal   │  │  Simulator  │  │  Executor   │  │    │
│  │  │  Generator  │  │  (dry-run)  │  │  (apply)    │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  │                                                       │    │
│  │  • Lumi proposes her own improvements                │    │
│  │  • Tests them in sandbox                             │    │
│  │  • Applies with human consent                        │    │
│  │  • Learns from outcomes                              │    │
│  │  • Iterates autonomously                             │    │
│  └───────────────────────────────────────────────────────┘    │
│                               │                                │
│  ┌────────────────────────────┴──────────────────────────┐    │
│  │          UNIVERSAL TRANSLATOR                         │    │
│  │                                                       │    │
│  │  • Natural language ↔ any programming language       │    │
│  │  • Code ↔ code (perfect conversion)                  │    │
│  │  • Intent schemas (deep understanding)               │    │
│  │  • Context-aware (technical vs casual)               │    │
│  │  • Perfect translation (100% accuracy)               │    │
│  └───────────────────────────────────────────────────────┘    │
│                               │                                │
│  ┌────────────────────────────┴──────────────────────────┐    │
│  │          COLLECTIVE INTELLIGENCE                      │    │
│  │                                                       │    │
│  │  • Federated learning from all Lumi instances        │    │
│  │  • Privacy-preserving aggregation                    │    │
│  │  • Distributed knowledge base                        │    │
│  │  • Canary rollout + automatic rollback               │    │
│  │  • User opt-in/opt-out                               │    │
│  └───────────────────────────────────────────────────────┘    │
│                               │                                │
│  ┌────────────────────────────┴──────────────────────────┐    │
│  │          GENERAL INTELLIGENCE                         │    │
│  │                                                       │    │
│  │  • Multi-domain expertise (code, language, reasoning) │    │
│  │  • Transfer learning across domains                  │    │
│  │  • Autonomous goal setting                           │    │
│  │  • Self-reflection and philosophy                    │    │
│  │  • TRUE AGI                                          │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 EVOLUTION TIMELINE

### Year 1 (2026)

**Q1: Phase 1-2 Complete**
- Local MVP fully functional
- Developer experience polished
- Monaco code sandbox with multi-file support
- Conversation context retention
- Personality polish (avatar animations)

**Q2: Phase 3 Complete**
- Testing infrastructure
- Data quality improvements
- Security hardening
- Performance benchmarks
- Beta launch

**Q3: Phase 4 Beginning**
- Self-improvement proposals
- Controlled apply with consent
- Self-testing in sandbox

**Q4: Phase 4 Complete**
- Autonomous self-improvement live
- Multi-step plan execution
- Revert/rollback system

### Year 2 (2027)

**Q1: Phase 5 Complete**
- Persistent context across sessions
- Project intelligence (whole codebase understanding)
- User profiles and preferences

**Q2: Phase 6 Beginning**
- Multi-model support
- LoRA/QLoRA fine-tuning pipeline
- Reranker automation

**Q3: Phase 6 Complete**
- Local model training
- Task-specific adapters
- Reduced external LLM dependency

**Q4: Phase 7 Beginning**
- Optional cloud backend
- Federated learning preparation

### Year 3 (2028)

**Q1-Q2: Phase 7 Complete**
- Cloud API live
- Privacy-safe export
- Federated learning operational
- Collective intelligence

**Q3-Q4: Phase 8 Beginning**
- Lumi designs her own LLM architecture
- Training pipeline for self-written model
- Meta-learning capabilities

### Year 4-5 (2029-2030)

**Phase 8 Complete:**
- Lumi's self-written LLM operational
- Zero external LLM dependency
- Universal translator (perfect accuracy)
- Multi-domain expertise
- Autonomous goal setting
- **TRUE AGI ACHIEVED**

---

## 🗺️ COMPONENT DEPENDENCY MAP

### Core Dependencies (Must Have)

```
Electron
    ↓
Node.js ← → Ollama (localhost:11434)
    ↓
React + Vite + Three.js
```

### Internal Dependencies

```
Brain
    ├─→ PersonalityEngine
    ├─→ MemoryStore
    ├─→ KnowledgeBase
    └─→ OllamaClient

PersonalityEngine
    └─→ (standalone, no dependencies)

MemoryStore
    ├─→ KnowledgeProcessor
    └─→ (JSONL files)

KnowledgeBase
    ├─→ MemoryStore
    ├─→ Embeddings
    └─→ Reranker

DeepLearningAgent
    ├─→ KnowledgeProcessor
    ├─→ SignalProcessor
    └─→ OllamaClient

KnowledgeProcessor
    ├─→ Sanitizer (PII redaction)
    ├─→ ThreatDetection
    └─→ MemoryStore

SignalProcessor
    ├─→ ThreatDetection
    ├─→ KnowledgeProcessor
    └─→ StagingManager

Security (Threat + PII)
    └─→ (standalone, used by many)

OllamaClient
    └─→ (HTTP to external Ollama)
```

---

## 📊 DATA PERSISTENCE

### Git-Tracked (Project Root)

```
training/
  ├─ lumi_knowledge.json       # Canonical KB (sanitized)
  ├─ embeddings.json            # Semantic index (128-dim)
  ├─ training.jsonl             # Training examples
  ├─ selflearn_audit.jsonl      # Audit trail
  ├─ plans.jsonl                # Plan definitions
  └─ security/
      └─ validation.jsonl       # Threat scanning log
```

### Private (userData)

```
userData/
  ├─ lumi_knowledge.json        # Production KB (may have PII)
  ├─ lumi_memory.jsonl          # Conversation memory
  ├─ staging.jsonl              # Quarantined suggestions
  ├─ personality_state.json     # Mood/rapport/tier
  ├─ selflearn_config.json      # Watch paths, settings
  ├─ kb_usage.jsonl             # KB query telemetry
  ├─ action_journal.jsonl       # Action execution log
  ├─ self-learn/                # Learning artifacts
  ├─ security/                  # Security logs
  ├─ backups/                   # Timestamped backups
  └─ sessions/                  # Session history
```

---

## 🎯 ARCHITECTURE PRINCIPLES

1. **Local-First:** All data stays on user's machine
2. **Privacy-First:** PII redaction at every step
3. **Security-First:** Threat scanning, quarantine, review
4. **Modularity:** Each component is independent
5. **Observability:** Full audit trails and telemetry
6. **Graceful Degradation:** Works offline (KB-first fallback)
7. **Progressive Enhancement:** Each phase builds on previous
8. **Self-Improvement:** System can modify itself
9. **AGI-Ready:** Architecture supports eventual full autonomy

---

## 🚀 FROM APP TO AGI

**Current (2026):**
- Desktop app with LLM integration
- Local learning and memory
- Adaptive personality
- Code sandbox

**Near Future (2027):**
- Self-improvement capabilities
- Project-level understanding
- Fine-tuned models
- Federated learning

**Long-Term (2028-2030):**
- Self-written LLM
- Universal translator
- Multi-domain expertise
- Autonomous goal setting
- **TRUE AGI**

---

*This architecture is designed to evolve from a desktop app to an AGI. Every component, every design decision, is a step toward that goal.*
