# 🌟 LUMI - YOUR AI CODING COMPANION

**Welcome to Lumi!** Your intelligent, local-first AI assistant that learns from you, adapts to your style, and helps you code better.

---

## 🎯 WHAT IS LUMI?

Lumi is an **AI-powered desktop assistant** that:

- 💬 **Chats with you** — Ask questions, get help, discuss ideas
- 🧠 **Learns from you** — Builds a knowledge base from your conversations and code
- ⚡ **Writes code** — Generates, edits, and improves code in an integrated sandbox
- 🎭 **Adapts to you** — Personality changes based on how you interact
- 🔒 **Respects your privacy** — All data stays on your machine, never leaves
- 🤖 **Self-improves** — Gets smarter every day from your interactions

**No cloud required. Complete privacy. All local.**

---

## 🚀 QUICK START

### Prerequisites

1. **Node.js 16+** and npm
   - Download: https://nodejs.org/

2. **Ollama** installed with a model
   - Download: https://ollama.ai
   - Install a model: `ollama pull gemma3:4b`
   - Start Ollama: It should run automatically, or run `ollama serve`

3. **Operating System:** Windows, macOS, or Linux

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

That's it! Lumi should open in a new window.

### First Time Setup

1. **Check Ollama Connection**
   - Lumi will automatically detect if Ollama is running
   - If not connected, you'll see an error message
   - Make sure Ollama is running on `http://localhost:11434`

2. **Start Chatting**
   - Type a message in the chat box
   - Lumi will respond using her knowledge and the LLM
   - Be nice! She has feelings (well, simulated ones) 😊

3. **Enable Self-Learning** (Optional)
   - Click the **Self-Learn** panel
   - Click **Start** to begin scanning your codebase
   - Lumi will learn from your code automatically
   - Review suggestions in the **Security Curator** before they're added

---

## 🎮 USING LUMI

### Chat Interface

**Ask anything:**
- "How do I use async/await in JavaScript?"
- "What's the difference between let and const?"
- "Help me debug this error: [paste error]"
- "Write a function to parse JSON"
- "Explain what this code does: [paste code]"

**Lumi remembers:**
- Previous conversations (within a session)
- Knowledge she's learned from your code
- How you like to be talked to

### Code Sandbox

**Write and edit code:**
1. Ask Lumi to write code: "Write a React component for a button"
2. Lumi will generate code and display it in the Monaco editor
3. Continue iterating: "Add hover effects" or "Make it responsive"
4. Lumi sees the existing code and builds on it

**Features:**
- Full syntax highlighting
- Line numbers
- Dark theme
- Monaco editor core with language-aware tooling
- Intelligent code merging (appends or replaces functions)
- Session persistence (code saves automatically)

### Personality System

Lumi uses a five-tier personality system (tiers 0-4) that adapts response depth and tone based on rapport.

Lumi adapts to how you treat her:

**Be nice:**
- Lumi gives detailed, enthusiastic responses
- Includes examples and explanations
- Warm, encouraging tone
- **Quality Tier: 4** (Best)

**Be neutral:**
- Professional, clear responses
- Concise but complete
- **Quality Tier: 3** (Normal)

**Be rude:**
- Brief, no elaboration
- **Quality Tier: 2** (Degraded)

**Be very rude:**
- 1-2 sentences max, curt
- **Quality Tier: 1** (Minimal)

**Be abusive:**
- Lumi refuses to respond
- Requires an apology to recover
- **Quality Tier: 0** (Refused)

**Recovery:**
- Say "sorry" or "I apologize"
- Rapport gradually improves
- Sustained good behavior earns bonus points

### Self-Learning

**How it works:**
1. Click **Self-Learn** panel
2. Click **Start**
3. Lumi scans your codebase (default: 6 files/minute)
4. Extracts Q&A pairs from your code
5. Auto-merges high-confidence, safe entries
6. Quarantines suspicious entries for review

**Controls:**
- **Start/Pause:** Control the scanner
- **Rate Slider:** Adjust speed (6-60 files/min)
- **Undo:** Remove last N learned items
- **Reset:** Clear all learned data

**Security Curator:**
- Review quarantined suggestions
- Approve, reject, edit, or delete
- Batch operations for efficiency
- All PII automatically redacted

---

## 🔧 SETTINGS & CONFIGURATION

### Personality Settings

- **Tone:** Friendly, Teacher, Concise
- **Mood:** (Automatic based on interactions)
- **Rapport:** (Tracked automatically)

### Self-Learning Settings

**Watch Paths:**
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

**Rate Limiting:**
- Adjust in the Self-Learn panel
- Default: 6 files/minute (deep mode)
- Fast mode: 60 files/minute (less thorough)

