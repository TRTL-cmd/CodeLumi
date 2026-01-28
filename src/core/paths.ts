import * as path from 'path';
import * as fs from 'fs';

function resolveCandidates(): string[] {
  // prefer project-root training files (common during dev)
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'training', 'training.jsonl'),
    path.join(cwd, 'training.jsonl'),
    path.join(cwd, 'training', 'lumi_knowledge.json'),
    path.join(cwd, 'training', 'lumi_knowledge.json'),
    // also check project-level userData (created by main bootstrap during dev)
    path.join(cwd, 'userData', 'lumi_knowledge.json'),
  ];
  // also try relative to this file (useful for packaged/dist builds)
  const relative = [
    path.join(__dirname, '..', '..', 'training', 'training.jsonl'),
    path.join(__dirname, '..', '..', 'training', 'lumi_knowledge.json'),
    // packaged relative userData fallback
    path.join(__dirname, '..', '..', 'userData', 'lumi_knowledge.json'),
  ];
  return candidates.concat(relative);
}

export function findFirstExisting(paths: string[]) {
  for (const p of paths) if (fs.existsSync(p)) return p;
  return null;
}

export function getKBCandidatePaths() {
  return resolveCandidates();
}

export function getKBPrimaryPath() {
  return findFirstExisting(getKBCandidatePaths());
}

export function getUserDataPath(fileName = '') {
  const cwd = process.cwd();
  const p = path.join(cwd, 'userData', fileName || '');
  return p;
}

export default {
  getKBCandidatePaths,
  getKBPrimaryPath,
  getUserDataPath,
};
