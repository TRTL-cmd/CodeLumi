# Lumi Scripts Directory

This directory contains utility scripts for Lumi development and privacy protection.

---

## 🔐 Privacy Tools

### Quick Start

**Install everything automatically:**
```bash
node scripts/setup_privacy_tools.js
```

This will:
- Install Husky
- Create pre-commit hook
- Run initial privacy audit
- Set up all protections

---

## 📋 Available Scripts

### Privacy & Security

#### `privacy_audit.js`
**Scan files for PII (Personally Identifiable Information)**

```bash
# Scan all training data and KB files
node scripts/privacy_audit.js

# Output: 
# - Console report with findings
# - docs/privacy_audit_results.json
```

**Detects:**
- Email addresses
- Absolute Windows paths (`C:\\Users\\...`)
- UNC network paths (`\\\\SERVER\\...`)
- Phone numbers
- SSNs, credit cards
- IP addresses

---

#### `precommit_check_paths.js`
**Pre-commit hook - Blocks PII commits automatically**

```bash
# Installed by Husky - runs on every commit
# Manually test with:
node scripts/precommit_check_paths.js
```

**Blocks commits containing:**
- Absolute paths
- Email addresses
- SSNs
- Other PII patterns

---

#### `redact_paths.js`
**Clean up existing files by redacting PII**

```bash
# Preview changes (dry run)
node scripts/redact_paths.js --dry-run training/

# Redact single file
node scripts/redact_paths.js training/lumi_knowledge.json

# Redact entire directory
node scripts/redact_paths.js training/

# Redact all training data
node scripts/redact_paths.js --all
```

**Features:**
- Creates `.backup` files before modifying
- Redacts usernames: `C:\\Users\\Chris\\...` → `C:\\Users\\[REDACTED]\\...`
- Redacts emails: `user@domain.com` → `[EMAIL_REDACTED]`
- Converts absolute → relative paths

---

#### `setup_privacy_tools.js`
**One-command setup for all privacy tools**

```bash
node scripts/setup_privacy_tools.js
```

**Does:**
1. Installs Husky
2. Creates pre-commit hook
3. Runs initial audit
4. Shows test instructions

---

### Build & Development

#### `unwrap-kb.js`
**Fix KB format corruption**

```bash
# Converts old {"qa": [...]} format to new [...] format
node scripts/unwrap-kb.js
```

**Use when:**
- Health monitor shows "KB is not an array"
- Agent not scanning files
- KB format corrupted

---

#### `copy_models_postbuild.js` / `copy_models_postbuild.ts`
**Copy model assets after build**

```bash
# Automatically run by npm run build
# Copies trained models to dist/
```

---

## 🚦 Usage Workflows

### Before Committing
```bash
# 1. Check for PII
node scripts/privacy_audit.js

# 2. If issues found, redact them
node scripts/redact_paths.js --all

# 3. Commit (hook will double-check)
git add .
git commit -m "your message"
```

### Before Sharing Files
```bash
# 1. Preview what will change
node scripts/redact_paths.js --dry-run <file>

# 2. Apply redactions
node scripts/redact_paths.js <file>

# 3. Share the redacted file
```

### Setting Up New Dev Environment
```bash
# 1. Clone repo
git clone <repo>

# 2. Install dependencies
npm install

# 3. Set up privacy tools
node scripts/setup_privacy_tools.js

# 4. Run audit to verify
node scripts/privacy_audit.js
```

---

## 🐛 Troubleshooting

### Pre-commit hook not working?

```bash
# Re-install Husky
npm run prepare

# Check hook exists
ls -la .husky/pre-commit

# Make executable (Linux/macOS)
chmod +x .husky/pre-commit
```

### Privacy audit showing false positives?

Edit `scripts/privacy_audit.js` patterns:
```javascript
// Skip certain domains
if (type === 'email' && match[0].includes('example.com')) continue;
```

### Need to bypass hook temporarily?

```bash
# NOT RECOMMENDED - use only if absolutely necessary
git commit --no-verify -m "message"
```

---

## 📊 CI/CD Integration

### GitHub Actions

Privacy audit runs automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main`
- Changes to `training/`, `userData/`, or JSON files

**Workflow:** `.github/workflows/privacy-audit.yml`

**Features:**
- Fails PR if PII detected
- Posts helpful comment with fix instructions
- Uploads audit results as artifact

---

## 🎯 Best Practices

1. **Run audit frequently** - Before commits, before sharing
2. **Review redactions** - Always check what's being changed
3. **Keep backups** - Redaction tool creates them automatically
4. **Test the hook** - After setup, verify it blocks PII
5. **Update patterns** - Adjust for your specific needs

---

## 📚 Documentation

- **Full Setup Guide:** `docs/PRIVACY_TOOLS_SETUP.md`
- **Beta Launch Checklist:** `LUMI_BETA_LAUNCH_CHECKLIST.md`
- **Foundation Checklist:** `FOUNDATION_EXECUTION_CHECKLIST_v3.md`

---

## ⚡ Quick Reference

```bash
# Setup everything
node scripts/setup_privacy_tools.js

# Run audit
node scripts/privacy_audit.js

# Redact files (preview)
node scripts/redact_paths.js --dry-run --all

# Redact files (apply)
node scripts/redact_paths.js --all

# Fix KB format
node scripts/unwrap-kb.js

# Test pre-commit hook
echo "C:\\\\Users\\\\Test\\\\test.txt" > test.txt
git add test.txt
git commit -m "test"  # Should fail
git reset HEAD test.txt && rm test.txt
```

---

**🔒 Remember:** Privacy protection is everyone's responsibility. Use these tools before sharing any files! ✨
