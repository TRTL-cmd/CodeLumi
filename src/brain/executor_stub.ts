// Minimal executor stub for Lumi
// Purpose: provide evaluate/simulate/execute/revert API stubs for development and dry-run testing.

import fs from 'fs';
import path from 'path';

const USER_DATA = path.resolve(process.cwd(), 'userData');
if (!fs.existsSync(USER_DATA)) fs.mkdirSync(USER_DATA, { recursive: true });

export type Step = {
  id: string;
  action: 'writeFile' | 'runCommand' | 'createKBEntry' | 'openURL' | string;
  args: Record<string, any>;
  meta?: Record<string, any>;
};

export type Evaluation = {
  allowed: boolean;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredConsent: string[];
  reason?: string;
};

export type SimulationResult = {
  success: boolean;
  preview?: string; // text preview of side effects (diff, messages)
  logs?: string[];
};

export type ExecutionResult = {
  success: boolean;
  output?: any;
  backupPath?: string;
  auditPath?: string;
};

// Simple policy check: conservative defaults
export async function evaluateStep(step: Step): Promise<Evaluation> {
  if (step.action === 'readFile' || step.action === 'createKBEntry') {
    return { allowed: true, risk: 'LOW', requiredConsent: [] };
  }
  if (step.action === 'writeFile') {
    return { allowed: true, risk: 'MEDIUM', requiredConsent: ['confirm_write'] };
  }
  if (step.action === 'runCommand') {
    return { allowed: false, risk: 'HIGH', requiredConsent: ['confirm_exec', 'manual_review'], reason: 'Commands require sandbox and policy review.' };
  }
  return { allowed: false, risk: 'HIGH', requiredConsent: ['manual_review'], reason: 'Unknown action' };
}

export async function simulateStep(step: Step): Promise<SimulationResult> {
  // For writeFile, return a preview diff-like message
  if (step.action === 'writeFile' && step.args.path && typeof step.args.content === 'string') {
    const target = path.resolve(process.cwd(), step.args.path);
    let before = '';
    try { before = fs.readFileSync(target, 'utf8'); } catch (e) { before = '' }
    const preview = `--- ${step.args.path}\n+++ (proposed)\n` + (step.args.content ? step.args.content.substring(0, 200) : '');
    return { success: true, preview, logs: ['Simulated writeFile (preview)'] };
  }
  return { success: true, preview: 'No side-effects (simulation)', logs: ['Simulated step'] };
}

export async function executeStep(step: Step): Promise<ExecutionResult> {
  const evalRes = await evaluateStep(step);
  if (!evalRes.allowed) return { success: false, output: { reason: evalRes.reason } };

  if (step.action === 'writeFile') {
    const target = path.resolve(process.cwd(), step.args.path);
    const backupDir = path.join(USER_DATA, 'backups', step.id);
    fs.mkdirSync(backupDir, { recursive: true });
    try {
      if (fs.existsSync(target)) {
        const orig = fs.readFileSync(target);
        const prePath = path.join(backupDir, path.basename(step.args.path) + '.orig');
        fs.writeFileSync(prePath, orig);
      }
      fs.writeFileSync(target, step.args.content || '');
      const auditPath = path.join(USER_DATA, 'audit_' + Date.now() + '.json');
      const audit = { stepId: step.id, action: step.action, args: step.args, ts: Date.now() };
      fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
      return { success: true, output: { path: target }, backupPath: backupDir, auditPath };
    } catch (e: any) {
      return { success: false, output: { error: String(e) } };
    }
  }

  // Other actions: not implemented in stub
  return { success: false, output: { reason: 'Action not implemented in stub' } };
}

export async function revertStep(stepId: string): Promise<ExecutionResult> {
  const backupDir = path.join(USER_DATA, 'backups', stepId);
  if (!fs.existsSync(backupDir)) return { success: false, output: { reason: 'No backup found' } };
  const files = fs.readdirSync(backupDir);
  try {
    for (const f of files) {
      if (f.endsWith('.orig')) {
        const origPath = path.join(backupDir, f);
        const targetName = f.replace('.orig', '');
        const targetPath = path.resolve(process.cwd(), targetName);
        const data = fs.readFileSync(origPath);
        fs.writeFileSync(targetPath, data);
      }
    }
    return { success: true, output: { restored: files.length } };
  } catch (e: any) {
    return { success: false, output: { error: String(e) } };
  }
}

export async function getAudit(filter?: any): Promise<any[]> {
  const files = fs.readdirSync(USER_DATA).filter(f => f.startsWith('audit_'));
  const res: any[] = [];
  for (const f of files) {
    try { res.push(JSON.parse(fs.readFileSync(path.join(USER_DATA, f), 'utf8'))); } catch {}
  }
  return res;
}
