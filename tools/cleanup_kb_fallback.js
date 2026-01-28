#!/usr/bin/env node
/**
 * Cleanup script: remove KB entries where question equals the Codelumi fallback prompt
 * This fixes the issue where questions were stored as the assistant's fallback response
 * instead of the actual user question.
 * 
 * Usage: node tools/cleanup_kb_fallback.js
 */

const fs = require('fs');
const path = require('path');

const FALLBACK = "💕 I may not know that yet. Paste a small code snippet and I'll try to analyze it; if I'm wrong, teach me and I'll remember.";
const KB_PATH = path.join(__dirname, '..', 'training', 'lumi_knowledge.json');
const BACKUP_PATH = KB_PATH + '.backup';

function cleanup() {
  console.log('[Cleanup] Starting KB cleanup...');
  console.log(`[Cleanup] Looking for entries with question: "${FALLBACK}"`);
  
  if (!fs.existsSync(KB_PATH)) {
    console.error(`[Error] KB file not found: ${KB_PATH}`);
    process.exit(1);
  }

  // Backup
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(KB_PATH, BACKUP_PATH);
    console.log(`[Cleanup] Backup created: ${BACKUP_PATH}`);
  }

  // Read
  let kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
  const initialQACount = kb.qa ? kb.qa.length : 0;
  const initialFeedbackCount = kb.meta && kb.meta.feedback ? kb.meta.feedback.length : 0;

  // Clean qa entries
  if (kb.qa && kb.qa.length > 0) {
    kb.qa = kb.qa.filter(entry => entry.q !== FALLBACK);
  }
  const removedQA = initialQACount - (kb.qa ? kb.qa.length : 0);

  // Clean feedback entries (feedback q field should also not be the fallback)
  if (kb.meta && kb.meta.feedback && kb.meta.feedback.length > 0) {
    kb.meta.feedback = kb.meta.feedback.filter(entry => entry.q !== FALLBACK);
  }
  const removedFeedback = initialFeedbackCount - (kb.meta && kb.meta.feedback ? kb.meta.feedback.length : 0);

  // Write
  fs.writeFileSync(KB_PATH, JSON.stringify(kb, null, 2));
  console.log(`[Cleanup] Removed ${removedQA} QA entries with fallback question`);
  console.log(`[Cleanup] Removed ${removedFeedback} feedback entries with fallback question`);
  console.log(`[Cleanup] KB updated: ${KB_PATH}`);
  console.log(`[Cleanup] ✓ Done. Backup saved to ${BACKUP_PATH}`);
}

cleanup();
