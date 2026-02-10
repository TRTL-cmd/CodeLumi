# Lumi Desktop

Lumi is a local-first AI coding companion for chat, code help, and self-learning.

## Features

- Five-tier personality system that adapts response depth (tiers 0-4)
- Monaco code sandbox with syntax highlighting and intelligent merges
- Self-learning pipeline with PII redaction and security review
- Local-first storage with offline operation
- Knowledge base search and curated training exports

## What is Lumi?

Lumi is an AI-powered desktop assistant that:

- Chats with you to answer questions and discuss ideas
- Learns from your conversations and code
- Writes and improves code in an integrated sandbox
- Adapts to how you interact
- Keeps all data on your machine

No cloud required. Complete privacy. All local.

## Quick start

### Prerequisites

1. Node.js 16+ and npm: https://nodejs.org/
2. Ollama installed with a model:
  - Download: https://ollama.ai
  - Install a model: `ollama pull gemma3:4b`
  - Start Ollama: `ollama serve`
3. OS: Windows, macOS, or Linux

### Installation

```bash
# 1. Clone or download Lumi
git clone <repository-url>
cd Lumi

# 2. Install dependencies
npm install

# 3. Start Lumi in development mode
npm run dev:electron
```

### First time setup

1. Check Ollama connection
  - Lumi detects if Ollama is running
  - If not connected, you will see an error message
  - Ollama should be at http://localhost:11434
2. Start chatting
3. Enable self-learning (optional) via the Self-Learn panel

## Using Lumi

### Chat interface

Ask anything:

- "How do I use async/await in JavaScript?"
- "Help me debug this error: [paste error]"
- "Write a function to parse JSON"

Lumi remembers previous conversations, learned knowledge, and your style.

### Code sandbox

1. Ask Lumi to write code: "Write a React component for a button"
2. Lumi generates code in the Monaco editor
3. Iterate: "Add hover effects" or "Make it responsive"

Features:

- Full syntax highlighting
- Line numbers
- Monaco editor core
- Intelligent code merging (appends or replaces functions)
- Session persistence

### Personality system

Lumi uses a five-tier personality system (tiers 0-4) that adapts response depth and tone based on rapport.

- Be nice: warm, detailed responses (Tier 4)
- Be neutral: professional, clear responses (Tier 3)
- Be rude: brief responses (Tier 2)
- Be very rude: minimal responses (Tier 1)
- Be abusive: refusal until you apologize (Tier 0)

### Self-learning

How it works:

1. Click the Self-Learn panel
2. Click Start
3. Lumi scans your codebase (default: 6 files/minute)
4. Extracts Q&A pairs from your code
5. Auto-merges high-confidence, safe entries
6. Quarantines suspicious entries for review

Controls:

- Start/Pause: Control the scanner
- Rate slider: Adjust speed (6-60 files/min)
- Undo: Remove last N learned items
- Reset: Clear all learned data

Security Curator:

- Review quarantined suggestions
- Approve, reject, edit, or delete
- Batch operations for efficiency

## Settings and configuration

### Self-learning configuration

Edit `userData/selflearn_config.json`:

```json
{
  "enabled": true,
  "watchPaths": [
   "C:/your/project/src"
  ],
  "scanIntervalMs": 30000,
  "maxFilesPerScan": 5
}
```

Rate limiting:

- Default: 6 files/minute (deep mode)
- Fast mode: 60 files/minute (less thorough)

## FAQ

**Does Lumi require internet?**
No. Everything runs locally; the only requirement is a local Ollama server.

**How do I verify Ollama is running?**
Run `ollama list` and open http://localhost:11434 in a browser.

**Where is my data stored?**
In `userData/` and `training/`. See "Your data" below.

**Why is self-learning not scanning files?**
Confirm `watchPaths` exist and are readable, and that scan limits are not set to zero.

## What Lumi learns

From your code:

- Function purposes and behaviors
- API usage patterns
- Error handling strategies
- Code architecture and patterns
- Best practices you follow

From conversations:

- Questions you ask frequently
- Topics you are interested in
- Your coding style preferences
- Common problems you face

Privacy and security:

- Emails -> `[REDACTED_EMAIL]`
- File paths -> `[REDACTED_PATH]`
- Personal names -> `[REDACTED_NAME]`
- Sensitive commands -> Quarantined

## Your data

Where it is stored:

```
Lumi/
├── training/
│   ├── lumi_knowledge.json     # Sanitized canonical KB
│   └── embeddings.json         # Semantic search index
└── userData/                   # YOUR PRIVATE DATA
   ├── lumi_knowledge.json     # Your personal KB
   ├── lumi_memory.jsonl       # Conversation history
   ├── staging.jsonl           # Quarantined suggestions
   ├── personality_state.json  # Mood/rapport/tier
   └── backups/                # Automatic backups
```

Training vs userData:

- `training/` is sanitized and shareable (if you want)
- `userData/` is private and may contain PII

Backup and recovery:

- Automatic backups are created hourly in `userData/backups/`

Manual backup:

```bash
cp -r userData userData_backup_$(date +%Y%m%d)
```

