(async ()=>{
  try{
    const path = require('path');
    const fs = require('fs');
    const root = process.cwd();
    const modulePath = path.join(root, 'dist', 'core', 'brain', 'brain-rag-integration.js');
    if(!fs.existsSync(modulePath)){
      console.error('Compiled module not found:', modulePath);
      process.exit(2);
    }
    const mod = await import('file://' + modulePath);
    if(!mod){ console.error('Import failed'); process.exit(2); }
    console.log('Imported brain-rag-integration');
    const userData = path.join(root, 'tmp', 'headless_userData');
    fs.mkdirSync(userData, { recursive: true });
    if(typeof mod.initializeRAG === 'function'){
      console.log('Calling initializeRAG...');
      try{
        const res = await mod.initializeRAG(userData);
        console.log('initializeRAG result:', res && typeof res === 'object' ? JSON.stringify(res) : String(res));
      }catch(e){ console.warn('initializeRAG threw:', e && e.message ? e.message : e);
      }
    }
    if(typeof mod.getRAGStats === 'function'){
      const stats = await mod.getRAGStats();
      console.log('getRAGStats:', JSON.stringify(stats));
    }
    // Check global lumiRAG personality getter
    try{
      const g = global.lumiRAG || global.lumiRAG;
      if(g && typeof g.getPersonality === 'function'){
        const p = g.getPersonality();
        console.log('Personality class:', typeof p);
        if(p && typeof p.getStats === 'function'){
          console.log('Initial personality stats:', p.getStats());
          // record positive
          if(typeof p.recordPositive === 'function'){
            p.recordPositive(0.2);
            console.log('After recordPositive:', p.getStats());
          }
          if(typeof p.recordNegative === 'function'){
            p.recordNegative(0.15);
            console.log('After recordNegative:', p.getStats());
          }
        }
      } else {
        console.log('global.lumiRAG.getPersonality not available; trying module exposure');
        if(mod && typeof mod.getRAGStats === 'function'){
          const r = await mod.getRAGStats(); console.log('module getRAGStats:', r);
        }
      }
    }catch(e){ console.warn('personality test failed', e); }
    process.exit(0);
  }catch(err){ console.error('Test failed', err); process.exit(3); }
})();
