// Minimal proposal generator stub for Lumi
// Purpose: scan project and produce simple proposals (lint/docs/fix suggestions)

import fs from 'fs';
import path from 'path';

export type Proposal = {
  id: string;
  title: string;
  summary: string;
  diff?: string; // quick textual patch preview
  confidence?: number;
};

export async function generateProposals(limit = 10): Promise<Proposal[]> {
  // Simple heuristic: find README or TODO mentions and propose doc clarifications
  const cwd = process.cwd();
  const readme = path.join(cwd, 'README.md');
  const proposals: Proposal[] = [];
  if (fs.existsSync(readme)) {
    const content = fs.readFileSync(readme, 'utf8');
    if (content.includes('TODO')) {
      proposals.push({ id: 'prop-1', title: 'Clarify README TODOs', summary: 'Replace TODOs with actionable items', diff: 'README: Replace TODO with items', confidence: 0.6 });
    }
  }
  // Fallback sample proposal
  if (proposals.length === 0) {
    proposals.push({ id: 'prop-sample-1', title: 'Sample lint fix', summary: 'Apply small lint formatting changes', diff: 'Whitespace/formatting', confidence: 0.4 });
  }
  return proposals.slice(0, limit);
}
