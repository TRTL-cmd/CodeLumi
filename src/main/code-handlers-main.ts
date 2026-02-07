import { ipcMain, BrowserWindow } from 'electron';
import { think } from '../core/brain/index';
import { thinkWithRAG } from '../core/brain/brain-rag-integration';

// Simple code analysis handler - returns JSON array of issues/suggestions
ipcMain.handle('code:analyze', async (_event, code: string, language?: string) => {
  try {
    const lang = language || 'code';
    const prompt = `Analyze the following ${lang} code and return a JSON array of issues and suggestions. Each item should be {"line":number,"message":"...","severity":"low|medium|high","fix":"optional fix suggestion"}. Return ONLY JSON.` + '\n\n' + code.slice(0, 20000);
    try {
      const out = await thinkWithRAG(prompt, { maxTokens: 600 });
      const s = String(out || '');
      let parsed = null;
      try { parsed = JSON.parse(s); } catch (_e) {
        const m = s.match(/```json\s*([\s\S]*?)\s*```/i);
        if (m && m[1]) try { parsed = JSON.parse(m[1]); } catch (_e) { parsed = null; }
      }
      if (!Array.isArray(parsed)) return { ok: true, raw: s, parsed: [] };
      return { ok: true, issues: parsed };
    } catch (err) {
      // fallback to plain think
      const out = await think(prompt, { maxTokens: 600 });
      return { ok: true, raw: String(out) };
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Code fix / auto-refactor - returns fixed code
ipcMain.handle('code:fix', async (_event, code: string, language?: string, instructions?: string) => {
  try {
    const lang = language || 'code';
    const instr = instructions ? `Additional instructions: ${instructions}\n\n` : '';
    const prompt = `Given the following ${lang} code, apply fixes and refactors as appropriate and return ONLY the updated file contents. ${instr}Code:\n${code.slice(0, 20000)}`;
    try {
      const out = await thinkWithRAG(prompt, { maxTokens: 1600 });
      return { ok: true, fixed: String(out) };
    } catch (err) {
      const out = await think(prompt, { maxTokens: 1600 });
      return { ok: true, fixed: String(out) };
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Extract code blocks/language detection helper
ipcMain.handle('code:extract', async (_event, text: string) => {
  try {
    // naive language detection by heuristics
    const sample = String(text || '').slice(0, 1000);
    let lang = 'text';
    if (/^\s*</.test(sample) || /<\w+\s/.test(sample)) lang = 'html';
    else if (/^\s*import\s+|from\s+\w+\s+import/.test(sample)) lang = 'python';
    else if (/function\s+|const\s+|let\s+|=>|console\.log\(/.test(sample)) lang = 'javascript';
    else if (/^\s*#/.test(sample)) lang = 'shell';
    return { ok: true, language: lang, code: text };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Notify renderer when analysis/fix completed (optional)
function notifyRenderer(channel: string, payload: any) {
  try {
    const bw = BrowserWindow.getAllWindows()[0];
    if (bw && bw.webContents && typeof bw.webContents.send === 'function') bw.webContents.send(channel, payload);
  } catch (_e) { }
}

export default {};
