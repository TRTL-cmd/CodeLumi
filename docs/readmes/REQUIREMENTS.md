# Lumi — System Requirements

Last updated: 2026-01-28

This document lists the minimum and recommended system requirements to run Lumi (local desktop assistant) in a practical configuration. It also lists optional services (embeddings/vector DB, cloud sync) and verification commands.

**Notes:** Lumi can run in a CPU-only mode for most flows but performance and model choices affect resource needs. Some local model runtimes (GPU-enabled Ollama or other LLM runners) will require a supported NVIDIA GPU and drivers.

---

## Minimum Requirements (local Lumi)

- OS: Windows 10 (64-bit) or Windows 11, latest updates.
- CPU: 4 logical cores (e.g., Intel i5 or equivalent) — x86_64.
- RAM: 8 GB.
- Disk: 20 GB free (HDD ok) for app, runtime, and small model artifacts.
- Node.js: 18.x or later (LTS recommended).
- npm: latest that pairs with Node.js (or `pnpm` if used by your workflow).
- Git: for local repo operations and hooks (optional but recommended).
- Ollama (optional but recommended for higher-quality local LLMs): install the latest Ollama CLI and runtime if you plan to use Ollama models. CPU-only Ollama is acceptable for small models.
- Network: Internet for optional model downloads, updates, and remote services (not required for fully local operation if models already available).

Minimum disk layout example (approx.):

- Application and node modules: 1–2 GB
- Models and artifacts (small CPU models): 5–10 GB
- Logs, KB & training files (grows over time): 5+ GB

Verification commands (minimum):

```powershell
node -v
npm -v
git --version
ollama --version   # if using Ollama
npx tsc -v         # TypeScript compiler available
```

---

## Recommended Requirements (comfortable developer workstation)

- OS: Windows 11 (64-bit) with latest updates.
- CPU: 6–8 physical cores, 12–16 threads (modern Intel i7/Ryzen 7 or better).
- RAM: 32 GB (recommended) — 16 GB is workable but will limit concurrency.
- Disk: 250 GB NVMe SSD (fast disk I/O for model artifacts and app builds). Reserve 100+ GB if you expect to store multiple models locally.
- GPU (optional but strongly recommended for on-device model inference):
  - NVIDIA GPU with CUDA support (e.g., RTX 3060 or better).
  - CUDA toolkit and drivers compatible with your local runtime (e.g., CUDA 11.8+ depending on runtime).
- Node.js: 18.x or 20.x (LTS). Use `nvm` or Windows alternatives to manage versions.
- npm / pnpm: up-to-date.
- Ollama: latest with GPU support (if running GPU models) or CPU-only for small models.
- Python (optional): 3.10+ if you run Python-based training or converter scripts.

Recommended disk layout (approx.):

- Application + node_modules: 5 GB
- Models & ONNX/TF artifacts: 50–200 GB (depends on models)
- Training artifacts, backups & logs: 20+ GB

Verification commands (recommended):

```powershell
# Node / npm
node -v && npm -v
# Check GPU (if present)
nvidia-smi
# Ollama
ollama --version
# TypeScript
npx tsc -p tsconfig.json --noEmit
# Run privacy audit (local check)
node scripts/privacy_audit.js
``` 

---

## Optional Services & Their Requirements

- Ollama (local LLM runtime): depends on model size. Small CPU models work on minimal machines; larger models need GPUs and tens of GBs.
- Qdrant (vector DB): recommended for Phase 2 semantic search. Typical requirements: 2+ CPU cores, 4–8 GB RAM for small setups; production size needs more. Disk for vector storage depends on embedding count (plan ~1GB per 100k vectors as a rough guide depending on dimension).
- PostgreSQL: if using cloud sync or server-side persistence. Typical small instance: 1 CPU, 1–2 GB RAM (dev); production sizing varies.
- Redis: optional caching, 1–2 GB RAM for small deployments.

---

## Packaging & Privacy Notes

- Do not bundle `userData/` with distributed installers or releases. Ensure packaging step excludes runtime user data.
- All redaction and audit scripts are provided in `scripts/`. Use `scripts/privacy_audit.js` and `scripts/redact_audit_findings.js` before sharing artifacts.
- Backups created by redaction are stored as `.backup` and `.backup.redact.<ts>.bak`. These are preserved by default — run an explicit final-redaction pass only after confirming backup policy.

---

## Recommended Environment Setup (quick commands)

```powershell
# 1) Install Node (recommended via nvm for Windows):
# see https://github.com/coreybutler/nvm-windows

# 2) Install dependencies
npm install

# 3) Prepare husky hooks (if using git):
npm run prepare

# 4) Verify build/typecheck
npx tsc -p tsconfig.json --noEmit

# 5) Run privacy audit locally
node scripts/privacy_audit.js
``` 

---

If you want, I can add automated environment checks (`scripts/check_requirements.js`) that print pass/fail and recommended actions — say the word and I will create it.
