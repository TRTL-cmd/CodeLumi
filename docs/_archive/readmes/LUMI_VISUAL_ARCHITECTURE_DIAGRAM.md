# LUMI VISUAL ARCHITECTURE DIAGRAM v2.0

**Last Updated:** 2026-01-27  
**Includes:** Autonomous Learning System

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LUMI DESKTOP APPLICATION                         │
│                    (Electron + React + Three.js)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼──────────┐        ┌──────────▼──────────┐
        │   RENDERER PROCESS   │        │   MAIN PROCESS      │
        │   (Browser/React)    │◄──────►│   (Node.js/Electron)│
        └──────────────────────┘  IPC   └─────────────────────┘
                 │                                  │
                 │                                  │
        ┌────────▼────────┐                ┌───────▼────────┐
        │   UI LAYER      │                │  BRAIN ENGINE  │
        │                 │                │                │
        │ • Chat          │                │ • Think/Plan   │
        │ • Avatar        │                │ • KB Search    │
        │ • Metrics       │                │ • Context      │
        │ • Curator       │                │ • Signals      │
        └─────────────────┘                └────────┬───────┘
                                                    │
                                    ┌───────────────┴──────────────┐
                                    │                              │
                         ┌──────────▼──────────┐      ┌───────────▼───────────┐
                         │  KNOWLEDGE SYSTEM   │      │  LEARNING SYSTEM      │
                         │                     │      │                       │
                         │ • MemoryStore       │      │ • DeepLearningAgent   │
                         │ • KnowledgeBase     │      │ • KnowledgeProcessor  │
                         │ • BM25 Search       │      │ • SignalProcessor     │
                         │ • PII Redaction     │      │ • Threat Detection    │
                         └──────────┬──────────┘      └───────────┬───────────┘
                                    │                             │
                                    │          ┌──────────────────┘
                                    │          │
                         ┌──────────▼──────────▼──────────┐
                         │     OLLAMA LLM SERVER          │
                         │  (localhost:11434)             │
                         │                                │
                         │  Models:                       │
                         │  • qwen2.5-coder:7b (primary)  │
                         │  • llama3, mistral, codellama  │
                         └────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Chat Query Flow

```
User Types Message
        ↓
┌─────────────────────────────────────────────┐
│ RENDERER: Codelumi.tsx                       │
│ • Capture input                             │
│ • Call window.lumi.think(msg, {useKB:true}) │
└───────────────┬─────────────────────────────┘
                ↓ IPC
┌─────────────────────────────────────────────┐
│ MAIN: Brain.think()                         │
│ 1. Search KB for context                   │
│ 2. Build prompt with history + KB hits     │
│ 3. Call ollama.chat()                       │
└───────────────┬─────────────────────────────┘
                ↓ HTTP
┌─────────────────────────────────────────────┐
│ OLLAMA: qwen2.5-coder:7b                    │
│ • Process prompt with full context          │
│ • Generate response with streaming          │
└───────────────┬─────────────────────────────┘
                ↓
┌─────────────────────────────────────────────┐
│ MAIN: SignalProcessor.processSignals()     │
│ • Detect sentiment, corrections, etc        │
│ • Update KB quality scores                 │
└───────────────┬─────────────────────────────┘
                ↓ IPC
┌─────────────────────────────────────────────┐
│ RENDERER: Display response                  │
│ • Stream tokens to UI                       │
│ • Update metrics                            │
└─────────────────────────────────────────────┘
```

---

### 2. Autonomous Learning Flow ⭐ NEW

