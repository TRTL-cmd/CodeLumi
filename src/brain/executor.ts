import * as fs from 'fs';
import * as path from 'path';
import { exec as execCmd } from 'child_process';

const USER_DATA = path.resolve(process.cwd(), 'userData');
try { if (!fs.existsSync(USER_DATA)) fs.mkdirSync(USER_DATA, { recursive: true }); } catch (_){ }

export type Step = {
  id: string;
  action: 'writeFile' | 'runCommand' | 'presentKB' | 'callLLM' | string;
  args: Record<string, any>;
  meta?: Record<string, any>;
};

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

async function evaluateStep(step: Step) {
  if (step.action === 'presentKB') return { allowed: true, risk: 'LOW', requiredConsent: [] };
  if (step.action === 'callLLM') return { allowed: true, risk: 'LOW', requiredConsent: [] };
  if (step.action === 'writeFile') return { allowed: true, risk: 'MEDIUM', requiredConsent: ['confirm_write'] };
  if (step.action === 'runCommand') return { allowed: false, risk: 'CRITICAL', requiredConsent: ['confirm_exec','manual_review'], reason: 'Commands are disabled by default' };
  return { allowed: false, risk: 'HIGH', requiredConsent: ['manual_review'], reason: 'Unknown action' };
}

function journalPath() {
  return path.join(USER_DATA, 'action_journal.jsonl');
}

async function appendJournal(record: any) {
  try {
    const file = journalPath();
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.appendFile(file, JSON.stringify(record) + '\n', 'utf8');
  } catch (_e) { }
}

export async function simulatePlan(plan: any): Promise<any> {
  const previews: any[] = [];
  for (const step of (plan.steps || [])) {
    if (step.action === 'writeFile') {
      const target = path.resolve(process.cwd(), String(step.args.path || ''));
      let before = '';
      try { before = fs.readFileSync(target, 'utf8'); } catch (_e) { before = ''; }
      const after = String(step.args.content || '').slice(0, 10000);
      previews.push({ stepId: step.id, preview: `Write to ${path.relative(process.cwd(), target)} (preview):\n--- before (${before.length} chars)\n+++ after (${after.length} chars)\n${after.slice(0,200)}` });
    } else if (step.action === 'presentKB') {
      const hits = step.args.hits || [];
      const s = (hits.map((h: any) => (h.title || h.id || '').toString().slice(0,120))).join(', ');
      previews.push({ stepId: step.id, preview: `Present KB hits: ${s}` });
    } else if (step.action === 'callLLM') {
      previews.push({ stepId: step.id, preview: `Call LLM with prompt: ${String(step.args.prompt || '').slice(0,400)}` });
    } else if (step.action === 'runCommand') {
      previews.push({ stepId: step.id, preview: `Run command (SIMULATED): ${String(step.args.cmd || step.args.command || '')}` });
    } else {
      previews.push({ stepId: step.id, preview: `Unknown action ${step.action}` });
    }
  }
  return { ok: true, previews };
}

