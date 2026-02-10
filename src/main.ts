// Copyright (c) 2026 Tortol studios. All rights reserved.
// Contact: Tortolcoin@gmail.com
// Proprietary — do not reproduce, distribute, or sell without permission.

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { think, thinkStream, thinkChat } from './core/brain/index';
import PersonalityEngine from './core/personality/PersonalityEngine';
import MemoryStore from './core/memory/store';
import { SignalProcessor } from './core/learning/processor';
import * as InputValidation from './security/input_validation';
import * as Threat from './security/threat_detection';
import * as Sanitizer from './security/sanitizer';
import { StagingManager } from './core/security/staging-manager';
import DeepLearningAgent from './selflearning/safe-agent-deep';
import KnowledgeProcessor from './core/learning/knowledge-processor';
import PersonalityManager from './core/personality/manager';
import { initializeArchivesHandlers } from './main/archives-handlers';
import { getLumiPaths } from './core/paths';
import { canonicalizeStagingEntry } from './core/security/staging-utils';
import { logger } from './core/lumi-logger';
import { HealthMonitor } from './core/health-monitor';
import { BackupManager } from './core/backup-manager';
import { execFile } from 'child_process';

// In packaged builds, process.cwd() defaults to system32 or wherever the exe launched from.
// Set it to resourcesPath so ALL code that uses process.cwd() resolves to the correct location
// (where extraResources like training/ and userData/ were unpacked by electron-builder).
if (app.isPackaged && process.resourcesPath) {
  try { process.chdir(process.resourcesPath); } catch (_) { /* best effort */ }
}

let sessionStart = new Date();
let healthMonitor: HealthMonitor | null = null;
let backupManager: BackupManager | null = null;

function getHealthMonitor() {
  if (!healthMonitor) healthMonitor = new HealthMonitor();
  return healthMonitor;
}

function getBackupManager() {
  if (!backupManager) backupManager = new BackupManager();
  return backupManager;
}

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

function sendCuratorEvent(type: string, data?: any) {
  try {
    const bw = BrowserWindow.getAllWindows()[0];
    if (bw && bw.webContents && typeof bw.webContents.send === 'function') {
      bw.webContents.send('lumi-learning-event', Object.assign({ type }, data || {}));
    }
  } catch (_e) { }
}

async function writeCrashTelemetry(evt: { type: string; message?: string; stack?: string; source?: string; extra?: any }) {
  try {
    const lumiPaths = getLumiPaths();
    const file = path.join(lumiPaths.projectUserDataDir, 'crash_telemetry.jsonl');
    await fs.mkdir(path.dirname(file), { recursive: true });
    const clean = {
      ts: new Date().toISOString(),
      type: String(evt.type || 'unknown'),
      message: Sanitizer.redactPII(Sanitizer.sanitizeText(String(evt.message || ''), 2000)),
      stack: Sanitizer.redactPII(Sanitizer.sanitizeText(String(evt.stack || ''), 4000)),
      source: String(evt.source || 'unknown'),
      extra: evt.extra || undefined
    };
    await fs.appendFile(file, JSON.stringify(clean) + '\n', 'utf8');
  } catch (_e) { }
}

type PersonalityState = {
  mood?: string;
  intensity?: number;
  rapport?: number;
  refused?: boolean;
  updatedAt?: string;
  consecutiveNegative?: number;
  responseQualityTier?: number; // 0-4 where 4 = best
  recoveryCount?: number;
};

function computeQualityTier(rapport: number): number {
  if (rapport >= 0.0) return 4;   // best: full detail, enthusiastic
  if (rapport >= -0.3) return 3;  // normal: professional, concise
  if (rapport >= -0.6) return 2;  // degraded: brief, no elaboration
  if (rapport >= -0.85) return 1; // minimal: 1-2 sentences max, curt
  return 0;                       // refused: won't respond
}

