# Documentation Archive

This directory contains historical and superseded documentation files from the Lumi project.

## Archive Purpose

Files in this directory are:
- **Historical snapshots** with dates in filenames (e.g., `*_2026-01-28.md`)
- **Outdated branding** from the "CodeLumi" phase (renamed to "Lumi")
- **Superseded versions** replaced by newer consolidated documentation
- **Point-in-time audits** and status reports

## Archive Date

Files moved to archive: 2026-02-07

## Active Documentation

For current documentation, see:
- **Getting Started:** `/README_QUICKSTART.md`
- **Architecture:** `/docs/readmes/Lumi_visual_diagram.md`
- **Roadmap:** `/docs/roadmaps/LUMI_ROADMAP_UPDATE.md`
- **Development:** `/docs/readmes/README_DEV.md`

## Preservation

All archived files are preserved in git history. To restore a file:
```bash
git log --all --full-history -- "docs/_archive/filename.md"
git checkout <commit-hash> -- "docs/_archive/filename.md"
```