export async function applyPlan(plan: any, opts: any = {}): Promise<any> {
  const planId = plan.id || genId('plan');
  const results: any[] = [];
  for (const step of (plan.steps || [])) {
    const evalRes = await evaluateStep(step);
    if (!evalRes.allowed && !opts.force) {
      const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: false, reason: evalRes.reason || 'blocked' };
      await appendJournal(rec);
      return { ok: false, error: 'step-blocked', detail: rec };
    }
    if (step.action === 'writeFile') {
      try {
        const target = path.resolve(process.cwd(), String(step.args.path || ''));
        // sandbox: disallow writes outside project root unless explicitly allowed
        if (!opts.allowOutside && !target.startsWith(process.cwd())) {
          const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: false, reason: 'sandboxed' };
          await appendJournal(rec);
          return { ok: false, error: 'sandbox_violation', detail: rec };
        }
        const backupDir = path.join(USER_DATA, 'backups', step.id);
        await fs.promises.mkdir(backupDir, { recursive: true });
        if (fs.existsSync(target)) {
          const orig = fs.readFileSync(target);
          const prePath = path.join(backupDir, path.basename(target) + '.orig');
          fs.writeFileSync(prePath, orig);
        }
        fs.writeFileSync(target, String(step.args.content || ''), 'utf8');
        const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: true, backupPath: backupDir, output: { path: target } };
        await appendJournal(rec);
        results.push(rec);
      } catch (e: any) {
        const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: false, error: e?.message || String(e) };
        await appendJournal(rec);
        return { ok: false, error: 'write-failed', detail: rec };
      }
    } else if (step.action === 'presentKB') {
      const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: true, output: { presented: (step.args.hits || []).length } };
      await appendJournal(rec);
      results.push(rec);
    } else if (step.action === 'callLLM') {
      // Do not execute LLM calls here; they should be handled by brain/LLM layer. Journal the intent.
      const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: true, output: { prompt: step.args.prompt || '' } };
      await appendJournal(rec);
      results.push(rec);
    } else if (step.action === 'runCommand') {
      if (!opts.allowExec) {
        const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: false, reason: 'exec_disabled' };
        await appendJournal(rec);
        return { ok: false, error: 'exec_disabled', detail: rec };
      }
      // execute command (dangerous): use exec and capture output
      try {
        const cmd = String(step.args.cmd || step.args.command || '');
        const out = await new Promise<{ stdout: string; stderr: string }>((res, rej) => {
          execCmd(cmd, { cwd: process.cwd(), windowsHide: true }, (err, stdout, stderr) => {
            if (err) return rej(err);
            res({ stdout: String(stdout || ''), stderr: String(stderr || '') });
          });
        });
        const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: true, output: out };
        await appendJournal(rec);
        results.push(rec);
      } catch (e: any) {
        const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: false, error: e?.message || String(e) };
        await appendJournal(rec);
        return { ok: false, error: 'exec_failed', detail: rec };
      }
    } else {
      const rec = { ts: Date.now(), planId, stepId: step.id, action: step.action, allowed: false, reason: 'unknown' };
      await appendJournal(rec);
      return { ok: false, error: 'unknown-action', detail: rec };
    }
  }
  return { ok: true, results };
}

export async function getJournal(filter?: any): Promise<any[]> {
  const file = journalPath();
  try {
    const raw = await fs.promises.readFile(file, 'utf8');
    return raw.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_e) { return null; } }).filter(Boolean);
  } catch (e: any) {
    return [];
  }
}

export async function revert(targetId: string): Promise<any> {
  // If targetId is a step id with backups, restore files from backups
  try {
    const backupDir = path.join(USER_DATA, 'backups', targetId);
    if (!fs.existsSync(backupDir)) {
      // try to find journal entries matching planId and revert all step backups
      const all = await getJournal();
      const matches = all.filter((r: any) => r.planId === targetId && r.backupPath).map((r: any) => r.backupPath);
      if (!matches || matches.length === 0) return { ok: false, error: 'no-backup' };
      let restored = 0;
      for (const b of matches) {
        if (!fs.existsSync(b)) continue;
        const files = fs.readdirSync(b);
        for (const f of files) {
          if (f.endsWith('.orig')) {
            const orig = path.join(b, f);
            const target = path.resolve(process.cwd(), f.replace('.orig', ''));
            try { fs.copyFileSync(orig, target); restored++; } catch (_e) { }
          }
        }
      }
      const rec = { ts: Date.now(), action: 'revert', target: targetId, restored };
      await appendJournal(rec);
      return { ok: true, restored };
    }
    const files = fs.readdirSync(backupDir);
    let restored = 0;
    for (const f of files) {
      if (f.endsWith('.orig')) {
        const orig = path.join(backupDir, f);
        const target = path.resolve(process.cwd(), f.replace('.orig', ''));
        try { fs.copyFileSync(orig, target); restored++; } catch (_e) { }
      }
    }
    const rec = { ts: Date.now(), action: 'revert', target: targetId, restored };
    await appendJournal(rec);
    return { ok: true, restored };
  } catch (e: any) {
    const rec = { ts: Date.now(), action: 'revert', target: targetId, error: e?.message || String(e) };
    await appendJournal(rec);
    return { ok: false, error: e?.message || String(e) };
  }
}

export default {
  simulatePlan,
  applyPlan,
  getJournal,
  revert
};
