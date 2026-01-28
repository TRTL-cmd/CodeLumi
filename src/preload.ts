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
  logAssistant: async (question: string, answer: string, confidence?: number) => ipcRenderer.invoke('lumi-log-assistant', question, answer, confidence),
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
    listDuplicates: async () => {
      try { return await ipcRenderer.invoke('selflearn:list-duplicates'); } catch (_e) { return { ok: false, error: 'unavailable' }; }
    },
    applyReview: async (opts: any) => {
      try { return await ipcRenderer.invoke('selflearn:apply-review', opts || {}); } catch (_e) { return { ok: false, error: 'unavailable' }; }
    },
    applyGroups: async (removeIndices: number[]) => {
      try { return await ipcRenderer.invoke('selflearn:apply-groups', removeIndices || []); } catch (_e) { return { ok: false, error: 'unavailable' }; }
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
  // Utility: get actual app userData path on disk
  getUserDataPath: async () => ipcRenderer.invoke('app:getUserDataPath'),
  // Staging / Curator API
  staging: {
    list: async () => {
      try { return await ipcRenderer.invoke('staging:list'); } catch (_e) { return { ok: false, error: 'staging IPC unavailable' }; }
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
});

// Debug marker: helps confirm preload executed and APIs exposed
try {
  // eslint-disable-next-line no-console
  console.log('[preload] lumi API exposed');
} catch (e) { }