```
Every 10 seconds (tick)
        ↓
┌───────────────────────────────────────────────┐
│ DeepLearningAgent.tick()                      │
│ • Check rate limit (token bucket)             │
│ • Scan for unprocessed files                  │
└─────────────────┬─────────────────────────────┘
                  ↓
        File found + tokens available
                  ↓
┌───────────────────────────────────────────────┐
│ DeepLearningAgent.scanPath()                  │
│ 1. Read file content (full or excerpt)        │
│ 2. Redact PII (emails, paths, names)          │
│ 3. Create excerpt for Ollama                  │
└─────────────────┬─────────────────────────────┘
                  ↓
        ┌─────────┴─────────┐
        │                   │
        ↓                   ↓
┌───────────────────┐  ┌────────────────────┐
│ generateKnowledge │  │ generateSuggestions│
└────────┬──────────┘  └──────────┬─────────┘
         ↓                        ↓
   "Extract Q&A"           "Suggest improvements"
         ↓                        ↓
┌────────▼────────────────────────▼─────────┐
│ OLLAMA: qwen2.5-coder:7b                  │
│ • Analyzes code structure                 │
│ • Extracts 2-4 Q&A pairs                  │
│ • Generates 2-3 improvement suggestions   │
└─────────────────┬─────────────────────────┘
                  ↓
          JSON Response
                  ↓
┌─────────────────────────────────────────────┐
│ DeepLearningAgent.generateKnowledge()       │
│ • Parse JSON (handle multiple formats)     │
│ • Validate candidates                      │
│ • Call KnowledgeProcessor.ingest()         │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ KnowledgeProcessor.ingest()                 │
│ 1. Load existing KB                         │
│ 2. Validate Q&A pairs                       │
│ 3. Check for duplicates (Q + file)          │
│ 4. Redact any remaining PII                 │
│ 5. Run threat scan                          │
└─────────────────┬───────────────────────────┘
                  ↓
          Multi-file Writes
                  ↓
┌─────────────────────────────────────────────┐
│ FILE SYSTEM OUTPUTS:                        │
│                                             │
│ userData/                                   │
│   ├── lumi_knowledge.json (main KB)        │
│   ├── lumi_memory.jsonl (memory)           │
│   ├── self-learn/                           │
│   │   ├── lumi_knowledge.json (copy)       │
│   │   ├── selflearn_audit.jsonl (audit)    │
│   │   ├── selflearn_progress.json (state)  │
│   │   └── selflearn_suggestions.jsonl      │
│   └── security/                             │
│       └── validation.jsonl (threats)        │
│                                             │
│ training/                                   │
│   └── lumi_knowledge.json (repo copy)      │
└─────────────────┬───────────────────────────┘
                  ↓
          Emit IPC Event
                  ↓
┌─────────────────────────────────────────────┐
│ RENDERER: lumi-learning-event               │
│ • Update metrics panel                      │
│ • Show toast notification                   │
│ • Increment knowledge count                 │
└─────────────────────────────────────────────┘
```

---

### 3. Knowledge Base Search Flow

```
User asks question OR Brain needs context
        ↓
┌───────────────────────────────────────────┐
│ Brain.searchKBWithDecision(query)         │
│ • Tokenize query                          │
│ • Check KB size                           │
└─────────────────┬─────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ BM25 Search (primary)                       │
│ • Score all KB entries                      │
│ • Rank by relevance                         │
│ • Return top 5 hits                         │
└─────────────────┬───────────────────────────┘
                  ↓
          Hits with scores
                  ↓
┌─────────────────────────────────────────────┐
│ Brain.synthesizeKBAnswer(hits)              │
│ • Combine multiple entries                  │
│ • Add source attribution                    │
│ • Format for context or direct answer       │
└─────────────────────────────────────────────┘
```

---

### 4. Security & Validation Flow

