// Integration snippet: Replace the existing SelfLearningAgent instantiation
// with DeepLearningAgent. Copy this into `src/main.ts` where the agent
// is created.

import DeepLearningAgent from '../src/selflearning/safe-agent-deep';

// Replace the old instantiation with something like:
const agent = new DeepLearningAgent({
  userDataPath: app.getPath('userData'),
  watchPaths: [process.cwd()],
  deepMode: true,
  readFullFile: true,
  deepExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'release', 'vendor'],
  progressTracking: true,
  intervalMs: 60_000,
  ratePerMinute: 6
});
(global as any).lumiSelfAgent = agent;
agent.start((payload: any) => {
  const bw = BrowserWindow.getAllWindows()[0];
  if (bw && bw.webContents) bw.webContents.send('lumi-learning-event', payload);
});
