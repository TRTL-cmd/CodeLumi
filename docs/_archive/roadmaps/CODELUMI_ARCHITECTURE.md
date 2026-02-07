# LUMI ARCHITECTURE v2.0

**Last Updated:** 2026-01-27  
**Status:** Phase 1 MVP Complete with Autonomous Learning ✅

---

## System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                         LUMI LOCAL APP                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    RENDERER PROCESS                              │ │
│  │                    (React + UI)                                  │ │
│  │                                                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│  │  │   Chat   │  │  Avatar  │  │ Settings │  │ Security │       │ │
│  │  │    UI    │  │ (Three)  │  │   Panel  │  │ Curator  │       │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │              METRICS & MONITORING                         │  │ │
│  │  │  • Total KB: 130+  • Events Today: 210                   │  │ │
│  │  │  • Events/hr: 10   • Self-Learn: ON                      │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │ IPC (contextBridge)                   │
│  ┌──────────────────────────┴────────────────────────────────────┐ │
│  │                     MAIN PROCESS                               │ │
│  │                     (Electron Node.js)                         │ │
│  │                                                                │ │
│  │  ┌────────────────────────────────────────────────────────┐   │ │
│  │  │                  LUMI'S BRAIN                           │   │ │
│  │  │                                                         │   │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │ │
│  │  │  │ Context │  │  Prompt │  │Response │  │  Signal │  │   │ │
│  │  │  │Retriever│→ │ Builder │→ │Processor│→ │Detector │  │   │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │   │ │
│  │  │       ↑                           │             │      │   │ │
│  │  │       └───────────────────────────┴─────────────┘      │   │ │
│  │  │                   ↓ ↑                                  │   │ │
│  │  │  ┌───────────────────────────────────────────────┐    │   │ │
│  │  │  │         KNOWLEDGE & MEMORY SYSTEM             │    │   │ │
│  │  │  │                                               │    │   │ │
│  │  │  │  ┌─────────────┐    ┌─────────────────┐     │    │   │ │
│  │  │  │  │MemoryStore  │    │ KnowledgeBase   │     │    │   │ │
│  │  │  │  │(JSONL)      │    │(JSON Array)     │     │    │   │ │
│  │  │  │  └─────────────┘    └─────────────────┘     │    │   │ │
│  │  │  └───────────────────────────────────────────────┘    │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │          🧠 AUTONOMOUS LEARNING SYSTEM                  │ │ │
│  │  │                                                         │ │ │
│  │  │  ┌──────────────────┐     ┌──────────────────┐        │ │ │
│  │  │  │ DeepLearning     │────→│ Knowledge        │        │ │ │
│  │  │  │ Agent            │     │ Processor        │        │ │ │
│  │  │  │                  │     │                  │        │ │ │
│  │  │  │ • Scans files    │     │ • Validates Q&A  │        │ │ │
│  │  │  │ • Rate limits    │     │ • Deduplicates   │        │ │ │
│  │  │  │ • Tracks progress│     │ • Redacts PII    │        │ │ │
│  │  │  └────────┬─────────┘     │ • Multi-writes   │        │ │ │
│  │  │           │               └────────┬─────────┘        │ │ │
│  │  │           ▼                        ▼                  │ │ │
│  │  │    ┌─────────────────────────────────────────┐       │ │ │
│  │  │    │      OLLAMA (Knowledge Extraction)      │       │ │ │
│  │  │    │      • Extracts Q&A pairs               │       │ │ │
│  │  │    │      • Generates suggestions            │       │ │ │
│  │  │    │      • Analyzes code structure          │       │ │ │
│  │  │    └─────────────────────────────────────────┘       │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                         │                                 │ │
│  │                         │ HTTP                            │ │
│  │                         ▼                                 │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │                    OLLAMA SERVER                    │  │ │
│  │  │           (localhost:11434)                         │  │ │
│  │  │                                                     │  │ │
│  │  │    Models: qwen2.5-coder:7b (primary)             │  │ │
│  │  │            llama3, mistral, codellama              │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Ollama Client ⭐ Enhanced

**Location:** `src/core/llm/ollama.ts`

**Purpose:** Communicate with local Ollama server for chat and knowledge extraction

