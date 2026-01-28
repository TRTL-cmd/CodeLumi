// Copyright (c) 2026 Tortol studios. All rights reserved.
// Contact: Tortolcoin@gmail.com
// Proprietary — do not reproduce, distribute, or sell without permission.

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { think, thinkStream, thinkChat } from './core/brain/index';
import MemoryStore from './core/memory/store';
import { SignalProcessor } from './core/learning/processor';
import * as InputValidation from './security/input_validation';
import * as Threat from './security/threat_detection';
import { StagingManager } from './core/security/staging-manager';
import DeepLearningAgent from './selflearning/safe-agent-deep';
import KnowledgeProcessor from './core/learning/knowledge-processor';
import PersonalityManager from './core/personality/manager';

// Helper to recover common mojibake (UTF-8 bytes decoded as latin1)
function fixEncodingAndNormalize(s: string): string {
  try {
    if (!s || typeof s !== 'string') return s;
    if (/[âÃ]/.test(s)) {
      try { s = Buffer.from(s, 'latin1').toString('utf8'); } catch (_e) { }
    }
    try { s = s.normalize ? s.normalize('NFKC') : s; } catch (_e) { }
    s = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    return s;
  } catch (_e) { return s; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load the production build from the `dist` folder
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Helper to redact paths in logs
function redactLogPath(p: string) {
  try{
    if(!p) return p;
    return String(p).replace(new RegExp(process.cwd().replace(/\\/g,'\\\\'),'g'), '[PROJECT_ROOT]').replace(/[A-Za-z]:\\\\[^"\n\r]*/g,'[REDACTED_PATH]');
  }catch(_){ return p; }
}

app.whenReady().then(async () => {
  createWindow();

  // instantiate file-backed memory store in user data
  try {
    (global as any).lumiMemory = new MemoryStore(app.getPath('userData'));
  } catch (e) { console.warn('MemoryStore init failed', e); }

  // instantiate KnowledgeProcessor to centralize KB writes from learning
  try {
    (global as any).lumiKnowledgeProcessor = new KnowledgeProcessor(app.getPath('userData'));
    console.log('✅ KnowledgeProcessor instantiated');
    console.log('ℹ️ userData path:', redactLogPath(app.getPath('userData')));
  } catch (e) { console.warn('KnowledgeProcessor init failed', e); }

  // Instantiate PersonalityManager to enforce single active tone
  try {
    (global as any).lumiPersonalityManager = new PersonalityManager(app.getPath('userData'));
    console.log('✅ PersonalityManager instantiated');
  } catch (e) { console.warn('PersonalityManager init failed', e); }

  // START: LOUD SIGNALPROCESSOR INITIALIZATION
  try {
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('🚨🚨🚨 INITIALIZING SIGNALPROCESSOR 🚨🚨🚨');
    console.log('═'.repeat(80));

    // attempt to load and instantiate SignalProcessor
    try {
      // Use the imported class if available
      const SPClass = (SignalProcessor as any) || require('./core/learning/processor').SignalProcessor;
      console.log('✅ Step 1: SignalProcessor class loaded');

      (global as any).lumiSignalProcessor = new SPClass();
      console.log('✅ Step 2: Instance created');

      console.log('✅ Step 3: Type check:', typeof (global as any).lumiSignalProcessor);
      console.log('✅ Step 4: Has processSignals:', typeof (global as any).lumiSignalProcessor.processSignals);

      console.log('═'.repeat(80));
      console.log('✅✅✅ SIGNALPROCESSOR READY! ✅✅✅');
      console.log('═'.repeat(80));
      console.log('\n');
    } catch (innerErr) {
      console.log('═'.repeat(80));
      console.log('❌❌❌ SIGNALPROCESSOR FAILED DURING INSTANTIATION! ❌❌❌');
      console.error('Error (instantiation):', innerErr);
      console.log('═'.repeat(80));
    }
  } catch (e) {
    console.log('═'.repeat(80));
    console.log('❌❌❌ SIGNALPROCESSOR INITIALIZATION BLOCK FAILED! ❌❌❌');
    console.error('Error:', e);
    console.log('═'.repeat(80));
    console.log('\n');
  }
  // END: LOUD SIGNALPROCESSOR INITIALIZATION
  // START: Self-learning agent initialization (background scanner)
  try {
    try {
        const progressFile = path.join(app.getPath('userData'), 'selflearn_progress.json');
        // load persisted selflearn config to decide whether to auto-start
        let slCfg: any = null;
        try { const cfgFile = path.join(app.getPath('userData'), 'selflearn_config.json'); const rawCfg = await fs.readFile(cfgFile, 'utf8'); slCfg = JSON.parse(rawCfg || '{}'); } catch (_e) { slCfg = null; }

        const agent = new DeepLearningAgent({
        userDataPath: app.getPath('userData'),
        // limit watch to project code and training assets to avoid scanning virtualenvs
        watchPaths: [path.join(process.cwd(), 'src'), path.join(process.cwd(), 'training'), path.join(process.cwd(), 'assets')],
        // deep-learn defaults: slow, thorough, persistent progress
        deepMode: true,
        readFullFile: true,
        deepExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json'],
        excludeDirs: ['node_modules', '.git', 'dist', 'build', 'release', 'vendor', '.venv', 'venv', '__pycache__', 'site-packages', 'Lib'],
        progressTracking: true,
        intervalMs: 60_000,
        ratePerMinute: 6
      });
      (global as any).lumiSelfAgent = agent;
      console.log('✅ DeepLearningAgent instantiated (deep mode)');
      // auto-start if config explicitly enables it
      try {
        if (slCfg && slCfg.enabled) {
          const bw = BrowserWindow.getAllWindows()[0];
          const sendEvent = (payload: any) => bw && bw.webContents && bw.webContents.send && bw.webContents.send('lumi-learning-event', payload);
          agent.start(sendEvent);
          console.log('ℹ️ DeepLearningAgent auto-started (config.enabled=true)');
        }
      } catch (_e) { }
    } catch (e) { console.warn('DeepLearningAgent init failed', e); }
  } catch (e) { console.warn('DeepLearningAgent outer init failed', e); }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Self-learning IPC controls
ipcMain.handle('selflearn:start', async () => {
  try {
    const agent: any = (global as any).lumiSelfAgent;
    if (!agent) return { ok: false, error: 'agent-not-initialized' };
    const bw = BrowserWindow.getAllWindows()[0];
    const sendEvent = (payload: any) => bw && bw.webContents && bw.webContents.send && bw.webContents.send('lumi-learning-event', payload);
    return agent.start(sendEvent);
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:stop', async () => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return agent.stop(); } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:pause', async () => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return agent.pause(); } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:resume', async () => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return agent.resume(); } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:setRate', async (_event, rpm: number) => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return agent.setRatePerMinute(Number(rpm) || 60); } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:undo', async (_event, count = 1) => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return agent.undo(Number(count) || 1); } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:reset', async () => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return agent.reset(); } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:status', async () => {
  try { const agent: any = (global as any).lumiSelfAgent; if (!agent) return { ok: false, error: 'agent-not-initialized' }; return { ok: true, status: agent.status() }; } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:getConfig', async () => {
  try {
    const dir = app.getPath('userData');
    const file = path.join(dir, 'selflearn_config.json');
    try {
      const raw = await fs.readFile(file, 'utf8');
      return { ok: true, config: JSON.parse(raw) };
    } catch (e: any) { if (e.code === 'ENOENT') return { ok: true, config: null }; throw e; }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:setConfig', async (_event, cfg: any) => {
  try {
    const dir = app.getPath('userData');
    const file = path.join(dir, 'selflearn_config.json');
    await fs.writeFile(file, JSON.stringify(cfg || {}, null, 2), 'utf8');
    // update agent watchPaths if present
    try {
      const agent: any = (global as any).lumiSelfAgent;
      if (agent && cfg && Array.isArray(cfg.watchPaths)) agent.watchPaths = cfg.watchPaths.map((p: string) => path.resolve(p));
      // start/stop based on enabled flag
      if (agent && typeof cfg.enabled === 'boolean') {
        const bw = BrowserWindow.getAllWindows()[0];
        const sendEvent = (payload: any) => bw && bw.webContents && bw.webContents.send && bw.webContents.send('lumi-learning-event', payload);
        if (cfg.enabled) {
          try {
            if (typeof agent.start === 'function') {
              // await in case start returns a Promise so we can be sure agent is running
              // before returning to the renderer. start should be idempotent.
              await agent.start(sendEvent);
              try { sendEvent({ type: 'selflearn:started', ts: new Date().toISOString() }); } catch (_) { }
            }
          } catch (err) {
            console.warn('selflearn: start failed', err);
          }
        } else {
          try {
            if (typeof agent.stop === 'function') {
              // await to ensure the agent has stopped synchronously
              await agent.stop();
              try { sendEvent({ type: 'selflearn:stopped', ts: new Date().toISOString() }); } catch (_) { }
            }
          } catch (err) {
            console.warn('selflearn: stop failed', err);
          }
        }
      }
    } catch (_e) {}
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:runNow', async () => {
  try {
    const agent: any = (global as any).lumiSelfAgent;
    if (!agent) return { ok: false, error: 'agent-not-initialized' };
    const bw = BrowserWindow.getAllWindows()[0];
    const sendEvent = (payload: any) => bw && bw.webContents && bw.webContents.send && bw.webContents.send('lumi-learning-event', payload);
    await agent.tick(sendEvent);
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Suggestions: list and acknowledge
ipcMain.handle('selflearn:listSuggestions', async () => {
  try {
    const dir = app.getPath('userData');
    const file = path.join(dir, 'self-learn', 'selflearn_suggestions.jsonl');
    try {
      const raw = await fs.readFile(file, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_e) { return null; } }).filter(Boolean);
      return { ok: true, suggestions: lines };
    } catch (e: any) {
      if (e.code === 'ENOENT') return { ok: true, suggestions: [] };
      throw e;
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:ackSuggestion', async (_event, id: string) => {
  try {
    const dir = app.getPath('userData');
    const file = path.join(dir, 'self-learn', 'selflearn_suggestions.jsonl');
    const ackFile = path.join(dir, 'self-learn', 'selflearn_suggestions_ack.jsonl');
    try {
      const raw = await fs.readFile(file, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean);
      let found = false;
      const outLines: string[] = [];
      for (const ln of lines) {
        try {
          const obj = JSON.parse(ln);
          if (String(obj.id) === String(id)) {
            found = true;
            obj.acknowledgedAt = new Date().toISOString();
            await fs.appendFile(ackFile, JSON.stringify(obj) + '\n', 'utf8');
            continue; // drop from suggestions file
          }
        } catch (_e) { }
        outLines.push(ln);
      }
      await fs.writeFile(file, outLines.join('\n') + (outLines.length ? '\n' : ''), 'utf8');
      return { ok: true, acknowledged: found };
    } catch (e: any) {
      if (e.code === 'ENOENT') return { ok: false, error: 'no-suggestions' };
      throw e;
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Progress API for deep agent
ipcMain.handle('selflearn:getProgress', async () => {
  try {
    const agent: any = (global as any).lumiSelfAgent;
    if (!agent) return { ok: false, error: 'agent-not-initialized' };
    if (typeof agent.getProgress === 'function') return await agent.getProgress();
    // fallback: read progress file directly
    const dir = app.getPath('userData');
    const file = path.join(dir, 'self-learn', 'selflearn_progress.json');
    try {
      const raw = await fs.readFile(file, 'utf8');
      return { ok: true, progress: JSON.parse(raw || '{}') };
    } catch (e: any) { if (e.code === 'ENOENT') return { ok: true, progress: {} }; throw e; }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// List semantic duplicates generated by dedupe script (reads migration log)
ipcMain.handle('selflearn:list-duplicates', async () => {
  try {
    const repoTraining = path.join(process.cwd(), 'training');
    const logFile = path.join(repoTraining, 'lumi_knowledge.dedupe.log.jsonl');
    try {
      const raw = await fs.readFile(logFile, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean).map(l => {
        try { return JSON.parse(l); } catch (_e) { return { raw: l }; }
      });
      // Group by similar_to where available
      const groups: Record<string, any[]> = {};
      for (const ln of lines) {
        const key = ln.similar_to || (ln.entry && ln.entry.q) || 'ungrouped';
        groups[String(key)] = groups[String(key)] || [];
        groups[String(key)].push(ln);
      }
      return { ok: true, groups, raw: lines };
    } catch (e: any) {
      if (e.code === 'ENOENT') return { ok: true, groups: {}, raw: [] };
      throw e;
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Apply review action: currently supports replacing the training KB with the deduped file (backup preserved)
ipcMain.handle('selflearn:apply-review', async (_event, opts: any) => {
  try {
    const repoTraining = path.join(process.cwd(), 'training');
    const dedupFile = path.join(repoTraining, 'lumi_knowledge.deduped.json');
    const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
    // ensure dedup file exists
    try {
      await fs.access(dedupFile);
    } catch (e: any) { return { ok: false, error: 'no-dedup-file' }; }

    // create backup of existing KB
    try {
      const bak = path.join(repoTraining, `lumi_knowledge.backup.${Date.now()}.json`);
      try { await fs.copyFile(kbFile, bak); } catch (_e) { /* ok if missing */ }
    } catch (_e) { }

    if (opts && opts.dryRun) {
      return { ok: true, message: 'dry-run', dedupFile };
    }

    // Overwrite canonical KB with deduped file
    const dedupRaw = await fs.readFile(dedupFile, 'utf8');
    await fs.writeFile(kbFile, dedupRaw, 'utf8');

    // Emit progress event to renderer
    try {
      const bw = BrowserWindow.getAllWindows()[0];
      if (bw && bw.webContents && typeof bw.webContents.send === 'function') bw.webContents.send('selflearn:batch-progress', { step: 'applied', ts: Date.now() });
    } catch (_e) { }

    return { ok: true, replaced: kbFile };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Apply group-based review decisions: remove entries by index (from dedupe log groups)
ipcMain.handle('selflearn:apply-groups', async (_event, removeIndices: number[]) => {
  try {
    const repoTraining = path.join(process.cwd(), 'training');
    const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
    // read existing KB
    let raw: string;
    try { raw = await fs.readFile(kbFile, 'utf8'); } catch (e: any) { return { ok: false, error: 'kb-missing' }; }
    let kb: any;
    try { kb = JSON.parse(raw); if(!Array.isArray(kb)) kb = (kb && kb.qa) ? kb.qa : []; } catch (_e) { return { ok: false, error: 'kb-parse-failed' }; }

    // normalize indices to numbers and unique
    const toRemove = Array.isArray(removeIndices) ? Array.from(new Set(removeIndices.filter(n => Number.isFinite(n)).map(n => Number(n)))) : [];
    if (toRemove.length === 0) return { ok: true, message: 'nothing-to-remove' };

    // create backup
    try { const bak = path.join(repoTraining, `lumi_knowledge.backup.${Date.now()}.json`); await fs.copyFile(kbFile, bak); } catch (_e) { }

    // filter out indices
    // indices refer to original positions (0-based) used by dedupe script
    const kept: any[] = [];
    for (let i = 0; i < kb.length; i++) {
      if (toRemove.indexOf(i) !== -1) continue; // drop
      kept.push(kb[i]);
    }

    // write new KB
    await fs.writeFile(kbFile, JSON.stringify(kept, null, 2), 'utf8');

    // emit progress
    try { const bw = BrowserWindow.getAllWindows()[0]; if (bw && bw.webContents && typeof bw.webContents.send === 'function') bw.webContents.send('selflearn:batch-progress', { step: 'applied-groups', removed: toRemove.length, ts: Date.now() }); } catch (_e) {}

    return { ok: true, removed: toRemove.length, kept: kept.length, file: kbFile };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for persistence
ipcMain.handle('lumi-save', async (event, data) => {
  try {
    const dir = app.getPath('userData');
    const file = path.join(dir, 'lumi_knowledge.json');
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
    // also attempt to write a copy into the project `training/` folder when available
    let trainingPath: string | null = null;
    try {
      const repoTraining = path.join(process.cwd(), 'training');
      await fs.mkdir(repoTraining, { recursive: true });
      const trainingFile = path.join(repoTraining, 'lumi_knowledge.json');
      await fs.writeFile(trainingFile, JSON.stringify(data, null, 2), 'utf-8');
      trainingPath = trainingFile;
    } catch (e) {
      // ignore write failures to repo folder
    }
    return { ok: true, path: file, trainingPath };
  } catch (e) {
    return { ok: false, error: e?.message };
  }
});

ipcMain.handle('lumi-load', async () => {
  try {
    const dir = app.getPath('userData');
    const file = path.join(dir, 'lumi_knowledge.json');
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
});

ipcMain.handle('lumi-shutdown', async () => {
  try {
    app.quit();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message };
  }
});

// Return the Electron app userData path so renderer can locate files on disk
ipcMain.handle('app:getUserDataPath', async () => {
  try {
    return { ok: true, path: app.getPath('userData') };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Personality IPC: list, get current, set current
ipcMain.handle('personality:list', async () => {
  try {
    const mgr: any = (global as any).lumiPersonalityManager;
    if (!mgr) return { ok: false, error: 'personality-manager-not-initialized' };
    const tones = await mgr.listTones();
    return { ok: true, tones };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('personality:get-tone', async () => {
  try {
    const mgr: any = (global as any).lumiPersonalityManager;
    if (!mgr) return { ok: false, error: 'personality-manager-not-initialized' };
    const tone = await mgr.getCurrentTone();
    return { ok: true, tone };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// NOTE: Do NOT expose a set-tone IPC to renderer processes.
// Only internal Lumi code (in main) should call `lumiPersonalityManager.setCurrentTone(...)`.
ipcMain.handle('personality:set-tone', async () => {
  return { ok: false, error: 'not-permitted' };
});

// Brain IPC: simple invoke for single-response generation
ipcMain.handle('lumi-think', async (_event, prompt: string, options = {}) => {
  try {
    const out = await think(prompt, options);
    return { ok: true, output: out };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

// Brain IPC: chat-style
ipcMain.handle('lumi-chat', async (_event, messages: any[], options = {}) => {
  try {
    const out = await thinkChat(messages, options);
    return { ok: true, output: out };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

// Brain IPC: streaming. Renderer should listen for 'lumi-think-chunk' and 'lumi-think-done'.
ipcMain.on('lumi-think-stream-start', async (event, prompt: string, options = {}) => {
  const sender = event.sender;
  try {
    await thinkStream(prompt, options, (chunk: string) => {
      sender.send('lumi-think-chunk', chunk);
    });
    sender.send('lumi-think-done');
  } catch (e: any) {
    sender.send('lumi-think-error', e?.message || String(e));
  }
});

// Memory IPC handlers (file-backed store)
ipcMain.handle('memory-add', async (_event, entry: any) => {
  try {
    // validate memory entry payload
    const v = InputValidation.validateMemoryEntry(entry);
    if (!v.ok) return { ok: false, error: `validation:${v.error}` };
    // run threat detection
    try {
      const s = Threat.scanMemoryEntry(entry);
      if (s.suspicious) {
        // quarantine to staging for manual review
        try {
          const repoTraining = path.join(process.cwd(), 'training');
          await fs.mkdir(repoTraining, { recursive: true });
          const stagingFile = path.join(repoTraining, 'staging.jsonl');
          const qentry = Object.assign({}, entry, { ts: Date.now(), quarantine: true, threat: s });
          try {
            const { appendStagingUnique } = await import('./core/security/staging-utils.js');
            const res = await appendStagingUnique(stagingFile, qentry, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
            if (!res || !res.ok) {
              // skip duplicate write
            }
          } catch (_e) {
            // fallback to simple append
            await fs.appendFile(stagingFile, JSON.stringify(qentry) + '\n', 'utf8');
          }
          // also write a sanitized copy into userData/self-learn/staging.jsonl for visibility
          try {
            const selfDir = path.join(app.getPath('userData'), 'self-learn');
            await fs.mkdir(selfDir, { recursive: true });
            const sanitizeStr = JSON.stringify(qentry).replace(new RegExp(process.cwd().replace(/\\/g,'\\\\'),'g'), '[PROJECT_ROOT]').replace(/[A-Za-z]:\\\\[^"\n\r]*/g, '[REDACTED_PATH]');
            const selfStaging = path.join(selfDir, 'staging.jsonl');
            await fs.appendFile(selfStaging, sanitizeStr + '\n', 'utf8');
          } catch (_e) { }
        } catch (_e) { }
        return { ok: false, quarantined: true, reason: s.reasons.join(',') };
      }
    } catch (_e) { /* don't block on detector failures */ }
    const store: any = (global as any).lumiMemory;
    const debugFile = path.join(app.getPath('userData'), 'lumi_memory_debug.log');
    // write a debug record so we can observe IPC calls even if store fails
    try {
      await fs.appendFile(debugFile, JSON.stringify({ ts: Date.now(), entry }) + '\n', 'utf8');
    } catch (_e) { /* ignore debug write failures */ }

    if (store && typeof store.add === 'function') {
      try {
        const saved = await store.add(entry);
        // Previously signal processing was triggered here; we've removed it to avoid duplicate
        // processing paths. `lumi-log-assistant` is the canonical path that should route
        // candidate QA into the `SignalProcessor` (so avoid re-sending signals from memory-add).
        return { ok: true, entry: saved };
      } catch (e) {
        // fallthrough to safe append below
      }
    }

    // Safe fallback: directly append to lumi_memory.jsonl in userData
    try {
      const file = path.join(app.getPath('userData'), 'lumi_memory.jsonl');
      const e = Object.assign({}, entry, { t: entry.t || Date.now() });
      await fs.appendFile(file, JSON.stringify(e) + '\n', 'utf8');
      // Note: signal processing removed here to avoid duplicate processor invocations.
      return { ok: true, entry: e, fallback: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('memory-query', async (_event, q: string, limit = 50) => {
  try {
    // validate query params
    const qv = InputValidation.validateQuery(q);
    if (!qv.ok) return { ok: false, error: `validation:${qv.error}` };
    const lv = InputValidation.validateLimit(limit);
    if (!lv.ok) return { ok: false, error: `validation:${lv.error}` };
    const store: any = (global as any).lumiMemory;
    if (!store) return { ok: false, error: 'memory-not-initialized' };
    const results = await store.query(q, limit);
    return { ok: true, results };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('memory-export', async () => {
  try {
    const store: any = (global as any).lumiMemory;
    if (!store) return { ok: false, error: 'memory-not-initialized' };
    const results = await store.export();
    return { ok: true, results };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Metrics endpoint: counts KB entries and learning events
ipcMain.handle('lumi-metrics', async () => {
  try {
    const repoTraining = path.join(process.cwd(), 'training');
    const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
    const auditFile = path.join(repoTraining, 'training.jsonl');
    const userKbFile = path.join(app.getPath('userData'), 'lumi_knowledge.json');

    // Total KB entries (prefer repo training KB, fallback to userData file)
    let totalKB = 0;
    let kbEntries: any[] = [];
    try {
      const raw = await fs.readFile(kbFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) { kbEntries = parsed; totalKB = parsed.length; }
    } catch (_e) {
      try {
        const raw2 = await fs.readFile(userKbFile, 'utf8');
        const parsed2 = JSON.parse(raw2);
        if (parsed2 && Array.isArray(parsed2.qa)) { kbEntries = parsed2.qa; totalKB = parsed2.qa.length; }
        else if (Array.isArray(parsed2)) { kbEntries = parsed2; totalKB = parsed2.length; }
      } catch (_2) { totalKB = 0; kbEntries = []; }
    }

    // Learning events today: count audit lines + deep-learned KB entries
    let eventsToday = 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    console.log(`[Metrics] Counting events from ${start.toISOString()}`);

    // Count from training.jsonl audit file
    try {
      const lines = (await fs.readFile(auditFile, 'utf8')).split(/\r?\n/).filter(Boolean);
      for (const ln of lines) {
        try {
          const obj = JSON.parse(ln);
          const dstr = obj.date || obj.t || obj.createdAt || obj.timestamp;
          let dt = null;
          if (typeof dstr === 'number') dt = new Date(dstr);
          else if (typeof dstr === 'string') dt = new Date(dstr);
          if (dt && dt >= start) eventsToday++;
        } catch (_e) { /* ignore parse errors */ }
      }
      console.log(`[Metrics] Found ${eventsToday} events from training.jsonl`);
    } catch (_e) {
      console.log(`[Metrics] No training.jsonl file found`);
    }

    // Count deep-learned KB entries from today
    let deepLearnedToday = 0;
    try {
      for (const entry of kbEntries) {
        if (entry.source === 'deep-learning' && entry.learned) {
          const dt = new Date(entry.learned);
          if (dt >= start) {
            eventsToday++;
            deepLearnedToday++;
          }
        }
      }
      console.log(`[Metrics] Found ${deepLearnedToday} deep-learned entries from today`);
    } catch (e: any) {
      console.error(`[Metrics] Error counting deep-learned:`, e.message);
    }

    console.log(`[Metrics] Total events today: ${eventsToday}`);

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const hoursElapsed = Math.max(1, (now - startOfDay.getTime()) / (1000 * 60 * 60));
    const eventsPerHour = +(eventsToday / hoursElapsed).toFixed(2);

    console.log(`[Metrics] Hours elapsed: ${hoursElapsed.toFixed(2)}, Events/hr: ${eventsPerHour}`);

    return {
      ok: true,
      totalKB,
      eventsToday,
      eventsPerHour,
      deepLearnedToday,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    console.error(`[Metrics] Handler failed:`, e.message);
    return { ok: false, error: e?.message || String(e) };
  }
});

// Log assistant answers as candidate entries (auto-capture)
ipcMain.handle('lumi-log-assistant', async (_event, question: string, answer: string, confidence = 0.95) => {
  console.log('\n');
  console.log('-'.repeat(80));
  console.log('📞 IPC: lumi-log-assistant CALLED');
  try { console.log('  Question:', String(question || '').substring(0, 120)); } catch(_){ }
  console.log('  Confidence:', confidence);
  try {
    const sp = (global as any).lumiSignalProcessor;
    console.log('  Processor exists:', sp ? 'YES ✅' : 'NO ❌');
    console.log('  Has processSignals:', sp ? (typeof sp.processSignals) : 'N/A');
  } catch (_){ console.log('  Processor lookup failed'); }
  console.log('-'.repeat(80));
  console.log('\n');

  try {
    // validate QA payload
    const v = InputValidation.validateQA(question, answer, confidence);
    if (!v.ok) return { ok: false, error: `validation:${v.error}` };

    // threat detection: if suspicious, quarantine to staging instead of merging
    const scan = Threat.scanQA(question, answer);
    if (scan.suspicious) {
      try {
        const repoTrainingDir = path.join(process.cwd(), 'training');
        await fs.mkdir(repoTrainingDir, { recursive: true });
        const stagingFile = path.join(repoTrainingDir, 'staging.jsonl');
        const staged = { id: `staged_${Date.now()}`, q: question, a: answer, confidence, source: 'assistant', date: new Date().toISOString(), threat: scan };
        const { appendStagingUnique } = await import('./core/security/staging-utils.js');
        const res = await appendStagingUnique(stagingFile, staged, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
        if (!res || !res.ok) {
          // duplicate detected; do not write redundant sanitized copy
          return { ok: false, quarantined: true, reason: scan.reasons.join(',') };
        }

        // write a sanitized copy into userData/self-learn/staging.jsonl
        try {
          const selfDir = path.join(app.getPath('userData'), 'self-learn');
          await fs.mkdir(selfDir, { recursive: true });
          const sanitizeStr = JSON.stringify(staged)
            .replace(new RegExp(process.cwd().replace(/\\/g,'\\\\'),'g'), '[PROJECT_ROOT]')
            .replace(/[A-Za-z]:\\\\[^\"\n\r]*/g, '[REDACTED_PATH]');
          const selfStaging = path.join(selfDir, 'staging.jsonl');
          await fs.appendFile(selfStaging, sanitizeStr + '\n', 'utf8');
        } catch (_e) { }

        return { ok: false, quarantined: true, reason: scan.reasons.join(',') };
      } catch (e: any) {
        console.error('[LogAssistant] staging write failed:', e);
        return { ok: false, error: e?.message || String(e) };
      }
    }

    // not suspicious — create entry and append to audit
    const entry: any = {
      id: `entry_${Date.now()}`,
      question,
      answer,
      confidence: confidence || 0.9,
      source: 'assistant',
      date: new Date().toISOString()
    };

    // append to audit
    try {
      const repoTraining = path.join(process.cwd(), 'training');
      await fs.mkdir(repoTraining, { recursive: true });
      const auditFile = path.join(repoTraining, 'training.jsonl');
      await fs.appendFile(auditFile, JSON.stringify(entry) + '\n', 'utf8');
      console.log('[LogAssistant] audit appended:', entry.id);
    } catch (e) { console.warn('audit append failed', e); }

    // Route assistant log through SignalProcessor so threat-detection,
    // validation, auto-merge/quarantine, and validation logging are applied.
    try {
      const sp: any = (global as any).lumiSignalProcessor;
      if (sp && typeof sp.processSignals === 'function') {
        const signals: any[] = [{ type: 'positive_feedback', confidence: confidence || 0.92, payload: { question, answer } }];
        try { console.log('[LogAssistant] routing to SignalProcessor:', JSON.stringify(signals)); } catch(_){ }
        // use processSignals to perform threat scan, validation, and KB updates
        await sp.processSignals(signals, question, answer);
        return { ok: true, entry, routed: true };
      }
      console.warn('[LogAssistant] SignalProcessor not available');
      return { ok: false, error: 'processor-not-available' };
    } catch (e) {
      console.error('[LogAssistant] SignalProcessor routing failed:', e);
      return { ok: false, error: String(e) };
    }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Staging / Curator IPC handlers
ipcMain.handle('staging:list', async () => {
  try {
    const items = await StagingManager.listPending();
    return { ok: true, items };
  } catch (e: any) {
    console.error('[IPC] staging:list error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('staging:stats', async () => {
  try {
    const all = await StagingManager.loadStaging();
    const total = all.length;
    const quarantined = all.filter(i => !i.status || i.status === 'quarantined').length;
    const approved = all.filter(i => i.status === 'approved').length;
    const rejected = all.filter(i => i.status === 'rejected').length;
    return { ok: true, total, quarantined, approved, rejected };
  } catch (e: any) {
    console.error('[IPC] staging:stats error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('staging:approve', async (_event, id: string, editedAnswer?: string, editor?: string) => {
  try {
    // if editedAnswer supplied, persist edit before approving
    if (editedAnswer) {
      const all = await StagingManager.loadStaging();
      const idx = all.findIndex(i => String(i.id) === String(id));
      if (idx !== -1) {
        all[idx].a = editedAnswer;
        await StagingManager.saveStaging(all);
      }
    }
    const approved = await StagingManager.approve(id, editor ? { editor } : undefined);
    if (!approved) return { ok: false, error: 'not-found' };
    return { ok: true, item: approved };
  } catch (e: any) {
    console.error('[IPC] staging:approve error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('staging:reject', async (_event, id: string, reason?: string) => {
  try {
    const rejected = await StagingManager.reject(id, reason);
    if (!rejected) return { ok: false, error: 'not-found' };
    return { ok: true, item: rejected };
  } catch (e: any) {
    console.error('[IPC] staging:reject error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('staging:delete', async (_event, id: string) => {
  try {
    const all = await StagingManager.loadStaging();
    const idx = all.findIndex(i => String(i.id) === String(id));
    if (idx === -1) return { ok: false, error: 'not-found' };
    all.splice(idx, 1);
    await StagingManager.saveStaging(all);
    return { ok: true };
  } catch (e: any) {
    console.error('[IPC] staging:delete error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

// Return canonical training KB (if exists)
ipcMain.handle('staging:getKB', async () => {
  try {
    const repoTraining = path.join(process.cwd(), 'training');
    const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
    try {
      const raw = await fs.readFile(kbFile, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      return { ok: true, kb: parsed };
    } catch (e: any) {
      if (e.code === 'ENOENT') return { ok: true, kb: [] };
      throw e;
    }
  } catch (e: any) {
    console.error('[IPC] staging:getKB error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});
