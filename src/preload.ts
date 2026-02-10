// Copyright (c) 2026 Tortol studios. All rights reserved.
// Contact: Tortolcoin@gmail.com
// Proprietary — do not reproduce, distribute, or sell without permission.
// Preload can expose safe APIs to renderer
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('lumi', {
  ping: () => 'pong',
  saveKnowledge: async (data: any) => ipcRenderer.invoke('lumi-save', data),
  loadKnowledge: async () => ipcRenderer.invoke('lumi-load'),
  shutdown: async () => ipcRenderer.invoke('lumi-shutdown')
  ,
  think: async (prompt: string, options: any) => ipcRenderer.invoke('lumi-think', prompt, options),
  chat: async (messages: any[], options: any) => ipcRenderer.invoke('lumi-chat', messages, options),
  startThinkStream: (prompt: string, options: any) => ipcRenderer.send('lumi-think-stream-start', prompt, options),
  onThinkChunk: (cb: (chunk: string) => void) => ipcRenderer.on('lumi-think-chunk', (_e, chunk) => cb(chunk)),
  onThinkDone: (cb: () => void) => ipcRenderer.on('lumi-think-done', () => cb()),
  onThinkError: (cb: (err: string) => void) => ipcRenderer.on('lumi-think-error', (_e, err) => cb(err))
  ,
  // Memory API (file-backed)
  memoryAdd: async (entry: any) => ipcRenderer.invoke('memory-add', entry),
  memoryQuery: async (q: string, limit?: number) => ipcRenderer.invoke('memory-query', q, limit),
  memoryExport: async () => ipcRenderer.invoke('memory-export')
  ,
  getMetrics: async () => ipcRenderer.invoke('lumi-metrics'),
  healthCheck: async () => ipcRenderer.invoke('lumi:health-check'),
  ollamaStatus: async () => ipcRenderer.invoke('ollama:status'),
  backupNow: async () => ipcRenderer.invoke('lumi:backup-now'),
  listBackups: async () => ipcRenderer.invoke('lumi:list-backups'),
  getLogs: async (opts?: any) => ipcRenderer.invoke('lumi:get-logs', opts || {}),
  exportLogs: async () => ipcRenderer.invoke('support:export-logs'),
  reportCrash: (payload: any) => { try { ipcRenderer.send('telemetry:crash', payload || {}); } catch (_e) { } },
  logAssistant: async (question: string, answer: string, confidence?: number) => ipcRenderer.invoke('lumi-log-assistant', question, answer, confidence),
  logFeedback: async (type: string, text?: string) => ipcRenderer.invoke('lumi-log-feedback', { type, text }),
  // Learning event subscription
  onLearningEvent: (cb: (payload: any) => void) => ipcRenderer.on('lumi-learning-event', (_e, payload) => cb(payload)),
  // Self-learn controls
  selflearn: {
    start: async () => ipcRenderer.invoke('selflearn:start'),
    stop: async () => ipcRenderer.invoke('selflearn:stop'),
    pause: async () => ipcRenderer.invoke('selflearn:pause'),
    resume: async () => ipcRenderer.invoke('selflearn:resume'),
    setRate: async (rpm: number) => ipcRenderer.invoke('selflearn:setRate', rpm),
    undo: async (count = 1) => ipcRenderer.invoke('selflearn:undo', count),
    reset: async () => ipcRenderer.invoke('selflearn:reset'),
    status: async () => ipcRenderer.invoke('selflearn:status'),
    getProgress: async () => ipcRenderer.invoke('selflearn:getProgress')
    ,
    pickFolder: async () => ipcRenderer.invoke('selflearn:pickWatchPath')
    ,
    listDuplicates: async () => {
      try { return await ipcRenderer.invoke('selflearn:list-duplicates'); } catch (_e) { return { ok: false, error: 'unavailable' }; }
    },
    applyReview: async (opts: any) => {
      try { return await ipcRenderer.invoke('selflearn:apply-review', opts || {}); } catch (_e) { return { ok: false, error: 'unavailable' }; }
    },
    applyGroups: async (removeIndices: number[]) => {
      try { return await ipcRenderer.invoke('selflearn:apply-groups', removeIndices || []); } catch (_e) { return { ok: false, error: 'unavailable' }; }
    },
    runDedupe: async () => {
      try { return await ipcRenderer.invoke('selflearn:run-dedupe'); } catch (_e) { return { ok: false, error: 'unavailable' }; }
    }
  }
  ,
  // Suggestions API
  listSuggestions: async () => ipcRenderer.invoke('selflearn:listSuggestions'),
  ackSuggestion: async (id: string) => ipcRenderer.invoke('selflearn:ackSuggestion', id)
  ,
  // Config + runNow
  getSelflearnConfig: async () => ipcRenderer.invoke('selflearn:getConfig'),
  setSelflearnConfig: async (cfg: any) => ipcRenderer.invoke('selflearn:setConfig', cfg),
  runSelflearnNow: async () => ipcRenderer.invoke('selflearn:runNow')
  ,
  kb: {
    prune: async (threshold: number, daysOld: number) => ipcRenderer.invoke('kb:prune', threshold, daysOld),
    detectStale: async (unusedDays: number) => ipcRenderer.invoke('kb:detectStale', unusedDays)
  },
  // Utility: get actual app userData path on disk
  getUserDataPath: async () => ipcRenderer.invoke('app:getUserDataPath'),
  // Staging / Curator API
  staging: {
    list: async () => {
      try {
        const res = await ipcRenderer.invoke('staging:list');
        if (res && res.ok) return res.items || [];
        return [];
      } catch (_e) { return []; }
    },
    stats: async () => {
      try { return await ipcRenderer.invoke('staging:stats'); } catch (_e) { return { ok: false, error: 'staging IPC unavailable' }; }
    },
    approve: async (id: string, editedAnswer?: string, editor?: string) => {
      try { return await ipcRenderer.invoke('staging:approve', id, editedAnswer, editor); } catch (_e) { return { ok: false, error: 'staging IPC unavailable' }; }
    },
    reject: async (id: string, reason?: string) => {
      try { return await ipcRenderer.invoke('staging:reject', id, reason); } catch (_e) { return { ok: false, error: 'staging IPC unavailable' }; }
    },
    delete: async (id: string) => {
      try { return await ipcRenderer.invoke('staging:delete', id); } catch (_e) { return { ok: false, error: 'staging IPC unavailable' }; }
    },
    bulkTag: async (ids: string[], tag: string) => {
      try { return await ipcRenderer.invoke('staging:bulk-tag', ids || [], tag); } catch (_e) { return { ok: false, error: 'staging IPC unavailable' }; }
    },
    // Run a self-test sequence (list -> approve safe -> reject medium -> delete malicious -> return KB)
    selfTest: async () => {
      const log: any[] = [];
      try {
        const list1 = await ipcRenderer.invoke('staging:list');
        log.push({ step: 'list_before', result: list1 });
        const stats = await ipcRenderer.invoke('staging:stats');
        log.push({ step: 'stats_before', result: stats });

        const approve = await ipcRenderer.invoke('staging:approve', 'test-safe-1');
        log.push({ step: 'approve_test-safe-1', result: approve });
        const list2 = await ipcRenderer.invoke('staging:list');
        log.push({ step: 'list_after_approve', result: list2 });

        const reject = await ipcRenderer.invoke('staging:reject', 'test-medium-1', 'selftest_reject');
        log.push({ step: 'reject_test-medium-1', result: reject });
        const list3 = await ipcRenderer.invoke('staging:list');
        log.push({ step: 'list_after_reject', result: list3 });

        const deleted = await ipcRenderer.invoke('staging:delete', 'test-malicious-1');
        log.push({ step: 'delete_test-malicious-1', result: deleted });
        const list4 = await ipcRenderer.invoke('staging:list');
        log.push({ step: 'list_after_delete', result: list4 });

        const kb = await ipcRenderer.invoke('staging:getKB');
        log.push({ step: 'kb', result: kb });

        return { ok: true, log };
      } catch (err: any) {
        return { ok: false, error: err?.message || String(err), log };
      }
    }
  }
  ,
  // Archives API (session management)
  archives: {
    list: async () => {
      try {
        const res = await ipcRenderer.invoke('session:listArchives');
        if (res && res.ok) return res.archives || [];
        return [];
      } catch (_e) { return []; }
    },
    read: async (path: string) => {
      try { return await ipcRenderer.invoke('session:readArchive', path); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    create: async (entries: any[], name?: string) => {
      try { return await ipcRenderer.invoke('session:createArchive', entries, name); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    promoteSelected: async (entries: any[]) => {
      try { return await ipcRenderer.invoke('session:promoteSelected', entries); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    moveEntryToRejected: async (path: string, index: number) => {
      try { return await ipcRenderer.invoke('session:moveEntryToRejected', path, index); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    deleteEntry: async (path: string, index: number) => {
      try { return await ipcRenderer.invoke('session:deleteArchiveEntry', path, index); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    }
  }
  ,
  // Session alias for legacy UI (archives handlers)
  session: {
    listArchives: async () => {
      try { return await ipcRenderer.invoke('session:listArchives'); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    readArchive: async (path: string) => {
      try { return await ipcRenderer.invoke('session:readArchive', path); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    createArchive: async (entries: any[], name?: string) => {
      try { return await ipcRenderer.invoke('session:createArchive', entries, name); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    promoteSelected: async (entries: any[]) => {
      try { return await ipcRenderer.invoke('session:promoteSelected', entries); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    moveEntryToRejected: async (path: string, index: number) => {
      try { return await ipcRenderer.invoke('session:moveEntryToRejected', path, index); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    },
    deleteArchiveEntry: async (path: string, index: number) => {
      try { return await ipcRenderer.invoke('session:deleteArchiveEntry', path, index); } catch (_e) { return { ok: false, error: 'archives IPC unavailable' }; }
    }
  }
  ,
  personality: {
    list: async () => {
      try { return await ipcRenderer.invoke('personality:list'); } catch (_e) { return { ok: false, error: 'personality IPC unavailable' }; }
    },
    getTone: async () => {
      try { return await ipcRenderer.invoke('personality:get-tone'); } catch (_e) { return { ok: false, error: 'personality IPC unavailable' }; }
    },
    // NOTE: intentionally do NOT expose a setTone API to the renderer.
    // Only the main process (Lumi internals) may change the active tone.
    setTone: async (_toneId: string) => {
      return { ok: false, error: 'not-permitted' };
    }
  }
  ,
  // Sandbox API: programmatic code generation/modification
  sandbox: {
    generate: async (task: string, existingCode?: string, language?: string) => {
      try { return await ipcRenderer.invoke('sandbox:generate', task, existingCode, language); } catch (_e) { return { ok: false, error: 'sandbox IPC unavailable' }; }
    }
  }
});

// Debug marker: helps confirm preload executed and APIs exposed
try {
  // eslint-disable-next-line no-console
  console.log('[preload] lumi API exposed');
} catch (e) { }
