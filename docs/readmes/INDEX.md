# Lumi Documentation Index

**Last Updated:** 2026-02-07
**Status:** Beta Preparation

---

## 🚀 Quick Start

| Document | Purpose | Audience |
|----------|---------|----------|
| [README_QUICKSTART.md](../../README_QUICKSTART.md) | **Get started in 5 minutes** | New developers, beta testers |
| [BETA_LAUNCH_FINAL_STEPS.md](../../BETA_LAUNCH_FINAL_STEPS.md) | **Pre-launch checklist** | Maintainers, release team |
| [../BETA_ONBOARDING.md](../BETA_ONBOARDING.md) | **User onboarding guide** | Beta testers |
| [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | **Common issues & fixes** | All users |

---

## 📚 Understanding Lumi

### Architecture & Design

| Document | Description |
|----------|-------------|
| [Lumi_visual_diagram.md](./Lumi_visual_diagram.md) | **Primary architecture reference** - Component diagrams, data flow, system overview |
| [LUMI_MASTER_PLAN_UPDATE.md](./LUMI_MASTER_PLAN_UPDATE.md) | **Vision & current status** - Goals, milestones, strategic direction |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | **Technical requirements** - System specs, dependencies, constraints |

### Subsystems

| Document | Description |
|----------|-------------|
| [BRAIN_ROADMAP.md](./BRAIN_ROADMAP.md) | **Brain subsystem details** - Reasoning engine, knowledge integration, signal processing |

---

## 🛠️ Development

| Document | Purpose |
|----------|---------|
| [README_DEV.md](./README_DEV.md) | **Developer setup** - Environment config, build process, tooling |
| [../roadmaps/LUMI_ROADMAP_UPDATE.md](../roadmaps/LUMI_ROADMAP_UPDATE.md) | **Current roadmap** - Feature timeline, upcoming work, priorities |
| [../roadmaps/ROADMAP.md](../roadmaps/ROADMAP.md) | **Simple roadmap** - High-level feature list |

---

## 🔒 Security & Privacy

| Document | Purpose |
|----------|---------|
| [../PRIVACY_TOOLS_SETUP.md](../PRIVACY_TOOLS_SETUP.md) | **Privacy configuration** - PII scrubbing, path redaction, data protection |
| [../security/SECURITY_ARCHITECTURE.md](../security/SECURITY_ARCHITECTURE.md) | **Security design** - Threat model, protection mechanisms |

---

## 📊 Logs & Activity

| Location | Description |
|----------|-------------|
| [../logs/daily/](../logs/daily/) | **Daily activity logs** - Development progress, decisions, changes |

---

## 📦 Archive

| Location | Description |
|----------|-------------|
| [../_archive/](../_archive/) | **Historical documentation** - Outdated versions, superseded docs, CodeLumi branding |

---

## 🗺️ Documentation Structure

```
docs/
├── readmes/               ← You are here
│   ├── INDEX.md          ← This file
│   ├── Lumi_visual_diagram.md
│   ├── LUMI_MASTER_PLAN_UPDATE.md
│   ├── REQUIREMENTS.md
│   ├── README_DEV.md
│   └── BRAIN_ROADMAP.md
├── roadmaps/
│   ├── LUMI_ROADMAP_UPDATE.md
│   └── ROADMAP.md
├── logs/
│   └── daily/
├── security/
├── _archive/             ← Old/superseded docs
└── [other directories]
```

---

## 📝 Contributing to Documentation

### Adding New Documentation

1. **Determine scope:**
   - Getting started → Update `README_QUICKSTART.md`
   - Architecture → Update `Lumi_visual_diagram.md`
   - Development → Update `README_DEV.md`
   - Roadmap → Update `LUMI_ROADMAP_UPDATE.md`

2. **Avoid duplication:** Check this INDEX before creating new files

3. **Update this INDEX:** Add new docs to the appropriate section

### Updating Existing Documentation

- Update the "Last Updated" date at the top of modified files
- Use clear commit messages describing doc changes
- Run pre-commit hooks to ensure no PII in staged docs

### Archiving Outdated Documentation

- Move to `docs/_archive/` with git mv (preserves history)
- Update `docs/_archive/README.md` with archive date and reason
- Remove links to archived docs from active documentation

---

## 🔍 Finding Information

**If you're looking for...**

- **How to build/run Lumi** → `README_QUICKSTART.md`
- **System architecture** → `Lumi_visual_diagram.md`
- **What features are coming** → `../roadmaps/LUMI_ROADMAP_UPDATE.md`
- **How a specific subsystem works** → `BRAIN_ROADMAP.md`
- **Why something broke** → `../TROUBLESHOOTING.md`
- **How to set up privacy tools** → `../PRIVACY_TOOLS_SETUP.md`
- **Development history** → `../logs/daily/`

---

**Need help?** Check [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md) or contact the maintainers.
