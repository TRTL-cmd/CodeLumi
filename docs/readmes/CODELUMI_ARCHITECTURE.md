# ARCHIVE: CODELUMI_ARCHITECTURE.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/CODELUMI_ARCHITECTURE.md

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CODELUMI LOCAL APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    RENDERER PROCESS                      │   │
│  │                    (React + UI)                          │   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │   Chat   │  │  Avatar  │  │ Settings │             │   │
│  │  │    UI    │  │ (Three)  │  │   Panel  │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │                                                          │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │ IPC                               │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                     MAIN PROCESS                          │   │
│  │                     (Electron)                            │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                  CODELUMI'S BRAIN                     │   │   │
│  │  │                                                   │   │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │   │
│  │  │  │ Context │  │  Prompt │  │Response │         │   │   │
│  │  │  │Retriever│→ │ Builder │→ │Processor│         │   │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘         │   │   │
│  │  │       ↑                           │              │   │   │
│  │  │       └───────────────────────────┘              │   │   │
│  │  │                   ↓ ↑                            │   │   │
│  │  │  ┌─────────────────────────────────────────┐   │   │   │
│  │  │  │              MEMORY SYSTEM               │   │   │   │
│  │  │  │         (IndexedDB / Dexie)             │   │   │   │
│  │  │  └─────────────────────────────────────────┘   │   │   │
│  │  │                                                   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                         │                                │   │
│  │                         │ HTTP                           │   │
│  │                         ▼                                │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                    OLLAMA                         │   │   │
│  │  │           (localhost:11434)                       │   │   │
│  │  │                                                   │   │   │
│  │  │          Llama 3 / Mistral / CodeLlama           │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Ollama Client

**Location:** `src/core/llm/ollama.ts`

**Purpose:** Communicate with local Ollama server

```typescript
interface OllamaClient {
  // Configuration
  baseUrl: string;          // Default: http://localhost:11434
  model: string;            // Default: llama3
  
  // Core methods
  generate(prompt: string): Promise<string>;
  chat(messages: Message[]): Promise<string>;
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
```

**API Endpoints Used:**
- `POST /api/generate` — Text completion
- `POST /api/chat` — Chat completion
- `GET /api/tags` — List models
- `POST /api/embeddings` — Generate embeddings

---

### 2. Brain Module

**Location:** `src/core/brain/index.ts`

**Purpose:** Orchestrate LLM, memory, and learning

```typescript
interface Brain {
  // Main thinking
  think(userMessage: string): Promise<string>;
  thinkStream(userMessage: string): AsyncGenerator<string>;
  
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
}

interface Plan {
  id: string;
  goal: string;
  steps: Step[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface Step {
  id: string;
  action: 'think' | 'readFile' | 'writeFile' | 'runCommand';
  description: string;
  args: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
}
```

**System Prompt:**
```
You are Codelumi, a friendly and helpful AI coding assistant.

Your traits:
• Enthusiastic and encouraging
• Patient with beginners, precise with experts
• You explain your reasoning clearly
• You provide working code examples
• You admit when you don't know something

When helping with code:
• Always provide complete, working examples
• Explain what the code does and why
• Point out potential issues
• Suggest best practices
```

---

### 3. Memory System

**Location:** `src/core/memory/db.ts`

**Purpose:** Persistent storage for conversations and knowledge

```typescript
// Using Dexie (IndexedDB wrapper)
interface MemoryDatabase {
  episodes: Table<Episode>;
  knowledge: Table<KnowledgeItem>;
  signals: Table<Signal>;
}

interface Episode {
  id: string;
  type: 'conversation' | 'event' | 'correction';
  userMessage: string;
  assistantResponse: string;
  timestamp: number;
  signals?: Signal[];
  embedding?: number[];
}

interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  quality: number;        // -1 to 1, updated by signals
  usageCount: number;
  lastUsed: number;
  createdAt: number;
  embedding?: number[];
}

interface Signal {
  id: string;
  episodeId: string;
  type: 'positive' | 'negative';
  source: 'code_execution' | 'user_copy' | 'user_correction' | 
          'repeat_question' | 'sentiment';
  confidence: number;     // 0 to 1
  timestamp: number;
}
```

**Storage Limits:**
- Episodes: Keep last 1000
- Knowledge: Keep last 5000 items
- Signals: Keep last 10000

---

### 4. Signal Detector

**Location:** `src/core/learning/signals.ts`

**Purpose:** Automatically detect learning signals