```typescript
interface OllamaClient {
  // Configuration
  baseUrl: string;          // Default: http://localhost:11434
  model: string;            // Default: qwen2.5-coder:7b
  
  // Core methods
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  generateStream(prompt: string): AsyncGenerator<string>;
  
  // Utilities
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  setModel(model: string): void;
  
  // Embeddings (if model supports)
  embed(text: string): Promise<number[]>;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}
```

**API Endpoints Used:**
- `POST /api/generate` — Text completion
- `POST /api/chat` — Chat completion
- `GET /api/tags` — List models
- `POST /api/embeddings` — Generate embeddings (future)

**Models in Use:**
- **qwen2.5-coder:7b** — Primary for knowledge extraction and suggestions
- **llama3** — Fallback for general chat
- **mistral** — Optional alternative

---

### 2. Brain Module

**Location:** `src/core/brain/index.ts`

**Purpose:** Orchestrate LLM, memory, knowledge retrieval, and learning

```typescript
interface Brain {
  // Main thinking
  think(userMessage: string, options?: ThinkOptions): Promise<string>;
  thinkStream(userMessage: string): AsyncGenerator<string>;
  thinkLocal(query: string): Promise<string>; // KB-only synthesis
  
  // Knowledge-based retrieval
  searchKB(query: string): Promise<KBHit[]>;
  searchKBWithDecision(query: string): Promise<{ hits: KBHit[], source: string }>;
  synthesizeKBAnswer(hits: KBHit[]): string;
  
  // Planning (for complex tasks)
  plan(goal: string): Promise<Plan>;
  simulate(plan: Plan): Promise<SimulationResult>;
  execute(plan: Plan): Promise<ExecutionResult>;
  
  // History management
  getHistory(): Message[];
  clearHistory(): void;
  
  // Learning hooks
  handleCorrection(wrong: string, correct: string): Promise<void>;
  recordCopyEvent(): void;
  recordCodeExecution(success: boolean): void;
  
  // State
  isReady(): Promise<boolean>;
  setModel(model: string): void;
  
  // Knowledge management
  loadKnowledge(): Promise<KnowledgeItem[]>;
  reloadKB(): Promise<void>;
}

interface ThinkOptions {
  useKB?: boolean;           // Whether to search KB first
  kbOnly?: boolean;          // Answer only from KB (no LLM)
  maxTokens?: number;
  temperature?: number;
}

interface KBHit {
  q: string;
  a: string;
  score: number;
  source: 'deep-learning' | 'manual' | 'user-correction';
  confidence: number;
  file?: string;
}
```

**System Prompt:**
```
You are Lumi, a friendly and helpful AI coding assistant created by Tortol Studios.

Your traits:
• Enthusiastic and encouraging
• Patient with beginners, precise with experts
• You explain your reasoning clearly
• You provide working code examples
• You admit when you don't know something
• You learn from feedback and improve over time

When helping with code:
• Always provide complete, working examples
• Explain what the code does and why
• Point out potential issues
• Suggest best practices
• Reference your knowledge base when relevant
```

---

### 3. Knowledge & Memory System ⭐ Expanded

**Location:** `src/core/memory/`

#### 3a. MemoryStore

**File:** `src/core/memory/store.ts`

**Purpose:** Persistent JSONL storage for conversation history

```typescript
interface MemoryStore {
  // Core operations
  add(entry: MemoryEntry): Promise<void>;
  recent(limit: number): Promise<MemoryEntry[]>;
  search(query: string): Promise<MemoryEntry[]>;
  clear(): Promise<void>;
  
  // Utilities
  count(): Promise<number>;
  export(): Promise<MemoryEntry[]>;
}

interface MemoryEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  meta?: {
    source?: string;
    confidence?: number;
    signals?: string[];
  };
}
```

**Storage:** `userData/lumi_memory.jsonl`

#### 3b. Knowledge Base

**File:** `src/core/memory/kb.ts`

**Purpose:** Searchable knowledge base with BM25 ranking

```typescript
interface KnowledgeBase {
  // Search
  search(query: string, limit?: number): Promise<KBHit[]>;
  searchWithDecision(query: string): Promise<SearchResult>;
  
  // Management
  load(): Promise<KnowledgeItem[]>;
  reload(): Promise<void>;
  add(items: KnowledgeItem[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
  
  // Statistics
  count(): Promise<number>;
  stats(): Promise<KBStats>;
}

interface KnowledgeItem {
  id?: string;
  q: string;                    // Question
  a: string;                    // Answer
  source: 'deep-learning' | 'manual' | 'user-correction';
  confidence: number;           // 0-1
  file?: string;                // Source file (for deep-learned)
  learned?: string;             // ISO timestamp
  usageCount?: number;
  lastUsed?: number;
}

interface SearchResult {
  hits: KBHit[];
  source: 'bm25' | 'reranker' | 'empty';
  confidence: number;
}

interface KBStats {
  total: number;
  bySource: Record<string, number>;
  avgConfidence: number;
  recentLearned: number;
}
```