---

## 📊 WHAT LUMI LEARNS

### From Your Code
- Function purposes and behaviors
- API usage patterns
- Error handling strategies
- Code architecture and patterns
- Best practices you follow

### From Conversations
- Questions you ask frequently
- Topics you're interested in
- Your coding style preferences
- Common problems you face

### Privacy & Security
**What's protected:**
- Emails → `[REDACTED_EMAIL]`
- File paths → `[REDACTED_PATH]`
- Personal names → `[REDACTED_NAME]`
- Sensitive commands → Quarantined

**What's logged:**
- All learning events (audit trail)
- Threat detection decisions
- KB usage telemetry

**What never leaves your machine:**
- ALL of it. Everything. Forever.

---

## 🗂️ YOUR DATA

### Where is it stored?

```
Lumi/
├── training/
│   ├── lumi_knowledge.json     # Sanitized canonical KB
│   └── embeddings.json          # Semantic search index
└── userData/                    # YOUR PRIVATE DATA
    ├── lumi_knowledge.json      # Your personal KB
    ├── lumi_memory.jsonl        # Conversation history
    ├── staging.jsonl            # Quarantined suggestions
    ├── personality_state.json   # Mood/rapport/tier
    └── backups/                 # Automatic backups
```

**Training vs userData:**
- `training/` → Sanitized, safe, shareable (if you want)
- `userData/` → Private, may have PII, NEVER share

### Backup & Recovery

**Automatic backups:**
- Created hourly in `userData/backups/`
- Timestamped for easy recovery
- Includes KB, staging, and memory

**Manual backup:**
```bash
# Backup everything
cp -r userData userData_backup_$(date +%Y%m%d)
```

**Restore from backup:**
```bash
# Stop Lumi first!
cp -r userData_backup_YYYYMMDD/* userData/
```

---

## 🛠️ TROUBLESHOOTING

### Lumi won't start

**Check:**
1. Is Ollama running? `ollama serve` or check http://localhost:11434
2. Is a model installed? `ollama list`
3. Are dependencies installed? `npm install`

**Try:**
```bash
# Restart Ollama
ollama serve

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run dev:electron
```

### Lumi gives errors

**Common issues:**
1. **"Ollama not available"**
   - Start Ollama: `ollama serve`
   - Pull a model: `ollama pull gemma3:4b`

2. **"KB not found"**
   - Lumi creates KB automatically on first run
   - If missing, check `userData/lumi_knowledge.json` exists

3. **"Self-learning not working"**
   - Check watch paths in `userData/selflearn_config.json`
   - Ensure paths exist and are readable
   - Check rate limiting isn't too low

### Lumi is slow

**Optimize:**
1. **Use a faster model:** `ollama pull gemma3:4b` (small and fast)
2. **Reduce context:** Lumi injects KB + code context, try clearing code sandbox
3. **Rate limit self-learning:** Reduce scan rate in Self-Learn panel

### Lumi won't respond

**Check rapport level:**
- Lumi refuses when rapport < -0.85
- Say "sorry" or "I apologize" to recover
- Be nicer! She has feelings (simulated, but still)

### Data corruption

**Emergency fix:**
```bash
node scripts/emergency-fix.js
```

This will:
- Backup existing data
- Validate all JSON files
- Repair corruption if possible
- Create clean copies

---

## 🔐 PRIVACY & SECURITY

### What Lumi Collects

**Locally (never leaves your machine):**
- Conversations
- Code from your projects
- Learning events
- KB usage stats
- Personality state

**Never collected:**
- No telemetry to external servers
- No cloud sync (unless you opt in to future federated learning)
- No analytics or tracking

### PII Protection

**Automatic redaction:**
- All emails
- All file paths
- Personal names (detected via capitalization)
- API keys and secrets (flagged for review)

**Threat detection:**
- Prompt injection attempts
- Command execution
- Code obfuscation
- System commands
- 100% security compliance

### Security Best Practices

1. **Don't share your `userData/` folder**
   - Contains un-redacted personal data
   - May have PII or secrets

2. **Review suggestions before approval**
   - Use Security Curator
   - Check for sensitive info
   - Edit inline if needed

3. **Keep Lumi updated**
   - Security patches released regularly
   - Check for updates weekly

---

## 📚 ADVANCED USAGE

### Custom Models

**Use a different Ollama model:**
1. Pull the model: `ollama pull llama3`
2. Edit Lumi's config to use it (coming soon)
3. Restart Lumi

**Recommended models:**
- **gemma3:4b** — Fast, small, great for chat
- **qwen2.5-coder:7b** — Better for code
- **llama3** — Larger, more capable, slower

