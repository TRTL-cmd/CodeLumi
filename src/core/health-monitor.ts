// Health check system for Lumi
// Monitors KB, staging, suggestions, and disk space

import * as fs from 'fs';
import * as path from 'path';
import { logger } from './lumi-logger';
import { getLumiPaths } from './paths';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  components: {
    knowledgeBase: ComponentHealth;
    staging: ComponentHealth;
    suggestions: ComponentHealth;
    disk: ComponentHealth;
    memory: ComponentHealth;
  };
  metrics: {
    kbEntries: number;
    stagingItems: number;
    suggestionCount: number;
    learningRate: number; // entries/hour
    threatScore: number; // average
  };
}

interface ComponentHealth {
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class HealthMonitor {
  private lumiPaths = getLumiPaths();
  private kbFile = this.lumiPaths.knowledgeBase;
  private stagingFile = this.lumiPaths.stagingFile;
  private suggestionsFile = this.lumiPaths.stagingFile;
  private validationLog = path.join(this.lumiPaths.projectUserDataDir, 'security', 'validation.jsonl');

  async check(): Promise<HealthStatus> {
    const components = {
      knowledgeBase: await this.checkKB(),
      staging: await this.checkStaging(),
      suggestions: await this.checkSuggestions(),
      disk: await this.checkDisk(),
      memory: this.checkMemory()
    };

    const metrics = await this.collectMetrics();

    // Overall status: critical if any component is error, degraded if any warning
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    for (const comp of Object.values(components)) {
      if (comp.status === 'error') status = 'critical';
      else if (comp.status === 'warning' && status === 'healthy') status = 'degraded';
    }

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      components,
      metrics
    };

    // Log health status
    if (status === 'critical') {
      logger.error('HealthMonitor', 'System is in critical state', health);
    } else if (status === 'degraded') {
      logger.warn('HealthMonitor', 'System is degraded', health);
    }

    return health;
  }