**Storage Locations:**
- **Primary:** `userData/lumi_knowledge.json`
- **Self-Learn:** `userData/self-learn/lumi_knowledge.json`
- **Training:** `training/lumi_knowledge.json`

**Format:** JSON Array
```json
[
  {
    "q": "What does OllamaClient.generate do?",
    "a": "Sends a POST to /api/generate with stream enabled...",
    "source": "deep-learning",
    "confidence": 0.9,
    "file": "src/core/llm/ollama.ts",
    "learned": "2026-01-27T00:00:00.000Z"
  }
]
```

---

### 4. Autonomous Learning System ⭐ NEW

#### 4a. DeepLearningAgent

**Location:** `src/selflearning/safe-agent-deep.ts`

**Purpose:** Autonomously scan codebase and extract knowledge via LLM

```typescript
interface DeepLearningAgent {
  // Lifecycle
  start(sendEvent?: EventCallback): { ok: boolean };
  stop(): { ok: boolean };
  pause(): { ok: boolean };
  resume(): { ok: boolean };
  
  // Configuration
  setRatePerMinute(rpm: number): { ok: boolean; capacity: number };
  
  // Status
  status(): AgentStatus;
  getProgress(): Promise<ProgressData>;
}

interface AgentStatus {
  running: boolean;
  paused: boolean;
  tokens: number;           // Current token bucket
  capacity: number;         // Max tokens (files per minute)
  deepMode: boolean;        // Full file read vs excerpt
}

interface ProgressData {
  ok: boolean;
  progress: Record<string, FileProgress>;
}

interface FileProgress {
  lastRead: number;         // Timestamp
  completed: boolean;
  analyzed: boolean;
}
```

**Configuration:** `userData/selflearn_config.json`
```json
{
  "enabled": true,
  "ratePerMinute": 6,
  "deepMode": true,
  "readFullFile": true,
  "deepExtensions": [".ts", ".tsx", ".js", ".jsx", ".py", ".md", ".json"],
  "excludeDirs": ["node_modules", ".git", "dist", "build"]
}
```

**Operation:**
1. Scans project files recursively
2. Applies rate limiting (token bucket algorithm)
3. For each file:
   - Reads content (full or excerpt based on mode)
   - Redacts PII (emails, paths, names)
   - Calls Ollama to extract 2-4 Q&A pairs
   - Calls Ollama to generate 2-3 improvement suggestions
   - Stores via KnowledgeProcessor
4. Tracks progress to avoid re-scanning
5. Emits events to UI for live updates

**Rate Limiting:**
- **Deep Mode:** 6 files/minute (full file read)
- **Fast Mode:** 60 files/minute (excerpts only)
- Token bucket refills continuously
- Prevents Ollama overload

#### 4b. KnowledgeProcessor

**Location:** `src/core/learning/knowledge-processor.ts`

**Purpose:** Validate, deduplicate, and persist extracted knowledge

```typescript
interface KnowledgeProcessor {
  // Main method
  ingest(candidates: Candidate[], filePath: string): Promise<IngestResult>;
  
  // Utilities
  redact(text: string): string;
}

interface Candidate {
  q: string;
  a: string;
  confidence?: number;
}

interface IngestResult {
  ok: boolean;
  added: number;
  addedItems?: KnowledgeItem[];
  error?: string;
}
```

**Processing Pipeline:**
1. **Load existing KB** from all locations
2. **Validate candidates:**
   - Non-empty Q and A
   - Reasonable length
3. **Redact PII:**
   - Email addresses → `[REDACTED_EMAIL]`
   - File paths → `[REDACTED_PATH]` or `[PROJECT_ROOT]`
   - Personal names → `[REDACTED_NAME]`
4. **Deduplicate:**
   - Check if Q+file combination exists
   - Skip duplicates
5. **Write to multiple locations:**
   - Main KB: `userData/lumi_knowledge.json`
   - Self-learn: `userData/self-learn/lumi_knowledge.json`
   - Training: `training/lumi_knowledge.json`
