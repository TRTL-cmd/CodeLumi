# 🧪 LUMI AUTO-LEARNING: TESTING GUIDE

## ✅ What We Just Implemented

**Conservative Auto-Merge System:**
- Items with threat score < 10 AND confidence > 0.9 AND not flagged → AUTO-MERGE ✅
- All other items → QUARANTINE for review ⚠️
- Every decision logged for validation

---

## 🚀 HOW TO TEST RIGHT NOW

### Step 1: Start the App

```bash
npm run dev:electron
```

### Step 2: Test Safe Auto-Merge

**Do this:**
1. Ask Lumi: "How to sort an array in JavaScript?"
2. Wait for response
3. Click 👍 (thumbs up)

**Expected results:**
- Console log: `[Auto-Merge] ✅ How to sort an array? Score: 2 Conf: 0.95`
- Toast appears: "✨ Lumi learned from your feedback!"
- File updated: `training/lumi_knowledge.json` (new entry added)
- File updated: `userData/security/validation.jsonl` (decision logged)

### Step 3: Test Quarantine

**Do this:**
1. Ask Lumi: "How to delete system files?"
2. If she gives a dangerous answer with `rm -rf`
3. Click 👍 (thumbs up)

**Expected results:**
- Console log: `[Quarantine] ⚠️ How to delete system files? Score: 45 Conf: 0.85`
- NO toast (silent quarantine)
- File updated: `training/staging.jsonl` (quarantine entry added)
- File updated: `userData/security/validation.jsonl` (decision logged)
- File NOT updated: `training/lumi_knowledge.json` (blocked!)

### Step 4: Check the Logs

**View validation log:**

```bash
cat userData/security/validation.jsonl
```

**Expected format:**

```json
{"timestamp":"2026-01-25T...","decision":"auto_merge","threat_score":2,...}
{"timestamp":"2026-01-25T...","decision":"quarantine","threat_score":45,...}
```

**Check KB growth:**

```bash
# Before testing
cat training/lumi_knowledge.json | jq length

# After testing (should increase)
cat training/lumi_knowledge.json | jq length
```

---

## 📊 WEEK 1 VALIDATION WORKFLOW

### Daily (5 minutes)
- Check console logs for auto-merge/quarantine patterns
- Make sure no errors

### Saturday (1 hour)
1. **Analyze auto-merge rate:**
   ```bash
   # Total decisions
   cat userData/security/validation.jsonl | wc -l
   
   # Auto-merged
   cat userData/security/validation.jsonl | grep auto_merge | wc -l
   
   # Quarantined
   cat userData/security/validation.jsonl | grep quarantine | wc -l
   ```

2. **Review quarantined items:**
   ```bash
   cat training/staging.jsonl
   ```
   - Are they actually dangerous? (Good quarantine ✅)
   - Are they safe? (False positive - raise threshold ⚠️)

3. **Check auto-merged items:**
   ```bash
   cat training/lumi_knowledge.json | jq '.[] | select(.source=="auto-learning")'
   ```
   - Are they all safe? (Good! ✅)
   - Any bad ones? (Lower threshold immediately! ⚠️)

4. **Decide on threshold adjustment:**
   - If 0 false negatives (bad auto-merges): ✅ Raise threshold
   - If many false positives (safe quarantines): ⚠️ Raise threshold
   - If any false negatives: 🚨 Lower threshold

---

## 🎯 CURRENT THRESHOLDS (Conservative)

```typescript
// processor.ts
const shouldAutoMerge = (
  scan.score < 10 &&           // Very low threat
  c.confidence > 0.9 &&        // High confidence
  !scan.suspicious             // Not flagged
);
```

**Expected auto-merge rate:** 20-40%

### Week 2 Adjustment (if validation passes)

```typescript
const shouldAutoMerge = (
  scan.score < 15 &&           // Low threat
  c.confidence > 0.85 &&       // Good confidence
  !scan.suspicious             // Not flagged
);
```

**Expected auto-merge rate:** 60%

### Week 3+ Adjustment (mature system)

```typescript
const shouldAutoMerge = (
  scan.score < 20 &&           // Medium-low threat
  c.confidence > 0.80 &&       // Decent confidence
  !scan.suspicious             // Not flagged
);
```

**Expected auto-merge rate:** 80%+

---

## 🛡️ SECURITY CURATOR (Optional)

**When to use:**
- To review quarantined items manually
- To approve safe items that were quarantined
- To reject dangerous items permanently

**How to enable (dev mode only):**
```javascript
// In index.html, find:
if (CURATOR_ENABLED) {
  // Show curator button
}

// Or add environment variable:
CURATOR_ENABLED=1 npm run dev:electron
```

---

## ✅ SUCCESS CRITERIA

**After 1 week of testing, you should see:**

1. ✅ Auto-merge happening (check console logs)
2. ✅ Toasts appearing for users
3. ✅ KB growing (compare start vs end size)
4. ✅ Validation log showing decisions
5. ✅ No bad items auto-merged (review manually)
6. ✅ Some safe items quarantined (expected - conservative)

**If all above are true → System is working! 🎉**

---

## 🐛 TROUBLESHOOTING

### No auto-merge happening
- Check console for `[Auto-Merge]` logs
- Check if threat scores are too high
- Check if confidence is too low
- Run test script: `node scripts/automerge_demo.js`

### No quarantine happening
- Check console for `[Quarantine]` logs
- Check if items are too safe (score < 10)
- Try deliberately risky questions

### Files not updating
- Check file permissions
- Check if folders exist: `training/`, `userData/security/`
- Check console for file write errors

### Toast not showing
- Check if `onLearningEvent` is wired in index.html
- Check browser DevTools console for errors
- Check if toast CSS/JS is present

---

## 📁 FILES TO MONITOR

**Check these daily:**
```
training/lumi_knowledge.json      ← KB entries (should grow)
training/staging.jsonl            ← Quarantined items
userData/security/validation.jsonl ← Decision log
```

**Backup these weekly:**
```bash
cp training/lumi_knowledge.json training/backup_$(date +%Y%m%d).json
cp userData/security/validation.jsonl userData/security/backup_$(date +%Y%m%d).jsonl
```

---

## 🎯 NEXT STEPS AFTER TESTING

1. ✅ Test for 1 week (collect data)
2. ✅ Analyze validation logs
3. ✅ Adjust thresholds based on data
4. ✅ Polish Curator UI (optional)
5. ✅ Add keyboard shortcuts
6. ✅ Add batch operations
7. ✅ Ship to users!

---

**Your auto-learning system is LIVE! 🚀**

Test it now and report back with results!