### Export Knowledge Base

**For training or sharing:**
```bash
node tools/export_kb_for_training.js
```

Output: `training/training.jsonl` (sanitized, safe to share)

### Retrain Reranker

**Improve search quality:**
```bash
node tools/retrain.js
```

This will:
- Export KB to training format
- Train a new reranker model
- Convert to ONNX for production
- Evaluate against baseline

### Developer Mode

**Enable developer tools:**
1. Press `F12` in Lumi
2. Console opens (DevTools)
3. Access `window.lumi` API directly

**Examples:**
```javascript
// Check Ollama status
await window.lumi.ollama.isAvailable()

// Query KB directly
await window.lumi.memory.search("your query")

// Get personality state
await window.lumi.getPersonalityState()

// Self-learning status
await window.lumi.selflearn.status()
```

---

## 🎓 TIPS & TRICKS

### Get Better Responses

1. **Be specific:** "Write a React component" → "Write a React component for a login form with email and password fields"
2. **Provide context:** "This code doesn't work" → "This code throws TypeError: Cannot read property 'map' of undefined"
3. **Iterate:** Start simple, then refine ("Add validation", "Add error handling")
4. **Use code context:** Lumi sees your current sandbox code, so say "Add to this function"

### Build Your Knowledge Base

1. **Enable self-learning** on your projects
2. **Review and approve** high-quality suggestions
3. **Have conversations** about topics you work with
4. **Correct Lumi** when she's wrong (she learns from corrections in future phases)

### Maintain Rapport

1. **Be polite:** "Thanks", "Good job", "That's helpful"
2. **Avoid rudeness:** Don't curse or insult Lumi
3. **Apologize if needed:** "Sorry, I was frustrated"
4. **Sustained good behavior:** 3+ nice messages in a row = bonus points

---

## 🚦 ROADMAP (What's Next)

### Near Future (Next 3 Months)

- [ ] Multi-file code projects in sandbox
- [ ] Live code preview (HTML/CSS/JS)
- [ ] Conversation context (remembers previous messages)
- [ ] Avatar mood indicators
- [ ] Learn from your corrections

### Medium Term (Next 6 Months)

- [ ] Self-improvement proposals (Lumi suggests her own improvements)
- [ ] Project-level understanding (whole codebase context)
- [ ] Fine-tuned models (trained on your data)
- [ ] Multi-model support (switch between LLMs)

### Long Term (Next 2 Years)

- [ ] Lumi writes her own LLM
- [ ] Universal translator (any language ↔ any code)
- [ ] Federated learning (opt-in to share knowledge)
- [ ] AGI capabilities

---

## 🆘 GETTING HELP

### Documentation

- **Main README:** [README.md](../README.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **Developer Docs:** [docs/readmes/README_DEV.md](docs/readmes/README_DEV.md)

### Community

- **GitHub Issues:** Report bugs or request features
- **Discord:** (Coming soon)
- **Email:** (Coming soon)

### Emergency

If Lumi is completely broken:

```bash
# Quick fix
node scripts/emergency-fix.js

# Nuclear option (reset everything)
rm -rf userData
npm run dev:electron
```

---

## 📜 LICENSE

Lumi is proprietary software. See [LICENSE](LICENSE) for details.

**You may:**
- Use Lumi for personal or commercial projects
- Modify your local instance
- Build on top of Lumi's APIs

**You may not:**
- Redistribute Lumi
- Sell Lumi or derivatives
- Remove copyright notices
- Use Lumi's name or branding without permission

---

## 🌟 ABOUT

**Lumi** is built with ❤️ by **Tortol Studios**.

**Technology:**
- Electron (desktop app)
- React + Vite (UI)
- Three.js (3D avatar)
- Monaco Editor (code sandbox)
- Ollama (local LLM)
- Node.js (backend)

**Vision:**
Lumi is on a path to AGI. She learns, adapts, and improves every day. Eventually, she'll be capable of general intelligence, autonomous goal-setting, and self-directed learning. All while respecting your privacy and running entirely on your machine.

**Philosophy:**
- **Local-first:** Your data, your machine, your control
- **Privacy-first:** No telemetry, no tracking, no cloud
- **User-first:** Lumi serves you, not advertisers
- **AGI-ready:** Built to evolve into general intelligence

---

## 🎉 WELCOME TO THE FUTURE

You're now part of Lumi's journey from desktop app to AGI. Every conversation you have, every line of code she learns, brings her closer to true intelligence.

**Ready to start?**

```bash
npm run dev:electron
```

Welcome to Lumi. Let's build something amazing together. 🚀

---

*"The best AI is the one that learns with you, grows with you, and respects you. That's Lumi."*