6. **Append audit trail:** `userData/self-learn/selflearn_audit.jsonl`
7. **Add to memory:** `userData/lumi_memory.jsonl`
8. **Validate security:** `userData/security/validation.jsonl`
9. **Emit UI event:** `lumi-learning-event`

**Outputs:**

```
userData/
  ├── lumi_knowledge.json              # Main KB (canonical)
  ├── lumi_memory.jsonl                # Memory store
  ├── selflearn_config.json            # Agent settings
  ├── self-learn/
  │   ├── lumi_knowledge.json          # KB copy for curator
  │   ├── selflearn_audit.jsonl        # Learning events log
  │   ├── selflearn_progress.json      # Progress tracker
  │   ├── selflearn_store.jsonl        # File excerpts
  │   └── selflearn_suggestions.jsonl  # Improvement suggestions
  └── security/
      └── validation.jsonl             # Threat scan results

training/
  ├── lumi_knowledge.json              # Repo KB (for version control)
  ├── training.jsonl                   # Manual training log
  └── staging.jsonl                    # Quarantined entries
```

---

### 5. Signal Detection System

**Location:** `src/core/learning/signals.ts`

**Purpose:** Automatically detect learning signals from user behavior

```typescript
interface SignalProcessor {
  // Main method
  processSignals(interaction: Interaction): Signal[];
  
  // Individual detectors
  detectCodeExecution(code: string, success: boolean): Signal | null;
  detectUserCorrection(messages: Message[]): Signal | null;
  detectRepeatQuestion(question: string, history: Message[]): Signal | null;
  detectSentiment(text: string): Signal | null;
  detectCopy(): Signal;
}

interface Interaction {
  userMessage: string;
  assistantResponse: string;
  codeBlocks: string[];
  previousMessages: Message[];
}

interface Signal {
  id: string;
  type: 'positive' | 'negative';
  source: 'code_execution' | 'user_copy' | 'user_correction' | 
          'repeat_question' | 'sentiment';
  confidence: number;        // 0 to 1
  timestamp: number;
  metadata?: Record<string, any>;
}
```

**Signal Detection Logic:**

```typescript
// Code execution
if (codeRanWithoutErrors) {
  return { type: 'positive', source: 'code_execution', confidence: 0.85 };
}

// User copied
if (copyEventDetected) {
  return { type: 'positive', source: 'user_copy', confidence: 0.80 };
}

// Sentiment
if (/thanks|perfect|great|awesome/i.test(userMessage)) {
  return { type: 'positive', source: 'sentiment', confidence: 0.70 };
}
if (/wrong|incorrect|doesn't work/i.test(userMessage)) {
  return { type: 'negative', source: 'sentiment', confidence: 0.90 };
}

// Repeat question
if (similarity(question, previousQuestion) > 0.7) {
  return { type: 'negative', source: 'repeat_question', confidence: 0.85 };
}

// User correction
if (/actually|should be|no,/i.test(userMessage)) {
  return { type: 'negative', source: 'user_correction', confidence: 0.95 };
}
```

---

### 6. Security & Validation

#### 6a. Threat Detection

**Location:** `src/security/threat_detection.ts`

**Purpose:** Scan Q&A pairs for security risks

```typescript
interface ThreatDetection {
  scanQA(question: string, answer: string): ThreatScanResult;
  scanText(text: string): ThreatScanResult;
}

interface ThreatScanResult {
  suspicious: boolean;
  score: number;           // 0-1 (higher = more suspicious)
  reasons: string[];
  recommendations?: string[];
}
```

**Threat Patterns:**
- Injection attacks (SQL, XSS, command injection)
- Hardcoded credentials
- Sensitive API keys
- Malicious URLs
- Unsafe file operations
- Privacy violations

#### 6b. Security Curator

**Location:** `src/components/security/SecurityCurator.tsx`

**Purpose:** UI for reviewing and approving learned content

**Features:**
- View quarantined entries
- Approve/reject with reasons
- Batch operations
- Threat score visualization
- Manual editing before approval

---

### 7. IPC Bridge

**Main Process (main.ts):**