async function loadPersonalityState(): Promise<PersonalityState> {
  try {
    const p = path.join(getLumiPaths().projectUserDataDir, 'personality_state.json');
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (_e) {
    return { mood: 'neutral', intensity: 0.5, rapport: 0, refused: false };
  }
}

async function savePersonalityState(state: PersonalityState) {
  try {
    const p = path.join(getLumiPaths().projectUserDataDir, 'personality_state.json');
    await fs.mkdir(path.dirname(p), { recursive: true });
    const out = Object.assign({}, state, { updatedAt: new Date().toISOString() });
    await fs.writeFile(p, JSON.stringify(out, null, 2), 'utf8');
  } catch (_e) { }
}

async function ensureDefaultSelflearnFolder(): Promise<string> {
  const lumiPaths = getLumiPaths();
  const folder = path.join(lumiPaths.projectUserDataDir, 'self-learn-input');
  try { await fs.mkdir(folder, { recursive: true }); } catch (_e) { }
  return folder;
}

function isApology(text: string) {
  return /\b(sorry|apolog|my bad|pardon)\b/i.test(text || '');
}

async function updatePersonalityFromText(text: string, source = 'user') {
  try {
    const st = await loadPersonalityState();
    const consNeg = st.consecutiveNegative || 0;
    const engine = new PersonalityEngine({
      mood: st.mood as any,
      intensity: typeof st.intensity === 'number' ? st.intensity : 0.5,
      consecutiveNegative: consNeg,
      responseQualityTier: st.responseQualityTier,
    });
    const score = engine.analyzeSentiment(text || '');

    if (isApology(text)) {
      // Gradual recovery — NOT instant full reset
      st.rapport = Math.min(1, (st.rapport || 0) + 0.25);
      st.consecutiveNegative = Math.max(0, Math.floor(consNeg / 2));
      st.recoveryCount = (st.recoveryCount || 0) + 1;
      // Only unfuse when rapport naturally rises above -0.85
      if ((st.rapport || 0) >= -0.85) st.refused = false;
    } else if (score > 0) {
      st.rapport = Math.min(1, (st.rapport || 0) + 0.1);
      st.consecutiveNegative = 0;
      st.recoveryCount = (st.recoveryCount || 0) + 1;
      // Bonus for sustained good behavior
      if ((st.recoveryCount || 0) >= 3) {
        st.rapport = Math.min(1, (st.rapport || 0) + 0.05);
        st.recoveryCount = 0;
      }
      if ((st.rapport || 0) >= -0.85) st.refused = false;
    } else if (score < 0) {
      // Accelerating degradation for consecutive negativity
      const accel = 1 + (consNeg * 0.1);
      st.rapport = Math.max(-1, (st.rapport || 0) - 0.15 * accel);
      st.consecutiveNegative = consNeg + 1;
      st.recoveryCount = 0;
    }

    engine.feed(text || '', source);
    const stats = engine.getStats();
    st.mood = (stats.mood as any) || st.mood;
    st.intensity = stats.intensity || st.intensity;

    // Compute quality tier from rapport
    st.responseQualityTier = computeQualityTier(st.rapport || 0);
    if (st.responseQualityTier === 0) st.refused = true;

    await savePersonalityState(st);
    return st;
  } catch (_e) {
    return { mood: 'neutral', intensity: 0.5, rapport: 0, refused: false, responseQualityTier: 4 } as PersonalityState;
  }
}

async function applyToneToText(text: string) {
  try {
    const st = await loadPersonalityState();
    const engine = new PersonalityEngine({ mood: st.mood as any, intensity: typeof st.intensity === 'number' ? st.intensity : 0.5 });
    return engine.applyToneToResponse(text || '');
  } catch (_e) { return text; }
}

app.whenReady().then(async () => {
  sessionStart = new Date();
  createWindow();

  // Initialize centralized path system
  const lumiPaths = getLumiPaths();
  (global as any).lumiPaths = lumiPaths;

  // Check Ollama availability and notify user if offline
  try {
    const { ollama } = await import('./core/llm/ollama.js');
    const ollamaAvailable = await ollama.isAvailable();
    if (!ollamaAvailable) {
      console.warn('⚠️  Ollama not detected at localhost:11434');
      console.warn('   AI features will be unavailable until Ollama is running.');
      console.warn('   Install: https://ollama.ai');
      console.warn('   Then run: ollama pull gemma3:4b');
      // Notify renderer
      setTimeout(() => {
        const bw = BrowserWindow.getAllWindows()[0];
        if (bw && bw.webContents) {
          bw.webContents.send('lumi-learning-event', {
            type: 'ollama-offline',
            message: 'Ollama not detected. AI features disabled. Install Ollama and run: ollama pull gemma3:4b',
            timestamp: new Date().toISOString()
          });
        }
      }, 2000);
    } else {
      console.log('✅ Ollama available');
    }
  } catch (e) {
    console.warn('Failed to check Ollama availability:', e);
  }

  // Ensure project-level staging file and archives directory exist
  try {
    await fs.mkdir(lumiPaths.archivesDir, { recursive: true });
    await fs.mkdir(path.dirname(lumiPaths.stagingFile), { recursive: true });
    const fh = await fs.open(lumiPaths.stagingFile, 'a');
    await fh.close();

    // One-time migration: if legacy training/staging.jsonl exists and root staging is empty, copy it.
    try {
      const migrationFlag = path.join(lumiPaths.projectUserDataDir, '.staging_migrated_v2');
      const alreadyMigrated = await fs.access(migrationFlag).then(() => true).catch(() => false);
      if (!alreadyMigrated) {
        const legacyCandidates = [
          path.join(lumiPaths.projectRoot, 'staging.jsonl'),
          path.join(lumiPaths.trainingDir, 'staging.jsonl')
        ];
        const currentRaw = await fs.readFile(lumiPaths.stagingFile, 'utf8').catch(() => '');
        if (!currentRaw.trim()) {
          for (const legacyPath of legacyCandidates) {
            const legacyRaw = await fs.readFile(legacyPath, 'utf8').catch(() => '');
            if (legacyRaw.trim()) {
              await fs.writeFile(lumiPaths.stagingFile, legacyRaw.trim() + '\n', 'utf8');
              console.log('[Startup] Migrated legacy staging to project userData staging.jsonl');
              break;
            }
          }
        }
        await fs.mkdir(lumiPaths.projectUserDataDir, { recursive: true });
        await fs.writeFile(migrationFlag, new Date().toISOString(), 'utf8');
      }
    } catch (_e) { /* ignore migration failures */ }
  } catch (e) {
    console.warn('Failed to ensure staging/archives paths', e);
  }

  // One-time scrubber for staging + KB files
  try {
    const scrubFlag = path.join(lumiPaths.projectUserDataDir, '.pii_scrubbed_v1');
    const alreadyScrubbed = await fs.access(scrubFlag).then(() => true).catch(() => false);
    if (!alreadyScrubbed) {
      // scrub staging.jsonl to canonical format
      try {
        const raw = await fs.readFile(lumiPaths.stagingFile, 'utf8').catch(() => '');
        const lines = raw.split(/\r?\n/).filter(Boolean);
        const out: string[] = [];
        for (const ln of lines) {
          try {
            const obj = JSON.parse(ln);
            const canonical = canonicalizeStagingEntry(obj);
            if (canonical) out.push(JSON.stringify(canonical));
          } catch (_e) { }
        }
        await fs.writeFile(lumiPaths.stagingFile, out.join('\n') + (out.length ? '\n' : ''), 'utf8');
      } catch (_e) { }

      // scrub KB files (userData + training)
      const scrubKbFile = async (filePath: string) => {
        try {
          const rawKb = await fs.readFile(filePath, 'utf8');
          let parsed: any = null;
          try { parsed = JSON.parse(rawKb); } catch (_e) { parsed = null; }
          const root = lumiPaths.projectRoot;
          const scrubEntry = (entry: any) => {
            const copy: any = Object.assign({}, entry || {});
            const scrub = (key: string) => {
              if (typeof copy[key] === 'string') {
                copy[key] = Sanitizer.redactPII(Sanitizer.sanitizeText(copy[key]));
              }
            };
            scrub('q');
            scrub('a');
            scrub('question');
            scrub('answer');
            scrub('input');
            scrub('output');
            scrub('message');
            if (copy.file || copy.path) {
              const p = String(copy.file || copy.path || '');
              copy.file = p.includes(root) ? p.replace(root, '[PROJECT_ROOT]') : path.basename(p);
              delete copy.path;
            }
            return copy;
          };
          if (Array.isArray(parsed)) {
            const cleaned = parsed.map(scrubEntry);
            await fs.writeFile(filePath, JSON.stringify(cleaned, null, 2), 'utf8');
          } else if (parsed && Array.isArray(parsed.qa)) {
            const cleaned = parsed.qa.map(scrubEntry);
            const out = Object.assign({}, parsed, { qa: cleaned });
            await fs.writeFile(filePath, JSON.stringify(out, null, 2), 'utf8');
          }
        } catch (_e) { }
      };

      await scrubKbFile(lumiPaths.userDataKnowledgeBase).catch(() => {});
      await scrubKbFile(lumiPaths.knowledgeBase).catch(() => {});

      await fs.writeFile(scrubFlag, new Date().toISOString(), 'utf8');
    }
  } catch (_e) { }

  // Initialize archives handlers (CRITICAL: was missing!)
  try {
    initializeArchivesHandlers();
    console.log('✅ Archives handlers initialized');
  } catch (e) {
    console.error('❌ Archives handlers init failed:', e);
  }

  // instantiate file-backed memory store in user data
  try {
    (global as any).lumiMemory = new MemoryStore();
  } catch (e) { console.warn('MemoryStore init failed', e); }

  // instantiate KnowledgeProcessor to centralize KB writes from learning
  try {
    (global as any).lumiKnowledgeProcessor = new KnowledgeProcessor();
    console.log('✅ KnowledgeProcessor instantiated');
    try {
      (global as any).lumiKnowledgeProcessor.scheduledCleanup({ threshold: 0.6, daysOld: 30, unusedDays: 45 });
      console.log('✅ KnowledgeProcessor cleanup scheduled');
    } catch (e) { console.warn('KnowledgeProcessor cleanup schedule failed', e); }
  } catch (e) { console.warn('KnowledgeProcessor init failed', e); }

  // Instantiate PersonalityManager to enforce single active tone
  try {
    (global as any).lumiPersonalityManager = new PersonalityManager();
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
        // load persisted selflearn config to decide whether to auto-start
        let slCfg: any = null;
        try { const cfgFile = lumiPaths.configFile; const rawCfg = await fs.readFile(cfgFile, 'utf8'); slCfg = JSON.parse(rawCfg || '{}'); } catch (_e) { slCfg = null; }

          const watchPaths = app.isPackaged
            ? [lumiPaths.projectUserDataDir]
            : [path.join(lumiPaths.projectRoot, 'src'), path.join(lumiPaths.projectRoot, 'training'), path.join(lumiPaths.projectRoot, 'assets')];
          const agent = new DeepLearningAgent({
            userDataPath: lumiPaths.projectUserDataDir,
        // limit watch to safe locations; packaged builds learn from userData artifacts
        watchPaths,
        // deep-learn defaults: slow, thorough, persistent progress
        deepMode: true,
        readFullFile: true,
        deepExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json'],
        excludeDirs: ['node_modules', '.git', 'dist', 'build', 'release', 'vendor', '.venv', 'venv', '__pycache__', 'site-packages', 'Lib', 'backups', 'logs', 'self-learn'],
        progressTracking: true,
        allowExternalPaths: app.isPackaged,
        intervalMs: 60_000,
        ratePerMinute: 6
      });
      (global as any).lumiSelfAgent = agent;
      console.log('✅ DeepLearningAgent instantiated (deep mode)');
      try {
        if (slCfg && Array.isArray(slCfg.watchPaths) && slCfg.watchPaths.length && typeof agent.setWatchPaths === 'function') {
          agent.setWatchPaths(slCfg.watchPaths.map((p: string) => path.resolve(p)));
        }
      } catch (_e) { }
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
    const lumiPaths = getLumiPaths();
    const file = lumiPaths.configFile;
    try {
      const raw = await fs.readFile(file, 'utf8');
      const cfg = JSON.parse(raw || '{}') || {};
      if (!Array.isArray(cfg.watchPaths) || cfg.watchPaths.length === 0) {
        const def = await ensureDefaultSelflearnFolder();
        cfg.watchPaths = [def];
        await fs.writeFile(file, JSON.stringify(cfg, null, 2), 'utf8');
      }
      return { ok: true, config: cfg };
    } catch (e: any) { if (e.code === 'ENOENT') return { ok: true, config: null }; throw e; }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:setConfig', async (_event, cfg: any) => {
  try {
    const lumiPaths = getLumiPaths();
    const file = lumiPaths.configFile;
    if (!cfg) cfg = {};
    if (!Array.isArray(cfg.watchPaths) || cfg.watchPaths.length === 0) {
      const def = await ensureDefaultSelflearnFolder();
      cfg.watchPaths = [def];
    }
    await fs.writeFile(file, JSON.stringify(cfg || {}, null, 2), 'utf8');
    // update agent watchPaths if present
    try {
      const agent: any = (global as any).lumiSelfAgent;
      if (agent && cfg && Array.isArray(cfg.watchPaths) && typeof agent.setWatchPaths === 'function') {
        agent.setWatchPaths(cfg.watchPaths.map((p: string) => path.resolve(p)));
      }
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

ipcMain.handle('selflearn:pickWatchPath', async () => {
  try {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (res.canceled || !res.filePaths || res.filePaths.length === 0) return { ok: false, canceled: true };
    return { ok: true, path: res.filePaths[0] };
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

// KB maintenance IPC
ipcMain.handle('kb:prune', async (_event, threshold: number, daysOld: number) => {
  try {
    const kp: any = (global as any).lumiKnowledgeProcessor || new KnowledgeProcessor();
    return await kp.pruneByConfidence(Number(threshold), Number(daysOld));
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('kb:detectStale', async (_event, unusedDays: number) => {
  try {
    const kp: any = (global as any).lumiKnowledgeProcessor || new KnowledgeProcessor();
    return await kp.detectStaleEntries(Number(unusedDays));
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Telemetry: renderer-reported crashes (local only)
ipcMain.on('telemetry:crash', async (_event, payload: any) => {
  try {
    await writeCrashTelemetry({
      type: String(payload?.type || 'renderer-error'),
      message: String(payload?.message || ''),
      stack: String(payload?.stack || ''),
      source: 'renderer',
      extra: payload?.extra || undefined
    });
  } catch (_e) { }
});

// Support: one-click log export (Windows uses PowerShell script)
ipcMain.handle('support:export-logs', async () => {
  try {
    const lumiPaths = getLumiPaths();
    const script = path.join(lumiPaths.projectRoot, 'scripts', 'collect_logs.ps1');
    if (process.platform !== 'win32') {
      return { ok: false, error: 'unsupported-platform' };
    }
    await fs.access(script);
    return await new Promise((resolve) => {
      execFile('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', script], { cwd: lumiPaths.projectRoot }, (err, stdout, stderr) => {
        if (err) return resolve({ ok: false, error: err.message || String(err), stderr: String(stderr || '') });
        resolve({ ok: true, output: String(stdout || '') });
      });
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

// Suggestions: list and acknowledge
ipcMain.handle('selflearn:listSuggestions', async () => {
  try {
    const items = await StagingManager.listPending();
    return { ok: true, suggestions: items };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

ipcMain.handle('selflearn:ackSuggestion', async (_event, id: string) => {
  try {
    // Acknowledge by moving the entry out of the repo staging file and into
    // a repo ack file. This keeps all suggestion state inside the project.
    const lumiPaths = getLumiPaths();
    const file = lumiPaths.stagingFile;
    const ackFile = path.join(lumiPaths.projectUserDataDir, 'staging_ack.jsonl');
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
            continue; // drop from staging file
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
    const lumiPaths = getLumiPaths();
    const file = path.join(lumiPaths.projectUserDataDir, 'self-learn', 'selflearn_progress.json');
    try {
      const raw = await fs.readFile(file, 'utf8');
      return { ok: true, progress: JSON.parse(raw || '{}') };
    } catch (e: any) { if (e.code === 'ENOENT') return { ok: true, progress: {} }; throw e; }
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// List semantic duplicates generated by dedupe script (reads migration log)
ipcMain.handle('selflearn:list-duplicates', async () => {
  try {
    const repoTraining = getLumiPaths().trainingDir;
    const logFile = path.join(repoTraining, 'lumi_knowledge.dedupe.log.jsonl');
    const kbFile = path.join(repoTraining, 'lumi_knowledge.json');
    let kbArr: any[] = [];
    try {
      const kbRaw = await fs.readFile(kbFile, 'utf8');
      const parsed = JSON.parse(kbRaw || '[]');
      if (Array.isArray(parsed)) kbArr = parsed;
      else if (parsed && Array.isArray(parsed.qa)) kbArr = parsed.qa;
    } catch (_e) { kbArr = []; }
    try {
      const raw = await fs.readFile(logFile, 'utf8');
      const lines = raw.split(/\r?\n/).filter(Boolean).map(l => {
        try { return JSON.parse(l); } catch (_e) { return { raw: l }; }
      });
      for (const ln of lines) {
        const idx = Number(ln && ln.index);
        if (Number.isFinite(idx) && kbArr[idx]) {
          try { ln.entry = kbArr[idx]; } catch (_e) {}
        }
      }
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

// Run semantic KB dedupe (executes scripts/dedupe_kb.js)
ipcMain.handle('selflearn:run-dedupe', async () => {
  try {
    const script = path.join(process.cwd(), 'scripts', 'dedupe_kb.js');
    try { await fs.access(script); } catch (_e) { return { ok: false, error: 'dedupe-script-missing' }; }
    const result = await new Promise<{ ok: boolean; stdout?: string; stderr?: string; error?: string }>((resolve) => {
      execFile(process.execPath, [script], { cwd: process.cwd(), windowsHide: true }, (err, stdout, stderr) => {
        if (err) return resolve({ ok: false, error: err.message, stdout: String(stdout || ''), stderr: String(stderr || '') });
        resolve({ ok: true, stdout: String(stdout || ''), stderr: String(stderr || '') });
      });
    });
    return result;
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
});

// Apply review action: currently supports replacing the training KB with the deduped file (backup preserved)
ipcMain.handle('selflearn:apply-review', async (_event, opts: any) => {
  try {
    const repoTraining = getLumiPaths().trainingDir;
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
    const repoTraining = getLumiPaths().trainingDir;
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
    const dir = getLumiPaths().projectUserDataDir;
    const file = path.join(dir, 'lumi_knowledge.json');
    const root = getLumiPaths().projectRoot;
    const scrubEntry = (entry: any) => {
      const copy: any = Object.assign({}, entry || {});
      const scrub = (key: string) => {
        if (typeof copy[key] === 'string') {
          copy[key] = Sanitizer.redactPII(Sanitizer.sanitizeText(copy[key]));
        }
      };
      scrub('q');
      scrub('a');
      scrub('question');
      scrub('answer');
      scrub('input');
      scrub('output');
      scrub('message');
      if (copy.file || copy.path) {
        const p = String(copy.file || copy.path || '');
        copy.file = p.includes(root) ? p.replace(root, '[PROJECT_ROOT]') : path.basename(p);
        delete copy.path;
      }
      return copy;
    };
    let toWrite: any = data;
    if (Array.isArray(data)) {
      toWrite = data.map(scrubEntry);
    } else if (data && Array.isArray((data as any).qa)) {
      toWrite = Object.assign({}, data, { qa: (data as any).qa.map(scrubEntry) });
    }
    await fs.writeFile(file, JSON.stringify(toWrite, null, 2), 'utf-8');
    // also attempt to write a copy into the project `training/` folder when available
    let trainingPath: string | null = null;
    try {
      const repoTraining = getLumiPaths().trainingDir;
      await fs.mkdir(repoTraining, { recursive: true });
      const trainingFile = path.join(repoTraining, 'lumi_knowledge.json');
      await fs.writeFile(trainingFile, JSON.stringify(toWrite, null, 2), 'utf-8');
      trainingPath = trainingFile;
    } catch (e) {
      // ignore write failures to repo folder
    }
    return { ok: true, path: file, trainingPath };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('lumi-load', async () => {
  try {
    const dir = getLumiPaths().projectUserDataDir;
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
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

// Return the Electron app userData path so renderer can locate files on disk
ipcMain.handle('app:getUserDataPath', async () => {
  try {
    return { ok: true, path: getLumiPaths().projectUserDataDir };
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
ipcMain.handle('lumi-think', async (_event, prompt: string, options: any = {}) => {
  try {
    const st = await updatePersonalityFromText(prompt || '', 'user');
    if ((st.responseQualityTier ?? 4) === 0 && !isApology(prompt || '')) {
      return { ok: true, output: "Let's keep it respectful. I'm happy to help when we're civil." };
    }
    const out = await think(prompt, { ...options, personalityTier: st.responseQualityTier ?? 4 });
    const toned = await applyToneToText(out);
    return { ok: true, output: toned };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

// Brain IPC: chat-style
ipcMain.handle('lumi-chat', async (_event, messages: any[], options: any = {}) => {
  try {
    const lastUser = Array.isArray(messages) ? [...messages].reverse().find(m => m && m.role === 'user') : null;
    const lastText = lastUser && lastUser.content ? String(lastUser.content) : '';
    const st = await updatePersonalityFromText(lastText, 'user');
    if ((st.responseQualityTier ?? 4) === 0 && !isApology(lastText || '')) {
      return { ok: true, output: "Let's keep it respectful. I'm happy to help when we're civil." };
    }
    const out = await thinkChat(messages, { ...options, personalityTier: st.responseQualityTier ?? 4 });
    const toned = await applyToneToText(out);
    return { ok: true, output: toned };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

// Brain IPC: streaming. Renderer should listen for 'lumi-think-chunk' and 'lumi-think-done'.
ipcMain.on('lumi-think-stream-start', async (event, prompt: string, options: any = {}) => {
  const sender = event.sender;
  try {
    const st = await updatePersonalityFromText(prompt || '', 'user');
    if ((st.responseQualityTier ?? 4) === 0 && !isApology(prompt || '')) {
      sender.send('lumi-think-chunk', "Let's keep it respectful. I'm happy to help when we're civil.");
      sender.send('lumi-think-done');
      return;
    }
    await thinkStream(prompt, { ...options, personalityTier: st.responseQualityTier ?? 4 }, (chunk: string) => {
      sender.send('lumi-think-chunk', chunk);
    });
    sender.send('lumi-think-done');
  } catch (e: any) {
    sender.send('lumi-think-error', e?.message || String(e));
  }
});

// Sandbox: Lumi generates/modifies code given a task and existing code context
ipcMain.handle('sandbox:generate', async (_event, task: string, existingCode?: string, language?: string) => {
  try {
    const codeBlock = existingCode ? `\`\`\`${language || ''}\n${(existingCode || '').slice(0, 8000)}\n\`\`\`` : '';
    const prompt = existingCode
      ? `You have the following existing code:\n${codeBlock}\n\nTask: ${task}\n\nProvide ONLY the updated/new code. Do not explain, just output the code inside a code fence.`
      : `Task: ${task}\n\nProvide ONLY the code. Do not explain, just output the code inside a code fence.`;
    const st = await loadPersonalityState();
    const out = await think(prompt, { personalityTier: st.responseQualityTier ?? 4, num_predict: 4000 });
    return { ok: true, code: String(out || '') };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('lumi-log-feedback', async (_event, payload: any) => {
  try {
    const type = payload && payload.type ? String(payload.type) : '';
    const text = payload && payload.text ? String(payload.text) : '';
    if (/up|helpful|positive|good/i.test(type)) {
      await updatePersonalityFromText('thanks', 'feedback');
    } else if (/down|negative|bad|wrong/i.test(type)) {
      await updatePersonalityFromText('bad', 'feedback');
    } else {
      await updatePersonalityFromText(text || '', 'feedback');
    }
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
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
      const codeLikeOnly = s.reasons && s.reasons.length === 1 && s.reasons[0] === 'code-like';
      if (s.suspicious && !codeLikeOnly) {
        // quarantine to staging for manual review
        try {
          const stagingFile = getLumiPaths().stagingFile;
          await fs.mkdir(path.dirname(stagingFile), { recursive: true });
          const qentry = Object.assign({}, entry, { ts: Date.now(), quarantine: true, threat: s });
          try {
            const { appendStagingUnique } = await import('./core/security/staging-utils.js');
            const res = await appendStagingUnique(stagingFile, qentry, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
            if (!res || !res.ok) {
              // skip duplicate write
            }
          } catch (_e) {
            // fallback to simple append
            try {
              const safe = Object.assign({}, qentry);
              if (safe.file) safe.file = path.basename(String(safe.file));
              if (safe.path) safe.path = path.basename(String(safe.path));
              // redact windows absolute-ish fragments in q/a if present
              try { if (typeof safe.q === 'string') safe.q = safe.q.replace(/\\\\[^\s\\/]+\\[^\s]+/g, '[REDACTED_PATH]').replace(/[A-Za-z]:\\[\\\S\s]*/g, '[REDACTED_PATH]').replace(/\/(Users|home)\/[^\s/]+\/[^\s]*/g, '/[REDACTED_PATH]'); } catch (_e2) {}
              try { if (typeof safe.a === 'string') safe.a = safe.a.replace(/\\\\[^\s\\/]+\\[^\s]+/g, '[REDACTED_PATH]').replace(/[A-Za-z]:\\[\\\S\s]*/g, '[REDACTED_PATH]').replace(/\/(Users|home)\/[^\s/]+\/[^\s]*/g, '/[REDACTED_PATH]'); } catch (_e2) {}
              await fs.appendFile(stagingFile, JSON.stringify(safe) + '\n', 'utf8');
            } catch (_e3) { }
          }
          // NOTE: do not write sanitized copies into Electron userData; keep all
          // staging/suggestion state inside the repo `training/` folder so the
          // project owner can review and approve items there.
        } catch (_e) { }
        return { ok: false, quarantined: true, reason: s.reasons.join(',') };
      }
    } catch (_e) { /* don't block on detector failures */ }
    const store: any = (global as any).lumiMemory;
    const debugFile = path.join(getLumiPaths().projectUserDataDir, 'lumi_memory_debug.log');
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
      const file = getLumiPaths().memoryFile;
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
    const lumiPaths = getLumiPaths();
    const kbFile = lumiPaths.knowledgeBase;
    const userKbFile = lumiPaths.userDataKnowledgeBase;

    async function loadKbEntries(filePath: string): Promise<any[]> {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.qa)) return parsed.qa;
        return [];
      } catch (_e) {
        return [];
      }
    }

    const repoEntries = await loadKbEntries(kbFile);
    const userEntries = await loadKbEntries(userKbFile);

    const normalize = (v: any) => {
      try { return String(v || '').replace(/\s+/g, ' ').trim().toLowerCase(); } catch (_e) { return ''; }
    };

    function entryKey(entry: any): string {
      try {
        if (entry && entry.id) return `id:${String(entry.id)}`;
        const q = normalize(entry.q || entry.question || entry.input || '');
        const a = normalize(entry.a || entry.answer || entry.output || '');
        const t = entry.learned || entry.date || entry.createdAt || entry.timestamp || entry.t || '';
        if (q || a) return `qa:${q}||${a}||${t}`;
        if (t) return `t:${String(t)}`;
        return `raw:${JSON.stringify(entry).slice(0, 200)}`;
      } catch (_e) { return `raw:${Math.random()}`; }
    }

    const entryMap = new Map<string, any>();
    for (const e of [...repoEntries, ...userEntries]) {
      const key = entryKey(e);
      if (!entryMap.has(key)) entryMap.set(key, e);
    }
    const kbEntries = Array.from(entryMap.values());
    const totalKB = kbEntries.length;

    // Learning events today and in the last hour from KB timestamps
    let eventsToday = 0;
    let eventsLastHour = 0;
    const nowTs = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const lastHourStart = new Date(nowTs - 60 * 60 * 1000);
    console.log(`[Metrics] Counting events from day start ${startOfDay.toISOString()} and last hour ${lastHourStart.toISOString()}`);

    // Count from knowledge base timestamps
    try {
      for (const entry of kbEntries) {
        const dstr = entry.learned || entry.date || entry.createdAt || entry.timestamp || entry.t;
        let dt = null;
        if (typeof dstr === 'number') dt = new Date(dstr);
        else if (typeof dstr === 'string') dt = new Date(dstr);
        if (dt) {
          if (dt >= startOfDay) eventsToday++;
          if (dt >= lastHourStart) eventsLastHour++;
        }
      }
      console.log(`[Metrics] Found ${eventsToday} events today from KB files`);
      console.log(`[Metrics] Found ${eventsLastHour} events in last hour from KB files`);
    } catch (_e) {
      console.log('[Metrics] Failed to count KB events');
    }

    // Count deep-learned KB entries from today (reported separately)
    let deepLearnedToday = 0;
    try {
      for (const entry of kbEntries) {
        if (entry.source === 'deep-learning' && entry.learned) {
          const dt = new Date(entry.learned);
          if (dt >= startOfDay) {
            deepLearnedToday++;
          }
        }
      }
      console.log(`[Metrics] Found ${deepLearnedToday} deep-learned entries from today`);
    } catch (e: any) {
      console.error(`[Metrics] Error counting deep-learned:`, e.message);
    }

    console.log(`[Metrics] Total events today: ${eventsToday}`);

    const hoursElapsedSinceOpen = Math.max(0, (nowTs - sessionStart.getTime()) / (1000 * 60 * 60));
    const eventsPerHour = eventsLastHour;

    console.log(`[Metrics] Hours since open: ${hoursElapsedSinceOpen.toFixed(2)}, Events/hr: ${eventsPerHour}`);

    return {
      ok: true,
      totalKB,
      eventsToday,
      eventsPerHour,
      deepLearnedToday,
      hoursElapsedSinceOpen,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    console.error(`[Metrics] Handler failed:`, e.message);
    return { ok: false, error: e?.message || String(e) };
  }
});

// Health/backup/logging IPC
ipcMain.handle('lumi:health-check', async () => {
  try {
    const health = await getHealthMonitor().check();
    return { ok: true, health };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('ollama:status', async () => {
  try {
    const { ollama } = await import('./core/llm/ollama.js');
    const available = await ollama.isAvailable();
    return { ok: true, available };
  } catch (e: any) {
    return { ok: false, available: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('lumi:backup-now', async () => {
  try {
    const results = await getBackupManager().backupAll();
    return { ok: true, results };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('lumi:list-backups', async () => {
  try {
    const backups = await getBackupManager().listBackups();
    return { ok: true, backups };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('lumi:get-logs', async (_event, opts: any = {}) => {
  try {
    const limit = Number(opts.limit || 200);
    const errorLimit = Number(opts.errorLimit || 100);
    const logs = await logger.getRecentLogs(limit);
    const errors = await logger.getErrors(errorLimit);
    return { ok: true, logs, errors };
  } catch (e: any) {
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
    const codeLikeOnly = scan.reasons && scan.reasons.length === 1 && scan.reasons[0] === 'code-like';
    if (scan.suspicious && !codeLikeOnly) {
      try {
        const stagingFile = getLumiPaths().stagingFile;
        await fs.mkdir(path.dirname(stagingFile), { recursive: true });
        const staged = { id: `staged_${Date.now()}`, q: question, a: answer, confidence, source: 'assistant', date: new Date().toISOString(), threat: scan };
        const { appendStagingUnique } = await import('./core/security/staging-utils.js');
        const res = await appendStagingUnique(stagingFile, staged, { lookbackLines: 200, windowMs: 2 * 60 * 1000 });
        if (!res || !res.ok) {
          // duplicate detected; do not write redundant sanitized copy
          return { ok: false, quarantined: true, reason: scan.reasons.join(',') };
        }

        // write a sanitized copy into userData/self-learn/staging.jsonl
        // NOTE: intentionally not writing sanitized copies into Electron userData
        // to avoid scattering suggestion artifacts outside the repo. All staging
        // state remains in `staging.jsonl` at project root.

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
      const repoTraining = getLumiPaths().trainingDir;
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
    sendCuratorEvent('staging-updated', { action: 'approve', id });
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
    sendCuratorEvent('staging-updated', { action: 'reject', id });
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
    sendCuratorEvent('staging-updated', { action: 'delete', id });
    return { ok: true };
  } catch (e: any) {
    console.error('[IPC] staging:delete error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle('staging:bulk-tag', async (_event, ids: string[], tag: string) => {
  try {
    const cleanTag = String(tag || '').trim();
    if (!cleanTag) return { ok: false, error: 'tag-empty' };
    const idSet = new Set((ids || []).map(x => String(x)));
    if (!idSet.size) return { ok: false, error: 'no-ids' };
    const all = await StagingManager.loadStaging();
    let updated = 0;
    for (const it of all) {
      if (!idSet.has(String(it.id))) continue;
      const tags = Array.isArray(it.tags) ? it.tags.slice() : [];
      if (!tags.includes(cleanTag)) tags.push(cleanTag);
      it.tags = tags;
      updated += 1;
    }
    if (updated > 0) await StagingManager.saveStaging(all);
    sendCuratorEvent('staging-updated', { action: 'bulk-tag', count: updated, tag: cleanTag });
    return { ok: true, updated };
  } catch (e: any) {
    console.error('[IPC] staging:bulk-tag error', e);
    return { ok: false, error: e?.message || String(e) };
  }
});

// Return canonical training KB (if exists)
ipcMain.handle('staging:getKB', async () => {
  try {
    const repoTraining = getLumiPaths().trainingDir;
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