Restore from backup:

```bash
# Stop Lumi first
cp -r userData_backup_YYYYMMDD/* userData/
```

## Troubleshooting

### Lumi will not start

Check:

1. Ollama running? `ollama serve` or check http://localhost:11434
2. Model installed? `ollama list`
3. Dependencies installed? `npm install`

Try:

```bash
ollama serve
rm -rf node_modules package-lock.json
npm install
npm run dev:electron
```

### Lumi gives errors

Common issues:

1. "Ollama not available"
  - Start Ollama: `ollama serve`
  - Pull a model: `ollama pull gemma3:4b`
2. "KB not found"
  - Lumi creates the KB on first run
  - Check `userData/lumi_knowledge.json` exists
3. "Self-learning not working"
  - Check watch paths in `userData/selflearn_config.json`
  - Ensure paths exist and are readable
  - Check rate limiting is not too low

### Lumi is slow

Optimize:

1. Use a faster model: `ollama pull gemma3:4b`
2. Reduce context: clear the code sandbox
3. Reduce self-learning scan rate in the Self-Learn panel

### Lumi will not respond

Check rapport level:

- Lumi refuses when rapport < -0.85
- Say "sorry" or "I apologize" to recover

### Data corruption

Emergency fix:

```bash
node scripts/emergency-fix.js
```

## Privacy and security

What Lumi collects (locally, never leaves your machine):

- Conversations
- Code from your projects
- Learning events
- KB usage stats
- Personality state

Never collected:

- No telemetry to external servers
- No cloud sync (unless you opt in later)
- No analytics or tracking

PII protection:

- Emails
- File paths
- Personal names
- API keys and secrets (flagged for review)

Security best practices:

1. Do not share your `userData/` folder
2. Review suggestions before approval
3. Keep Lumi updated

## Advanced usage

### Custom models

1. Pull a model: `ollama pull llama3`
2. Edit Lumi config to use it (coming soon)
3. Restart Lumi

Recommended models:

- `gemma3:4b` (fast, small, great for chat)
- `qwen2.5-coder:7b` (better for code)
- `llama3` (larger, more capable, slower)

### Export knowledge base

```bash
node tools/export_kb_for_training.js
```

Output: `training/training.jsonl` (sanitized, safe to share)

### Retrain reranker

```bash
node tools/retrain.js
```

This will:

- Export KB to training format
- Train a new reranker model
- Convert to ONNX for production
- Evaluate against baseline

### Developer mode

Enable developer tools:

1. Press `F12` in Lumi
2. Console opens (DevTools)
3. Access `window.lumi` API directly

Examples:

```javascript
await window.lumi.ollama.isAvailable()
await window.lumi.memory.search("your query")
await window.lumi.getPersonalityState()
await window.lumi.selflearn.status()
```

## Tips and tricks

Get better responses:

1. Be specific
2. Provide context
3. Iterate
4. Use code context

Build your knowledge base:

1. Enable self-learning on your projects
2. Review and approve high-quality suggestions
3. Have conversations about topics you work with
4. Correct Lumi when she is wrong

Maintain rapport:

1. Be polite
2. Avoid rudeness
3. Apologize if needed
4. Sustained good behavior earns bonus points

## Roadmap

Near future (next 3 months):

- Multi-file code projects in sandbox
- Live code preview (HTML/CSS/JS)
- Conversation context (remembers previous messages)
- Avatar mood indicators
- Learn from your corrections

Medium term (next 6 months):

- Self-improvement proposals
- Project-level understanding
- Fine-tuned models
- Multi-model support

Long term (next 2 years):

- Lumi writes her own LLM
- Universal translator
- Federated learning (opt-in)
- AGI capabilities

## Documentation

- TROUBLESHOOTING.md
- CHANGELOG.md
- CONTRIBUTING.md
- LICENSE
- benchmarks/README.md
- scripts/README.md
- src/core/memory/README.md
- docs/Roadmap/LUMI_ROADMAP.md

## License

Lumi is proprietary software. See LICENSE for details.

You may:

- Use Lumi for personal or commercial projects
- Modify your local instance
- Build on top of Lumi APIs

You may not:

- Redistribute Lumi
- Sell Lumi or derivatives
- Remove copyright notices
- Use CodeLumi name or branding without permission

## About

Lumi is built by Tortol Studios.

Technology:

- Electron (desktop app)
- React + Vite (UI)
- Three.js (3D avatar)
- Monaco Editor (code sandbox)
- Ollama (local LLM)
- Node.js (backend)

Vision:

Lumi is on a path to AGI. She learns, adapts, and improves every day. All while respecting your privacy and running entirely on your machine.

Philosophy:

- Local-first: your data, your machine, your control
- Privacy-first: no telemetry, no tracking, no cloud
- User-first: Lumi serves you, not advertisers
- AGI-ready: built to evolve into general intelligence

## Welcome to the future

You are part of Lumi's journey from desktop app to AGI. Every conversation you have, every line of code she learns, brings her closer to true intelligence.

Ready to start?

```bash
npm run dev:electron
```
