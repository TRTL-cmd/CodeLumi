# Lumi Development Guide

**Last Updated:** 2026-02-07
**Status:** Active

This guide covers the complete development setup, workflow, and architecture for contributing to Lumi.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Project Structure](#project-structure)
5. [Testing](#testing)
6. [Building & Packaging](#building--packaging)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime |
| **npm** | 8+ | Package manager |
| **Ollama** | Latest | Local LLM backend |
| **TypeScript** | 5.1+ | Type checking (installed via npm) |
| **Python** | 3.8+ | Optional: reranker training |
| **Git** | 2.x | Version control |

### Ollama Setup

```bash
# Install Ollama from https://ollama.ai

# Pull the default model
ollama pull gemma3:4b
```

### Optional: Python Environment (for ML training)

```powershell
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\Activate.ps1

# Install ML dependencies
pip install scikit-learn numpy joblib
```

---

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd Lumi
npm install
```

### 2. Configure Husky (Git Hooks)

```bash
npm run prepare
```

This installs pre-commit hooks that:
- Check for PII/absolute paths in staged files
- Run type checking before commits

### 3. Verify Setup

```bash
# Type check
npx tsc --noEmit

# Should complete with no errors
```

---

## Development Workflow

### Standard Dev Mode (Recommended)

**Terminal 1:** Start Vite dev server
```bash
npm run dev
```
- Runs Vite at http://localhost:5173
- Hot module reloading for renderer code
- Leave this running while developing

**Terminal 2:** Start Electron
```bash
npm run dev:electron
```
- Launches Electron with dev server URL
- Opens Lumi desktop app
- Auto-reloads on renderer changes

**⚠️ Important:** Don't click the Vite URL in Terminal 1 - use only the Electron window from Terminal 2.

### File Watching

- **Renderer changes** (React, CSS) → Hot reload automatic
- **Main process changes** (`src/main.ts`, `src/core/**`) → Restart `npm run dev:electron`
- **Preload changes** (`src/preload.ts`) → Restart Electron

### TypeScript Compilation

The project uses TypeScript with `--noEmit` mode in development (Vite handles transpilation):

```bash
# Type check only (no .js output)
npx tsc --noEmit

# Watch mode for type errors
npx tsc --noEmit --watch
```

---

## Project Structure

```
Lumi/
├── src/
│   ├── main.ts                  # Electron main process entry
│   ├── preload.ts               # IPC bridge (contextBridge)
│   ├── App.tsx                  # React root component
│   ├── components/              # React UI components
│   ├── core/
│   │   ├── brain/               # LLM integration, RAG
│   │   ├── memory/              # Knowledge base, session management
│   │   ├── learning/            # Signal processing, candidate extraction
│   │   ├── security/            # PII scrubbing, threat detection
│   │   ├── personality/         # Mood engine, tone adjustment
│   │   └── paths.ts             # Centralized path management
│   ├── selflearning/            # Self-learning agent
│   └── security/                # Input validation, sanitization
├── scripts/                     # Dev/build scripts
├── tools/                       # Training, export, diagnostics
├── training/                    # Knowledge base (tracked in git)
├── userData/                    # User data (mostly tracked, see .gitignore)
├── docs/                        # Documentation
├── assets/                      # 3D models, images
└── dist/                        # Build output (gitignored)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Main process: IPC handlers, system initialization |
| `src/preload.ts` | Renderer↔Main bridge (exposes `window.lumi` API) |
| `src/core/brain/index.ts` | LLM orchestration, RAG integration |
| `src/core/memory/kb.ts` | Knowledge base search |
| `src/selflearning/safe-agent-deep.ts` | Self-learning agent |
| `src/core/paths.ts` | Path utilities (handles Electron userData) |

---

## Testing

### Pre-Commit Checks

Husky runs automatically on `git commit`:
- PII/path detection (`scripts/precommit_check_paths_fixed.js`)
- TypeScript type check

To bypass (emergency only):
```bash
git commit --no-verify
```

### Manual Testing

**Type Check:**
```bash
npx tsc --noEmit
```

**Prelaunch Suite:**
```bash
npm run prelaunch:checks
```
- Runs type check + smoke test
- Same checks as CI workflow

**Smoke Tests:**
```bash
# Production readiness
node scripts/smoke_test_production.js

# Self-learning system
node scripts/smoke_selflearn_test.js

# Personality engine
node scripts/headless_personality_test.js
```

**Privacy Audit:**
```bash
# Scan for PII in files
node scripts/privacy_audit.js
```

---

## Building & Packaging

### Development Build

```bash
npm run build
```
- Runs Vite build (outputs to `dist/`)
- Compiles TypeScript main process
- No installer created

### Production Installer

```bash
npm run package
```
- Builds app + creates installer
- Output: `release/`
- Uses electron-builder
- Platforms: Windows (NSIS), macOS (DMG), Linux (AppImage)

### Build Configuration

Edit `package.json` → `build` section:
```json
{
  "build": {
    "appId": "com.tortolstudios.lumi",
    "productName": "Lumi Desktop",
    "directories": {
      "output": "release",
      "buildResources": "build"
    }
  }
}
```

---

## Development Tips

### Debugging

**Main Process (Node.js):**
- Add `console.log()` statements
- Check Electron terminal output

**Renderer Process (Browser):**
- Open DevTools: `Ctrl+Shift+I` / `Cmd+Option+I`
- Check Console tab for errors
- Use React DevTools extension

**IPC Debugging:**
```typescript
// In main.ts
ipcMain.handle('some-channel', async (event, ...args) => {
  console.log('[IPC] some-channel called with:', args);
  // ... handler code
});
```

### Hot Reload Not Working?

- Ensure Vite dev server is running (`npm run dev`)
- Check that `VITE_DEV_SERVER_URL` env var is set (automatically set by `dev:electron`)
- Restart both Vite and Electron

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve
```

If Lumi can't connect:
1. Check startup logs for "Ollama not detected" warning
2. Verify `gemma3:4b` model is pulled: `ollama list`
3. Check firewall isn't blocking localhost:11434

### Training/ML Workflow

**Export Knowledge Base:**
```bash
node tools/export_kb_for_training.js
```

**Train Reranker:**
```bash
# Activate Python env
.\.venv\Scripts\Activate.ps1

# Train on current KB
node tools/retrain.js training/lumi_knowledge.json models/reranker.joblib
```

**Test Inference:**
```bash
npm run infer-reranker
```

---

## Code Standards

### TypeScript

- Use explicit types for function parameters/returns
- Avoid `any` (use `unknown` if type is truly unknown)
- Enable strict mode checks (already configured in `tsconfig.json`)

### File Naming

- React components: `PascalCase.tsx` (e.g., `SecurityCurator.tsx`)
- Utilities/modules: `kebab-case.ts` (e.g., `staging-manager.ts`)
- Tests: `*.test.ts` or `test_*.js`

### Git Commits

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Co-author commits with Claude: add `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

---

## Troubleshooting

For common development issues, see [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

**Quick Fixes:**

| Issue | Fix |
|-------|-----|
| `Cannot find module` | Run `npm install` |
| Type errors after pulling | Run `npx tsc --noEmit` to verify |
| Electron window blank | Check Vite dev server is running |
| Pre-commit hook fails | Fix PII violations or bypass with `--no-verify` (emergency only) |
| Build fails | Delete `dist/` and `node_modules/`, re-run `npm install && npm run build` |

---

## Next Steps

- Read [Lumi_visual_diagram.md](./Lumi_visual_diagram.md) for architecture overview
- Check [LUMI_ROADMAP_UPDATE.md](../roadmaps/LUMI_ROADMAP_UPDATE.md) for feature roadmap
- Review [BRAIN_ROADMAP.md](./BRAIN_ROADMAP.md) for brain subsystem details

---

**Questions?** See [INDEX.md](./INDEX.md) for complete documentation index.
