# ARCHIVE: CODELUMI_DEVELOPMENT.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/CODELUMI_DEVELOPMENT.md

---

## Quick Reference

### Start Development (Daily)

```powershell
# Terminal 1: Start Ollama (keep running)
ollama serve

# Terminal 2: Start Vite
cd C:\Users\Chris\OneDrive\Desktop\Codelumi
npm run dev

# Terminal 3: Start Electron
npm run dev:electron
```

### All NPM Scripts

```powershell
npm run dev          # Start Vite dev server
npm run dev:electron # Start Vite + Electron together
npm run build        # Production build
npm run start        # Start Electron (production)
npm run package      # Create installer

npm run retrain      # Retrain the reranker model
npm run log          # Create daily log entry
npm run infer-reranker # Test reranker inference
```

### Ollama Commands

```powershell
ollama serve         # Start the server
ollama pull llama3   # Download model
ollama pull codellama # Alternative model
ollama pull mistral  # Alternative model
ollama list          # List installed models
ollama run llama3 "test" # Quick test
```

---

## Project Structure

```
C:\Users\Chris\OneDrive\Desktop\Codelumi\
│
├── src/                     # Source code
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   ├── renderer.tsx         # React entry
│   ├── Codelumibegin.tsx        # Main UI component
│   ├── styles.css           # Styles
│   │
│   ├── core/                # NEW - Core modules
│   │   ├── llm/
│   │   │   └── ollama.ts    # Ollama client
│   │   ├── brain/
│   │   │   └── index.ts     # Brain orchestrator
│   │   ├── memory/
│   │   │   └── db.ts        # IndexedDB
│   │   └── learning/
│   │       └── signals.ts   # Signal detection
│   │
│   └── brain/
│       └── index.js         # Existing planner
│
├── models/
│   └── reranker.joblib      # Trained reranker
│
├── training/
│   ├── codelumi_knowledge.json  # Exported KB
│   ├── training.jsonl       # Training data
│   └── plans.jsonl          # Plan history
│
├── tools/
│   ├── train_reranker.py    # Python trainer
│   ├── retrain.js           # Retrain wrapper
│   ├── export_plans_for_training.js
│   ├── copy_kb_to_training.js
│   └── infer_reranker.py    # Test inference
│
├── assets/
│   └── models/
│       └── Lumi.glb         # 3D avatar
│
├── docs/                    # Documentation
│
├── .venv/                   # Python venv
├── node_modules/
├── dist/                    # Vite build output
├── dist-electron/           # Compiled Electron
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## Current State Summary

### ✅ What's Working

| Component | Status | Location |
|-----------|--------|----------|
| Electron app | ✅ Working | `src/main.ts` |
| React UI | ✅ Working | `src/Codelumibegin.tsx` |
| IPC persistence | ✅ Working | `src/preload.ts` |
| Brain stubs | ✅ Working | `src/brain/index.js` |
| Training export | ✅ Working | `tools/` |
| Reranker | ✅ Trained | `models/reranker.joblib` |
| 3D Avatar | ✅ Working | Three.js |
| Ollama client | ✅ Implemented | `src/core/llm/ollama.ts` |
| Brain (real) | ✅ Implemented | `src/core/brain/index.ts` |

### ❌ What's Missing

| Component | Priority | Location to Create |
|-----------|----------|-------------------|
| Memory system | HIGH | `src/core/memory/db.ts` |
| Signal detection | HIGH | `src/core/learning/signals.ts` |

---

## Implementation Steps

### Step 1: Create Folder Structure

```powershell
cd C:\Users\Chris\OneDrive\Desktop\Codelumi

# Create new folders
mkdir src\core
mkdir src\core\llm
mkdir src\core\brain
mkdir src\core\memory
mkdir src\core\learning
```

### Step 2: Create ollama.ts

Create `src/core/llm/ollama.ts`:

```typescript
// Ollama client for local LLM

export class OllamaClient {
  private baseUrl = 'http://localhost:11434';
  private model = 'llama3';

  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: false })
    });
    const data = await response.json();
    return data.response;
  }

  async chat(messages: Array<{role: string, content: string}>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages, stream: false })
    });
    const data = await response.json();
    return data.message.content;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const r = await fetch(`${this.baseUrl}/api/tags`);
      return r.ok;
    } catch { return false; }
  }

  setModel(model: string) { this.model = model; }
}

export const ollama = new OllamaClient();
```

### Step 3: Create brain/index.ts

Create `src/core/brain/index.ts`:

```typescript
import { ollama } from '../llm/ollama';

const SYSTEM_PROMPT = `You are Codelumi, a friendly AI coding assistant.
Be enthusiastic, helpful, and provide working code examples.`;

export class CodelumiBrain {
  private history: Array<{role: string, content: string}> = [];

