// Automated backup system for Lumi
// Creates timestamped backups and manages retention

import * as fs from 'fs';
import * as path from 'path';
import { logger } from './lumi-logger';
import { getLumiPaths, LumiPaths } from './paths';

interface BackupConfig {
  maxBackups: number;
  intervalHours: number;
  compression?: boolean;
}

interface BackupResult {
  success: boolean;
  backupPath?: string;
  error?: string;
  timestamp: string;
  sizeMB: number;
}

export class BackupManager {
  private backupDir: string;
  private config: BackupConfig = {
    maxBackups: 10,
    intervalHours: 24,
    compression: false // TODO: add gzip support
  };

  private sources: Record<string, string>;

  constructor(config?: Partial<BackupConfig>, paths?: LumiPaths) {
    const lumiPaths = paths || getLumiPaths();

    this.backupDir = lumiPaths.backupsDir;
    this.sources = {
      knowledgeBase: lumiPaths.knowledgeBase,
      trainingLog: lumiPaths.trainingLog,
      staging: lumiPaths.stagingFile,
      suggestions: lumiPaths.stagingFile, // Same as staging
      seenCache: path.join(lumiPaths.trainingDir, 'selflearn_seen.json')
    };

    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.init();
  }

  private init() {
    try {
      fs.mkdirSync(this.backupDir, { recursive: true });
    } catch (e) {
      logger.error('BackupManager', 'Failed to create backup directory', e);
    }
  }

  async backupAll(): Promise<BackupResult[]> {
    const results: BackupResult[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const [name, sourcePath] of Object.entries(this.sources)) {
      const result = await this.backupFile(name, sourcePath, timestamp);
      results.push(result);
    }

    // Clean old backups after creating new ones
    await this.cleanOldBackups();

    return results;
  }

  private async backupFile(
    name: string, 
    sourcePath: string, 
    timestamp: string
  ): Promise<BackupResult> {
    try {
      // Check if source exists
      const exists = await fs.promises.access(sourcePath).then(() => true).catch(() => false);
      if (!exists) {
        return {
          success: false,
          error: 'Source file does not exist',
          timestamp,
          sizeMB: 0
        };
      }

      // Get source size
      const stats = await fs.promises.stat(sourcePath);
      const sizeMB = stats.size / (1024 * 1024);

      // Skip if file is too large (>100MB)
      if (sizeMB > 100) {
        logger.warn('BackupManager', `Skipping ${name}: file too large`, { sizeMB });
        return {
          success: false,
          error: 'File too large for backup (>100MB)',
          timestamp,
          sizeMB
        };
      }

      // Create backup
      const backupName = `${name}_${timestamp}${path.extname(sourcePath)}`;
      const backupPath = path.join(this.backupDir, backupName);

      await fs.promises.copyFile(sourcePath, backupPath);

      logger.info('BackupManager', `Backed up ${name}`, { 
        backupPath, 
        sizeMB: sizeMB.toFixed(2) 
      });

      return {
        success: true,
        backupPath,
        timestamp,
        sizeMB
      };

    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      logger.error('BackupManager', `Failed to backup ${name}`, e);
      return {
        success: false,
        error,
        timestamp,
        sizeMB: 0
      };
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      
      // Group backups by source name
      const backupGroups = new Map<string, Array<{ name: string; time: number }>>();

      for (const file of files) {
        // Extract source name from filename (before timestamp)
        const match = file.match(/^(.+?)_(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const [, sourceName, dateStr] = match;
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.promises.stat(filePath);
          
          if (!backupGroups.has(sourceName)) {
            backupGroups.set(sourceName, []);
          }
          
          backupGroups.get(sourceName)!.push({
            name: file,
            time: stats.mtimeMs
          });
        }
      }

      // For each source, keep only maxBackups newest backups
      for (const [sourceName, backups] of backupGroups) {
        // Sort by time (newest first)
        backups.sort((a, b) => b.time - a.time);

        // Delete backups beyond maxBackups
        const toDelete = backups.slice(this.config.maxBackups);
        for (const backup of toDelete) {
          const filePath = path.join(this.backupDir, backup.name);
          await fs.promises.unlink(filePath);
          logger.info('BackupManager', `Deleted old backup: ${backup.name}`);
        }
      }

    } catch (e) {
      logger.error('BackupManager', 'Failed to clean old backups', e);
    }
  }

  async restore(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify backup exists
      const exists = await fs.promises.access(backupPath).then(() => true).catch(() => false);
      if (!exists) {
        return { success: false, error: 'Backup file not found' };
      }

      // Extract source name from backup filename
      const fileName = path.basename(backupPath);
      const match = fileName.match(/^(.+?)_\d{4}-\d{2}-\d{2}/);
      if (!match) {
        return { success: false, error: 'Invalid backup filename format' };
      }

      const sourceName = match[1];
      const sourcePath = this.sources[sourceName as keyof typeof this.sources];
      if (!sourcePath) {
        return { success: false, error: `Unknown source: ${sourceName}` };
      }

      // Create backup of current file before restoring
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const preRestoreBackup = `${sourceName}_pre-restore_${timestamp}${path.extname(sourcePath)}`;
      const preRestoreBackupPath = path.join(this.backupDir, preRestoreBackup);
      
      try {
        await fs.promises.copyFile(sourcePath, preRestoreBackupPath);
        logger.info('BackupManager', 'Created pre-restore backup', { preRestoreBackupPath });
      } catch (e) {
        // Original file might not exist - OK
      }

      // Restore from backup
      await fs.promises.copyFile(backupPath, sourcePath);
      
      logger.info('BackupManager', `Restored ${sourceName} from backup`, { 
        backupPath,
        sourcePath
      });

      return { success: true };

    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      logger.error('BackupManager', 'Failed to restore backup', e);
      return { success: false, error };
    }
  }

  async listBackups(): Promise<Array<{
    name: string;
    source: string;
    timestamp: string;
    sizeMB: number;
    path: string;
  }>> {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      const backups = [] as any[];

      for (const file of files) {
        const match = file.match(/^(.+?)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        if (match) {
          const [, source, timestamp] = match;
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.promises.stat(filePath);
          
          backups.push({
            name: file,
            source,
            timestamp: timestamp.replace(/-/g, ':').replace('T', ' '),
            sizeMB: stats.size / (1024 * 1024),
            path: filePath
          });
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      return backups;

    } catch (e) {
      logger.error('BackupManager', 'Failed to list backups', e);
      return [];
    }
  }

  // Start automatic backups
  async startAutoBackup() {
    const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
    
    logger.info('BackupManager', 'Started automatic backups', { 
      intervalHours: this.config.intervalHours,
      maxBackups: this.config.maxBackups
    });

    // Do initial backup
    await this.backupAll();

    // Schedule periodic backups
    setInterval(async () => {
      logger.info('BackupManager', 'Running scheduled backup');
      const results = await this.backupAll();
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        logger.warn('BackupManager', 'Some backups failed', { failed });
      }
    }, intervalMs);
  }

  // Emergency backup (call before risky operations)
  async emergencyBackup(reason: string): Promise<BackupResult[]> {
    logger.warn('BackupManager', `Emergency backup triggered: ${reason}`);
    const results = await this.backupAll();
    return results;
  }
}

// Singleton
export const backupManager = new BackupManager();

// Usage:
// await backupManager.backupAll();
// await backupManager.restore('/path/to/backup.json');
// await backupManager.startAutoBackup();
// const backups = await backupManager.listBackups();
