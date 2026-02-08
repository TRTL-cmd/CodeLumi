# Lumi Beta Tester Checklist

## Setup
- [ ] Install Node.js 16+ and npm.
- [ ] Install Ollama and pull a model (example): `ollama pull qwen2.5-coder:7b`.
- [ ] Start Ollama: `ollama serve`.
- [ ] Install Lumi dependencies: `npm install`.

## Launch
- [ ] Run Lumi: `npm run dev:electron`.
- [ ] Confirm the app launches and the 3D model renders.
- [ ] Confirm the Self-Learn toggle reflects On/Off accurately.

## Core Flows
- [ ] Ask Lumi a question and verify a response appears.
- [ ] Toggle Self-Learn On and observe learning events in the UI.
- [ ] Open Curator and confirm suggestions appear (if any).
- [ ] Approve one suggestion and verify it disappears from the list.
- [ ] Reject one suggestion and verify it disappears from the list.

## Privacy & Safety
- [ ] Check that suggestions show `lumi/...` paths, not full local paths.
- [ ] Verify no personal paths appear in Curator or learning toasts.

## Logs & Support
- [ ] Click "Export Logs" and confirm a zip is created in `release_logs/`.
- [ ] Provide the zip when reporting issues.

## Report
- [ ] List issues encountered and steps to reproduce.
- [ ] Include screenshots if possible.