```
New content (from Ollama OR user)
        ↓
┌───────────────────────────────────────────┐
│ KnowledgeProcessor.ingest()               │
│ • Receive candidates                      │
└─────────────────┬─────────────────────────┘
                  ↓
┌───────────────────────────────────────────┐
│ PII Redaction                             │
│ • Emails → [REDACTED_EMAIL]               │
│ • Paths → [PROJECT_ROOT] or [REDACTED]    │
│ • Names → [REDACTED_NAME]                 │
└─────────────────┬─────────────────────────┘
                  ↓
┌───────────────────────────────────────────┐
│ Threat.scanQA(q, a)                       │
│ • Check for SQL injection                 │
│ • Check for XSS patterns                  │
│ • Check for hardcoded secrets             │
│ • Check for malicious URLs                │
└─────────────────┬─────────────────────────┘
                  ↓
        ┌─────────┴─────────┐
        │                   │
        ↓                   ↓
   Suspicious           Clean
        ↓                   ↓
┌───────────────┐  ┌────────────────┐
│ Quarantine    │  │ Auto-merge     │
│ staging.jsonl │  │ to KB          │
└───────────────┘  └────────────────┘
```

---

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        LUMI COMPONENTS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐        ┌──────────────┐                     │
│  │   Brain      │───────►│   Ollama     │                     │
│  │              │◄───────│   Client     │                     │
│  └───────┬──────┘        └──────────────┘                     │
│          │                                                     │
│          ├──────────┬──────────┬──────────┐                   │
│          │          │          │          │                   │
│  ┌───────▼─────┐ ┌──▼──────┐ ┌▼────────┐ ┌▼───────────┐     │
│  │ MemoryStore │ │   KB    │ │ Signals │ │ Deep Agent │     │
│  │  (JSONL)    │ │(BM25)   │ │Processor│ │            │     │
│  └─────────────┘ └─────────┘ └─────────┘ └─────┬──────┘     │
│                                                  │            │
│                                          ┌───────▼────────┐   │
│                                          │  Knowledge     │   │
│                                          │  Processor     │   │
│                                          └────────────────┘   │
│                                                                │
│  All components share:                                        │
│  • userData path for file storage                             │
│  • IPC for renderer communication                             │
│  • Ollama for LLM operations                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File System Layout

```
Lumi Project Root/
│
├── src/                          # Source code
│   ├── main.ts                   # Electron main
│   ├── preload.ts                # IPC bridge
│   ├── renderer.tsx              # React entry
│   ├── Codelumi.tsx                 # Main UI
│   │
│   ├── core/
│   │   ├── llm/
│   │   │   └── ollama.ts         # Ollama client
│   │   ├── brain/
│   │   │   └── index.ts          # Brain orchestrator
│   │   ├── memory/
│   │   │   ├── store.ts          # MemoryStore
│   │   │   └── kb.ts             # KnowledgeBase
│   │   └── learning/
│   │       ├── signals.ts        # SignalProcessor
│   │       └── knowledge-processor.ts
│   │
│   ├── selflearning/
│   │   └── safe-agent-deep.ts    # DeepLearningAgent
│   │
│   └── security/
│       └── threat_detection.ts   # Threat scanner
│
├── training/                     # Training data (version controlled)
│   ├── lumi_knowledge.json       # KB copy
│   ├── training.jsonl            # Manual entries
│   └── staging.jsonl             # Quarantine
│
└── userData/ (AppData)           # User-specific data
    ├── lumi_knowledge.json       # Main KB
    ├── lumi_memory.jsonl         # Memory store
    ├── selflearn_config.json     # Agent config
    │
    ├── self-learn/               # Learning outputs
    │   ├── lumi_knowledge.json
    │   ├── selflearn_audit.jsonl
    │   ├── selflearn_progress.json
    │   ├── selflearn_store.jsonl
    │   └── selflearn_suggestions.jsonl
    │
    └── security/                 # Security logs
        └── validation.jsonl
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION STATE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RENDERER STATE (React)                                         │
│  ├── UI state (chat messages, loading, errors)                 │
│  ├── Settings (theme, model, preferences)                      │
│  └── Cached metrics (totalKB, eventsToday, etc)                │
│                                                                 │
│  MAIN PROCESS STATE (Node.js)                                  │
│  ├── Brain state (conversation history, current model)         │
│  ├── Agent state (running, paused, token bucket)               │
│  ├── KB state (in-memory index, search cache)                  │
│  └── Signal state (recent signals, quality scores)             │
│                                                                 │
│  PERSISTENT STATE (File System)                                │
│  ├── Knowledge Base (lumi_knowledge.json)                      │
│  ├── Memory Store (lumi_memory.jsonl)                          │
│  ├── Learning Progress (selflearn_progress.json)               │
│  ├── Agent Config (selflearn_config.json)                      │
│  └── Audit Trails (*.jsonl files)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Characteristics

```
┌────────────────────────────────────────────────────────────┐
│ OPERATION                TIME          THROUGHPUT          │
├────────────────────────────────────────────────────────────┤
│ Chat response          2-5s          ~20 tokens/sec       │
│ KB search              30-50ms       1000+ queries/sec    │
│ Knowledge extraction   ~10s/file     6 files/min          │
│ Suggestion generation  ~8s/file      6 files/min          │
│ PII redaction          <1ms          10k entries/sec      │
│ Threat scan            <5ms          1k entries/sec       │
│ File write (KB)        10-50ms       Depends on size      │
│ Memory add             1-5ms         Fast append          │
└────────────────────────────────────────────────────────────┘

