// Lightweight token estimator and trimming utilities
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // approximate tokens from words; factor >1 to account for subword pieces
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  // assume each word ~1.3 tokens (simple heuristic)
  return Math.max(0, Math.ceil(words * 1.3));
}

export function trimTextToTokenBudget(text: string, maxTokens: number): string {
  if (!text) return '';
  const toks = estimateTokens(text);
  if (toks <= maxTokens) return text;
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  // scale down words to match token budget approximately
  const targetWords = Math.max(1, Math.floor(words.length * (maxTokens / toks)));
  return words.slice(-targetWords).join(' ');
}

export function trimEntriesToTokenBudget(entries: Array<{ text: string }>, maxTokens: number) {
  if (!Array.isArray(entries)) return { kept: [], removedCount: 0 };
  // Keep newest entries first (end of array)
  let acc = 0;
  const keptReversed: typeof entries = [] as any;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    const t = estimateTokens(String(e && e.text) || '');
    if (acc + t > maxTokens) break;
    acc += t;
    keptReversed.push(e);
  }
  const kept = keptReversed.reverse();
  return { kept, removedCount: Math.max(0, entries.length - kept.length), tokenCount: acc };
}

export default { estimateTokens, trimTextToTokenBudget, trimEntriesToTokenBudget };
