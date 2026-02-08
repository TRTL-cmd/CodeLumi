// ════════════════════════════════════════════════════════════════
// LUMI PATH CONFIGURATION
// ════════════════════════════════════════════════════════════════
// Centralized path management for Lumi
//
// PROJECT DATA (local; repo in dev, AppData in packaged builds):
//   - Knowledge base (training/lumi_knowledge.json)
//   - Suggestions (userData/staging.jsonl)
//   - Archives (userData/sessions/)
//   - Backups (userData/backups/)
//   - Training data (training/)
//
// USER DATA (private, NOT in Git):
//   - Conversations (lumi_memory.jsonl)
//   - User settings (selflearn_config.json)
//   - Electron preferences
// ════════════════════════════════════════════════════════════════

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class LumiPaths {
  // ═══════════════════════════════════════════════════════════
  // BASE PATHS
  // ═══════════════════════════════════════════════════════════

  /** Project root - where your code lives (Git tracked) */
  public readonly projectRoot: string;

  /** User data - Electron's AppData location (private, NOT tracked) */
  public readonly appDataPath: string;

  // ═══════════════════════════════════════════════════════════
  // PROJECT DATA (in project root, Git tracked)
  // ═══════════════════════════════════════════════════════════

  /** training/ directory */
  public readonly trainingDir: string;

  /** training/lumi_knowledge.json - main knowledge base */
  public readonly knowledgeBase: string;

  /** training/training.jsonl - training audit log */
  public readonly trainingLog: string;

  /** staging.jsonl - suggestions/staged entries (project root userData) */
  public readonly stagingFile: string;

  /** sessions/ - session archives (project userData) */
  public readonly archivesDir: string;

  /** userData/lumi_knowledge.json - project user data KB */
  public readonly userDataKnowledgeBase: string;

  /** userData/ - project-level user data (backups, journals) */
  public readonly projectUserDataDir: string;

  /** userData/backups/ - code backups */
  public readonly backupsDir: string;

  /** userData/action_journal.jsonl - executor logs */
  public readonly journalFile: string;

  // ═══════════════════════════════════════════════════════════
  // USER DATA (in AppData, private, NOT tracked)
  // ═══════════════════════════════════════════════════════════

  /** lumi_memory.jsonl - private conversations */
  public readonly memoryFile: string;

  /** selflearn_config.json - user settings */
  public readonly configFile: string;

  /** self-learn/ - self-learning data (project userData) */
  public readonly selfLearnDir: string;

  /** selflearn_progress.json - progress tracking */
  public readonly progressFile: string;

  constructor() {
    // In packaged builds, process.cwd() is unreliable (e.g. C:\WINDOWS\system32).
    // Keep projectRoot for locating app resources, but store mutable data in AppData.
    // In dev mode, use process.cwd() as before.
    this.projectRoot = app.isPackaged ? process.resourcesPath : process.cwd();

    // User data = Electron AppData (for private stuff)
    this.appDataPath = app.getPath('userData');

    const dataRoot = app.isPackaged ? this.appDataPath : this.projectRoot;

    // ═══════════════════════════════════════════════════════════
    // PROJECT DATA PATHS (local, writable)
    // ═══════════════════════════════════════════════════════════

    // Training directory
    this.trainingDir = path.join(dataRoot, 'training');
    this.knowledgeBase = path.join(this.trainingDir, 'lumi_knowledge.json');
    this.trainingLog = path.join(this.trainingDir, 'training.jsonl');

    // Project-level userData (backups, journals)
    this.projectUserDataDir = path.join(dataRoot, 'userData');
    this.backupsDir = path.join(this.projectUserDataDir, 'backups');
    this.journalFile = path.join(this.projectUserDataDir, 'action_journal.jsonl');

    // Staging (suggestions) lives in project userData
    this.stagingFile = path.join(this.projectUserDataDir, 'staging.jsonl');

    // Archives (session history) live in project userData/sessions
    this.archivesDir = path.join(this.projectUserDataDir, 'sessions');

    // Project userData KB (for local learning state)
    this.userDataKnowledgeBase = path.join(this.projectUserDataDir, 'lumi_knowledge.json');

    // ═══════════════════════════════════════════════════════════
    // USER DATA PATHS (AppData, private)
    // ═══════════════════════════════════════════════════════════

    this.memoryFile = path.join(this.appDataPath, 'lumi_memory.jsonl');
    this.configFile = path.join(this.appDataPath, 'selflearn_config.json');
    this.selfLearnDir = path.join(this.projectUserDataDir, 'self-learn');
    this.progressFile = path.join(this.projectUserDataDir, 'self-learn', 'selflearn_progress.json');

    // Create necessary directories
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [
      // Project directories
      this.trainingDir,
      this.archivesDir,
      this.projectUserDataDir,
      this.backupsDir,
      path.dirname(this.journalFile),
      // Project userData directories
      this.selfLearnDir,
    ];

    for (const dir of dirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`✅ Created: ${this.redact(dir)}`);
        }
      } catch (e: any) {
        console.warn(`⚠️  Failed to create ${this.redact(dir)}:`, e.message);
      }
    }
  }

  /** Redact paths for logging (security) */
  private redact(p: string): string {
    return p
      .replace(this.projectRoot, '[PROJECT_ROOT]')
      .replace(this.appDataPath, '[APPDATA]')
      .replace(/C:\\Users\\[^\\]+/g, '[USER]');
  }

  /** Log current configuration to console */
  public logConfiguration() {
    console.log('\n' + '═'.repeat(80));
    console.log('📁 LUMI PATH CONFIGURATION');
    console.log('═'.repeat(80));
    console.log('');
    console.log('PROJECT DATA (local; repo in dev, AppData in packaged builds):');
    console.log(`  📚 Knowledge:      ${this.redact(this.knowledgeBase)}`);
    console.log(`  📝 Staging:        ${this.redact(this.stagingFile)}`);
    console.log(`  📦 Archives:       ${this.redact(this.archivesDir)}/`);
    console.log(`  📘 UserData KB:    ${this.redact(this.userDataKnowledgeBase)}`);
    console.log(`  💾 Backups:        ${this.redact(this.backupsDir)}/`);
    console.log(`  📋 Training log:   ${this.redact(this.trainingLog)}`);
    console.log('');
    console.log('USER DATA (AppData, private, NOT tracked):');
    console.log(`  💬 Conversations:  ${this.redact(this.memoryFile)}`);
    console.log(`  ⚙️  Config:         ${this.redact(this.configFile)}`);
    console.log(`  📊 Progress:       ${this.redact(this.progressFile)}`);
    console.log('');
    console.log('═'.repeat(80) + '\n');
  }

  /**
   * Get the correct path for a specific data type
   */
  public getPath(type: string): string {
    switch (type) {
      case 'knowledge': return this.knowledgeBase;
      case 'staging': return this.stagingFile;
      case 'archives': return this.archivesDir;
      case 'userDataKnowledge': return this.userDataKnowledgeBase;
      case 'backups': return this.backupsDir;
      case 'training': return this.trainingDir;
      case 'memory': return this.memoryFile;
      case 'config': return this.configFile;
      case 'progress': return this.progressFile;
      default: return this.projectRoot;
    }
  }
}

// ════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ════════════════════════════════════════════════════════════════

let _paths: LumiPaths | null = null;

export function getLumiPaths(): LumiPaths {
  if (!_paths) {
    _paths = new LumiPaths();
    _paths.logConfiguration();
  }
  return _paths;
}

export default getLumiPaths;