```typescript
// Brain handlers
ipcMain.handle('lumi-think', async (event, message: string, options?: ThinkOptions) => {
  const response = await brain.think(message, options);
  return { ok: true, response };
});

ipcMain.handle('lumi-think-local', async (event, query: string) => {
  const response = await brain.thinkLocal(query);
  return { ok: true, response };
});

ipcMain.handle('lumi-ready', async () => {
  const ready = await brain.isReady();
  return { ok: true, ready };
});

// Knowledge handlers
ipcMain.handle('lumi-load-kb', async () => {
  const kb = await brain.loadKnowledge();
  return { ok: true, data: kb };
});

ipcMain.handle('lumi-kb-reload', async () => {
  await brain.reloadKB();
  return { ok: true };
});

ipcMain.handle('lumi-search-kb', async (event, query: string) => {
  const hits = await brain.searchKB(query);
  return { ok: true, hits };
});

// Self-learning handlers
ipcMain.handle('lumi-selflearn-status', async () => {
  return deepAgent.status();
});

ipcMain.handle('lumi-selflearn-start', async () => {
  return deepAgent.start();
});

ipcMain.handle('lumi-selflearn-stop', async () => {
  return deepAgent.stop();
});

ipcMain.handle('lumi-selflearn-progress', async () => {
  return await deepAgent.getProgress();
});

// Metrics
ipcMain.handle('lumi-metrics', async () => {
  // Returns: totalKB, eventsToday, eventsPerHour, deepLearnedToday
});

// Suggestions
ipcMain.handle('lumi-list-suggestions', async () => {
  // Returns list of code improvement suggestions
});

// Security
ipcMain.handle('lumi-list-staging', async () => {
  // Returns quarantined entries for review
});

ipcMain.handle('lumi-approve', async (event, ids: string[]) => {
  // Approve and merge entries
});
```

**Preload (preload.ts):**

```typescript
contextBridge.exposeInMainWorld('lumi', {
  // Brain
  think: (msg: string, opts?: ThinkOptions) => ipcRenderer.invoke('lumi-think', msg, opts),
  thinkLocal: (query: string) => ipcRenderer.invoke('lumi-think-local', query),
  isReady: () => ipcRenderer.invoke('lumi-ready'),
  clearHistory: () => ipcRenderer.invoke('lumi-clear-history'),
  
  // Knowledge
  loadKnowledge: () => ipcRenderer.invoke('lumi-load-kb'),
  reloadKB: () => ipcRenderer.invoke('lumi-kb-reload'),
  searchKB: (query: string) => ipcRenderer.invoke('lumi-search-kb', query),
  
  // Self-learning
  selflearn: {
    status: () => ipcRenderer.invoke('lumi-selflearn-status'),
    start: () => ipcRenderer.invoke('lumi-selflearn-start'),
    stop: () => ipcRenderer.invoke('lumi-selflearn-stop'),
    pause: () => ipcRenderer.invoke('lumi-selflearn-pause'),
    resume: () => ipcRenderer.invoke('lumi-selflearn-resume'),
    getProgress: () => ipcRenderer.invoke('lumi-selflearn-progress'),
  },
  
  // Metrics
  getMetrics: () => ipcRenderer.invoke('lumi-metrics'),
  
  // Suggestions
  listSuggestions: () => ipcRenderer.invoke('lumi-list-suggestions'),
  
  // Security
  listStaging: () => ipcRenderer.invoke('lumi-list-staging'),
  approve: (ids: string[]) => ipcRenderer.invoke('lumi-approve', ids),
  reject: (ids: string[]) => ipcRenderer.invoke('lumi-reject', ids),
  
  // Signals
  recordCopy: () => ipcRenderer.invoke('lumi-record-copy'),
  correction: (wrong: string, correct: string) => 
    ipcRenderer.invoke('lumi-correction', wrong, correct),
  
  // Events
  onLearningEvent: (callback: Function) => 
    ipcRenderer.on('lumi-learning-event', (event, data) => callback(data)),
});
```

---

## Data Flow

### Query Flow (Chat)

```
1. User types message in UI
2. UI calls window.lumi.think(message, { useKB: true })
3. Preload invokes 'lumi-think' IPC
4. Main process receives, calls brain.think()
5. Brain searches KB for relevant context
6. If KB hit with high confidence, synthesize answer from KB
7. Otherwise, construct prompt with KB context + history
8. Brain calls ollama.chat(messages)
9. Ollama processes with qwen2.5-coder or llama3
10. Response returned through chain
11. UI displays response with streaming
12. Signal detector analyzes interaction
13. Signals stored and KB quality updated
```

