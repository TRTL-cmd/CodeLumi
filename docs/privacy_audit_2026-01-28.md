# Privacy Audit — 2026-01-28
Generated: 2026-01-28T08:33:23.499Z

## Scanned directories
- C:\Users\Chris\OneDrive\Desktop\Lumi\training — 29 files
- C:\Users\Chris\OneDrive\Desktop\Lumi\userData — 24 files

## Key findings (files with potential PII or absolute paths)
- training\lumi_knowledge.backup.1769579064263.json.backup.redact.1769588026992.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\lumi_knowledge.backup.1769579489486.json.backup.redact.1769588027006.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\lumi_knowledge.backup.redact.1769584050203.json.backup.redact.1769588027015.bak
  - windows paths: h:\n\n**1. | n:\n\n* | s:\n\n, ...
- training\lumi_knowledge.deduped.json.backup.redact.1769584364909.json.backup.redact.1769588027034.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\lumi_knowledge.deduped.json.backup.redact.1769585424966.json.backup.redact.1769588027043.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\lumi_knowledge.deduped.json.backup.redact.1769588027026.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\lumi_knowledge.json.backup.redact.1769584364855.json.backup.redact.1769588027060.bak
  - windows paths: h:\n\n**1. | n:\n\n* | s:\n\n, ...
- training\lumi_knowledge.json.backup.redact.1769585424916.json.backup.redact.1769588027070.bak
  - windows paths: h:\n\n**1. | n:\n\n* | s:\n\n, ...
- training\lumi_knowledge.json.backup.redact.1769588027051.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\repair_report.json.backup.redact.1769588027077.bak
  - windows paths: n:\n\n* | s:\n\n | e:\n, ...
- training\training.jsonl
  - emails: john@example.com
- training\training.jsonl.backup.redact.1769588027080.bak
  - emails: john@example.com
  - windows paths: n:\n\n**1. | s:\n | e:\n\n*, ...
- userData\audit_1769236178054.json.backup.redact.1769588027084.bak
  - windows paths: C:\\Users\\Chris\\OneDrive\\Desktop\\Lumi\\tmp\\dryrun_test.txt",
- userData\backups\1769240029371\audit.json.backup.redact.1769588027087.bak
  - windows paths: C:\\Users\\Chris\\OneDrive\\Desktop\\Lumi\\tmp\\executor_test.txt", | C:\\Users\\Chris\\OneDrive\\Desktop\\Lumi\\userData\\backups\\1769240029371\\tmp__executor_test.txt.bak"
- userData\backups\1769242881879\audit.json.backup.redact.1769588027089.bak
  - windows paths: C:\\Users\\Chris\\OneDrive\\Desktop\\Lumi\\tmp\\integration_executor_test.txt",
- userData\backups\1769242986118\audit.json.backup.redact.1769588027091.bak
  - windows paths: C:\\Users\\Chris\\OneDrive\\Desktop\\Lumi\\tmp\\integration_executor_test.txt",
- userData\self-learn\selflearn_audit.jsonl.backup.redact.1769588027092.bak
  - UNC paths: \\n');\r
- userData\self-learn\selflearn_progress.json.backup.redact.1769588027094.bak
  - windows paths: C:\\Users\\Chris\\OneDrive\\Desktop\\Lumi\\src\\core\\llm\\ollama.ts":

## Recommendations
- Replace discovered absolute paths with basenames where possible; redact or pseudonymize emails.
- Ensure runtime writes are sanitized before persisting to `userData`.
- Add CI check to fail on committed files containing `C:\` or email patterns in `training/`.