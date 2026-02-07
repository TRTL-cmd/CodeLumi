// Production-grade logging for Lumi
// Drop-in replacement for console.log with file persistence

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

class LumiLogger {
  private logDir: string;
  private logFile: string;
  private errorFile: string;
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private consoleEnabled = true;

  constructor(logDir: string = path.join(process.cwd(), 'userData', 'logs')) {
    this.logDir = logDir;
    this.logFile = path.join(logDir, 'lumi.log');
    this.errorFile = path.join(logDir, 'errors.log');
    this.init();
  }

  private init() {
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
    } catch (e) {
      console.error('[Logger] Failed to create log directory:', e);
    }
  }

  private async rotate(file: string) {
    try {
      const stats = await fs.promises.stat(file);
      if (stats.size > this.maxFileSize) {
        const backup = `${file}.${Date.now()}.backup`;
        await fs.promises.rename(file, backup);
        
        // Keep only last 5 backups
        const dir = path.dirname(file);
        const base = path.basename(file);
        const files = await fs.promises.readdir(dir);
        const backups = files
          .filter(f => f.startsWith(base) && f.endsWith('.backup'))
          .sort()
          .reverse();
        
        for (const old of backups.slice(5)) {
          await fs.promises.unlink(path.join(dir, old));
        }
      }
    } catch (e) {
      // File doesn't exist or can't stat - ignore
    }
  }

  private async write(entry: LogEntry) {
    const line = JSON.stringify(entry) + '\n';
    
    try {
      // Rotate if needed
      await this.rotate(this.logFile);
      if (entry.level === 'error') {
        await this.rotate(this.errorFile);
      }

      // Append to main log
      await fs.promises.appendFile(this.logFile, line, 'utf8');
      
      // Also append errors to error log
      if (entry.level === 'error') {
        await fs.promises.appendFile(this.errorFile, line, 'utf8');
      }
    } catch (e) {
      // Fallback to console if file write fails
      if (this.consoleEnabled) {
        console.error('[Logger] Write failed:', e);
      }
    }

    // Also log to console if enabled
    if (this.consoleEnabled) {
      const prefix = `[${entry.level.toUpperCase()}] [${entry.component}]`;
      const method = entry.level === 'error' ? console.error : console.log;
      if (entry.data) {
        method(prefix, entry.message, entry.data);
      } else {
        method(prefix, entry.message);
      }
    }
  }

  debug(component: string, message: string, data?: any) {
    this.write({ 
      timestamp: new Date().toISOString(),
      level: 'debug',
      component,
      message,
      data
    });
  }

  info(component: string, message: string, data?: any) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'info',
      component,
      message,
      data
    });
  }

  warn(component: string, message: string, data?: any) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'warn',
      component,
      message,
      data
    });
  }

  error(component: string, message: string, error?: any) {
    const data = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    this.write({
      timestamp: new Date().toISOString(),
      level: 'error',
      component,
      message,
      data
    });
  }

  // Disable console output (useful for tests)
  setConsoleEnabled(enabled: boolean) {
    this.consoleEnabled = enabled;
  }

  // Get recent logs
  async getRecentLogs(limit = 100): Promise<LogEntry[]> {
    try {
      const content = await fs.promises.readFile(this.logFile, 'utf8');
      const lines = content.trim().split('\n').slice(-limit);
      return lines.map(line => JSON.parse(line));
    } catch (e) {
      return [];
    }
  }

  // Get error logs
  async getErrors(limit = 50): Promise<LogEntry[]> {
    try {
      const content = await fs.promises.readFile(this.errorFile, 'utf8');
      const lines = content.trim().split('\n').slice(-limit);
      return lines.map(line => JSON.parse(line));
    } catch (e) {
      return [];
    }
  }

  // Clear logs (useful for fresh start)
  async clear() {
    try {
      await fs.promises.unlink(this.logFile);
      await fs.promises.unlink(this.errorFile);
    } catch (e) {
      // Files don't exist - OK
    }
  }
}

// Singleton instance
export const logger = new LumiLogger();

// Export class for custom instances
export default LumiLogger;

// Usage examples:
// logger.info('KnowledgeBase', 'Entry added', { id: 123 });
// logger.error('SignalProcessor', 'Failed to process', error);
// logger.warn('Staging', 'Duplicate detected', { count: 5 });
// logger.debug('Main', 'Window created', { id: mainWindow.id });