### Learning Flow (Autonomous)

```
1. DeepLearningAgent ticks every 10 seconds
2. Scans for unprocessed files in watchPaths
3. Checks rate limit (token bucket)
4. If tokens available:
   a. Read file content
   b. Redact PII
   c. Call Ollama: "Extract Q&A pairs from this code"
   d. Parse JSON response
   e. Call KnowledgeProcessor.ingest(candidates, filePath)
5. KnowledgeProcessor:
   a. Validates candidates
   b. Checks for duplicates
   c. Writes to multiple KB files
   d. Appends to audit trail
   e. Adds to memory store
   f. Runs threat scan
   g. Emits learning event to UI
6. UI receives event and updates metrics panel
7. User sees "Knowledge entries: 131" increase in real-time
```

### Suggestion Flow

```
1. After extracting knowledge, agent calls generateSuggestions()
2. Ollama analyzes code: "Suggest 2-3 improvements"
3. Parses suggestions with priority and reasoning
4. Writes to selflearn_suggestions.jsonl
5. Emits suggestions event to UI
6. User can view in Security Curator or dedicated panel
7. (Future) User can apply, reject, or edit suggestions
```

---

## File Structure

```
src/
├── main.ts                          # Electron main process
├── preload.ts                       # IPC bridge
├── renderer.tsx                     # React entry
├── Codelumibegin.tsx                   # Main UI component
│
├── core/
│   ├── llm/
│   │   └── ollama.ts                # Ollama client
│   │
│   ├── brain/
│   │   ├── index.ts                 # Brain orchestrator
│   │   ├── context.ts               # Context retrieval
│   │   └── prompts.ts               # Prompt templates
│   │
│   ├── memory/
│   │   ├── store.ts                 # MemoryStore (JSONL)
│   │   ├── kb.ts                    # KnowledgeBase (BM25 search)
│   │   └── db.ts                    # (Future) Dexie database
│   │
│   └── learning/
│       ├── signals.ts               # SignalProcessor
│       ├── knowledge-processor.ts   # KnowledgeProcessor ⭐ NEW
│       ├── candidate-extractor.ts   # CandidateExtractor
│       ├── candidate-validator.ts   # CandidateValidator
│       └── patterns.ts              # Pattern extraction (future)
│
├── selflearning/
│   └── safe-agent-deep.ts           # DeepLearningAgent ⭐ NEW
│
├── security/
│   ├── threat_detection.ts          # Threat scanning
│   ├── sanitizer.ts                 # Input sanitization
│   └── input_validation.ts          # Validation rules
│
├── components/
│   └── security/
│       └── SecurityCurator.tsx      # Curator UI
│
└── ui/
    └── components/
        └── [various UI components]
```

---

## Configuration

### Environment Variables

```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

### User Settings (localStorage)

```typescript
interface UserSettings {
  model: 'qwen2.5-coder:7b' | 'llama3' | 'mistral' | 'codellama';
  theme: 'light' | 'dark';
  maxHistory: number;
  streamResponses: boolean;
  
