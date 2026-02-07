# ARCHIVE: README_STARTUP.md

This file has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/readmes/README_STARTUP.md

1) Start dev server (one terminal)

  npm run dev

2) Start Electron (another terminal)

  npm run dev:electron

This runs Vite and Electron together; if you prefer, run `npm run dev` in one terminal and then in a second run `npm run start` after setting `VITE_DEV_SERVER_URL` as needed.

3) Export KB from the running app
- In the app UI click `Export KB (to workspace)` — the UI will show the saved path (electron userData path).
- If you downloaded `lumi_knowledge.json` from the app or elsewhere, place it into this repo under `training/`.

Automate copying and exporting training JSONL:

  node tools/copy_kb_to_training.js <path-to-lumi_knowledge.json>

This copies the file into `training/lumi_knowledge.json` and (if available) runs the exporters to produce `training/training.jsonl` and `training/plans.jsonl`.

4) Retrain locally
- Ensure the Python virtualenv `.venv` is activated or call the interpreter directly.

PowerShell (from repo root):

  .\.venv\Scripts\Activate.ps1
  node tools/retrain.js training/lumi_knowledge.json models/reranker.joblib

Or without activating the venv (Windows):

  .venv\Scripts\python.exe tools/train_reranker.py training/training.jsonl models/reranker.joblib

5) Quick inference test

Run the inference check (requires `models/reranker.joblib`):

  npm run infer-reranker

(or)

  .venv\Scripts\python.exe tools/infer_reranker.py

6) Notes and common paths
- Electron persisted KB location (when using the app UI):
  Windows: %APPDATA%\lumi-desktop\lumi_knowledge.json
  (example) C:\Users\<you>\AppData\Roaming\lumi-desktop\lumi_knowledge.json

- If the app reports "path unknown" when exporting, make sure you're running the packaged `dist-electron` main or the `src/main.ts` handler that returns the saved path. The code already returns the saved path at `lumi-save`.

- When running inside this workspace (Electron launched from the repo), `lumi-save` will also attempt to write a copy into `training/lumi_knowledge.json` and the renderer will receive a `trainingPath` in the response when that copy is written.

7) If you want me to run these steps for you now
Tell me which step to run: start dev, start electron, copy a downloaded KB into training/, run retrain, or run the quick inference. I can run the inference and copy step now if you give the KB path (or let me use the app's saved KB path).