```typescript
interface SignalDetector {
  // Detect all signals for an interaction
  detectSignals(interaction: Interaction): Signal[];
  
  // Individual detectors
  detectCodeExecution(code: string): ExecutionSignal;
  detectUserCorrection(messages: Message[]): CorrectionSignal | null;
  detectRepeatQuestion(question: string, history: Message[]): boolean;
  detectSentiment(text: string): SentimentSignal;
  
  // Events
  onCopy(): void;
}

interface Interaction {
  userMessage: string;
  assistantResponse: string;
  codeBlocks: string[];
  previousMessages: Message[];
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

### 5. IPC Bridge

**Main Process (main.ts):**

```typescript
// Brain handlers
ipcMain.handle('lumi-think', async (event, message: string) => {
  const response = await brain.think(message);
  return { ok: true, response };
});

ipcMain.handle('lumi-ready', async () => {
  const ready = await brain.isReady();
  return { ok: true, ready };
});

ipcMain.handle('lumi-clear-history', async () => {
  brain.clearHistory();
  return { ok: true };
});

ipcMain.handle('lumi-record-copy', async () => {
  brain.recordCopyEvent();
  return { ok: true };
});

ipcMain.handle('lumi-correction', async (event, wrong, correct) => {
  await brain.handleCorrection(wrong, correct);
  return { ok: true };
});

// Persistence handlers (existing)
ipcMain.handle('lumi-save', async (event, data) => { ... });
ipcMain.handle('lumi-load', async () => { ... });
```

**Preload (preload.ts):**

```typescript
contextBridge.exposeInMainWorld('lumi', {
  // Brain
  think: (msg: string) => ipcRenderer.invoke('lumi-think', msg),
  isReady: () => ipcRenderer.invoke('lumi-ready'),
  clearHistory: () => ipcRenderer.invoke('lumi-clear-history'),
  recordCopy: () => ipcRenderer.invoke('lumi-record-copy'),
  correction: (wrong: string, correct: string) => 
    ipcRenderer.invoke('lumi-correction', wrong, correct),
  
  // Persistence
  save: (data: any) => ipcRenderer.invoke('lumi-save', data),
  load: () => ipcRenderer.invoke('lumi-load'),
});
```

---

## Data Flow

### Query Flow

```
1. User types message in UI
2. UI calls window.lumi.think(message)
3. Preload invokes 'lumi-think' IPC
4. Main process receives, calls brain.think()
5. Brain retrieves context from memory
6. Brain constructs prompt with context
7. Brain calls ollama.chat(messages)
8. Ollama processes with Llama/Mistral
9. Response returned through chain
10. UI displays response
11. Signal detector analyzes interaction
12. Signals stored in memory
```

### Learning Flow

```
1. Interaction occurs
2. Signal detector runs automatically
3. Signals generated based on behavior
4. Signals stored with episode
5. Knowledge quality scores updated
6. Future retrieval weights adjusted
7. (If opted in) Patterns queued for contribution
```

---

## File Structure

```
src/
├── main.ts                 # Electron main process
├── preload.ts              # IPC bridge
├── renderer.tsx            # React entry
├── Codelumibegin.tsx           # Main UI component
│
├── core/
│   ├── llm/
│   │   └── ollama.ts       # Ollama client
│   │
│   ├── brain/
│   │   ├── index.ts        # Brain orchestrator
│   │   ├── context.ts      # Context retrieval
│   │   └── prompts.ts      # Prompt templates
│   │
│   ├── memory/
│   │   ├── db.ts           # Dexie database
│   │   ├── episodes.ts     # Episode operations
│   │   └── knowledge.ts    # Knowledge operations
│   │
│   └── learning/
│       ├── signals.ts      # Signal detection
│       ├── patterns.ts     # Pattern extraction
│       └── contributor.ts  # Federated client
│
├── brain/
│   └── index.js            # Existing planner (keep)
│
└── ui/
    └── components/
```

---

## Configuration

### Environment Variables

```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
```

### User Settings (localStorage)

```typescript
interface UserSettings {
  model: 'llama3' | 'mistral' | 'codellama';
  theme: 'light' | 'dark';
  contributionTier: 0 | 1 | 2 | 3;
  maxHistory: number;
  streamResponses: boolean;
}
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Time to first token | < 1s | With streaming |
| Full response time | < 10s | Depends on length |
| Memory usage | < 500MB | Electron + LLM |
| Context retrieval | < 100ms | From IndexedDB |
| Signal detection | < 50ms | After response |

---

## Security Considerations

### Local Security
- No sensitive data in logs
- IPC validation
- Sandboxed code execution (future)

### Contribution Security
- No raw code shared
- Aggressive PII scrubbing
- User approval for all contributions
- Encrypted transmission

---

## Future Extensions

### Phase 2: Cloud Backend
- FastAPI server
- PostgreSQL database
- Redis cache
- Qdrant vector store

### Phase 4: Federated Learning
- Contribution API
- Anonymization pipeline
- Aggregation service
- Model distribution

---

**This architecture supports the full vision while being buildable incrementally.**