  private async checkKB(): Promise<ComponentHealth> {
    try {
      const stats = await fs.promises.stat(this.kbFile);
      const content = await fs.promises.readFile(this.kbFile, 'utf8');
      const kb = JSON.parse(content);

      if (!Array.isArray(kb)) {
        return {
          status: 'error',
          message: 'KB is not an array'
        };
      }

      const entries = kb.length;
      const sizeMB = stats.size / (1024 * 1024);

      // Warnings
      if (entries === 0) {
        return {
          status: 'warning',
          message: 'KB is empty',
          details: { entries: 0, sizeMB }
        };
      }

      if (sizeMB > 50) {
        return {
          status: 'warning',
          message: 'KB file is large (>50MB)',
          details: { entries, sizeMB }
        };
      }

      return {
        status: 'ok',
        message: `${entries} entries, ${sizeMB.toFixed(2)}MB`,
        details: { entries, sizeMB }
      };

    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : 'KB check failed'
      };
    }
  }

  private async checkStaging(): Promise<ComponentHealth> {
    try {
      const exists = await fs.promises.access(this.stagingFile).then(() => true).catch(() => false);
      if (!exists) {
        return {
          status: 'ok',
          message: 'No staging items',
          details: { items: 0 }
        };
      }

      const content = await fs.promises.readFile(this.stagingFile, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      const items = lines.length;

      if (items > 100) {
        return {
          status: 'warning',
          message: `${items} items in staging (review backlog)`,
          details: { items }
        };
      }

      return {
        status: 'ok',
        message: `${items} items in staging`,
        details: { items }
      };

    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : 'Staging check failed'
      };
    }
  }

  private async checkSuggestions(): Promise<ComponentHealth> {
    try {
      const exists = await fs.promises.access(this.suggestionsFile).then(() => true).catch(() => false);
      if (!exists) {
        return {
          status: 'ok',
          message: 'No suggestions',
          details: { count: 0 }
        };
      }

      const content = await fs.promises.readFile(this.suggestionsFile, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      const count = lines.length;

      // Parse and count by severity
      const severityCounts = { high: 0, medium: 0, low: 0, info: 0 };
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          const severity = obj.severity || 'info';
          if (severity in severityCounts) {
            severityCounts[severity as keyof typeof severityCounts]++;
          }
        } catch (e) { /* skip malformed */ }
      }

      if (severityCounts.high > 10) {
        return {
          status: 'warning',
          message: `${severityCounts.high} high-priority suggestions pending`,
          details: { count, ...severityCounts }
        };
      }

      return {
        status: 'ok',
        message: `${count} suggestions`,
        details: { count, ...severityCounts }
      };

    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : 'Suggestions check failed'
      };
    }
  }

  private async checkDisk(): Promise<ComponentHealth> {
    try {
      // Check available disk space (platform-specific)
      const userDataDir = path.join(process.cwd(), 'userData');
      const stats = await fs.promises.statfs(userDataDir);
      const availableGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);

      if (availableGB < 0.5) {
        return {
          status: 'error',
          message: `Critical: only ${availableGB.toFixed(2)}GB available`,
          details: { availableGB }
        };
      }

      if (availableGB < 2) {
        return {
          status: 'warning',
          message: `Low disk space: ${availableGB.toFixed(2)}GB available`,
          details: { availableGB }
        };
      }

      return {
        status: 'ok',
        message: `${availableGB.toFixed(2)}GB available`,
        details: { availableGB }
      };

    } catch (e) {
      // statfs not available on all platforms
      return {
        status: 'ok',
        message: 'Disk check unavailable on this platform'
      };
    }
  }

  private checkMemory(): ComponentHealth {
    try {
      const used = process.memoryUsage();
      const heapUsedMB = used.heapUsed / (1024 * 1024);
      const heapTotalMB = used.heapTotal / (1024 * 1024);
      const rssMB = used.rss / (1024 * 1024);

      if (rssMB > 1024) {
        return {
          status: 'warning',
          message: `High memory usage: ${rssMB.toFixed(0)}MB`,
          details: { heapUsedMB, heapTotalMB, rssMB }
        };
      }

      return {
        status: 'ok',
        message: `${rssMB.toFixed(0)}MB RSS`,
        details: { heapUsedMB, heapTotalMB, rssMB }
      };

    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : 'Memory check failed'
      };
    }
  }

  private async collectMetrics() {
    const metrics = {
      kbEntries: 0,
      stagingItems: 0,
      suggestionCount: 0,
      learningRate: 0,
      threatScore: 0
    };

    // KB entries
    try {
      const kb = JSON.parse(await fs.promises.readFile(this.kbFile, 'utf8'));
      metrics.kbEntries = Array.isArray(kb) ? kb.length : 0;
    } catch (e) { /* ignore */ }

    // Staging items
    try {
      const content = await fs.promises.readFile(this.stagingFile, 'utf8');
      metrics.stagingItems = content.trim().split('\n').filter(l => l.trim()).length;
    } catch (e) { /* ignore */ }

    // Suggestions
    try {
      const content = await fs.promises.readFile(this.suggestionsFile, 'utf8');
      metrics.suggestionCount = content.trim().split('\n').filter(l => l.trim()).length;
    } catch (e) { /* ignore */ }

    // Learning rate (entries added in last hour)
    try {
      const kb = JSON.parse(await fs.promises.readFile(this.kbFile, 'utf8'));
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recent = kb.filter((entry: any) => {
        const date = entry.date || entry.timestamp;
        return date && new Date(date).getTime() > oneHourAgo;
      });
      metrics.learningRate = recent.length;
    } catch (e) { /* ignore */ }

    // Average threat score from validation log
    try {
      const content = await fs.promises.readFile(this.validationLog, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim()).slice(-100); // last 100
      const scores = lines.map(line => {
        try {
          const obj = JSON.parse(line);
          return obj.threat_score || 0;
        } catch (e) {
          return 0;
        }
      });
      metrics.threatScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
    } catch (e) { /* ignore */ }

    return metrics;
  }

  // Continuous monitoring - call this from main process
  async startMonitoring(intervalMs = 5 * 60 * 1000) {
    logger.info('HealthMonitor', 'Started monitoring', { intervalMs });
    
    setInterval(async () => {
      const health = await this.check();
      
      if (health.status !== 'healthy') {
        logger.warn('HealthMonitor', 'Health check', health);
      }
    }, intervalMs);
  }
}

// Singleton
export const healthMonitor = new HealthMonitor();

// Usage:
// const health = await healthMonitor.check();
// healthMonitor.startMonitoring(5 * 60 * 1000); // check every 5 minutes
