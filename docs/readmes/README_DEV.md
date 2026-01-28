# ARCHIVE: README_DEV.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/README_DEV.md

This document captures what we've completed, the current state of the repo, and the exact next-session checklist so you can resume quickly.

## Completed (summary)
- Dev flow fixes: Vite + Electron dev scripts, dev:electron ergonomics.
- IPC persistence: lumi-save/lumi-load return the saved path and now attempt to write a copy to 	raining/lumi_knowledge.json.
- Exporters and retrain tooling: 	ools/export_*, 	ools/retrain.js, Python trainer prototype (	ools/train_reranker.py).
- .venv created and trainer dependencies installed; retrain produced models/reranker.joblib.
- Helpers: 	ools/copy_kb_to_training.js, 	ools/infer_reranker.py and docs/roadmaps/README_STARTUP.md added.

## Current state (what you'll find in the repo)
- 	raining/  contains lumi_knowledge.json (copied from app) and exported files: 	raining.jsonl, plans.jsonl (if exporters ran).
- models/reranker.joblib  trained reranker artifact (local prototype).
- 	ools/  exporter, retrain wrapper, inference script and copy helper.
- src/preload.ts, src/main.ts  preload IPC and main process now return path and 	rainingPath when exporting.

## How to run (quick commands)

Start Vite (terminal A):

`powershell
cd  C:\Users\Chris\OneDrive\Desktop\Codelumi
npm run dev
`

Start Electron (terminal B):

`powershell
npm run dev:electron
`

Copy a downloaded KB into the repo and export training JSONL:

`powershell
node tools/copy_kb_to_training.js C:\path\to\lumi_knowledge.json
`

Retrain (with .venv active):

`powershell
.\\.venv\\Scripts\\Activate.ps1
node tools/retrain.js training/lumi_knowledge.json models/reranker.joblib
`

Quick inference test:

`powershell
npm run infer-reranker
# or
.venv\\Scripts\\python.exe tools/infer_reranker.py
`

## Next-session checklist (do these in order)
1. Seed synthetic training data (~200 QA pairs) into 	raining/training.jsonl (I can generate these for you).
2. Run retrain with the expanded dataset and verify models/reranker.joblib is updated.
3. Scaffold a small inference shim (Python microservice) exposing a /score endpoint to load models/reranker.joblib.
4. Add a preload IPC bridge and wire the renderer to call the shim for re-ranking candidate answers.
5. Add a simple Plan History viewer to review and label kb.meta.plans before training.

## Files to check / edit when resuming
- 	raining/lumi_knowledge.json  persisted KB from the app (or downloaded copy).
- 	raining/training.jsonl, 	raining/plans.jsonl  exporter outputs.
- 	ools/train_reranker.py and 	ools/retrain.js  training scripts.
- 	ools/infer_reranker.py  quick local inference test.
- src/preload.ts / src/main.ts  IPC bridge and save/load handlers.

## Notes and tips
- When running 
pm run dev you will see a Vite link in the terminal; do not click it if you are also running 
pm run dev:electron (that will open a browser tab in addition to the Electron window). Use dev:electron as the canonical dev flow.
- The lumi-save handler now attempts to write a copy into the repo 	raining/ folder and returns 	rainingPath when successful; this lets the UI show where the repo copy was written.
- The current reranker is a lightweight TF-IDF + LogisticRegression baseline  it's useful for re-ranking candidate answers but is not a replacement for a full LLM or embedding-based retrieval. Use it as a first step toward better ranking and automated selection.

If you want, I can generate the 200 synthetic pairs and run the retrain now  say Go seed and retrain and I'll proceed.
