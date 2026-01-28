# ARCHIVE: CODELUMI_ONE_PAGE_SUMMARY.md

This roadmap has been archived to the organized docs folder to avoid duplication.

See: docs/organized/archive/roadmaps/CODELUMI_ONE_PAGE_SUMMARY.md

## What You're Building
An autonomous AI coding assistant with:
1. **Local Desktop App** — Offline, private, Electron-based
2. **Cloud Web Service** — Like Claude/ChatGPT at lumi.ai  
3. **Federated Learning** — Local users opt-in contribute to make Codelumi smarter

---

## Where You Are Now: ~15% Complete

```
DONE ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%
```

### ✅ What You Have
- Electron app shell (working)
- React UI with chat, avatar, stats
- Basic neural network (in-browser)
- Knowledge base (localStorage)
- Feedback capture (6 events)
- Python reranker (trained)
- Training data export (working)
- Brain stubs (plan/simulate/execute)

### ❌ What You Need
- Full planner with retrieval
- IndexedDB memory system
- ONNX inference runtime
- Safe executor with undo
- Cloud API backend
- Web frontend
- User authentication
- Database & vector store
- GPU infrastructure
- Federated learning system
- Payments/subscriptions
- Mobile apps

---

## Timeline: 9 Months to Launch

| Month | Milestone | Deliverable |
|-------|-----------|-------------|
| 1-2 | Local MVP | Desktop app v1.0 |
| 3-4 | Cloud Backend | API ready |
| 5-6 | Web Frontend | Alpha launch |
| 7-8 | Federated Learning | Private beta |
| 9 | Production | Public launch 🚀 |

---

## Cost Summary

| Category | Dev Phase | Production |
|----------|-----------|------------|
| Development | Your time | Your time |
| Infrastructure | $25-100/mo | $500-5000/mo |
| One-time costs | ~$2,500 | — |
| GPU training | $100-500/mo | $1000-5000/mo |

**Total Year 1:** ~$10-15K (bootstrapped) to ~$50K+ (if hiring help)

---

## Revenue Potential

| Year | Users | Monthly Revenue |
|------|-------|-----------------|
| Year 1 | 10K | ~$20K/mo |
| Year 2 | 50K | ~$150K/mo |
| Year 3 | 200K | ~$500K/mo |

---

## Next 5 Steps (This Week)

1. `npm install dexie onnxruntime-web uuid`
2. Create IndexedDB memory schema
3. Implement brain.plan() with KB retrieval
4. Convert reranker.joblib to ONNX
5. Build Feedback Review UI

---

## The 5 Products

| Product | Price | Platform |
|---------|-------|----------|
| Codelumi Local Free | $0 | Desktop |
| Codelumi Local Pro | $10/mo or $100 | Desktop |
| Codelumi Cloud Plus | $20/mo | Web |
| Codelumi Cloud Pro | $50/mo | Web |
| Codelumi API | Usage-based | Developers |

---

## Key Differentiators vs Claude/ChatGPT

1. **Privacy-first** — Works 100% offline
2. **Open contribution** — Users help train Codelumi
3. **Coding-focused** — Built for developers
4. **Transparent** — Users see exactly what's shared
5. **Community-driven** — Not big tech

---

**Full details in:**
- `CODELUMI_COMPLETE_MASTER_PLAN_V2.md` — Full architecture & design
- `CODELUMI_130_STEP_CHECKLIST.md` — Every task to complete

**You're 15% there. Keep building! 🚀**