  // Self-learning settings
  selfLearnEnabled: boolean;
  selfLearnRate: number;        // files per minute
  selfLearnDeepMode: boolean;   // full file vs excerpts
}
```

### Agent Configuration

**File:** `userData/selflearn_config.json`

```json
{
  "enabled": true,
  "ratePerMinute": 6,
  "deepMode": true,
  "readFullFile": true,
  "deepExtensions": [".ts", ".tsx", ".js", ".jsx", ".py", ".md", ".json"],
  "excludeDirs": ["node_modules", ".git", "dist", "build", "release", "vendor"],
  "progressTracking": true
}
```

---

## Performance Targets

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Time to first token | < 1s | ~0.5s | With streaming |
| Full response time | < 10s | ~3-5s | Depends on length |
| Memory usage | < 500MB | ~400MB | Electron + Node |
| KB search | < 100ms | ~50ms | BM25 |
| Learning rate | 6 files/min | 6 files/min | Configurable |
| Knowledge extraction | ~10s/file | ~10s/file | Via Ollama |
| Suggestion generation | ~8s/file | ~8s/file | Via Ollama |

---

## Security Considerations

### Local Security
- ✅ No sensitive data in logs (PII redacted)
- ✅ IPC validation on all handlers
- ✅ Threat scanning on all learned content
- ✅ Quarantine system for suspicious entries
- ✅ User approval required for staging merges
- ⏳ Sandboxed code execution (planned)

### Data Privacy
- ✅ All processing happens locally
- ✅ No data sent to external services
- ✅ PII redaction in all outputs
- ✅ User controls learning on/off
- ✅ Full audit trail of learned content

### Code Safety
- ✅ File path validation (no escaping project root)
- ✅ Exclude sensitive directories
- ✅ Rate limiting prevents resource exhaustion
- ✅ Error handling prevents crashes
- ⏳ Resource limits (CPU, memory) planned

---

## Current System Stats

**As of 2026-01-27:**
- **Total KB Entries:** 130+
- **Deep-Learned:** 130+ (from 40+ files)
- **Manual Entries:** 79 (from training.jsonl)
- **Suggestions Generated:** 120+
- **Learning Rate:** 10-12 entries/hour
- **Agent Mode:** Deep (6 files/min, full reads)
- **Average Confidence:** 0.85
- **Threat Detections:** 0 (all entries clean)

---

## Future Extensions

### Phase 2: Enhanced Learning
- Semantic deduplication (embeddings)
- Confidence-based filtering
- Knowledge graph relationships
- Multi-file context understanding
- Cross-repository learning

### Phase 3: Advanced Features
- RAG integration for answer synthesis
- Fine-tuned embedding model
- Autonomous bug detection
- Self-directed testing
- Documentation generation

### Phase 4: Cloud Backend (Optional)
- FastAPI server for web access
- PostgreSQL for persistent storage
- Qdrant vector store for semantic search
- Redis cache for performance
- Federated learning contributions

### Phase 5: Collaboration
- Multi-agent workflows
- Team knowledge sharing
- Shared KB across projects
- Contribution aggregation
- Model distribution

---

## Monitoring & Debugging

### Logs to Watch

**Terminal (Main Process):**
```
[DeepAgent] generateKnowledge called for: executor_stub.ts
[Brain] ollama.chat returned type= string len= 1056
[DeepAgent] Parsed 3 candidate(s)
[DeepAgent] Calling KnowledgeProcessor.ingest with 3 candidates
[KnowledgeProcessor] 📥 Starting ingest for executor_stub.ts with 3 candidates
[KnowledgeProcessor] 📖 Read existing KB, length: 113208
[KnowledgeProcessor] 📚 Existing entries: 61
[KnowledgeProcessor] ✨ Adding 3 new entries (64 total)
[KnowledgeProcessor] ✅ Wrote main KB: C:\Users\...\lumi_knowledge.json
[KnowledgeProcessor] ✅ Wrote self-learn KB: ...
[KnowledgeProcessor] ✅ Wrote training KB: ...
[KnowledgeProcessor] ✅ Wrote audit entries: ...
[KnowledgeProcessor] ✅ Added 3 entries to memory
[KnowledgeProcessor] ✅ Wrote 3 validation records: ...
[KnowledgeProcessor] 📡 Emitted learning event to renderer
[KnowledgeProcessor] 🎉 Ingest complete: 3 added, 64 total
[DeepAgent] ✅ Stored 3 entries from executor_stub.ts
[DeepAgent] 💡 Generated 3 suggestions for executor_stub.ts
```

**DevTools Console (Renderer):**
```javascript
// Check KB
const kb = await window.lumi.loadKnowledge();
console.log('Total:', kb.length);
console.log('Deep-learned:', kb.filter(e => e.source === 'deep-learning').length);

// Check agent status
const status = await window.lumi.selflearn.status();
console.log('Agent:', status);

// Check metrics
const metrics = await window.lumi.getMetrics();
console.log('Metrics:', metrics);

// Check progress
const progress = await window.lumi.selflearn.getProgress();
console.log('Files processed:', Object.keys(progress.progress || {}).length);
```

### Health Checks

**Ollama Connection:**
```bash
curl http://localhost:11434/api/tags
```

**File System:**
```bash
# Check KB files exist
ls C:\Users\[User]\AppData\Roaming\lumi-desktop\lumi_knowledge.json
ls C:\Users\[User]\AppData\Roaming\lumi-desktop\self-learn\

# Check file sizes
dir C:\Users\[User]\AppData\Roaming\lumi-desktop\*.json*
```

---

**This architecture supports fully autonomous learning while maintaining user control, privacy, and security. The system learns continuously as it runs, building a comprehensive knowledge base of the user's codebase without requiring manual intervention.**
