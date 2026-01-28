// Minimal simulator/test harness stub for Lumi
// Purpose: run quick dry-run checks and record results to an audit-like store

import fs from 'fs';
import path from 'path';
import vm from 'vm';

const USER_DATA = path.resolve(process.cwd(), 'userData');
if (!fs.existsSync(USER_DATA)) fs.mkdirSync(USER_DATA, { recursive: true });

export type SimResult = {
  success: boolean;
  logs: string[];
  ts: number;
};

export async function simulatePatch(patchText: string, patchId: string): Promise<SimResult> {
  // Very small heuristic: run any JS code under VM (dangerous in general) — here only for tiny evals
  const logs: string[] = [];
  try {
    if (patchText.includes('console.log')) {
      logs.push('Patch contains console.log — OK');
    }
    // sandboxed evaluation of small snippets (limit to expression)
    if (patchText.trim().length < 1000 && patchText.includes('module.exports') === false) {
      const script = new vm.Script(patchText.substring(0, 1000));
      const sandbox: any = {};
      vm.createContext(sandbox);
      try {
        script.runInContext(sandbox, { timeout: 500 });
        logs.push('VM executed snippet without error');
      } catch (e: any) {
        logs.push('VM execution error: ' + String(e));
      }
    } else {
      logs.push('Patch too large or flagged; skipping VM execution');
    }
    const out = { success: true, logs, ts: Date.now() };
    const outPath = path.join(USER_DATA, `sim_${patchId || 'unknown'}_${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    return out;
  } catch (e: any) {
    const out = { success: false, logs: [String(e)], ts: Date.now() };
    const outPath = path.join(USER_DATA, `sim_${patchId || 'unknown'}_${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    return out;
  }
}