RESOURCE USAGE (typical):
• CPU: 5-15% (idle), 50-80% (learning)
• RAM: 300-500MB (Electron + Node)
• Disk: Grows with KB (1KB per entry average)
• Network: Local only (Ollama on localhost:11434)
```

---

## Security Boundaries

```
┌───────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  LAYER 1: Input Validation                                   │
│  • IPC message validation                                    │
│  • File path sanitization                                    │
│  • Query parameter checking                                  │
│                                                               │
│  LAYER 2: PII Redaction                                      │
│  • Email pattern matching                                    │
│  • File path normalization                                   │
│  • Name detection and redaction                              │
│                                                               │
│  LAYER 3: Threat Detection                                   │
│  • Injection pattern scanning                                │
│  • Secret detection (API keys, passwords)                    │
│  • Malicious URL filtering                                   │
│                                                               │
│  LAYER 4: Quarantine System                                  │
│  • Suspicious content isolation                              │
│  • Manual review queue                                       │
│  • Approval workflow                                         │
│                                                               │
│  LAYER 5: Audit Trail                                        │
│  • All operations logged                                     │
│  • Immutable JSONL format                                    │
│  • Timestamp + source tracking                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Event System

```
MAIN PROCESS EVENTS:
├── lumi-learning-event → Renderer
│   ├── type: 'kb-added'
│   ├── type: 'suggestions'
│   └── type: 'progress-update'
│
└── Agent Internal Events:
    ├── tick (every 10s)
    ├── file-scanned
    ├── knowledge-extracted
    └── suggestion-generated

RENDERER → MAIN IPC:
├── lumi-think
├── lumi-think-local
├── lumi-load-kb
├── lumi-search-kb
├── lumi-selflearn-status
├── lumi-selflearn-start/stop/pause/resume
├── lumi-metrics
└── lumi-list-suggestions
```

---

## Monitoring & Observability

```
WHAT TO MONITOR:
├── Terminal Logs (Main Process)
│   ├── [DeepAgent] messages
│   ├── [KnowledgeProcessor] messages
│   ├── [Brain] messages
│   └── [Metrics] messages
│
├── DevTools Console (Renderer)
│   ├── UI state changes
│   ├── IPC call/response
│   └── Error messages
│
├── File System
│   ├── KB file sizes
│   ├── Audit trail growth
│   └── Progress file updates
│
└── Metrics API
    ├── totalKB (growing?)
    ├── eventsToday (increasing?)
    ├── eventsPerHour (stable ~10-12?)
    └── deepLearnedToday (recent entries?)
```

---

**This architecture enables Lumi to learn autonomously while maintaining security, privacy, and user control. All processing happens locally with complete transparency and audit trails.**
