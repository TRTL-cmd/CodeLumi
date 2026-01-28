Export & Import — Training Artifacts (Phase 1)

Purpose
- Describe recommended steps and tools to export training data safely and to import sanitized training artifacts.

Exporting
1. Use the provided export script (sanitizes by default):

   ```bash
   node tools/export_kb_for_training.js --out exports/training_export.jsonl
   ```

2. Verify the export with the privacy audit script:

   ```bash
   node scripts/privacy_audit.js --file exports/training_export.jsonl
   ```

3. If any findings are reported, run the sanitizer tool or manually redact before sharing. Recommended sanitizer (example):

   ```bash
   node scripts/preprocess_export.js exports/training_export.jsonl exports/training_export_sanitized.jsonl
   ```

Importing
1. Place import file into local system and validate format (JSONL of question/answer pairs or knowledge objects).
2. Use the staging import flow to avoid immediate application to `training/lumi_knowledge.json`:

   ```bash
   node tools/import_to_staging.js exports/training_export_sanitized.jsonl
   ```

3. Curator review: imported items go to the curator queue for review and safe apply.

Notes
- Do not place raw backups or unredacted exports into public repositories.
- Always re-run `node scripts/privacy_audit.js` on any artifacts you plan to share.
