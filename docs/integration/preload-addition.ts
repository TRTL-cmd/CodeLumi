// Preload addition snippet: add progress API to the `lumi` object in `src/preload.ts`

// inside contextBridge.exposeInMainWorld('lumi', { ... }) add:
// Self-learn controls (add this alongside existing methods)
getProgress: async () => ipcRenderer.invoke('selflearn:getProgress'),

// Optionally listen for progress events from main:
// onProgress: (cb: (p: any) => void) => ipcRenderer.on('selflearn-progress', (_e, p) => cb(p)),
