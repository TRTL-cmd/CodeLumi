/**
 * archives-handlers.ts
 *
 * IPC handlers for session archives management.
 *
 * Uses project userData/sessions for archives.
 */

import { BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getLumiPaths } from '../core/paths';

export function initializeArchivesHandlers() {
  const paths = getLumiPaths();

  function sendCuratorEvent(type: string, data?: any) {
    try {
      const bw = BrowserWindow.getAllWindows()[0];
      if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
        bw.webContents.send('lumi-learning-event', Object.assign({ type }, data || {}));
      }
    } catch (_e) { }
  }
  function redactPath(p: string) {
    try {
      return p
        .replace(paths.projectRoot, '[PROJECT_ROOT]')
        .replace(paths.appDataPath, '[APPDATA]')
        .replace(/C:\\Users\\[^\\]+/g, '[USER]');
    } catch (_e) { return p; }
  }

  console.log('[Archives] Using project sessions:', redactPath(paths.archivesDir));

  /**
   * List all archive files
   */
  ipcMain.handle('session:listArchives', async () => {
    try {
      const archivesDir = paths.archivesDir;

      // Create archives directory if it doesn't exist
      try {
        await fs.mkdir(archivesDir, { recursive: true });
      } catch (_e) { /* ignore */ }

      const files = await fs.readdir(archivesDir);
      const archives: any[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(archivesDir, file);
        try {
          const stats = await fs.stat(filePath);
          archives.push({
            name: file,
            path: filePath,
            displayPath: redactPath(filePath),
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          });
        } catch (e) {
          console.warn('[Archives] Failed to stat file:', file, e);
        }
      }

      // Sort by modified date (newest first)
      archives.sort((a, b) => b.modified.getTime() - a.modified.getTime());

      console.log(`[Archives] Found ${archives.length} archive(s) in sessions`);
      return { ok: true, archives };
    } catch (e: any) {
      console.error('[Archives] listArchives failed:', e);
      return { ok: false, error: e?.message || String(e) };
    }
  });

  /**
   * Read a specific archive file
   */
  ipcMain.handle('session:readArchive', async (_event, archivePath: string) => {
    try {
      const paths = getLumiPaths();
      // Security: ensure path is within archives directory
      const archivesDir = path.resolve(paths.archivesDir) + path.sep;
      const resolvedPath = path.resolve(archivePath);

      if (!resolvedPath.startsWith(archivesDir)) {
        return { ok: false, error: 'invalid-path' };
      }

      const data = await fs.readFile(resolvedPath, 'utf8');
      const entries = JSON.parse(data);

      console.log(`[Archives] Read ${entries.length} entries from ${path.basename(resolvedPath)}`);
      return { ok: true, entries: Array.isArray(entries) ? entries : [] };
    } catch (e: any) {
      console.error('[Archives] readArchive failed:', e);
      return { ok: false, error: e?.message || String(e) };
    }
  });

  /**
   * Promote selected entries from archive to active KB
   */
  ipcMain.handle('session:promoteSelected', async (_event, entries: any[]) => {
    try {
      if (!Array.isArray(entries) || entries.length === 0) {
        return { ok: false, error: 'no-entries' };
      }

      const paths = getLumiPaths();
      const kbFile = paths.knowledgeBase;

      // Load current KB
      let kb: any = { qa: [] };
      try {
        const data = await fs.readFile(kbFile, 'utf8');
        kb = JSON.parse(data);
        if (!kb.qa) kb.qa = [];
      } catch (_e) {
        // KB doesn't exist yet
      }

      // Convert entries to KB format
      for (const entry of entries) {
        const text = entry.text || entry.content || '';
        const role = entry.role || 'user';

        // Skip if no meaningful content
        if (!text || text.trim().length === 0) continue;

        // If it's a user message, create a Q&A pair
        if (role === 'user') {
          const q = text.trim();

          kb.qa.push({
            q,
            a: 'Promoted from archive',
            t: entry.t || Date.now(),
            createdAt: entry.t || Date.now(),
            source: 'archive-promoted',
          });
        }
      }

      // Save updated KB
      await fs.writeFile(kbFile, JSON.stringify(kb, null, 2), 'utf8');

      console.log(`[Archives] Promoted ${entries.length} entries to KB`);
      sendCuratorEvent('archives-updated', { action: 'promote-selected', count: entries.length });
      return { ok: true, promoted: entries.length };
    } catch (e: any) {
      console.error('[Archives] promoteSelected failed:', e);
      return { ok: false, error: e?.message || String(e) };
    }
  });

  /**
   * Move an entry to rejected archives
   */
  ipcMain.handle('session:moveEntryToRejected', async (_event, archivePath: string, entryIndex: number) => {
    try {
      const paths = getLumiPaths();

      // Read archive
      const data = await fs.readFile(archivePath, 'utf8');
      const entries = JSON.parse(data);

      if (!Array.isArray(entries) || entryIndex < 0 || entryIndex >= entries.length) {
        return { ok: false, error: 'invalid-index' };
      }

      // Remove entry
      const removed = entries.splice(entryIndex, 1)[0];

      // Save back
      await fs.writeFile(archivePath, JSON.stringify(entries, null, 2), 'utf8');

      // Append to rejected log
      const rejectedFile = path.join(paths.archivesDir, 'rejected_entries.jsonl');
      const rejectedEntry = {
        ...removed,
        rejectedAt: Date.now(),
        originalArchive: path.basename(archivePath),
      };
      await fs.appendFile(rejectedFile, JSON.stringify(rejectedEntry) + '\n', 'utf8');

      console.log('[Archives] Moved entry to rejected');
      sendCuratorEvent('archives-updated', { action: 'move-rejected' });
      return { ok: true };
    } catch (e: any) {
      console.error('[Archives] moveEntryToRejected failed:', e);
      return { ok: false, error: e?.message || String(e) };
    }
  });

  /**
   * Delete an entry from archive
   */
  ipcMain.handle('session:deleteArchiveEntry', async (_event, archivePath: string, entryIndex: number) => {
    try {
      // Special case: entryIndex === -1 means delete the entire file
      if (entryIndex === -1) {
        await fs.unlink(archivePath);
        console.log('[Archives] Deleted archive file:', path.basename(archivePath));
        sendCuratorEvent('archives-updated', { action: 'delete-file' });
        return { ok: true };
      }

      // Read archive
      const data = await fs.readFile(archivePath, 'utf8');
      const entries = JSON.parse(data);

      if (!Array.isArray(entries) || entryIndex < 0 || entryIndex >= entries.length) {
        return { ok: false, error: 'invalid-index' };
      }

      // Remove entry
      entries.splice(entryIndex, 1);

      // Save back (or delete file if empty)
      if (entries.length === 0) {
        await fs.unlink(archivePath);
        console.log('[Archives] Deleted empty archive:', path.basename(archivePath));
      } else {
        await fs.writeFile(archivePath, JSON.stringify(entries, null, 2), 'utf8');
        console.log('[Archives] Deleted entry from archive');
      }
      sendCuratorEvent('archives-updated', { action: 'delete-entry' });
      return { ok: true };
    } catch (e: any) {
      console.error('[Archives] deleteArchiveEntry failed:', e);
      return { ok: false, error: e?.message || String(e) };
    }
  });

  /**
   * Create a new archive from current session
   */
  ipcMain.handle('session:createArchive', async (_event, entries: any[], name?: string) => {
    try {
      if (!Array.isArray(entries) || entries.length === 0) {
        return { ok: false, error: 'no-entries' };
      }

      const paths = getLumiPaths();
      const archivesDir = paths.archivesDir;
      await fs.mkdir(archivesDir, { recursive: true });

      // Session counter stored alongside sessions
      const counterFile = path.join(archivesDir, 'session_counter.json');
      let counter = 0;
      try {
        const raw = await fs.readFile(counterFile, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        counter = Number(parsed && parsed.counter) || 0;
      } catch (_e) { counter = 0; }
      counter += 1;
      try { await fs.writeFile(counterFile, JSON.stringify({ counter }, null, 2), 'utf8'); } catch (_e) { }

      const counterStr = String(counter).padStart(4, '0');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = name
        ? `${name.replace(/[^a-z0-9_-]/gi, '_')}_${counterStr}_${timestamp}.json`
        : `session_${counterStr}_${timestamp}.json`;

      const filePath = path.join(archivesDir, filename);

      // Save archive
      await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf8');

      console.log(`[Archives] Created archive in PROJECT ROOT: ${filename} (${entries.length} entries)`);
      sendCuratorEvent('archives-updated', { action: 'create', name: filename });
      return { ok: true, path: filePath, name: filename };
    } catch (e: any) {
      console.error('[Archives] createArchive failed:', e);
      return { ok: false, error: e?.message || String(e) };
    }
  });

  console.log('[Archives] ✅ Handlers initialized (using PROJECT ROOT)');
}

export default { initializeArchivesHandlers };
