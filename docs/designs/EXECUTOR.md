# Executor — Design & README

Purpose
- Define the Executor component: a small, auditable service that receives approved plan steps and executes them under strict sandboxing and policy controls. The Executor must be safe-by-default, reversible, and fully logged.

Scope
- The Executor exposes an internal API used by the Brain and Autonomy Controller. It is not a public internet-facing service.

API Surface (recommended)
- `executor.evaluateStep(step: Step): Promise<Evaluation>`
  - Returns whether the step is allowed, required consents, risk level, and mitigations.
- `executor.simulateStep(step: Step): Promise<SimulationResult>`
  - Runs the step inside the lightweight JS sandbox (no FS/Network) and returns a simulated output and side-effect preview.
- `executor.executeStep(step: Step, opts): Promise<ExecutionResult>`
  - Executes the step in the appropriate sandbox (lightweight or heavy). Requires pre-approval and will create backups for mutating steps.
- `executor.revertStep(stepId: string): Promise<RevertResult>`
  - Reverts the step using stored backups/diffs.
- `executor.getAudit(planId | opts): Promise<AuditRecords[]>`
  - Retrieve signed audit records for a plan or range.

Step Schema (example)
```
{
  id: "step-uuid",
  action: "writeFile" | "runCommand" | "createKBEntry" | "openURL",
  args: { path?: string, content?: string, cmd?: string, url?: string },
  meta: { origin: 'user' | 'auto', modelVersion?: 'ollama-1.0', confidence?: 0.72 }
}
```

Risk Levels & Policy
- LOW: read-only operations and safe UI changes.
- MEDIUM: file writes that can be backed up automatically.
- HIGH: running shell commands, external network access.
- CRITICAL: privileged operations or potential data exfiltration.

Safe Execution Flow
1. Brain requests `executor.evaluateStep(step)`.
2. Executor returns evaluation (allowed, risk, required consent).
3. UI asks for consent if required and user confirms.
4. UI calls `executor.simulateStep(step)` to show a dry-run preview.
5. On final approval, UI calls `executor.executeStep(step)`.
6. Executor performs the step, writes backup, signs audit record, returns structured output.
7. If needed, UI calls `executor.revertStep` to undo.

Sandboxing Recommendations
- Lightweight sandbox: Node `vm` or dedicated JS interpreter with strict timeouts and no access to `fs` or `net`.
- Heavy sandbox: container instances (Docker) with ephemeral workdir, limited capabilities, and no network by default; mount minimal volumes if needed.

Backup & Revert
- Use unified-diff for text files; store both pre-change and post-change snapshots.
- For binary files, store full archive in backup folder.
- Keep a manifest mapping `planId -> [stepId -> backupPath]`.

Audit & Signing
- All executor actions produce an audit record:
  - `planId, stepId, userId, action, args, preHash, postHash, timestamp, executorEnv, signature`
- Sign using HMAC with a locally stored key; include the key id and rotation metadata.

Developer Quickstart (scaffold)
- File: `src/brain/executor_stub.ts` (create a small TypeScript stub that implements the API above).
- Use a feature flag to enable full heavy-sandbox tests only when Docker (or equivalent) is available.

Testing
- Unit tests for evaluation logic and backup/diff generation.
- Integration tests for simulate -> execute -> revert flows.
- Autonomy Test Suite scenarios for policy violations and response behavior.

Deployment notes
- Executor runs in the Electron main process or as a separate background process depending on architecture.
- If running as a separate process, use IPC with signed request/response and authenticate using a local token.

References
- See `docs/designs/SAFETY_SANDBOX_PLAN.md` for policy, provenance, and the broader autonomy roadmap.

