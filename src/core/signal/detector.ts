// Minimal signal detector shim
// This module provides a conservative, no-op extractor so the app can run
// when a fuller detector implementation is not present. It returns an
// empty array by default to avoid generating auto-learning signals.
export function extractSignalsFromText(_text: string): Array<any> {
  return [];
}

export default { extractSignalsFromText };
