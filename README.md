# Lumi Desktop

**An AI-powered learning assistant with personality, knowledge retention, and self-improvement capabilities.**

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Beta-yellow.svg)](BETA_LAUNCH_FINAL_STEPS.md)

Copyright (c) 2026 Tortol studios. All rights reserved.

---

## What is Lumi?

Lumi is an intelligent desktop assistant that learns from your interactions, retains knowledge across sessions, and continuously improves its responses. Built with Electron, React, and integrated with local LLMs (Ollama), Lumi provides:

- **Conversational AI** - Chat interface powered by local language models
- **Knowledge Retention** - Builds a persistent knowledge base from interactions
- **Self-Learning** - Automatically discovers insights from your codebase
- **Security-First** - PII scrubbing, threat detection, and human-curated suggestions
- **Personality Engine** - Dynamic tone adjustment based on interaction history

---

## Quick Start

**Prerequisites:**
- Node.js 16+ and npm
- [Ollama](https://ollama.ai) installed with `gemma3:4b` model
- Windows, macOS, or Linux

**Install and Run:**

```bash
# Clone and install dependencies
git clone <repository-url>
cd Lumi
npm install

# Start development mode
npm run dev:electron
```

For detailed setup instructions, see [README_QUICKSTART.md](README_QUICKSTART.md).

---

## Beta Launch Status

Lumi is currently in **closed beta** preparation. See [BETA_LAUNCH_FINAL_STEPS.md](BETA_LAUNCH_FINAL_STEPS.md) for launch checklist and [docs/BETA_ONBOARDING.md](docs/BETA_ONBOARDING.md) for beta tester onboarding.

---

## Documentation

| Document | Description |
|----------|-------------|
| [README_QUICKSTART.md](README_QUICKSTART.md) | **Get started in 5 minutes** |
| [docs/readmes/INDEX.md](docs/readmes/INDEX.md) | **Complete documentation index** |
| [docs/readmes/Lumi_visual_diagram.md](docs/readmes/Lumi_visual_diagram.md) | Architecture & system design |
| [docs/readmaps/LUMI_ROADMAP_UPDATE.md](docs/roadmaps/LUMI_ROADMAP_UPDATE.md) | Feature roadmap |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues & fixes |

---

## Features

### 🧠 Intelligent Core
- **Brain Engine** - Reasoning, signal processing, and knowledge integration
- **RAG (Retrieval-Augmented Generation)** - Context-aware responses from knowledge base
- **Semantic Search** - TF-IDF and embedding-based retrieval with reranking

### 📚 Learning System
- **Auto-Capture** - Learns from every conversation (with your approval)
- **Self-Learning Agent** - Scans your codebase for insights
- **Security Curator** - Human-in-the-loop review of suggested knowledge

### 🔒 Privacy & Security
- **PII Scrubbing** - Automatic redaction of sensitive data
- **Threat Detection** - Quarantine suspicious content
- **Local-First** - All data stays on your machine (no cloud required)

### 🎨 Personality
- **Mood Engine** - Dynamic tone based on rapport
- **Sentiment Analysis** - Responds to user sentiment
- **Configurable Personas** - Multiple personality profiles

---

## Architecture

Lumi is built with a modular architecture:

```
┌─────────────┐
│   Renderer  │  React UI, chat interface, curator dashboard
└──────┬──────┘
       │ IPC Bridge (contextBridge)
┌──────┴──────┐
│    Main     │  Electron main process, IPC handlers
├─────────────┤
│   Brain     │  Ollama integration, RAG, signal processing
│   Memory    │  Knowledge base, session management
│  Learning   │  Self-learn agent, candidate extraction
│  Security   │  PII scrubbing, threat detection, staging
└─────────────┘
```

For detailed architecture, see [docs/readmes/Lumi_visual_diagram.md](docs/readmes/Lumi_visual_diagram.md).

---

## Development

### Build from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Build production bundle
npm run build

# Package installer
npm run package
```

### Development Workflow

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron in dev mode
npm run dev:electron
```

### Testing

```bash
# Run type checking
npx tsc --noEmit

# Run prelaunch checks (CI)
npm run prelaunch:checks

# Run smoke tests
node scripts/smoke_test_production.js
node scripts/smoke_selflearn_test.js
```

---

## Contributing

Lumi is currently proprietary software in active development. For contribution guidelines and development setup, see [docs/readmes/README_DEV.md](docs/readmes/README_DEV.md).

---

## License & Legal

- **Source Code:** See [LICENSE](LICENSE)
- **Character Assets:** See [ASSETS_LICENSE.md](ASSETS_LICENSE.md)
- **Trademark:** "Lumi" is a trademark of Tortol Studios

Do not copy, sell, or redistribute the Lumi product, its name, source code, or character assets without express written permission.

---

## Support

- **Documentation:** [docs/readmes/INDEX.md](docs/readmes/INDEX.md)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Beta Onboarding:** [docs/BETA_ONBOARDING.md](docs/BETA_ONBOARDING.md)

---

**Built with ❤️ by Tortol Studios**