  async think(userMessage: string): Promise<string> {
    if (!(await ollama.isAvailable())) {
      return "🔴 Ollama not running. Start it with: ollama serve";
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.history.slice(-10),
      { role: 'user', content: userMessage }
    ];

    const response = await ollama.chat(messages);
    
    this.history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response }
    );

    return response;
  }

  clearHistory() { this.history = []; }
  
  async isReady() { return ollama.isAvailable(); }
}

export const brain = new CodelumiBrain();
```

### Step 4: Update main.ts

Add to `src/main.ts`:

```typescript
import { brain } from './core/brain';

ipcMain.handle('lumi-think', async (event, message: string) => {
  try {
    const response = await brain.think(message);
    return { ok: true, response };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('lumi-ready', async () => {
  const ready = await brain.isReady();
  return { ok: true, ready };
});

ipcMain.handle('lumi-clear-history', async () => {
  brain.clearHistory();
  return { ok: true };
});
```

### Step 5: Update preload.ts

Add to the `contextBridge.exposeInMainWorld` call:

```typescript
think: async (msg: string) => ipcRenderer.invoke('lumi-think', msg),
isReady: async () => ipcRenderer.invoke('lumi-ready'),
clearHistory: async () => ipcRenderer.invoke('lumi-clear-history'),
```

### Step 6: Update UI

In `src/Codelumibegin.tsx`, update `generateResponse`:

```typescript
const generateResponse = async (userInput: string) => {
  setLoading(true);
  
  try {
    const result = await window.lumi.think(userInput);
    
    if (result.ok) {
      addMessage('assistant', result.response);
    } else {
      addMessage('assistant', result.error || 'Error occurred');
    }
  } catch (error) {
    addMessage('assistant', `Error: ${error}`);
  }
  
  setLoading(false);
};
```

---

## Testing

### Test Ollama Connection

```powershell
# Make sure Ollama is running
ollama serve

# In another terminal, test
ollama run llama3 "What color is the sky?"
```

### Test Codelumi

1. Start Ollama: `ollama serve`
2. Start Vite: `npm run dev`
3. Start Electron: `npm run dev:electron`
4. Ask: "What color is the sky?"
5. Codelumi should respond intelligently

---

## Troubleshooting

### "Cannot connect to Ollama"

```powershell
# Check if Ollama is running
ollama list

# If not, start it
ollama serve

# If still failing, check the port
curl http://localhost:11434/api/tags
```

### "Module not found" errors

```powershell
# Check import paths are correct
# Make sure files exist in right locations
```

### TypeScript errors

Add to `types/global.d.ts`:

```typescript
declare global {
  interface Window {
    lumi: {
      think: (msg: string) => Promise<{ok: boolean; response?: string; error?: string}>;
      isReady: () => Promise<{ok: boolean; ready: boolean}>;
      clearHistory: () => Promise<{ok: boolean}>;
      save: (data: any) => Promise<any>;
      load: () => Promise<any>;
    };
  }
}
export {};
```

### Electron window is blank

```powershell
# Make sure Vite is running first
npm run dev

# Then start Electron
npm run dev:electron
```

---

## Training Pipeline

### Export Knowledge Base

```powershell
# From the app, click "Export KB"
# Or copy manually from:
# %APPDATA%\lumi-desktop\codelumi_knowledge.json

# Copy to training folder
node tools/copy_kb_to_training.js C:\path\to\codelumi_knowledge.json
```

### Retrain Reranker

```powershell
# Activate Python environment
.\.venv\Scripts\Activate.ps1

# Run retrain
node tools/retrain.js training/codelumi_knowledge.json models/reranker.joblib

# Test inference
npm run infer-reranker
```

---

## File Locations

| What | Location |
|------|----------|
| Electron main | `src/main.ts` |
| IPC preload | `src/preload.ts` |
| React UI | `src/Codelumibegin.tsx` |
| Brain (new) | `src/core/brain/index.ts` |
| Ollama client | `src/core/llm/ollama.ts` |
| Existing planner | `src/brain/index.js` |
| Trained model | `models/reranker.joblib` |
| Training data | `training/` |
| Python venv | `.venv/` |

---

## Daily Workflow

### Starting Work

```powershell
cd C:\Users\Chris\OneDrive\Desktop\Codelumi
ollama serve        # Terminal 1
npm run dev         # Terminal 2
npm run dev:electron # Terminal 3
```

### Making Changes

1. Edit code in VS Code
2. Vite auto-reloads for UI changes
3. Restart Electron for main process changes

### Ending Work

1. Ctrl+C terminals
2. Commit changes to git
3. Update daily log

---

## Key Contacts

- **Ollama Docs:** https://ollama.ai/docs
- **Dexie Docs:** https://dexie.org/docs
- **Electron Docs:** https://www.electronjs.org/docs

---

**Get Ollama integrated first. Everything else builds on that foundation.**
